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
    
    console.log('🔍 SIMPLIFIED FETCH v2 - order with payment reference:', paymentReference);
    
    // Simple approach - get order with relationships
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
          attributes: ['id', 'name', 'currency']
        },
        {
          model: OrderItem,
          include: [{ 
            model: Product, 
            attributes: ['id', 'name', 'sku', 'images'] 
          }]
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

    console.log('✅ Order found with', order.OrderItems?.length || 0, 'items');
    
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