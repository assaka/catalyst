/**
 * Ultra-simplified createEmail - just INSERT, no UPDATE logic
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

async function ultraSimpleCreateEmail() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Creating ULTRA-SIMPLE createEmail controller...\n');

    // Simplest possible version - just INSERT
    const ultraSimpleCode = `async function createEmail(req, res, { sequelize }) {
  const { email, session_id, cart_total, cart_items_count, source, subscribed } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  try {
    const result = await sequelize.query(
      'INSERT INTO cart_emails (email, session_id, cart_total, cart_items_count, source, subscribed, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      { bind: [email, session_id || null, cart_total || 0, cart_items_count || 0, source || 'manual', subscribed || false], type: sequelize.QueryTypes.INSERT }
    );

    return res.json({
      success: true,
      email: result[0][0],
      message: 'Email created successfully'
    });
  } catch (error) {
    if (error.message && error.message.includes('duplicate')) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
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
    `, [ultraSimpleCode, pluginId, 'createEmail']);

    console.log('✅ Updated createEmail to ULTRA-SIMPLE version');
    console.log('\n📋 Changes:');
    console.log('   • Removed UPDATE logic (just INSERT now)');
    console.log('   • Single SQL query only');
    console.log('   • No backticks - single-line string');
    console.log('   • Clear bind array with 6 parameters');
    console.log('   • Handles duplicate email error gracefully');

    console.log('\n✅ Bind array:');
    console.log('   [email, session_id, cart_total, cart_items_count, source, subscribed]');
    console.log('   Matches SQL: $1, $2, $3, $4, $5, $6');

    console.log('\n🧪 Test:');
    console.log('   Click [+ Add Email]');
    console.log('   Fill: newtest@example.com');
    console.log('   Should create without bind parameter error!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

ultraSimpleCreateEmail();
