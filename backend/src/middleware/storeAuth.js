const { Store } = require('../models');

/**
 * Middleware to check if the authenticated user owns or has access to the store
 * Supports both user_id (preferred) and owner_email (legacy) ownership models
 */
const checkStoreOwnership = async (req, res, next) => {
  try {
    console.log('🔍 Store ownership check:', {
      user: req.user?.id,
      email: req.user?.email,
      storeId: req.params.store_id || req.body?.store_id || req.query?.store_id
    });

    // Extract store_id from various sources
    const storeId = req.params.store_id || 
                   req.params.id || // For store update/delete routes
                   req.body?.store_id || 
                   req.query?.store_id;

    if (!storeId) {
      console.log('⚠️ No store_id provided, skipping ownership check');
      return next();
    }

    // Find the store
    const store = await Store.findByPk(storeId);
    
    if (!store) {
      console.log('❌ Store not found:', storeId);
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership using multiple methods
    const isOwnerByUserId = store.user_id && store.user_id === req.user.id;
    const isOwnerByEmail = store.owner_email === req.user.email;
    
    // Future: Add workspace/team member check here
    // const isTeamMember = await checkTeamMembership(req.user.id, storeId);
    
    const hasAccess = isOwnerByUserId || isOwnerByEmail; // || isTeamMember;

    console.log('🔍 Ownership check result:', {
      storeId: store.id,
      storeUserId: store.user_id,
      storeOwnerEmail: store.owner_email,
      userIdMatch: isOwnerByUserId,
      emailMatch: isOwnerByEmail,
      hasAccess
    });

    if (!hasAccess) {
      console.log('❌ User does not have access to this store');
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Attach store to request for downstream use
    req.store = store;
    next();
  } catch (error) {
    console.error('❌ Store ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking store ownership'
    });
  }
};

/**
 * Middleware to ensure store resources (products, categories, etc.) belong to user's store
 * This is for routes that deal with store resources but don't have store_id in the URL
 */
const checkResourceOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = require('../models')[modelName];
      const resourceId = req.params.id;

      if (!resourceId) {
        return next();
      }

      const resource = await Model.findByPk(resourceId, {
        include: [{
          model: Store,
          attributes: ['id', 'user_id', 'owner_email']
        }]
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }

      // Check if user owns the store that owns this resource
      const store = resource.Store;
      if (store) {
        const isOwnerByUserId = store.user_id && store.user_id === req.user.id;
        const isOwnerByEmail = store.owner_email === req.user.email;
        
        if (!isOwnerByUserId && !isOwnerByEmail) {
          console.log(`❌ User does not own the store for this ${modelName}`);
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error(`❌ Resource ownership check error for ${modelName}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

module.exports = {
  checkStoreOwnership,
  checkResourceOwnership
};