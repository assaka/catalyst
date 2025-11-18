// backend/src/routes/admin-navigation.js
const express = require('express');
const router = express.Router();
const AdminNavigationService = require('../services/AdminNavigationService');
const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * GET /api/admin/navigation
 * Get complete navigation tree for the current tenant DB
 */
router.get('/navigation', async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Pass tenantDb to service
    const navigation = await AdminNavigationService.getNavigationForTenant(store_id, tenantDb);

    res.json({
      success: true,
      navigation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/navigation/seed
 * Seed core navigation items (run once) in tenant DB
 */
router.post('/navigation/seed', async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);
    await AdminNavigationService.seedCoreNavigation(tenantDb);

    res.json({
      success: true,
      message: 'Core navigation seeded successfully'
    });
  } catch (error) {
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

        // Calculate order_position
        // Priority: 1) Use direct order if provided, 2) Calculate from relativeToKey, 3) Use default
        let orderPosition;

        if (adminNavigation.order !== undefined && adminNavigation.order !== null) {
          // Use the direct order number if provided
          orderPosition = adminNavigation.order;
        } else if (adminNavigation.relativeToKey && adminNavigation.position) {
          // Calculate based on relativeToKey and position
          const relativeItem = await sequelize.query(
            `SELECT order_position FROM admin_navigation_registry WHERE key = $1`,
            {
              bind: [adminNavigation.relativeToKey],
              type: sequelize.QueryTypes.SELECT
            }
          );

          if (relativeItem.length > 0) {
            if (adminNavigation.position === 'before') {
              orderPosition = relativeItem[0].order_position - 0.5;
            } else {
              orderPosition = relativeItem[0].order_position + 0.5;
            }
          } else {
            orderPosition = 100; // fallback if relative item not found
          }
        } else {
          // Use default
          orderPosition = 100;
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
    }

    res.json({
      success: true,
      message: 'Plugin navigation settings updated successfully'
    });
  } catch (error) {
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

      // Normalize item properties (handle both camelCase and snake_case)
      const orderPosition = item.order_position ?? item.orderPosition ?? item.order ?? 0;
      const isVisible = item.is_visible ?? item.isVisible ?? true;
      const parentKey = item.parent_key ?? item.parentKey ?? null;

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
      }
    }

    res.json({
      success: true,
      message: 'Navigation order updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
