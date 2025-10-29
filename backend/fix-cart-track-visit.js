/**
 * Fix cart_viewed.js to actually call the trackVisit API
 * Currently it just shows an alert but doesn't insert into hamid_cart table
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

async function fixCartTrackVisit() {
  const client = await pool.connect();

  try {
    const pluginId = 'eea24e22-7bc7-457e-8403-df53758ebf76'; // Cart Alert

    console.log('🔧 Fixing cart_viewed.js to call trackVisit API...\n');

    // Updated event listener that actually tracks visits
    const fixedEventListener = `export default async function onCartViewed(data) {
  console.log('👋 Cart Hamid Plugin: Hello from Hamid!', data);

  // Use utilities from formatters.js
  const utils = window.CartHamidUtils;

  // Get cart details
  const itemCount = data?.items?.length || 0;
  const subtotal = data?.subtotal || 0;
  const total = data?.total || 0;

  // ✅ TRACK VISIT IN DATABASE - 100% Database-Driven
  // Uses dynamic controller execution from plugin_controllers table
  try {
    const pluginId = 'eea24e22-7bc7-457e-8403-df53758ebf76'; // Cart Alert plugin ID
    const response = await fetch(\`/api/plugins/\${pluginId}/exec/track-visit\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cart_items_count: itemCount,
        cart_subtotal: subtotal,
        cart_total: total,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer,
        session_id: sessionStorage.getItem('session_id') || \`session_\${Date.now()}\`
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Cart visit tracked:', result);
    } else {
      console.error('❌ Failed to track visit:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error tracking visit:', error);
  }

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

    // Update the cart_viewed.js event listener
    const result = await client.query(`
      UPDATE plugin_events
      SET listener_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND file_name = $3
    `, [fixedEventListener, pluginId, 'cart_viewed.js']);

    if (result.rowCount > 0) {
      console.log('✅ Updated cart_viewed.js event listener');
      console.log('\n📋 Now it will:');
      console.log('   1. Call POST /api/plugins/cart-hamid/track-visit');
      console.log('   2. Insert data into hamid_cart table');
      console.log('   3. Show the alert popup (as before)');
      console.log('\n🔄 Refresh your app and visit the cart page!');
      console.log('\n📊 Check hamid_cart table to see the tracked visits:');
      console.log('   SELECT * FROM hamid_cart ORDER BY created_at DESC LIMIT 5;');
    } else {
      console.log('❌ Event listener not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCartTrackVisit();
