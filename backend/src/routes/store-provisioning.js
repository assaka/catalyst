/**
 * Store Provisioning Routes
 * Handles automatic store creation with subdomain and migration setup
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const StoreProvisioningService = require('../services/store-provisioning-service');
const { MIGRATION_TYPES } = require('../config/migration-types');

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/store-provisioning/create
 * Create a new store with automatic subdomain and setup
 */
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      description = '', 
      plan = 'starter',
      settings = {},
      autoSetupMigration = true 
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Store name must be at least 2 characters long'
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Store name must be less than 50 characters'
      });
    }

    const userData = {
      id: userId,
      email: req.user.email
    };

    const storeData = {
      name: name.trim(),
      description: description.trim(),
      plan,
      settings
    };

    console.log(`🏪 Provisioning new store "${name}" for user ${userId}`);

    const provisioningService = new StoreProvisioningService();
    const result = await provisioningService.provisionStore(userData, storeData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Store provisioning failed'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Store provisioned successfully',
      data: {
        store: result.store,
        provisioning: result.provisioning,
        dns: {
          domain: result.store.domain,
          subdomain: result.store.subdomain,
          records_created: result.dns?.records?.length || 0
        },
        migration: {
          auto_setup: autoSetupMigration,
          available_types: Object.keys(MIGRATION_TYPES).length,
          critical_types: ['catalog', 'content']
        }
      }
    });

  } catch (error) {
    console.error('Store provisioning error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/store-provisioning/check-subdomain/:subdomain
 * Check if a subdomain is available
 */
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;
    
    if (!subdomain || subdomain.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain must be at least 3 characters long'
      });
    }

    if (subdomain.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain must be less than 15 characters'
      });
    }

    // Validate subdomain format
    if (!/^[a-z0-9]+$/.test(subdomain)) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain must contain only lowercase letters and numbers'
      });
    }

    const provisioningService = new StoreProvisioningService();
    const isAvailable = await provisioningService.isSubdomainAvailable(subdomain);

    res.json({
      success: true,
      data: {
        subdomain,
        available: isAvailable,
        domain: isAvailable ? `${subdomain}.catalyst.app` : null,
        checked_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Subdomain check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/store-provisioning/status/:storeId
 * Get provisioning status for a store
 */
router.get('/status/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;

    // Verify user owns this store
    const { Store } = require('../models'); // Master/Tenant hybrid model
    const store = await Store.findOne({
      where: { id: storeId, user_id: userId }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found or access denied'
      });
    }

    const provisioningService = new StoreProvisioningService();
    const status = await provisioningService.getProvisioningStatus(storeId);

    res.json(status);

  } catch (error) {
    console.error('Provisioning status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/store-provisioning/:storeId/setup-migration
 * Setup comprehensive migration for an existing store
 */
router.post('/:storeId/setup-migration', async (req, res) => {
  try {
    const { storeId } = req.params;
    const userId = req.user.id;
    const { migrationTypes = ['catalog', 'content'] } = req.body;

    // Verify user owns this store
    const { Store } = require('../models'); // Master/Tenant hybrid model
    const store = await Store.findOne({
      where: { id: storeId, user_id: userId }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found or access denied'
      });
    }

    // Validate migration types
    const invalidTypes = migrationTypes.filter(type => !MIGRATION_TYPES[type]);
    if (invalidTypes.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid migration types: ${invalidTypes.join(', ')}`
      });
    }

    const provisioningService = new StoreProvisioningService();
    await provisioningService.setupMigrationConfiguration(storeId);

    res.json({
      success: true,
      message: 'Migration configuration setup completed',
      data: {
        store_id: storeId,
        migration_types: migrationTypes,
        total_types_available: Object.keys(MIGRATION_TYPES).length,
        estimated_size_mb: migrationTypes.reduce((total, type) => 
          total + (MIGRATION_TYPES[type]?.estimated_size_mb || 0), 0
        )
      }
    });

  } catch (error) {
    console.error('Setup migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/store-provisioning/migration-info
 * Get comprehensive migration information
 */
router.get('/migration-info', async (req, res) => {
  try {
    const { getMigrationTypesByPriority, getCriticalMigrationTypes, getTotalEstimatedSize } = require('../config/migration-types');
    
    res.json({
      success: true,
      data: {
        all_types: getMigrationTypesByPriority(),
        critical_types: getCriticalMigrationTypes(),
        total_estimated_size_mb: getTotalEstimatedSize(),
        total_tables: require('../config/migration-types').getAllMigrationTables().length,
        migration_order: getMigrationTypesByPriority().map(t => t.type)
      }
    });

  } catch (error) {
    console.error('Migration info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;