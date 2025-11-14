/**
 * Store Management Routes (Master-Tenant Architecture)
 *
 * POST /api/stores - Create new store
 * POST /api/stores/:id/connect-database - Connect Supabase database via OAuth
 * GET /api/stores - Get all user's stores
 * GET /api/stores/:id - Get store details
 * PATCH /api/stores/:id - Update store settings
 * DELETE /api/stores/:id - Delete store
 */

const express = require('express');
const router = express.Router();
const { masterSupabaseClient } = require('../database/masterConnection');
const { authMiddleware } = require('../middleware/auth'); // Use old working auth middleware
const ConnectionManager = require('../services/database/ConnectionManager');
const TenantProvisioningService = require('../services/database/TenantProvisioningService');
const { encryptDatabaseCredentials } = require('../utils/encryption');

// Master database models
const MasterStore = require('../models/master/MasterStore');
const StoreDatabase = require('../models/master/StoreDatabase');
const StoreHostname = require('../models/master/StoreHostname');
const CreditBalance = require('../models/master/CreditBalance');

/**
 * POST /api/stores
 * Create a new store in master DB
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    console.log('Creating store for user:', userId, 'name:', name);

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Store name is required'
      });
    }

    // Check store limit using Supabase client
    const { count, error: countError } = await masterSupabaseClient
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const maxStores = 5;
    if (count >= maxStores) {
      return res.status(403).json({
        success: false,
        error: `Maximum number of stores (${maxStores}) reached`,
        code: 'STORE_LIMIT_REACHED'
      });
    }

    // Create store in master DB using Supabase client
    const { v4: uuidv4 } = require('uuid');
    const storeId = uuidv4();

    const { data: store, error: storeError } = await masterSupabaseClient
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

    // Initialize credit balance
    const { error: balanceError } = await masterSupabaseClient
      .from('credit_balances')
      .insert({
        id: uuidv4(),
        store_id: storeId,
        balance: 0.00,
        reserved_balance: 0.00,
        lifetime_purchased: 0.00,
        lifetime_spent: 0.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (balanceError) {
      console.warn('Failed to create credit balance:', balanceError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Store created successfully. Please connect a database to activate it.',
      data: {
        store
      }
    });
  } catch (error) {
    console.error('Store creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create store',
      details: error.message
    });
  }
});

/**
 * POST /api/stores/:id/connect-database
 * Connect Supabase database to store via OAuth
 */
router.post('/:id/connect-database', authMiddleware, async (req, res) => {
  try {
    const storeId = req.params.id;

    console.log('📥 connect-database request:', {
      storeId,
      bodyKeys: Object.keys(req.body),
      useOAuth: req.body.useOAuth,
      autoProvision: req.body.autoProvision
    });

    const {
      projectUrl: manualProjectUrl,
      serviceRoleKey: manualServiceKey,
      anonKey: manualAnonKey,
      connectionString: manualConnectionString,
      storeName,
      storeSlug,
      useOAuth,
      autoProvision
    } = req.body;

    let projectUrl, serviceRoleKey, anonKey, connectionString, oauthAccessToken, projectId;

    // If using OAuth, get credentials from Redis (or memory fallback)
    if (useOAuth) {
      console.log('Using OAuth credentials for store:', storeId);

      let oauthToken = null;

      // Check Redis first
      try {
        const { getRedisClient } = require('../config/redis');
        const redisClient = getRedisClient();

        console.log('🔍 Redis client available:', !!redisClient);

        if (redisClient) {
          const redisKey = `oauth:pending:${storeId}`;
          console.log('🔍 Checking Redis key:', redisKey);

          const tokenDataStr = await redisClient.get(redisKey);
          console.log('🔍 Redis get result:', tokenDataStr ? 'found' : 'not found');

          if (tokenDataStr) {
            oauthToken = JSON.parse(tokenDataStr);
            console.log('✅ OAuth tokens retrieved from Redis:', {
              has_access_token: !!oauthToken.access_token,
              has_project_url: !!oauthToken.project_url,
              has_service_role_key: !!oauthToken.service_role_key
            });
          } else {
            console.log('❌ No data found in Redis for key:', redisKey);
          }
        } else {
          console.log('❌ Redis client not available');
        }
      } catch (redisError) {
        console.error('❌ Redis retrieval error:', redisError.message);
      }

      // Check memory fallback
      console.log('🔍 Checking memory fallback...');
      console.log('  global.pendingOAuthTokens exists:', !!global.pendingOAuthTokens);
      if (global.pendingOAuthTokens) {
        console.log('  Map size:', global.pendingOAuthTokens.size);
        console.log('  Has storeId?', global.pendingOAuthTokens.has(storeId));
      }

      if (!oauthToken && global.pendingOAuthTokens && global.pendingOAuthTokens.has(storeId)) {
        oauthToken = global.pendingOAuthTokens.get(storeId);
        console.log('✅ OAuth tokens retrieved from memory (fallback)');
      }

      if (!oauthToken) {
        console.error('❌ No OAuth token found in Redis OR memory for storeId:', storeId);
        return res.status(400).json({
          success: false,
          error: 'No OAuth connection found. Please connect your Supabase account first. Try OAuth again.'
        });
      }

      console.log('✅ OAuth token retrieved:', {
        project_url: oauthToken.project_url,
        has_access_token: !!oauthToken.access_token,
        has_service_role_key: !!oauthToken.service_role_key
      });

      projectUrl = oauthToken.project_url;
      serviceRoleKey = oauthToken.service_role_key || null; // Can be null for OAuth mode
      anonKey = oauthToken.anon_key;
      oauthAccessToken = oauthToken.access_token; // For running migrations via API

      // Extract project ID from project URL
      if (projectUrl) {
        projectId = new URL(projectUrl).hostname.split('.')[0];
        console.log('📍 Project ID extracted:', projectId);
      }

      // If auto-provisioning, use OAuth API - no connection string needed
      if (autoProvision) {
        console.log('🚀 Auto-provisioning mode - will use Supabase Management API');
        // Connection string not needed for OAuth API mode
        connectionString = null;
      } else {
        // Manual provisioning - require connection string
        if (!manualConnectionString) {
          return res.status(400).json({
            success: false,
            error: 'Database connection string is required for provisioning'
          });
        }
        connectionString = manualConnectionString;
        console.log('Using user-provided connection string for OAuth provisioning');
      }
    } else {
      // Use manual credentials
      projectUrl = manualProjectUrl;
      serviceRoleKey = manualServiceKey;
      anonKey = manualAnonKey;
      connectionString = manualConnectionString;
    }

    console.log('🔍 Validation check:', {
      projectUrl: projectUrl ? 'present' : 'missing',
      serviceRoleKey: serviceRoleKey ? 'present' : 'missing',
      oauthAccessToken: oauthAccessToken ? 'present' : 'missing',
      autoProvision: autoProvision,
      useOAuth: useOAuth
    });

    // Validate required fields
    if (!autoProvision) {
      // Manual mode - require both projectUrl and serviceRoleKey
      if (!projectUrl || !serviceRoleKey) {
        return res.status(400).json({
          success: false,
          error: 'Supabase projectUrl and serviceRoleKey are required for manual provisioning'
        });
      }
    } else {
      // Auto-provision OAuth mode - only require projectUrl and oauthAccessToken
      if (!projectUrl) {
        return res.status(400).json({
          success: false,
          error: 'Supabase projectUrl is required'
        });
      }
      if (!oauthAccessToken) {
        return res.status(400).json({
          success: false,
          error: 'OAuth access token is required for auto-provisioning'
        });
      }
      console.log('✅ Auto-provision mode validated - using OAuth API');
    }

    // Get store from master DB (use Supabase client to avoid Sequelize connection issues)
    console.log('🔍 Fetching store from master DB via Supabase client...');
    const { data: store, error: storeError } = await masterSupabaseClient
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('❌ Store not found:', storeError?.message);
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    console.log('✅ Store found:', {
      id: store.id,
      status: store.status,
      is_active: store.is_active
    });

    if (store.status !== 'pending_database') {
      return res.status(400).json({
        success: false,
        error: 'Store already has a database connected',
        code: 'ALREADY_CONNECTED'
      });
    }

    // Update store status to provisioning (use Supabase client)
    console.log('🔄 Updating store status to provisioning...');
    const { error: updateError } = await masterSupabaseClient
      .from('stores')
      .update({ status: 'provisioning', updated_at: new Date().toISOString() })
      .eq('id', storeId);

    if (updateError) {
      console.error('❌ Failed to update store status:', updateError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to update store status'
      });
    }

    console.log('✅ Store status updated to provisioning');

    // 1. Validate and encrypt credentials
    if (!connectionString) {
      console.warn('No connection string provided, attempting to build from project URL...');
      // Try to build connection string from projectUrl
      try {
        const projectRef = new URL(projectUrl).hostname.split('.')[0];
        connectionString = `postgresql://postgres.${projectRef}:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
        console.log('Generated connection string template:', connectionString.substring(0, 50) + '...');
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Database connection string is required. Please provide the PostgreSQL connection string from Supabase Settings → Database.'
        });
      }
    }

    // For auto-provision OAuth mode, skip database credential storage
    // We'll use the Management API which doesn't need database connection
    let storeDb = null;
    let tenantDb = null;

    if (!autoProvision) {
      // Manual mode - store credentials and create connection
      const credentials = {
        projectUrl,
        serviceRoleKey,
        anonKey,
        connectionString
      };

      console.log('Creating StoreDatabase record with credentials (manual mode)');

      storeDb = await StoreDatabase.createWithCredentials(
        storeId,
        'supabase',
        credentials
      );

      // Test connection
      const connectionTest = await storeDb.testConnection();

      if (!connectionTest) {
        await store.update({ status: 'pending_database' });
        return res.status(503).json({
          success: false,
          error: 'Failed to connect to database. Please check credentials.',
          code: 'CONNECTION_FAILED'
        });
      }

      // Get tenant DB connection
      tenantDb = await ConnectionManager.getStoreConnection(storeId);
    } else {
      // Auto-provision OAuth mode
      console.log('🚀 Auto-provision OAuth mode - skipping database connection setup');
      console.log('   Will use Supabase Management API for migrations');
      console.log('   Database credentials will be saved after provisioning succeeds');
    }

    // 4. Provision tenant database (create tables, seed data)
    const provisioningResult = await TenantProvisioningService.provisionTenantDatabase(
      tenantDb,
      storeId,
      {
        userId: req.user.id,
        userEmail: req.user.email,
        userPasswordHash: req.user.password, // TODO: Get from master user
        userFirstName: req.user.first_name,
        userLastName: req.user.last_name,
        storeName: storeName || 'My Store',
        storeSlug: storeSlug || `store-${Date.now()}`,
        force: false,
        // OAuth credentials for API-based provisioning
        oauthAccessToken: oauthAccessToken || null,
        projectId: projectId || null,
        autoProvision: autoProvision || false
      }
    );

    if (!provisioningResult.success) {
      // Revert store status using Supabase client
      await masterSupabaseClient
        .from('stores')
        .update({ status: 'pending_database', updated_at: new Date().toISOString() })
        .eq('id', storeId);

      return res.status(500).json({
        success: false,
        error: 'Failed to provision tenant database',
        details: provisioningResult.errors
      });
    }

    // 5. Create hostname mapping (use Supabase client)
    const slug = storeSlug || `store-${Date.now()}`;
    const hostname = `${slug}.catalyst.com`; // TODO: Use actual domain

    console.log('📍 Creating hostname mapping...');
    const { v4: uuidv4 } = require('uuid');
    const { error: hostnameError } = await masterSupabaseClient
      .from('store_hostnames')
      .insert({
        id: uuidv4(),
        store_id: storeId,
        hostname,
        slug,
        is_primary: true,
        is_custom_domain: false,
        ssl_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (hostnameError) {
      console.warn('⚠️ Failed to create hostname mapping:', hostnameError.message);
    } else {
      console.log('✅ Hostname mapping created');
    }

    // 6. Save OAuth tokens to tenant DB (if from OAuth flow)
    if (useOAuth) {
      try {
        console.log('💾 Saving OAuth tokens to tenant database post-provisioning...');

        // Get OAuth data from Redis first
        let oauthData = null;

        const { getRedisClient } = require('../config/redis');
        const redisClient = getRedisClient();

        if (redisClient) {
          const redisKey = `oauth:pending:${storeId}`;
          const tokenDataStr = await redisClient.get(redisKey);

          if (tokenDataStr) {
            oauthData = JSON.parse(tokenDataStr);
            console.log('✅ Retrieved OAuth tokens from Redis for saving');
          }
        }

        // Fallback to memory
        if (!oauthData && global.pendingOAuthTokens && global.pendingOAuthTokens.has(storeId)) {
          oauthData = global.pendingOAuthTokens.get(storeId);
          console.log('✅ Retrieved OAuth tokens from memory (fallback)');
        }

        if (oauthData) {
          // Use tenant DB connection to save OAuth tokens
          const { data: savedToken, error: tokenError } = await tenantDb
            .from('supabase_oauth_tokens')
            .insert({
              id: require('uuid').v4(),
              store_id: storeId,
              ...oauthData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (tokenError) {
            console.warn('⚠️ Failed to save OAuth tokens to tenant DB:', tokenError.message);
          } else {
            console.log('✅ OAuth tokens saved to tenant database');

            // Clean up from both Redis and memory
            if (redisClient) {
              await redisClient.del(`oauth:pending:${storeId}`);
              console.log('🧹 Cleaned up Redis key');
            }
            if (global.pendingOAuthTokens) {
              global.pendingOAuthTokens.delete(storeId);
              console.log('🧹 Cleaned up memory cache');
            }
          }
        } else {
          console.log('⚠️ No OAuth data found in Redis or memory - skipping save');
        }
      } catch (oauthSaveError) {
        console.warn('⚠️ Error saving OAuth tokens:', oauthSaveError.message);
        // Non-blocking - continue with activation
      }
    }

    // 7. Activate store (use Supabase client)
    console.log('🎉 Activating store...');
    const { error: activateError } = await masterSupabaseClient
      .from('stores')
      .update({
        status: 'active',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId);

    if (activateError) {
      console.error('❌ Failed to activate store:', activateError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to activate store'
      });
    }

    console.log('✅ Store activated successfully!');

    res.json({
      success: true,
      message: 'Database connected and store activated successfully!',
      data: {
        store: {
          id: storeId,
          status: 'active',
          is_active: true
        },
        hostname,
        provisioning: provisioningResult
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);

    // Revert store status (use Supabase client)
    try {
      await masterSupabaseClient
        .from('stores')
        .update({ status: 'pending_database', updated_at: new Date().toISOString() })
        .eq('id', req.params.id);
      console.log('Store status reverted to pending_database');
    } catch (revertError) {
      console.error('Failed to revert store status:', revertError);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to connect database',
      details: error.message
    });
  }
});

/**
 * GET /api/stores/dropdown
 * Get stores for dropdown (simple format)
 */
router.get('/dropdown', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { masterSupabaseClient } = require('../database/masterConnection');

    // Get stores from master DB (using Supabase client)
    const { data: stores, error } = await masterSupabaseClient
      .from('stores')
      .select('id, status, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Enrich with hostname info (using Supabase client, not Sequelize model)
    const enrichedStores = await Promise.all(
      (stores || []).map(async (store) => {
        // Get hostname from master DB using Supabase client
        const { data: hostnames } = await masterSupabaseClient
          .from('store_hostnames')
          .select('hostname, slug, is_primary')
          .eq('store_id', store.id)
          .order('is_primary', { ascending: false });

        const primaryHostname = (hostnames || []).find(h => h.is_primary) || (hostnames || [])[0];

        // Get tenant store name if available
        let storeName = 'Unnamed Store';
        let storeSlug = primaryHostname?.slug || null;

        if (store.is_active && store.status === 'active') {
          try {
            const tenantDb = await ConnectionManager.getStoreConnection(store.id);
            const { data: tenantStore } = await tenantDb
              .from('stores')
              .select('name, slug')
              .limit(1)
              .single();

            if (tenantStore) {
              storeName = tenantStore.name;
              storeSlug = tenantStore.slug;
            }
          } catch (err) {
            console.warn('Failed to get tenant store data:', err.message);
          }
        }

        return {
          id: store.id,
          name: storeName,
          slug: storeSlug,
          status: store.status,
          is_active: store.is_active
        };
      })
    );

    res.json({
      success: true,
      data: enrichedStores
    });
  } catch (error) {
    console.error('Get stores dropdown error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stores',
      details: error.message
    });
  }
});

/**
 * GET /api/stores
 * Get all stores for current user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const stores = await MasterStore.findByUser(userId);

    // Enrich with hostname info
    const enrichedStores = await Promise.all(
      stores.map(async (store) => {
        const hostnames = await StoreHostname.findByStore(store.id);
        const primaryHostname = hostnames.find(h => h.is_primary);

        return {
          id: store.id,
          status: store.status,
          is_active: store.is_active,
          created_at: store.created_at,
          hostname: primaryHostname?.hostname || null,
          slug: primaryHostname?.slug || null
        };
      })
    );

    res.json({
      success: true,
      data: {
        stores: enrichedStores,
        total: stores.length
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stores'
    });
  }
});

/**
 * GET /api/stores/:id
 * Get store details (from master + tenant)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const storeId = req.params.id;

    // Get from master DB
    const store = await MasterStore.findByPk(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // Get hostname
    const hostnames = await StoreHostname.findByStore(storeId);
    const primaryHostname = hostnames.find(h => h.is_primary);

    // Get connection info
    const connectionInfo = await ConnectionManager.getConnectionInfo(storeId);

    // Get credit balance
    const creditBalance = await CreditBalance.findByStore(storeId);

    // Get tenant data if store is active
    let tenantStoreData = null;
    if (store.isOperational()) {
      try {
        const tenantDb = await ConnectionManager.getStoreConnection(storeId);
        const { data } = await tenantDb
          .from('stores')
          .select('*')
          .limit(1)
          .single();

        tenantStoreData = data;
      } catch (error) {
        console.warn('Failed to get tenant store data:', error.message);
      }
    }

    res.json({
      success: true,
      data: {
        store: {
          id: store.id,
          status: store.status,
          is_active: store.is_active,
          created_at: store.created_at
        },
        hostname: primaryHostname?.hostname || null,
        slug: primaryHostname?.slug || null,
        connection: connectionInfo,
        credits: creditBalance ? {
          balance: parseFloat(creditBalance.balance),
          reserved: parseFloat(creditBalance.reserved_balance),
          available: creditBalance.getAvailableBalance()
        } : null,
        tenantData: tenantStoreData
      }
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get store details'
    });
  }
});

/**
 * PATCH /api/stores/:id
 * Update store settings (in tenant DB)
 */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const storeId = req.params.id;
    const updates = req.body;

    const store = await MasterStore.findByPk(storeId);

    if (!store || !store.isOperational()) {
      return res.status(400).json({
        success: false,
        error: 'Store is not operational'
      });
    }

    // Update in tenant DB
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    const { data, error } = await tenantDb
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: { store: data }
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update store'
    });
  }
});

/**
 * DELETE /api/stores/:id
 * Delete store (soft delete - suspend)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const storeId = req.params.id;

    const store = await MasterStore.findByPk(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // Soft delete - suspend the store
    await store.suspend('User requested deletion');

    res.json({
      success: true,
      message: 'Store suspended successfully'
    });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete store'
    });
  }
});

module.exports = router;
