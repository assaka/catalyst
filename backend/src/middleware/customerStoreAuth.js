const ConnectionManager = require('../services/database/ConnectionManager');

/**
 * Middleware to ensure customers can only access resources within their assigned store
 * This prevents cross-store access where a customer from Store A tries to access Store B
 */
const enforceCustomerStoreBinding = async (req, res, next) => {
  try {
    console.log('🔒 Enforcing customer-store binding');
    console.log('🔍 User:', { id: req.user?.id, role: req.user?.role, store_id: req.user?.store_id });

    // Only apply to customer roles
    if (req.user?.role !== 'customer') {
      console.log('✅ Not a customer, skipping store binding check');
      return next();
    }

    // Extract storeId from user or request headers
    const storeId = req.user?.store_id || req.headers['x-store-id'];
    if (!storeId) {
      console.log('❌ No store ID found in request');
      return res.status(400).json({
        success: false,
        message: 'Store ID required'
      });
    }

    // Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Get customer's store_id from the database (source of truth)
    const { data: customer, error: customerError } = await tenantDb
      .from('customers')
      .select('id, email, store_id, is_active')
      .eq('id', req.user.id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customer data'
      });
    }

    if (!customer) {
      console.log('❌ Customer not found:', req.user.id);
      return res.status(401).json({
        success: false,
        message: 'Customer account not found'
      });
    }

    if (!customer.is_active) {
      console.log('❌ Customer account is inactive:', customer.id);
      return res.status(403).json({
        success: false,
        message: 'Customer account is inactive'
      });
    }

    // Ensure customer has a store_id
    if (!customer.store_id) {
      console.log('❌ Customer has no store assigned:', customer.id);
      return res.status(403).json({
        success: false,
        message: 'Customer account is not assigned to a store'
      });
    }

    // Extract store_id from various request sources
    const requestedStoreId = req.params.store_id ||
                            req.body?.store_id ||
                            req.query?.store_id ||
                            req.headers['x-store-id'];

    console.log('🔍 Customer store_id:', customer.store_id);
    console.log('🔍 Requested store_id:', requestedStoreId);

    // If a store_id is specified in the request, verify it matches customer's store
    if (requestedStoreId && requestedStoreId !== customer.store_id) {
      console.log('❌ Store access denied: Customer attempting to access different store');
      console.log(`   Customer's store: ${customer.store_id}`);
      console.log(`   Requested store: ${requestedStoreId}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access resources from your assigned store.',
        customerStore: customer.store_id,
        requestedStore: requestedStoreId
      });
    }

    // Attach customer's store_id to request for downstream use
    req.customerStoreId = customer.store_id;
    req.customer = customer;

    console.log('✅ Customer-store binding validated');
    next();
  } catch (error) {
    console.error('❌ Customer-store binding check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating customer store access'
    });
  }
};

/**
 * Middleware to validate that customer orders belong to their store
 * Use this for order-related endpoints
 */
const validateCustomerOrderAccess = async (req, res, next) => {
  try {
    // Only apply to customer roles
    if (req.user?.role !== 'customer') {
      return next();
    }

    const orderId = req.params.orderId || req.params.id;

    if (!orderId) {
      return next();
    }

    // Extract storeId from user or request headers
    const storeId = req.user?.store_id || req.headers['x-store-id'];
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID required'
      });
    }

    // Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Fetch order from tenant DB
    const { data: order, error: orderError } = await tenantDb
      .from('orders')
      .select('id, customer_id, store_id, customer_email')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('❌ Error fetching order:', orderError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching order data'
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the order belongs to this customer
    if (order.customer_id !== req.user.id && order.customer_email !== req.user.email) {
      console.log('❌ Order access denied: Order does not belong to this customer');
      return res.status(403).json({
        success: false,
        message: 'Access denied. This order does not belong to you.'
      });
    }

    // Verify the order is from the customer's store
    const { data: customer, error: customerError } = await tenantDb
      .from('customers')
      .select('store_id')
      .eq('id', req.user.id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customer data'
      });
    }

    if (customer?.store_id && order.store_id !== customer.store_id) {
      console.log('❌ Order access denied: Order is from a different store');
      return res.status(403).json({
        success: false,
        message: 'Access denied. This order is from a different store.'
      });
    }

    req.order = order;
    next();
  } catch (error) {
    console.error('❌ Customer order validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating order access'
    });
  }
};

/**
 * Middleware to validate customer cart access
 * Ensures customers can only access carts for their store
 */
const validateCustomerCartAccess = async (req, res, next) => {
  try {
    // Only apply to customer roles
    if (req.user?.role !== 'customer') {
      return next();
    }

    // Extract storeId from user or request headers
    const storeId = req.user?.store_id || req.headers['x-store-id'];
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID required'
      });
    }

    // Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(storeId);

    // Fetch customer from tenant DB
    const { data: customer, error: customerError } = await tenantDb
      .from('customers')
      .select('store_id')
      .eq('id', req.user.id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching customer data'
      });
    }

    if (!customer || !customer.store_id) {
      return res.status(403).json({
        success: false,
        message: 'Customer account is not assigned to a store'
      });
    }

    // If adding items to cart, validate products belong to customer's store
    if (req.body?.product_id) {
      const { data: product, error: productError } = await tenantDb
        .from('products')
        .select('id, store_id')
        .eq('id', req.body.product_id)
        .maybeSingle();

      if (productError) {
        console.error('❌ Error fetching product:', productError);
        return res.status(500).json({
          success: false,
          message: 'Error fetching product data'
        });
      }

      if (product && product.store_id !== customer.store_id) {
        console.log('❌ Cart access denied: Product is from a different store');
        return res.status(403).json({
          success: false,
          message: 'Cannot add products from other stores to your cart'
        });
      }
    }

    req.customerStoreId = customer.store_id;
    next();
  } catch (error) {
    console.error('❌ Customer cart validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating cart access'
    });
  }
};

module.exports = {
  enforceCustomerStoreBinding,
  validateCustomerOrderAccess,
  validateCustomerCartAccess
};
