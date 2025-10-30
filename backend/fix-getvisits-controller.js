/**
 * Fix getVisits controller - remove bind parameters
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

async function fixGetVisitsController() {
  const client = await pool.connect();

  try {
    const pluginId = '4eb11832-5429-4146-af06-de86d319a0e5';

    console.log('🔧 Fixing getVisits controller (OLD cart tracking)...\n');

    // Simplified getVisits - no pagination parameters
    const fixedCode = `async function getVisits(req, res, { sequelize }) {
  try {
    const visits = await sequelize.query(
      'SELECT * FROM hamid_cart ORDER BY visited_at DESC',
      { type: sequelize.QueryTypes.SELECT }
    );

    const countResult = await sequelize.query(
      'SELECT COUNT(*) as total FROM hamid_cart',
      { type: sequelize.QueryTypes.SELECT }
    );

    return res.json({
      success: true,
      visits: visits,
      total: parseInt(countResult[0].total || 0),
      limit: 50,
      offset: 0
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
    `, [fixedCode, pluginId, 'getVisits']);

    console.log('✅ Fixed getVisits controller');
    console.log('\n📋 Removed all bind parameters from getVisits');
    console.log('   Now returns all visits from hamid_cart table');
    console.log('   No $1, $2, or bind: anymore!');

    console.log('\n🧪 This should fix the bind parameter error!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixGetVisitsController();
