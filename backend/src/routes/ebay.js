const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const MarketplaceCredential = require('../models/MarketplaceCredential');
const jobManager = require('../core/BackgroundJobManager');

router.use(authMiddleware);

router.post('/configure', checkStoreOwnership, async (req, res) => {
  try {
    const { store_id, credentials, export_settings } = req.body;

    const [credential, created] = await MarketplaceCredential.findOrCreate({
      where: { store_id, marketplace: 'ebay' },
      defaults: { credentials, export_settings: export_settings || {} }
    });

    if (!created) {
      credential.credentials = credentials;
      if (export_settings) credential.export_settings = export_settings;
      await credential.save();
    }

    res.json({ success: true, message: 'eBay credentials configured successfully' });
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
    const credential = await MarketplaceCredential.findByStoreAndMarketplace(store_id, 'ebay');

    res.json({
      success: true,
      configured: !!credential,
      config: credential ? {
        status: credential.status,
        export_settings: credential.export_settings,
        statistics: credential.statistics
      } : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
