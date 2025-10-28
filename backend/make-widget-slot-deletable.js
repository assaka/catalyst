/**
 * Mark header_widget slot as custom (deletable)
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

async function makeWidgetDeletable() {
  const client = await pool.connect();

  try {
    console.log('🔧 Making header_widget deletable...\n');

    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';

    // Get current config
    const config = await client.query(`
      SELECT id, configuration FROM slot_configurations
      WHERE store_id = $1 AND page_type = 'cart'
    `, [storeId]);

    if (config.rows.length === 0) {
      console.log('❌ Cart config not found!');
      return;
    }

    const configId = config.rows[0].id;
    const configuration = config.rows[0].configuration;

    // Add isCustom: true to header_widget
    if (configuration.slots?.header_widget) {
      configuration.slots.header_widget.isCustom = true;
      console.log('✅ Added isCustom: true to header_widget');
    } else {
      console.log('❌ header_widget slot not found!');
      return;
    }

    // Save updated configuration
    await client.query(`
      UPDATE slot_configurations
      SET configuration = $1, updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(configuration), configId]);

    console.log('✅ Configuration saved');

    // Verify
    const verified = await client.query(`
      SELECT configuration FROM slot_configurations WHERE id = $1
    `, [configId]);

    const headerWidget = verified.rows[0].configuration.slots.header_widget;
    console.log('\n🔍 Verification:');
    console.log(`  isCustom: ${headerWidget.isCustom}`);
    console.log('\n✅ Widget is now deletable in the editor!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

makeWidgetDeletable();
