const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function checkSchema() {
  const tables = ['plugin_scripts', 'plugin_hooks', 'plugin_events', 'plugin_data', 'plugin_dependencies'];

  for (const tableName of tables) {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    console.log(`\n${tableName}:`);
    if (result.rows.length === 0) {
      console.log('  (table does not exist)');
    } else {
      result.rows.forEach(row => {
        console.log(`  ${row.column_name} -> ${row.data_type}`);
      });
    }
  }

  await pool.end();
}

checkSchema().catch(console.error);
