/**
 * Update the updateEmail controller to allow email field changes
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

async function updateUpdateEmailController() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Updating updateEmail controller to allow email changes...\n');

    const updatedCode = `async function updateEmail(req, res, { sequelize }) {
  const id = req.params.id;
  const { email, subscribed, source } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Email ID is required'
    });
  }

  try {
    const result = await sequelize.query(
      'UPDATE cart_emails SET email = COALESCE($1, email), subscribed = COALESCE($2, subscribed), source = COALESCE($3, source) WHERE id = $4 RETURNING *',
      { bind: [email, subscribed, source, id], type: sequelize.QueryTypes.UPDATE }
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

    await client.query(`
      UPDATE plugin_controllers
      SET handler_code = $1, updated_at = NOW()
      WHERE plugin_id = $2 AND controller_name = $3
    `, [updatedCode, pluginId, 'updateEmail']);

    console.log('✅ Updated updateEmail controller');
    console.log('\n📋 Now handles:');
    console.log('   • email field (NEW!)');
    console.log('   • subscribed field');
    console.log('   • source field');
    console.log('\n✅ Email address is now editable in Edit modal!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateUpdateEmailController();
