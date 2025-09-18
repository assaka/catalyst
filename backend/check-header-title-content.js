const { Pool } = require('pg');

async function checkHeaderTitle() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const hamidStoreId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const latestConfigId = 'a8836db6-16be-4067-8694-f6a86cc931b8';

    console.log('🔍 Checking header_title content in published configuration...');
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
      console.log('Raw config:', configResult.rows[0].config_text);
      return;
    }
    console.log(`📋 Configuration ID: ${configResult.rows[0].id}`);
    console.log('');

    // Check for header_title slot
    const headerTitle = config.slots?.header_title || config.header_title;

    if (headerTitle) {
      console.log('✅ header_title slot found:');
      console.log('  Content:', JSON.stringify(headerTitle.content, null, 2));
      console.log('  Type:', headerTitle.type);
      console.log('  Styles:', JSON.stringify(headerTitle.styles, null, 2));
      console.log('  Classes:', headerTitle.className);
    } else {
      console.log('❌ header_title slot not found in configuration');
      console.log('');
      console.log('🔍 Available slots:');
      const slots = config.slots || {};
      Object.keys(slots).forEach(key => {
        if (key.toLowerCase().includes('header') || key.toLowerCase().includes('title')) {
          console.log(`  - ${key}: ${slots[key].content || 'no content'}`);
        }
      });

      // Check if there are any slots with 'My Cart' content
      console.log('');
      console.log('🔍 Slots containing "My Cart" or "Cart":');
      Object.keys(slots).forEach(key => {
        const content = slots[key].content;
        if (typeof content === 'string' && (content.includes('My Cart') || content.includes('Cart'))) {
          console.log(`  - ${key}: "${content}"`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkHeaderTitle();