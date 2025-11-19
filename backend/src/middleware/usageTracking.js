const { UsageMetric } = require('../models'); // Tenant DB model

/**
 * Usage Tracking Middleware
 *
 * Tracks API usage and resource metrics for billing purposes
 */

/**
 * Track resource creation (products, categories, orders, etc.)
 */
const trackResourceCreation = (resourceType) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json;

    // Override json function to track successful creations
    res.json = function(data) {
      // Only track successful POST requests (201 Created)
      if (req.method === 'POST' && res.statusCode === 201 && req.storeId) {
        setImmediate(() => {
          UsageMetric.track(req.storeId, `${resourceType}_created`).catch(error => {
            console.error(`Failed to track ${resourceType} creation:`, error);
          });
        });
      }

      // Call original json
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Track resource updates
 */
const trackResourceUpdate = (resourceType) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      // Track successful PUT/PATCH requests
      if (['PUT', 'PATCH'].includes(req.method) && res.statusCode === 200 && req.storeId) {
        setImmediate(() => {
          UsageMetric.track(req.storeId, `${resourceType}_updated`).catch(error => {
            console.error(`Failed to track ${resourceType} update:`, error);
          });
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Track resource deletion
 */
const trackResourceDeletion = (resourceType) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      // Track successful DELETE requests
      if (req.method === 'DELETE' && res.statusCode === 200 && req.storeId) {
        setImmediate(() => {
          UsageMetric.track(req.storeId, `${resourceType}_deleted`).catch(error => {
            console.error(`Failed to track ${resourceType} deletion:`, error);
          });
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Track API calls (for rate limiting and billing)
 */
const trackApiCall = async (req, res, next) => {
  if (req.storeId) {
    setImmediate(() => {
      UsageMetric.track(req.storeId, 'api_call').catch(error => {
        console.error('Failed to track API call:', error);
      });
    });
  }

  next();
};

/**
 * Track API errors
 */
const trackApiError = async (req, res, next) => {
  // Store original status function
  const originalStatus = res.status;

  // Override status function to track errors
  res.status = function(statusCode) {
    // Track 4xx and 5xx errors
    if (statusCode >= 400 && req.storeId) {
      setImmediate(() => {
        UsageMetric.track(req.storeId, 'api_error').catch(error => {
          console.error('Failed to track API error:', error);
        });
      });
    }

    return originalStatus.call(this, statusCode);
  };

  next();
};

/**
 * Track page views (for storefront analytics)
 */
const trackPageView = async (req, res, next) => {
  if (req.storeId) {
    setImmediate(() => {
      UsageMetric.track(req.storeId, 'page_view').catch(error => {
        console.error('Failed to track page view:', error);
      });
    });
  }

  next();
};

/**
 * Track storage uploads
 */
const trackStorageUpload = (bytes) => {
  return async (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      if (res.statusCode === 200 && req.storeId) {
        setImmediate(async () => {
          try {
            const today = new Date().toISOString().split('T')[0];
            const [metric] = await UsageMetric.findOrCreate({
              where: {
                store_id: req.storeId,
                metric_date: today,
                metric_hour: null
              },
              defaults: {
                store_id: req.storeId,
                metric_date: today
              }
            });

            metric.storage_uploaded_bytes = (metric.storage_uploaded_bytes || 0) + bytes;
            metric.storage_files_count = (metric.storage_files_count || 0) + 1;
            await metric.save();
          } catch (error) {
            console.error('Failed to track storage upload:', error);
          }
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Track order value (for revenue tracking)
 */
const trackOrderValue = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (req.method === 'POST' && res.statusCode === 201 && req.storeId && data.total) {
      setImmediate(async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const [metric] = await UsageMetric.findOrCreate({
            where: {
              store_id: req.storeId,
              metric_date: today,
              metric_hour: null
            },
            defaults: {
              store_id: req.storeId,
              metric_date: today
            }
          });

          metric.orders_created = (metric.orders_created || 0) + 1;
          metric.orders_total_value = parseFloat(metric.orders_total_value || 0) + parseFloat(data.total);

          // Calculate average
          if (metric.orders_created > 0) {
            metric.orders_avg_value = parseFloat(metric.orders_total_value) / metric.orders_created;
          }

          await metric.save();
        } catch (error) {
          console.error('Failed to track order value:', error);
        }
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Check usage limits (for subscription enforcement)
 */
const checkUsageLimits = async (req, res, next) => {
  if (!req.storeId) {
    return next();
  }

  try {
    const { Store, Subscription } = require('../models'); // Store: Hybrid, Subscription: Master

    const store = await Store.findByPk(req.storeId, {
      include: [{
        model: Subscription,
        as: 'subscriptions',
        where: { status: 'active' },
        required: false,
        limit: 1,
        order: [['created_at', 'DESC']]
      }]
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const subscription = store.subscriptions?.[0];

    if (!subscription) {
      // No active subscription - allow limited access
      return next();
    }

    // Check various limits based on the request
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const monthlyMetrics = await UsageMetric.findAll({
      where: {
        store_id: req.storeId,
        metric_date: {
          [require('sequelize').Op.gte]: startOfMonth
        }
      }
    });

    // Sum up monthly usage
    const monthlyUsage = monthlyMetrics.reduce((acc, metric) => ({
      api_calls: acc.api_calls + (metric.api_calls || 0),
      products: Math.max(acc.products, metric.total_products || 0),
      orders: acc.orders + (metric.orders_created || 0)
    }), { api_calls: 0, products: 0, orders: 0 });

    // Check API call limit
    if (subscription.max_api_calls_per_month && monthlyUsage.api_calls >= subscription.max_api_calls_per_month) {
      return res.status(429).json({
        success: false,
        message: 'API call limit exceeded for your subscription plan',
        limit: subscription.max_api_calls_per_month,
        used: monthlyUsage.api_calls,
        upgrade_url: '/admin/subscription/upgrade'
      });
    }

    // Check product limit (only for product creation)
    if (req.method === 'POST' && req.path.includes('/products')) {
      if (subscription.max_products && monthlyUsage.products >= subscription.max_products) {
        return res.status(403).json({
          success: false,
          message: 'Product limit exceeded for your subscription plan',
          limit: subscription.max_products,
          used: monthlyUsage.products,
          upgrade_url: '/admin/subscription/upgrade'
        });
      }
    }

    // Check order limit
    if (subscription.max_orders_per_month && monthlyUsage.orders >= subscription.max_orders_per_month) {
      if (req.method === 'POST' && req.path.includes('/orders')) {
        return res.status(403).json({
          success: false,
          message: 'Order limit exceeded for your subscription plan',
          limit: subscription.max_orders_per_month,
          used: monthlyUsage.orders,
          upgrade_url: '/admin/subscription/upgrade'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error checking usage limits:', error);
    // Don't block requests on error
    next();
  }
};

module.exports = {
  trackResourceCreation,
  trackResourceUpdate,
  trackResourceDeletion,
  trackApiCall,
  trackApiError,
  trackPageView,
  trackStorageUpload,
  trackOrderValue,
  checkUsageLimits
};
