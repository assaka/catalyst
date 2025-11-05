/**
 * Clean up plugin architecture
 * - Drop obsolete tables
 * - Drop backward compatibility columns (source_code, config)
 * - Keep only normalized architecture
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

async function cleanup() {
  const client = await pool.connect();

  try {
    console.log('🧹 Cleaning up plugin architecture...\n');

    // 1. Drop obsolete tables
    const tablesToDrop = [
      'plugin_controllers',
      'plugin_execution_logs',
      'plugin_store_config',
      'plugin_licenses',
      'plugin_marketplace',
      'plugin_versions',
      'plugin_widgets',
      'plugins'
    ];

    console.log('📦 Dropping obsolete tables...');
    for (const table of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`  ✅ Dropped ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${table}: ${error.message}`);
      }
    }

    // 2. Drop backward compatibility columns from plugin_registry
    console.log('\n📝 Dropping backward compatibility columns from plugin_registry...');

    const columnsToDrop = ['source_code', 'config', 'compiled_code'];

    for (const column of columnsToDrop) {
      try {
        await client.query(`
          ALTER TABLE plugin_registry
          DROP COLUMN IF EXISTS ${column}
        `);
        console.log(`  ✅ Dropped column: ${column}`);
      } catch (error) {
        console.log(`  ⚠️  Could not drop ${column}: ${error.message}`);
      }
    }

    // 3. Verify remaining tables
    console.log('\n📊 Remaining plugin tables:');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%plugin%'
      ORDER BY table_name
    `);

    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // 4. Verify plugin_registry columns
    console.log('\n📋 plugin_registry columns:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'plugin_registry'
      ORDER BY ordinal_position
    `);

    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
