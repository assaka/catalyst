const express = require('express');
const router = express.Router();
const StoreRoute = require('../models/StoreRoute');
const RouteRedirect = require('../models/RouteRedirect');
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');

/**
 * Store Routes Management API
 * Provides endpoints for managing both core routes and custom routes
 */

/**
 * PUBLIC ENDPOINTS (no authentication required)
 * These endpoints are used by the BrowserPreview for route resolution
 */

/**
 * GET /api/store-routes/public/find-by-page/:pageName
 * Public endpoint to find routes by page name (for BrowserPreview)
 * Requires store_id in query params or x-store-id header
 */
router.get('/public/find-by-page/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;
    const { store_id, exact } = req.query;
    const storeId = store_id || req.headers['x-store-id'];
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required (in query params or x-store-id header)'
      });
    }
    
    console.log(`🔍 PUBLIC: Resolving page "${pageName}" for store ${storeId}`);
    
    // Use the exact same logic as the authenticated endpoint
    const resolution = await StoreRoute.resolveByPageName(storeId, pageName);
    
    if (resolution.found) {
      res.json({
        success: true,
        data: {
          route: resolution.route,
          matchType: resolution.matchType,
          routes: resolution.routes || [resolution.route]
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: `No route found for page "${pageName}"`
      });
    }
  } catch (error) {
    console.error('Error in public find-by-page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve route',
      error: error.message
    });
  }
});

// Apply authentication and store ownership checks to all protected routes
router.use(authMiddleware);
router.use(checkStoreOwnership);

/**
 * GET /api/store-routes
 * Get all routes for the current store
 */
router.get('/', async (req, res) => {
  try {
    const { type, navigation_only, active_only } = req.query;
    const filters = {};
    
    if (type) {
      filters.route_type = type;
    }
    if (navigation_only === 'true') {
      filters.show_in_navigation = true;
    }
    if (active_only !== 'false') {
      filters.is_active = true;
    }

    const routes = await StoreRoute.getStoreRoutes(req.storeId, filters);
    
    res.json({
      success: true,
      data: routes,
      count: routes.length
    });
  } catch (error) {
    console.error('Error fetching store routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes',
      error: error.message
    });
  }
});

/**
 * GET /api/store-routes/navigation
 * Get navigation routes for building menus
 */
router.get('/navigation', async (req, res) => {
  try {
    const routes = await StoreRoute.getNavigationRoutes(req.storeId);
    
    // Build hierarchical structure
    const routeMap = new Map();
    const rootRoutes = [];
    
    // First pass: create map of all routes
    routes.forEach(route => {
      routeMap.set(route.id, {
        ...route.toJSON(),
        children: []
      });
    });
    
    // Second pass: build hierarchy
    routes.forEach(route => {
      const routeData = routeMap.get(route.id);
      if (route.navigation_parent_id) {
        const parent = routeMap.get(route.navigation_parent_id);
        if (parent) {
          parent.children.push(routeData);
        }
      } else {
        rootRoutes.push(routeData);
      }
    });
    
    res.json({
      success: true,
      data: rootRoutes,
      flat: routes // Also provide flat array for easier consumption
    });
  } catch (error) {
    console.error('Error fetching navigation routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch navigation routes',
      error: error.message
    });
  }
});

/**
 * GET /api/store-routes/resolve/:path*
 * Resolve a path to a route (for internal use by BrowserPreview)
 */
router.get('/resolve/*', async (req, res) => {
  try {
    const path = '/' + (req.params[0] || '');
    const resolution = await StoreRoute.resolvePath(req.storeId, path);
    
    if (!resolution.found) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
        path,
        resolution
      });
    }
    
    res.json({
      success: true,
      data: {
        route: resolution.route,
        matchType: resolution.matchType,
        params: resolution.params || {},
        path
      }
    });
  } catch (error) {
    console.error('Error resolving route path:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve route',
      error: error.message
    });
  }
});

/**
 * GET /api/store-routes/find-by-page/:pageName
 * Find route(s) serving a specific page by name
 */
router.get('/find-by-page/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;
    const { exact = 'false' } = req.query;
    
    if (exact === 'true') {
      // Only exact page name match
      const route = await StoreRoute.findByPageName(req.storeId, pageName);
      
      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Page not found',
          pageName
        });
      }
      
      res.json({
        success: true,
        data: {
          route,
          matchType: 'exact',
          pageName
        }
      });
    } else {
      // Use fuzzy matching with fallback logic
      const resolution = await StoreRoute.resolveByPageName(req.storeId, pageName);
      
      if (!resolution.found) {
        return res.status(404).json({
          success: false,
          message: 'Page not found',
          pageName,
          resolution
        });
      }
      
      res.json({
        success: true,
        data: {
          route: resolution.route,
          routes: resolution.routes,
          matchType: resolution.matchType,
          count: resolution.count || 1,
          pageName
        }
      });
    }
  } catch (error) {
    console.error('Error finding route by page name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find route by page name',
      error: error.message
    });
  }
});

/**
 * GET /api/store-routes/find-by-component/:componentName  
 * Find all routes serving a specific component
 */
router.get('/find-by-component/:componentName', async (req, res) => {
  try {
    const { componentName } = req.params;
    const routes = await StoreRoute.findByComponentName(req.storeId, componentName);
    
    res.json({
      success: true,
      data: {
        routes,
        count: routes.length,
        componentName
      }
    });
  } catch (error) {
    console.error('Error finding routes by component name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find routes by component name',
      error: error.message
    });
  }
});

/**
 * POST /api/store-routes
 * Create a new custom route
 */
router.post('/', async (req, res) => {
  try {
    const routeData = {
      ...req.body,
      store_id: req.storeId,
      created_by: req.user.id
    };
    
    // Validate required fields
    if (!routeData.route_path || !routeData.route_name || !routeData.target_value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: route_path, route_name, target_value'
      });
    }
    
    const route = await StoreRoute.createCustomRoute(routeData);
    
    res.status(201).json({
      success: true,
      data: route,
      message: 'Route created successfully'
    });
  } catch (error) {
    console.error('Error creating route:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A route with this path already exists for this store'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create route',
      error: error.message
    });
  }
});

/**
 * GET /api/store-routes/:id
 * Get a specific route by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const route = await StoreRoute.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch route',
      error: error.message
    });
  }
});

/**
 * PUT /api/store-routes/:id
 * Update a route
 */
router.put('/:id', async (req, res) => {
  try {
    const route = await StoreRoute.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    // Prevent updating core routes in certain ways
    if (route.route_type === 'core' && req.body.route_type && req.body.route_type !== 'core') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change the type of core routes'
      });
    }
    
    await route.update(req.body);
    
    res.json({
      success: true,
      data: route,
      message: 'Route updated successfully'
    });
  } catch (error) {
    console.error('Error updating route:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A route with this path already exists for this store'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update route',
      error: error.message
    });
  }
});

/**
 * DELETE /api/store-routes/:id
 * Delete a route (only custom routes can be deleted)
 */
router.delete('/:id', async (req, res) => {
  try {
    const route = await StoreRoute.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    // Prevent deleting core routes
    if (route.route_type === 'core') {
      return res.status(400).json({
        success: false,
        message: 'Core routes cannot be deleted'
      });
    }
    
    await route.destroy();
    
    res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete route',
      error: error.message
    });
  }
});

// === REDIRECT MANAGEMENT ===

/**
 * GET /api/store-routes/redirects
 * Get all redirects for the current store
 */
router.get('/redirects/list', async (req, res) => {
  try {
    const { limit, active_only } = req.query;
    const options = {
      activeOnly: active_only !== 'false'
    };
    
    if (limit) {
      options.limit = parseInt(limit);
    }
    
    const redirects = await RouteRedirect.getStoreRedirects(req.storeId, options);
    
    res.json({
      success: true,
      data: redirects,
      count: redirects.length
    });
  } catch (error) {
    console.error('Error fetching redirects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch redirects',
      error: error.message
    });
  }
});

/**
 * POST /api/store-routes/redirects
 * Create a new redirect
 */
router.post('/redirects', async (req, res) => {
  try {
    const redirectData = {
      ...req.body,
      store_id: req.storeId
    };
    
    // Validate required fields
    if (!redirectData.from_path || !redirectData.to_path) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: from_path, to_path'
      });
    }
    
    const redirect = await RouteRedirect.createRedirect(redirectData);
    
    res.status(201).json({
      success: true,
      data: redirect,
      message: 'Redirect created successfully'
    });
  } catch (error) {
    console.error('Error creating redirect:', error);
    
    if (error.message.includes('Circular redirect') || error.message.includes('same')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A redirect from this path already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create redirect',
      error: error.message
    });
  }
});

/**
 * DELETE /api/store-routes/redirects/:id
 * Delete a redirect
 */
router.delete('/redirects/:id', async (req, res) => {
  try {
    const redirect = await RouteRedirect.findOne({
      where: {
        id: req.params.id,
        store_id: req.storeId
      }
    });
    
    if (!redirect) {
      return res.status(404).json({
        success: false,
        message: 'Redirect not found'
      });
    }
    
    await redirect.destroy();
    
    res.json({
      success: true,
      message: 'Redirect deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting redirect:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete redirect',
      error: error.message
    });
  }
});

module.exports = router;