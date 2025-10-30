/**
 * Mock email capture - Insert test data into cart_emails table
 * This simulates users visiting the cart page
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

async function mockEmailCapture() {
  const client = await pool.connect();

  try {
    console.log('📧 Creating mock email captures...\n');

    // Check if cart_emails table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'cart_emails'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ cart_emails table does not exist!');
      console.log('\n🔧 Run migration first:');
      console.log('   1. Open plugin editor');
      console.log('   2. Find entities/CartEmail.json');
      console.log('   3. Click "Generate Migration"');
      console.log('   4. Run the migration');
      console.log('\nOR run this SQL manually:');
      console.log('─'.repeat(60));
      console.log(`CREATE TABLE IF NOT EXISTS cart_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  session_id VARCHAR(255),
  cart_total DECIMAL(10, 2) DEFAULT 0,
  cart_items_count INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'cart',
  subscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_emails_email ON cart_emails(email);
CREATE INDEX IF NOT EXISTS idx_cart_emails_created_at ON cart_emails(created_at DESC);`);
      console.log('─'.repeat(60));
      process.exit(1);
    }

    console.log('✅ cart_emails table exists!\n');

    // Mock data - simulating different users viewing cart
    const mockEmails = [
      {
        email: 'john.doe@example.com',
        cart_total: 159.99,
        cart_items_count: 3,
        subscribed: true,
        source: 'cart'
      },
      {
        email: 'jane.smith@example.com',
        cart_total: 89.50,
        cart_items_count: 2,
        subscribed: false,
        source: 'cart'
      },
      {
        email: 'bob.wilson@example.com',
        cart_total: 245.00,
        cart_items_count: 5,
        subscribed: true,
        source: 'cart'
      },
      {
        email: 'alice.johnson@example.com',
        cart_total: 45.99,
        cart_items_count: 1,
        subscribed: false,
        source: 'cart'
      },
      {
        email: 'charlie.brown@example.com',
        cart_total: 199.99,
        cart_items_count: 4,
        subscribed: true,
        source: 'cart'
      },
      {
        email: 'diana.prince@example.com',
        cart_total: 79.99,
        cart_items_count: 2,
        subscribed: false,
        source: 'checkout'
      },
      {
        email: 'hamid@test.com',
        cart_total: 999.99,
        cart_items_count: 10,
        subscribed: true,
        source: 'cart'
      }
    ];

    let created = 0;
    let updated = 0;

    for (const mock of mockEmails) {
      // Check if email already exists
      const existing = await client.query(`
        SELECT id FROM cart_emails WHERE email = $1
      `, [mock.email]);

      if (existing.rows.length > 0) {
        // Update existing
        await client.query(`
          UPDATE cart_emails
          SET cart_total = $1,
              cart_items_count = $2,
              source = $3,
              subscribed = CASE WHEN subscribed THEN true ELSE $4 END
          WHERE email = $5
        `, [mock.cart_total, mock.cart_items_count, mock.source, mock.subscribed, mock.email]);

        updated++;
        console.log(`♻️  Updated: ${mock.email} ($${mock.cart_total})`);
      } else {
        // Insert new
        await client.query(`
          INSERT INTO cart_emails (
            email, session_id, cart_total, cart_items_count, source, subscribed, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          mock.email,
          `session_${Math.random().toString(36).substr(2, 9)}`,
          mock.cart_total,
          mock.cart_items_count,
          mock.source,
          mock.subscribed
        ]);

        created++;
        console.log(`✅ Created: ${mock.email} ($${mock.cart_total})`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} emails`);
    console.log(`   Updated: ${updated} emails`);

    // Show stats
    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE subscribed = true) as subscribed,
        AVG(cart_total) as avg_total,
        MAX(cart_total) as max_total
      FROM cart_emails
    `);

    console.log(`\n📈 Current Stats:`);
    console.log(`   Total emails: ${stats.rows[0].total}`);
    console.log(`   Subscribed: ${stats.rows[0].subscribed}`);
    console.log(`   Average cart: $${parseFloat(stats.rows[0].avg_total).toFixed(2)}`);
    console.log(`   Max cart: $${parseFloat(stats.rows[0].max_total).toFixed(2)}`);

    console.log(`\n✅ Mock data inserted!`);
    console.log(`\n🌐 Now visit:`);
    console.log(`   http://localhost:5179/admin/plugins/my-cart-alert/emails`);
    console.log(`\n💡 Or test via API:`);
    console.log(`   GET http://localhost:5000/api/plugins/my-cart-alert/exec/emails`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

mockEmailCapture();
