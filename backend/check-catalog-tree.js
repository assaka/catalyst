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

  // Get catalog, import_export, and all their children
  const result = await client.query(`
    SELECT key, label, parent_key, order_position, is_core
    FROM admin_navigation_registry
    WHERE key IN ('catalog', 'import_export')
       OR parent_key IN ('catalog', 'import_export')
    ORDER BY order_position ASC
  `);

  console.log('\nCatalog and Import/Export hierarchy:\n');

  // Group by parent
  const topLevel = result.rows.filter(r => !r.parent_key);
  const catalogChildren = result.rows.filter(r => r.parent_key === 'catalog');
  const importExportChildren = result.rows.filter(r => r.parent_key === 'import_export');

  topLevel.forEach(item => {
    console.log(item.key + ' (' + item.label + ') - position: ' + item.order_position);

    if (item.key === 'catalog') {
      catalogChildren.forEach(child => {
        console.log('  ├─ ' + child.key + ' (' + child.label + ') - position: ' + child.order_position);
      });
    }

    if (item.key === 'import_export') {
      importExportChildren.forEach(child => {
        console.log('  ├─ ' + child.key + ' (' + child.label + ') - position: ' + child.order_position);
      });
    }
  });

  client.release();
  await pool.end();
})();
