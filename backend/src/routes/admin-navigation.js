// backend/src/routes/admin-navigation.js
const express = require('express');
const router = express.Router();
const AdminNavigationService = require('../services/AdminNavigationService');
const { sequelize } = require('../database/connection');

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
 * PUT /api/admin/plugins/:pluginId/navigation
 * Update plugin navigation settings in manifest AND admin_navigation_registry
 */
router.put('/plugins/:pluginId/navigation', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { adminNavigation } = req.body;

    console.log('[PLUGIN-NAV] Updating navigation for plugin:', pluginId);
    console.log('[PLUGIN-NAV] New adminNavigation:', adminNavigation);

    // 1. Update the manifest in the plugins table
    await sequelize.query(
      `UPDATE plugins
       SET manifest = jsonb_set(
         COALESCE(manifest, '{}'::jsonb),
         '{adminNavigation}',
         $1::jsonb
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      {
        bind: [JSON.stringify(adminNavigation), pluginId],
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('[PLUGIN-NAV] Successfully updated plugins table manifest');

    // Also update plugin_registry table
    await sequelize.query(
      `UPDATE plugin_registry
       SET manifest = jsonb_set(
         COALESCE(manifest, '{}'::jsonb),
         '{adminNavigation}',
         $1::jsonb
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      {
        bind: [JSON.stringify(adminNavigation), pluginId],
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('[PLUGIN-NAV] Successfully updated plugin_registry table manifest');

    // 2. Handle admin_navigation_registry
    if (adminNavigation.enabled) {
      // Get plugin info for navigation entry
      const pluginInfo = await sequelize.query(
        `SELECT name, manifest FROM plugins WHERE id = $1`,
        {
          bind: [pluginId],
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (pluginInfo.length > 0) {
        const plugin = pluginInfo[0];
        const manifest = plugin.manifest || {};

        // Calculate order_position based on relativeToKey and position
        let orderPosition = 100; // default

        if (adminNavigation.relativeToKey && adminNavigation.position) {
          // Get the order_position of the relative item
          const relativeItem = await sequelize.query(
            `SELECT order_position FROM admin_navigation_registry WHERE key = $1`,
            {
              bind: [adminNavigation.relativeToKey],
              type: sequelize.QueryTypes.SELECT
            }
          );

          if (relativeItem.length > 0) {
            if (adminNavigation.position === 'before') {
              // Position before: use same order_position (will be slightly lower)
              orderPosition = relativeItem[0].order_position - 0.5;
            } else {
              // Position after: increment order_position
              orderPosition = relativeItem[0].order_position + 0.5;
            }
          }
        }

        // Upsert into admin_navigation_registry
        await sequelize.query(
          `INSERT INTO admin_navigation_registry
           (key, label, icon, route, parent_key, order_position, is_visible, is_core, plugin_id, category, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, false, $7, 'plugins', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (key)
           DO UPDATE SET
             label = EXCLUDED.label,
             icon = EXCLUDED.icon,
             route = EXCLUDED.route,
             parent_key = EXCLUDED.parent_key,
             order_position = EXCLUDED.order_position,
             is_visible = EXCLUDED.is_visible,
             updated_at = CURRENT_TIMESTAMP`,
          {
            bind: [
              `plugin-${pluginId}`,
              adminNavigation.label || manifest.name || plugin.name,
              adminNavigation.icon || manifest.icon || 'Package',
              adminNavigation.route || `/admin/plugins/${pluginId}`,
              adminNavigation.parentKey || null,
              orderPosition,
              pluginId
            ],
            type: sequelize.QueryTypes.UPDATE
          }
        );

        console.log('[PLUGIN-NAV] Upserted into admin_navigation_registry with order:', orderPosition);
      }
    } else {
      // Navigation disabled - remove from registry
      await sequelize.query(
        `DELETE FROM admin_navigation_registry WHERE key = $1`,
        {
          bind: [`plugin-${pluginId}`],
          type: sequelize.QueryTypes.DELETE
        }
      );
      console.log('[PLUGIN-NAV] Removed from admin_navigation_registry (disabled)');
    }

    res.json({
      success: true,
      message: 'Plugin navigation settings updated successfully'
    });
  } catch (error) {
    console.error('[PLUGIN-NAV] Failed to update plugin navigation:', error);
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
        console.log('[NAV-REORDER] Skipping item without key');
        continue;
      }

      // Normalize item properties (handle both camelCase and snake_case)
      const orderPosition = item.order_position ?? item.orderPosition ?? item.order ?? 0;
      const isVisible = item.is_visible ?? item.isVisible ?? true;
      const parentKey = item.parent_key ?? item.parentKey ?? null;

      console.log('[NAV-REORDER] Processing item:', item.key, '(order:', orderPosition, ', visible:', isVisible, ')');

      // Check if this is a plugin item (key starts with 'plugin-')
      const isPluginItem = item.key.startsWith('plugin-');

      if (isPluginItem) {
        // For plugin items, INSERT or UPDATE in admin_navigation_registry
        // Extract plugin ID from key (format: plugin-{pluginId})
        const pluginId = item.key.replace('plugin-', '');

        await sequelize.query(
          `INSERT INTO admin_navigation_registry
           (key, label, icon, route, parent_key, order_position, is_visible, is_core, plugin_id, category, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, 'plugins', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (key)
           DO UPDATE SET
             order_position = EXCLUDED.order_position,
             is_visible = EXCLUDED.is_visible,
             parent_key = EXCLUDED.parent_key,
             updated_at = CURRENT_TIMESTAMP`,
          {
            bind: [
              item.key,
              item.label || 'Plugin Item',
              item.icon || 'Package',
              item.route || '/admin',
              parentKey,
              orderPosition,
              isVisible,
              pluginId
            ],
            type: sequelize.QueryTypes.UPDATE
          }
        );
        console.log('[NAV-REORDER] Upserted plugin item:', item.key);
      } else {
        // For core items, just UPDATE
        const result = await sequelize.query(
          `UPDATE admin_navigation_registry
           SET order_position = $1, is_visible = $2, parent_key = $3, updated_at = CURRENT_TIMESTAMP
           WHERE key = $4`,
          {
            bind: [orderPosition, isVisible, parentKey, item.key],
            type: sequelize.QueryTypes.UPDATE
          }
        );
        console.log('[NAV-REORDER] Updated core item:', item.key, '(rows affected:', result[1], ')');
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
