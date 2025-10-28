/**
 * Add Cart Hamid widget slot to slot_configurations in database
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

async function addWidgetSlot() {
  const client = await pool.connect();

  try {
    console.log('🎨 Adding Cart Hamid widget slot to cart configuration...\n');

    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';

    // 1. Get current cart slot configuration
    console.log('📋 Loading current cart slot configuration...');
    const config = await client.query(`
      SELECT id, configuration FROM slot_configurations
      WHERE store_id = $1 AND page_type = 'cart'
    `, [storeId]);

    if (config.rows.length === 0) {
      console.log('❌ Cart configuration not found for store!');
      return;
    }

    const configId = config.rows[0].id;
    const configuration = config.rows[0].configuration || {};
    const slots = configuration.slots || {};

    console.log(`  ✅ Found config ID: ${configId}`);
    console.log(`  📦 Current slots: ${Object.keys(slots).length}`);

    // 2. Add new widget slot above header_title
    console.log('\n🎨 Adding header_widget slot...');

    slots.header_widget = {
      id: 'header_widget',
      type: 'plugin_widget',
      widgetId: 'cart-hamid-widget',
      content: '',
      className: 'w-full',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'header_container',
      position: { col: 1, row: 1 },
      viewMode: ['emptyCart', 'withProducts'],
      metadata: { hierarchical: true, pluginWidget: true }
    };

    // 3. Update header_title position to row 2
    if (slots.header_title) {
      console.log('  🔄 Moving header_title to row 2...');
      slots.header_title.position = { col: 1, row: 2 };
    }

    // 4. Update configuration object with new slots
    configuration.slots = slots;

    // 5. Save updated configuration
    console.log('\n💾 Saving updated configuration...');
    await client.query(`
      UPDATE slot_configurations
      SET configuration = $1, updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(configuration), configId]);

    console.log('  ✅ Configuration saved');

    // 6. Verify
    console.log('\n🔍 Verifying...');
    const verified = await client.query(`
      SELECT configuration FROM slot_configurations WHERE id = $1
    `, [configId]);

    const verifiedSlots = verified.rows[0].configuration.slots;
    const hasHeaderWidget = verifiedSlots.header_widget;
    const headerTitleRow = verifiedSlots.header_title?.position?.row;

    console.log(`  ✅ header_widget exists: ${!!hasHeaderWidget}`);
    console.log(`  ✅ header_title at row: ${headerTitleRow}`);
    console.log(`  📊 Total slots: ${Object.keys(verifiedSlots).length}`);

    console.log('\n✅ Widget slot added successfully!');
    console.log('\n📋 What was added:');
    console.log('  Slot ID: header_widget');
    console.log('  Type: plugin_widget');
    console.log('  Widget: cart-hamid-widget');
    console.log('  Position: Above "My Cart" title');
    console.log('  Views: emptyCart, withProducts');
    console.log('\n🧪 Test:');
    console.log('  1. Navigate to /cart page');
    console.log('  2. Cart Hamid widget should appear above title');
    console.log('  3. Purple gradient widget with visit counter');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addWidgetSlot();
