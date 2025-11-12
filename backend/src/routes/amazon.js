const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const MarketplaceCredential = require('../models/MarketplaceCredential');
const jobManager = require('../core/BackgroundJobManager');

router.use(authMiddleware);

/**
 * Configure Amazon credentials
 */
router.post('/configure', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, credentials, marketplace_id, region, export_settings } = req.body;

    const [credential, created] = await MarketplaceCredential.findOrCreate({
      where: {
        store_id,
        marketplace: 'amazon'
      },
      defaults: {
        credentials,
        marketplace_id: marketplace_id || 'ATVPDKIKX0DER',
        region: region || 'US',
        export_settings: export_settings || {}
      }
    });

    if (!created) {
      credential.credentials = credentials;
      credential.marketplace_id = marketplace_id;
      credential.region = region;
      if (export_settings) {
        credential.export_settings = export_settings;
      }
      await credential.save();
    }

    res.json({
      success: true,
      message: 'Amazon credentials configured successfully',
      credential: {
        id: credential.id,
        marketplace: credential.marketplace,
        status: credential.status
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

    const credential = await MarketplaceCredential.findByStoreAndMarketplace(store_id, 'amazon');

    if (!credential) {
      return res.json({
        success: true,
        configured: false
      });
    }

    res.json({
      success: true,
      configured: true,
      config: {
        marketplace_id: credential.marketplace_id,
        region: credential.region,
        status: credential.status,
        export_settings: credential.export_settings,
        statistics: credential.statistics,
        last_sync_at: credential.last_sync_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
