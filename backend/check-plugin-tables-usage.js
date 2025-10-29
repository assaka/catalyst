const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function checkUsage() {
  const tables = [
    'plugin_registry',
    'plugin_scripts',
    'plugin_hooks',
    'plugin_events',
    'plugin_dependencies',
    'plugin_data',
    'plugin_controllers',
    'plugin_execution_logs',
    'plugin_store_config',
    'plugin_licenses',
    'plugin_marketplace',
    'plugin_versions',
    'plugin_widgets',
    'plugins',
    'store_plugins'
  ];

  console.log('📊 Checking plugin table usage...\n');

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      const status = count > 0 ? '✅ IN USE' : '⚠️  EMPTY';
      console.log(`${status.padEnd(12)} ${table.padEnd(30)} ${count} rows`);
    } catch (error) {
      console.log(`❌ MISSING   ${table.padEnd(30)} (does not exist)`);
    }
  }

  await pool.end();
}

checkUsage().catch(console.error);
