const ConnectionManager = require('../services/database/ConnectionManager');

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
        setImmediate(async () => {
          try {
            const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
            const today = new Date().toISOString().split('T')[0];
            const currentHour = new Date().getHours();

            // Track using Supabase upsert
            await tenantDb.from('usage_metrics').upsert({
              store_id: req.storeId,
              metric_date: today,
              metric_hour: currentHour,
              [`${resourceType}_created`]: 1
            }, {
              onConflict: 'store_id,metric_date,metric_hour',
              count: 'exact'
            });
          } catch (error) {
            console.error(`Failed to track ${resourceType} creation:`, error);
          }
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
        setImmediate(async () => {
          try {
            const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
            const today = new Date().toISOString().split('T')[0];
            const currentHour = new Date().getHours();

            await tenantDb.from('usage_metrics').upsert({
              store_id: req.storeId,
              metric_date: today,
              metric_hour: currentHour,
              [`${resourceType}_updated`]: 1
            }, {
              onConflict: 'store_id,metric_date,metric_hour',
              count: 'exact'
            });
          } catch (error) {
            console.error(`Failed to track ${resourceType} update:`, error);
          }
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
        setImmediate(async () => {
          try {
            const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
            const today = new Date().toISOString().split('T')[0];
            const currentHour = new Date().getHours();

            await tenantDb.from('usage_metrics').upsert({
              store_id: req.storeId,
              metric_date: today,
              metric_hour: currentHour,
              [`${resourceType}_deleted`]: 1
            }, {
              onConflict: 'store_id,metric_date,metric_hour',
              count: 'exact'
            });
          } catch (error) {
            console.error(`Failed to track ${resourceType} deletion:`, error);
          }
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
    setImmediate(async () => {
      try {
        const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();

        await tenantDb.from('usage_metrics').upsert({
          store_id: req.storeId,
          metric_date: today,
          metric_hour: currentHour,
          api_calls: 1
        }, {
          onConflict: 'store_id,metric_date,metric_hour',
          count: 'exact'
        });
      } catch (error) {
        console.error('Failed to track API call:', error);
      }
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
      setImmediate(async () => {
        try {
          const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
          const today = new Date().toISOString().split('T')[0];
          const currentHour = new Date().getHours();

          await tenantDb.from('usage_metrics').upsert({
            store_id: req.storeId,
            metric_date: today,
            metric_hour: currentHour,
            api_errors: 1
          }, {
            onConflict: 'store_id,metric_date,metric_hour',
            count: 'exact'
          });
        } catch (error) {
          console.error('Failed to track API error:', error);
        }
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
    setImmediate(async () => {
      try {
        const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();

        await tenantDb.from('usage_metrics').upsert({
          store_id: req.storeId,
          metric_date: today,
          metric_hour: currentHour,
          page_views: 1
        }, {
          onConflict: 'store_id,metric_date,metric_hour',
          count: 'exact'
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
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
            const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
            const today = new Date().toISOString().split('T')[0];

            // Get current metrics
            const { data: existing } = await tenantDb
              .from('usage_metrics')
              .select('storage_uploaded_bytes, storage_files_count')
              .eq('store_id', req.storeId)
              .eq('metric_date', today)
              .is('metric_hour', null)
              .maybeSingle();

            await tenantDb.from('usage_metrics').upsert({
              store_id: req.storeId,
              metric_date: today,
              metric_hour: null,
              storage_uploaded_bytes: (existing?.storage_uploaded_bytes || 0) + bytes,
              storage_files_count: (existing?.storage_files_count || 0) + 1
            }, {
              onConflict: 'store_id,metric_date,metric_hour'
            });
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
          const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
          const today = new Date().toISOString().split('T')[0];

          // Get current metrics
          const { data: existing } = await tenantDb
            .from('usage_metrics')
            .select('orders_created, orders_total_value')
            .eq('store_id', req.storeId)
            .eq('metric_date', today)
            .is('metric_hour', null)
            .maybeSingle();

          const newOrdersCreated = (existing?.orders_created || 0) + 1;
          const newOrdersTotalValue = parseFloat(existing?.orders_total_value || 0) + parseFloat(data.total);
          const newOrdersAvgValue = newOrdersCreated > 0 ? newOrdersTotalValue / newOrdersCreated : 0;

          await tenantDb.from('usage_metrics').upsert({
            store_id: req.storeId,
            metric_date: today,
            metric_hour: null,
            orders_created: newOrdersCreated,
            orders_total_value: newOrdersTotalValue,
            orders_avg_value: newOrdersAvgValue
          }, {
            onConflict: 'store_id,metric_date,metric_hour'
          });
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
    const { masterDbClient } = require('../database/masterConnection');

    // Get store and subscription from master DB
    const { data: store, error: storeError } = await masterDbClient
      .from('stores')
      .select('*')
      .eq('id', req.storeId)
      .maybeSingle();

    if (storeError || !store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Get active subscription from master DB
    const { data: subscriptionData, error: subError } = await masterDbClient
      .from('subscriptions')
      .select('*')
      .eq('store_id', req.storeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscription = subscriptionData;

    if (!subscription) {
      // No active subscription - allow limited access
      return next();
    }

    // Check various limits based on the request
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Get monthly metrics from tenant DB
    const tenantDb = await ConnectionManager.getStoreConnection(req.storeId);
    const { data: monthlyMetrics, error: metricsError } = await tenantDb
      .from('usage_metrics')
      .select('*')
      .eq('store_id', req.storeId)
      .gte('metric_date', startOfMonth);

    if (metricsError) {
      console.error('Error fetching usage metrics:', metricsError);
      return next();
    }

    // Sum up monthly usage
    const monthlyUsage = (monthlyMetrics || []).reduce((acc, metric) => ({
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
