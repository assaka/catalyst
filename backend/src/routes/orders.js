const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, OrderItem, Store, Product } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
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

// @route   GET /api/orders
// @desc    Get orders
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Filter by store ownership
    if (req.user.role !== 'admin') {
      const userStores = await Store.findAll({
        where: { owner_email: req.user.email },
        attributes: ['id']
      });
      const storeIds = userStores.map(store => store.id);
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
          include: [{ model: Product, attributes: ['id', 'name', 'sku'] }]
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
          attributes: ['id', 'name', 'owner_email']
        },
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && order.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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

    if (req.user.role !== 'admin' && store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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
          include: [{ model: Product, attributes: ['id', 'name', 'sku'] }]
        }
      ]
    });

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
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && order.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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

// @route   GET /api/orders/customer
// @desc    Get orders for authenticated customer (legacy endpoint)
// @access  Private (customer authentication required)
router.get('/customer', auth, async (req, res) => {
  try {
    console.log('🔍 Legacy customer orders endpoint called');
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

// @route   GET /api/orders/my-orders
// @desc    Get orders for authenticated customer
// @access  Private (customer authentication required)
router.get('/my-orders', auth, async (req, res) => {
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

module.exports = router;