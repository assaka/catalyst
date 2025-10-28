/**
 * Create Cart Hamid Plugin
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

async function createCartHamidPlugin() {
  const client = await pool.connect();

  try {
    console.log('🚀 Creating Cart Hamid Plugin...\n');

    // Generate UUID
    const pluginId = randomUUID();
    console.log(`📋 Plugin ID: ${pluginId}\n`);

    // Get user by email
    const user = await client.query(`
      SELECT id FROM users WHERE email = 'info@itomoti.com'
    `);

    if (user.rows.length === 0) {
      console.log('❌ User info@itomoti.com not found!');
      return;
    }

    const creatorId = user.rows[0].id;
    console.log(`📋 Creator ID: ${creatorId}\n`);

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
      'Cart Hamid',
      'cart-hamid',
      '1.0.0',
      'Cart alert plugin created by Hamid - shows a personalized alert on cart page',
      'utility',
      'testing',
      'Hamid',
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
  console.log('👋 Cart Hamid Plugin: Hello from Hamid!', data);

  // Get cart details
  const itemCount = data?.items?.length || 0;
  const subtotal = data?.subtotal || 0;
  const total = data?.total || 0;

  // Show personalized alert
  setTimeout(() => {
    alert(
      '👋 Hello from Hamid!\\n' +
      '===================\\n\\n' +
      'Welcome to your cart!\\n\\n' +
      '🛒 Items: ' + itemCount + '\\n' +
      '💰 Subtotal: $' + subtotal.toFixed(2) + '\\n' +
      '💳 Total: $' + total.toFixed(2) + '\\n\\n' +
      'Thank you for testing! 😊'
    );
  }, 500);
}`,
      10,
      true
    ]);
    console.log('  ✅ Event listener created');

    // 3. Create widget component
    console.log('\n📜 Creating widget component...');
    await client.query(`
      INSERT INTO plugin_scripts (
        plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      pluginId,
      'components/CartHamidWidget.jsx',
      `export default function CartHamidWidget() {
  const [visitCount, setVisitCount] = React.useState(0);

  React.useEffect(() => {
    // Track cart visits
    const handleCartView = () => {
      setVisitCount(prev => prev + 1);
    };

    window.addEventListener('cart-viewed', handleCartView);
    return () => window.removeEventListener('cart-viewed', handleCartView);
  }, []);

  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid #5a67d8',
      borderRadius: '12px',
      margin: '16px',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
        👋 Cart Hamid Plugin
      </h3>
      <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
        Created by Hamid • Cart visits: <strong>{visitCount}</strong>
      </p>
      <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.8 }}>
        Testing database-driven plugin system ✨
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
      `# Cart Hamid Plugin

A personalized cart alert plugin created by Hamid.

## Features

- 👋 Shows personalized greeting when cart page is visited
- 🛒 Displays cart item count
- 💰 Shows subtotal and total amounts
- ✨ Beautiful gradient widget with visit counter
- 📊 Console logging for debugging

## Files

- \`events/cart.viewed.js\` - Event listener for cart page
- \`components/CartHamidWidget.jsx\` - React widget component
- \`README.md\` - This documentation

## How It Works

1. Listens to \`cart.viewed\` event
2. Collects cart data (items, subtotal, total)
3. Shows alert popup with personalized message
4. Tracks cart visit count in widget

## Testing

1. Navigate to /cart page
2. Alert should appear after 0.5 seconds
3. Widget shows visit count
4. Check browser console for logs

## Author

Created by Hamid for testing the database-driven plugin system.
`,
      'js',
      'frontend',
      1,
      true
    ]);
    console.log('  ✅ README created');

    // 5. Create a helper utility file
    console.log('\n📦 Creating utility file...');
    await client.query(`
      INSERT INTO plugin_scripts (
        plugin_id, file_name, file_content, script_type, scope, load_priority, is_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      pluginId,
      'utils/formatters.js',
      `// Cart Hamid Plugin - Utility Functions

export function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

export function formatItemCount(count) {
  if (count === 0) return 'No items';
  if (count === 1) return '1 item';
  return count + ' items';
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

console.log('✅ Cart Hamid utilities loaded');
`,
      'js',
      'frontend',
      0,
      true
    ]);
    console.log('  ✅ Utility file created');

    // 6. Verify creation
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
      SELECT file_name, scope FROM plugin_scripts WHERE plugin_id = $1 ORDER BY file_name
    `, [pluginId]);
    console.log(`  ✅ Scripts: ${scripts.rows.length}`);
    scripts.rows.forEach(s => {
      console.log(`     - ${s.file_name} (${s.scope})`);
    });

    console.log('\n✅ Cart Hamid Plugin created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Refresh AI Studio plugins page');
    console.log('  2. Find "Cart Hamid" in My Plugins');
    console.log('  3. Click Edit to open in DeveloperPluginEditor');
    console.log('  4. Verify FileTree shows:');
    console.log('     - events/cart_viewed.js');
    console.log('     - components/CartHamidWidget.jsx');
    console.log('     - utils/formatters.js');
    console.log('     - README.md');
    console.log('     - manifest.json');
    console.log('  5. Navigate to /cart to test the alert');
    console.log('  6. Look for the gradient purple widget!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createCartHamidPlugin();
