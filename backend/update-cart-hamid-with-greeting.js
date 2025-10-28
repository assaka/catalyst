/**
 * Update Cart Hamid plugin to use getGreeting() from formatters.js
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

async function updateCartHamid() {
  const client = await pool.connect();

  try {
    console.log('🔄 Updating Cart Hamid plugin...\n');

    const pluginId = 'eea24e22-7bc7-457e-8403-df53758ebf76';

    // 1. Update formatters.js to export to window
    console.log('📝 Updating formatters.js to export to window...');

    const formattersCode = `// Cart Hamid Plugin - Utility Functions

function formatCurrency(amount) {
  return '$' + Number(amount).toFixed(2);
}

function formatItemCount(count) {
  if (count === 0) return 'No items';
  if (count === 1) return '1 item';
  return count + ' items';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Export to window so other plugin files can use it
window.CartHamidUtils = {
  formatCurrency,
  formatItemCount,
  getGreeting
};

console.log('✅ Cart Hamid utilities loaded and exported to window.CartHamidUtils');
`;

    await client.query(`
      UPDATE plugin_scripts
      SET file_content = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND file_name = 'utils/formatters.js'
    `, [formattersCode, pluginId]);

    console.log('  ✅ formatters.js updated');

    // 2. Update cart.viewed event to use getGreeting()
    console.log('\n📝 Updating cart.viewed event to use getGreeting()...');

    const eventCode = `export default function onCartViewed(data) {
  console.log('👋 Cart Hamid Plugin: Hello from Hamid!', data);

  // Use utilities from formatters.js
  const utils = window.CartHamidUtils;

  // Get cart details
  const itemCount = data?.items?.length || 0;
  const subtotal = data?.subtotal || 0;
  const total = data?.total || 0;

  // Show personalized alert with greeting
  setTimeout(() => {
    const greeting = utils ? utils.getGreeting() : 'Hello';
    const itemText = utils ? utils.formatItemCount(itemCount) : itemCount + ' items';
    const totalText = utils ? utils.formatCurrency(total) : '$' + total.toFixed(2);

    alert(
      greeting + ', Hamid! 👋\\n' +
      '===================\\n\\n' +
      'Welcome to your cart!\\n\\n' +
      '🛒 ' + itemText + '\\n' +
      '💰 Subtotal: $' + subtotal.toFixed(2) + '\\n' +
      '💳 Total: ' + totalText + '\\n\\n' +
      'Thank you for testing! 😊'
    );
  }, 500);
}`;

    await client.query(`
      UPDATE plugin_events
      SET listener_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND event_name = 'cart.viewed'
    `, [eventCode, pluginId]);

    console.log('  ✅ cart.viewed event updated');

    console.log('\n✅ Cart Hamid plugin updated successfully!');
    console.log('\n📋 What changed:');
    console.log('  1. formatters.js now exports to window.CartHamidUtils');
    console.log('  2. cart.viewed event now uses:');
    console.log('     - utils.getGreeting() → "Good morning/afternoon/evening"');
    console.log('     - utils.formatItemCount() → "1 item" / "5 items"');
    console.log('     - utils.formatCurrency() → "$12.99"');
    console.log('\n🧪 Test:');
    console.log('  1. Navigate to /cart');
    console.log('  2. Alert should now show time-based greeting!');
    console.log('  3. Check console for utility load confirmation');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCartHamid();
