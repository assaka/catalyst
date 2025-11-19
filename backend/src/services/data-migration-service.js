/**
 * Data Migration Service
 * Handles actual data transfer from Catalyst DB to store owner's Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const { sequelize } = require('../database/connection');
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
      const { StoreSupabaseConnection } = require('../models'); // Tenant DB model
      
      const connection = await StoreSupabaseConnection.findOne({
        where: { store_id: storeId, is_active: true }
      });

      if (!connection) {
        throw new Error('No active Supabase connection found for store');
      }

      const client = createClient(
        connection.project_url,
        connection.decryptedServiceKey // This should decrypt the stored key
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

      // Get table structure from source database
      const [columns] = await sequelize.query(`
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
      `);

      if (columns.length === 0) {
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

      // Get total record count
      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) as total FROM ${tableName} WHERE store_id = :storeId`,
        { replacements: { storeId } }
      );
      const totalRecords = parseInt(countResult[0].total);

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
        const [batchData] = await sequelize.query(
          `SELECT * FROM ${tableName} WHERE store_id = :storeId LIMIT :batchSize OFFSET :offset`,
          { 
            replacements: { storeId, batchSize: this.batchSize, offset }
          }
        );

        if (batchData.length === 0) break;

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

      const { client: supabaseClient } = await this.getSupabaseClient(storeId);
      const migrationConfig = MIGRATION_TYPES[migrationType];
      
      const verification = {
        type: migrationType,
        tables: {},
        isValid: true,
        issues: []
      };

      for (const tableName of migrationConfig.tables) {
        // Count records in source
        const [sourceCount] = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${tableName} WHERE store_id = :storeId`,
          { replacements: { storeId } }
        );

        // Count records in target
        const { data: targetData, error } = await supabaseClient
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);

        if (error) {
          verification.tables[tableName] = {
            source: sourceCount[0].count,
            target: 0,
            match: false,
            error: error.message
          };
          verification.isValid = false;
          continue;
        }

        const sourceTotal = parseInt(sourceCount[0].count);
        const targetTotal = targetData?.length || 0;
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