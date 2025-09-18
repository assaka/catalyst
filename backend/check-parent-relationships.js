const { Pool } = require('pg');

async function checkParentRelationships() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log('🔍 Checking parent-child relationships for custom slots...');
    console.log('');

    const configResult = await pool.query(`
      SELECT configuration::text as config_text
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = 'cart'
        AND status = 'published'
        AND published_at IS NOT NULL
      ORDER BY version_number DESC
      LIMIT 1;
    `, [hamidStoreId]);

    const config = JSON.parse(configResult.rows[0].config_text);
    const slots = config.slots || {};

    // Check custom slots specifically
    const customSlots = ['new_link_1758217487989_v1qjl', 'new_text_1758200145319_4t84z', 'new_image_1758215322321_1da9e', 'new_image_1758219125370_gi00w'];

    console.log('🎨 Custom slots parent relationships:');
    customSlots.forEach(slotKey => {
      const slot = slots[slotKey];
      if (slot) {
        console.log(`${slotKey}:`);
        console.log(`   Parent: ${slot.parentId || 'null'}`);
        console.log(`   Type: ${slot.type}`);
        console.log(`   Content: "${slot.content}"`);
        console.log('');
      } else {
        console.log(`❌ Slot ${slotKey} not found`);
      }
    });

    // Check what has main_layout as parent
    console.log('🔍 All slots with main_layout as parent:');
    Object.keys(slots).forEach(key => {
      const slot = slots[key];
      if (slot.parentId === 'main_layout') {
        console.log(`   ${key}: ${slot.type} - "${slot.content || 'no content'}"`);
      }
    });

    // Check root level slots (no parent)
    console.log('');
    console.log('🔍 Root level slots (parentId === null):');
    Object.keys(slots).forEach(key => {
      const slot = slots[key];
      if (slot.parentId === null || slot.parentId === undefined) {
        console.log(`   ${key}: ${slot.type} - "${slot.content || 'no content'}"`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkParentRelationships();