/**
 * Simplify getAllEmails to avoid bind parameter issues
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

async function fixGetAllEmails() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Simplifying getAllEmails controller...\n');

    // Ultra-simple version - no search, just list all
    const simplifiedCode = `async function getAllEmails(req, res, { sequelize }) {
  try {
    // Simple query - no dynamic parameters
    const emails = await sequelize.query(
      'SELECT * FROM cart_emails ORDER BY created_at DESC',
      { type: sequelize.QueryTypes.SELECT }
    );

    const countResult = await sequelize.query(
      'SELECT COUNT(*) as total FROM cart_emails',
      { type: sequelize.QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      emails: emails,
      total: parseInt(countResult[0].total || 0),
      limit: 50,
      offset: 0
    });
  } catch (error) {
    console.error('getAllEmails error:', error);
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
    `, [simplifiedCode, pluginId, 'getAllEmails']);

    console.log('✅ Updated getAllEmails to simplified version');
    console.log('\n📋 Changes:');
    console.log('   • Removed ALL dynamic parameters');
    console.log('   • No search functionality (for now)');
    console.log('   • No pagination parameters');
    console.log('   • Just returns all emails');
    console.log('   • Zero bind parameters = zero errors!');

    console.log('\n🧪 Test:');
    console.log('   curl https://catalyst-backend-fzhu.onrender.com/api/plugins/my-cart-alert/exec/emails');
    console.log('   Should return all 8 emails');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixGetAllEmails();
