const { Pool } = require('pg');

async function resetClean() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log('🧹 Resetting database for clean testing...');
    console.log('');

    // Delete all existing cart configurations
    console.log('🗑️ Deleting all cart configurations...');
    await pool.query(`
      DELETE FROM slot_configurations
      WHERE store_id = $1
        AND page_type = 'cart'
    `, [hamidStoreId]);

    console.log('✅ Database reset complete.');
    console.log('');
    console.log('🎯 Next editor access will create fresh configuration with:');
    console.log('   • Only position: {col, row} coordinates');
    console.log('   • No obsolete order properties');
    console.log('   • Clean drag/drop behavior');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetClean();