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
const { MasterStore, StoreDatabase, StoreHostname, CreditBalance } = require('../models/master');
const { authMiddleware, requireStoreOwnership } = require('../middleware/authMiddleware');
const ConnectionManager = require('../services/database/ConnectionManager');
const TenantProvisioningService = require('../services/database/TenantProvisioningService');
const { encryptDatabaseCredentials } = require('../utils/encryption');

/**
 * POST /api/stores
 * Create a new store in master DB
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Store name is required'
      });
    }

    // Check store limit (optional - based on subscription)
    const existingStores = await MasterStore.countByUser(userId);
    const maxStores = 5; // TODO: Get from subscription plan

    if (existingStores >= maxStores) {
      return res.status(403).json({
        success: false,
        error: `Maximum number of stores (${maxStores}) reached`,
        code: 'STORE_LIMIT_REACHED'
      });
    }

    // Create store in master DB
    const store = await MasterStore.create({
      user_id: userId,
      status: 'pending_database',
      is_active: false
    });

    // Initialize credit balance
    await CreditBalance.create({
      store_id: store.id,
      balance: 0.00
    });

    res.status(201).json({
      success: true,
      message: 'Store created successfully. Please connect a database to activate it.',
      data: {
        store: {
          id: store.id,
          status: store.status,
          is_active: store.is_active,
          created_at: store.created_at
        }
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
router.post('/:id/connect-database', authMiddleware, requireStoreOwnership, async (req, res) => {
  try {
    const storeId = req.params.id;
    const {
      projectUrl,
      serviceRoleKey,
      anonKey,
      connectionString,
      storeName,
      storeSlug
    } = req.body;

    // Validate required fields
    if (!projectUrl || !serviceRoleKey) {
      return res.status(400).json({
        success: false,
        error: 'Supabase projectUrl and serviceRoleKey are required'
      });
    }

    // Get store from master DB
    const store = await MasterStore.findByPk(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    if (store.status !== 'pending_database') {
      return res.status(400).json({
        success: false,
        error: 'Store already has a database connected',
        code: 'ALREADY_CONNECTED'
      });
    }

    // Update store status to provisioning
    await store.startProvisioning();

    // 1. Encrypt and save credentials to master DB
    const credentials = {
      projectUrl,
      serviceRoleKey,
      anonKey,
      connectionString: connectionString || `postgresql://postgres:${serviceRoleKey}@db.${new URL(projectUrl).hostname.split('.')[0]}.supabase.co:5432/postgres`
    };

    const storeDb = await StoreDatabase.createWithCredentials(
      storeId,
      'supabase',
      credentials
    );

    // 2. Test connection
    const connectionTest = await storeDb.testConnection();

    if (!connectionTest) {
      await store.update({ status: 'pending_database' });
      return res.status(503).json({
        success: false,
        error: 'Failed to connect to database. Please check credentials.',
        code: 'CONNECTION_FAILED'
      });
    }

    // 3. Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

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
        force: false
      }
    );

    if (!provisioningResult.success) {
      await store.update({ status: 'pending_database' });
      return res.status(500).json({
        success: false,
        error: 'Failed to provision tenant database',
        details: provisioningResult.errors
      });
    }

    // 5. Create hostname mapping
    const slug = storeSlug || `store-${Date.now()}`;
    const hostname = `${slug}.catalyst.com`; // TODO: Use actual domain

    await StoreHostname.createMapping(storeId, hostname, slug, {
      isPrimary: true,
      isCustomDomain: false,
      sslEnabled: true
    });

    // 6. Activate store
    await store.completeProvisioning();

    res.json({
      success: true,
      message: 'Database connected and store activated successfully!',
      data: {
        store: {
          id: store.id,
          status: store.status,
          is_active: store.is_active
        },
        hostname,
        provisioning: provisioningResult
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);

    // Revert store status
    try {
      const store = await MasterStore.findByPk(req.params.id);
      if (store) {
        await store.update({ status: 'pending_database' });
      }
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

    const { data: stores, error } = await masterSupabaseClient
      .from('stores')
      .select('id, status, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Enrich with hostname info
    const { StoreHostname } = require('../models/master');
    const enrichedStores = await Promise.all(
      (stores || []).map(async (store) => {
        const hostnames = await StoreHostname.findByStore(store.id);
        const primaryHostname = hostnames.find(h => h.is_primary);

        // Get tenant store name if available
        let storeName = 'Unnamed Store';
        let storeSlug = null;

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
          slug: storeSlug || primaryHostname?.slug,
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
      error: 'Failed to get stores'
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
router.get('/:id', authMiddleware, requireStoreOwnership, async (req, res) => {
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
router.patch('/:id', authMiddleware, requireStoreOwnership, async (req, res) => {
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
router.delete('/:id', authMiddleware, requireStoreOwnership, async (req, res) => {
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
