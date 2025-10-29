/**
 * Add example event listeners to Cart Starter template
 * Provides users with reference examples when they clone the plugin
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

async function addExampleEvents() {
  const client = await pool.connect();

  try {
    // Cart Alert starter template ID
    const pluginId = 'eea24e22-7bc7-457e-8403-df53758ebf76';

    console.log('📝 Adding example event listeners to Cart Starter...\n');

    // Example 1: Named function with comprehensive features
    const namedFunctionExample = `export default function onCartViewed(data) {
  // ✅ EXAMPLE: Named function for better debugging
  // The function name appears in error stack traces!

  console.log('🛒 Cart Event - Named Function Example');
  console.log('📊 Full event data:', data);

  // Safe destructuring with default values
  const {
    items = [],
    subtotal = 0,
    total = 0,
    discount = 0,
    tax = 0
  } = data;

  // Example: Calculate metrics
  const itemCount = items.length;
  const averageItemValue = itemCount > 0 ? total / itemCount : 0;

  console.log(\\\`
    📈 Cart Metrics:
    ─────────────────
    Items: \\\${itemCount}
    Subtotal: $\\\${subtotal.toFixed(2)}
    Discount: -$\\\${discount.toFixed(2)}
    Tax: $\\\${tax.toFixed(2)}
    Total: $\\\${total.toFixed(2)}
    Avg per item: $\\\${averageItemValue.toFixed(2)}
  \\\`);

  // Example: Conditional logic
  if (total > 100) {
    console.log('💰 HIGH VALUE CART - Consider offering:');
    console.log('   • Free shipping');
    console.log('   • Priority support');
    console.log('   • Extended warranty');
  } else if (total > 50) {
    console.log('🎯 MEDIUM VALUE CART - Upsell opportunities:');
    console.log('   • Related products');
    console.log('   • Bundle deals');
  }

  // Example: Analytics tracking
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'view_cart', {
      value: total,
      currency: 'USD',
      items: itemCount
    });
    console.log('📊 Google Analytics event sent');
  }

  // Example: Custom business logic
  if (itemCount > 5) {
    console.log('🎁 BULK ORDER - Auto-apply bulk discount');
  }

  // Example: Data validation
  if (!items || items.length === 0) {
    console.warn('⚠️ Empty cart detected');
  }
}`;

    // Example 2: Alternative parameter name (eventData) for comparison
    const eventDataExample = `export default function onCartViewedAlt(eventData) {
  // ✅ EXAMPLE: Using 'eventData' parameter name
  // Some developers prefer this naming convention

  console.log('🛒 Cart Event - EventData Parameter Example');

  // You can use any parameter name you prefer:
  // - data (simple and clean)
  // - eventData (explicit and descriptive)
  // - payload (common in Redux/events)
  // - cartData (specific to this event)

  const cartData = eventData; // Alias for clarity

  console.log('📦 Cart contains', cartData.items?.length || 0, 'items');
  console.log('💵 Total value: $' + (cartData.total || 0).toFixed(2));

  // Example: Array operations on cart items
  if (cartData.items && cartData.items.length > 0) {
    console.log('\\n🛍️ Items in cart:');

    cartData.items.forEach((item, index) => {
      console.log(\\\`  \\\${index + 1}. \\\${item.name || 'Unknown item'}\\\`);
    });

    // Example: Find specific products
    const hasExpensiveItem = cartData.items.some(item =>
      (item.price || 0) > 50
    );

    if (hasExpensiveItem) {
      console.log('💎 Cart contains premium items');
    }
  }

  // Example: Event chaining
  // You could emit another event based on cart state
  console.log('💡 TIP: You could trigger other events here:');
  console.log('   - Show promotion popup');
  console.log('   - Update recommendation engine');
  console.log('   - Send to analytics service');
}`;

    console.log('1️⃣ Adding cart-viewed-named.js...');

    // Check if it already exists
    const existing1 = await client.query(`
      SELECT id FROM plugin_events WHERE plugin_id = $1 AND file_name = $2
    `, [pluginId, 'cart-viewed-named.js']);

    if (existing1.rows.length > 0) {
      // Update existing
      await client.query(`
        UPDATE plugin_events
        SET listener_function = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND file_name = $3
      `, [namedFunctionExample, pluginId, 'cart-viewed-named.js']);
      console.log('   ✅ Updated cart-viewed-named.js');
    } else {
      // Insert new
      await client.query(`
        INSERT INTO plugin_events (
          plugin_id,
          event_name,
          file_name,
          listener_function,
          priority,
          is_enabled,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [
        pluginId,
        'cart.viewed',
        'cart-viewed-named.js',
        namedFunctionExample,
        20 // Higher priority so it runs after the main one
      ]);
      console.log('   ✅ Created cart-viewed-named.js');
    }

    console.log('\\n2️⃣ Adding cart-viewed-eventdata.js...');

    // Check if it already exists
    const existing2 = await client.query(`
      SELECT id FROM plugin_events WHERE plugin_id = $1 AND file_name = $2
    `, [pluginId, 'cart-viewed-eventdata.js']);

    if (existing2.rows.length > 0) {
      // Update existing
      await client.query(`
        UPDATE plugin_events
        SET listener_function = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND file_name = $3
      `, [eventDataExample, pluginId, 'cart-viewed-eventdata.js']);
      console.log('   ✅ Updated cart-viewed-eventdata.js');
    } else {
      // Insert new
      await client.query(`
        INSERT INTO plugin_events (
          plugin_id,
          event_name,
          file_name,
          listener_function,
          priority,
          is_enabled,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      `, [
        pluginId,
        'cart.viewed',
        'cart-viewed-eventdata.js',
        eventDataExample,
        30 // Even higher priority
      ]);
      console.log('   ✅ Created cart-viewed-eventdata.js');
    }

    // Verify
    const events = await client.query(`
      SELECT event_name, file_name, priority
      FROM plugin_events
      WHERE plugin_id = $1
      ORDER BY priority ASC
    `, [pluginId]);

    console.log('\\n📋 Cart Starter now has', events.rows.length, 'event listeners:');
    events.rows.forEach(e => {
      console.log(`   • ${e.file_name} (priority: ${e.priority})`);
    });

    console.log('\\n✅ Example events added to Cart Starter template!');
    console.log('\\n💡 When users clone this plugin, they get:');
    console.log('   1. cart_viewed.js - Main implementation');
    console.log('   2. cart-viewed-named.js - Named function example');
    console.log('   3. cart-viewed-eventdata.js - Alternative parameter name');
    console.log('\\n🎓 Users can learn from these examples and delete what they don\'t need!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addExampleEvents();
