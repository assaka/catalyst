const { Pool } = require('pg');

async function verifySlotReferences() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    // Slot references used in Cart.jsx
    const cartJsxSlots = [
      'header_title',
      'empty_cart_title',
      'empty_cart_text',
      'empty_cart_button',
      'cart_items_container',
      'coupon_container',
      'order_summary_container'
    ];

    console.log('🔍 Verifying slot references in Cart.jsx match published configuration...');
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
    const publishedSlots = Object.keys(config.slots || {});

    console.log(`📋 Configuration ID: ${configResult.rows[0].id}`);
    console.log(`📊 Total published slots: ${publishedSlots.length}`);
    console.log('');

    console.log('✅ Slot Reference Verification:');
    let allValid = true;

    cartJsxSlots.forEach(slotName => {
      const exists = publishedSlots.includes(slotName);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${slotName}: ${exists ? 'Found' : 'NOT FOUND'}`);

      if (exists && config.slots[slotName]) {
        const slot = config.slots[slotName];
        console.log(`     Content: "${slot.content || 'no content'}"`);
        console.log(`     Type: ${slot.type || 'unknown'}`);
      }

      if (!exists) allValid = false;
      console.log('');
    });

    if (allValid) {
      console.log('🎉 All Cart.jsx slot references are valid!');
    } else {
      console.log('❌ Some Cart.jsx slot references are missing in published config');
      console.log('');
      console.log('🔍 Available slots containing relevant keywords:');
      publishedSlots.forEach(slot => {
        const lowerSlot = slot.toLowerCase();
        if (lowerSlot.includes('cart') || lowerSlot.includes('order') || lowerSlot.includes('coupon') || lowerSlot.includes('empty')) {
          console.log(`  - ${slot}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySlotReferences();