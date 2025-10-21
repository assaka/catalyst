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

    console.log('[NAV-REORDER] Processing', items.length, 'items');

    // Update each navigation item
    for (const item of items) {
      if (!item.key) {
        continue;
      }

      // Check if this is a plugin item (key starts with 'plugin-')
      const isPluginItem = item.key.startsWith('plugin-');

      if (isPluginItem) {
        // For plugin items, INSERT or UPDATE in admin_navigation_registry
        // Extract plugin ID from key (format: plugin-{pluginId})
        const pluginId = item.key.replace('plugin-', '');

        await req.db.query(
          `INSERT INTO admin_navigation_registry
           (key, label, icon, route, parent_key, order_position, is_visible, is_core, plugin_id, category, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, 'plugins', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (key)
           DO UPDATE SET
             order_position = EXCLUDED.order_position,
             is_visible = EXCLUDED.is_visible,
             parent_key = EXCLUDED.parent_key,
             updated_at = CURRENT_TIMESTAMP`,
          [
            item.key,
            item.label || 'Plugin Item',
            item.icon || 'Package',
            item.route || '/admin',
            item.parent_key || null,
            item.order_position,
            item.is_visible,
            pluginId
          ]
        );
        console.log('[NAV-REORDER] Upserted plugin item:', item.key);
      } else {
        // For core items, just UPDATE
        const result = await req.db.query(
          `UPDATE admin_navigation_registry
           SET order_position = $1, is_visible = $2, updated_at = CURRENT_TIMESTAMP
           WHERE key = $3`,
          [item.order_position, item.is_visible, item.key]
        );
        console.log('[NAV-REORDER] Updated core item:', item.key, '(rows:', result.rowCount, ')');
      }
    }

    console.log('[NAV-REORDER] Successfully updated all items');

    res.json({
      success: true,
      message: 'Navigation order updated successfully'
    });
  } catch (error) {
    console.error('[NAV-REORDER] Failed to reorder navigation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
