const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function fixSchema() {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing plugin table schema mismatches...\n');

    // Drop and recreate tables with correct foreign key types
    const tables = ['plugin_scripts', 'plugin_hooks', 'plugin_events', 'plugin_data'];

    for (const table of tables) {
      console.log(`Fixing ${table}...`);

      // Drop foreign key constraints first
      await client.query(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = '${table}'
            AND constraint_type = 'FOREIGN KEY'
          ) LOOP
            EXECUTE 'ALTER TABLE ${table} DROP CONSTRAINT ' || r.constraint_name;
          END LOOP;
        END $$;
      `);

      // Alter column type
      await client.query(`
        ALTER TABLE ${table}
        ALTER COLUMN plugin_id TYPE VARCHAR(255)
      `);

      // Re-add foreign key
      await client.query(`
        ALTER TABLE ${table}
        ADD CONSTRAINT ${table}_plugin_id_fkey
        FOREIGN KEY (plugin_id)
        REFERENCES plugin_registry(id)
        ON DELETE CASCADE
      `);

      console.log(`  ✅ Fixed ${table}`);
    }

    console.log('\n✅ All tables fixed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
