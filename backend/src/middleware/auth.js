const jwt = require('jsonwebtoken');
const { User } = require('../models');
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
    
    // Try Supabase first
    try {
      const { data: supabaseUser, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, avatar_url, is_active, email_verified, last_login, role, account_type, created_at, updated_at')
        .eq('id', decoded.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      user = supabaseUser;
    } catch (supabaseError) {
      console.error('❌ Supabase auth error, falling back to Sequelize:', supabaseError);
      
      // Fallback to Sequelize
      user = await User.findByPk(decoded.id);
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

module.exports = authMiddleware;
module.exports.authorize = authorize;