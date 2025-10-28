/**
 * Check the difference between plugins and plugin_registry tables
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

async function checkTables() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking table schemas...\n');

    // 1. Check plugins table
    console.log('📋 plugins table:');
    const pluginsColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'plugins'
      ORDER BY ordinal_position
    `);
    console.log('  Columns:', pluginsColumns.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    const pluginsCount = await client.query('SELECT COUNT(*) FROM plugins');
    console.log(`  Rows: ${pluginsCount.rows[0].count}`);

    // 2. Check plugin_registry table
    console.log('\n📋 plugin_registry table:');
    const registryColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'plugin_registry'
      ORDER BY ordinal_position
    `);
    console.log('  Columns:', registryColumns.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

    const registryCount = await client.query('SELECT COUNT(*) FROM plugin_registry');
    console.log(`  Rows: ${registryCount.rows[0].count}`);

    // 3. Show data from both tables
    console.log('\n📦 plugins table data:');
    const pluginsData = await client.query('SELECT id, name, status, creator_id FROM plugins LIMIT 5');
    pluginsData.rows.forEach(p => {
      console.log(`  - ${p.name} (${p.id}) - ${p.status} - creator: ${p.creator_id}`);
    });

    console.log('\n📦 plugin_registry table data:');
    const registryData = await client.query('SELECT id, name, status, author FROM plugin_registry LIMIT 5');
    registryData.rows.forEach(p => {
      console.log(`  - ${p.name} (${p.id}) - ${p.status} - author: ${p.author}`);
    });

    console.log('\n💡 Conclusion:');
    console.log('  - Frontend "My Plugins" queries: plugins table (has creator_id)');
    console.log('  - Backend /api/plugins/registry/:id queries: plugin_registry table');
    console.log('  - DeveloperPluginEditor uses: plugin_registry');
    console.log('  - plugin_scripts/plugin_events use: plugin_id (can reference either)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
