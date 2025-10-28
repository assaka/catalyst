/**
 * Check if widget slot in database has isCustom flag
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

async function checkWidgetSlot() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking header_widget slot...\n');

    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';

    const config = await client.query(`
      SELECT configuration FROM slot_configurations
      WHERE store_id = $1 AND page_type = 'cart'
    `, [storeId]);

    if (config.rows.length === 0) {
      console.log('❌ Cart config not found!');
      return;
    }

    const configuration = config.rows[0].configuration;
    const headerWidget = configuration.slots?.header_widget;

    if (!headerWidget) {
      console.log('❌ header_widget slot not found!');
      return;
    }

    console.log('📋 header_widget slot:');
    console.log(`  ID: ${headerWidget.id}`);
    console.log(`  Type: ${headerWidget.type}`);
    console.log(`  Widget ID: ${headerWidget.widgetId}`);
    console.log(`  isCustom: ${headerWidget.isCustom}`);
    console.log(`  Metadata:`, JSON.stringify(headerWidget.metadata, null, 2));

    if (!headerWidget.isCustom) {
      console.log('\n⚠️  Widget is NOT marked as custom (isCustom: false or missing)');
      console.log('   This means it cannot be deleted in the editor!');
      console.log('\n💡 Would you like to mark it as custom (deletable)?');
    } else {
      console.log('\n✅ Widget is marked as custom - it can be deleted!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkWidgetSlot();
