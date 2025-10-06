const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres'
});

pool.query(
  'SELECT settings FROM stores WHERE id = $1',
  ['157d4590-49bf-4b0b-bd77-abe131909528']
).then(r => {
  console.log('Theme settings in database:');
  console.log(JSON.stringify(r.rows[0].settings.theme, null, 2));
  pool.end();
}).catch(e => {
  console.error(e);
  pool.end();
});
