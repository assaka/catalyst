const { sequelize } = require('../database/connection');

/**
 * Store Resolution Middleware
 * Automatically resolves the user's store ID from the database and attaches it to req.storeId
 * This eliminates the need for frontend to send x-store-id headers
 */
const storeResolver = async (req, res, next) => {
  try {
    console.log('🏪 [StoreResolver] Resolving store for user:', req.user?.id);
    console.log('🏪 [StoreResolver] Full user object:', req.user);

    if (!req.user || !req.user.id) {
      console.log('❌ [StoreResolver] No authenticated user found');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Test database connection first
    console.log('🔍 [StoreResolver] Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ [StoreResolver] Database connection successful');

    // Query to find store(s) owned by this user - with enhanced debugging
    console.log('🔍 [StoreResolver] Executing stores query with userId:', req.user.id, 'type:', typeof req.user.id);
    
    const stores = await sequelize.query(`
      SELECT id, name, slug, is_active, user_id, created_at 
      FROM stores 
      WHERE user_id = :userId AND is_active = true 
      ORDER BY created_at DESC
    `, {
      replacements: { userId: req.user.id },
      type: sequelize.QueryTypes.SELECT
    });

    console.log('🔍 [StoreResolver] Raw query result:', stores);
    console.log('🔍 [StoreResolver] Query result type:', typeof stores);
    console.log('🔍 [StoreResolver] Is array?', Array.isArray(stores));
    console.log('🔍 [StoreResolver] Found stores for user:', stores?.length || 0);
    
    if (stores && stores.length > 0) {
      console.log('🔍 [StoreResolver] Store details:', stores.map(s => ({
        id: s.id,
        name: s.name,
        user_id: s.user_id,
        is_active: s.is_active
      })));
    }

    if (!stores || stores.length === 0) {
      console.log('❌ [StoreResolver] No active stores found for user ID:', req.user.id);
      
      // Let's also check if there are ANY stores for this user (including inactive)
      const allStores = await sequelize.query(`
        SELECT id, name, slug, is_active, user_id 
        FROM stores 
        WHERE user_id = :userId 
        ORDER BY created_at DESC
      `, {
        replacements: { userId: req.user.id },
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('🔍 [StoreResolver] All stores (including inactive) for user:', allStores?.length || 0);
      if (allStores && allStores.length > 0) {
        console.log('🔍 [StoreResolver] Inactive stores found:', allStores);
      }
      
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
    console.error('❌ [StoreResolver] Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve store information: ' + error.message
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