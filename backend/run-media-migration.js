const { sequelize } = require('./src/database/connection');
const fs = require('fs');

(async () => {
  try {
    console.log('🔧 Running media_assets table migration...');
    
    const migrationPath = './src/database/migrations/create-media-tables.sql';
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sequelize.query(statement);
        } catch (error) {
          // Ignore 'already exists' errors
          if (!error.message.includes('already exists')) {
            console.error('Error executing statement:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the new table structure
    const [results] = await sequelize.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'media_assets\' ORDER BY ordinal_position;');
    
    console.log('📋 media_assets table columns:');
    results.forEach(col => console.log('- ' + col.column_name + ': ' + col.data_type));
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await sequelize.close();
  }
})();