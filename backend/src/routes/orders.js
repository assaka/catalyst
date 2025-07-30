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
    
    console.log('🔍 *** DEPLOYMENT v7.0 LAZY LOADING + ASSOCIATION FIX *** - Fetching order with payment reference:', paymentReference);
    
    // Use EXACT same logic as admin orders that works
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { payment_reference: paymentReference },
          { stripe_payment_intent_id: paymentReference },
          { stripe_session_id: paymentReference }
        ]
      },
      include: [
        {
          model: Store,
          attributes: ['id', 'name'],
          required: false // Allow null Store
        },
        {
          model: OrderItem,
          include: [{ 
            model: Product, 
            attributes: ['id', 'name', 'sku'],
            required: false 
          }],
          required: false // Allow empty OrderItems
        }
      ]
    });

    if (!order) {
      console.log('❌ Order not found for payment reference:', paymentReference);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Order found with', order.OrderItems?.length || 0, 'items using admin-style query');
    console.log('🔍 Order debug - Raw object keys:', Object.keys(order.dataValues || order));
    console.log('🔍 OrderItems raw:', order.OrderItems);
    console.log('🔍 OrderItems type:', typeof order.OrderItems);
    console.log('🔍 OrderItems is array:', Array.isArray(order.OrderItems));
    
    // Manual query to verify OrderItems exist
    const manualOrderItems = await OrderItem.findAll({
      where: { order_id: order.id },
      include: [{ model: Product, attributes: ['id', 'name', 'sku'] }]
    });
    console.log('🔍 Manual OrderItems query result:', manualOrderItems.length, 'items');
    
    // If the association didn't work but manual query did, use manual query result
    if ((!order.OrderItems || order.OrderItems.length === 0) && manualOrderItems.length > 0) {
      console.log('🔧 Using manual OrderItems query result');
      order.OrderItems = manualOrderItems;
    }
    
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