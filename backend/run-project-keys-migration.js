const { sequelize } = require('./src/database/connection');
const fs = require('fs');

(async () => {
  try {
    console.log('🔧 Running project keys migration...');
    
    const sql = fs.readFileSync('./src/database/migrations/create-project-keys-table.sql', 'utf8');
    
    // Split and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sequelize.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error('❌ Failed:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Project keys migration completed!');
    
    // Verify table exists
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'supabase_project_keys'"
    );
    
    if (tables.length > 0) {
      console.log('✅ supabase_project_keys table confirmed in database');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
})();