const { Pool } = require('pg');

async function checkEmptyCartTitle() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log('🔍 Checking empty_cart_title content in published configuration...');
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

    let config;
    try {
      config = JSON.parse(configResult.rows[0].config_text);
    } catch (e) {
      console.log('❌ Error parsing configuration JSON:', e.message);
      return;
    }

    console.log(`📋 Configuration ID: ${configResult.rows[0].id}`);
    console.log('');

    // Check for empty cart related slots
    const emptyCartSlots = [
      'empty_cart_title',
      'empty_cart_text',
      'empty_cart_button',
      'emptyCart.title',
      'emptyCart.text',
      'emptyCart.button'
    ];

    console.log('🔍 Empty Cart Slot Contents:');
    let foundSlots = 0;

    emptyCartSlots.forEach(slotName => {
      const slot = config.slots?.[slotName] || config[slotName];
      if (slot) {
        foundSlots++;
        console.log(`✅ ${slotName}:`);
        console.log(`   Content: "${slot.content || 'no content'}"`);
        console.log(`   Type: ${slot.type || 'unknown'}`);
        if (slot.className) console.log(`   Classes: ${slot.className}`);
        console.log('');
      }
    });

    if (foundSlots === 0) {
      console.log('❌ No empty cart slots found');
      console.log('');
      console.log('🔍 All available slots:');
      const slots = config.slots || {};
      Object.keys(slots).slice(0, 20).forEach(key => {
        console.log(`  - ${key}: "${slots[key].content || 'no content'}"`);
      });
      if (Object.keys(slots).length > 20) {
        console.log(`  ... and ${Object.keys(slots).length - 20} more slots`);
      }
    }

    // Search for slots with "hamid" or "empty" in content
    console.log('🔍 Slots containing "hamid" or "empty":');
    const slots = config.slots || {};
    let foundRelevant = false;
    Object.keys(slots).forEach(key => {
      const content = slots[key].content;
      if (typeof content === 'string') {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('hamid') || lowerContent.includes('empty')) {
          foundRelevant = true;
          console.log(`  - ${key}: "${content}"`);
        }
      }
    });

    if (!foundRelevant) {
      console.log('  No slots found with "hamid" or "empty" content');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmptyCartTitle();