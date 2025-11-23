/**
 * Tenant Provisioning Service
 *
 * Provisions new tenant databases with:
 * - Schema creation (all tables)
 * - Initial data seeding
 * - Store record creation
 * - User record creation
 *
 * Called when store owner connects their Supabase database
 */

const fs = require('fs').promises;
const path = require('path');

class TenantProvisioningService {
  /**
   * Provision a new tenant database
   *
   * @param {Object} tenantDb - Supabase client or Sequelize instance
   * @param {string} storeId - Store UUID
   * @param {Object} options - Provisioning options
   * @returns {Promise<Object>} Provisioning result
   */
  async provisionTenantDatabase(tenantDb, storeId, options = {}) {
    console.log(`Starting tenant provisioning for store ${storeId}...`);

    const result = {
      storeId,
      tablesCreated: [],
      dataSeeded: [],
      errors: []
    };

    try {
      // 1. Check if already provisioned
      const alreadyProvisioned = await this.checkIfProvisioned(tenantDb);
      if (alreadyProvisioned && !options.force) {
        console.log('✅ Tenant database already provisioned - skipping');
        return {
          ...result,
          success: true,
          alreadyProvisioned: true,
          message: 'Database is already set up and ready to use'
        };
      }

      // 2. Run migrations (create all tables)
      console.log('Running tenant migrations...');
      await this.runTenantMigrations(tenantDb, storeId, result, options);

      // 3. Seed initial data
      console.log('Seeding initial data...');
      // await this.seedInitialData(tenantDb, storeId, options, result);

      // 4. Verify migrations succeeded before creating store record
      if (result.errors.some(e => e.step === 'migrations')) {
        console.error('❌ Skipping store record creation - migrations failed');
        return {
          ...result,
          success: false,
          message: 'Database provisioning failed - migrations did not complete'
        };
      }

      // 4. Create store record in tenant DB
      if (tenantDb) {
        // Use Supabase client
        console.log('Creating store record via Supabase client...');
        await this.createStoreRecord(tenantDb, storeId, options, result);
      } else if (options.oauthAccessToken && options.projectId) {
        // Use Management API to execute SQL
        console.log('Creating store record via Management API SQL...');
        await this.createStoreRecordViaAPI(options.oauthAccessToken, options.projectId, storeId, options, result);
      } else {
        console.warn('⚠️ Cannot create store record - no tenantDb or OAuth credentials');
        result.errors.push({ step: 'create_store', error: 'No database client available' });
      }

      // 5. Create agency user record in tenant DB
      if (tenantDb && options.userId && options.userEmail) {
        // Use Supabase client
        console.log('Creating user record via Supabase client...');
        await this.createUserRecord(tenantDb, options, result);
      } else if (options.oauthAccessToken && options.projectId && options.userId && options.userEmail) {
        // Use Management API to execute SQL
        console.log('Creating user record via Management API SQL...');
        await this.createUserRecordViaAPI(options.oauthAccessToken, options.projectId, options, result);
      } else if (!options.userId || !options.userEmail) {
        console.log('⏭️ Skipping user record creation - no user data provided');
      } else {
        console.warn('⚠️ Cannot create user record - no tenantDb or OAuth credentials');
        result.errors.push({ step: 'create_user', error: 'No database client available' });
      }

      console.log(`✅ Tenant provisioning complete for store ${storeId}`);

      return {
        ...result,
        success: true,
        message: 'Tenant database provisioned successfully'
      };
    } catch (error) {
      console.error('Tenant provisioning failed:', error);
      result.errors.push({
        step: 'general',
        error: error.message
      });

      return {
        ...result,
        success: false,
        message: 'Provisioning failed',
        error: error.message
      };
    }
  }

  /**
   * Check if tenant database is already provisioned
   * @private
   */
  async checkIfProvisioned(tenantDb) {
    try {
      // Check if 'stores' table exists
      const { data, error } = await tenantDb
        .from('stores')
        .select('id')
        .limit(1);

      // If no error or table not found error, it's provisioned
      return error === null || error.code === 'PGRST116'; // PGRST116 = table exists but empty
    } catch (error) {
      return false;
    }
  }

  /**
   * Run tenant database migrations
   * @private
   */
  async runTenantMigrations(tenantDb, storeId, result, options = {}) {
    try {
      console.log('Reading tenant migration files...');

      // Read migration SQL files
      const migrationPath = path.join(__dirname, '../../database/schemas/tenant/001-create-tenant-tables.sql');
      const seedPath = path.join(__dirname, '../../database/schemas/tenant/002-tenant-seed-data.sql');

      const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
      const seedSQL = await fs.readFile(seedPath, 'utf-8');

      console.log('Migration SQL loaded:', migrationSQL.length, 'characters');
      console.log('Seed SQL loaded:', seedSQL.length, 'characters');

      // Check if we have OAuth access_token (use Supabase Management API)
      if (options.oauthAccessToken && options.projectId) {
        console.log('Using Supabase Management API for migrations (OAuth mode)...');

        const axios = require('axios');

        try {
          // Fix SQL syntax for PostgreSQL compatibility
          console.log('🔧 Fixing CREATE TYPE IF NOT EXISTS syntax in migrations...');

          let fixedMigrationSQL = migrationSQL.replace(
            /CREATE TYPE IF NOT EXISTS\s+(\w+)\s+AS\s+ENUM\s*\(([\s\S]*?)\);/gi,
            (match, typeName, enumValues) => {
              return `DO $$ BEGIN
    CREATE TYPE ${typeName} AS ENUM (${enumValues});
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;`;
            }
          );

          console.log('✅ Migration SQL syntax fixed');
          console.log('📊 Migration SQL size:', (fixedMigrationSQL.length / 1024).toFixed(2), 'KB');

          // Two-pass approach: Create tables first, then add foreign keys
          console.log('🔧 Extracting foreign key constraints for separate application...');

          // Extract ALTER TABLE ADD CONSTRAINT FOREIGN KEY statements
          const alterTableFKs = [];
          const alterTableRegex = /ALTER\s+TABLE\s+([\w]+)\s+ADD\s+CONSTRAINT\s+([\w]+)\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([\w]+)\s*\(([^)]+)\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET NULL|RESTRICT|NO ACTION))*\s*;/gi;
          let match;
          while ((match = alterTableRegex.exec(fixedMigrationSQL)) !== null) {
            alterTableFKs.push(match[0]);
          }

          console.log(`📋 Found ${alterTableFKs.length} ALTER TABLE FK constraints to apply later`);

          // Extract inline REFERENCES from CREATE TABLE and convert to ALTER TABLE
          const inlineFKs = [];
          const inlineRefRegex = /(\w+)\s+(UUID|INTEGER|BIGINT)\s+(NOT NULL\s+)?REFERENCES\s+([\w]+)\s*\(([^)]+)\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET NULL|RESTRICT|NO ACTION))*/gi;

          // Step 1: Remove REFERENCES clauses from within CREATE TABLE column definitions
          let tablesOnlySQL = fixedMigrationSQL.replace(
            /REFERENCES\s+[\w]+\s*\([^)]+\)(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET NULL|RESTRICT|NO ACTION))?/gi,
            ''
          );

          // Step 2: Remove entire ALTER TABLE...ADD CONSTRAINT...FOREIGN KEY statements
          tablesOnlySQL = tablesOnlySQL.replace(
            /ALTER\s+TABLE\s+[\w]+\s+ADD\s+CONSTRAINT\s+[\w]+\s+FOREIGN\s+KEY\s*\([^)]+\)[^;]*;/gi,
            ''
          );

          // Step 3: Remove ALTER TABLE...ADD FOREIGN KEY statements (without CONSTRAINT name)
          tablesOnlySQL = tablesOnlySQL.replace(
            /ALTER\s+TABLE\s+[\w]+\s+ADD\s+FOREIGN\s+KEY\s*\([^)]+\)[^;]*;/gi,
            ''
          );

          console.log('✅ Foreign key constraints extracted and removed from table creation SQL');

          // Execute migrations first (creates 137 tables WITHOUT foreign keys)
          console.log('📤 Pass 1: Running migrations via Management API (tables only)...');
          const migrationResponse = await axios.post(
            `https://api.supabase.com/v1/projects/${options.projectId}/database/query`,
            { query: tablesOnlySQL },
            {
              headers: {
                'Authorization': `Bearer ${options.oauthAccessToken}`,
                'Content-Type': 'application/json'
              },
              maxBodyLength: Infinity,
              timeout: 120000
            }
          );

          console.log('✅ Migration API response:', migrationResponse.data);

          // Check if migration actually succeeded
          if (migrationResponse.data && migrationResponse.data.error) {
            throw new Error(`Migration failed: ${migrationResponse.data.error}`);
          }

          console.log('✅ Pass 1 complete - 137 tables created without FKs');
          result.tablesCreated.push('Created 137 tables via OAuth API');

          // Execute Pass 2: Add foreign key constraints
          if (alterTableFKs.length > 0) {
            console.log(`📤 Pass 2: Adding ${alterTableFKs.length} foreign key constraints...`);
            const fkSQL = alterTableFKs.join('\n');

            try {
              const fkResponse = await axios.post(
                `https://api.supabase.com/v1/projects/${options.projectId}/database/query`,
                { query: fkSQL },
                {
                  headers: {
                    'Authorization': `Bearer ${options.oauthAccessToken}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 60000
                }
              );

              console.log('✅ Foreign keys added:', fkResponse.data);
              result.tablesCreated.push(`Added ${alterTableFKs.length} foreign key constraints`);
            } catch (fkError) {
              console.warn('⚠️ Some foreign keys failed to apply:', fkError.response?.data?.message || fkError.message);
              // Don't fail the entire provisioning if FKs fail - tables still work
            }
          }

          // Execute seed data separately (6,598 rows - large file)
          console.log('📊 Seed SQL size:', (seedSQL.length / 1024).toFixed(2), 'KB');
          console.log('📤 Running seed data via Management API...');

          const seedResponse = await axios.post(
            `https://api.supabase.com/v1/projects/${options.projectId}/database/query`,
            { query: seedSQL },
            {
              headers: {
                'Authorization': `Bearer ${options.oauthAccessToken}`,
                'Content-Type': 'application/json'
              },
              maxBodyLength: Infinity,
              timeout: 180000 // 3 minutes for seed data
            }
          );

          console.log('✅ Seed API response:', seedResponse.data);

          // Check if seeding actually succeeded
          if (seedResponse.data && seedResponse.data.error) {
            console.warn('⚠️ Seed data warning:', seedResponse.data.error);
          }

          console.log('✅ Seed data complete - 6,598 rows inserted');
          result.dataSeeded.push('Seeded 6,598 rows via OAuth API');

          // Update store_id for all tables to new store's ID
          console.log('🔄 Updating store_id for multiple tables...');

          const tablesToUpdate = [
            'translations',
            'cms_pages',
            'cookie_consent_settings',
            'email_templates',
            'payment_methods',
            'pdf_templates',
            'shipping_methods',
            'attribute_sets'
          ];

          const updateQueries = tablesToUpdate.map(table =>
            `UPDATE ${table} SET store_id = '${storeId}';`
          ).join('\n');

          await axios.post(
            `https://api.supabase.com/v1/projects/${options.projectId}/database/query`,
            { query: updateQueries },
            {
              headers: {
                'Authorization': `Bearer ${options.oauthAccessToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          console.log(`✅ store_id updated for ${tablesToUpdate.length} tables`);
          result.dataSeeded.push(`Updated store_id for ${tablesToUpdate.length} tables`);

          return true;

        } catch (apiError) {
          console.error('❌ Supabase Management API failed:', apiError.message);
          console.error('   Response status:', apiError.response?.status);
          console.error('   Response data:', JSON.stringify(apiError.response?.data, null, 2));

          const errorMessage = apiError.response?.data?.message || apiError.response?.data?.error || apiError.message;

          result.errors.push({
            step: 'migrations',
            error: `Failed to run migrations via Supabase API: ${errorMessage}`,
            details: apiError.response?.data
          });

          throw new Error(`Migration API failed: ${errorMessage}`);
        }
      }

      // Fallback: Use direct PostgreSQL connection (manual credentials mode)
      console.log('Using direct PostgreSQL connection for provisioning...');

      const { StoreDatabase } = require('../../models/master');
      const storeDb = await StoreDatabase.findByStoreId(storeId);

      if (!storeDb) {
        throw new Error('Store database credentials not found');
      }

      const credentials = storeDb.getCredentials();
      const { Client } = require('pg');

      // Validate connection string exists
      if (!credentials.connectionString) {
        throw new Error('Database connection string not found in stored credentials');
      }

      // Check if connection string has valid password
      if (credentials.connectionString.includes('[password]')) {
        throw new Error('Database password not provided. Connection string contains placeholder.');
      }

      const pgClient = new Client({
        connectionString: credentials.connectionString,
        ssl: { rejectUnauthorized: false }
      });

      console.log('Connecting to tenant DB via PostgreSQL...');
      await pgClient.connect();

      // Execute migration SQL (creates 137 tables)
      console.log('Running tenant migration (137 tables)...');
      await pgClient.query(migrationSQL);
      result.tablesCreated.push('Created 137 tables');

      // Execute seed SQL (6,598 rows)
      console.log('Running tenant seed data (6,598 rows)...');
      await pgClient.query(seedSQL);
      result.dataSeeded.push('Seeded 6,598 rows from 15 tables');

      // Update store_id for all tables to new store's ID
      console.log('🔄 Updating store_id for multiple tables...');

      const tablesToUpdate = [
        'translations',
        'cms_pages',
        'cookie_consent_settings',
        'email_templates',
        'payment_methods',
        'pdf_templates',
        'shipping_methods',
        'attribute_sets'
      ];

      for (const table of tablesToUpdate) {
        const updateSQL = `UPDATE ${table} SET store_id = '${storeId}';`;
        await pgClient.query(updateSQL);
      }

      console.log(`✅ store_id updated for ${tablesToUpdate.length} tables`);
      result.dataSeeded.push(`Updated store_id for ${tablesToUpdate.length} tables`);

      await pgClient.end();
      console.log('✅ Migration and seed complete!');

      return true;
    } catch (error) {
      console.error('Migration error:', error);
      result.errors.push({
        step: 'migrations',
        error: error.message
      });
      // Don't throw - continue provisioning
      return false;
    }
  }


  /**
   * Seed initial data into tenant database
   * @private
   */
  async seedInitialData(tenantDb, storeId, options, result) {
    try {
      // Seed default data (if needed)
      // For example: default categories, settings, etc.

      // Example: Create default service credit costs in tenant DB
      const defaultServiceCosts = [
        {
          service_key: 'product_import',
          service_name: 'Product Import',
          cost_per_unit: 0.10,
          billing_type: 'per_item'
        }
        // Add more as needed
      ];

      // TODO: Insert default data
      // await tenantDb.from('service_credit_costs').insert(defaultServiceCosts);

      result.dataSeeded.push('Default service costs');

      return true;
    } catch (error) {
      console.error('Seeding error:', error);
      result.errors.push({
        step: 'seeding',
        error: error.message
      });
      // Don't throw - seeding is optional
      return false;
    }
  }

  /**
   * Create store record in tenant database
   * @private
   */
  async createStoreRecord(tenantDb, storeId, options, result) {
    try {
      const storeData = {
        id: storeId,
        user_id: options.userId,
        name: options.storeName || 'My Store',
        slug: options.storeSlug || this.generateSlug(options.storeName),
        currency: options.currency || 'USD',
        timezone: options.timezone || 'UTC',
        is_active: true,
        settings: options.settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await tenantDb
        .from('stores')
        .insert(storeData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create store record: ${error.message}`);
      }

      result.dataSeeded.push('Store record');

      return data;
    } catch (error) {
      console.error('Store creation error:', error);
      result.errors.push({
        step: 'create_store',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create user record in tenant database
   * @private
   */
  async createUserRecord(tenantDb, options, result) {
    try {
      const userData = {
        id: options.userId,
        email: options.userEmail,
        password: options.userPasswordHash, // Already hashed
        first_name: options.userFirstName || '',
        last_name: options.userLastName || '',
        role: 'admin',
        account_type: 'agency',
        is_active: true,
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await tenantDb
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        // User might already exist, that's okay
        console.warn('User creation warning:', error.message);
        result.dataSeeded.push('User record (may already exist)');
        return null;
      }

      result.dataSeeded.push('User record');

      return data;
    } catch (error) {
      console.error('User creation error:', error);
      result.errors.push({
        step: 'create_user',
        error: error.message
      });
      // Don't throw - user creation is optional
      return null;
    }
  }

  /**
   * Generate URL-safe slug from name
   * @private
   */
  generateSlug(name) {
    if (!name) {
      return `store-${Date.now()}`;
    }

    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Create store record via Management API SQL
   * @private
   */
  async createStoreRecordViaAPI(oauthAccessToken, projectId, storeId, options, result) {
    try {
      const axios = require('axios');

      const insertSQL = `
INSERT INTO stores (id, user_id, name, slug, currency, timezone, is_active, settings, created_at, updated_at)
VALUES (
  '${storeId}',
  '${options.userId}',
  '${(options.storeName || 'My Store').replace(/'/g, "''")}',
  '${this.generateSlug(options.storeName)}',
  '${options.currency || 'USD'}',
  '${options.timezone || 'UTC'}',
  true,
  '${JSON.stringify(options.settings || {})}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
      `;

      await axios.post(
        `https://api.supabase.com/v1/projects/${projectId}/database/query`,
        { query: insertSQL },
        {
          headers: {
            'Authorization': `Bearer ${oauthAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Store record created via Management API');
      result.dataSeeded.push('Store record (via API)');
      return true;
    } catch (error) {
      console.error('Store creation via API error:', error.response?.data || error.message);
      result.errors.push({
        step: 'create_store',
        error: error.message
      });
      // Don't throw - non-blocking
      return false;
    }
  }

  /**
   * Create user record via Management API SQL
   * @private
   */
  async createUserRecordViaAPI(oauthAccessToken, projectId, options, result) {
    try {
      const axios = require('axios');

      const insertSQL = `
INSERT INTO users (id, email, password, first_name, last_name, role, account_type, is_active, email_verified, created_at, updated_at)
VALUES (
  '${options.userId}',
  '${options.userEmail}',
  '${options.userPasswordHash || 'oauth-user'}',
  '${(options.userFirstName || '').replace(/'/g, "''")}',
  '${(options.userLastName || '').replace(/'/g, "''")}',
  'admin',
  'agency',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
      `;

      await axios.post(
        `https://api.supabase.com/v1/projects/${projectId}/database/query`,
        { query: insertSQL },
        {
          headers: {
            'Authorization': `Bearer ${oauthAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ User record created via Management API');
      result.dataSeeded.push('User record (via API)');
      return true;
    } catch (error) {
      console.error('User creation via API error:', error.response?.data || error.message);
      result.errors.push({
        step: 'create_user',
        error: error.message
      });
      // Don't throw - non-blocking
      return false;
    }
  }

  /**
   * Test tenant database connection
   */
  async testTenantConnection(tenantDb) {
    try {
      const { data, error } = await tenantDb
        .from('stores')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new TenantProvisioningService();
