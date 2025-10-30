const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
});

(async () => {
  const client = await pool.connect();

  console.log('🔍 Email Capture System Setup Check\n');
  console.log('═'.repeat(60));

  const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

  // Check event listener
  console.log('\n1️⃣ EVENT LISTENER (Triggers the controller):');
  const event = await client.query(`
    SELECT event_name, file_name
    FROM plugin_events
    WHERE plugin_id = $1 AND file_name = 'cart-viewed-capture-email.js'
  `, [pluginId]);

  if (event.rows.length > 0) {
    console.log('   ✅ cart-viewed-capture-email.js EXISTS');
    console.log('   Listens to:', event.rows[0].event_name);
    console.log('   When cart.viewed fires → calls POST /emails controller');
  } else {
    console.log('   ❌ Event listener NOT FOUND');
  }

  // Check controller
  console.log('\n2️⃣ CONTROLLER (Processes the data):');
  const controller = await client.query(`
    SELECT controller_name, method, path
    FROM plugin_controllers
    WHERE plugin_id = $1 AND path = '/emails' AND method = 'POST'
  `, [pluginId]);

  if (controller.rows.length > 0) {
    console.log('   ✅ createEmail controller EXISTS');
    console.log('   Endpoint: POST /api/plugins/my-cart-alert/exec/emails');
    console.log('   Does: Inserts email into cart_emails table');
  } else {
    console.log('   ❌ Controller NOT FOUND');
  }

  // Check entity
  console.log('\n3️⃣ ENTITY (Defines the table):');
  const entity = await client.query(`
    SELECT entity_name, table_name, migration_status
    FROM plugin_entities
    WHERE plugin_id = $1 AND entity_name = 'CartEmail'
  `, [pluginId]);

  if (entity.rows.length > 0) {
    console.log('   ✅ CartEmail entity EXISTS');
    console.log('   Table:', entity.rows[0].table_name);
    console.log('   Migration status:', entity.rows[0].migration_status);

    if (entity.rows[0].migration_status !== 'migrated') {
      console.log('   ⚠️  TABLE NOT CREATED YET - Run migration first!');
    }
  } else {
    console.log('   ❌ Entity NOT FOUND');
  }

  // Check admin page
  console.log('\n4️⃣ ADMIN PAGE (View the emails):');
  const page = await client.query(`
    SELECT page_key, page_name, route
    FROM plugin_admin_pages
    WHERE plugin_id = $1 AND page_key = 'email-capture'
  `, [pluginId]);

  if (page.rows.length > 0) {
    console.log('   ✅ Email Capture admin page EXISTS');
    console.log('   Route:', page.rows[0].route);
  } else {
    console.log('   ❌ Admin page NOT FOUND');
  }

  console.log('\n═'.repeat(60));
  console.log('📋 COMPLETE FLOW (How It All Works):');
  console.log('═'.repeat(60));
  console.log('1. User visits cart page');
  console.log('2. Cart.jsx emits: eventSystem.emit("cart.viewed", data)');
  console.log('3. Event listener executes: cart-viewed-capture-email.js');
  console.log('4. Listener calls: POST /api/plugins/my-cart-alert/exec/emails');
  console.log('5. Dynamic router matches path="/emails" method="POST"');
  console.log('6. Finds: createEmail controller in plugin_controllers table');
  console.log('7. Executes: handler_code from database');
  console.log('8. Controller inserts into: cart_emails table');
  console.log('9. Admin visits: /admin/plugins/my-cart-alert/emails');
  console.log('10. Admin page calls: GET /exec/emails');
  console.log('11. Shows list of captured emails!');

  console.log('\n🚀 TO TEST:');
  console.log('1. Run migration to create cart_emails table');
  console.log('2. Refresh your app (loads event listener from DB)');
  console.log('3. Visit cart page');
  console.log('4. Check console for "✅ Email captured"');
  console.log('5. Visit /admin/plugins/my-cart-alert/emails to see it!');

  console.log('\n💡 Path "/emails" is just metadata - not a file!');

  client.release();
  await pool.end();
})();
