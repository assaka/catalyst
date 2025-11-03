const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, OrderItem, Store, Product, Customer } = require('../models');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');
const { validateCustomerOrderAccess } = require('../middleware/customerStoreAuth');
const emailService = require('../services/email-service');
const router = express.Router();

// @route   GET /api/orders/test
// @desc    Test endpoint to verify deployment
// @access  Public (no auth required)
router.get('/test', (req, res) => {
  console.log('🔍 Orders test endpoint hit');
  res.json({
    success: true,
    message: 'Orders routes are working',
    timestamp: new Date().toISOString(),
    deployment_version: '2.0'
  });
});

// @route   GET /api/orders/by-payment-reference/:paymentReference
// @desc    Get order by payment reference (for order success page)
// @access  Public (no auth required for order success)
router.get('/by-payment-reference/:paymentReference', async (req, res) => {
  try {
    const { paymentReference } = req.params;
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../database/connection');
    
    // Fetch order with items using efficient JOIN query
    const rows = await sequelize.query(`
      SELECT 
        o.*,
        s.name as store_name,
        oi.id as item_id,
        oi.product_id,
        oi.product_name,
        oi.product_sku,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.selected_options,
        p.name as product_db_name,
        p.sku as product_db_sku
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.payment_reference = :ref OR o.stripe_payment_intent_id = :ref OR o.stripe_session_id = :ref
      ORDER BY oi.created_at ASC
    `, {
      replacements: { ref: paymentReference },
      type: QueryTypes.SELECT
    });

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build response from query results
    const first = rows[0];
    const order = {
      ...first,
      Store: first.store_name ? { id: first.store_id, name: first.store_name } : null,
      OrderItems: rows
        .filter(row => row.item_id)
        .map(row => ({
          id: row.item_id,
          product_id: row.product_id,
          product_name: row.product_name,
          product_sku: row.product_sku,
          quantity: row.quantity,
          unit_price: row.unit_price,
          total_price: row.total_price,
          selected_options: row.selected_options,
          Product: row.product_db_name ? {
            id: row.product_id,
            name: row.product_db_name,
            sku: row.product_db_sku
          } : null
        }))
    };

    // Clean up internal fields
    delete order.store_name;
    delete order.item_id;
    delete order.product_db_name;
    delete order.product_db_sku;

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Database diagnostic endpoint
router.get('/db-diagnostic/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../database/connection');
    
    // Direct SQL queries to check database state
    const orderResult = await sequelize.query(
      `SELECT id, order_number, customer_email, total_amount, store_id, created_at 
       FROM orders 
       WHERE payment_reference = :sessionId 
          OR stripe_payment_intent_id = :sessionId 
          OR stripe_session_id = :sessionId`,
      {
        replacements: { sessionId },
        type: QueryTypes.SELECT
      }
    );
    
    let orderItemsResult = [];
    if (orderResult.length > 0) {
      const orderId = orderResult[0].id;
      orderItemsResult = await sequelize.query(
        `SELECT id, order_id, product_id, product_name, quantity, unit_price, total_price, created_at
         FROM order_items 
         WHERE order_id = :orderId`,
        {
          replacements: { orderId },
          type: QueryTypes.SELECT
        }
      );
    }
    
    res.json({
      diagnostic: true,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      order_found: orderResult.length > 0,
      order_data: orderResult[0] || null,
      order_items_count: orderItemsResult.length,
      order_items: orderItemsResult
    });
    
  } catch (error) {
    res.status(500).json({ 
      diagnostic: true,
      error: error.message,
      stack: error.stack
    });
  }
});

// Deployment verification endpoint
router.get('/deployment-check', (req, res) => {
  res.json({
    version: '3.0',
    timestamp: new Date().toISOString(),
    message: 'DEPLOYMENT v3.0 ACTIVE - OrderItems fix deployed',
    server_time: Date.now()
  });
});

// Test endpoint - direct SQL bypass
router.get('/test-direct/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../database/connection');
    
    // Direct SQL queries
    const orderResult = await sequelize.query(
      'SELECT * FROM orders WHERE id = :orderId',
      {
        replacements: { orderId },
        type: QueryTypes.SELECT
      }
    );
    
    const itemsResult = await sequelize.query(
      'SELECT * FROM order_items WHERE order_id = :orderId',
      {
        replacements: { orderId },
        type: QueryTypes.SELECT
      }
    );
    
    res.json({
      order_found: orderResult.length > 0,
      order: orderResult[0] || null,
      items_count: itemsResult.length,
      items: itemsResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/orders/customer-orders
// @desc    Get orders for authenticated customer with full details (temporary workaround)
// @access  Private (customer authentication required)
router.get('/customer-orders', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Customer orders request from user:', req.user?.id, 'role:', req.user?.role);
    console.log('🔍 Full user object:', JSON.stringify(req.user, null, 2));
    
    // Only allow customer role to access this endpoint
    if (req.user?.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer access required.'
      });
    }

    const customerId = req.user.id;
    const customerStoreId = req.user.store_id; // Get from JWT token
    console.log('🔍 Loading orders for customer ID:', customerId, 'Store ID:', customerStoreId);
    console.log('🔍 Customer ID type:', typeof customerId);
    console.log('🔍 Customer ID length:', customerId?.length);

    // Validate that customerId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!customerId || !uuidRegex.test(customerId)) {
      console.error('❌ Invalid customer ID format:', customerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    // Enhanced query with full order details including order items and store info
    // IMPORTANT: Filter by both customer_id AND store_id to prevent cross-store access
    console.log('🔍 About to execute enhanced Sequelize query with customer_id:', customerId);

    const whereClause = { customer_id: customerId };

    // Add store_id filter if available from JWT
    if (customerStoreId) {
      whereClause.store_id = customerStoreId;
      console.log('🔒 Enforcing store binding: only orders from store', customerStoreId);
    }

    console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

    const orders = await Order.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Store,
          attributes: ['id', 'name', 'logo_url', 'user_id']
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'sku', 'images', 'price']
            }
          ]
        }
      ]
    });
    
    console.log('🔍 Enhanced query executed successfully');
    console.log('🔍 Found orders for customer:', orders.length);
    
    // Add payment method details if available
    const ordersWithDetails = orders.map(order => {
      const orderData = order.toJSON();
      
      // Parse payment method details if stored as JSON
      if (orderData.payment_method_details) {
        try {
          orderData.payment_method_details = typeof orderData.payment_method_details === 'string' 
            ? JSON.parse(orderData.payment_method_details) 
            : orderData.payment_method_details;
        } catch (e) {
          console.warn('Could not parse payment_method_details for order:', orderData.id);
        }
      }
      
      // Parse shipping address if stored as JSON
      if (orderData.shipping_address) {
        try {
          orderData.shipping_address = typeof orderData.shipping_address === 'string' 
            ? JSON.parse(orderData.shipping_address) 
            : orderData.shipping_address;
        } catch (e) {
          console.warn('Could not parse shipping_address for order:', orderData.id);
        }
      }
      
      // Parse billing address if stored as JSON
      if (orderData.billing_address) {
        try {
          orderData.billing_address = typeof orderData.billing_address === 'string' 
            ? JSON.parse(orderData.billing_address) 
            : orderData.billing_address;
        } catch (e) {
          console.warn('Could not parse billing_address for order:', orderData.id);
        }
      }
      
      return orderData;
    });

    res.json({
      success: true,
      data: ordersWithDetails
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/orders/customer-orders/:orderId/status
// @desc    Update order status for customer orders
// @access  Private (customer authentication required)
router.put('/customer-orders/:orderId/status', authMiddleware, validateCustomerOrderAccess, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    // Only allow customer role to access this endpoint
    if (req.user?.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer access required.'
      });
    }

    const customerId = req.user.id;
    console.log('🔍 Customer updating order status:', { orderId, status, customerId });
    
    // Validate status
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`
      });
    }
    
    // Find the order and verify it belongs to the customer
    const order = await Order.findOne({
      where: { 
        id: orderId,
        customer_id: customerId 
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }
    
    // Allow customers to perform limited actions based on current status
    if (req.user.role === 'customer') {
      const currentStatus = order.status?.toLowerCase();
      
      // Define allowed transitions for customers (more restrictive)
      const allowedTransitions = {
        'pending': ['cancelled'],
        'processing': ['return_requested'],
        'shipped': ['return_requested'],
        'delivered': ['return_requested']
      };
      
      const allowedStatusesForCurrent = allowedTransitions[currentStatus] || [];
      
      if (!allowedStatusesForCurrent.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `Cannot change order from ${currentStatus} to ${status}. Customer allowed changes: ${allowedStatusesForCurrent.join(', ') || 'none'}`
        });
      }
      
      // Additional validation for final statuses
      if (['cancelled', 'refunded', 'return_requested'].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          message: `Order is already ${currentStatus} and cannot be modified`
        });
      }
    }
    
    // Update the order
    await order.update({
      status,
      status_notes: notes || null,
      updated_at: new Date()
    });
    
    console.log('🔍 Order status updated successfully:', { orderId, oldStatus: order.status, newStatus: status });
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        id: order.id,
        status: order.status,
        status_notes: order.status_notes,
        updated_at: order.updated_at
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get orders for authenticated customer
// @access  Private (customer authentication required)
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Customer orders request from user:', req.user?.id, 'role:', req.user?.role);
    console.log('🔍 Full user object:', JSON.stringify(req.user, null, 2));
    
    // Only allow customer role to access this endpoint
    if (req.user?.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Customer access required.'
      });
    }

    const customerId = req.user.id;
    console.log('🔍 Loading orders for customer ID:', customerId);
    console.log('🔍 Customer ID type:', typeof customerId);
    console.log('🔍 Customer ID length:', customerId?.length);
    
    // Validate that customerId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!customerId || !uuidRegex.test(customerId)) {
      console.error('❌ Invalid customer ID format:', customerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    // Simple query without complex associations to avoid 500 errors
    console.log('🔍 About to execute Sequelize query with customer_id:', customerId);
    
    const whereClause = { customer_id: customerId };
    console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));
    
    const orders = await Order.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    console.log('🔍 Query executed successfully');
    console.log('🔍 Found orders for customer:', orders.length);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders
// @desc    Get orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Filter by store access (ownership + team membership)
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;
    if (status) where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Store,
          attributes: ['id', 'name']
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'sku'] }]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Store,
          attributes: ['id', 'name', 'user_id']
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'sku'] }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, order.Store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('customer_email').isEmail().withMessage('Customer email must be valid'),
  body('billing_address').notEmpty().withMessage('Billing address is required'),
  body('shipping_address').notEmpty().withMessage('Shipping address is required'),
  body('total_amount').isDecimal().withMessage('Total amount must be a valid decimal'),
  body('items').isArray().withMessage('Items must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, items, ...orderData } = req.body;

    // Check store ownership
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const order = await Order.create({ ...orderData, store_id });

    // Create order items
    const orderItems = items.map(item => ({
      ...item,
      order_id: order.id
    }));

    await OrderItem.bulkCreate(orderItems);

    // Fetch the complete order
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Store,
          attributes: ['id', 'name']
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'sku'] }]
        }
      ]
    });

    // Send order success email asynchronously
    try {
      console.log('📧 Attempting to send order success email for order:', completeOrder.order_number);
      console.log('📧 Store:', store?.name, '(', store_id, ')');
      console.log('📧 Recipient:', completeOrder.customer_email);

      // Get customer information
      let customer = null;
      if (completeOrder.customer_id) {
        customer = await Customer.findByPk(completeOrder.customer_id);
        console.log('📧 Customer found:', customer ? `${customer.first_name} ${customer.last_name}` : 'Not found');
      }

      // If no customer record, create a guest customer object from order data
      if (!customer) {
        customer = {
          first_name: completeOrder.customer_first_name || completeOrder.customer_email?.split('@')[0] || 'Customer',
          last_name: completeOrder.customer_last_name || '',
          email: completeOrder.customer_email
        };
        console.log('📧 Using guest customer data:', customer.first_name, customer.last_name);
      }

      // Send email asynchronously (don't block response)
      emailService.sendTransactionalEmail(store_id, 'order_success', {
        recipientEmail: completeOrder.customer_email,
        customer,
        order: completeOrder.toJSON(),
        store: store.toJSON(),
        languageCode: 'en' // TODO: Get from customer preferences or order metadata
      }).then((result) => {
        if (result.success) {
          console.log('✅ Order success email sent successfully to:', completeOrder.customer_email);
        } else {
          console.error('❌ Order success email failed:', result.message || 'Unknown error');
        }
      }).catch(emailError => {
        console.error('❌ Failed to send order success email to:', completeOrder.customer_email);
        console.error('❌ Error details:', emailError.message);
        console.error('❌ Full error:', emailError);
        // Don't fail order creation if email fails
      });
    } catch (emailError) {
      console.error('❌ Error in order success email setup:', emailError.message);
      console.error('❌ Full error:', emailError);
      // Don't fail order creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, order.Store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await order.update(req.body);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;