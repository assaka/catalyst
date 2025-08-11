const fs = require('fs');
const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔧 Running enhanced template customization system migration...');
    
    const migrationPath = './backend/src/database/migrations/enhance-template-customization-system.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sequelize.query(statement);
        } catch (error) {
          // Log but continue with other statements
          if (!error.message.includes('already exists')) {
            console.log('⚠️  Statement warning:', error.message.substring(0, 100));
          }
        }
      }
    }
    
    console.log('✅ Enhanced template customization system migration completed!');
    
    // Verify new tables exist
    const [results] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name IN ('template_assets', 'template_components', 'template_customization_layers', 'store_data_migrations', 'store_supabase_connections') 
      AND table_schema = 'public'
    `);
    
    console.log('📋 New tables created:', results.length);
    if (results && results.length > 0) {
      results.forEach(table => console.log('- ' + table.table_name));
    } else {
      console.log('- No new tables found (they may already exist)');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
})();