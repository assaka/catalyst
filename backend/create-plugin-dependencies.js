const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plugin_dependencies (
      id SERIAL PRIMARY KEY,
      plugin_id VARCHAR(255) REFERENCES plugin_registry(id) ON DELETE CASCADE,
      package_name VARCHAR(255) NOT NULL,
      version VARCHAR(50) NOT NULL,
      bundled_code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(plugin_id, package_name)
    )
  `);

  console.log('✅ plugin_dependencies table created');
  await pool.end();
}

createTable().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
