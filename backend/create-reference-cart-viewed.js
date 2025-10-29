/**
 * Create a reference cart.viewed event listener
 * Shows best practices for event listener format
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

async function createReferenceEvent() {
  const client = await pool.connect();

  try {
    // Use the Cart Alert plugin
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('📝 Creating reference cart.viewed event listener...\n');

    // Best practice event listener code using named function
    const eventListenerCode = `export default function onCartViewed(data) {
  // ✅ Best Practice: Named function for better debugging
  // Function name shows up in stack traces!

  console.log('🛒 Cart viewed event fired!');
  console.log('📊 Event data:', data);

  // Access cart data
  const { items = [], subtotal = 0, total = 0, discount = 0, tax = 0 } = data;

  console.log(\`
    🛍️  Cart Summary:
    - Items: \${items.length}
    - Subtotal: $\${subtotal.toFixed(2)}
    - Discount: $\${discount.toFixed(2)}
    - Tax: $\${tax.toFixed(2)}
    - Total: $\${total.toFixed(2)}
  \`);

  // Example: Track analytics
  if (window.gtag) {
    window.gtag('event', 'view_cart', {
      value: total,
      currency: 'USD',
      items: items.length
    });
  }

  // Example: Show notification for large carts
  if (total > 100) {
    console.log('💰 High-value cart detected! Consider offering free shipping.');
  }
}`;

    // Insert the event listener
    const result = await client.query(`
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
      RETURNING id, file_name
    `, [
      pluginId,
      'cart.viewed',
      'cart-viewed-reference.js',
      eventListenerCode,
      10
    ]);

    console.log('✅ Reference event listener created!');
    console.log(`   File: ${result.rows[0].file_name}`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Event: cart.viewed`);
    console.log(`   Plugin: Cart Alert`);

    console.log('\n📋 Event listener code:');
    console.log('─'.repeat(60));
    console.log(eventListenerCode);
    console.log('─'.repeat(60));

    console.log('\n💡 Key features:');
    console.log('   ✅ Named function (onCartViewed) - shows in stack traces');
    console.log('   ✅ export default - proper ES6 syntax');
    console.log('   ✅ Destructuring - safe data access');
    console.log('   ✅ Comments - explains what the code does');
    console.log('   ✅ Console logs - helpful for debugging');
    console.log('   ✅ Conditional logic - demonstrates real use cases');

    console.log('\n🔄 Refresh your app to see it in action!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

createReferenceEvent();
