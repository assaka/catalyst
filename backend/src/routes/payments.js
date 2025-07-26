const express = require('express');
const auth = require('../middleware/auth');
const { Store, Order, OrderItem } = require('../models');

const router = express.Router();

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route   GET /api/payments/connect-status
// @desc    Get Stripe Connect status
// @access  Private
router.get('/connect-status', auth, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        success: true,
        data: {
          connected: false,
          error: 'Stripe not configured'
        }
      });
    }

    // Get store and check for stripe_account_id
    const store = await Store.findByPk(store_id);
    if (!store || !store.stripe_account_id) {
      return res.json({
        success: true,
        data: {
          connected: false,
          account_id: null,
          charges_enabled: false,
          payouts_enabled: false,
          requirements: {
            currently_due: [],
            eventually_due: [],
            past_due: []
          },
          capabilities: {
            card_payments: 'inactive',
            transfers: 'inactive'
          }
        }
      });
    }

    // Get account status from Stripe
    const account = await stripe.accounts.retrieve(store.stripe_account_id);
    
    const connectStatus = {
      connected: true,
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || []
      },
      capabilities: {
        card_payments: account.capabilities?.card_payments || 'inactive',
        transfers: account.capabilities?.transfers || 'inactive'
      },
      details_submitted: account.details_submitted,
      type: account.type
    };

    res.json({
      success: true,
      data: connectStatus
    });
  } catch (error) {
    console.error('Get Stripe Connect status error:', error);
    
    // If the account doesn't exist, return disconnected status
    if (error.code === 'account_invalid') {
      return res.json({
        success: true,
        data: {
          connected: false,
          account_id: null,
          error: 'Invalid Stripe account'
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payments/connect-account
// @desc    Create Stripe Connect account
// @access  Private
router.post('/connect-account', auth, async (req, res) => {
  try {
    const { store_id, country = 'US', business_type = 'company' } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Stripe not configured'
      });
    }

    // Get store
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if account already exists
    if (store.stripe_account_id) {
      return res.status(400).json({
        success: false,
        message: 'Stripe account already exists for this store'
      });
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      business_type: business_type,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      metadata: {
        store_id: store_id,
        store_name: store.name
      }
    });

    // Save account ID to store
    await store.update({
      stripe_account_id: account.id
    });

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CORS_ORIGIN}/dashboard/payments/connect?refresh=true`,
      return_url: `${process.env.CORS_ORIGIN}/dashboard/payments/connect?success=true`,
      type: 'account_onboarding'
    });

    res.json({
      success: true,
      data: {
        account_id: account.id,
        onboarding_url: accountLink.url
      }
    });
  } catch (error) {
    console.error('Create Stripe Connect account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payments/connect-link
// @desc    Create Stripe Connect account link for onboarding
// @access  Private
router.post('/connect-link', auth, async (req, res) => {
  try {
    const { return_url, refresh_url, store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Stripe not configured'
      });
    }

    // Get store
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if store has Stripe account
    if (!store.stripe_account_id) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe account found for this store. Please create an account first.'
      });
    }

    // Create account link for existing account
    const accountLink = await stripe.accountLinks.create({
      account: store.stripe_account_id,
      refresh_url: refresh_url || `${process.env.CORS_ORIGIN}/dashboard/payments/connect?refresh=true`,
      return_url: return_url || `${process.env.CORS_ORIGIN}/dashboard/payments/connect?success=true`,
      type: 'account_onboarding'
    });

    res.json({
      success: true,
      data: {
        url: accountLink.url,
        account_id: store.stripe_account_id
      }
    });
  } catch (error) {
    console.error('Create Stripe Connect link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/payments/create-checkout
// @desc    Create Stripe Checkout Session
// @access  Public
router.post('/create-checkout', async (req, res) => {
  try {
    const { 
      items, 
      store_id, 
      success_url, 
      cancel_url,
      customer_email,
      shipping_address,
      delivery_date,
      delivery_time_slot,
      delivery_instructions,
      coupon_code
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Stripe not configured'
      });
    }

    // Get store to check for Stripe account
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Create line items for Stripe
    const line_items = items.map(item => {
      const unit_amount = Math.round((item.price + (item.options_total || 0)) * 100); // Convert to cents
      
      // Handle different name formats from frontend
      const productName = item.product_name || 
                         item.name || 
                         item.product?.name || 
                         'Product';
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: item.description || item.product?.description || undefined,
            images: item.image_url ? [item.image_url] : item.product?.image_url ? [item.product.image_url] : undefined,
            metadata: {
              product_id: item.product_id?.toString() || '',
              sku: item.sku || item.product?.sku || '',
              selected_options: JSON.stringify(item.selected_options || [])
            }
          },
          unit_amount: unit_amount,
        },
        quantity: item.quantity || 1,
      };
    });

    // Build checkout session configuration
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: success_url || `${process.env.CORS_ORIGIN}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.CORS_ORIGIN}/cart`,
      metadata: {
        store_id: store_id.toString(),
        delivery_date: delivery_date || '',
        delivery_time_slot: delivery_time_slot || '',
        delivery_instructions: delivery_instructions || '',
        coupon_code: coupon_code || ''
      }
    };

    // Add customer email if provided
    if (customer_email) {
      sessionConfig.customer_email = customer_email;
    }

    // Add shipping if address is provided
    if (shipping_address) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU'] // Add more countries as needed
      };
      
      // If we have a specific address, we could pre-fill it
      if (shipping_address.name || shipping_address.address_line1) {
        sessionConfig.customer_details = {
          address: {
            line1: shipping_address.address_line1 || '',
            line2: shipping_address.address_line2 || '',
            city: shipping_address.city || '',
            state: shipping_address.state || '',
            postal_code: shipping_address.postal_code || '',
            country: shipping_address.country || 'US'
          },
          name: shipping_address.name || ''
        };
      }
    }

    // Use Connect account if available
    const stripeOptions = {};
    if (store.stripe_account_id) {
      stripeOptions.stripeAccount = store.stripe_account_id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig, stripeOptions);

    res.json({
      success: true,
      data: {
        session_id: session.id,
        checkout_url: session.url,
        public_key: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', async (req, res) => {
  console.log('Webhook received');
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    console.error('No stripe-signature header found');
    return res.status(400).send('No stripe-signature header');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Webhook signature verified successfully');
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    console.error('Signature:', sig);
    console.error('Body type:', typeof req.body);
    console.error('Body sample:', req.body.toString().substring(0, 100));
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Processing webhook event:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Processing checkout.session.completed for session:', session.id);
      console.log('Session metadata:', session.metadata);
      console.log('Session customer details:', session.customer_details);
      
      try {
        // Create order from checkout session
        const order = await createOrderFromCheckoutSession(session);
        console.log('Order created successfully with ID:', order.id, 'Order Number:', order.order_number);
      } catch (error) {
        console.error('Error creating order from checkout session:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          code: error.code,
          sql: error.sql
        });
        return res.status(500).json({ error: 'Failed to create order' });
      }
      
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Helper function to create order from Stripe checkout session
async function createOrderFromCheckoutSession(session) {
  try {
    const { store_id, delivery_date, delivery_time_slot, delivery_instructions, coupon_code } = session.metadata || {};
    
    // Validate store_id
    if (!store_id) {
      throw new Error('store_id not found in session metadata');
    }
    
    console.log('Creating order for store_id:', store_id);
    
    // Get line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });
    
    // Calculate order totals from session
    const subtotal = session.amount_subtotal / 100; // Convert from cents
    const tax_amount = (session.total_details?.amount_tax || 0) / 100;
    const total_amount = session.amount_total / 100;
    
    // Generate order number
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const order_number = `ORD-${timestamp}-${randomStr}`;
    
    console.log('Generated order_number:', order_number);
    
    // Create the order
    const order = await Order.create({
      order_number: order_number,
      store_id: parseInt(store_id), // Ensure it's a number
      customer_email: session.customer_email || session.customer_details?.email,
      customer_phone: session.customer_details?.phone,
      billing_address: session.customer_details?.address || {},
      shipping_address: session.shipping_details?.address || session.customer_details?.address || {},
      subtotal: subtotal,
      tax_amount: tax_amount,
      shipping_cost: 0, // Add shipping logic if needed
      discount_amount: (session.total_details?.amount_discount || 0) / 100,
      total_amount: total_amount,
      currency: session.currency.toUpperCase(),
      delivery_date: delivery_date ? new Date(delivery_date) : null,
      delivery_time_slot: delivery_time_slot || null,
      delivery_instructions: delivery_instructions || null,
      payment_method: 'stripe',
      payment_reference: session.id, // Use session ID for lookup
      payment_status: 'paid',
      status: 'processing',
      coupon_code: coupon_code || null
    });
    
    // Create order items
    for (const lineItem of lineItems.data) {
      const productMetadata = lineItem.price.product.metadata || {};
      const selectedOptions = productMetadata.selected_options ? 
        JSON.parse(productMetadata.selected_options) : [];
      
      await OrderItem.create({
        order_id: order.id,
        product_id: productMetadata.product_id,
        product_name: lineItem.description,
        product_sku: productMetadata.sku || '',
        quantity: lineItem.quantity,
        unit_price: lineItem.price.unit_amount / 100,
        total_price: (lineItem.amount_total / 100),
        product_attributes: {
          selected_options: selectedOptions
        }
      });
    }
    
    console.log(`Order created successfully: ${order.order_number}`);
    return order;
    
  } catch (error) {
    console.error('Error creating order from checkout session:', error);
    throw error;
  }
}

// @route   POST /api/payments/process
// @desc    Process payment
// @access  Public
router.post('/process', async (req, res) => {
  try {
    // This would normally process a payment with Stripe
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        payment_intent_id: 'pi_placeholder',
        status: 'succeeded',
        amount: req.body.amount || 0
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;