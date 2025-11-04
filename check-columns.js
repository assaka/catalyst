const { sequelize } = require('./backend/src/database/connection');

async function checkColumns() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      AND column_name IN ('is_blacklisted', 'blacklist_reason', 'blacklisted_at')
      ORDER BY column_name;
    `);
    
    console.log('Blacklist columns in customers table:');
    console.table(results);
    
    if (results.length === 0) {
      console.log('❌ No blacklist columns found!');
      console.log('Creating columns...');
      
      await sequelize.query(`
        ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false NOT NULL,
        ADD COLUMN IF NOT EXISTS blacklist_reason TEXT,
        ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMP;
      `);
      
      console.log('✅ Columns created successfully');
    } else {
      console.log('✅ All blacklist columns exist');
      
      // Check actual data
      const [customers] = await sequelize.query(`
        SELECT id, email, is_blacklisted, blacklist_reason, blacklisted_at
        FROM customers
        LIMIT 5;
      `);
      
      console.log('\nSample customer data:');
      console.table(customers);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
