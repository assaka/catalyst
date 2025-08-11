const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Analyzing all tables with store_id dependency...');
    
    const query = `
      SELECT DISTINCT table_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name = 'store_id'
        AND table_name NOT LIKE 'pg_%'
      ORDER BY table_name;
    `;
    
    const [results] = await sequelize.query(query);
    
    console.log('📊 Store-dependent tables found:');
    results.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log(`\n📈 Total store-dependent tables: ${results.length}`);
    
    // Let's also check some key tables for sample data counts
    const sampleTables = ['products', 'categories', 'orders', 'cms_pages', 'attributes'];
    console.log('\n📋 Sample data counts:');
    
    for (const table of sampleTables) {
      try {
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table};`);
        console.log(`  - ${table}: ${count[0].count} records`);
      } catch (error) {
        console.log(`  - ${table}: Table not found or error`);
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();