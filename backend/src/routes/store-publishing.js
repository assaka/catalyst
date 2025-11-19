const express = require('express');
const { body, validationResult } = require('express-validator');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const Store = require('../models/Store');
const creditService = require('../services/credit-service');
const autoRenderService = require('../services/auto-render-service');
const autoSupabaseService = require('../services/auto-supabase-service');
const supabaseIntegration = require('../services/supabase-integration');

const router = express.Router();

// @route   GET /api/store-publishing/:storeId/status
// @desc    Get store publishing status
// @access  Private
router.get('/:storeId/status', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findByPk(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check credit balance
    const creditInfo = await creditService.canPublishStore(req.user.id, storeId);

    // Check external connections
    const supabaseStatus = await supabaseIntegration.getConnectionStatus(storeId);

    res.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          deployment_status: store.deployment_status,
          published: store.published,
          published_at: store.published_at
        },
        credits: creditInfo,
        connections: {
          supabase: {
            connected: supabaseStatus.connected
          }
        },
        auto_deployment: {
          supabase_project_id: store.settings?.supabase?.project_id || null
        }
      }
    });
  } catch (error) {
    console.error('Get publishing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-publishing/:storeId/publish
// @desc    Publish store (deploy and start charging)
// @access  Private
router.post('/:storeId/publish', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { userId } = req.user;
    
    const result = await autoRenderService.publishStore(storeId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Publish store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-publishing/:storeId/unpublish
// @desc    Unpublish store (stop charging)
// @access  Private
router.post('/:storeId/unpublish', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { userId } = req.user;
    
    const result = await autoRenderService.unpublishStore(storeId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Unpublish store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-publishing/:storeId/deploy
// @desc    Deploy store to Render (without publishing)
// @access  Private
router.post('/:storeId/deploy', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await Store.findByPk(storeId);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }
    
    // Deploy using auto-render service
    const deployResult = await autoRenderService.autoDeployStore(storeId, store.dataValues, req.user.id);
    
    if (deployResult.success) {
      // Also create auto-Supabase project if not exists (stored in settings.supabase now)
      if (!store.settings?.supabase?.project_id) {
        const supabaseResult = await autoSupabaseService.autoCreateProject(storeId, store.dataValues, req.user.id);
        deployResult.supabase_project = supabaseResult;
      }
    }
    
    res.json(deployResult);
  } catch (error) {
    console.error('Deploy store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// @route   POST /api/store-publishing/:storeId/transfer-supabase
// @desc    Transfer Supabase project to user's account
// @access  Private
router.post('/:storeId/transfer-supabase', authorize(['store_owner']), checkStoreOwnership, [
  body('supabase_url').isURL().withMessage('Valid Supabase URL is required'),
  body('anon_key').notEmpty().withMessage('Supabase anon key is required'),
  body('service_role_key').optional().notEmpty().withMessage('Service role key cannot be empty if provided')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { storeId } = req.params;
    const { supabase_url, anon_key, service_role_key } = req.body;
    
    // Store user's Supabase credentials
    const credentialsResult = await supabaseIntegration.storeCredentials(storeId, {
      project_url: supabase_url,
      anon_key: anon_key,
      service_role_key: service_role_key
    });
    
    if (!credentialsResult.success) {
      return res.status(400).json({
        success: false,
        message: credentialsResult.error
      });
    }
    
    // Attempt to transfer auto-created project
    const transferResult = await autoSupabaseService.transferProjectOwnership(storeId, {
      project_url: supabase_url,
      anon_key: anon_key,
      service_role_key: service_role_key
    });
    
    res.json({
      success: true,
      credentials_stored: credentialsResult.success,
      transfer_result: transferResult,
      message: 'Supabase integration configured successfully'
    });
  } catch (error) {
    console.error('Transfer Supabase project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/store-publishing/:storeId/deployment-logs
// @desc    Get deployment logs for debugging
// @access  Private
router.get('/:storeId/deployment-logs', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 100 } = req.query;
    
    const logsResult = await autoRenderService.getDeploymentLogs(storeId, parseInt(limit));
    
    res.json(logsResult);
  } catch (error) {
    console.error('Get deployment logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-publishing/:storeId/upgrade-supabase
// @desc    Upgrade placeholder Supabase project to real one
// @access  Private
router.post('/:storeId/upgrade-supabase', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    
    const result = await autoSupabaseService.upgradeToRealProject(storeId);
    
    res.json(result);
  } catch (error) {
    console.error('Upgrade Supabase project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/store-publishing/:storeId/credit-usage
// @desc    Get credit usage for store publishing
// @access  Private
router.get('/:storeId/credit-usage', authorize(['store_owner']), checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30 } = req.query;
    
    const usage = await creditService.getUsageAnalytics(req.user.id, storeId, parseInt(days));
    
    // Filter for store publishing related usage
    const publishingUsage = {
      ...usage,
      publishing_costs: usage.usage_stats.store_publishing || {
        total_credits_used: 0,
        usage_count: 0
      }
    };
    
    res.json({
      success: true,
      data: publishingUsage
    });
  } catch (error) {
    console.error('Get credit usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/store-publishing/daily-charges
// @desc    Process daily charges for all published stores (cron job endpoint)
// @access  Internal (should be secured with API key)
router.post('/daily-charges', async (req, res) => {
  try {
    // This endpoint should be called by a cron job daily
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const publishedStores = await Store.findPublishedStores();
    const results = [];
    
    for (const store of publishedStores) {
      try {
        const chargeResult = await creditService.chargeDailyPublishingFee(store.user_id, store.id);
        results.push({
          store_id: store.id,
          store_name: store.name,
          result: chargeResult
        });
      } catch (error) {
        results.push({
          store_id: store.id,
          store_name: store.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      processed: results.length,
      results: results
    });
  } catch (error) {
    console.error('Daily charges processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;