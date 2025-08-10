const { sequelize } = require('./src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking all credit-related tables...');
    
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%credit%' AND table_schema = 'public';");
    
    console.log('📋 Credit-related tables:');
    tables.forEach(table => console.log('  - ' + table.table_name));
    
    // Check if our specific credit system tables exist
    const expectedTables = ['credits', 'credit_transactions', 'credit_usage'];
    
    for (const tableName of expectedTables) {
      const [exists] = await sequelize.query(`SELECT table_name FROM information_schema.tables WHERE table_name = '${tableName}' AND table_schema = 'public';`);
      if (exists.length === 0) {
        console.log(`❌ Missing table: ${tableName}`);
      } else {
        console.log(`✅ Found table: ${tableName}`);
        
        // Show columns
        const [columns] = await sequelize.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position;`);
        console.log(`   Columns: ${columns.map(c => c.column_name + ':' + c.data_type).join(', ')}`);
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();