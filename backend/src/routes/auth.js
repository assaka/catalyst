const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, LoginAttempt } = require('../models');
const passport = require('../config/passport');
const router = express.Router();

// Generate JWT token with role-specific session data
const generateToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '24h');
  const sessionId = generateSessionId();
  
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      account_type: user.account_type,
      session_id: sessionId,
      session_role: user.role,
      issued_at: Date.now()
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Generate unique session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
};

// Password strength validator
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumber) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  return null;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').custom(value => {
    const error = validatePasswordStrength(value);
    if (error) throw new Error(error);
    return true;
  }),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone, role = 'store_owner', account_type = 'agency', send_welcome_email = false, address_data } = req.body;

    // Check if user exists with same email and role
    const existingUser = await User.findOne({ where: { email, role } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with this email already exists for the ${role} role`
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role,
      account_type
    });

    // Create addresses if provided
    if (address_data && role === 'customer') {
      try {
        const { Address } = require('../models');
        const fullName = `${first_name} ${last_name}`;
        
        // Create shipping address if provided
        if (address_data.shipping_address && address_data.shipping_address.street) {
          const shippingAddr = address_data.shipping_address;
          await Address.create({
            user_id: user.id,
            type: 'shipping',
            full_name: fullName,
            street: shippingAddr.street,
            street_2: shippingAddr.street2 || null,
            city: shippingAddr.city,
            state: shippingAddr.state,
            postal_code: shippingAddr.postal_code,
            country: shippingAddr.country || 'US',
            phone: phone || null,
            email: email,
            is_default: true
          });
          console.log('Created shipping address for user:', user.id);
        }
        
        // Create billing address if provided and different from shipping
        if (address_data.billing_address && address_data.billing_address.street) {
          const billingAddr = address_data.billing_address;
          const shippingAddr = address_data.shipping_address || {};
          
          // Only create separate billing address if it's different from shipping
          const isDifferent = (
            billingAddr.street !== shippingAddr.street ||
            billingAddr.city !== shippingAddr.city ||
            billingAddr.postal_code !== shippingAddr.postal_code
          );
          
          if (isDifferent) {
            await Address.create({
              user_id: user.id,
              type: 'billing',
              full_name: fullName,
              street: billingAddr.street,
              street_2: billingAddr.street2 || null,
              city: billingAddr.city,
              state: billingAddr.state,
              postal_code: billingAddr.postal_code,
              country: billingAddr.country || 'US',
              phone: phone || null,
              email: email,
              is_default: true
            });
            console.log('Created billing address for user:', user.id);
          } else {
            // If addresses are the same, update shipping address to be 'both'
            await Address.update(
              { type: 'both' },
              { where: { user_id: user.id, type: 'shipping' } }
            );
            console.log('Updated shipping address to be both shipping and billing');
          }
        }
      } catch (addressError) {
        console.error('Failed to create addresses:', addressError);
        // Don't fail registration if address creation fails
      }
    }

    // Send welcome email if requested (for customer registrations)
    if (send_welcome_email && role === 'customer') {
      try {
        // Simple console log for now - in production this would be an actual email service
        console.log(`Welcome email should be sent to: ${email}`);
        console.log(`Welcome message: Hello ${first_name}, welcome to our store! Your account has been created successfully.`);
        
        // TODO: Implement actual email service integration here
        // Example: await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
    }

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        token,
        sessionRole: user.role,
        sessionContext: user.role === 'customer' ? 'storefront' : 'dashboard'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/check-email
// @desc    Check what roles are available for an email
// @access  Public
router.post('/check-email', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    
    // Find all accounts with this email
    const users = await User.findAll({ 
      where: { email },
      attributes: ['role', 'account_type', 'first_name', 'last_name', 'is_active']
    });
    
    if (!users || users.length === 0) {
      return res.json({
        success: true,
        data: {
          email,
          accounts: [],
          hasAccounts: false
        }
      });
    }
    
    const accounts = users.filter(user => user.is_active).map(user => ({
      role: user.role,
      account_type: user.account_type,
      name: `${user.first_name} ${user.last_name}`
    }));
    
    res.json({
      success: true,
      data: {
        email,
        accounts,
        hasAccounts: accounts.length > 0,
        multipleAccounts: accounts.length > 1
      }
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').optional().isIn(['admin', 'store_owner', 'customer']).withMessage('Invalid role'),
  body('rememberMe').optional().isBoolean().withMessage('Remember me must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, role, rememberMe } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    const isRateLimited = await LoginAttempt.checkRateLimit(email, ipAddress);
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }

    // Find users with this email, prioritizing the specified role if provided
    const whereClause = { email };
    if (role) {
      whereClause.role = role;
    }
    
    let users = await User.findAll({ where: whereClause });
    
    // If no users found with specific role, try all users with this email
    if (role && (!users || users.length === 0)) {
      users = await User.findAll({ where: { email } });
    }
    
    if (!users || users.length === 0) {
      // Log failed attempt
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        success: false
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Try to find a user account that matches the password
    // If role is specified, prioritize that role
    let authenticatedUser = null;
    
    if (role) {
      // First try the specified role
      const roleUser = users.find(u => u.role === role);
      if (roleUser) {
        const isMatch = await roleUser.comparePassword(password);
        if (isMatch) {
          authenticatedUser = roleUser;
        }
      }
    }
    
    // If no role specified or role-specific auth failed, try all accounts
    if (!authenticatedUser) {
      for (const user of users) {
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
          authenticatedUser = user;
          break;
        }
      }
    }

    if (!authenticatedUser) {
      // Log failed attempt
      await LoginAttempt.create({
        email,
        ip_address: ipAddress,
        success: false
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!authenticatedUser.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Use the authenticated user
    const user = authenticatedUser;

    // Log successful attempt
    await LoginAttempt.create({
      email,
      ip_address: ipAddress,
      success: true
    });

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token with remember me option
    const token = generateToken(user, rememberMe);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        expiresIn: rememberMe ? '30 days' : '24 hours',
        sessionRole: user.role,
        sessionContext: user.role === 'customer' ? 'storefront' : 'dashboard'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// @route   PATCH /api/auth/me
// @desc    Update current user
// @access  Private
router.patch('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const { role, account_type } = req.body;
    const updateData = {};
    
    if (role) updateData.role = role;
    if (account_type) updateData.account_type = account_type;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    await User.update(updateData, { where: { id: req.user.id } });
    
    // Fetch updated user
    const updatedUser = await User.findByPk(req.user.id);
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    const corsOrigin = process.env.CORS_ORIGIN || 'https://catalyst-pearl.vercel.app';
    
    if (err) {
      console.error('OAuth authentication error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      // Handle database connection errors specifically
      if (err.message && err.message.includes('ENETUNREACH')) {
        return res.redirect(`${corsOrigin}/auth?error=database_connection_failed`);
      }
      
      if (err.message && err.message.includes('Database connection failed')) {
        return res.redirect(`${corsOrigin}/auth?error=database_connection_failed`);
      }
      
      // Pass along more specific error info
      const errorParam = err.message ? err.message.replace(/\s+/g, '_').toLowerCase() : 'oauth_failed';
      return res.redirect(`${corsOrigin}/auth?error=${errorParam}`);
    }
    
    if (!user) {
      console.error('OAuth failed: No user returned');
      return res.redirect(`${corsOrigin}/auth?error=oauth_failed`);
    }
    
    try {
      console.log('✅ OAuth successful, generating token for user:', user.email);
      const token = generateToken(user);
      console.log('✅ Token generated successfully, redirecting to:', `${corsOrigin}/auth?token=${token}&oauth=success`);
      res.redirect(`${corsOrigin}/auth?token=${token}&oauth=success`);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      console.error('User object:', user);
      res.redirect(`${corsOrigin}/auth?error=token_generation_failed`);
    }
  })(req, res, next);
});

// @route   POST /api/auth/logout
// @desc    Logout user and log the event
// @access  Private
router.post('/logout', require('../middleware/auth'), async (req, res) => {
  try {
    console.log('🔐 Logout request received for user:', req.user.email);
    
    // Log the logout event for security auditing
    try {
      await LoginAttempt.create({
        email: req.user.email,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        success: true,
        action: 'logout',
        attempted_at: new Date()
      });
      console.log('✅ Logout event logged successfully');
    } catch (logError) {
      console.error('❌ Failed to log logout event:', logError.message);
      // Don't fail the logout if logging fails
    }
    
    // In a JWT-based system, we can't invalidate tokens server-side without a blacklist
    // For now, we'll just log the event and return success
    // TODO: Implement token blacklisting for enhanced security
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    console.log('✅ Logout successful for user:', req.user.email);
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

module.exports = router;