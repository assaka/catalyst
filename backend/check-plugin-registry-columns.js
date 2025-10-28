/**
 * Check plugin_registry table columns
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

async function checkColumns() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking plugin_registry columns...\n');

    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'plugin_registry'
      ORDER BY ordinal_position
    `);

    console.log('Columns in plugin_registry:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    const hasSourceCode = columns.rows.some(c => c.column_name === 'source_code');

    console.log(`\n📋 Has source_code column: ${hasSourceCode ? '✅ YES' : '❌ NO'}`);

    if (!hasSourceCode) {
      console.log('\n💡 The source_code column does not exist.');
      console.log('   This is expected - plugin_registry uses normalized tables instead.');
      console.log('   Files come from: plugin_scripts, plugin_events, plugin_hooks');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns();
