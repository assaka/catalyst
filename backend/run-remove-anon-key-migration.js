process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { sequelize } = require('./src/database/connection.js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Running migration to remove anon_key column\n');
  console.log('=====================================\n');
  
  try {
    // Check current table structure before migration
    console.log('📋 Current table structure:');
    const [currentColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'supabase_oauth_tokens' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns before migration:');
    currentColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    const hasAnonKey = currentColumns.some(col => col.column_name === 'anon_key');
    
    if (!hasAnonKey) {
      console.log('\n✅ anon_key column already removed. Migration not needed.');
      await sequelize.close();
      return;
    }
    
    console.log('\n🔧 Running migration...');
    
    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, 'src/database/migrations/remove-anon-key-column.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await sequelize.query(sql);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify the migration
    console.log('📋 Verifying table structure after migration:');
    const [newColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'supabase_oauth_tokens' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns after migration:');
    newColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    const stillHasAnonKey = newColumns.some(col => col.column_name === 'anon_key');
    
    if (!stillHasAnonKey) {
      console.log('\n✅ SUCCESS: anon_key column has been removed successfully!');
      console.log('📝 All Supabase operations now use the service_role_key exclusively.');
    } else {
      console.log('\n⚠️  WARNING: anon_key column still exists. Migration may have failed.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('\n✅ Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Migration script failed:', error);
  process.exit(1);
});