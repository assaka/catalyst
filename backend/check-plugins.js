const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPlugins() {
  const client = await pool.connect();

  console.log('=== File-based Plugins (plugins table) ===\n');
  const filePlugins = await client.query(`
    SELECT id, name, status, is_enabled,
           manifest->>'version' as version,
           manifest->>'adminNavigation' as admin_nav
    FROM plugins
    ORDER BY name
  `);

  if (filePlugins.rows.length === 0) {
    console.log('  No plugins found in plugins table');
  } else {
    filePlugins.rows.forEach(p => {
      const status = p.is_enabled ? '✅ ACTIVE' : '⏸️  INACTIVE';
      console.log(`${status} | ${p.name} (v${p.version || '?'})`);
      console.log(`         Status: ${p.status}, ID: ${p.id}`);
      if (p.admin_nav) {
        const navPreview = p.admin_nav.length > 100 ? p.admin_nav.substring(0, 100) + '...' : p.admin_nav;
        console.log(`         Admin Nav: ${navPreview}`);
      }
      console.log('');
    });
  }

  console.log('\n=== Plugin Registry (plugin_registry table) ===\n');
  const regPlugins = await client.query(`
    SELECT id, name, status,
           manifest->>'version' as version,
           manifest->>'adminNavigation' as admin_nav
    FROM plugin_registry
    ORDER BY name
  `);

  if (regPlugins.rows.length === 0) {
    console.log('  No plugins found in plugin_registry table');
  } else {
    regPlugins.rows.forEach(p => {
      const status = p.status === 'active' ? '✅ ACTIVE' : '⏸️  INACTIVE';
      console.log(`${status} | ${p.name} (v${p.version || '?'})`);
      console.log(`         Status: ${p.status}, ID: ${p.id}`);
      if (p.admin_nav) {
        const navPreview = p.admin_nav.length > 100 ? p.admin_nav.substring(0, 100) + '...' : p.admin_nav;
        console.log(`         Admin Nav: ${navPreview}`);
      }
      console.log('');
    });
  }

  await pool.end();
}

checkPlugins().catch(console.error);
