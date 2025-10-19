const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function check() {
  const result = await pool.query(
    'SELECT file_name, file_content FROM plugin_scripts WHERE plugin_id = $1 ORDER BY load_priority',
    ['customer-service-chat']
  );

  console.log('\n📄 Stored Scripts:\n');

  for (const script of result.rows) {
    console.log(`${'='.repeat(60)}`);
    console.log(`File: ${script.file_name}`);
    console.log(`${'='.repeat(60)}`);
    console.log('First 500 characters:');
    console.log(script.file_content.substring(0, 500));
    console.log('...\n');
  }

  await pool.end();
}

check().catch(console.error);
