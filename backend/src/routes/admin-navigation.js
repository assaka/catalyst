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
    // Simple direct query approach - fallback if service fails
    if (!req.db) {
      // Try using AdminNavigationService if db not available
      const tenantId = req.user?.tenantId || 'default-tenant';
      const navigation = await AdminNavigationService.getNavigationForTenant(tenantId);
      return res.json({
        success: true,
        navigation
      });
    }

    // Direct database query (simpler, more reliable)
    const result = await req.db.query(`
      SELECT
        key, label, route, icon, parent_key, order_position,
        is_core, is_visible, plugin_id, category, description
      FROM admin_navigation_registry
      WHERE is_visible = true
      ORDER BY order_position ASC
    `);

    // Build simple tree structure
    const items = result.rows;
    const itemMap = {};
    const tree = [];

    // First pass: create map
    items.forEach(item => {
      itemMap[item.key] = { ...item, children: [] };
    });

    // Second pass: build tree
    items.forEach(item => {
      if (item.parent_key && itemMap[item.parent_key]) {
        itemMap[item.parent_key].children.push(itemMap[item.key]);
      } else {
        tree.push(itemMap[item.key]);
      }
    });

    res.json({
      success: true,
      navigation: tree
    });
  } catch (error) {
    console.error('Failed to get navigation:', error);
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
