/**
 * Drop and recreate plugin_admin_pages and plugin_admin_scripts tables
 * with correct plugin_id type (VARCHAR to match plugin_scripts)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function fixTables() {
  const client = await pool.connect();

  try {
    console.log('📋 Fixing plugin_admin tables schema...\n');

    // Drop existing tables
    console.log('🗑️  Dropping existing tables...');
    await client.query('DROP TABLE IF EXISTS plugin_admin_scripts CASCADE');
    await client.query('DROP TABLE IF EXISTS plugin_admin_pages CASCADE');
    console.log('✅ Tables dropped');

    // Recreate with correct schema
    console.log('\n🔨 Recreating tables with correct schema...');
    const sqlPath = path.join(__dirname, 'migrations', 'add-plugin-admin-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('✅ Tables recreated successfully!');
    console.log('\n📊 Schema:');
    console.log('  - plugin_admin_pages.plugin_id: VARCHAR(255)');
    console.log('  - plugin_admin_scripts.plugin_id: VARCHAR(255)');
    console.log('\n💡 Matches plugin_scripts.plugin_id format for consistency');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
