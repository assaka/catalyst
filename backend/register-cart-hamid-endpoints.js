// Register Cart Hamid API endpoints in plugin_controllers table (if exists)
// Or use plugin metadata to register routes
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const PLUGIN_ID = '109c940f-5d33-472c-b7df-c48e68c35696';

async function registerEndpoints() {
  try {
    console.log('🚀 Registering Cart Hamid API endpoints...\n');

    // Check if plugin_controllers table exists
    const tableCheck = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'plugin_controllers'
      );
    `, { type: sequelize.QueryTypes.SELECT });

    const tableExists = tableCheck[0].exists;

    if (tableExists) {
      console.log('✅ plugin_controllers table found, registering endpoints...\n');

      // Register track-visit endpoint
      await sequelize.query(`
        INSERT INTO plugin_controllers (plugin_id, method, path, handler_code, enabled)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, {
        bind: [
          PLUGIN_ID,
          'POST',
          '/cart-hamid/track-visit',
          `async function trackVisit(req, res, context) {
  const { sequelize } = context;
  const {
    user_id, session_id, cart_items_count,
    cart_subtotal, cart_total, user_agent,
    ip_address, referrer_url
  } = req.body;

  const result = await sequelize.query(\`
    INSERT INTO hamid_cart (
      user_id, session_id, cart_items_count,
      cart_subtotal, cart_total, user_agent,
      ip_address, referrer_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  \`, {
    bind: [
      user_id || null,
      session_id || null,
      cart_items_count || 0,
      cart_subtotal || 0,
      cart_total || 0,
      user_agent || null,
      ip_address || req.ip,
      referrer_url || null
    ],
    type: sequelize.QueryTypes.INSERT
  });

  return res.json({ success: true, visit: result[0][0] });
}`,
          true
        ]
      });
      console.log('   ✅ POST /cart-hamid/track-visit registered');

      // Register get visits endpoint
      await sequelize.query(`
        INSERT INTO plugin_controllers (plugin_id, method, path, handler_code, enabled)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, {
        bind: [
          PLUGIN_ID,
          'GET',
          '/cart-hamid/visits',
          `async function getVisits(req, res, context) {
  const { sequelize } = context;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const visits = await sequelize.query(\`
    SELECT * FROM hamid_cart
    ORDER BY visited_at DESC
    LIMIT $1 OFFSET $2
  \`, {
    bind: [limit, offset],
    type: sequelize.QueryTypes.SELECT
  });

  const countResult = await sequelize.query(\`
    SELECT COUNT(*) as total FROM hamid_cart
  \`, { type: sequelize.QueryTypes.SELECT });

  return res.json({
    success: true,
    visits,
    total: parseInt(countResult[0].total || countResult[0].count),
    limit,
    offset
  });
}`,
          true
        ]
      });
      console.log('   ✅ GET /cart-hamid/visits registered');

      // Register get stats endpoint
      await sequelize.query(`
        INSERT INTO plugin_controllers (plugin_id, method, path, handler_code, enabled)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, {
        bind: [
          PLUGIN_ID,
          'GET',
          '/cart-hamid/stats',
          `async function getStats(req, res, context) {
  const { sequelize } = context;

  const stats = await sequelize.query(\`
    SELECT
      COUNT(*) as total_visits,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as unique_sessions,
      AVG(cart_items_count) as avg_items,
      AVG(cart_total) as avg_total,
      MAX(visited_at) as last_visit
    FROM hamid_cart
  \`, { type: sequelize.QueryTypes.SELECT });

  return res.json({
    success: true,
    ...stats[0]
  });
}`,
          true
        ]
      });
      console.log('   ✅ GET /cart-hamid/stats registered\n');

      console.log('✅ All endpoints registered successfully!');
      console.log('📍 Endpoints available at:');
      console.log('   - POST /api/plugins/dynamic/' + PLUGIN_ID + '/cart-hamid/track-visit');
      console.log('   - GET  /api/plugins/dynamic/' + PLUGIN_ID + '/cart-hamid/visits');
      console.log('   - GET  /api/plugins/dynamic/' + PLUGIN_ID + '/cart-hamid/stats');

    } else {
      console.log('⚠️  plugin_controllers table does not exist');
      console.log('ℹ️  The controllers are already in the controller file in plugin_scripts');
      console.log('ℹ️  You can access them via the dynamic plugin system or create a custom route handler');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

registerEndpoints();
