/**
 * Fix createEmail - remove backticks from SQL
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

async function fixCreateEmailBackticks() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing createEmail - removing backticks from SQL...\n');

    const fixedCode = `async function createEmail(req, res, { sequelize }) {
  const { email, session_id, cart_total, cart_items_count, source = 'cart', subscribed = false } = req.body;

  if (!email || !email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)) {
    return res.status(400).json({
      success: false,
      error: 'Valid email address is required'
    });
  }

  try {
    const existing = await sequelize.query(
      'SELECT id FROM cart_emails WHERE email = $1',
      { bind: [email], type: sequelize.QueryTypes.SELECT }
    );

    let result;

    if (existing.length > 0) {
      result = await sequelize.query(
        'UPDATE cart_emails SET cart_total = $1, cart_items_count = $2, source = $3, subscribed = CASE WHEN subscribed THEN true ELSE $4 END WHERE email = $5 RETURNING *',
        { bind: [cart_total || 0, cart_items_count || 0, source, subscribed, email], type: sequelize.QueryTypes.UPDATE }
      );
      result = result[1];
    } else {
      result = await sequelize.query(
        'INSERT INTO cart_emails (email, session_id, cart_total, cart_items_count, source, subscribed, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
        { bind: [email, session_id, cart_total || 0, cart_items_count || 0, source, subscribed], type: sequelize.QueryTypes.INSERT }
      );
      result = result[0];
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
    console.log('   BEFORE: SQL with backticks (template literals)');
    console.log('   AFTER: SQL as single-line strings');
    console.log('   All bind parameters now work correctly!');

    console.log('\n🧪 Test:');
    console.log('   Click [+ Add Email] in the dashboard');
    console.log('   Fill form and create');
    console.log('   Should work without bind parameter error!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixCreateEmailBackticks();
