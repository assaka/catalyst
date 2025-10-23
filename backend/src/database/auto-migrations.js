/**
 * Automatic migration runner
 * Runs all pending migrations on server startup
 */

const { sequelize } = require('./connection');

// Define all migrations in order
const migrations = [
  {
    name: 'add-user-id-to-stores',
    up: async () => {
      console.log('🔄 Running migration: add-user-id-to-stores');
      
      try {
        // Check if user_id column already exists
        const [results] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'stores' AND column_name = 'user_id'
        `);
        
        if (results.length > 0) {
          console.log('✅ user_id column already exists');
        } else {
          // Add user_id column
          await sequelize.query(`
            ALTER TABLE stores 
            ADD COLUMN user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
          `);
          
          // Add index for performance
          await sequelize.query(`
            CREATE INDEX idx_stores_user_id ON stores(user_id)
          `);
          
          console.log('✅ Added user_id column to stores table');
        }
        
        // Migrate existing data by matching owner_email to user email
        const [unmigrated] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM stores 
          WHERE user_id IS NULL AND owner_email IS NOT NULL
        `);
        
        if (unmigrated[0].count > 0) {
          console.log(`📊 Found ${unmigrated[0].count} stores without user_id, migrating...`);
          
          await sequelize.query(`
            UPDATE stores 
            SET user_id = users.id 
            FROM users 
            WHERE stores.owner_email = users.email 
            AND stores.user_id IS NULL
          `);
          
          console.log('✅ Migrated existing stores to use user_id');
        }
        
        return true;
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        // Don't throw - allow server to continue
        return false;
      }
    }
  },
  {
    name: 'make-user-id-required-and-owner-email-optional',
    up: async () => {
      console.log('🔄 Running migration: make-user-id-required-and-owner-email-optional');
      
      try {
        // Check if all stores have user_id populated
        const [storesWithoutUserId] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM stores 
          WHERE user_id IS NULL
        `);
        
        if (storesWithoutUserId[0].count > 0) {
          console.log(`⚠️ Found ${storesWithoutUserId[0].count} stores without user_id - cannot make it required yet`);
          return false;
        }
        
        // Make user_id NOT NULL
        await sequelize.query(`
          ALTER TABLE stores 
          ALTER COLUMN user_id SET NOT NULL
        `);
        
        // Make owner_email nullable (since we no longer rely on it)
        await sequelize.query(`
          ALTER TABLE stores 
          ALTER COLUMN owner_email DROP NOT NULL
        `);
        
        console.log('✅ Made user_id required and owner_email optional');
        return true;
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        return false;
      }
    }
  },
  {
    name: 'create-store-teams-tables',
    up: async () => {
      console.log('🔄 Running migration: create-store-teams-tables');
      
      try {
        // Create store_teams table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS store_teams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID NOT NULL REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
            permissions JSONB DEFAULT '{}',
            invited_by UUID REFERENCES users(id),
            invited_at TIMESTAMP,
            accepted_at TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(store_id, user_id)
          )
        `);
        
        // Create indexes for store_teams
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_teams_store_id ON store_teams(store_id)
        `);
        
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_teams_user_id ON store_teams(user_id)
        `);
        
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_teams_status ON store_teams(status)
        `);
        
        console.log('✅ Created store_teams table');
        
        // Create store_invitations table
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS store_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            store_id UUID NOT NULL REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE,
            invited_email VARCHAR(255) NOT NULL,
            invited_by UUID NOT NULL REFERENCES users(id),
            role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
            permissions JSONB DEFAULT '{}',
            invitation_token VARCHAR(255) NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            accepted_at TIMESTAMP,
            accepted_by UUID REFERENCES users(id),
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Create indexes for store_invitations
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_invitations_store_id ON store_invitations(store_id)
        `);
        
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_invitations_email ON store_invitations(invited_email)
        `);
        
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_invitations_token ON store_invitations(invitation_token)
        `);
        
        await sequelize.query(`
          CREATE INDEX IF NOT EXISTS idx_store_invitations_status ON store_invitations(status)
        `);
        
        console.log('✅ Created store_invitations table');
        
        return true;
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        return false;
      }
    }
  },
  {
    name: 'add-test-team-member',
    up: async () => {
      console.log('🔄 Running migration: add-test-team-member');
      
      try {
        // Find the Hamid store and info@itomoti.com user
        const [hamidStore] = await sequelize.query(`
          SELECT id FROM stores WHERE name = 'Hamid' LIMIT 1
        `);
        
        const [user] = await sequelize.query(`
          SELECT id FROM users WHERE email = 'info@itomoti.com' LIMIT 1
        `);
        
        if (!hamidStore.length || !user.length) {
          console.log('⚠️ Hamid store or info@itomoti.com user not found, skipping team member addition');
          return true;
        }
        
        const storeId = hamidStore[0].id;
        const userId = user[0].id;
        
        // Check if already a team member
        const [existingMember] = await sequelize.query(`
          SELECT id FROM store_teams 
          WHERE store_id = $1 AND user_id = $2
        `, {
          bind: [storeId, userId]
        });
        
        if (existingMember.length > 0) {
          console.log('✅ User is already a team member of Hamid store');
          
          // Update to admin role if not already
          await sequelize.query(`
            UPDATE store_teams 
            SET role = 'admin', status = 'active', accepted_at = CURRENT_TIMESTAMP
            WHERE store_id = $1 AND user_id = $2
          `, {
            bind: [storeId, userId]
          });
          
          console.log('✅ Updated user role to admin in Hamid store');
        } else {
          // Add as team member
          await sequelize.query(`
            INSERT INTO store_teams (store_id, user_id, role, status, accepted_at, permissions)
            VALUES ($1, $2, 'admin', 'active', CURRENT_TIMESTAMP, '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true, "canViewReports": true}')
          `, {
            bind: [storeId, userId]
          });
          
          console.log('✅ Added info@itomoti.com as admin to Hamid store');
        }
        
        console.log('🎉 You can now access the Hamid store!');
        return true;
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        return false;
      }
    }
  },
  {
    name: 'update-redirects-columns-and-types',
    up: async () => {
      console.log('🔄 Running migration: update-redirects-columns-and-types');

      try {
        // Check if redirects table exists
        const [tableExists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'redirects'
          ) as exists
        `);

        if (!tableExists[0].exists) {
          console.log('✅ Redirects table does not exist yet, skipping');
          return true;
        }

        // Get current column names
        const [columns] = await sequelize.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'redirects'
        `);

        const columnNames = columns.map(c => c.column_name);

        // Rename columns if using old names
        if (columnNames.includes('source_path')) {
          await sequelize.query(`
            ALTER TABLE redirects RENAME COLUMN source_path TO from_url
          `);
          console.log('✅ Renamed source_path to from_url');
        }

        if (columnNames.includes('target_path')) {
          await sequelize.query(`
            ALTER TABLE redirects RENAME COLUMN target_path TO to_url
          `);
          console.log('✅ Renamed target_path to to_url');
        }

        if (columnNames.includes('redirect_type')) {
          await sequelize.query(`
            ALTER TABLE redirects RENAME COLUMN redirect_type TO type
          `);
          console.log('✅ Renamed redirect_type to type');
        }

        // Update the enum type to include 307 and 308
        // First check if we need to update the enum
        const [enumValues] = await sequelize.query(`
          SELECT enumlabel
          FROM pg_enum
          WHERE enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'enum_redirects_type'
          )
        `);

        const currentValues = enumValues.map(v => v.enumlabel);

        if (!currentValues.includes('307') || !currentValues.includes('308')) {
          console.log('🔄 Updating redirect type enum to include 307 and 308...');

          // Temporarily change to string
          await sequelize.query(`
            ALTER TABLE redirects
            ALTER COLUMN type TYPE VARCHAR(3)
          `);

          // Drop old enum type
          await sequelize.query(`
            DROP TYPE IF EXISTS enum_redirects_type
          `);

          // Create new enum type
          await sequelize.query(`
            CREATE TYPE enum_redirects_type AS ENUM ('301', '302', '307', '308')
          `);

          // Apply new enum type
          await sequelize.query(`
            ALTER TABLE redirects
            ALTER COLUMN type TYPE enum_redirects_type USING type::enum_redirects_type
          `);

          console.log('✅ Updated redirect type enum');
        } else {
          console.log('✅ Redirect type enum already up to date');
        }

        // Update index name if needed
        await sequelize.query(`
          DROP INDEX IF EXISTS idx_redirects_store_source_unique
        `).catch(() => {});

        await sequelize.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_redirects_store_from_unique
          ON redirects(store_id, from_url)
        `);

        console.log('✅ Redirect columns and types updated');
        return true;
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        return false;
      }
    }
  }
];

// Track which migrations have been run
let migrationsRun = false;

/**
 * Run all pending migrations
 */
async function runAutoMigrations() {
  if (migrationsRun) {
    console.log('🔍 Migrations already run in this session');
    return;
  }
  
  console.log('🚀 Starting automatic migrations...');
  
  try {
    // First ensure database connection is ready
    await sequelize.authenticate();
    console.log('✅ Database connection verified for migrations');
    
    // Create migrations tracking table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {
      // Table might already exist, that's fine
    });
    
    // Run each migration
    for (const migration of migrations) {
      try {
        // Check if migration has already been run
        const [existing] = await sequelize.query(
          'SELECT name FROM _migrations WHERE name = :name',
          { replacements: { name: migration.name } }
        );
        
        if (existing.length > 0) {
          console.log(`⏭️  Migration '${migration.name}' already run, skipping`);
          continue;
        }
        
        // Run the migration
        console.log(`🔄 Running migration: ${migration.name}`);
        const success = await migration.up();
        
        if (success) {
          // Record that migration was run
          await sequelize.query(
            'INSERT INTO _migrations (name) VALUES (:name)',
            { replacements: { name: migration.name } }
          );
          console.log(`✅ Migration '${migration.name}' completed`);
        } else {
          console.log(`⚠️  Migration '${migration.name}' had issues but continuing`);
        }
        
      } catch (error) {
        console.error(`❌ Error in migration '${migration.name}':`, error.message);
        // Continue with other migrations
      }
    }
    
    // Show final statistics
    try {
      const [stats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_stores,
          COUNT(user_id) as stores_with_user_id,
          COUNT(CASE WHEN user_id IS NULL THEN 1 END) as stores_without_user_id
        FROM stores
      `);
      
      console.log('\n📊 Store ownership statistics:');
      console.log(`   Total stores: ${stats[0].total_stores}`);
      console.log(`   Stores with user_id: ${stats[0].stores_with_user_id}`);
      console.log(`   Stores without user_id: ${stats[0].stores_without_user_id}`);
    } catch (error) {
      // Stats are optional, don't fail if they can't be retrieved
    }
    
    migrationsRun = true;
    console.log('✅ All migrations completed');
    
  } catch (error) {
    console.error('❌ Migration runner error:', error.message);
    // Don't throw - allow server to continue even if migrations fail
  }
}

// Auto-run migrations after a delay to ensure models are loaded
setTimeout(() => {
  runAutoMigrations().catch(console.error);
}, 5000);

module.exports = { runAutoMigrations };