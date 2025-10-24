const express = require('express');
const router = express.Router();
const { authMiddleware, storeResolver } = require('../middleware/auth');
const DatabaseProvisioningService = require('../services/database/DatabaseProvisioningService');
const ConnectionManager = require('../services/database/ConnectionManager');
const { Store, Subscription, UsageMetric, BillingTransaction } = require('../models');
const { Op } = require('sequelize');

/**
 * Provision database for a new store
 */
router.post('/provision', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { databaseType, config } = req.body;

    if (!databaseType) {
      return res.status(400).json({
        success: false,
        message: 'Database type is required'
      });
    }

    // Update store status to provisioning
    await Store.update(
      { database_status: 'provisioning' },
      { where: { id: req.storeId } }
    );

    // Start provisioning (can be done async for large databases)
    const result = await DatabaseProvisioningService.provisionStore(req.storeId, {
      type: databaseType,
      ...config
    });

    res.json(result);
  } catch (error) {
    console.error('Provisioning error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Check provisioning status
 */
router.get('/status', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const store = await Store.findByPk(req.storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const isProvisioned = await DatabaseProvisioningService.isProvisioned(req.storeId);

    res.json({
      success: true,
      status: store.database_status,
      database_type: store.database_type,
      storage_type: store.storage_type,
      is_provisioned: isProvisioned,
      metadata: store.metadata
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Test database connection
 */
router.post('/test-connection', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const result = await ConnectionManager.testStoreConnection(req.storeId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get connection info (without sensitive data)
 */
router.get('/connection-info', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const info = await ConnectionManager.getConnectionInfo(req.storeId);

    if (!info) {
      return res.status(404).json({
        success: false,
        message: 'No database configuration found'
      });
    }

    res.json({
      success: true,
      ...info
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Re-provision database (admin only)
 */
router.post('/reprovision', authMiddleware, storeResolver(), async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin && !req.user.platformAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const result = await DatabaseProvisioningService.reprovisionStore(req.storeId);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get store subscription info
 */
router.get('/subscription', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        store_id: req.storeId,
        status: { [Op.in]: ['active', 'trial'] }
      },
      order: [['created_at', 'DESC']]
    });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      subscription: {
        plan_name: subscription.plan_name,
        status: subscription.status,
        billing_cycle: subscription.billing_cycle,
        price_monthly: subscription.price_monthly,
        price_annual: subscription.price_annual,
        limits: {
          max_products: subscription.max_products,
          max_orders_per_month: subscription.max_orders_per_month,
          max_storage_gb: subscription.max_storage_gb,
          max_api_calls_per_month: subscription.max_api_calls_per_month
        },
        trial_ends_at: subscription.trial_ends_at,
        current_period_end: subscription.current_period_end
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get usage metrics
 */
router.get('/usage', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const metrics = await UsageMetric.getDailySummary(req.storeId, start, end);

    // Calculate totals
    const totals = metrics.reduce((acc, metric) => ({
      products_created: acc.products_created + (metric.products_created || 0),
      orders_created: acc.orders_created + (metric.orders_created || 0),
      api_calls: acc.api_calls + (metric.api_calls || 0),
      storage_total_bytes: Math.max(acc.storage_total_bytes, metric.storage_total_bytes || 0)
    }), { products_created: 0, orders_created: 0, api_calls: 0, storage_total_bytes: 0 });

    res.json({
      success: true,
      period: { start, end },
      totals,
      daily_metrics: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get billing history
 */
router.get('/billing/history', authMiddleware, storeResolver(), async (req, res) => {
  try {
    const transactions = await BillingTransaction.findAll({
      where: { store_id: req.storeId },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        payment_method: t.payment_method,
        description: t.description,
        invoice_number: t.invoice_number,
        invoice_url: t.invoice_url,
        processed_at: t.processed_at,
        created_at: t.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
