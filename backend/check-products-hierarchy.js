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

  const result = await client.query(`
    SELECT key, label, parent_key, order_position, is_core
    FROM admin_navigation_registry
    WHERE key IN ('catalog', 'products') OR parent_key IN ('catalog', 'products')
    ORDER BY order_position ASC
  `);

  console.log('Catalog and Products hierarchy:\n');
  result.rows.forEach(item => {
    let indent = '';
    if (item.parent_key === 'catalog') indent = '  ├─ ';
    else if (item.parent_key === 'products') indent = '    └─ ';

    const parentStr = item.parent_key || 'TOP-LEVEL';
    console.log(indent + item.key + ' (pos:' + item.order_position + ', parent:' + parentStr + ')');
  });

  client.release();
  await pool.end();
})();
