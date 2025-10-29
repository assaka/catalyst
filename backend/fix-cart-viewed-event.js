// Fix cart.viewed event to use correct endpoint URL
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function fixCartViewedEvent() {
  try {
    console.log('🔧 Fixing cart.viewed event to use correct endpoint URL...\n');

    // Update cart.viewed event with correct endpoint
    await sequelize.query(`
      UPDATE plugin_events
      SET listener_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND event_name = 'cart.viewed'
    `, {
      bind: [
        `export default async function onCartViewed(data) {
  console.log('👋 Cart Hamid Plugin: Cart viewed!', data);

  // Track visit to database
  try {
    const visitData = {
      session_id: data.sessionId || 'unknown',
      user_id: data.userId || null,
      cart_items_count: data.items?.length || 0,
      cart_subtotal: data.subtotal || 0,
      cart_total: data.total || 0,
      user_agent: navigator?.userAgent || null,
      referrer_url: document?.referrer || null
    };

    // Use correct plugin ID-based endpoint
    await fetch('/api/plugins/${PLUGIN_ID}/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitData)
    });

    console.log('✅ Cart visit tracked to database');
  } catch (error) {
    console.error('❌ Error tracking cart visit:', error);
  }

  // Show alert with utilities
  const utils = window.CartHamidUtils;
  const itemCount = data?.items?.length || 0;
  const total = data?.total || 0;

  setTimeout(() => {
    const greeting = utils ? utils.getGreeting() : 'Hello';
    const itemText = utils ? utils.formatItemCount(itemCount) : itemCount + ' items';
    const totalText = utils ? utils.formatCurrency(total) : '$' + total.toFixed(2);

    alert(
      greeting + ', Hamid! 👋\\n' +
      '===================\\n\\n' +
      'Cart visit tracked to database!\\n\\n' +
      '🛒 ' + itemText + '\\n' +
      '💳 Total: ' + totalText + '\\n\\n' +
      'Check the admin panel! 📊'
    );
  }, 500);
}`,
        PLUGIN_ID
      ]
    });

    console.log('✅ cart.viewed event updated successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Event: cart.viewed`);
    console.log(`   - Endpoint: /api/plugins/${PLUGIN_ID}/track-visit`);
    console.log(`   - Tracks: session_id, user_id, cart_items_count, cart_subtotal, cart_total`);
    console.log('\n🧪 To test:');
    console.log('   1. Navigate to /cart page');
    console.log('   2. Check console for "Cart visit tracked to database"');
    console.log('   3. Verify data in hamid_cart table');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixCartViewedEvent();
