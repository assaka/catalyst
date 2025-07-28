const express = require('express');
const auth = require('../middleware/auth');
const { Store, Order, OrderItem, Product } = require('../models');

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
      shipping_method,
      selected_shipping_method,
      shipping_cost,
      discount_amount,
      applied_coupon,
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

    // Get store currency
    const storeCurrency = store.currency || 'usd';
    
    // Create line items for Stripe - separate main product and custom options
    const line_items = [];
    
    // Pre-fetch product data for all items to get actual product names
    const productIds = [...new Set(items.map(item => item.product_id).filter(Boolean))];
    const productMap = new Map();
    
    if (productIds.length > 0) {
      try {
        const products = await Product.findAll({
          where: { id: productIds }
        });
        products.forEach(product => {
          productMap.set(product.id, product);
        });
        console.log('Pre-fetched product data for', products.length, 'products');
      } catch (error) {
        console.warn('Could not pre-fetch product data:', error.message);
      }
    }
    
    items.forEach(item => {
      // Main product line item
      const basePrice = item.price || 0;
      const unit_amount = Math.round(basePrice * 100); // Convert to cents
      
      // Handle different name formats from frontend with database lookup
      let productName = item.product_name || 
                       item.name || 
                       item.product?.name || 
                       'Product';
      
      // Look up actual product name from database if needed
      if ((!productName || productName === 'Product') && item.product_id) {
        const product = productMap.get(item.product_id);
        if (product) {
          productName = product.name;
          console.log('Using database product name for Stripe:', productName);
        }
      }
      
      // Add main product line item
      line_items.push({
        price_data: {
          currency: storeCurrency.toLowerCase(),
          product_data: {
            name: productName,
            description: item.description || item.product?.description || undefined,
            images: item.image_url ? [item.image_url] : item.product?.image_url ? [item.product.image_url] : undefined,
            metadata: {
              product_id: item.product_id?.toString() || '',
              sku: item.sku || item.product?.sku || '',
              item_type: 'main_product'
            }
          },
          unit_amount: unit_amount,
        },
        quantity: item.quantity || 1,
      });
      
      // Add separate line items for each custom option
      if (item.selected_options && item.selected_options.length > 0) {
        item.selected_options.forEach(option => {
          if (option.price && option.price > 0) {
            const optionUnitAmount = Math.round(option.price * 100); // Convert to cents
            
            line_items.push({
              price_data: {
                currency: storeCurrency.toLowerCase(),
                product_data: {
                  name: `${productName} - ${option.name}`,
                  description: `Custom option for ${productName}`,
                  metadata: {
                    product_id: item.product_id?.toString() || '',
                    option_name: option.name,
                    parent_product: productName,
                    item_type: 'custom_option'
                  }
                },
                unit_amount: optionUnitAmount,
              },
              quantity: item.quantity || 1,
            });
          }
        });
      }
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
        coupon_code: applied_coupon?.code || coupon_code || '',
        discount_amount: discount_amount?.toString() || '0',
        shipping_method_name: shipping_method?.name || selected_shipping_method || '',
        shipping_method_id: shipping_method?.id?.toString() || '',
        shipping_cost: shipping_cost?.toString() || '0'
      }
    };

    // Apply discount if provided
    if (applied_coupon && discount_amount > 0) {
      try {
        // Determine Stripe options for Connect account
        const discountStripeOptions = {};
        if (store.stripe_account_id) {
          discountStripeOptions.stripeAccount = store.stripe_account_id;
        }

        // Create a Stripe coupon for the discount
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(discount_amount * 100), // Convert to cents
          currency: storeCurrency.toLowerCase(),
          duration: 'once',
          name: `Discount: ${applied_coupon.code}`,
          metadata: {
            original_coupon_code: applied_coupon.code,
            original_coupon_id: applied_coupon.id?.toString() || ''
          }
        }, discountStripeOptions);

        // Apply the coupon to the session so it's pre-applied
        sessionConfig.discounts = [{
          coupon: stripeCoupon.id
        }];
        
        // Note: Cannot use allow_promotion_codes when discounts are pre-applied

        console.log('Applied Stripe discount:', stripeCoupon.id, 'Amount:', discount_amount);
      } catch (discountError) {
        console.error('Failed to create Stripe coupon:', discountError.message);
        // Continue without discount rather than failing the entire checkout
      }
    } else {
      // If no discount is pre-applied, allow customers to enter promotion codes
      sessionConfig.allow_promotion_codes = true;
    }

    // Set up shipping with the pre-selected method
    if (shipping_method && shipping_cost !== undefined) {
      // Create a shipping rate for the pre-selected method
      const shippingRateData = {
        type: 'fixed_amount',
        fixed_amount: {
          amount: Math.round((shipping_cost || 0) * 100), // Convert to cents
          currency: storeCurrency.toLowerCase(),
        },
        display_name: shipping_method.name || selected_shipping_method || 'Selected Shipping',
      };

      // Add delivery estimate if available
      if (shipping_method.estimated_delivery_days) {
        shippingRateData.delivery_estimate = {
          minimum: {
            unit: 'business_day',
            value: Math.max(1, shipping_method.estimated_delivery_days - 1),
          },
          maximum: {
            unit: 'business_day',
            value: shipping_method.estimated_delivery_days + 1,
          },
        };
      }

      // Create the shipping rate first
      try {
        const stripeOptions = {};
        if (store.stripe_account_id) {
          stripeOptions.stripeAccount = store.stripe_account_id;
        }

        const shippingRate = await stripe.shippingRates.create(shippingRateData, stripeOptions);
        
        // Use the created shipping rate in the session via shipping_options
        sessionConfig.shipping_options = [{
          shipping_rate: shippingRate.id
        }];
        
        console.log('Created and applied shipping rate:', shippingRate.id, 'for method:', shipping_method.name);
      } catch (shippingError) {
        console.error('Failed to create shipping rate:', shippingError.message);
        // Fallback to line item for shipping
        sessionConfig.line_items.push({
          price_data: {
            currency: storeCurrency.toLowerCase(),
            product_data: {
              name: `Shipping: ${shipping_method.name || selected_shipping_method}`,
              metadata: {
                item_type: 'shipping'
              }
            },
            unit_amount: Math.round((shipping_cost || 0) * 100),
          },
          quantity: 1,
        });
      }
    } else if (shipping_address && shipping_cost !== undefined) {
      // If we have shipping cost but no method, add as line item
      sessionConfig.line_items.push({
        price_data: {
          currency: storeCurrency.toLowerCase(),
          product_data: {
            name: 'Shipping',
            metadata: {
              item_type: 'shipping'
            }
          },
          unit_amount: Math.round((shipping_cost || 0) * 100),
        },
        quantity: 1,
      });
    }

    // Enable shipping address collection if we have shipping data
    if (shipping_address || sessionConfig.shipping_options) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NL', 'DE', 'FR', 'ES', 'IT', 'BE', 'AT', 'CH']
      };
    }

    // Pre-fill customer details if we have shipping address
    let customerCreated = false;
    if (shipping_address && (shipping_address.full_name || shipping_address.street || shipping_address.address)) {
      // Handle different address formats
      const customerName = shipping_address.full_name || shipping_address.name || '';
      const line1 = shipping_address.street || shipping_address.address || shipping_address.address_line1 || '';
      const line2 = shipping_address.address_line2 || '';
      const city = shipping_address.city || '';
      const state = shipping_address.state || shipping_address.province || '';
      const postal_code = shipping_address.postal_code || shipping_address.zip || '';
      const country = shipping_address.country || 'US';
      
      // Try to create a customer with prefilled data for better experience
      // Note: For Connect accounts, we need to create the customer in the same account context
      if (customer_email && customerName) {
        try {
          // Determine Stripe options for Connect account
          const customerStripeOptions = {};
          if (store.stripe_account_id) {
            customerStripeOptions.stripeAccount = store.stripe_account_id;
          }
          
          // First check if customer already exists in the appropriate account
          const customers = await stripe.customers.list({
            email: customer_email,
            limit: 1
          }, customerStripeOptions);
          
          let customer;
          if (customers.data.length > 0) {
            customer = customers.data[0];
            console.log('Found existing customer:', customer.id);
          } else {
            // Create new customer with address in the appropriate account
            customer = await stripe.customers.create({
              email: customer_email,
              name: customerName,
              address: line1 ? {
                line1: line1,
                line2: line2 || undefined,
                city: city || undefined,
                state: state || undefined,
                postal_code: postal_code || undefined,
                country: country
              } : undefined,
              shipping: (customerName && line1) ? {
                name: customerName,
                address: {
                  line1: line1,
                  line2: line2 || undefined,
                  city: city || undefined,
                  state: state || undefined,
                  postal_code: postal_code || undefined,
                  country: country
                }
              } : undefined
            }, customerStripeOptions);
            console.log('Created new customer:', customer.id);
          }
          
          sessionConfig.customer = customer.id;
          customerCreated = true;
        } catch (customerError) {
          console.log('Could not create/find customer, using email only:', customerError.message);
        }
      }
    }

    // Add customer email if provided and no customer was created
    if (customer_email && !customerCreated) {
      sessionConfig.customer_email = customer_email;
    }

    // Use Connect account if available
    const stripeOptions = {};
    if (store.stripe_account_id) {
      stripeOptions.stripeAccount = store.stripe_account_id;
      console.log('Creating checkout session WITH Connect account:', store.stripe_account_id);
    } else {
      console.log('Creating checkout session WITHOUT Connect account');
    }

    // Log the session config for debugging
    console.log('Creating Stripe session with config:', {
      success_url: sessionConfig.success_url,
      cancel_url: sessionConfig.cancel_url,
      metadata: sessionConfig.metadata
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig, stripeOptions);

    console.log('Created Stripe session:', {
      id: session.id,
      url: session.url,
      success_url: session.success_url
    });

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
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Headers:', Object.keys(req.headers));
  console.log('Body type:', typeof req.body);
  console.log('Body length:', req.body ? req.body.length : 'undefined');
  console.log('Request IP:', req.ip);
  console.log('User-Agent:', req.headers['user-agent']);
  
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
        
        // Verify order items were created
        const itemCount = await OrderItem.count({ where: { order_id: order.id } });
        console.log('✅ Verified:', itemCount, 'OrderItems created for order', order.id);
        
        if (itemCount === 0) {
          console.error('⚠️ WARNING: Order created but no OrderItems found!');
        }
        
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
    case 'payment_intent.succeeded':
      console.log('Payment succeeded, but no order creation needed for this event type');
      console.log('Note: Orders should be created from checkout.session.completed events');
      break;
    case 'payment_intent.created':
      console.log('Payment intent created, no action needed');
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Debug endpoint to check OrderItems for a specific order
router.get('/debug/order-items/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 Debug: Checking OrderItems for order:', orderId);
    
    // Count OrderItems
    const itemCount = await OrderItem.count({ where: { order_id: orderId } });
    console.log('📊 OrderItems count in database:', itemCount);
    
    // Get actual OrderItems with raw data
    const items = await OrderItem.findAll({ 
      where: { order_id: orderId },
      raw: true 
    });
    console.log('📋 OrderItems raw data:', items);
    
    // Check the actual order_id values
    if (items.length > 0) {
      console.log('🔍 First OrderItem order_id:', items[0].order_id);
      console.log('🔍 Looking for order_id:', orderId);
      console.log('🔍 IDs match:', items[0].order_id === orderId);
    }
    
    // Get Order with includes - try different approaches
    const order1 = await Order.findByPk(orderId, {
      include: [OrderItem]
    });
    
    const order2 = await Order.findOne({
      where: { id: orderId },
      include: [OrderItem]
    });
    
    // Check if associations are loaded properly
    const associationsLoaded = Order.associations;
    console.log('🔍 Order associations:', Object.keys(associationsLoaded));
    console.log('🔍 OrderItem association exists:', !!associationsLoaded.OrderItems);
    
    res.json({
      success: true,
      order_exists: !!order1,
      order_items_count: itemCount,
      order_items_via_findByPk: order1?.OrderItems?.length || 0,
      order_items_via_findOne: order2?.OrderItems?.length || 0,
      associations_available: Object.keys(associationsLoaded),
      has_orderitems_association: !!associationsLoaded.OrderItems,
      direct_items: items,
      first_item_order_id: items[0]?.order_id,
      looking_for_order_id: orderId,
      ids_match: items[0]?.order_id === orderId
    });
    
  } catch (error) {
    console.error('Debug OrderItems error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Debug endpoint to manually process a specific session
router.post('/debug-session', async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }
    
    console.log('🔍 Debug: Manually processing session:', session_id);
    
    // Get the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('🔍 Debug: Retrieved session:', JSON.stringify(session, null, 2));
    
    // Process it like a webhook
    const order = await createOrderFromCheckoutSession(session);
    console.log('🔍 Debug: Order created:', order.id);
    
    // Count items
    const itemCount = await OrderItem.count({ where: { order_id: order.id } });
    console.log('🔍 Debug: OrderItems created:', itemCount);
    
    res.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      items_created: itemCount
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to create order from Stripe checkout session
async function createOrderFromCheckoutSession(session) {
  const { sequelize } = require('../database/connection');
  const transaction = await sequelize.transaction();
  
  try {
    const { store_id, delivery_date, delivery_time_slot, delivery_instructions, coupon_code, shipping_method_name, shipping_method_id } = session.metadata || {};
    
    // Validate store_id
    if (!store_id) {
      throw new Error('store_id not found in session metadata');
    }
    
    console.log('Creating order for store_id:', store_id);
    
    // Get store to determine if we need Connect account context
    const store = await Store.findByPk(store_id);
    if (!store) {
      throw new Error(`Store not found: ${store_id}`);
    }
    
    // Prepare Stripe options for Connect account if needed
    const stripeOptions = {};
    if (store.stripe_account_id) {
      stripeOptions.stripeAccount = store.stripe_account_id;
      console.log('Using Connect account for session retrieval:', store.stripe_account_id);
    }
    
    // Get line items from the session with correct account context
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    }, stripeOptions);
    
    console.log('🛒 Line items retrieved:', JSON.stringify(lineItems, null, 2));
    console.log('📊 Number of line items:', lineItems.data.length);
    
    if (lineItems.data.length === 0) {
      console.error('❌ CRITICAL: No line items found in Stripe session!');
      console.log('Session details for debugging:', {
        id: session.id,
        metadata: session.metadata,
        mode: session.mode,
        status: session.status
      });
    }
    
    // Calculate order totals from session
    const subtotal = session.amount_subtotal / 100; // Convert from cents
    const tax_amount = (session.total_details?.amount_tax || 0) / 100;
    let shipping_cost = (session.total_details?.amount_shipping || 0) / 100;
    const total_amount = session.amount_total / 100;
    
    console.log('Session details:', {
      id: session.id,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      total_details: session.total_details,
      shipping_cost: session.shipping_cost,
      shipping_details: session.shipping_details,
      metadata: session.metadata
    });
    
    console.log('Shipping cost from total_details:', shipping_cost);
    
    // If shipping cost is 0, try to get it from shipping_cost in session or metadata
    if (shipping_cost === 0 && session.shipping_cost) {
      shipping_cost = session.shipping_cost.amount_total / 100;
      console.log('Using shipping_cost.amount_total:', shipping_cost);
    }
    
    // Alternative: get shipping cost from the selected shipping rate
    if (shipping_cost === 0 && session.shipping_cost?.amount_total) {
      shipping_cost = session.shipping_cost.amount_total / 100;
      console.log('Using session.shipping_cost:', shipping_cost);
    }
    
    // If still 0, check if there's a shipping rate ID and retrieve it
    if (shipping_cost === 0 && session.shipping_rate) {
      try {
        const shippingRate = await stripe.shippingRates.retrieve(session.shipping_rate);
        shipping_cost = shippingRate.fixed_amount.amount / 100;
        console.log('Retrieved shipping cost from shipping rate:', shipping_cost);
      } catch (shippingRateError) {
        console.log('Could not retrieve shipping rate:', shippingRateError.message);
      }
    }
    
    // Final fallback: check if shipping cost was passed in metadata 
    if (shipping_cost === 0 && session.metadata?.shipping_cost) {
      try {
        const metadataShippingCost = parseFloat(session.metadata.shipping_cost);
        if (!isNaN(metadataShippingCost) && metadataShippingCost > 0) {
          shipping_cost = metadataShippingCost;
          console.log('Using shipping cost from metadata:', shipping_cost);
        }
      } catch (metadataError) {
        console.log('Could not parse shipping cost from metadata:', metadataError.message);
      }
    }
    
    console.log('Final shipping cost used:', shipping_cost);
    
    // Generate order number
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const order_number = `ORD-${timestamp}-${randomStr}`;
    
    console.log('Generated order_number:', order_number);
    
    // Create the order within transaction
    const order = await Order.create({
      order_number: order_number,
      store_id: store_id, // Keep as UUID string
      customer_email: session.customer_email || session.customer_details?.email,
      customer_phone: session.customer_details?.phone,
      billing_address: session.customer_details?.address || {},
      shipping_address: session.shipping_details?.address || session.customer_details?.address || {},
      subtotal: subtotal,
      tax_amount: tax_amount,
      shipping_amount: shipping_cost, // Use shipping_amount instead of shipping_cost
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
      coupon_code: coupon_code || null,
      shipping_method: shipping_method_name || null // Use shipping_method instead of shipping_method_name
    }, { transaction });
    
    // Group line items by product and reconstruct order items
    const productMap = new Map();
    
    for (const lineItem of lineItems.data) {
      console.log('🔍 Processing line item:', JSON.stringify(lineItem, null, 2));
      
      const productMetadata = lineItem.price.product.metadata || {};
      const itemType = productMetadata.item_type || 'main_product';
      const productId = productMetadata.product_id;
      
      console.log('📋 Line item details:', {
        productId,
        itemType,
        productName: lineItem.price.product.name,
        metadata: productMetadata,
        hasMetadata: Object.keys(productMetadata).length > 0,
        allMetadataKeys: Object.keys(productMetadata)
      });
      
      if (!productId) {
        console.error('❌ CRITICAL: No product_id found in line item metadata, skipping item');
        console.log('🔍 Metadata debug:', {
          available_keys: Object.keys(productMetadata),
          metadata_values: productMetadata,
          product_name: lineItem.price.product.name,
          price_id: lineItem.price.id
        });
        continue;
      }
      
      if (itemType === 'main_product') {
        // Main product line item
        console.log('Adding main product to map:', productId);
        productMap.set(productId, {
          product_id: productId,
          product_name: lineItem.price.product.name,
          product_sku: productMetadata.sku || '',
          quantity: lineItem.quantity,
          unit_price: lineItem.price.unit_amount / 100,
          base_total: lineItem.amount_total / 100,
          selected_options: []
        });
      } else if (itemType === 'custom_option') {
        // Custom option line item
        console.log('Adding custom option for product:', productId);
        if (productMap.has(productId)) {
          const product = productMap.get(productId);
          product.selected_options.push({
            name: productMetadata.option_name,
            price: lineItem.price.unit_amount / 100,
            total: lineItem.amount_total / 100
          });
        } else {
          console.warn('Custom option found but no main product in map for product_id:', productId);
        }
      }
    }
    
    // Create order items from grouped data
    console.log('🛍️ Creating order items for order:', order.id);
    console.log('📊 Product map has', productMap.size, 'products');
    
    if (productMap.size === 0) {
      console.error('❌ CRITICAL: No products in productMap! No OrderItems will be created!');
      console.log('🔍 Debug info:', {
        lineItemsCount: lineItems.data.length,
        sessionId: session.id,
        metadata: session.metadata,
        storeId: store_id,
        stripeAccountId: store.stripe_account_id
      });
      
      // This is a critical error - we should not commit an order without items
      throw new Error(`No valid products found in checkout session ${session.id}. LineItems: ${lineItems.data.length}, ProductMap: ${productMap.size}`);
    }
    
    for (const [productId, productData] of productMap) {
      // Look up actual product name from database if needed
      let actualProductName = productData.product_name;
      if (!actualProductName || actualProductName === 'Product') {
        try {
          const product = await Product.findByPk(productId);
          if (product) {
            actualProductName = product.name;
            console.log('Retrieved actual product name from database:', actualProductName);
          }
        } catch (productLookupError) {
          console.warn('Could not look up product name for ID:', productId, productLookupError.message);
        }
      }
      
      const optionsTotal = productData.selected_options.reduce((sum, opt) => sum + opt.total, 0);
      const totalPrice = productData.base_total + optionsTotal;
      
      const basePrice = productData.unit_price;
      const optionsPrice = productData.selected_options.reduce((sum, opt) => sum + opt.price, 0);
      const finalPrice = basePrice + optionsPrice;
      
      const orderItemData = {
        order_id: order.id,
        product_id: productData.product_id,
        product_name: actualProductName,
        product_sku: productData.product_sku,
        quantity: productData.quantity,
        unit_price: finalPrice,
        total_price: totalPrice,
        original_price: finalPrice, // Store original price before any discounts
        selected_options: productData.selected_options || [], // Store custom options directly
        product_attributes: {
          // Keep any other product attributes here
        }
      };
      
      console.log('Creating order item:', JSON.stringify(orderItemData, null, 2));
      
      const createdItem = await OrderItem.create(orderItemData, { transaction });
      console.log('Created order item with ID:', createdItem.id);
    }
    
    // Commit the transaction
    await transaction.commit();
    
    console.log(`Order created successfully: ${order.order_number}`);
    return order;
    
  } catch (error) {
    // Rollback the transaction on error
    await transaction.rollback();
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