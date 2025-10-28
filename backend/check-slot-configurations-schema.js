/**
 * Check slot_configurations table schema
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking slot_configurations table schema...\n');

    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'slot_configurations'
      ORDER BY ordinal_position
    `);

    console.log('Columns in slot_configurations:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Check cart config for the store
    console.log('\n📋 Checking cart configuration for store 157d4590-49bf-4b0b-bd77-abe131909528...\n');

    const cartConfig = await client.query(`
      SELECT * FROM slot_configurations
      WHERE store_id = $1 AND page_type = 'cart'
    `, ['157d4590-49bf-4b0b-bd77-abe131909528']);

    if (cartConfig.rows.length > 0) {
      console.log('✅ Cart configuration found:');
      const config = cartConfig.rows[0];
      for (const [key, value] of Object.entries(config)) {
        if (value && typeof value === 'object') {
          console.log(`  ${key}: ${JSON.stringify(value).substring(0, 100)}...`);
        } else if (value && typeof value === 'string' && value.length > 100) {
          console.log(`  ${key}: ${value.substring(0, 100)}...`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    } else {
      console.log('❌ No cart configuration found for this store');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
