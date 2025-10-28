/**
 * Create a new Cart Alert plugin with matching IDs
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

async function createCartAlertPlugin() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Cart Alert plugin...\n');

    // Generate a proper UUID for plugin_registry
    const { randomUUID } = require('crypto');
    const pluginId = randomUUID();

    console.log(`📋 Generated UUID: ${pluginId}\n`);

    // 1. Create plugin_registry entry
    console.log('📋 Creating plugin_registry entry...');
    await client.query(`
      INSERT INTO plugin_registry (id, name, version, description, type, category, author, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          version = EXCLUDED.version,
          description = EXCLUDED.description,
          updated_at = NOW()
    `, [
      pluginId,
      'Cart Alert',
      '1.0.0',
      'Shows an alert when you visit the cart page',
      'utility',
      'utility',
      'System',
      'active'
    ]);
    console.log('  ✅ plugin_registry entry created');

    // 2. Create event listener
    console.log('\n📡 Creating cart.viewed event listener...');
    await client.query(`
      INSERT INTO plugin_events (plugin_id, event_name, listener_function, priority, is_enabled)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [
      pluginId,
      'cart.viewed',
      `export default function onCartViewed(data) {
  console.log('🛒 Cart Alert Plugin: Cart page visited!', data);

  const itemCount = data?.items?.length || 0;
  const total = data?.total || 0;

  setTimeout(() => {
    alert(\`🛒 Cart Alert Plugin\\n\\nYou are viewing the cart page!\\n\\nItems: \${itemCount}\\nTotal: $\${total.toFixed(2)}\`);
  }, 500);
}`,
      10,
      true
    ]);
    console.log('  ✅ Event listener created');

    // 3. Create widget component
    console.log('\n📜 Creating widget component...');
    await client.query(`
      INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [
      pluginId,
      'components/CartAlertWidget.jsx',
      `export default function CartAlertWidget() {
  const [alertCount, setAlertCount] = React.useState(0);

  React.useEffect(() => {
    // Count how many times cart was viewed
    const handleCartView = () => {
      setAlertCount(prev => prev + 1);
    };

    window.addEventListener('cart-viewed', handleCartView);
    return () => window.removeEventListener('cart-viewed', handleCartView);
  }, []);

  return (
    <div style={{
      padding: '16px',
      background: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      margin: '16px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
        🛒 Cart Alert Widget
      </h3>
      <p style={{ margin: 0, fontSize: '14px' }}>
        Cart viewed <strong>{alertCount}</strong> times this session
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
      INSERT INTO plugin_scripts (plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [
      pluginId,
      'README.md',
      `# Cart Alert Plugin

A simple plugin that shows an alert when you visit the cart page.

## Features

- Listens to \`cart.viewed\` event
- Shows popup with cart item count and total
- Displays a widget showing how many times cart was viewed

## Files

- \`events/cart.viewed.js\` - Event listener that triggers on cart page
- \`components/CartAlertWidget.jsx\` - React widget component
- \`README.md\` - This file

## Installation

Plugin is automatically active when enabled.

## Usage

Simply navigate to the cart page to see the alert!
`,
      'js',
      'frontend',
      0,
      true
    ]);
    console.log('  ✅ README created');

    // 5. Verify creation
    console.log('\n🔍 Verifying plugin...');

    const plugin = await client.query(`
      SELECT * FROM plugin_registry WHERE id = $1
    `, [pluginId]);
    console.log(`  ✅ plugin_registry: ${plugin.rows[0].name} (${plugin.rows[0].status})`);

    const events = await client.query(`
      SELECT COUNT(*) as count FROM plugin_events WHERE plugin_id = $1
    `, [pluginId]);
    console.log(`  ✅ plugin_events: ${events.rows[0].count} events`);

    const scripts = await client.query(`
      SELECT COUNT(*) as count FROM plugin_scripts WHERE plugin_id = $1
    `, [pluginId]);
    console.log(`  ✅ plugin_scripts: ${scripts.rows[0].count} files`);

    console.log('\n✅ Cart Alert plugin created successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Refresh the AI Studio plugins page');
    console.log('  2. Open "Cart Alert" plugin in the editor');
    console.log('  3. Check if files appear in the FileTree');
    console.log('  4. Navigate to /cart to see the alert');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createCartAlertPlugin();
