const { Store, StoreTeam } = require('../models');

/**
 * Helper function to check if user is a team member with specific permissions
 */
const checkTeamMembership = async (userId, storeId, requiredPermissions = []) => {
  try {
    const teamMember = await StoreTeam.findOne({
      where: {
        user_id: userId,
        store_id: storeId,
        status: 'active',
        is_active: true
      }
    });

    if (!teamMember) {
      return { hasAccess: false, role: null, permissions: {} };
    }

    // Role-based permissions
    const rolePermissions = {
      owner: { all: true }, // Owner has all permissions
      admin: { 
        all: true, // Admin has all permissions except ownership transfer
        canManageTeam: true,
        canManageStore: true,
        canManageContent: true,
        canViewReports: true
      },
      editor: {
        canManageContent: true,
        canViewReports: true,
        canManageProducts: true,
        canManageOrders: true,
        canManageCategories: true
      },
      viewer: {
        canViewReports: true,
        canViewProducts: true,
        canViewOrders: true
      }
    };

    const basePermissions = rolePermissions[teamMember.role] || {};
    const customPermissions = teamMember.permissions || {};
    const finalPermissions = { ...basePermissions, ...customPermissions };

    // Check if user has required permissions
    const hasRequiredPermissions = requiredPermissions.length === 0 || 
      requiredPermissions.every(perm => finalPermissions[perm] || finalPermissions.all);

    return {
      hasAccess: hasRequiredPermissions,
      role: teamMember.role,
      permissions: finalPermissions,
      teamMember
    };
  } catch (error) {
    console.error('❌ Team membership check error:', error);
    return { hasAccess: false, role: null, permissions: {} };
  }
};

/**
 * Middleware to check if the authenticated user owns or has access to the store
 * Supports both direct ownership and team membership
 */
const checkStoreOwnership = async (req, res, next) => {
  try {
    console.log('🔍 Store ownership check started');
    console.log('🔍 Request details:', {
      method: req.method,
      path: req.path,
      params: req.params,
      body: req.body,
      query: req.query,
      headers: {
        'x-store-id': req.headers['x-store-id'],
        'authorization': req.headers.authorization ? 'Bearer ...' : 'None'
      },
      user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : 'No user'
    });

    // Check if user is authenticated
    if (!req.user) {
      console.log('❌ No authenticated user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Extract store_id from various sources (including the one set by extractStoreId middleware)
    const storeId = req.storeId || // Set by extractStoreId middleware
                   req.params.store_id || 
                   req.params.id || // For store update/delete routes
                   req.body?.store_id || 
                   req.query?.store_id ||
                   req.headers['x-store-id'];

    console.log('🔍 Extracted storeId:', storeId);

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

    // Check direct ownership first
    const isDirectOwner = store.user_id && store.user_id === req.user.id;
    
    // Check team membership if not direct owner
    let teamAccess = { hasAccess: false, role: null, permissions: {} };
    if (!isDirectOwner) {
      teamAccess = await checkTeamMembership(req.user.id, storeId);
    }
    
    const hasAccess = isDirectOwner || teamAccess.hasAccess;

    console.log('🔍 Ownership check result:', {
      storeId: store.id,
      storeUserId: store.user_id,
      isDirectOwner,
      teamRole: teamAccess.role,
      teamPermissions: teamAccess.permissions,
      hasAccess
    });

    if (!hasAccess) {
      console.log('❌ User does not have access to this store');
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Attach store and access info to request for downstream use
    req.store = store;
    req.storeAccess = {
      isDirectOwner,
      teamRole: teamAccess.role,
      permissions: teamAccess.permissions,
      teamMember: teamAccess.teamMember
    };
    
    next();
  } catch (error) {
    console.error('❌ Store ownership check error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error checking store ownership: ' + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
          attributes: ['id', 'user_id']
        }]
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }

      // Check if user owns the store that owns this resource or is a team member
      const store = resource.Store;
      if (store) {
        const isDirectOwner = store.user_id && store.user_id === req.user.id;
        
        // Check team membership if not direct owner
        let teamAccess = { hasAccess: false };
        if (!isDirectOwner) {
          teamAccess = await checkTeamMembership(req.user.id, store.id);
        }
        
        const hasAccess = isDirectOwner || teamAccess.hasAccess;
        
        if (!hasAccess) {
          console.log(`❌ User does not have access to the store for this ${modelName}`);
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
        
        // Attach access info to request
        req.storeAccess = {
          isDirectOwner,
          teamRole: teamAccess.role,
          permissions: teamAccess.permissions
        };
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
  checkResourceOwnership,
  checkTeamMembership
};