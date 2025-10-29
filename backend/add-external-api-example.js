/**
 * Add example event listener that calls external APIs
 * Shows how plugins can integrate with Amazon, Stripe, etc.
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

async function addExternalAPIExample() {
  const client = await pool.connect();

  try {
    const pluginId = 'eea24e22-7bc7-457e-8403-df53758ebf76'; // Cart Alert

    console.log('📝 Adding external API example to Cart Starter...\n');

    // Example: Call external APIs from event listener
    const externalAPIExample = `export default async function onCartViewedExternal(data) {
  // ✅ EXAMPLE: Calling External APIs
  // Plugins can call ANY external API: Amazon, Stripe, Google, etc.

  console.log('🌐 External API Integration Example');

  const { items = [], total = 0 } = data;

  // Example 1: Call Amazon Product Advertising API
  try {
    console.log('📦 Fetching Amazon product recommendations...');

    // Note: In production, store API keys in plugin_data table
    const amazonResponse = await fetch('https://api.amazon.com/paapi5/searchitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        // Add authentication headers here
      },
      body: JSON.stringify({
        PartnerTag: 'your-tag',
        PartnerType: 'Associates',
        Keywords: items[0]?.name || 'electronics',
        SearchIndex: 'All',
        ItemCount: 5
      })
    });

    if (amazonResponse.ok) {
      const amazonData = await amazonResponse.json();
      console.log('✅ Amazon recommendations:', amazonData);
    }
  } catch (error) {
    console.error('❌ Amazon API error:', error);
  }

  // Example 2: Send to Google Analytics
  try {
    if (window.gtag) {
      window.gtag('event', 'view_cart', {
        currency: 'USD',
        value: total,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });
      console.log('✅ Sent to Google Analytics');
    }
  } catch (error) {
    console.error('❌ GA error:', error);
  }

  // Example 3: Call Stripe API for pricing
  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer sk_test_YOUR_KEY',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (stripeResponse.ok) {
      const prices = await stripeResponse.json();
      console.log('✅ Stripe prices:', prices);
    }
  } catch (error) {
    console.error('❌ Stripe API error:', error);
  }

  // Example 4: Call your own backend API
  try {
    const analyticsResponse = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'cart_viewed',
        data: { total, items: items.length }
      })
    });

    if (analyticsResponse.ok) {
      console.log('✅ Analytics tracked');
    }
  } catch (error) {
    console.error('❌ Analytics error:', error);
  }

  // Example 5: Call webhook/integration service
  try {
    await fetch('https://hooks.zapier.com/hooks/catch/123/abc/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_total: total,
        cart_items: items.length,
        timestamp: new Date().toISOString()
      })
    });
    console.log('✅ Zapier webhook triggered');
  } catch (error) {
    console.error('❌ Webhook error:', error);
  }

  console.log('\\n💡 Key Points:');
  console.log('   • Use fetch() to call any HTTP API');
  console.log('   • Store API keys in plugin_data table (not in code!)');
  console.log('   • Always use try/catch for external calls');
  console.log('   • External APIs can fail - handle gracefully');
  console.log('   • Use async/await for cleaner code');
}`;

    console.log('Adding cart-viewed-external-api.js...');

    // Check if exists
    const existing = await client.query(`
      SELECT id FROM plugin_events WHERE plugin_id = $1 AND file_name = $2
    `, [pluginId, 'cart-viewed-external-api.js']);

    if (existing.rows.length > 0) {
      await client.query(`
        UPDATE plugin_events
        SET listener_function = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND file_name = $3
      `, [externalAPIExample, pluginId, 'cart-viewed-external-api.js']);
      console.log('✅ Updated cart-viewed-external-api.js');
    } else {
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
        'cart-viewed-external-api.js',
        externalAPIExample,
        40
      ]);
      console.log('✅ Created cart-viewed-external-api.js');
    }

    console.log('\n📚 External API Examples Added:');
    console.log('   • Amazon Product Advertising API');
    console.log('   • Google Analytics');
    console.log('   • Stripe API');
    console.log('   • Custom backend APIs');
    console.log('   • Zapier webhooks');
    console.log('\n💡 Plugins can call ANY external API!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addExternalAPIExample();
