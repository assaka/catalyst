const { sequelize } = require('./src/database/connection.js');

async function checkConstraints() {
  try {
    // Check constraints
    const [constraints] = await sequelize.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'attributes'::regclass 
      AND contype = 'c';
    `);
    
    console.log('📋 Constraints on attributes table:');
    constraints.forEach(c => console.log(`- ${c.conname}: ${c.consrc}`));
    
    // Also check the table definition
    const [tableInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'attributes' 
      AND column_name = 'type';
    `);
    
    console.log('\n📋 Type column info:');
    console.log(tableInfo[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkConstraints();