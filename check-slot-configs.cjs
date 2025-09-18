const { Pool } = require('pg');

async function checkSlotConfigs() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(`
      SELECT id, store_id, page_type, status, version_number, created_at, published_at,
             CASE
               WHEN LENGTH(configuration::text) > 200 THEN LEFT(configuration::text, 200) || '...'
               ELSE configuration::text
             END as config_preview
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = $2
      ORDER BY created_at DESC;
    `, ['157d4590-49bf-4b0b-bd77-abe131909528', 'cart']);

    console.log('📋 Slot Configurations for Hamid store (cart page):');
    console.log('Total configurations found:', result.rows.length);
    console.log('');

    if (result.rows.length === 0) {
      console.log('❌ No slot configurations found for this store/page combination');

      // Check if there are any configurations for this store at all
      const anyConfigResult = await pool.query(`
        SELECT page_type, status, COUNT(*) as count
        FROM slot_configurations
        WHERE store_id = $1
        GROUP BY page_type, status
        ORDER BY page_type, status;
      `, ['157d4590-49bf-4b0b-bd77-abe131909528']);

      if (anyConfigResult.rows.length > 0) {
        console.log('🔍 Other configurations found for this store:');
        anyConfigResult.rows.forEach(row => {
          console.log(`  ${row.page_type} (${row.status}): ${row.count} configs`);
        });
      } else {
        console.log('❌ No slot configurations found for this store at all');
      }
    } else {
      result.rows.forEach((row, idx) => {
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSlotConfigs();