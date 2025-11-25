/**
 * Authentication Routes (Master-Tenant Architecture)
 *
 * POST /api/auth/register - Register new agency user
 * POST /api/auth/login - Login with email/password
 * POST /api/auth/logout - Logout
 * POST /api/auth/refresh - Refresh access token
 * GET /api/auth/me - Get current user info
 *
 * This is the NEW auth system for master-tenant architecture
 * The old auth.js remains for backward compatibility
 */

const express = require('express');
const router = express.Router();
const { generateTokenPair, refreshAccessToken } = require('../utils/jwt');
const { authMiddleware } = require('../middleware/authMiddleware');
const ConnectionManager = require('../services/database/ConnectionManager');
const { masterDbClient } = require('../database/masterConnection');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/auth/register
 * Register new agency user and create initial store
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, storeName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required'
      });
    }

    // Check if user already exists (using Supabase client)
    const { data: existingUsers, error: checkError } = await masterDbClient
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check existing user: ${checkError.message}`);
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in master DB (using Supabase client)
    const userId = uuidv4();
    const { data: user, error: userError } = await masterDbClient
      .from('users')
      .insert({
        id: userId,
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        account_type: 'agency',
        role: 'store_owner',
        is_active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // Create initial store in master DB
    const storeId = uuidv4();
    const { data: store, error: storeError } = await masterDbClient
      .from('stores')
      .insert({
        id: storeId,
        user_id: userId,
        status: 'pending_database',
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (storeError) {
      throw new Error(`Failed to create store: ${storeError.message}`);
    }


    // Generate JWT tokens
    const tokens = generateTokenPair(user, storeId);

    // Remove sensitive fields
    delete user.password;
    delete user.email_verification_token;
    delete user.password_reset_token;

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please connect a database to activate your store.',
      data: {
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: '7 days',
        sessionRole: user.role,
        sessionContext: 'dashboard'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password
 *
 * Supports two login modes:
 * 1. With hostname (tenant context) - queries tenant DB
 * 2. Without hostname (platform) - queries master DB
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, hostname } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    let user, storeId;

    if (hostname) {
      // === TENANT LOGIN ===
      // Resolve store from hostname
      const hostnameRecord = await StoreHostname.findByHostname(hostname);

      if (!hostnameRecord) {
        return res.status(404).json({
          success: false,
          error: 'Store not found for this hostname',
          code: 'STORE_NOT_FOUND'
        });
      }

      storeId = hostnameRecord.store_id;

      // Get tenant DB connection
      const tenantDb = await ConnectionManager.getStoreConnection(storeId);

      // Query tenant DB for user
      const { data: users, error } = await tenantDb
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error || !users || users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      user = users[0];

      // Verify password (tenant user)
      const bcrypt = require('bcryptjs');
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'User account is inactive',
          code: 'USER_INACTIVE'
        });
      }
    } else {
      // === MASTER LOGIN ===
      // Query master DB for agency user (using Supabase client)
      const { data: users, error: userError } = await masterDbClient
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (userError || !users || users.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      user = users[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'User account is inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Get user's first active store (using Supabase client)
      const { data: stores, error: storesError } = await masterDbClient
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!storesError && stores && stores.length > 0) {
        // User owns a store
        storeId = stores[0].id;
      } else {
        // Check if user is a team member of any store
        const { data: teamMemberships, error: teamError } = await masterDbClient
          .from('store_teams')
          .select('store_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!teamError && teamMemberships && teamMemberships.length > 0) {
          // User is a team member
          storeId = teamMemberships[0].store_id;
        } else {
          // No owned stores and no team memberships
          return res.status(404).json({
            success: false,
            error: 'No store found for user',
            code: 'NO_STORE'
          });
        }
      }
    }

    // Update last login (if method exists)
    if (user.updateLastLogin) {
      await user.updateLastLogin();
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(user, storeId);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name || user.firstName,
          last_name: user.last_name || user.lastName,
          role: user.role,
          account_type: user.account_type || user.accountType,
          phone: user.phone,
          avatar_url: user.avatar_url,
          is_active: user.is_active,
          email_verified: user.email_verified,
          credits: user.credits,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: '7 days', // Match old format
        sessionRole: user.role, // Match old format
        sessionContext: user.role === 'customer' ? 'storefront' : 'dashboard' // Match old format
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client removes token, optional server-side blacklist)
 * Made permissive - succeeds even without valid token
 */
router.post('/logout', async (req, res) => {
  // Don't require auth - logout should always succeed
  // Client-side clears token, server just acknowledges
  // TODO: Add token to blacklist (Redis) if needed

  try {
    // Optional: Log logout attempt if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
      try {
        const token = extractTokenFromHeader(authHeader);
        const decoded = verifyToken(token);
        console.log(`User ${decoded.email} logged out`);
      } catch (err) {
        // Token invalid, that's ok
      }
    }
  } catch (err) {
    // Ignore errors
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const newAccessToken = refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message,
      code: 'REFRESH_FAILED'
    });
  }
});

/**
 * POST /api/auth/upgrade-guest
 * Upgrade guest customer to registered account (for post-order account creation)
 * Public route - requires store_id in body
 */
router.post('/upgrade-guest', async (req, res) => {
  try {
    const { email, password, store_id } = req.body;

    // Validate input
    if (!email || !password || !store_id) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and store_id are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Find existing guest customer (password is null)
    const { data: guestCustomer, error: findError } = await tenantDb
      .from('customers')
      .select('*')
      .eq('email', email)
      .eq('store_id', store_id)
      .is('password', null)
      .maybeSingle();

    if (findError) {
      console.error('Error finding guest customer:', findError);
      return res.status(500).json({
        success: false,
        error: 'Failed to find customer'
      });
    }

    if (!guestCustomer) {
      return res.status(404).json({
        success: false,
        error: 'No guest account found with this email, or account is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the guest customer with password
    const { data: updatedCustomer, error: updateError } = await tenantDb
      .from('customers')
      .update({
        password: hashedPassword,
        email_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', guestCustomer.id)
      .select()
      .single();

    if (updateError) {
      console.error('Upgrade guest error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upgrade account'
      });
    }

    // Link all guest orders to this customer account
    try {
      await tenantDb
        .from('orders')
        .update({ customer_id: updatedCustomer.id })
        .eq('customer_email', email)
        .eq('store_id', store_id)
        .is('customer_id', null);
    } catch (orderLinkError) {
      // Don't fail the account upgrade if order linking fails
      console.error('Order linking error:', orderLinkError);
    }

    // Generate token for auto-login
    const tokens = generateTokenPair({
      id: updatedCustomer.id,
      email: updatedCustomer.email,
      role: 'customer',
      account_type: 'individual',
      first_name: updatedCustomer.first_name,
      last_name: updatedCustomer.last_name
    }, store_id);

    // Remove password from response
    const { password: _, ...customerWithoutPassword } = updatedCustomer;

    res.status(200).json({
      success: true,
      message: 'Account upgraded successfully',
      data: {
        user: customerWithoutPassword,
        customer: customerWithoutPassword,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionRole: 'customer',
        sessionContext: 'storefront'
      }
    });
  } catch (error) {
    console.error('Upgrade guest error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
});

/**
 * GET /api/auth/check-customer-status/:email/:store_id
 * Check if a customer has already registered (has password)
 * Public route
 */
router.get('/check-customer-status/:email/:store_id', async (req, res) => {
  try {
    const { email, store_id } = req.params;

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: customer } = await tenantDb
      .from('customers')
      .select('id, email, password')
      .eq('email', email)
      .eq('store_id', store_id)
      .maybeSingle();

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
      error: 'Server error'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info (fresh from database)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Fetch fresh user data from database (not stale JWT data)
    // This ensures credits and other fields are always up-to-date
    const { data: freshUser, error } = await masterDbClient
      .from('users')
      .select('id, email, first_name, last_name, role, credits, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error || !freshUser) {
      console.error('Failed to fetch fresh user data:', error);
      // Fallback to JWT data if database query fails
      return res.json({
        success: true,
        data: req.user
      });
    }

    // Merge fresh data with JWT data (keep store_id from JWT)
    const userData = {
      ...req.user,
      ...freshUser,
      full_name: [freshUser.first_name, freshUser.last_name].filter(Boolean).join(' ') || null,
      store_id: req.user.store_id // Preserve store context from JWT
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

module.exports = router;
