/**
 * Update cart-viewed-capture-email.js to use mock email for testing
 * Since cart.viewed data doesn't have user.email yet, we'll use a test email
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

async function mockEmailInListener() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('📧 Updating event listener to use mock email for testing...\n');

    const updatedListener = `export default async function onCartViewedCaptureEmail(data) {
  // ✅ EXAMPLE: Capture email from cart data
  // For testing: using mock email since cart.viewed doesn't have user.email yet

  console.log('📧 Email Capture Listener - Checking for email...');

  // Extract email from cart data (or use mock for testing)
  const email = data?.user?.email || 'test-user@example.com'; // ← MOCK EMAIL FOR TESTING

  if (!email) {
    console.log('⚠️ No email found in cart data');
    return;
  }

  console.log('✅ Email found:', email);

  const { items = [], total = 0 } = data;

  // Call the CREATE controller to save email
  try {
    console.log('📤 Calling POST /api/plugins/my-cart-alert/exec/emails');

    const response = await fetch('/api/plugins/my-cart-alert/exec/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        session_id: sessionStorage.getItem('session_id') || \`session_\${Date.now()}\`,
        cart_total: total,
        cart_items_count: items.length,
        source: 'cart',
        subscribed: false
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email captured successfully!', result.email?.email);
      console.log('   Cart Total: $' + (result.email?.cart_total || 0));
      console.log('   Items: ' + (result.email?.cart_items_count || 0));
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to capture email:', errorData.error);
    }
  } catch (error) {
    console.error('❌ Error capturing email:', error);
  }
}`;

    await client.query(`
      UPDATE plugin_events
      SET listener_function = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND file_name = $3
    `, [updatedListener, pluginId, 'cart-viewed-capture-email.js']);

    console.log('✅ Updated cart-viewed-capture-email.js');
    console.log('\n📋 Now the listener will:');
    console.log('   1. Check for data.user.email');
    console.log('   2. Fallback to test-user@example.com (for testing)');
    console.log('   3. Call POST /api/plugins/my-cart-alert/exec/emails');
    console.log('   4. Log success/error to console');

    console.log('\n🧪 To test:');
    console.log('   1. Refresh your app');
    console.log('   2. Visit cart page');
    console.log('   3. Check console for:');
    console.log('      "📧 Email Capture Listener - Checking for email..."');
    console.log('      "✅ Email captured successfully! test-user@example.com"');
    console.log('   4. Visit /admin/plugins/my-cart-alert/emails to see it!');

    console.log('\n💡 Later: When you add user authentication,');
    console.log('   remove the mock and use: data.user.email');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

mockEmailInListener();
