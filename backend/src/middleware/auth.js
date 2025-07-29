const jwt = require('jsonwebtoken');
const { User, Customer } = require('../models');
const { supabase } = require('../database/connection');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    
    // Determine which table to query based on role in JWT
    const isCustomer = decoded.role === 'customer';
    const tableName = isCustomer ? 'customers' : 'users';
    const ModelClass = isCustomer ? Customer : User;
    
    // Try Supabase first
    try {
      const { data: supabaseUser, error } = await supabase
        .from(tableName)
        .select('id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login, role, account_type, created_at, updated_at')
        .eq('id', decoded.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      user = supabaseUser;
    } catch (supabaseError) {
      console.error(`❌ Supabase auth error for ${tableName}, falling back to Sequelize:`, supabaseError);
      
      // Fallback to Sequelize with appropriate model
      user = await ModelClass.findByPk(decoded.id);
    }
    
    if (!user) {
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

    req.user = user;
    next();
  } catch (error) {
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

module.exports = authMiddleware;
module.exports.authorize = authorize;
module.exports.validateRoleSession = validateRoleSession;
module.exports.customerOnly = customerOnly;
module.exports.storeOwnerOnly = storeOwnerOnly;
module.exports.adminOnly = adminOnly;