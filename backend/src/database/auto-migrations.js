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