// backend/src/services/AdminNavigationService.js
const { sequelize } = require('../database/connection');

class AdminNavigationService {

  /**
   * Get complete navigation for a tenant
   * Merges: Master registry + Tenant config + Installed plugins
   */
  async getNavigationForTenant(tenantId) {
    try {

      // 1. Get tenant's installed & active plugins from BOTH tables
      const installedPlugins = await sequelize.query(`
        SELECT id
        FROM plugins
        WHERE status = 'installed' AND is_enabled = true
      `, { type: sequelize.QueryTypes.SELECT });

      const pluginIds = installedPlugins.map(p => p.id);

      // 2a. Get active file-based plugins with adminNavigation from manifest
      const fileBasedPlugins = await sequelize.query(`
        SELECT
          id,
          name,
          manifest->>'adminNavigation' as admin_nav
        FROM plugins
        WHERE status = 'installed'
          AND is_enabled = true
          AND manifest->>'adminNavigation' IS NOT NULL
      `, { type: sequelize.QueryTypes.SELECT });

      // Parse adminNavigation from file-based plugins
      const fileBasedNavItems = fileBasedPlugins
        .filter(p => p.admin_nav)
        .map(p => {
          try {
            const nav = JSON.parse(p.admin_nav);
            if (nav && nav.enabled) {
              return {
                key: `plugin-${p.id}`,
                label: nav.label,
                icon: nav.icon || 'Package',
                route: nav.route,
                parent_key: nav.parentKey || null,
                order_position: nav.order || 100,
                is_core: false,
                plugin_id: p.id,
                is_visible: true,
                category: 'plugins',
                description: nav.description
              };
            }
          } catch (e) {
          }
          return null;
        })
        .filter(Boolean);

      // 2b. Get active plugins from plugin_registry with adminNavigation
      const registryPlugins = await sequelize.query(`
        SELECT
          id,
          name,
          manifest->>'adminNavigation' as admin_nav
        FROM plugin_registry
        WHERE status = 'active'
          AND manifest->>'adminNavigation' IS NOT NULL
      `, { type: sequelize.QueryTypes.SELECT });

      // Parse adminNavigation from registry plugins
      const registryNavItems = registryPlugins
        .filter(p => p.admin_nav)
        .map(p => {
          try {
            const nav = JSON.parse(p.admin_nav);
            if (nav && nav.enabled) {
              return {
                key: `plugin-${p.id}`,
                label: nav.label,
                icon: nav.icon || 'Package',
                route: nav.route,
                parent_key: nav.parentKey || null,
                order_position: nav.order || 100,
                is_core: false,
                plugin_id: p.id,
                is_visible: true,
                category: 'plugins',
                description: nav.description
              };
            }
          } catch (e) {
          }
          return null;
        })
        .filter(Boolean);

      // 3. Get navigation items from master registry
      // Include: Core items + items from tenant's installed plugins
      const navQuery = pluginIds.length > 0
        ? `SELECT * FROM admin_navigation_registry
           WHERE (is_core = true OR plugin_id = ANY($1))
             AND is_visible = true
           ORDER BY order_position ASC`
        : `SELECT * FROM admin_navigation_registry
           WHERE is_core = true AND is_visible = true
           ORDER BY order_position ASC`;

      const navItems = await sequelize.query(
        navQuery,
        pluginIds.length > 0 ? {
          bind: [pluginIds],
          type: sequelize.QueryTypes.SELECT
        } : { type: sequelize.QueryTypes.SELECT }
      );

      // 4. Merge ALL plugin nav items with master registry
      const allNavItems = [...navItems, ...fileBasedNavItems, ...registryNavItems];

      // 5. Get tenant's customizations
      const tenantConfig = await sequelize.query(`
        SELECT * FROM admin_navigation_config
      `, { type: sequelize.QueryTypes.SELECT })

      // 6. Merge and apply customizations
      const merged = this.mergeNavigation(
        allNavItems,
        tenantConfig
      );

      // 7. Build hierarchical tree
      const tree = this.buildNavigationTree(merged);

      return tree;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Apply tenant customizations to navigation items
   * Uses snake_case throughout for consistency with database
   */
  mergeNavigation(masterItems, tenantConfig) {
    const configMap = new Map(
      tenantConfig.map(c => [c.nav_item_key, c])
    );

    return masterItems.map(item => {
      const config = configMap.get(item.key);

      if (!config) {
        // No customization - return item as-is
        return item;
      }

      // Apply tenant overrides
      return {
        ...item,
        label: config.custom_label || item.label,
        order_position: config.custom_order ?? item.order_position,
        icon: config.custom_icon || item.icon,
        parent_key: config.parent_key || item.parent_key,
        is_visible: config.is_enabled ?? item.is_visible,
        badge: config.badge_text ? {
          text: config.badge_text,
          color: config.badge_color
        } : null
      };
    }).filter(item => item.is_visible !== false);
  }

  /**
   * Build hierarchical navigation tree
   * Uses snake_case throughout for consistency
   */
  buildNavigationTree(items) {
    const tree = [];
    const itemMap = new Map();
    const hasParent = new Set();

    // First pass: Create map of all items with empty children
    items.forEach(item => {
      itemMap.set(item.key, {
        key: item.key,
        label: item.label,
        icon: item.icon,
        route: item.route,
        parent_key: item.parent_key,
        order_position: item.order_position,
        is_visible: item.is_visible,
        is_core: item.is_core,
        plugin_id: item.plugin_id,
        category: item.category,
        description: item.description,
        badge: item.badge,
        type: item.type || 'standard',
        children: []
      });
    });

    // Second pass: Build hierarchy
    items.forEach(item => {
      const node = itemMap.get(item.key);

      if (item.parent_key && itemMap.has(item.parent_key)) {
        // Add as child to parent
        itemMap.get(item.parent_key).children.push(node);
        hasParent.add(item.key); // Mark this item as having a parent
      }
    });

    // Third pass: Add only root items (items without parents) to tree
    items.forEach(item => {
      if (!hasParent.has(item.key)) {
        tree.push(itemMap.get(item.key));
      }
    });

    // Sort children by order_position
    tree.forEach(item => this.sortChildren(item));

    return tree;
  }

  /**
   * Recursively sort children by order_position
   */
  sortChildren(item) {
    if (item.children && item.children.length > 0) {
      item.children.sort((a, b) => (a.order_position || 0) - (b.order_position || 0));
      item.children.forEach(child => this.sortChildren(child));
    }
  }

  /**
   * Register plugin navigation items in master DB
   * Called during plugin installation
   */
  async registerPluginNavigation(pluginId, navItems) {
    for (const item of navItems) {
      await sequelize.query(`
        INSERT INTO admin_navigation_registry
        (key, label, icon, route, parent_key, order_position, is_core, plugin_id, category)
        VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)
        ON CONFLICT (key) DO UPDATE SET
          label = EXCLUDED.label,
          icon = EXCLUDED.icon,
          route = EXCLUDED.route,
          updated_at = NOW()
      `, {
        bind: [
          item.key,
          item.label,
          item.icon,
          item.route,
          item.parentKey || null,
          item.order || 100,
          pluginId,
          item.category || 'plugins'
        ]
      });
    }
  }

  /**
   * Enable plugin navigation for tenant
   * Called during plugin installation
   */
  async enablePluginNavigationForTenant(tenantId, navKeys) {
    for (const key of navKeys) {
      await sequelize.query(`
        INSERT INTO admin_navigation_config (nav_key, is_hidden)
        VALUES ($1, false)
        ON CONFLICT (nav_key) DO NOTHING
      `, {
        bind: [key]
      });
    }
  }

  /**
   * Seed core navigation items
   * Run once to populate master DB
   */
  async seedCoreNavigation() {
    const coreItems = [
      { key: 'dashboard', label: 'Dashboard', icon: 'Home', route: '/admin', order: 1, category: 'main' },
      { key: 'products', label: 'Products', icon: 'Package', route: '/admin/products', order: 2, category: 'main' },
      { key: 'orders', label: 'Orders', icon: 'ShoppingCart', route: '/admin/orders', order: 3, category: 'main' },
      { key: 'customers', label: 'Customers', icon: 'Users', route: '/admin/customers', order: 4, category: 'main' },
      { key: 'chat-support', label: 'Chat Support', icon: 'MessageSquare', route: '/admin/chat-support', order: 5, category: 'main' },
      { key: 'analytics', label: 'Analytics', icon: 'BarChart', route: '/admin/analytics', order: 6, category: 'main' },
      { key: 'plugins', label: 'Plugins', icon: 'Puzzle', route: '/admin/plugins', order: 10, category: 'tools' },
      { key: 'settings', label: 'Settings', icon: 'Settings', route: '/admin/settings', order: 99, category: 'settings' }
    ];

    for (const item of coreItems) {
      await sequelize.query(`
        INSERT INTO admin_navigation_registry
        (key, label, icon, route, order_position, is_core, category)
        VALUES ($1, $2, $3, $4, $5, true, $6)
        ON CONFLICT (key) DO NOTHING
      `, {
        bind: [item.key, item.label, item.icon, item.route, item.order, item.category]
      });
    }

  }
}

module.exports = new AdminNavigationService();
