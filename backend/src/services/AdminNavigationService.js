// backend/src/services/AdminNavigationService.js

class AdminNavigationService {

  /**
   * Get complete navigation for a tenant
   * Merges: Master registry + Tenant config + Installed plugins
   * @param {string} storeId - Store ID
   * @param {Object} tenantDb - Supabase client connection to tenant DB
   */
  async getNavigationForTenant(storeId, tenantDb) {
    try {

      // 1. Get tenant's installed & active plugins
      const { data: installedPlugins, error: pluginsError } = await tenantDb
        .from('plugins')
        .select('id')
        .eq('status', 'installed')
        .eq('is_enabled', true);

      if (pluginsError) {
        console.error('Error fetching plugins:', pluginsError.message);
      }

      const pluginIds = (installedPlugins || []).map(p => p.id);

      // 2a. Get active file-based plugins with adminNavigation from manifest
      const { data: fileBasedPlugins, error: filePluginsError } = await tenantDb
        .from('plugins')
        .select('id, name, manifest')
        .eq('status', 'installed')
        .eq('is_enabled', true)
        .not('manifest->adminNavigation', 'is', null);

      if (filePluginsError) {
        console.error('Error fetching file-based plugins:', filePluginsError.message);
      }

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

      // 2b. Get active plugins from plugin_registry with adminNavigation (from tenant DB)
      const { data: registryPlugins, error: registryError } = await tenantDb
        .from('plugin_registry')
        .select('id, name, manifest')
        .eq('status', 'active')
        .not('manifest->adminNavigation', 'is', null);

      if (registryError) {
        console.error('Error fetching plugin_registry:', registryError.message);
      }

      // Parse adminNavigation from registry plugins
      const registryNavItems = (registryPlugins || [])
        .filter(p => p.manifest?.adminNavigation)
        .map(p => {
          try {
            const nav = p.manifest.adminNavigation;
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

      // 3. Get navigation items from tenant's admin_navigation_registry
      // Include: Core items + items from tenant's installed plugins
      let navItemsQuery = tenantDb
        .from('admin_navigation_registry')
        .select('*')
        .eq('is_visible', true)
        .order('order_position', { ascending: true });

      if (pluginIds.length > 0) {
        navItemsQuery = navItemsQuery.or(`is_core.eq.true,plugin_id.in.(${pluginIds.join(',')})`);
      } else {
        navItemsQuery = navItemsQuery.eq('is_core', true);
      }

      const { data: navItems, error: navError } = await navItemsQuery;

      if (navError) {
        console.error('Error fetching navigation items:', navError.message);
      }

      // 4. Merge ALL plugin nav items with registry
      const allNavItems = [...(navItems || []), ...fileBasedNavItems, ...registryNavItems];

      // 5. Get tenant's customizations
      const { data: tenantConfig, error: configError } = await tenantDb
        .from('admin_navigation_config')
        .select('*');

      if (configError) {
        console.error('Error fetching navigation config:', configError.message);
      }

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
   * Register plugin navigation items in tenant DB
   * Called during plugin installation
   */
  async registerPluginNavigation(pluginId, navItems, tenantDb) {
    for (const item of navItems) {
      await tenantDb
        .from('admin_navigation_registry')
        .upsert({
          key: item.key,
          label: item.label,
          icon: item.icon,
          route: item.route,
          parent_key: item.parentKey || null,
          order_position: item.order || 100,
          is_core: false,
          plugin_id: pluginId,
          category: item.category || 'plugins',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });
    }
  }

  /**
   * Enable plugin navigation for tenant
   * Called during plugin installation
   */
  async enablePluginNavigationForTenant(tenantDb, navKeys) {
    for (const key of navKeys) {
      const { error } = await tenantDb
        .from('admin_navigation_config')
        .upsert({
          nav_key: key,
          is_hidden: false
        }, {
          onConflict: 'nav_key',
          ignoreDuplicates: true
        });

      if (error) {
        console.error(`Error enabling navigation for key ${key}:`, error.message);
      }
    }
  }

  /**
   * Seed core navigation items
   * Run once to populate tenant DB
   */
  async seedCoreNavigation(tenantDb) {
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
      const { error } = await tenantDb
        .from('admin_navigation_registry')
        .upsert({
          key: item.key,
          label: item.label,
          icon: item.icon,
          route: item.route,
          order_position: item.order,
          is_core: true,
          category: item.category
        }, {
          onConflict: 'key',
          ignoreDuplicates: true
        });

      if (error) {
        console.error(`Error seeding navigation item ${item.key}:`, error.message);
      }
    }

  }
}

module.exports = new AdminNavigationService();
