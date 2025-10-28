/**
 * Create a simple Cart Test Plugin
 */

const { Pool } = require('pg');
const { randomUUID } = require('crypto');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function createCartTestPlugin() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Cart Test Plugin...\n');

    // Generate UUID for the plugin
    const pluginId = randomUUID();
    console.log(`📋 Plugin ID: ${pluginId}\n`);

    // Get first user for creator_id
    const users = await client.query('SELECT id FROM users LIMIT 1');
    const creatorId = users.rows[0]?.id;

    // 1. Create plugin_registry entry
    console.log('📋 Creating plugin_registry entry...');
    await client.query(`
      INSERT INTO plugin_registry (
        id, name, slug, version, description, type, category, author, status,
        creator_id, is_installed, is_enabled,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    `, [
      pluginId,
      'Cart Test',
      'cart-test',
      '1.0.0',
      'Test plugin that shows an alert when visiting the cart page',
      'utility',
      'testing',
      'System',
      'active',
      creatorId,
      true,
      true
    ]);
    console.log('  ✅ plugin_registry entry created');

    // 2. Create cart.viewed event listener
    console.log('\n📡 Creating cart.viewed event listener...');
    await client.query(`
      INSERT INTO plugin_events (plugin_id, event_name, listener_function, priority, is_enabled)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      pluginId,
      'cart.viewed',
      `export default function onCartViewed(data) {
  console.log('🧪 Cart Test Plugin: Cart viewed!', data);

  // Get cart info
  const itemCount = data?.items?.length || 0;
  const subtotal = data?.subtotal || 0;
  const total = data?.total || 0;

  // Show alert after a short delay
  setTimeout(() => {
    alert(
      '🧪 Cart Test Plugin\\n' +
      '==================\\n\\n' +
      'Cart page opened!\\n\\n' +
      'Items: ' + itemCount + '\\n' +
      'Subtotal: $' + subtotal.toFixed(2) + '\\n' +
      'Total: $' + total.toFixed(2)
    );
  }, 500);
}`,
      10,
      true
    ]);
    console.log('  ✅ Event listener created');

    // 3. Create a simple widget component
    console.log('\n📜 Creating widget component...');
    await client.query(`
      INSERT INTO plugin_scripts (
        plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      pluginId,
      'components/CartTestWidget.jsx',
      `export default function CartTestWidget() {
  return (
    <div style={{
      padding: '20px',
      background: '#fef3c7',
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      margin: '16px',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>
        🧪 Cart Test Plugin
      </h3>
      <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
        This plugin shows an alert when you visit the cart page
      </p>
    </div>
  );
}`,
      'js',
      'frontend',
      0,
      true
    ]);
    console.log('  ✅ Widget component created');

    // 4. Create README
    console.log('\n📄 Creating README...');
    await client.query(`
      INSERT INTO plugin_scripts (
        plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      pluginId,
      'README.md',
      `# Cart Test Plugin

A simple test plugin to verify the cart alert functionality.

## Features

- Listens to \`cart.viewed\` event
- Shows popup with cart information:
  - Item count
  - Subtotal
  - Total amount
- Displays a test widget

## Files

- \`events/cart.viewed.js\` - Event listener
- \`components/CartTestWidget.jsx\` - React widget
- \`README.md\` - This file

## Usage

1. Navigate to the cart page
2. Alert will appear after 0.5 seconds
3. Check browser console for debug logs

## Testing

This plugin is for testing the database-driven plugin system.
`,
      'js',
      'frontend',
      1,
      true
    ]);
    console.log('  ✅ README created');

    // 5. Verify creation
    console.log('\n🔍 Verifying plugin...');

    const plugin = await client.query(`
      SELECT id, name, slug, status, is_enabled, creator_id
      FROM plugin_registry
      WHERE id = $1
    `, [pluginId]);

    if (plugin.rows.length > 0) {
      const p = plugin.rows[0];
      console.log(`  ✅ Plugin: ${p.name}`);
      console.log(`     ID: ${p.id}`);
      console.log(`     Slug: ${p.slug}`);
      console.log(`     Status: ${p.status}`);
      console.log(`     Enabled: ${p.is_enabled}`);
      console.log(`     Creator: ${p.creator_id}`);
    }

    const events = await client.query(`
      SELECT event_name, priority FROM plugin_events WHERE plugin_id = $1
    `, [pluginId]);
    console.log(`  ✅ Events: ${events.rows.length}`);
    events.rows.forEach(e => {
      console.log(`     - ${e.event_name} (priority: ${e.priority})`);
    });

    const scripts = await client.query(`
      SELECT file_name, scope FROM plugin_scripts WHERE plugin_id = $1
    `, [pluginId]);
    console.log(`  ✅ Scripts: ${scripts.rows.length}`);
    scripts.rows.forEach(s => {
      console.log(`     - ${s.file_name} (${s.scope})`);
    });

    console.log('\n✅ Cart Test Plugin created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Refresh AI Studio plugins page');
    console.log('  2. Find "Cart Test" in My Plugins');
    console.log('  3. Click Edit to open in DeveloperPluginEditor');
    console.log('  4. Verify FileTree shows:');
    console.log('     - events/cart.viewed.js');
    console.log('     - components/CartTestWidget.jsx');
    console.log('     - README.md');
    console.log('     - manifest.json');
    console.log('  5. Navigate to /cart to test the alert');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createCartTestPlugin();
