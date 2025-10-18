// backend/src/routes/plugin-api.js
const express = require('express');
const router = express.Router();
const PluginExecutor = require('../core/PluginExecutor');
const PluginPurchaseService = require('../services/PluginPurchaseService');
const db = require('../database/db');

/**
 * GET /api/plugins/widgets
 * Get all available plugin widgets for slot editor
 */
router.get('/widgets', async (req, res) => {
  try {
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const widgets = await PluginExecutor.getAvailableWidgets(tenantId);

    res.json({
      success: true,
      widgets
    });
  } catch (error) {
    console.error('Failed to get widgets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/widgets/:widgetId
 * Get a specific widget by ID
 */
router.get('/widgets/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const widget = await PluginExecutor.loadWidget(widgetId, tenantId);

    res.json({
      success: true,
      widget
    });
  } catch (error) {
    console.error('Failed to get widget:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/marketplace
 * Get all marketplace plugins
 */
router.get('/marketplace', async (req, res) => {
  try {
    const plugins = await db.query(`
      SELECT
        id, name, slug, version, description, author_id, category,
        pricing_model, base_price, monthly_price, yearly_price, currency,
        license_type, downloads, active_installations, rating, reviews_count,
        icon_url, screenshots
      FROM plugin_marketplace
      WHERE status = 'approved'
      ORDER BY downloads DESC
    `);

    res.json({
      success: true,
      plugins: plugins.rows
    });
  } catch (error) {
    console.error('Failed to get marketplace plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/plugins/purchase
 * Purchase a plugin from marketplace
 */
router.post('/purchase', async (req, res) => {
  try {
    const { pluginId, selectedPlan } = req.body;
    // TODO: Get tenantId and userId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';
    const userId = req.user?.id || 'default-user';

    const result = await PluginPurchaseService.purchasePlugin(
      pluginId,
      tenantId,
      selectedPlan,
      userId
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Failed to purchase plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plugins/installed
 * Get all installed plugins for current tenant
 */
router.get('/installed', async (req, res) => {
  try {
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const plugins = await db.query(`
      SELECT * FROM plugins
      WHERE status = 'active'
      ORDER BY installed_at DESC
    `);

    res.json({
      success: true,
      plugins: plugins.rows
    });
  } catch (error) {
    console.error('Failed to get installed plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
