// Migration script for Render.com deployment
const { Sequelize } = require('sequelize');
const migration = require('./src/migrations/add-payment-fee-to-orders');

async function runMigration() {
  let sequelize;
  
  try {
    console.log('🔄 Running payment fee migration for Render deployment...');
    
    // Check for Render database URL
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!databaseUrl) {
      console.error('❌ No DATABASE_URL or SUPABASE_DB_URL environment variable found');
      console.log('Available env vars:', Object.keys(process.env).filter(key => 
        key.includes('DB') || key.includes('DATABASE') || key.includes('SUPABASE')
      ));
      process.exit(1);
    }
    
    console.log('📊 Using database URL:', databaseUrl.substring(0, 30) + '...');
    
    // Create direct Sequelize connection
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run migration
    await migration.up(sequelize.getQueryInterface());
    
    console.log('✅ Migration completed successfully');
    
    // Close connection
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(1);
  }
}

// Run the migration
runMigration();