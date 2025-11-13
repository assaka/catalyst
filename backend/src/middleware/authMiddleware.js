/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and attaches user info to requests
 * Used to protect routes that require authentication
 *
 * Usage:
 *   router.get('/protected', authMiddleware, (req, res) => {
 *     // req.user contains authenticated user info
 *     // req.user.id, req.user.store_id, req.user.email, etc.
 *   });
 */

const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { masterSupabaseClient } = require('../database/masterConnection');
const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request
 */
async function authMiddleware(req, res, next) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    // 2. Verify JWT token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_TOKEN'
      });
    }

    // 3. Check token type
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        code: 'WRONG_TOKEN_TYPE'
      });
    }

    // 4. Verify user still exists and is active in master DB (using Supabase client)
    const { data: user, error: userError } = await masterSupabaseClient
      .from('users')
      .select('id, is_active')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // 5. Attach user info to request
    req.user = {
      id: decoded.userId,
      store_id: decoded.storeId,
      email: decoded.email,
      role: decoded.role,
      account_type: decoded.accountType,
      first_name: decoded.firstName,
      last_name: decoded.lastName
    };

    // 6. Optionally attach tenant DB connection
    if (decoded.storeId && req.headers['x-attach-tenant-db'] === 'true') {
      try {
        req.tenantDb = await ConnectionManager.getStoreConnection(decoded.storeId);
      } catch (error) {
        console.error('Failed to attach tenant DB:', error.message);
        // Don't fail the request, just log the error
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token, continue without user
      return next();
    }

    const decoded = verifyToken(token);
    const user = await MasterUser.findByPk(decoded.userId);

    if (user && user.is_active) {
      req.user = {
        id: decoded.userId,
        store_id: decoded.storeId,
        email: decoded.email,
        role: decoded.role,
        account_type: decoded.accountType
      };
    }

    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    next();
  }
}

/**
 * Require specific role
 * Use after authMiddleware
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
}

/**
 * Require agency account type
 * Use after authMiddleware
 */
function requireAgency(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.account_type !== 'agency') {
    return res.status(403).json({
      success: false,
      error: 'Agency account required',
      code: 'NOT_AGENCY'
    });
  }

  next();
}

/**
 * Require store ownership
 * Verifies user owns the store specified in route params
 */
async function requireStoreOwnership(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const storeId = req.params.storeId || req.params.id;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'Store ID required'
      });
    }

    // Check if user's authenticated storeId matches route param
    if (req.user.store_id !== storeId) {
      // Alternatively, check if user owns this store in master DB (using Supabase client)
      const { data: store, error: storeError } = await masterSupabaseClient
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('user_id', req.user.id)
        .single();

      if (storeError || !store) {
        return res.status(403).json({
          success: false,
          error: 'You do not own this store',
          code: 'NOT_STORE_OWNER'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Store ownership check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify store ownership'
    });
  }
}

/**
 * API Key authentication (alternative to JWT)
 * Checks X-API-Key header
 */
async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        code: 'NO_API_KEY'
      });
    }

    // Verify API key against database
    // TODO: Implement API key model and verification
    // For now, just reject
    return res.status(401).json({
      success: false,
      error: 'API key authentication not yet implemented',
      code: 'NOT_IMPLEMENTED'
    });

    // When implemented:
    // const { hashApiKey } = require('../utils/jwt');
    // const hashedKey = hashApiKey(apiKey);
    // const apiKeyRecord = await ApiKey.findOne({ where: { key_hash: hashedKey } });
    // if (apiKeyRecord && apiKeyRecord.is_active) {
    //   req.user = { ... };
    //   next();
    // }
  } catch (error) {
    console.error('API key auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireAgency,
  requireStoreOwnership,
  apiKeyAuth
};
