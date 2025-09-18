const { Pool } = require('pg');

async function checkCustomSlots() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log('🔍 Checking custom slots in published configuration...');
    console.log('');

    // Get the latest published configuration
    const configResult = await pool.query(`
      SELECT id, configuration::text as config_text
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = 'cart'
        AND status = 'published'
        AND published_at IS NOT NULL
      ORDER BY version_number DESC
      LIMIT 1;
    `, [hamidStoreId]);

    if (configResult.rows.length === 0) {
      console.log('❌ No published configuration found');
      return;
    }

    const config = JSON.parse(configResult.rows[0].config_text);
    const slots = config.slots || {};

    console.log(`📋 Configuration ID: ${configResult.rows[0].id}`);
    console.log(`📊 Total slots: ${Object.keys(slots).length}`);
    console.log('');

    // Find custom slots (typically start with 'new_')
    const customSlots = Object.keys(slots).filter(key =>
      key.startsWith('new_') ||
      key.includes('_17') || // timestamp pattern
      !['header_title', 'empty_cart_title', 'empty_cart_text', 'empty_cart_button',
        'cart_items_container', 'coupon_container', 'order_summary_container',
        'cart_item_1', 'cart_item_2', 'main_layout', 'content_area', 'coupon_input',
        'coupon_title', 'sidebar_area', 'coupon_button', 'checkout_button',
        'empty_cart_icon'].includes(key)
    );

    console.log(`🎨 Custom slots found: ${customSlots.length}`);
    console.log('');

    if (customSlots.length === 0) {
      console.log('❌ No custom slots found');
    } else {
      customSlots.forEach(slotKey => {
        const slot = slots[slotKey];
        console.log(`🔧 ${slotKey}:`);
        console.log(`   Type: ${slot.type || 'unknown'}`);
        console.log(`   Content: "${slot.content || 'no content'}"`);
        console.log(`   Position: row ${slot.rowSpan || 'auto'}, col ${slot.colSpan || 'auto'}`);
        console.log(`   Grid: ${slot.gridRow || 'auto'} / ${slot.gridCol || 'auto'}`);
        console.log(`   Layout: ${slot.layout || 'none'}`);
        if (slot.parentId) console.log(`   Parent: ${slot.parentId}`);
        if (slot.className) console.log(`   Classes: ${slot.className}`);
        if (slot.styles) {
          const styleKeys = Object.keys(slot.styles);
          if (styleKeys.length > 0) {
            console.log(`   Styles: ${styleKeys.length} properties`);
          }
        }
        console.log('');
      });
    }

    // Check metadata for slot positioning info
    if (config.metadata) {
      console.log('📋 Configuration metadata:');
      console.log(`   Created: ${config.metadata.created || 'unknown'}`);
      console.log(`   Modified: ${config.metadata.lastModified || 'unknown'}`);
      if (config.metadata.layout) {
        console.log(`   Layout info: ${JSON.stringify(config.metadata.layout)}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCustomSlots();