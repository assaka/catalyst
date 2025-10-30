/**
 * Fix ALL email controllers - remove template literal escapes
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

async function fixAllEmailControllers() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing ALL email controllers...\n');

    // Fixed getAllEmails without template literals
    const getAllEmailsFixed = `async function getAllEmails(req, res, { sequelize }) {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';

  try {
    let query = 'SELECT * FROM cart_emails';
    let countQuery = 'SELECT COUNT(*) as total FROM cart_emails';
    const params = [];

    if (search) {
      query += ' WHERE email ILIKE $1';
      countQuery += ' WHERE email ILIKE $1';
      params.push('%' + search + '%');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const emails = await sequelize.query(query, {
      bind: params,
      type: sequelize.QueryTypes.SELECT
    });

    const countResult = await sequelize.query(countQuery, {
      bind: search ? [params[0]] : [],
      type: sequelize.QueryTypes.SELECT
    });

    return res.json({
      success: true,
      emails,
      total: parseInt(countResult[0].total),
      limit,
      offset
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`;

    // Fixed getEmailStats
    const getEmailStatsFixed = `async function getEmailStats(req, res, { sequelize }) {
  try {
    const stats = await sequelize.query(
      'SELECT COUNT(*) as total_emails, COUNT(*) FILTER (WHERE subscribed = true) as subscribed_count, AVG(cart_total) as avg_cart_total, MAX(created_at) as last_captured FROM cart_emails',
      { type: sequelize.QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      ...stats[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`;

    // Fixed getEmailById
    const getEmailByIdFixed = `async function getEmailById(req, res, { sequelize }) {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Email ID is required'
    });
  }

  try {
    const result = await sequelize.query(
      'SELECT * FROM cart_emails WHERE id = $1',
      { bind: [id], type: sequelize.QueryTypes.SELECT }
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    return res.json({
      success: true,
      email: result[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`;

    // Fixed updateEmail
    const updateEmailFixed = `async function updateEmail(req, res, { sequelize }) {
  const id = req.params.id;
  const { subscribed, source } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Email ID is required'
    });
  }

  try {
    const result = await sequelize.query(
      'UPDATE cart_emails SET subscribed = COALESCE($1, subscribed), source = COALESCE($2, source) WHERE id = $3 RETURNING *',
      { bind: [subscribed, source, id], type: sequelize.QueryTypes.UPDATE }
    );

    if (!result[1] || result[1].length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    return res.json({
      success: true,
      email: result[1][0],
      message: 'Email updated successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`;

    // Fixed deleteEmail
    const deleteEmailFixed = `async function deleteEmail(req, res, { sequelize }) {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Email ID is required'
    });
  }

  try {
    const result = await sequelize.query(
      'DELETE FROM cart_emails WHERE id = $1 RETURNING *',
      { bind: [id], type: sequelize.QueryTypes.DELETE }
    );

    if (!result[1] || result[1].length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    return res.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}`;

    const controllers = [
      { name: 'getAllEmails', code: getAllEmailsFixed },
      { name: 'getEmailStats', code: getEmailStatsFixed },
      { name: 'getEmailById', code: getEmailByIdFixed },
      { name: 'updateEmail', code: updateEmailFixed },
      { name: 'deleteEmail', code: deleteEmailFixed }
    ];

    for (const ctrl of controllers) {
      await client.query(`
        UPDATE plugin_controllers
        SET handler_code = $1, updated_at = NOW()
        WHERE plugin_id = $2 AND controller_name = $3
      `, [ctrl.code, pluginId, ctrl.name]);
      console.log(`✅ Fixed ${ctrl.name}`);
    }

    console.log('\n✅ All email controllers fixed!');
    console.log('\n📋 Changes:');
    console.log('   • Removed ALL template literal escapes');
    console.log('   • Used string concatenation: "text" + variable');
    console.log('   • No more \\` or \\$ in code');

    console.log('\n🧪 Test:');
    console.log('   1. Refresh your app');
    console.log('   2. Visit: /admin/plugins/my-cart-alert/emails');
    console.log('   3. Should see 8 emails displayed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllEmailControllers();
