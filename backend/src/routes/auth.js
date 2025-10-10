const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Customer, LoginAttempt } = require('../models');
const passport = require('../config/passport');
const router = express.Router();

// Helper function to determine which model to use based on role
const getModelForRole = (role) => {
  if (role === 'customer') {
    return Customer;
  } else if (role === 'store_owner' || role === 'admin') {
    return User;
  }
  throw new Error('Invalid role specified');
};

// Helper function to determine which model to use based on context
const getModelForContext = (endpoint) => {
  // Check if this is a customer-specific endpoint
  if (endpoint.includes('/customer') || endpoint.includes('customerauth')) {
    return Customer;
  }
  // Default to User model for store owners and admins
  return User;
};

// Generate JWT token with role-specific session data
const generateToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '24h');
  const sessionId = generateSessionId();

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    account_type: user.account_type,
    session_id: sessionId,
    session_role: user.role,
    issued_at: Date.now()
  };

  // Include store_id for customers to enforce store binding
  if (user.role === 'customer' && user.store_id) {
    payload.store_id = user.store_id;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
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

    // Determine which model to use based on role
    const ModelClass = getModelForRole(role);
    const tableName = role === 'customer' ? 'customers' : 'users';

    // Check if user exists with same email in the appropriate table
    const existingUser = await ModelClass.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with this email already exists in the ${tableName} table`
      });
    }

    // Create user in the appropriate table
    const user = await ModelClass.create({
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
          const addressData = {
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
          };
          
          // Set the appropriate foreign key based on user type
          if (role === 'customer') {
            addressData.customer_id = user.id;
          } else {
            addressData.user_id = user.id;
          }
          
          await Address.create(addressData);
          console.log('Created shipping address for', role === 'customer' ? 'customer' : 'user', ':', user.id);
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
            const billingAddressData = {
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
            };
            
            // Set the appropriate foreign key based on user type
            if (role === 'customer') {
              billingAddressData.customer_id = user.id;
            } else {
              billingAddressData.user_id = user.id;
            }
            
            await Address.create(billingAddressData);
            console.log('Created billing address for', role === 'customer' ? 'customer' : 'user', ':', user.id);
          } else {
            // If addresses are the same, update shipping address to be 'both'
            const whereClause = { type: 'shipping' };
            if (role === 'customer') {
              whereClause.customer_id = user.id;
            } else {
              whereClause.user_id = user.id;
            }
            
            await Address.update(
              { type: 'both' },
              { where: whereClause }
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

// @route   POST /api/auth/upgrade-guest
// @desc    Upgrade guest customer to registered account (for post-order account creation)
// @access  Public
router.post('/upgrade-guest', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('store_id').notEmpty().withMessage('Store ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, store_id } = req.body;

    // Find existing guest customer (password is null)
    const guestCustomer = await Customer.findOne({
      where: {
        email,
        store_id,
        password: null // Only upgrade true guest customers
      }
    });

    if (!guestCustomer) {
      return res.status(404).json({
        success: false,
        message: 'No guest account found with this email, or account is already registered'
      });
    }

    console.log('🔄 Upgrading guest customer to registered:', email);

    // Update the guest customer with password (this will be hashed by the beforeUpdate hook)
    await guestCustomer.update({
      password: password,
      email_verified: false // They'll need to verify their email
    });

    // Reload customer to get the fresh data with hashed password
    await guestCustomer.reload();

    console.log('✅ Guest customer upgraded successfully');
    console.log('✅ Password hash exists:', !!guestCustomer.password);

    // Link all guest orders to this customer account
    try {
      const { Order } = require('../models');
      const updatedOrders = await Order.update(
        { customer_id: guestCustomer.id },
        {
          where: {
            customer_email: email,
            store_id: store_id,
            customer_id: null // Only update orders that don't have a customer_id
          }
        }
      );
      console.log(`✅ Linked ${updatedOrders[0]} guest orders to customer account`);
    } catch (orderLinkError) {
      console.error('Failed to link orders to customer:', orderLinkError);
      // Don't fail the account upgrade if order linking fails
    }

    // Generate token for auto-login
    const token = generateToken(guestCustomer);

    // Send welcome email
    try {
      console.log(`Welcome email should be sent to: ${email}`);
      console.log(`Welcome message: Hello ${guestCustomer.first_name}, your account has been created! You can now log in to track your orders.`);
      // TODO: Implement actual email service
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Account upgraded successfully',
      data: {
        user: guestCustomer,
        customer: guestCustomer, // Include customer key for consistency with OrderSuccess.jsx
        token,
        sessionRole: 'customer',
        sessionContext: 'storefront'
      }
    });
  } catch (error) {
    console.error('Guest upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/auth/check-customer-status/:email/:store_id
// @desc    Check if a customer has already registered (has password)
// @access  Public
router.get('/check-customer-status/:email/:store_id', async (req, res) => {
  try {
    const { email, store_id } = req.params;

    const customer = await Customer.findOne({
      where: { email, store_id },
      attributes: ['id', 'email', 'password']
    });

    if (!customer) {
      return res.json({
        success: true,
        data: {
          exists: false,
          hasPassword: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        exists: true,
        hasPassword: customer.password !== null && customer.password !== undefined
      }
    });
  } catch (error) {
    console.error('Check customer status error:', error);
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

    // Find users/customers with this email based on role
    let users = [];
    
    if (role === 'customer') {
      // Search in customers table
      users = await Customer.findAll({ where: { email } });
    } else if (role === 'store_owner' || role === 'admin') {
      // Search in users table
      const whereClause = { email };
      if (role) {
        whereClause.role = role;
      }
      users = await User.findAll({ where: whereClause });
    } else {
      // No role specified - search both tables
      const customerUsers = await Customer.findAll({ where: { email } });
      const storeOwnerUsers = await User.findAll({ where: { email } });
      users = [...customerUsers, ...storeOwnerUsers];
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
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// @route   PATCH /api/auth/me
// @desc    Update current user
// @access  Private
router.patch('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
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
// @desc    Initiate Google OAuth (store_owner only)
// @access  Public
router.get('/google', (req, res, next) => {
  // Google OAuth is only for store owners
  req.session.intendedRole = 'store_owner';
  console.log(`🔐 Starting Google OAuth for store_owner role`);
  
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    const corsOrigin = process.env.CORS_ORIGIN || 'https://catalyst-pearl.vercel.app';
    // Google OAuth is always for store_owner
    const intendedRole = 'store_owner';
    
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
      // Always set user role to store_owner for Google OAuth
      if (!user.role || user.role !== 'store_owner') {
        console.log(`✅ Setting user role to store_owner for OAuth user:`, user.email);
        await User.update(
          { 
            role: 'store_owner',
            account_type: 'agency'
          },
          { where: { id: user.id } }
        );
        
        // Update user object with new role
        user.role = 'store_owner';
        user.account_type = 'agency';
      }
      
      console.log('✅ OAuth successful, generating token for store_owner:', user.email);
      const token = generateToken(user);
      
      // Always redirect to store owner auth page for Google OAuth
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
router.post('/logout', require('../middleware/auth').authMiddleware, async (req, res) => {
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

// @route   POST /api/auth/customer/register
// @desc    Register a new customer
// @access  Public
router.post('/customer/register', [
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

    const { email, password, first_name, last_name, phone, send_welcome_email = false, address_data, store_id } = req.body;

    // Check if customer exists with same email
    const existingCustomer = await Customer.findOne({ where: { email } });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }

    // Determine store_id - use provided store_id or find default store
    let customerStoreId = store_id;
    if (!customerStoreId) {
      // Get the first available store as default
      const { Store } = require('../models');
      const defaultStore = await Store.findOne();
      if (defaultStore) {
        customerStoreId = defaultStore.id;
        console.log('🏪 Assigned customer to default store:', defaultStore.name, defaultStore.id);
      }
    }

    // Create customer
    const customer = await Customer.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      role: 'customer',
      account_type: 'individual',
      store_id: customerStoreId
    });

    // Create addresses if provided
    if (address_data) {
      try {
        const { Address } = require('../models');
        const fullName = `${first_name} ${last_name}`;
        
        // Create shipping address if provided
        if (address_data.shipping_address && address_data.shipping_address.street) {
          const shippingAddr = address_data.shipping_address;
          await Address.create({
            customer_id: customer.id,
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
          console.log('Created shipping address for customer:', customer.id);
        }
        
        // Create billing address if provided and different from shipping
        if (address_data.billing_address && address_data.billing_address.street) {
          const billingAddr = address_data.billing_address;
          const shippingAddr = address_data.shipping_address || {};
          
          const isDifferent = (
            billingAddr.street !== shippingAddr.street ||
            billingAddr.city !== shippingAddr.city ||
            billingAddr.postal_code !== shippingAddr.postal_code
          );
          
          if (isDifferent) {
            await Address.create({
              customer_id: customer.id,
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
            console.log('Created billing address for customer:', customer.id);
          } else {
            await Address.update(
              { type: 'both' },
              { where: { customer_id: customer.id, type: 'shipping' } }
            );
            console.log('Updated shipping address to be both shipping and billing');
          }
        }
      } catch (addressError) {
        console.error('Failed to create addresses:', addressError);
      }
    }

    // Send welcome email if requested
    if (send_welcome_email) {
      try {
        console.log(`Welcome email should be sent to: ${email}`);
        console.log(`Welcome message: Hello ${first_name}, welcome to our store! Your account has been created successfully.`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    }

    // Generate token
    const token = generateToken(customer);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: {
        user: customer,
        token,
        sessionRole: customer.role,
        sessionContext: 'storefront'
      }
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/customer/login
// @desc    Login customer
// @access  Public
router.post('/customer/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
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

    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    const isRateLimited = await LoginAttempt.checkRateLimit(email, ipAddress);
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }

    // Find customer with this email
    console.log('🔐 Customer login attempt for:', email);
    const customer = await Customer.findOne({ where: { email } });

    if (!customer) {
      console.log('❌ Customer not found:', email);
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

    console.log('✅ Customer found:', customer.id);
    console.log('🔍 Customer has password:', !!customer.password);

    // Check password
    if (!customer.password) {
      console.log('❌ Customer has no password (guest account)');
      return res.status(400).json({
        success: false,
        message: 'This account has not been activated yet. Please create a password first.'
      });
    }

    const isMatch = await customer.comparePassword(password);
    console.log('🔍 Password match result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password mismatch for customer:', customer.id);
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

    // Check if customer is active
    if (!customer.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Log successful attempt
    await LoginAttempt.create({
      email,
      ip_address: ipAddress,
      success: true
    });

    // Update last login
    await customer.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(customer, rememberMe);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: customer,
        token,
        expiresIn: rememberMe ? '30 days' : '24 hours',
        sessionRole: customer.role,
        sessionContext: 'storefront'
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Debug endpoint to check customers (REMOVE IN PRODUCTION)
router.get('/debug/customers', async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ['id', 'email', 'first_name', 'last_name', 'store_id', 'created_at'],
      limit: 10
    });
    
    res.json({
      success: true,
      count: customers.length,
      customers: customers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fix endpoint to assign store_id to customers with null store_id
router.post('/debug/fix-customer-stores', async (req, res) => {
  try {
    const { Store } = require('../models');
    
    // Get the first available store as default
    const defaultStore = await Store.findOne();
    if (!defaultStore) {
      return res.status(400).json({ error: 'No active store found' });
    }
    
    // Update customers with null store_id
    const result = await Customer.update(
      { store_id: defaultStore.id },
      { where: { store_id: null } }
    );
    
    console.log('🏪 Fixed customers with null store_id, assigned to store:', defaultStore.name);
    
    res.json({
      success: true,
      message: `Updated ${result[0]} customers with store_id: ${defaultStore.id}`,
      store: { id: defaultStore.id, name: defaultStore.name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;