const { sequelize } = require('../database/connection');

/**
 * Store Resolution Middleware
 * Automatically resolves the user's store ID from the database and attaches it to req.storeId
 * This eliminates the need for frontend to send x-store-id headers
 */
const storeResolver = async (req, res, next) => {
  try {
    console.log('🏪 [StoreResolver] Resolving store for user:', req.user?.id);

    if (!req.user || !req.user.id) {
      console.log('❌ [StoreResolver] No authenticated user found');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Query to find store(s) owned by this user
    const [stores] = await sequelize.query(`
      SELECT id, name, slug, is_active 
      FROM stores 
      WHERE user_id = :userId AND is_active = true 
      ORDER BY created_at DESC
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    });

    console.log('🔍 [StoreResolver] Found stores for user:', stores.length);

    if (stores.length === 0) {
      console.log('❌ [StoreResolver] No active stores found for user');
      return res.status(403).json({
        success: false,
        error: 'No active stores found for this user'
      });
    }

    // For now, use the first (most recent) store
    // TODO: In the future, we could support multi-store users with a store selection mechanism
    const primaryStore = stores[0];
    
    // Attach store information to request
    req.storeId = primaryStore.id;
    req.store = primaryStore;
    
    console.log('✅ [StoreResolver] Store resolved:', {
      storeId: req.storeId,
      storeName: primaryStore.name,
      storeSlug: primaryStore.slug
    });

    next();
  } catch (error) {
    console.error('❌ [StoreResolver] Error resolving store:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve store information'
    });
  }
};

/**
 * Optional store resolver that doesn't fail if no store is found
 * Useful for endpoints that may or may not require store context
 */
const optionalStoreResolver = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(); // Continue without store info
    }

    const [stores] = await sequelize.query(`
      SELECT id, name, slug, is_active 
      FROM stores 
      WHERE user_id = :userId AND is_active = true 
      ORDER BY created_at DESC
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    });

    if (stores.length > 0) {
      const primaryStore = stores[0];
      req.storeId = primaryStore.id;
      req.store = primaryStore;
      console.log('✅ [OptionalStoreResolver] Store resolved:', req.storeId);
    } else {
      console.log('ℹ️ [OptionalStoreResolver] No stores found for user - continuing without store context');
    }

    next();
  } catch (error) {
    console.error('❌ [OptionalStoreResolver] Error:', error);
    // Don't fail the request, just continue without store info
    next();
  }
};

module.exports = {
  storeResolver,
  optionalStoreResolver
};