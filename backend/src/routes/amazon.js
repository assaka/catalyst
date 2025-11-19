const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const IntegrationConfig = require('../models/IntegrationConfig');
const jobManager = require('../core/BackgroundJobManager');

router.use(authMiddleware);

/**
 * Configure Amazon credentials
 */
router.post('/configure', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, credentials, marketplace_id, region, export_settings } = req.body;

    const configData = {
      sellerId: credentials.seller_id,
      mwsAuthToken: credentials.mws_auth_token,
      awsAccessKeyId: credentials.aws_access_key_id,
      awsSecretAccessKey: credentials.aws_secret_access_key,
      marketplaceId: marketplace_id || 'ATVPDKIKX0DER',
      region: region || 'US',
      exportSettings: export_settings || {
        use_ai_optimization: true,
        auto_translate: true,
        include_variants: true,
        export_out_of_stock: false,
        price_adjustment_percent: 0
      },
      statistics: {
        total_exports: 0,
        successful_exports: 0,
        failed_exports: 0,
        total_products_synced: 0
      }
    };

    const integration = await IntegrationConfig.createOrUpdate(store_id, 'amazon', configData);

    res.json({
      success: true,
      message: 'Amazon credentials configured successfully',
      integration: {
        id: integration.id,
        integration_type: integration.integration_type,
        is_active: integration.is_active
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Export products to Amazon
 */
router.post('/export', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, product_ids, options = {} } = req.body;

    const job = await jobManager.scheduleJob({
      type: 'amazon:export:products',
      payload: {
        storeId: store_id,
        productIds: product_ids,
        options
      },
      priority: 'normal',
      maxRetries: 2,
      storeId: store_id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Amazon export job scheduled',
      jobId: job.id,
      statusUrl: `/api/background-jobs/${job.id}/status`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Sync inventory
 */
router.post('/sync-inventory', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, product_ids } = req.body;

    const job = await jobManager.scheduleJob({
      type: 'amazon:sync:inventory',
      payload: {
        storeId: store_id,
        productIds: product_ids
      },
      priority: 'high',
      storeId: store_id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Inventory sync job scheduled',
      jobId: job.id,
      statusUrl: `/api/background-jobs/${job.id}/status`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Amazon configuration
 */
router.get('/config', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.query;

    const integration = await IntegrationConfig.findByStoreAndType(store_id, 'amazon');

    if (!integration) {
      return res.json({
        success: true,
        configured: false
      });
    }

    res.json({
      success: true,
      configured: true,
      config: {
        marketplace_id: integration.config_data.marketplaceId,
        region: integration.config_data.region,
        status: integration.is_active ? 'active' : 'inactive',
        export_settings: integration.config_data.exportSettings,
        statistics: integration.config_data.statistics,
        last_sync_at: integration.last_sync_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
