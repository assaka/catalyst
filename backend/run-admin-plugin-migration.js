/**
 * Run migration to create plugin_admin_pages and plugin_admin_scripts tables
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

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('📋 Running migration: add-plugin-admin-tables.sql\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'add-plugin-admin-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    await client.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('  - plugin_admin_pages (admin UI components)');
    console.log('  - plugin_admin_scripts (admin utilities)');
    console.log('\n💡 Performance architecture:');
    console.log('  Frontend (plugin_scripts): Loads on every page - keep minimal');
    console.log('  Admin (plugin_admin_*): Loads only in admin - can be heavy');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
