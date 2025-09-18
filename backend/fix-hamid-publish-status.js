const { Pool } = require('pg');

async function fixPublishStatus() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const latestConfigId = 'a8836db6-16be-4067-8694-f6a86cc931b8';

    console.log('🔧 Fixing publish status for latest Hamid cart configuration...');
    console.log(`Store ID: ${hamidStoreId}`);
    console.log(`Config ID: ${latestConfigId}`);
    console.log('');

    // Update the published_at timestamp for the latest config
    const updateResult = await pool.query(`
      UPDATE slot_configurations
      SET published_at = NOW()
      WHERE id = $1
        AND store_id = $2
        AND status = 'published';
    `, [latestConfigId, hamidStoreId]);

    console.log(`✅ Updated ${updateResult.rowCount} configuration(s)`);

    // Verify the fix
    const verifyResult = await pool.query(`
      SELECT id, status, version_number, created_at, published_at
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = 'cart'
      ORDER BY created_at DESC;
    `, [hamidStoreId]);

    console.log('');
    console.log('📋 Current cart configurations after fix:');
    verifyResult.rows.forEach((row, idx) => {
      console.log(`Configuration ${idx + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Version: ${row.version_number}`);
      console.log(`  Created: ${row.created_at}`);
      console.log(`  Published: ${row.published_at || 'Not published'}`);
      console.log('');
    });

    // Check which config will be loaded by cart
    const cartConfigResult = await pool.query(`
      SELECT id, version_number
      FROM slot_configurations
      WHERE store_id = $1
        AND page_type = 'cart'
        AND status = 'published'
        AND published_at IS NOT NULL
      ORDER BY version_number DESC
      LIMIT 1;
    `, [hamidStoreId]);

    if (cartConfigResult.rows.length > 0) {
      console.log(`🎯 Cart will now load configuration:`, cartConfigResult.rows[0].id);
      console.log(`   Version: ${cartConfigResult.rows[0].version_number}`);
    } else {
      console.log('❌ No valid published configuration found for cart');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixPublishStatus();