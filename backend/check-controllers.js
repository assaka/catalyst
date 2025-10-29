const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

(async () => {
  const client = await pool.connect();

  const controllers = await client.query('SELECT plugin_id, controller_name, method, path, description FROM plugin_controllers LIMIT 10');

  console.log('🎮 Registered controllers in plugin_controllers table:\n');
  if (controllers.rows.length === 0) {
    console.log('❌ No controllers found in plugin_controllers table\n');
  } else {
    controllers.rows.forEach((c, i) => {
      console.log(`${i+1}. ${c.method} ${c.path}`);
      console.log(`   Controller: ${c.controller_name}`);
      console.log(`   Description: ${c.description || 'N/A'}`);
      console.log('');
    });
  }

  client.release();
  await pool.end();
})();
