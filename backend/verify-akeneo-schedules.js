const { sequelize } = require('./src/database/connection');

async function verifyTable() {
  try {
    console.log('🔍 Verifying akeneo_schedules table...');
    
    // Check if table exists and get structure
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'akeneo_schedules' 
      ORDER BY ordinal_position;
    `);
    
    if (results.length > 0) {
      console.log('✅ akeneo_schedules table exists with columns:');
      results.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      });
    } else {
      console.log('❌ akeneo_schedules table not found');
    }
    
    // Check indexes
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'akeneo_schedules';
    `);
    
    console.log('\n📋 Indexes:');
    indexes.forEach(idx => {
      console.log(`- ${idx.indexname}`);
    });
    
    console.log('\n🎉 Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifyTable();