// backend/src/routes/admin-navigation.js
const express = require('express');
const router = express.Router();
const AdminNavigationService = require('../services/AdminNavigationService');

/**
 * GET /api/admin/navigation
 * Get complete navigation tree for the current tenant
 */
router.get('/navigation', async (req, res) => {
  try {
    console.log('[NAV-ROUTE] ========================================');
    console.log('[NAV-ROUTE] GET /api/admin/navigation request received');
    console.log('[NAV-ROUTE] User:', req.user);

    // ALWAYS use AdminNavigationService to include plugin navigation
    const tenantId = req.user?.tenantId || 'default-tenant';
    console.log('[NAV-ROUTE] Resolved tenant ID:', tenantId);

    const navigation = await AdminNavigationService.getNavigationForTenant(tenantId);

    console.log('[NAV-ROUTE] Service returned', navigation.length, 'top-level items');
    console.log('[NAV-ROUTE] Sending response to client');
    console.log('[NAV-ROUTE] ========================================');

    res.json({
      success: true,
      navigation
    });
  } catch (error) {
    console.error('[NAV-ROUTE] ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/navigation/seed
 * Seed core navigation items (run once)
 */
router.post('/navigation/seed', async (req, res) => {
  try {
    await AdminNavigationService.seedCoreNavigation();

    res.json({
      success: true,
      message: 'Core navigation seeded successfully'
    });
  } catch (error) {
    console.error('Failed to seed navigation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/navigation/reorder
 * Update navigation order and visibility
 */
router.post('/navigation/reorder', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required'
      });
    }

    // Update each navigation item
    for (const item of items) {
      if (!item.key) {
        continue;
      }

      await req.db.query(
        `UPDATE admin_navigation_registry
         SET order_position = $1, is_visible = $2, updated_at = CURRENT_TIMESTAMP
         WHERE key = $3`,
        [item.order_position, item.is_visible, item.key]
      );
    }

    res.json({
      success: true,
      message: 'Navigation order updated successfully'
    });
  } catch (error) {
    console.error('Failed to reorder navigation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
