const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running file_baselines global migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'src/database/migrations/make-file-baselines-global.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL length:', migrationSQL.length, 'characters');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('📋 Found', statements.length, 'SQL statements to execute');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log('  ', statement.substring(0, 60) + (statement.length > 60 ? '...' : ''));
      
      try {
        await sequelize.query(statement);
        console.log('  ✅ Success');
      } catch (error) {
        console.log('  ⚠️ Statement failed (may be expected):', error.message);
        // Continue with other statements
      }
    }
    
    // Verify the changes
    console.log('🔍 Verifying migration results...');
    
    // Check if store_id column is gone
    try {
      const columns = await sequelize.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'file_baselines' 
        ORDER BY ordinal_position
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('📋 Current file_baselines columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      const hasStoreId = columns.some(col => col.column_name === 'store_id');
      console.log('🔍 Store ID column exists:', hasStoreId);
      
      if (!hasStoreId) {
        console.log('✅ Migration successful - store_id column removed');
      } else {
        console.log('❌ Migration may have failed - store_id column still exists');
      }
      
    } catch (verifyError) {
      console.log('⚠️ Could not verify migration:', verifyError.message);
    }
    
    await sequelize.close();
    console.log('✅ Migration completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

runMigration();