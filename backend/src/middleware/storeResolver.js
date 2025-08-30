const { sequelize } = require('../database/connection');

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
      
      // Handle fallback store ID if provided
      if (fallbackStoreId) {
        console.log('⚠️ [StoreResolver] Using fallback store ID:', fallbackStoreId);
        req.storeId = fallbackStoreId;
        req.store = { 
          id: fallbackStoreId, 
          name: 'Fallback Store',
          slug: 'fallback-store',
          is_active: true 
        };
        return next();
      }
      
      // If not required, continue without store context
      if (!required) {
        console.log('ℹ️ [StoreResolver] No stores found but not required - continuing without store context');
        return next();
      }
      
      // Required but no store found - return error (original behavior)
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
    
    // If fallback store ID provided, use it on error
    if (fallbackStoreId) {
      console.log('⚠️ [StoreResolver] Using fallback store ID due to error:', fallbackStoreId);
      req.storeId = fallbackStoreId;
      req.store = { 
        id: fallbackStoreId, 
        name: 'Fallback Store',
        slug: 'fallback-store',
        is_active: true 
      };
      return next();
    }
    
    // If not required, continue despite error
    if (!required) {
      console.log('ℹ️ [StoreResolver] Error occurred but not required - continuing without store');
      return next();
    }
    
    // Required but error occurred - return error (original behavior)
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve store information: ' + error.message
    });
  }
  };
};

module.exports = {
  storeResolver
};