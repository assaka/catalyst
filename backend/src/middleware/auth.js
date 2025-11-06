const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');
const { supabase } = require('../database/connection');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('🔐 AUTH MIDDLEWARE - Starting authentication');
    console.log('   Path:', req.method, req.originalUrl);

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('❌ AUTH FAILED: No token provided');
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    console.log('   Token received (first 20 chars):', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('   Token decoded successfully');
    console.log('   User ID:', decoded.id);
    console.log('   Role:', decoded.role);
    console.log('   Expires:', new Date(decoded.exp * 1000).toLocaleString());

    let user;

    // Determine which table to query based on role in JWT
    const isCustomer = decoded.role === 'customer';
    const tableName = isCustomer ? 'customers' : 'users';
    const ModelClass = isCustomer ? Customer : User;

    console.log('   Looking up user in table:', tableName);

    // Try Supabase first
    try {
      // Build select statement based on table (customers have store_id, users don't)
      const baseFields = 'id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login, role, account_type, created_at, updated_at';
      const selectFields = isCustomer
        ? `${baseFields}, store_id`
        : `${baseFields}, credits`;

      const { data: supabaseUser, error } = await supabase
        .from(tableName)
        .select(selectFields)
        .eq('id', decoded.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('   Supabase error:', error.message);
        throw error;
      }

      user = supabaseUser;
      if (user) console.log('   User found in Supabase:', user.email);
    } catch (supabaseError) {
      console.log('   Supabase failed, trying Sequelize...');
      // Fallback to Sequelize with appropriate model
      user = await ModelClass.findByPk(decoded.id);
      if (user) console.log('   User found in Sequelize:', user.email);
    }

    if (!user) {
      console.log('❌ AUTH FAILED: User not found in database (ID:', decoded.id, ')');
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is inactive'
      });
    }

    // CRITICAL: Validate customer exists with the email+store_id combination from token
    // This ensures customers can only use tokens that match their actual account
    if (decoded.role === 'customer') {
      // Check if a customer exists with this email + store_id combination
      try {
        const { data: customerCheck, error: checkError } = await supabase
          .from('customers')
          .select('id')
          .eq('email', decoded.email)
          .eq('store_id', decoded.store_id)
          .single();

        if (checkError || !customerCheck) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Invalid customer session for this store'
          });
        }

      } catch (validationError) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Session validation failed'
        });
      }
    }

    console.log('✅ AUTH SUCCESS - User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ AUTH FAILED - Exception:', error.message);
    console.log('   Error name:', error.name);
    if (error.name === 'TokenExpiredError') {
      console.log('   Token has expired!');
    }
    return res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
};

// Role-based authorization middleware
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Role-specific session validation middleware
const validateRoleSession = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // First run standard auth middleware
      await new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      // Check if user role is in allowed roles
      if (allowedRoles && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access denied',
          message: `Access restricted to ${allowedRoles.join(', ')} roles only`,
          userRole: req.user.role,
          allowedRoles
        });
      }
      
      // Validate session context based on request path
      const requestPath = req.originalUrl;
      const isStorefrontPath = requestPath.includes('/storefront') || 
                              requestPath.includes('/cart') || 
                              requestPath.includes('/checkout') ||
                              requestPath.includes('/customer');
      const isDashboardPath = requestPath.includes('/dashboard') ||
                             requestPath.includes('/products') ||
                             requestPath.includes('/categories') ||
                             requestPath.includes('/settings') ||
                             requestPath.includes('/admin');
      
      // Enforce role-based path restrictions
      if (req.user.role === 'customer') {
        if (isDashboardPath && !requestPath.includes('/customer')) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Customers cannot access admin/store owner areas',
            redirectTo: '/customerauth'
          });
        }
      } else if (req.user.role === 'store_owner' || req.user.role === 'admin') {
        // Store owners and admins can access both areas
        // No additional restrictions needed
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Session validation failed'
      });
    }
  };
};

// Middleware specifically for customer-only routes
const customerOnly = validateRoleSession(['customer']);

// Middleware specifically for store owner/admin routes
const storeOwnerOnly = validateRoleSession(['store_owner', 'admin']);

// Middleware for routes that require admin privileges
const adminOnly = validateRoleSession(['admin']);

module.exports = {
  authMiddleware,
  authorize,
  validateRoleSession,
  customerOnly,
  storeOwnerOnly,
  adminOnly
};