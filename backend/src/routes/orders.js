const express = require('express');
const { body, validationResult } = require('express-validator');
const { Order, OrderItem, Store, Product, Customer } = require('../models');
const Invoice = require('../models/Invoice');
const Shipment = require('../models/Shipment');
const { Op } = require('sequelize');
const { authMiddleware } = require('../middleware/auth');
const { validateCustomerOrderAccess } = require('../middleware/customerStoreAuth');
const emailService = require('../services/email-service');
const { cacheOrder } = require('../middleware/cacheMiddleware');
const router = express.Router();

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
// @cache   1 minute (Redis/in-memory) - short TTL as orders may update
router.get('/by-payment-reference/:paymentReference', cacheOrder(60), async (req, res) => {
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
      FROM sales_orders o
      LEFT JOIN stores s ON o.store_id = s.id
      LEFT JOIN sales_order_items oi ON o.id = oi.order_id
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

// @route   POST /api/orders/finalize-order
// @desc    Finalize order after successful Stripe payment (for connected accounts)
// @access  Public (called from OrderSuccess page)
router.post('/finalize-order', async (req, res) => {
  try {
    const { session_id, save_shipping_address, save_billing_address } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    console.log('🎯 Finalizing order for session:', session_id);

    // Find the order by payment reference
    const order = await Order.findOne({
      where: {
        [Op.or]: [
          { payment_reference: session_id },
          { stripe_session_id: session_id },
          { stripe_payment_intent_id: session_id }
        ]
      }
    });

    if (!order) {
      console.error('❌ Order not found for session:', session_id);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('✅ Found order:', order.id, 'Current status:', order.status, 'Payment status:', order.payment_status);

    // Check if already finalized
    if (order.status === 'processing' && order.payment_status === 'paid') {
      console.log('✅ Order already finalized, skipping duplicate processing');
      return res.json({
        success: true,
        message: 'Order already finalized',
        data: { order_id: order.id, already_finalized: true }
      });
    }

    // Get the store for the connected account
    const store = await Store.findByPk(order.store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Verify payment with Stripe (use connected account if available)
    const stripeOptions = {};
    if (store.stripe_account_id) {
      stripeOptions.stripeAccount = store.stripe_account_id;
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id, stripeOptions);
      console.log('✅ Retrieved Stripe session:', session.id, 'Payment status:', session.payment_status);
    } catch (stripeError) {
      console.error('❌ Failed to retrieve Stripe session:', stripeError.message);
      return res.status(400).json({
        success: false,
        message: 'Failed to verify payment with Stripe'
      });
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      console.log('⚠️ Payment not complete yet, status:', session.payment_status);
      return res.json({
        success: false,
        message: 'Payment not yet completed',
        data: { payment_status: session.payment_status }
      });
    }

    // Update order status
    console.log('🔄 Updating order status to processing/paid...');
    await order.update({
      status: 'processing',
      payment_status: 'paid',
      updatedAt: new Date()
    });

    console.log('✅ Order status updated successfully');

    // NOTE: Email sending is handled by the Stripe webhook (webhook-connect)
    // This is the authoritative source since it's Stripe's official confirmation
    // Commenting out duplicate email logic here to prevent double emails
    /*
    // Send confirmation email
    try {
      console.log('📧 Sending order confirmation email to:', order.customer_email);

      const orderWithDetails = await Order.findByPk(order.id, {
        include: [{
          model: OrderItem,
          as: 'OrderItems',
          include: [{
            model: Product,
            attributes: ['id', 'sku']
          }]
        }, {
          model: Store,
          as: 'Store',
          attributes: ['id', 'name', 'slug', 'currency', 'settings'] // Explicitly include settings
        }]
      });

      // Try to get customer details
      let customer = null;
      if (order.customer_id) {
        customer = await Customer.findByPk(order.customer_id);
      }

      // Extract customer name from shipping/billing address if customer not found
      const customerName = customer
        ? `${customer.first_name} ${customer.last_name}`
        : (order.shipping_address?.full_name || order.shipping_address?.name || order.billing_address?.full_name || order.billing_address?.name || 'Customer');

      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Send order success email
      await emailService.sendTransactionalEmail(order.store_id, 'order_success_email', {
        recipientEmail: order.customer_email,
        customer: customer || {
          first_name: firstName,
          last_name: lastName,
          email: order.customer_email
        },
        order: orderWithDetails.toJSON(),
        store: orderWithDetails.Store
      });

      console.log('✅ Order confirmation email sent successfully');

      // Check if auto-invoice is enabled in sales settings
      const salesSettings = store.settings?.sales_settings || {};
      if (salesSettings.auto_invoice_enabled) {
        console.log('📧 Auto-invoice enabled, sending invoice email...');

        try {
          // Check if PDF attachment should be included
          let attachments = [];
          if (salesSettings.auto_invoice_pdf_enabled) {
            console.log('📄 Generating PDF invoice...');
            const pdfService = require('../services/pdf-service');

            // Generate invoice PDF
            const invoicePdf = await pdfService.generateInvoicePDF(
              orderWithDetails,
              orderWithDetails.Store,
              orderWithDetails.OrderItems
            );

            attachments = [{
              filename: pdfService.getInvoiceFilename(orderWithDetails),
              content: invoicePdf.toString('base64'),
              contentType: 'application/pdf'
            }];

            console.log('✅ PDF invoice generated successfully');
          }

          // Send invoice email
          await emailService.sendTransactionalEmail(order.store_id, 'invoice_email', {
            recipientEmail: order.customer_email,
            customer: customer || {
              first_name: firstName,
              last_name: lastName,
              email: order.customer_email
            },
            order: orderWithDetails.toJSON(),
            store: orderWithDetails.Store,
            attachments: attachments
          });

          console.log('✅ Invoice email sent successfully');

          // Create invoice record to track that invoice was sent
          try {
            // Generate invoice number (in case hook doesn't fire)
            const invoiceNumber = 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            await Invoice.create({
              invoice_number: invoiceNumber,
              order_id: order.id,
              store_id: order.store_id,
              customer_email: order.customer_email,
              pdf_generated: salesSettings.auto_invoice_pdf_enabled || false,
              email_status: 'sent'
            });
            console.log('✅ Invoice record created');
          } catch (invoiceCreateError) {
            console.error('❌ Failed to create invoice record:', invoiceCreateError);
            // Don't fail if invoice record creation fails
          }
        } catch (invoiceError) {
          console.error('❌ Failed to send invoice email:', invoiceError);
          // Don't fail the request if invoice email fails
        }
      }
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }
    */

    console.log('📧 Email sending disabled in finalize-order - Stripe webhook will handle all emails');
    console.log('📧 This prevents duplicate emails since finalize-order runs before webhook');

    // TODO: Save addresses if requested (requires passing customer_id and address data)
    // This would need to be added to the request body

    res.json({
      success: true,
      message: 'Order finalized successfully',
      data: {
        order_id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status
      }
    });

  } catch (error) {
    console.error('❌ Error finalizing order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize order',
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
       FROM sales_orders
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
         FROM sales_order_items
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
      'SELECT * FROM sales_orders WHERE id = :orderId',
      {
        replacements: { orderId },
        type: QueryTypes.SELECT
      }
    );
    
    const itemsResult = await sequelize.query(
      'SELECT * FROM sales_order_items WHERE order_id = :orderId',
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
      emailService.sendTransactionalEmail(store_id, 'order_success_email', {
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

// @route   POST /api/orders/:id/resend-confirmation
// @desc    Resend order confirmation email
// @access  Private (admin)
router.post('/:id/resend-confirmation', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Load order with all details
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }]
        },
        { model: Store, as: 'Store' }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get customer details
    const customer = order.customer_id ? await Customer.findByPk(order.customer_id) : null;

    // Parse customer name from billing address
    let firstName = 'Customer';
    let lastName = '';
    const fullName = order.billing_address?.full_name || order.billing_address?.name || '';
    if (fullName && fullName.trim()) {
      const nameParts = fullName.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    // Send order confirmation email
    await emailService.sendTransactionalEmail(order.store_id, 'order_success_email', {
      recipientEmail: order.customer_email,
      customer: customer || { first_name: firstName, last_name: lastName, email: order.customer_email },
      order: order.toJSON(),
      store: order.Store
    });

    res.json({
      success: true,
      message: 'Order confirmation email resent successfully'
    });
  } catch (error) {
    console.error('Resend order confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend order confirmation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/orders/:id/send-invoice
// @desc    Send or resend invoice email
// @access  Private (admin)
router.post('/:id/send-invoice', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { withPdf = true } = req.body;

    // Load order with all details
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }]
        },
        { model: Store, as: 'Store' }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get customer details
    const customer = order.customer_id ? await Customer.findByPk(order.customer_id) : null;

    // Parse customer name from billing address
    let firstName = 'Customer';
    let lastName = '';
    const fullName = order.billing_address?.full_name || order.billing_address?.name || '';
    if (fullName && fullName.trim()) {
      const nameParts = fullName.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    // Check if invoice already exists
    let invoice = await Invoice.findOne({ where: { order_id: id } });

    // Generate invoice number once (reuse if invoice exists)
    const invoiceNumber = invoice ? invoice.invoice_number : ('INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase());

    // Prepare attachments if PDF is requested
    let attachments = [];
    let pdfGeneratedSuccessfully = false;
    if (withPdf) {
      try {
        const pdfService = require('../services/pdf-service');
        const invoicePdf = await pdfService.generateInvoicePDF(order, order.Store, order.OrderItems);
        attachments = [{
          filename: pdfService.getInvoiceFilename(order),
          content: invoicePdf.toString('base64'),
          contentType: 'application/pdf'
        }];
        pdfGeneratedSuccessfully = true;
        console.log('✅ Invoice PDF generated successfully');
      } catch (pdfError) {
        console.error('❌ PDF generation failed, sending invoice without PDF:', pdfError.message);
        // Continue without PDF - invoice email can still be sent
      }
    }

    // Send invoice email (with or without PDF attachment)
    await emailService.sendTransactionalEmail(order.store_id, 'invoice_email', {
      recipientEmail: order.customer_email,
      customer: customer || { first_name: firstName, last_name: lastName, email: order.customer_email },
      order: order.toJSON(),
      store: order.Store,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toLocaleDateString(),
      attachments: attachments
    });

    // Create or update invoice record
    if (invoice) {
      await invoice.update({
        sent_at: new Date(),
        pdf_generated: pdfGeneratedSuccessfully,
        email_status: 'sent'
      });
    } else {
      invoice = await Invoice.create({
        invoice_number: invoiceNumber,
        order_id: id,
        store_id: order.store_id,
        customer_email: order.customer_email,
        pdf_generated: pdfGeneratedSuccessfully,
        email_status: 'sent'
      });
    }

    // Update order status to 'processing' when invoice is sent
    if (order.status === 'pending') {
      await order.update({
        status: 'processing',
        payment_status: 'paid'
      });
    }

    res.json({
      success: true,
      message: 'Invoice email sent successfully',
      data: { invoice_id: invoice.id }
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/orders/:id/send-shipment
// @desc    Send or resend shipment notification email
// @access  Private (admin)
router.post('/:id/send-shipment', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, trackingUrl, carrier, estimatedDeliveryDate } = req.body;

    // Load order with all details
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [{ model: Product, as: 'Product' }]
        },
        { model: Store, as: 'Store' }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get customer details
    const customer = order.customer_id ? await Customer.findByPk(order.customer_id) : null;

    // Parse customer name from billing address
    let firstName = 'Customer';
    let lastName = '';
    const fullName = order.billing_address?.full_name || order.billing_address?.name || '';
    if (fullName && fullName.trim()) {
      const nameParts = fullName.trim().split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    // Update order tracking info if provided
    if (trackingNumber) {
      await order.update({ tracking_number: trackingNumber });
    }

    // Check if shipment already exists
    let shipment = await Shipment.findOne({ where: { order_id: id } });

    // Check if PDF should be generated for shipment
    const salesSettings = order.Store.settings?.sales_settings || {};
    let shipmentAttachments = [];

    if (salesSettings.auto_invoice_pdf_enabled) { // Reuse PDF setting for shipment
      try {
        console.log('📄 Generating PDF shipment notice...');
        const pdfService = require('../services/pdf-service');

        const shipmentPdf = await pdfService.generateShipmentPDF(
          order,
          order.Store,
          order.OrderItems
        );

        shipmentAttachments = [{
          filename: pdfService.getShipmentFilename(order),
          content: shipmentPdf.toString('base64'),
          contentType: 'application/pdf'
        }];

        console.log('✅ PDF shipment notice generated successfully');
      } catch (pdfError) {
        console.error('❌ Failed to generate shipment PDF:', pdfError);
        // Continue without PDF if generation fails
      }
    }

    // Send shipment notification email
    await emailService.sendTransactionalEmail(order.store_id, 'shipment_email', {
      recipientEmail: order.customer_email,
      customer: customer || { first_name: firstName, last_name: lastName, email: order.customer_email },
      order: order.toJSON(),
      store: order.Store,
      tracking_number: trackingNumber || order.tracking_number || 'Not provided',
      tracking_url: trackingUrl || '',
      carrier: carrier || 'Not specified',
      shipping_method: carrier || order.shipping_method || 'Not specified',
      estimated_delivery_date: estimatedDeliveryDate ? new Date(estimatedDeliveryDate).toLocaleDateString() : 'To be confirmed',
      attachments: shipmentAttachments
    });

    // Create or update shipment record
    if (shipment) {
      await shipment.update({
        sent_at: new Date(),
        tracking_number: trackingNumber || shipment.tracking_number,
        tracking_url: trackingUrl || shipment.tracking_url,
        carrier: carrier || shipment.carrier,
        estimated_delivery_date: estimatedDeliveryDate || shipment.estimated_delivery_date,
        email_status: 'sent'
      });
    } else {
      // Generate shipment number (in case hook doesn't fire)
      const shipmentNumber = 'SHIP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

      shipment = await Shipment.create({
        shipment_number: shipmentNumber,
        order_id: id,
        store_id: order.store_id,
        customer_email: order.customer_email,
        tracking_number: trackingNumber || order.tracking_number,
        tracking_url: trackingUrl,
        carrier: carrier,
        shipping_method: order.shipping_method,
        estimated_delivery_date: estimatedDeliveryDate,
        email_status: 'sent'
      });
    }

    // Update order status to shipped if not already
    if (order.status !== 'shipped' && order.status !== 'delivered') {
      await order.update({
        status: 'shipped',
        fulfillment_status: 'shipped',
        shipped_at: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Shipment notification sent successfully',
      data: { shipment_id: shipment.id }
    });
  } catch (error) {
    console.error('Send shipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send shipment notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders/test-invoice-settings/:storeId
// @desc    Test endpoint to check auto-invoice settings for a store
// @access  Public (for debugging)
router.get('/test-invoice-settings/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log('🔍 Testing invoice settings for store:', storeId);

    // Load store with settings
    const store = await Store.findByPk(storeId, {
      attributes: ['id', 'name', 'slug', 'currency', 'settings']
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const salesSettings = store.settings?.sales_settings || {};

    console.log('✅ Store loaded:', store.name);
    console.log('📋 Settings:', JSON.stringify(store.settings, null, 2));
    console.log('📋 Sales Settings:', JSON.stringify(salesSettings, null, 2));

    res.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug
      },
      settings: store.settings,
      sales_settings: salesSettings,
      auto_invoice_enabled: salesSettings.auto_invoice_enabled || false,
      auto_invoice_pdf_enabled: salesSettings.auto_invoice_pdf_enabled || false,
      auto_ship_enabled: salesSettings.auto_ship_enabled || false,
      message: salesSettings.auto_invoice_enabled
        ? '✅ Auto-invoice is ENABLED - invoices will be sent automatically'
        : '⚠️ Auto-invoice is DISABLED - invoices will NOT be sent automatically'
    });
  } catch (error) {
    console.error('❌ Error testing invoice settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing invoice settings',
      error: error.message
    });
  }
});

module.exports = router;