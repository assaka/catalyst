const express = require('express');
const router = express.Router();
const supabaseSetup = require('../services/supabase-setup');
const authMiddleware = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

/**
 * Get Supabase connection status for a store
 */
router.get('/status/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const status = await supabaseSetup.getConnectionStatus(storeId);

    res.json(status);
  } catch (error) {
    console.error('Failed to get Supabase status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Supabase connection status',
      error: error.message
    });
  }
});

/**
 * Connect store to Supabase
 */
router.post('/connect', authMiddleware, async (req, res) => {
  try {
    const { store_id, project_url, anon_key, service_role_key } = req.body;

    if (!store_id || !project_url || !anon_key) {
      return res.status(400).json({
        success: false,
        message: 'Store ID, project URL, and anonymous key are required'
      });
    }

    // Validate URL format
    if (!project_url.startsWith('https://') || !project_url.includes('.supabase.co')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Supabase project URL format'
      });
    }

    // Check store ownership
    const storeOwnership = await checkStoreOwnership(req, res, () => {}, store_id);
    if (!storeOwnership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this store'
      });
    }

    const result = await supabaseSetup.storeCredentials(
      store_id, 
      project_url, 
      anon_key, 
      service_role_key
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        connected: true,
        project_url: result.project_url,
        has_service_role: result.has_service_role
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Supabase',
      error: error.message
    });
  }
});

/**
 * Test Supabase connection
 */
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const { project_url, anon_key, service_role_key } = req.body;

    if (!project_url || !anon_key) {
      return res.status(400).json({
        success: false,
        message: 'Project URL and anonymous key are required'
      });
    }

    const result = await supabaseSetup.testConnection(project_url, anon_key, service_role_key);

    res.json(result);
  } catch (error) {
    console.error('Failed to test Supabase connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test connection',
      error: error.message
    });
  }
});

/**
 * Run database migration
 */
router.post('/migrate', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check store ownership
    const storeOwnership = await checkStoreOwnership(req, res, () => {}, store_id);
    if (!storeOwnership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this store'
      });
    }

    // Check if Supabase is connected
    const status = await supabaseSetup.getConnectionStatus(store_id);
    if (!status.connected) {
      return res.status(400).json({
        success: false,
        message: 'Supabase not connected. Please connect first.'
      });
    }

    const result = await supabaseSetup.runMigrationDirect(store_id);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        details: result.details
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Database migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database migration failed',
      error: error.message
    });
  }
});

/**
 * Verify database setup
 */
router.get('/verify/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const result = await supabaseSetup.verifySetup(storeId);

    res.json(result);
  } catch (error) {
    console.error('Setup verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Setup verification failed',
      error: error.message
    });
  }
});

/**
 * Get setup instructions
 */
router.get('/instructions', authMiddleware, async (req, res) => {
  try {
    const instructions = supabaseSetup.getSetupInstructions();
    res.json(instructions);
  } catch (error) {
    console.error('Failed to get setup instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get setup instructions',
      error: error.message
    });
  }
});

/**
 * Disconnect Supabase
 */
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check store ownership
    const storeOwnership = await checkStoreOwnership(req, res, () => {}, store_id);
    if (!storeOwnership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this store'
      });
    }

    // Remove stored credentials
    const SupabaseOAuthToken = require('../models/SupabaseOAuthToken');
    await SupabaseOAuthToken.destroy({
      where: { store_id }
    });

    res.json({
      success: true,
      message: 'Disconnected from Supabase successfully'
    });
  } catch (error) {
    console.error('Failed to disconnect from Supabase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect from Supabase',
      error: error.message
    });
  }
});

module.exports = router;