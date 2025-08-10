const fs = require('fs');
const { sequelize } = require('./src/database/connection.js');

(async () => {
  try {
    console.log('🔧 Running credit system migration...');
    
    const migrationPath = './src/database/migrations/create-credit-system-tables.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sequelize.query(statement);
          console.log('✅ Executed statement successfully');
        } catch (error) {
          // Ignore 'already exists' errors
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.error('❌ Error:', error.message);
          } else {
            console.log('ℹ️ Skipped existing resource');
          }
        }
      }
    }
    
    console.log('✅ Credit system migration completed successfully!');
    
    // Verify tables exist
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('credits', 'credit_transactions', 'credit_usage') AND table_schema = 'public';");
    
    console.log('📋 Created tables:');
    results.forEach(table => console.log('  - ' + table.table_name));
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
})();