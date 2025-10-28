/**
 * Add starter template support to plugin system
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

async function addStarterTemplateSupport() {
  const client = await pool.connect();

  try {
    console.log('🚀 Adding starter template support...\n');

    // 1. Add is_starter_template column
    console.log('📋 Adding is_starter_template column...');
    try {
      await client.query(`
        ALTER TABLE plugin_registry
        ADD COLUMN IF NOT EXISTS is_starter_template BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS starter_icon VARCHAR(10),
        ADD COLUMN IF NOT EXISTS starter_description TEXT,
        ADD COLUMN IF NOT EXISTS starter_prompt TEXT,
        ADD COLUMN IF NOT EXISTS starter_order INTEGER DEFAULT 0
      `);
      console.log('  ✅ Columns added');
    } catch (error) {
      console.log('  ⚠️  Columns may already exist:', error.message);
    }

    // 2. Mark Cart Hamid as starter template
    console.log('\n🛒 Marking Cart Hamid as starter template...');
    await client.query(`
      UPDATE plugin_registry
      SET
        is_starter_template = true,
        starter_icon = '🛒',
        starter_description = 'Shows alerts and widgets on cart page with utility functions',
        starter_prompt = 'Create a plugin like this one that shows an alert when visiting the cart page, includes a widget with visit counter, and uses utility functions for formatting. Make it customizable.',
        starter_order = 1
      WHERE name = 'Cart Hamid'
    `);
    console.log('  ✅ Cart Hamid marked as starter');

    // 3. Verify
    console.log('\n🔍 Verifying...');
    const starters = await client.query(`
      SELECT name, is_starter_template, starter_icon, starter_description, starter_order
      FROM plugin_registry
      WHERE is_starter_template = true
      ORDER BY starter_order ASC
    `);

    console.log(`  ✅ Found ${starters.rows.length} starter templates:`);
    starters.rows.forEach(s => {
      console.log(`     ${s.starter_icon} ${s.name} (order: ${s.starter_order})`);
      console.log(`        ${s.starter_description}`);
    });

    console.log('\n✅ Starter template support added!');
    console.log('\n📋 Next steps:');
    console.log('   1. Create GET /api/plugins/starters endpoint');
    console.log('   2. Update ChatInterface to load from API');
    console.log('   3. Test in AI Studio');
    console.log('   4. Add UI to mark/unmark plugins as starters');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addStarterTemplateSupport();
