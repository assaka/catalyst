const { Pool } = require('pg');

async function checkEmptyCartViewMode() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log('🔍 Checking emptyCart viewMode slots...');
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

    console.log(`📊 Total slots: ${Object.keys(slots).length}`);
    console.log('');

    // Check viewMode distribution
    const viewModeStats = {};
    const rootSlots = [];
    const emptyCartSlots = [];

    Object.keys(slots).forEach(key => {
      const slot = slots[key];

      // Track viewMode stats
      if (slot.viewMode && Array.isArray(slot.viewMode)) {
        slot.viewMode.forEach(mode => {
          viewModeStats[mode] = (viewModeStats[mode] || 0) + 1;
        });
      } else {
        viewModeStats['no-viewMode'] = (viewModeStats['no-viewMode'] || 0) + 1;
      }

      // Track root slots (parentId === null)
      if (slot.parentId === null || slot.parentId === undefined) {
        rootSlots.push(slot);
      }

      // Track emptyCart slots
      if (slot.viewMode && slot.viewMode.includes('emptyCart')) {
        emptyCartSlots.push(slot);
      }
    });

    console.log('📊 ViewMode Statistics:');
    Object.keys(viewModeStats).forEach(mode => {
      console.log(`  ${mode}: ${viewModeStats[mode]} slots`);
    });

    console.log('');
    console.log(`🌳 Root slots (parentId === null): ${rootSlots.length}`);
    rootSlots.forEach(slot => {
      const viewModeStr = slot.viewMode ? `[${slot.viewMode.join(', ')}]` : 'no viewMode';
      console.log(`  - ${slot.id}: ${slot.type} ${viewModeStr}`);
    });

    console.log('');
    console.log(`🌱 EmptyCart viewMode slots: ${emptyCartSlots.length}`);
    emptyCartSlots.forEach(slot => {
      const parentStr = slot.parentId || 'null';
      console.log(`  - ${slot.id}: ${slot.type} (parent: ${parentStr})`);
      console.log(`    viewMode: [${slot.viewMode.join(', ')}]`);
      console.log(`    content: "${slot.content || 'no content'}"`);
    });

    // Check for empty cart related slots without viewMode
    console.log('');
    console.log('🔍 Empty cart related slots (regardless of viewMode):');
    Object.keys(slots).forEach(key => {
      const slot = slots[key];
      if (key.includes('empty') || (slot.content && slot.content.toLowerCase().includes('empty'))) {
        const viewModeStr = slot.viewMode ? `[${slot.viewMode.join(', ')}]` : 'no viewMode';
        const parentStr = slot.parentId || 'null';
        console.log(`  - ${key}: ${slot.type} ${viewModeStr} (parent: ${parentStr})`);
        console.log(`    content: "${slot.content || 'no content'}"`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmptyCartViewMode();