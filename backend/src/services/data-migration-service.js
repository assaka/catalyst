/**
 * Data Migration Service
 * Handles actual data transfer from Catalyst DB to store owner's Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const ConnectionManager = require('./database/ConnectionManager');
const { MIGRATION_TYPES, validateMigrationOrder } = require('../config/migration-types');

class DataMigrationService {
  constructor() {
    this.batchSize = 100; // Process in batches to avoid memory issues
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Get Supabase client for store
   */
  async getSupabaseClient(storeId) {
    try {
      // Get tenant DB connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Query store_supabase_connections table from tenant DB
      const { data: connection, error } = await tenantDb
        .from('store_supabase_connections')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch Supabase connection: ${error.message}`);
      }

      if (!connection) {
        throw new Error('No active Supabase connection found for store');
      }

      const client = createClient(
        connection.project_url,
        connection.decrypted_service_key // This should decrypt the stored key
      );

      return { client, connection };
    } catch (error) {
      console.error('Supabase client error:', error);
      throw error;
    }
  }

  /**
   * Create table schema in target Supabase
   */
  async createTableSchema(supabaseClient, tableName, storeId) {
    try {
      console.log(`📋 Creating schema for table: ${tableName}`);

      // Get tenant DB connection for source database
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Get table structure from source database using raw SQL
      // Note: Supabase client doesn't support information_schema queries directly,
      // so we need to use rpc or raw connection
      const { data: columns, error: columnsError } = await tenantDb.rpc('exec_sql', {
        sql: `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_name = '${tableName}'
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

      if (columnsError) {
        throw new Error(`Failed to get table schema: ${columnsError.message}`);
      }

      if (!columns || columns.length === 0) {
        throw new Error(`Table ${tableName} not found in source database`);
      }

      // Build CREATE TABLE statement
      let createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
      
      const columnDefinitions = columns.map(col => {
        let definition = `${col.column_name} ${this.mapDataType(col.data_type, col.character_maximum_length)}`;
        
        if (col.is_nullable === 'NO') {
          definition += ' NOT NULL';
        }
        
        if (col.column_default) {
          definition += ` DEFAULT ${col.column_default}`;
        }
        
        return definition;
      });

      createTableSQL += columnDefinitions.join(', ');
      
      // Add primary key if id column exists
      if (columns.some(col => col.column_name === 'id')) {
        createTableSQL += ', PRIMARY KEY (id)';
      }
      
      createTableSQL += ');';

      // Execute schema creation
      const { error } = await supabaseClient.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (error) {
        throw error;
      }

      console.log(`✅ Schema created for table: ${tableName}`);
      return true;
    } catch (error) {
      console.error(`❌ Schema creation failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Map PostgreSQL data types to Supabase equivalents
   */
  mapDataType(dataType, maxLength) {
    const typeMap = {
      'character varying': maxLength ? `varchar(${maxLength})` : 'varchar',
      'text': 'text',
      'integer': 'integer',
      'bigint': 'bigint',
      'boolean': 'boolean',
      'timestamp with time zone': 'timestamptz',
      'timestamp without time zone': 'timestamp',
      'date': 'date',
      'uuid': 'uuid',
      'json': 'json',
      'jsonb': 'jsonb',
      'numeric': 'numeric',
      'real': 'real',
      'double precision': 'double precision'
    };

    return typeMap[dataType.toLowerCase()] || dataType;
  }

  /**
   * Migrate data for a specific table
   */
  async migrateTable(tableName, storeId, supabaseClient, progressCallback) {
    try {
      console.log(`🔄 Starting migration for table: ${tableName}`);

      // Get tenant DB connection for source database
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Get total record count using Supabase client
      const { count, error: countError } = await tenantDb
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

      if (countError) {
        throw new Error(`Failed to count records: ${countError.message}`);
      }

      const totalRecords = count || 0;

      if (totalRecords === 0) {
        console.log(`ℹ️ No records found for ${tableName}`);
        return { success: true, migrated: 0, total: 0 };
      }

      console.log(`📊 Found ${totalRecords} records in ${tableName}`);

      // Create table schema in target Supabase
      await this.createTableSchema(supabaseClient, tableName, storeId);

      let migratedCount = 0;
      let offset = 0;

      // Process in batches
      while (offset < totalRecords) {
        // Fetch batch data from tenant DB
        const { data: batchData, error: batchError } = await tenantDb
          .from(tableName)
          .select('*')
          .eq('store_id', storeId)
          .range(offset, offset + this.batchSize - 1);

        if (batchError) {
          throw new Error(`Failed to fetch batch: ${batchError.message}`);
        }

        if (!batchData || batchData.length === 0) break;

        // Insert batch into Supabase
        const { error } = await supabaseClient
          .from(tableName)
          .insert(batchData);

        if (error) {
          throw new Error(`Batch insert failed: ${error.message}`);
        }

        migratedCount += batchData.length;
        offset += this.batchSize;

        // Report progress
        const progress = Math.round((migratedCount / totalRecords) * 100);
        progressCallback?.({
          table: tableName,
          migrated: migratedCount,
          total: totalRecords,
          progress
        });

        console.log(`📈 ${tableName}: ${migratedCount}/${totalRecords} (${progress}%)`);
      }

      return { 
        success: true, 
        migrated: migratedCount, 
        total: totalRecords 
      };

    } catch (error) {
      console.error(`❌ Migration failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Migrate a specific data type (catalog, sales, etc.)
   */
  async migrateMigrationType(storeId, migrationType, progressCallback) {
    try {
      console.log(`🚀 Starting migration for type: ${migrationType}`);

      const migrationConfig = MIGRATION_TYPES[migrationType];
      if (!migrationConfig) {
        throw new Error(`Unknown migration type: ${migrationType}`);
      }

      const { client: supabaseClient } = await this.getSupabaseClient(storeId);
      
      const results = {
        type: migrationType,
        tables: {},
        totalMigrated: 0,
        startTime: new Date(),
        status: 'in_progress'
      };

      // Migrate each table in the type
      for (const tableName of migrationConfig.tables) {
        try {
          const tableResult = await this.migrateTable(
            tableName, 
            storeId, 
            supabaseClient,
            (progress) => {
              progressCallback?.({
                migrationType,
                tableName,
                ...progress
              });
            }
          );

          results.tables[tableName] = tableResult;
          results.totalMigrated += tableResult.migrated;

        } catch (tableError) {
          console.error(`Table migration error for ${tableName}:`, tableError);
          results.tables[tableName] = {
            success: false,
            error: tableError.message,
            migrated: 0,
            total: 0
          };
        }
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;
      results.status = 'completed';

      console.log(`✅ Migration completed for ${migrationType}: ${results.totalMigrated} total records`);
      
      return results;

    } catch (error) {
      console.error(`❌ Migration type failed for ${migrationType}:`, error);
      throw error;
    }
  }

  /**
   * Migrate all data types for a store
   */
  async migrateAllData(storeId, migrationTypes = null, progressCallback) {
    try {
      console.log(`🎯 Starting full data migration for store: ${storeId}`);

      // Use provided types or migrate all critical types
      const typesToMigrate = migrationTypes || Object.keys(MIGRATION_TYPES);
      
      // Validate migration order
      const validation = validateMigrationOrder(typesToMigrate);
      if (!validation.valid) {
        throw new Error(`Migration order validation failed: ${validation.errors.join(', ')}`);
      }

      const fullResults = {
        storeId,
        migrationTypes: typesToMigrate,
        results: {},
        totalMigrated: 0,
        startTime: new Date(),
        status: 'in_progress'
      };

      // Migrate each type in order
      for (const migrationType of typesToMigrate) {
        try {
          const typeResult = await this.migrateMigrationType(
            storeId, 
            migrationType,
            progressCallback
          );

          fullResults.results[migrationType] = typeResult;
          fullResults.totalMigrated += typeResult.totalMigrated;

        } catch (typeError) {
          console.error(`Migration type error for ${migrationType}:`, typeError);
          fullResults.results[migrationType] = {
            type: migrationType,
            status: 'failed',
            error: typeError.message,
            totalMigrated: 0
          };
        }
      }

      fullResults.endTime = new Date();
      fullResults.duration = fullResults.endTime - fullResults.startTime;
      fullResults.status = 'completed';

      console.log(`🎉 Full migration completed for store ${storeId}: ${fullResults.totalMigrated} total records`);
      
      return fullResults;

    } catch (error) {
      console.error(`❌ Full migration failed for store ${storeId}:`, error);
      throw error;
    }
  }

  /**
   * Verify migrated data integrity
   */
  async verifyMigration(storeId, migrationType) {
    try {
      console.log(`🔍 Verifying migration for ${migrationType}`);

      // Get tenant DB connection for source database
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      const { client: supabaseClient } = await this.getSupabaseClient(storeId);
      const migrationConfig = MIGRATION_TYPES[migrationType];

      const verification = {
        type: migrationType,
        tables: {},
        isValid: true,
        issues: []
      };

      for (const tableName of migrationConfig.tables) {
        // Count records in source using Supabase client
        const { count: sourceCount, error: sourceError } = await tenantDb
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);

        if (sourceError) {
          console.error(`Error counting source records for ${tableName}:`, sourceError);
          verification.tables[tableName] = {
            source: 0,
            target: 0,
            match: false,
            error: sourceError.message
          };
          verification.isValid = false;
          continue;
        }

        // Count records in target
        const { count: targetCount, error } = await supabaseClient
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);

        if (error) {
          verification.tables[tableName] = {
            source: sourceCount || 0,
            target: 0,
            match: false,
            error: error.message
          };
          verification.isValid = false;
          continue;
        }

        const sourceTotal = sourceCount || 0;
        const targetTotal = targetCount || 0;
        const match = sourceTotal === targetTotal;

        verification.tables[tableName] = {
          source: sourceTotal,
          target: targetTotal,
          match
        };

        if (!match) {
          verification.isValid = false;
          verification.issues.push(`${tableName}: source=${sourceTotal}, target=${targetTotal}`);
        }
      }

      console.log(`${verification.isValid ? '✅' : '❌'} Verification completed for ${migrationType}`);
      
      return verification;

    } catch (error) {
      console.error(`❌ Verification failed for ${migrationType}:`, error);
      throw error;
    }
  }
}

module.exports = DataMigrationService;