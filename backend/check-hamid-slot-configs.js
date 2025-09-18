const { Pool } = require('pg');

async function checkSlotConfigs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';

    console.log('🔍 Checking slot configurations for Hamid store...');
    console.log(`Store ID: ${hamidStoreId}`);
    console.log('');

    // Check cart configurations
    const cartResult = await pool.query(`
      SELECT id, store_id, page_type, status, version_number, created_at, published_at,
             CASE
               WHEN LENGTH(configuration::text) > 200 THEN LEFT(configuration::text, 200) || '...'
               ELSE configuration::text
             END as config_preview
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = $2
      ORDER BY created_at DESC;
    `, [hamidStoreId, 'cart']);

    console.log('📋 Cart Configurations:');
    console.log(`Total found: ${cartResult.rows.length}`);
    console.log('');

    if (cartResult.rows.length === 0) {
      console.log('❌ No cart configurations found');
    } else {
      cartResult.rows.forEach((row, idx) => {
        console.log(`Configuration ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Version: ${row.version_number}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Published: ${row.published_at || 'Not published'}`);
        console.log(`  Config Preview: ${row.config_preview}`);
        console.log('');
      });
    }

    // Check all configurations for this store
    const allConfigResult = await pool.query(`
      SELECT page_type, status, COUNT(*) as count, MAX(created_at) as latest
      FROM slot_configurations
      WHERE store_id = $1
      GROUP BY page_type, status
      ORDER BY page_type, status;
    `, [hamidStoreId]);

    console.log('📊 All Configurations for this store:');
    if (allConfigResult.rows.length === 0) {
      console.log('❌ No slot configurations found for this store at all');
    } else {
      allConfigResult.rows.forEach(row => {
        console.log(`  ${row.page_type} (${row.status}): ${row.count} configs, latest: ${row.latest}`);
      });
    }

    // Check specifically for published cart config
    const publishedCartResult = await pool.query(`
      SELECT id, configuration::text as full_config
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = $2
        AND status = 'published'
      ORDER BY version_number DESC
      LIMIT 1;
    `, [hamidStoreId, 'cart']);

    console.log('');
    console.log('🎯 Current Published Cart Configuration:');
    if (publishedCartResult.rows.length === 0) {
      console.log('❌ No published cart configuration found');
    } else {
      const config = publishedCartResult.rows[0];
      console.log(`  Config ID: ${config.id}`);
      console.log(`  Full Configuration:`);

      try {
        const parsed = JSON.parse(config.full_config);
        console.log('  Configuration structure:');
        console.log('    - slots:', Object.keys(parsed.slots || {}));
        console.log('    - metadata:', parsed.metadata ? 'present' : 'missing');

        // Check for specific cart slots
        const importantSlots = ['emptyCart.title', 'emptyCart.text', 'emptyCart.button', 'cartItems', 'orderSummary'];
        importantSlots.forEach(slot => {
          if (parsed.slots && parsed.slots[slot]) {
            console.log(`    - ${slot}:`, parsed.slots[slot].content ? 'has content' : 'no content');
          } else if (parsed[slot]) {
            console.log(`    - ${slot}:`, parsed[slot].content ? 'has content' : 'no content');
          }
        });
      } catch (e) {
        console.log('  ⚠️ Configuration is not valid JSON');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSlotConfigs();