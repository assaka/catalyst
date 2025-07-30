require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const migration = require('./src/migrations/add-payment-fee-to-orders');

async function runMigration() {
  try {
    console.log('🔄 Running payment fee migration...');
    
    await migration.up(sequelize.getQueryInterface());
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();