const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const IntegrationConfig = require('../models/IntegrationConfig');
const jobManager = require('../core/BackgroundJobManager');

router.use(authMiddleware);

router.post('/configure', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, credentials, export_settings } = req.body;

    const configData = {
      appId: credentials.app_id,
      certId: credentials.cert_id,
      devId: credentials.dev_id,
      authToken: credentials.auth_token,
      exportSettings: export_settings || {
        use_ai_optimization: true,
        listing_format: 'FixedPrice',
        listing_duration: '30',
        auto_relist: true
      },
      statistics: {
        total_exports: 0,
        successful_exports: 0,
        failed_exports: 0,
        total_products_synced: 0
      }
    };

    const integration = await IntegrationConfig.createOrUpdate(store_id, 'ebay', configData);

    res.json({
      success: true,
      message: 'eBay credentials configured successfully',
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

router.post('/export', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, product_ids, options = {} } = req.body;

    const job = await jobManager.scheduleJob({
      type: 'ebay:export:products',
      payload: { storeId: store_id, productIds: product_ids, options },
      priority: 'normal',
      maxRetries: 2,
      storeId: store_id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'eBay export job scheduled',
      jobId: job.id,
      statusUrl: `/api/background-jobs/${job.id}/status`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/config', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id } = req.query;
    const integration = await IntegrationConfig.findByStoreAndType(store_id, 'ebay');

    res.json({
      success: true,
      configured: !!integration,
      config: integration ? {
        status: integration.is_active ? 'active' : 'inactive',
        export_settings: integration.config_data.exportSettings,
        statistics: integration.config_data.statistics,
        last_sync_at: integration.last_sync_at
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
