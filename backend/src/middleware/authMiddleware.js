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
const { masterDbClient } = require('../database/masterConnection');
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

    // 4. Fetch user based on role - customers are in tenant DB, others in master DB
    let user;

    if (decoded.role === 'customer' && decoded.storeId) {
      // Customer token - look up in tenant DB's customers table
      try {
        const tenantDb = await ConnectionManager.getStoreConnection(decoded.storeId);
        const customerSelectFields = 'id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login, role, created_at, updated_at';

        const { data: customer, error: customerError } = await tenantDb
          .from('customers')
          .select(customerSelectFields)
          .eq('id', decoded.userId)
          .single();

        if (customerError || !customer) {
          console.error('Customer not found in tenant DB:', decoded.userId, customerError?.message);
          return res.status(401).json({
            success: false,
            error: 'Customer session expired. Please log in again.',
            code: 'USER_NOT_FOUND'
          });
        }

        user = {
          ...customer,
          account_type: 'individual',
          role: 'customer'
        };
      } catch (tenantError) {
        console.error('Failed to connect to tenant DB for customer auth:', tenantError.message);
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          code: 'TENANT_ERROR'
        });
      }
    } else {
      // Non-customer token - look up in master DB's users table
      const selectFields = 'id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login, role, account_type, created_at, updated_at, credits';

      const { data: masterUser, error: userError } = await masterDbClient
        .from('users')
        .select(selectFields)
        .eq('id', decoded.userId)
        .single();

      if (userError || !masterUser) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      user = masterUser;
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User account is inactive',
        code: 'USER_INACTIVE'
      });
    }

    // 5. Attach FULL user object to request (matches old auth middleware exactly)
    req.user = {
      ...user,
      store_id: decoded.storeId // Add store_id from JWT (not in users table)
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
      const { data: store, error: storeError } = await masterDbClient
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

/**
 * Combined authentication + role authorization middleware
 * More convenient than chaining authMiddleware + requireRole
 *
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.post('/', authWithRole(['admin', 'store_owner']), handler)
 */
function authWithRole(allowedRoles) {
  return async (req, res, next) => {
    // First run authentication
    await new Promise((resolve, reject) => {
      authMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }).catch((err) => {
      // Authentication failed, error already sent by authMiddleware
      return;
    });

    // If auth failed, response already sent
    if (res.headersSent) return;

    // Check role authorization
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.error('[authWithRole] Authorization failed:', {
        userId: req.user.id,
        userEmail: req.user.email,
        currentRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });

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
 * Convenience middleware for admin/store_owner routes (most common case)
 * Equivalent to: authWithRole(['admin', 'store_owner'])
 */
const authAdmin = authWithRole(['admin', 'store_owner']);

/**
 * Convenience middleware for admin-only routes
 * Equivalent to: authWithRole(['admin'])
 */
const authAdminOnly = authWithRole(['admin']);

/**
 * Convenience middleware for customer routes
 * Equivalent to: authWithRole(['customer'])
 */
const authCustomer = authWithRole(['customer']);

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireAgency,
  requireStoreOwnership,
  apiKeyAuth,
  // New combined middleware
  authWithRole,
  authAdmin,
  authAdminOnly,
  authCustomer
};
