/**
 * Fix createEmail controller syntax error
 * The issue is with escaped backticks in the SQL template string
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

async function fixCreateEmailController() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing createEmail controller syntax...\n');

    // Fixed controller code without triple-escaped backticks
    const fixedCode = `async function createEmail(req, res, { sequelize }) {
  const { email, session_id, cart_total, cart_items_count, source = 'cart', subscribed = false } = req.body;

  if (!email || !email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)) {
    return res.status(400).json({
      success: false,
      error: 'Valid email address is required'
    });
  }

  try {
    // Check if email already exists (since we don't have unique constraint yet)
    const existing = await sequelize.query(
      'SELECT id FROM cart_emails WHERE email = $1',
      {
        bind: [email],
        type: sequelize.QueryTypes.SELECT
      }
    );

    let result;

    if (existing.length > 0) {
      // Update existing email
      result = await sequelize.query(
        \`UPDATE cart_emails
         SET cart_total = $1,
             cart_items_count = $2,
             source = $3,
             subscribed = CASE WHEN subscribed THEN true ELSE $4 END
         WHERE email = $5
         RETURNING *\`,
        {
          bind: [cart_total || 0, cart_items_count || 0, source, subscribed, email],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      result = result[1]; // UPDATE returns array with affected rows in second element
    } else {
      // Insert new email
      result = await sequelize.query(
        \`INSERT INTO cart_emails (email, session_id, cart_total, cart_items_count, source, subscribed, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *\`,
        {
          bind: [email, session_id, cart_total || 0, cart_items_count || 0, source, subscribed],
          type: sequelize.QueryTypes.INSERT
        }
      );
      result = result[0]; // INSERT returns array with new row in first element
    }

    return res.json({
      success: true,
      email: result[0],
      message: 'Email captured successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`;

    await client.query(`
      UPDATE plugin_controllers
      SET handler_code = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND controller_name = $3
    `, [fixedCode, pluginId, 'createEmail']);

    console.log('✅ Fixed createEmail controller');
    console.log('\n📋 Changes:');
    console.log('   • Removed triple-escaped backticks (syntax error)');
    console.log('   • Split into two queries: check existing + insert/update');
    console.log('   • Proper error handling');
    console.log('   • Works without ON CONFLICT (no unique constraint yet)');

    console.log('\n🧪 Test now:');
    console.log('   1. Refresh your app');
    console.log('   2. Visit cart page');
    console.log('   3. Should see: "✅ Email captured successfully!"');
    console.log('   4. Visit /admin/plugins/my-cart-alert/emails');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCreateEmailController();
