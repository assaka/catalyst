const ConnectionManager = require('../services/database/ConnectionManager');
const { QueryTypes } = require('sequelize');

/**
 * Store Resolution Middleware
 * Automatically resolves the user's store ID from the database and attaches it to req.storeId
 * This eliminates the need for frontend to send x-store-id headers
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether store is required (default: true)
 * @param {string} options.fallbackStoreId - Fallback store ID if none found
 */
const storeResolver = (options = {}) => {
  const { required = true, fallbackStoreId = null } = options;

  return async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      if (!required) {
        req.storeId = req.query.store_id || fallbackStoreId;
        return next();
      }

      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const masterConnection = ConnectionManager.getMasterConnection();
    const stores = await masterConnection.query(`
      SELECT id, name, slug, is_active, user_id, created_at
      FROM stores
      WHERE user_id = :userId AND is_active = true
      ORDER BY created_at DESC
    `, {
      replacements: { userId: req.user.id },
      type: QueryTypes.SELECT
    });

    if (!stores || stores.length === 0) {
      if (fallbackStoreId) {
        req.storeId = fallbackStoreId;
        req.store = { id: fallbackStoreId, name: 'Fallback Store', slug: 'fallback-store', is_active: true };
        return next();
      }

      if (!required) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'No active stores found for this user'
      });
    }

    // Use store from x-store-id header if provided, otherwise use first store
    const requestedStoreId = req.headers['x-store-id'] || req.query.store_id;
    const selectedStore = requestedStoreId
      ? stores.find(s => s.id === requestedStoreId) || stores[0]
      : stores[0];

    req.storeId = selectedStore.id;
    req.store = selectedStore;

    next();
  } catch (error) {
    console.error('❌ storeResolver error:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   User ID:', req.user?.id);

    if (fallbackStoreId) {
      req.storeId = fallbackStoreId;
      req.store = { id: fallbackStoreId, name: 'Fallback Store', slug: 'fallback-store', is_active: true };
      return next();
    }

    if (!required) {
      return next();
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to resolve store information',
      details: error.message
    });
  }
  };
};

module.exports = {
  storeResolver
};