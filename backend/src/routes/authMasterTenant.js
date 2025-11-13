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
const { MasterUser, MasterStore, StoreHostname, CreditBalance } = require('../models/master');
const { generateTokenPair, refreshAccessToken } = require('../utils/jwt');
const { authMiddleware } = require('../middleware/authMiddleware');
const ConnectionManager = require('../services/database/ConnectionManager');

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

    // Check if user already exists
    const existingUser = await MasterUser.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create user in master DB
    const user = await MasterUser.create({
      email,
      password, // Will be hashed by model hook
      first_name: firstName,
      last_name: lastName,
      account_type: 'agency',
      role: 'store_owner',
      is_active: true,
      email_verified: false // TODO: Send verification email
    });

    // Create initial store in master DB
    const store = await MasterStore.create({
      user_id: user.id,
      status: 'pending_database',
      is_active: false
    });

    // Initialize credit balance
    await CreditBalance.create({
      store_id: store.id,
      balance: 0.00
    });

    // Generate JWT tokens
    const tokens = generateTokenPair(user, store.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please connect a database to activate your store.',
      data: {
        user: user.toJSON(),
        store: {
          id: store.id,
          status: store.status,
          is_active: store.is_active
        },
        tokens
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
      // Query master DB for agency user
      user = await MasterUser.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const validPassword = await user.comparePassword(password);

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

      // Get user's first active store
      const stores = await MasterStore.findByUser(user.id);
      if (stores.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No store found for user',
          code: 'NO_STORE'
        });
      }

      storeId = stores[0].id;
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
          account_type: user.account_type || user.accountType
        },
        storeId,
        tokens
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
 */
router.post('/logout', authMiddleware, async (req, res) => {
  // TODO: Add token to blacklist (Redis) if needed
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
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    const user = await MasterUser.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's stores
    const stores = await MasterStore.findByUser(user.id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        stores: stores.map(s => ({
          id: s.id,
          status: s.status,
          is_active: s.is_active
        })),
        currentStoreId: req.user.store_id
      }
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
