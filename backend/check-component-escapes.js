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
  const page = await client.query('SELECT component_code FROM plugin_admin_pages WHERE page_key = $1 AND plugin_id = $2', ['emails', '4eb11832-5429-4146-af06-de86d319a0e5']);
  const code = page.rows[0]?.component_code || '';

  console.log('Checking for problematic escape sequences...\n');

  // Check for triple-escaped things
  if (code.includes('\\\\\\`')) {
    console.log('⚠️ Found: \\\\\\` (triple-escaped backtick)');
  }
  if (code.includes('\\\\\\$')) {
    console.log('⚠️ Found: \\\\\\$ (triple-escaped dollar)');
  }
  if (code.includes('\\\\n')) {
    console.log('⚠️ Found: \\\\n (escaped newline)');
  }

  // Show problematic sections
  console.log('\nSearching for template literals...');
  const templateMatches = code.match(/console\.log\([^)]{0,150}\)/g);
  if (templateMatches) {
    console.log('\nFound console.log statements with potential issues:');
    templateMatches.slice(0, 3).forEach((match, i) => {
      console.log(`${i + 1}. ${match.substring(0, 100)}`);
    });
  }

  client.release();
  await pool.end();
})();
