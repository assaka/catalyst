const { Customer, Store } = require('../models'); // Tenant DB models

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

    // Get customer's store_id from the database (source of truth)
    const customer = await Customer.findByPk(req.user.id, {
      attributes: ['id', 'email', 'store_id', 'is_active']
    });

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

    const { Order } = require('../models'); // Tenant DB model
    const order = await Order.findByPk(orderId, {
      attributes: ['id', 'customer_id', 'store_id', 'customer_email']
    });

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
    const customer = await Customer.findByPk(req.user.id, {
      attributes: ['store_id']
    });

    if (customer.store_id && order.store_id !== customer.store_id) {
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

    const customer = await Customer.findByPk(req.user.id, {
      attributes: ['store_id']
    });

    if (!customer || !customer.store_id) {
      return res.status(403).json({
        success: false,
        message: 'Customer account is not assigned to a store'
      });
    }

    // If adding items to cart, validate products belong to customer's store
    if (req.body?.product_id) {
      const { Product } = require('../models'); // Tenant DB model
      const product = await Product.findByPk(req.body.product_id, {
        attributes: ['id', 'store_id']
      });

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
