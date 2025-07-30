const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, OrderItem, Store, Product } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();


// @route   GET /api/orders/by-payment-reference/:paymentReference
// @desc    Get order by payment reference (for order success page)
// @access  Public (no auth required for order success)
router.get('/by-payment-reference/:paymentReference', async (req, res) => {
  try {
    const { paymentReference } = req.params;
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../database/connection');
    
    console.log('🔍 *** DEPLOYMENT v8.0 JOIN FIX *** - Fetching order with payment reference:', paymentReference);
    
    // Use raw SQL with proper JOIN to fetch order and order items
    const queryResult = await sequelize.query(`
      SELECT 
        o.*,
        s.id as store_id,
        s.name as store_name,
        oi.id as order_item_id,
        oi.product_id,
        oi.product_name,
        oi.product_sku,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.original_price,
        oi.selected_options,
        oi.product_attributes,
        p.id as product_db_id,
        p.name as product_db_name,
        p.sku as product_db_sku
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 
        o.payment_reference = :paymentReference 
        OR o.stripe_payment_intent_id = :paymentReference 
        OR o.stripe_session_id = :paymentReference
      ORDER BY oi.created_at ASC
    `, {
      replacements: { paymentReference },
      type: QueryTypes.SELECT
    });

    if (!queryResult || queryResult.length === 0) {
      console.log('❌ Order not found for payment reference:', paymentReference);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Transform the flat result into proper order structure
    const firstRow = queryResult[0];
    
    // Build the order object
    const order = {
      id: firstRow.id,
      order_number: firstRow.order_number,
      status: firstRow.status,
      payment_status: firstRow.payment_status,
      fulfillment_status: firstRow.fulfillment_status,
      customer_id: firstRow.customer_id,
      customer_email: firstRow.customer_email,
      customer_phone: firstRow.customer_phone,
      billing_address: firstRow.billing_address,
      shipping_address: firstRow.shipping_address,
      subtotal: firstRow.subtotal,
      tax_amount: firstRow.tax_amount,
      shipping_amount: firstRow.shipping_amount,
      discount_amount: firstRow.discount_amount,
      payment_fee_amount: firstRow.payment_fee_amount,
      total_amount: firstRow.total_amount,
      currency: firstRow.currency,
      delivery_date: firstRow.delivery_date,
      delivery_time_slot: firstRow.delivery_time_slot,
      delivery_instructions: firstRow.delivery_instructions,
      payment_method: firstRow.payment_method,
      payment_reference: firstRow.payment_reference,
      shipping_method: firstRow.shipping_method,
      tracking_number: firstRow.tracking_number,
      coupon_code: firstRow.coupon_code,
      notes: firstRow.notes,
      admin_notes: firstRow.admin_notes,
      store_id: firstRow.store_id,
      shipped_at: firstRow.shipped_at,
      delivered_at: firstRow.delivered_at,
      cancelled_at: firstRow.cancelled_at,
      createdAt: firstRow.createdAt,
      updatedAt: firstRow.updatedAt,
      
      // Add Store information
      Store: firstRow.store_id ? {
        id: firstRow.store_id,
        name: firstRow.store_name
      } : null,
      
      // Build OrderItems array
      OrderItems: []
    };

    // Group order items
    const orderItemsMap = new Map();
    
    queryResult.forEach(row => {
      if (row.order_item_id) {
        if (!orderItemsMap.has(row.order_item_id)) {
          orderItemsMap.set(row.order_item_id, {
            id: row.order_item_id,
            order_id: row.id,
            product_id: row.product_id,
            product_name: row.product_name,
            product_sku: row.product_sku,
            quantity: row.quantity,
            unit_price: row.unit_price,
            total_price: row.total_price,
            original_price: row.original_price,
            selected_options: row.selected_options,
            product_attributes: row.product_attributes,
            Product: row.product_db_id ? {
              id: row.product_db_id,
              name: row.product_db_name,
              sku: row.product_db_sku
            } : null
          });
        }
      }
    });

    order.OrderItems = Array.from(orderItemsMap.values());

    console.log('✅ Order found with', order.OrderItems.length, 'items using JOIN query');
    console.log('🔍 OrderItems:', order.OrderItems.map(item => ({ 
      id: item.id, 
      name: item.product_name, 
      quantity: item.quantity 
    })));
    
    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Error fetching order by payment reference:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Test JOIN query endpoint  
router.get('/test-join/:paymentReference', async (req, res) => {
  try {
    const { paymentReference } = req.params;
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../database/connection');
    
    console.log('🧪 Testing JOIN query for payment reference:', paymentReference);
    
    const result = await sequelize.query(`
      SELECT 
        o.id as order_id,
        o.order_number,
        oi.id as order_item_id,
        oi.product_name,
        oi.quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.payment_reference = :paymentReference
    `, {
      replacements: { paymentReference },
      type: QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      test: 'JOIN query test',
      payment_reference: paymentReference,
      results: result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
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

module.exports = router;