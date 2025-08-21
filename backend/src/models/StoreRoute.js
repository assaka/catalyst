const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * StoreRoute Model
 * Manages both core routes and custom routes created by store owners
 * Enables dynamic routing and page management
 */
const StoreRoute = sequelize.define('StoreRoute', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  route_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'The URL path (e.g., /products, /custom-page, /about-us)'
  },
  route_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Human readable name (e.g., "Products", "Custom Page", "About Us")'
  },
  route_type: {
    type: DataTypes.ENUM('core', 'custom', 'cms_page', 'product_detail', 'category'),
    allowNull: false,
    defaultValue: 'custom'
  },
  target_type: {
    type: DataTypes.ENUM('component', 'cms_page', 'external_url', 'redirect'),
    allowNull: false
  },
  target_value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Component name, CMS page ID, URL, or redirect path'
  },
  title: {
    type: DataTypes.STRING(255),
    comment: 'Page title for SEO and navigation'
  },
  description: {
    type: DataTypes.TEXT,
    comment: 'Page description'
  },
  meta_title: {
    type: DataTypes.STRING(255)
  },
  meta_description: {
    type: DataTypes.TEXT
  },
  meta_keywords: {
    type: DataTypes.STRING(255)
  },
  show_in_navigation: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  navigation_label: {
    type: DataTypes.STRING(255),
    comment: 'Label to show in navigation (defaults to route_name)'
  },
  navigation_parent_id: {
    type: DataTypes.UUID,
    references: {
      model: 'store_routes',
      key: 'id'
    }
  },
  navigation_sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  requires_auth: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allowed_roles: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  route_params: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Dynamic parameters like {productId: "uuid", slug: "string"}'
  },
  component_props: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Props to pass to the target component'
  },
  layout_template: {
    type: DataTypes.STRING(100),
    defaultValue: 'default'
  },
  cache_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Cache duration in seconds (0 = no cache)'
  },
  created_by: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'store_routes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['store_id', 'route_path'],
      unique: true
    },
    {
      fields: ['route_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['store_id', 'show_in_navigation', 'navigation_sort_order']
    }
  ]
});

/**
 * Static method: Find route by store and path
 * @param {string} storeId - Store ID
 * @param {string} path - Route path
 * @returns {Object|null} Route object or null
 */
StoreRoute.findByPath = async function(storeId, path) {
  try {
    return await this.findOne({
      where: {
        store_id: storeId,
        route_path: path,
        is_active: true
      },
      include: [
        {
          association: 'parent',
          attributes: ['id', 'route_name', 'route_path']
        },
        {
          association: 'children',
          where: { is_active: true },
          required: false,
          attributes: ['id', 'route_name', 'route_path', 'navigation_sort_order']
        }
      ]
    });
  } catch (error) {
    console.error('Error finding route by path:', error);
    return null;
  }
};

/**
 * Static method: Get navigation routes for a store
 * @param {string} storeId - Store ID
 * @returns {Array} Array of navigation routes
 */
StoreRoute.getNavigationRoutes = async function(storeId) {
  try {
    return await this.findAll({
      where: {
        store_id: storeId,
        show_in_navigation: true,
        is_active: true
      },
      order: [
        ['navigation_sort_order', 'ASC'],
        ['route_name', 'ASC']
      ],
      attributes: [
        'id', 'route_path', 'route_name', 'navigation_label', 
        'navigation_parent_id', 'navigation_sort_order', 'route_type'
      ]
    });
  } catch (error) {
    console.error('Error getting navigation routes:', error);
    return [];
  }
};

/**
 * Static method: Get all routes for a store with optional filtering
 * @param {string} storeId - Store ID
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of routes
 */
StoreRoute.getStoreRoutes = async function(storeId, filters = {}) {
  try {
    const whereClause = {
      store_id: storeId,
      ...filters
    };

    return await this.findAll({
      where: whereClause,
      order: [
        ['route_type', 'ASC'],
        ['navigation_sort_order', 'ASC'],
        ['route_name', 'ASC']
      ]
    });
  } catch (error) {
    console.error('Error getting store routes:', error);
    return [];
  }
};

/**
 * Static method: Create a custom route
 * @param {Object} routeData - Route data
 * @returns {Object} Created route
 */
StoreRoute.createCustomRoute = async function(routeData) {
  try {
    // Ensure path starts with /
    if (!routeData.route_path.startsWith('/')) {
      routeData.route_path = '/' + routeData.route_path;
    }

    // Set defaults for custom routes
    const customRouteData = {
      route_type: 'custom',
      target_type: routeData.target_type || 'component',
      show_in_navigation: routeData.show_in_navigation !== false,
      is_active: routeData.is_active !== false,
      ...routeData
    };

    return await this.create(customRouteData);
  } catch (error) {
    console.error('Error creating custom route:', error);
    throw error;
  }
};

/**
 * Static method: Resolve a path to a route with fallback logic
 * @param {string} storeId - Store ID
 * @param {string} path - Path to resolve
 * @returns {Object} Resolution result
 */
StoreRoute.resolvePath = async function(storeId, path) {
  try {
    // Try exact match first
    let route = await this.findByPath(storeId, path);
    
    if (route) {
      return {
        found: true,
        route,
        matchType: 'exact'
      };
    }

    // Try pattern matching for dynamic routes
    const dynamicRoutes = await this.findAll({
      where: {
        store_id: storeId,
        is_active: true,
        route_path: {
          [sequelize.Op.like]: '%:%' // Contains route parameters
        }
      }
    });

    for (const dynamicRoute of dynamicRoutes) {
      const pattern = dynamicRoute.route_path;
      const regex = pattern.replace(/:[^/]+/g, '([^/]+)');
      const match = new RegExp(`^${regex}$`).exec(path);
      
      if (match) {
        const params = {};
        const paramNames = pattern.match(/:[^/]+/g);
        if (paramNames) {
          paramNames.forEach((paramName, index) => {
            params[paramName.slice(1)] = match[index + 1];
          });
        }
        
        return {
          found: true,
          route: dynamicRoute,
          matchType: 'dynamic',
          params
        };
      }
    }

    return {
      found: false,
      route: null,
      matchType: null
    };
  } catch (error) {
    console.error('Error resolving path:', error);
    return {
      found: false,
      route: null,
      matchType: null,
      error: error.message
    };
  }
};

/**
 * Instance method: Get navigation label (falls back to route_name)
 */
StoreRoute.prototype.getNavigationLabel = function() {
  return this.navigation_label || this.route_name;
};

/**
 * Instance method: Check if route is accessible by user
 * @param {Object} user - User object
 * @returns {boolean} Access granted
 */
StoreRoute.prototype.canAccess = function(user) {
  if (!this.requires_auth) {
    return true;
  }

  if (!user) {
    return false;
  }

  if (!this.allowed_roles || this.allowed_roles.length === 0) {
    return true; // No role restrictions
  }

  return this.allowed_roles.includes(user.role);
};

module.exports = StoreRoute;