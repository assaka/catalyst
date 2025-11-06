const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Store, Order, OrderItem, Product, Customer, BlacklistSettings, BlacklistIP, BlacklistEmail, BlacklistCountry } = require('../models');

const router = express.Router();

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Zero-decimal currencies (currencies without decimal places)
// These should NOT be multiplied by 100 for Stripe
const ZERO_DECIMAL_CURRENCIES = [
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW',
  'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF',
  'XOF', 'XPF'
];

/**
 * Convert amount to Stripe format based on currency
 * @param {number} amount - Amount in standard units (e.g., dollars, yen)
 * @param {string} currency - ISO currency code (e.g., 'USD', 'JPY')
 * @returns {number} - Amount in Stripe format (cents for decimal currencies, same for zero-decimal)
 */
function convertToStripeAmount(amount, currency) {
  const currencyUpper = (currency || 'USD').toUpperCase();

  // Zero-decimal currencies: use amount as-is (already in smallest unit)
  if (ZERO_DECIMAL_CURRENCIES.includes(currencyUpper)) {
    return Math.round(amount);
  }

  // Decimal currencies: multiply by 100 to convert to cents
  return Math.round(amount * 100);
}

// @route   GET /api/payments/connect-status
// @desc    Get Stripe Connect status
// @access  Private
router.get('/connect-status', authMiddleware, async (req, res) => {
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

    // Determine if onboarding is complete
    // Onboarding is complete when details are submitted and charges are enabled
    const onboardingComplete = account.details_submitted && account.charges_enabled;

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
      onboardingComplete: onboardingComplete, // Add this field for frontend
      type: account.type
    };

    // Update store if onboarding is complete (for caching/performance)
    if (onboardingComplete && store.settings) {
      try {
        const currentSettings = store.settings || {};
        if (!currentSettings.stripe_onboarding_complete) {
          await store.update({
            settings: {
              ...currentSettings,
              stripe_onboarding_complete: true,
              stripe_onboarding_completed_at: new Date().toISOString()
            }
          });
          console.log('Updated store settings with Stripe onboarding status');
        }
      } catch (updateError) {
        console.error('Could not update store settings:', updateError.message);
        // Don't fail the request if update fails
      }
    }

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
router.post('/connect-account', authMiddleware, async (req, res) => {
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
router.post('/connect-link', authMiddleware, async (req, res) => {
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

// @route   POST /api/payments/create-intent
// @desc    Create Stripe Payment Intent for credit purchases
// @access  Private
router.post('/create-intent', authMiddleware, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  console.log('='.repeat(80));
  console.log(`🟦 [${requestId}] CREATE PAYMENT INTENT REQUEST STARTED`);
  console.log(`🟦 [${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  try {
    // Log environment configuration (without exposing secrets)
    console.log(`🔧 [${requestId}] Environment check:`, {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'MISSING',
      hasPublishableKey: !!(process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY),
      publishableKeyPrefix: (process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY)?.substring(0, 7) + '...' || 'MISSING',
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      nodeEnv: process.env.NODE_ENV
    });

    console.log(`📝 [${requestId}] Request details:`, {
      method: req.method,
      url: req.url,
      headers: {
        contentType: req.headers['content-type'],
        authorization: req.headers.authorization ? 'Bearer ***' : 'MISSING'
      },
      bodyKeys: Object.keys(req.body),
      body: req.body,
      userId: req.user?.id,
      userEmail: req.user?.email
    });

    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    console.log(`🔍 [${requestId}] Validating request data...`);
    console.log(`🔍 [${requestId}] Amount object:`, {
      amount,
      type: typeof amount,
      isObject: typeof amount === 'object',
      hasCredits: amount?.credits,
      hasAmount: amount?.amount
    });

    if (!amount || typeof amount !== 'object' || !amount.credits || !amount.amount) {
      console.error(`❌ [${requestId}] Invalid amount format:`, amount);
      return res.status(400).json({
        success: false,
        error: 'Invalid amount format. Expected { credits, amount }'
      });
    }

    const { credits, amount: amountUsd } = amount;

    // Validate credits and amount
    if (!credits || credits < 1) {
      console.error(`❌ [${requestId}] Invalid credits:`, credits);
      return res.status(400).json({
        success: false,
        error: 'Credits must be at least 1'
      });
    }

    if (!amountUsd || amountUsd < 1) {
      console.error(`❌ [${requestId}] Invalid amount:`, amountUsd);
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least $1'
      });
    }

    console.log(`✅ [${requestId}] Validation passed:`, { credits, amountUsd, currency });

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error(`❌ [${requestId}] Stripe secret key not configured`);
      console.error(`❌ [${requestId}] Available env vars:`, Object.keys(process.env).filter(k => k.includes('STRIPE')));
      return res.status(400).json({
        success: false,
        error: 'Stripe payment is not configured. Please contact support.'
      });
    }

    const userId = req.user.id;
    console.log(`👤 [${requestId}] User authenticated:`, {
      userId,
      email: req.user.email,
      role: req.user.role
    });

    // Get store_id from request (required)
    const storeId = metadata.store_id || req.body.store_id || req.headers['x-store-id'];

    if (!storeId) {
      console.error(`❌ [${requestId}] No store_id provided in request`);
      return res.status(400).json({
        success: false,
        error: 'store_id is required for credit purchase'
      });
    }

    // Verify the store exists and belongs to the user
    console.log(`🔍 [${requestId}] Looking up store:`, storeId);
    const { Store: StoreModel } = require('../models');
    const userStore = await StoreModel.findOne({ where: { id: storeId, user_id: userId } });

    if (!userStore) {
      console.error(`❌ [${requestId}] Store not found or doesn't belong to user:`, { storeId, userId });
      return res.status(403).json({
        success: false,
        error: 'Store not found or you do not have permission to purchase credits for this store'
      });
    }

    console.log(`🏪 [${requestId}] User store verified:`, {
      storeId: userStore.id,
      storeName: userStore.name,
      storeSlug: userStore.slug
    });

    // Create credit transaction record first
    console.log(`💾 [${requestId}] Creating credit transaction record...`);
    const creditService = require('../services/credit-service');

    let transaction;
    try {
      transaction = await creditService.createPurchaseTransaction(
        userId,
        userStore.id,
        amountUsd,
        credits
      );
      console.log(`💳 [${requestId}] Transaction created:`, {
        transactionId: transaction.id,
        status: transaction.status,
        amount: amountUsd,
        credits: credits
      });
    } catch (txError) {
      console.error(`❌ [${requestId}] Failed to create transaction:`, {
        error: txError.message,
        stack: txError.stack
      });
      throw txError;
    }

    // Create Stripe payment intent
    const stripeAmount = convertToStripeAmount(amountUsd, currency);
    console.log(`💰 [${requestId}] Preparing Stripe payment intent:`, {
      originalAmount: amountUsd,
      stripeAmount,
      currency,
      credits,
      description: `Credit purchase: ${credits} credits`
    });

    let paymentIntent;
    try {
      console.log(`🔵 [${requestId}] Calling Stripe API...`);
      paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: currency.toLowerCase(),
        metadata: {
          user_id: userId,
          credits_amount: credits.toString(),
          transaction_id: transaction.id,
          type: 'credit_purchase',
          ...metadata
        },
        description: `Credit purchase: ${credits} credits`
      });

      console.log(`✅ [${requestId}] Stripe payment intent created:`, {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        clientSecretPrefix: paymentIntent.client_secret.substring(0, 20) + '...'
      });
    } catch (stripeError) {
      console.error(`❌ [${requestId}] Stripe API error:`, {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        requestId: stripeError.requestId,
        stack: stripeError.stack
      });
      throw stripeError;
    }

    // Update transaction with payment intent ID
    console.log(`💾 [${requestId}] Updating transaction with payment intent ID...`);
    const CreditTransaction = require('../models/CreditTransaction');
    await CreditTransaction.update(
      { metadata: { ...transaction.metadata, payment_intent_id: paymentIntent.id } },
      { where: { id: transaction.id } }
    );

    const responseData = {
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        transactionId: transaction.id
      }
    };

    const elapsed = Date.now() - startTime;
    console.log(`✅ [${requestId}] SUCCESS - Returning response (${elapsed}ms):`, {
      hasClientSecret: !!responseData.data.clientSecret,
      paymentIntentId: responseData.data.paymentIntentId,
      transactionId: responseData.data.transactionId
    });
    console.log('='.repeat(80));

    res.json(responseData);

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('='.repeat(80));
    console.error(`❌ [${requestId}] CREATE PAYMENT INTENT FAILED (${elapsed}ms)`);
    console.error(`❌ [${requestId}] Error type:`, error.constructor.name);
    console.error(`❌ [${requestId}] Error message:`, error.message);
    console.error(`❌ [${requestId}] Error stack:`, error.stack);
    if (error.response) {
      console.error(`❌ [${requestId}] Error response:`, error.response);
    }
    console.error('='.repeat(80));

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
});

// @route   GET /api/payments/publishable-key
// @desc    Get Stripe publishable key
// @access  Public
router.get('/publishable-key', (req, res) => {
  const requestId = Math.random().toString(36).substring(7);

  console.log('='.repeat(80));
  console.log(`🔑 [${requestId}] GET PUBLISHABLE KEY REQUEST`);
  console.log(`🔑 [${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  try {
    // Log all Stripe-related environment variables (without exposing full keys)
    console.log(`🔍 [${requestId}] Environment Variable Check:`);
    console.log(`🔍 [${requestId}] All env vars starting with STRIPE or VITE_STRIPE:`,
      Object.keys(process.env)
        .filter(key => key.includes('STRIPE'))
        .map(key => ({
          name: key,
          isSet: !!process.env[key],
          prefix: process.env[key] ? process.env[key].substring(0, 10) + '...' : 'NOT SET',
          length: process.env[key] ? process.env[key].length : 0
        }))
    );

    // Support both STRIPE_PUBLISHABLE_KEY and VITE_STRIPE_PUBLISHABLE_KEY for backward compatibility
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;

    console.log(`🔍 [${requestId}] Stripe Configuration Status:`, {
      hasSTRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      hasVITE_STRIPE_PUBLISHABLE_KEY: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
      hasSTRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      hasSTRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      selectedKey: publishableKey ? 'Found' : 'NOT FOUND',
      selectedKeySource: process.env.STRIPE_PUBLISHABLE_KEY ? 'STRIPE_PUBLISHABLE_KEY' :
                        process.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'VITE_STRIPE_PUBLISHABLE_KEY' :
                        'NONE'
    });

    if (publishableKey) {
      console.log(`✅ [${requestId}] Publishable key found:`, {
        source: process.env.STRIPE_PUBLISHABLE_KEY ? 'STRIPE_PUBLISHABLE_KEY' : 'VITE_STRIPE_PUBLISHABLE_KEY',
        prefix: publishableKey.substring(0, 10) + '...',
        length: publishableKey.length,
        startsWithPk: publishableKey.startsWith('pk_'),
        isTestKey: publishableKey.includes('_test_'),
        isLiveKey: publishableKey.includes('_live_')
      });
    } else {
      console.warn(`⚠️ [${requestId}] NO PUBLISHABLE KEY FOUND IN ENVIRONMENT`);
      console.warn(`⚠️ [${requestId}] Checked variables:`, {
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'NOT SET',
        VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'NOT SET'
      });
    }

    const responseData = {
      data: {
        publishableKey: publishableKey || null
      }
    };

    console.log(`✅ [${requestId}] Returning response:`, {
      hasKey: !!publishableKey,
      keyPrefix: publishableKey ? publishableKey.substring(0, 10) + '...' : 'null'
    });
    console.log('='.repeat(80));

    // Return null if not configured (allows graceful degradation on frontend)
    res.json(responseData);
  } catch (error) {
    console.error('='.repeat(80));
    console.error(`🔴 [${requestId}] Get publishable key error:`, {
      message: error.message,
      stack: error.stack
    });
    console.error('='.repeat(80));

    res.status(500).json({
      success: false,
      error: 'Failed to get publishable key'
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
      customer_id, // Add customer_id
      shipping_address,
      shipping_method,
      selected_shipping_method,
      shipping_cost,
      tax_amount,
      payment_fee,
      selected_payment_method,
      selected_payment_method_name,
      discount_amount,
      applied_coupon,
      delivery_date,
      delivery_time_slot,
      delivery_instructions,
      coupon_code
    } = req.body;

    // Debug: Log received data
    console.log('🔍 Stripe checkout request data:', {
      customer_email,
      tax_amount: { value: tax_amount, type: typeof tax_amount, parsed: parseFloat(tax_amount) },
      payment_fee: { value: payment_fee, type: typeof payment_fee, parsed: parseFloat(payment_fee) },
      shipping_cost: { value: shipping_cost, type: typeof shipping_cost },
      selected_payment_method,
      selected_payment_method_name,
      shipping_address,
      items: items?.length || 0
    });

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

    // Get blacklist settings
    const blacklistSettings = await BlacklistSettings.findOne({ where: { store_id } });
    const settings = blacklistSettings || { block_by_ip: false, block_by_email: true, block_by_country: false };

    // Get IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

    // Get country from headers (if provided by reverse proxy like Cloudflare)
    const countryCode = req.headers['cf-ipcountry'] || req.headers['x-country-code'];

    // Check IP blacklist
    if (settings.block_by_ip && ipAddress) {
      const blacklistedIP = await BlacklistIP.findOne({
        where: { store_id, ip_address: ipAddress }
      });

      if (blacklistedIP) {
        const { getTranslation } = require('../utils/translationHelper');
        const language = req.headers['x-language'] || 'en';
        const message = await getTranslation('error.blacklist.ip', language);
        return res.status(403).json({
          success: false,
          message
        });
      }
    }

    // Check email blacklist
    if (settings.block_by_email && customer_email) {
      // Check standalone email blacklist
      const blacklistedEmail = await BlacklistEmail.findOne({
        where: { store_id, email: customer_email.toLowerCase() }
      });

      if (blacklistedEmail) {
        const { getTranslation } = require('../utils/translationHelper');
        const language = req.headers['x-language'] || 'en';
        const message = await getTranslation('error.blacklist.checkout', language);
        return res.status(403).json({
          success: false,
          message
        });
      }

      // Check if customer email is blacklisted (from customers table)
      const blacklistedCustomer = await Customer.findOne({
        where: {
          email: customer_email,
          store_id: store_id,
          is_blacklisted: true
        }
      });

      if (blacklistedCustomer) {
        const { getTranslation } = require('../utils/translationHelper');
        const language = req.headers['x-language'] || 'en';
        const message = await getTranslation('error.blacklist.checkout', language);
        return res.status(403).json({
          success: false,
          message
        });
      }
    }

    // Check country blacklist
    if (settings.block_by_country && countryCode) {
      const blacklistedCountry = await BlacklistCountry.findOne({
        where: { store_id, country_code: countryCode.toUpperCase() }
      });

      if (blacklistedCountry) {
        const { getTranslation } = require('../utils/translationHelper');
        const language = req.headers['x-language'] || 'en';
        const message = await getTranslation('error.blacklist.country', language);
        return res.status(403).json({
          success: false,
          message
        });
      }
    }

    // Get store currency
    const storeCurrency = store.currency || 'usd';
    
    // Calculate amounts and prepare additional charges
    const taxAmountNum = parseFloat(tax_amount) || 0;
    const paymentFeeNum = parseFloat(payment_fee) || 0;
    const shippingCostNum = parseFloat(shipping_cost) || 0;
    
    console.log('💵 Calculated amounts:', {
      tax: taxAmountNum,
      paymentFee: paymentFeeNum,
      shipping: shippingCostNum
    });
    
    // Calculate subtotal for tax percentage
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
      return sum + itemTotal;
    }, 0);

    // Create separate rates for charges (similar to shipping rates)
    let taxRateId = null;

    // Determine Stripe options for Connect account
    const stripeOptions = {};
    if (store.stripe_account_id) {
      stripeOptions.stripeAccount = store.stripe_account_id;
    }

    // Create tax rate if provided
    if (taxAmountNum > 0) {
      try {
        console.log('💰 Creating tax rate:', taxAmountNum, 'cents:', Math.round(taxAmountNum * 100));

        const taxPercentage = subtotal > 0 ? ((taxAmountNum / subtotal) * 100).toFixed(2) : '';
        const taxName = taxPercentage ? `Tax (${taxPercentage}%)` : 'Tax';

        const taxRate = await stripe.taxRates.create({
          display_name: taxName,
          description: 'Sales Tax',
          percentage: parseFloat(taxPercentage) || 0,
          inclusive: false,
          metadata: {
            item_type: 'tax',
            tax_rate: taxPercentage
          }
        }, stripeOptions);
        
        taxRateId = taxRate.id;
        console.log('✅ Created tax rate:', taxRateId);
      } catch (taxError) {
        console.error('Failed to create tax rate:', taxError.message);
        taxRateId = null;
      }
    }

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
      const unit_amount = convertToStripeAmount(basePrice, storeCurrency); // Convert based on currency type
      
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
      const productLineItem = {
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
      };
      
      // Apply tax rate if created
      if (taxRateId) {
        productLineItem.tax_rates = [taxRateId];
      }
      
      line_items.push(productLineItem);
      
      // Add separate line items for each custom option
      if (item.selected_options && item.selected_options.length > 0) {
        item.selected_options.forEach(option => {
          if (option.price && option.price > 0) {
            const optionUnitAmount = convertToStripeAmount(option.price, storeCurrency); // Convert based on currency type
            
            const optionLineItem = {
              price_data: {
                currency: storeCurrency.toLowerCase(),
                product_data: {
                  name: `${option.name}`,
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
            };
            
            // Apply tax rate to options too
            if (taxRateId) {
              optionLineItem.tax_rates = [taxRateId];
            }
            
            line_items.push(optionLineItem);
          }
        });
      }
    });

    // Add payment fee as line item (no direct rate support like shipping)
    if (paymentFeeNum > 0) {
      const paymentFeeStripeAmount = convertToStripeAmount(paymentFeeNum, storeCurrency);
      console.log('💳 Adding payment fee line item:', paymentFeeNum, 'stripe amount:', paymentFeeStripeAmount, 'method:', selected_payment_method, 'name:', selected_payment_method_name);

      // Use the payment method name from frontend (e.g., "Bank Transfer", "Credit Card")
      let paymentMethodName = selected_payment_method_name || selected_payment_method || 'Payment Method';

      line_items.push({
        price_data: {
          currency: storeCurrency.toLowerCase(),
          product_data: {
            name: paymentMethodName,
            metadata: {
              item_type: 'payment_fee',
              payment_method: selected_payment_method || '',
              payment_method_name: selected_payment_method_name || ''
            }
          },
          unit_amount: paymentFeeStripeAmount,
        },
        quantity: 1,
      });
    }

    // Build checkout session configuration
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: success_url || `${process.env.CORS_ORIGIN}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.CORS_ORIGIN}/checkout`,
      metadata: {
        store_id: store_id.toString(),
        customer_id: customer_id || '', // Add customer_id to metadata
        delivery_date: delivery_date || '',
        delivery_time_slot: delivery_time_slot || '',
        delivery_instructions: delivery_instructions || '',
        coupon_code: applied_coupon?.code || coupon_code || '',
        discount_amount: discount_amount?.toString() || '0',
        shipping_method_name: shipping_method?.name || selected_shipping_method || '',
        shipping_method_id: shipping_method?.id?.toString() || '',
        shipping_cost: shipping_cost?.toString() || '0',
        tax_amount: taxAmountNum.toString() || '0',
        payment_fee: paymentFeeNum.toString() || '0',
        payment_method: selected_payment_method || ''
      }
    };

    // Apply discount if provided
    if (applied_coupon && discount_amount > 0) {
      try {
        // Create a Stripe coupon for the discount
        const stripeCoupon = await stripe.coupons.create({
          amount_off: convertToStripeAmount(discount_amount, storeCurrency), // Convert based on currency type
          currency: storeCurrency.toLowerCase(),
          duration: 'once',
          name: `Discount: ${applied_coupon.code}`,
          metadata: {
            original_coupon_code: applied_coupon.code,
            original_coupon_id: applied_coupon.id?.toString() || ''
          }
        }, stripeOptions);

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

    // 3. Set up shipping as the last charge item
    console.log('🚚 Shipping setup - method:', shipping_method?.name, 'cost:', shipping_cost);
    if (shipping_method && shipping_cost !== undefined) {
      // Create a shipping rate for the pre-selected method
      const shippingRateData = {
        type: 'fixed_amount',
        fixed_amount: {
          amount: convertToStripeAmount(shipping_cost || 0, storeCurrency), // Convert based on currency type
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
            unit_amount: convertToStripeAmount(shipping_cost || 0, storeCurrency),
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
          unit_amount: convertToStripeAmount(shipping_cost || 0, storeCurrency),
        },
        quantity: 1,
      });
    }

    // Enable shipping address collection only if we don't have complete shipping data
    if (sessionConfig.shipping_options && (!shipping_address || !shipping_address.street || !shipping_address.city)) {
      // Only enable shipping address collection if we're missing shipping details
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NL', 'DE', 'FR', 'ES', 'IT', 'BE', 'AT', 'CH']
      };
      console.log('🚚 Enabled shipping address collection - missing shipping details');
    } else if (shipping_address && shipping_address.street && shipping_address.city) {
      console.log('🚚 Complete shipping address provided - skipping address collection');
      // We have complete shipping address, so we'll use the customer with prefilled address
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
      
      // For now, just use customer_email instead of creating customer objects
      // This avoids customer ID conflicts between different Stripe accounts
      // Store owners can still see customer emails in their Stripe dashboard
      if (customer_email) {
        sessionConfig.customer_email = customer_email;
        console.log('📧 Using customer_email for checkout:', customer_email);
      }
    }
    
    // Log shipping address collection status
    console.log('🚚 Shipping address collection enabled:', !!sessionConfig.shipping_address_collection);

    // Log the session config for debugging
    console.log('Creating Stripe session with config:', {
      success_url: sessionConfig.success_url,
      cancel_url: sessionConfig.cancel_url,
      customer: sessionConfig.customer,
      customer_email: sessionConfig.customer_email,
      line_items_count: sessionConfig.line_items?.length || 0,
      shipping_options: sessionConfig.shipping_options?.length || 0,
      metadata: sessionConfig.metadata
    });
    
    // Log line items for debugging
    console.log('Line items:', sessionConfig.line_items?.map(item => ({
      name: item.price_data?.product_data?.name,
      amount: item.price_data?.unit_amount,
      quantity: item.quantity,
      type: item.price_data?.product_data?.metadata?.item_type
    })));
    
    // Specifically log tax and fee items
    const taxItems = sessionConfig.line_items?.filter(item => 
      item.price_data?.product_data?.metadata?.item_type === 'tax'
    );
    const feeItems = sessionConfig.line_items?.filter(item => 
      item.price_data?.product_data?.metadata?.item_type === 'payment_fee'
    );
    
    console.log('🔍 Tax line items:', taxItems.length, taxItems.length > 0 ? taxItems[0].price_data?.product_data?.name : 'None');
    console.log('🔍 Fee line items:', feeItems.length, feeItems.length > 0 ? feeItems[0].price_data?.product_data?.name : 'None');

    // Create checkout session (using stripeOptions defined above)
    console.log('💰 Creating Stripe Checkout session...');
    if (store.stripe_account_id) {
      console.log('💰 Using connected account (Direct Charge):', store.stripe_account_id);
    } else {
      console.log('💰 Using platform account (no connected account)');
    }

    const session = await stripe.checkout.sessions.create(sessionConfig, stripeOptions);

    console.log('Created Stripe session:', {
      id: session.id,
      url: session.url,
      success_url: session.success_url
    });

    // Create preliminary order and OrderItems immediately for lazy loading
    console.log('💾 *** LAZY LOADING v7.0 *** Creating preliminary order for immediate availability...');
    try {
      await createPreliminaryOrder(session, {
        items,
        store_id,
        customer_email,
        customer_id, // Pass customer_id
        shipping_address,
        billing_address: shipping_address, // Use shipping as billing if not provided separately
        shipping_method,
        selected_shipping_method,
        shipping_cost,
        tax_amount,
        payment_fee,
        selected_payment_method,
        selected_payment_method_name,
        discount_amount,
        applied_coupon,
        delivery_date,
        delivery_time_slot,
        delivery_instructions,
        store
      });
      console.log('✅ Preliminary order created successfully');
    } catch (preliminaryOrderError) {
      console.error('⚠️ Failed to create preliminary order (will retry in webhook):', preliminaryOrderError.message);
      // Don't fail the checkout if preliminary order fails - webhook will handle it
    }

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
  const webhookId = Math.random().toString(36).substring(7);

  console.log('='.repeat(80));
  console.log(`🔔 [${webhookId}] WEBHOOK RECEIVED`);
  console.log(`🔔 [${webhookId}] Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  console.log(`📋 [${webhookId}] Request details:`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  console.log(`📋 [${webhookId}] Headers:`, {
    allHeaders: Object.keys(req.headers),
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    hasStripeSignature: !!req.headers['stripe-signature']
  });

  console.log(`📋 [${webhookId}] Body info:`, {
    bodyType: typeof req.body,
    isBuffer: Buffer.isBuffer(req.body),
    isObject: typeof req.body === 'object' && !Buffer.isBuffer(req.body),
    bodyLength: req.body ? req.body.length : 'undefined',
    bodySample: req.body ? (Buffer.isBuffer(req.body) ? req.body.toString('utf8', 0, 100) : JSON.stringify(req.body).substring(0, 100)) : 'NONE'
  });

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error(`❌ [${webhookId}] No stripe-signature header found`);
    return res.status(400).send('No stripe-signature header');
  }

  console.log(`✅ [${webhookId}] Stripe signature header present:`, sig.substring(0, 50) + '...');

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error(`❌ [${webhookId}] STRIPE_WEBHOOK_SECRET not configured`);
    console.error(`❌ [${webhookId}] Available Stripe env vars:`, Object.keys(process.env).filter(k => k.includes('STRIPE')));
    return res.status(500).send('Webhook secret not configured');
  }

  console.log(`✅ [${webhookId}] Webhook secret configured:`, {
    prefix: process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10) + '...',
    length: process.env.STRIPE_WEBHOOK_SECRET.length,
    startsWithWhsec: process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')
  });

  let event;

  try {
    console.log(`🔐 [${webhookId}] Attempting to verify webhook signature...`);
    console.log(`🔐 [${webhookId}] Verification inputs:`, {
      bodyType: typeof req.body,
      bodyIsBuffer: Buffer.isBuffer(req.body),
      bodyLength: req.body?.length,
      signaturePresent: !!sig,
      signatureFormat: sig.split(',').map(part => part.split('=')[0]),
      secretPresent: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretFormat: process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ? 'Valid format' : 'Invalid format'
    });

    console.log(`🔐 [${webhookId}] IMPORTANT: Verify this webhook secret matches your Stripe dashboard`);
    console.log(`🔐 [${webhookId}] Secret prefix: ${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 15)}...`);

    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    console.log(`✅ [${webhookId}] Webhook signature verified successfully!`);
    console.log(`✅ [${webhookId}] Event type: ${event.type}`);
    console.log(`✅ [${webhookId}] Event ID: ${event.id}`);
  } catch (err) {
    console.error('='.repeat(80));
    console.error(`❌ [${webhookId}] WEBHOOK SIGNATURE VERIFICATION FAILED`);
    console.error(`❌ [${webhookId}] Error message:`, err.message);
    console.error(`❌ [${webhookId}] Error type:`, err.type);
    console.error(`❌ [${webhookId}] Error code:`, err.code);
    console.error(`❌ [${webhookId}] Signature provided:`, sig.substring(0, 100) + '...');
    console.error(`❌ [${webhookId}] Body type:`, typeof req.body);
    console.error(`❌ [${webhookId}] Body is Buffer:`, Buffer.isBuffer(req.body));
    console.error(`❌ [${webhookId}] Body is Object:`, typeof req.body === 'object' && !Buffer.isBuffer(req.body));

    if (Buffer.isBuffer(req.body)) {
      console.error(`❌ [${webhookId}] Body length:`, req.body.length);
      console.error(`❌ [${webhookId}] Body sample (first 200 chars):`, req.body.toString('utf8', 0, 200));
    } else if (typeof req.body === 'object') {
      console.error(`❌ [${webhookId}] Body is already parsed as object (THIS IS THE PROBLEM!)`);
      console.error(`❌ [${webhookId}] Body keys:`, Object.keys(req.body));
      console.error(`❌ [${webhookId}] This means express.json() middleware ran before express.raw()`);
    } else {
      console.error(`❌ [${webhookId}] Body sample:`, String(req.body).substring(0, 200));
    }

    console.error('='.repeat(80));
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
        // Check if preliminary order already exists
        const existingOrder = await Order.findOne({
          where: { payment_reference: session.id }
        });

        let finalOrder = null;
        let statusAlreadyUpdated = false; // Track if email was already sent

        if (existingOrder) {
          console.log('✅ Found existing preliminary order:', existingOrder.id, existingOrder.order_number);
          console.log('🔍 Current order status:', existingOrder.status, 'payment_status:', existingOrder.payment_status);

          // Check if this is an online payment that needs to be updated to paid
          const isOnlinePayment = existingOrder.status === 'pending' && existingOrder.payment_status === 'pending';

          if (isOnlinePayment) {
            console.log('🔄 Online payment confirmed - updating order status to paid/processing...');
            // Update the existing preliminary order to mark as paid and processing
            await existingOrder.update({
              status: 'processing',
              payment_status: 'paid',
              updatedAt: new Date()
            });
            statusAlreadyUpdated = false; // Send email since this is first confirmation
          } else {
            console.log('✅ Order status already correct (offline payment or already updated)');
            statusAlreadyUpdated = true; // Don't send email again
          }

          // Verify order items exist
          const itemCount = await OrderItem.count({ where: { order_id: existingOrder.id } });
          console.log('✅ Verified:', itemCount, 'OrderItems already exist for order', existingOrder.id);

          if (itemCount === 0) {
            console.error('⚠️ WARNING: Preliminary order exists but no OrderItems found! Creating them now...');
            // Fallback: create order items from session if they don't exist
            await createOrderFromCheckoutSession(session);
          }

          finalOrder = existingOrder;
        } else {
          console.log('⚠️ No preliminary order found, creating new order from session...');
          // Fallback: create order from checkout session (original behavior)
          const order = await createOrderFromCheckoutSession(session);
          console.log('Order created successfully with ID:', order.id, 'Order Number:', order.order_number);

          // Verify order items were created
          const itemCount = await OrderItem.count({ where: { order_id: order.id } });
          console.log('✅ Verified:', itemCount, 'OrderItems created for order', order.id);

          if (itemCount === 0) {
            console.error('⚠️ WARNING: Order created but no OrderItems found!');
          }

          finalOrder = order;
        }

        // Send order success email (only if status was not already updated by preliminary order)
        // If statusAlreadyUpdated is true, email was already sent during preliminary order creation
        if (finalOrder && finalOrder.customer_email) {
          if (statusAlreadyUpdated) {
            console.log('✅ Order success email already sent during preliminary order creation, skipping duplicate');
          } else {
            try {
              console.log('📧 Sending order success email to:', finalOrder.customer_email);

            const emailService = require('../services/email-service');
            const { Customer } = require('../models');

            // Get order with full details for email
            const orderWithDetails = await Order.findByPk(finalOrder.id, {
              include: [{
                model: OrderItem,
                as: 'OrderItems',
                include: [{
                  model: Product,
                  attributes: ['id', 'sku']
                }]
              }, {
                model: Store,
                as: 'Store'
              }]
            });

            // Try to get customer details
            let customer = null;
            if (finalOrder.customer_id) {
              customer = await Customer.findByPk(finalOrder.customer_id);
            }

            // Extract customer name from shipping/billing address if customer not found
            const customerName = customer
              ? `${customer.first_name} ${customer.last_name}`
              : (finalOrder.shipping_address?.full_name || finalOrder.shipping_address?.name || finalOrder.billing_address?.full_name || finalOrder.billing_address?.name || 'Customer');

            const [firstName, ...lastNameParts] = customerName.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            // Send order success email asynchronously
            emailService.sendTransactionalEmail(finalOrder.store_id, 'order_success_email', {
              recipientEmail: finalOrder.customer_email,
              customer: customer || {
                first_name: firstName,
                last_name: lastName,
                email: finalOrder.customer_email
              },
              order: orderWithDetails.toJSON(),
              store: orderWithDetails.Store.toJSON(),
              languageCode: 'en'
            }).then(() => {
              console.log(`✅ Order success email sent successfully to: ${finalOrder.customer_email}`);
            }).catch(emailError => {
              console.error(`❌ Failed to send order success email:`, emailError.message);
              // Don't fail the webhook if email fails
            });

            // Check if auto-invoice is enabled in sales settings
            const store = orderWithDetails.Store;
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
                await emailService.sendTransactionalEmail(finalOrder.store_id, 'invoice_email', {
                  recipientEmail: finalOrder.customer_email,
                  customer: customer || {
                    first_name: firstName,
                    last_name: lastName,
                    email: finalOrder.customer_email
                  },
                  order: orderWithDetails.toJSON(),
                  store: orderWithDetails.Store,
                  attachments: attachments
                });

                console.log('✅ Invoice email sent successfully');

                // Create invoice record to track that invoice was sent
                try {
                  const { Invoice } = require('../models');
                  // Generate invoice number
                  const invoiceNumber = 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

                  await Invoice.create({
                    invoice_number: invoiceNumber,
                    order_id: finalOrder.id,
                    store_id: finalOrder.store_id,
                    customer_email: finalOrder.customer_email,
                    pdf_generated: salesSettings.auto_invoice_pdf_enabled || false,
                    email_status: 'sent'
                  });
                  console.log('✅ Invoice record created');

                  // Check if auto-ship is enabled and trigger shipment
                  if (salesSettings.auto_ship_enabled) {
                    console.log('📦 Auto-ship enabled, sending shipment notification...');
                    try {
                      const { Shipment } = require('../models');

                      // Generate shipment PDF if enabled
                      let shipmentAttachments = [];
                      if (salesSettings.auto_invoice_pdf_enabled) { // Reuse PDF setting for shipment
                        console.log('📄 Generating PDF shipment notice...');
                        const pdfService = require('../services/pdf-service');

                        const shipmentPdf = await pdfService.generateShipmentPDF(
                          orderWithDetails,
                          orderWithDetails.Store,
                          orderWithDetails.OrderItems
                        );

                        shipmentAttachments = [{
                          filename: pdfService.getShipmentFilename(orderWithDetails),
                          content: shipmentPdf.toString('base64'),
                          contentType: 'application/pdf'
                        }];

                        console.log('✅ PDF shipment notice generated successfully');
                      }

                      // Send shipment notification email
                      await emailService.sendTransactionalEmail(finalOrder.store_id, 'shipment_email', {
                        recipientEmail: finalOrder.customer_email,
                        customer: customer || {
                          first_name: firstName,
                          last_name: lastName,
                          email: finalOrder.customer_email
                        },
                        order: orderWithDetails.toJSON(),
                        store: orderWithDetails.Store,
                        tracking_number: finalOrder.tracking_number || 'Will be provided soon',
                        tracking_url: finalOrder.tracking_url || '',
                        carrier: 'Standard',
                        shipping_method: finalOrder.shipping_method || 'Standard Shipping',
                        estimated_delivery_date: 'To be confirmed',
                        attachments: shipmentAttachments
                      });

                      console.log('✅ Shipment email sent successfully');

                      // Create shipment record
                      const shipmentNumber = 'SHIP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

                      await Shipment.create({
                        shipment_number: shipmentNumber,
                        order_id: finalOrder.id,
                        store_id: finalOrder.store_id,
                        customer_email: finalOrder.customer_email,
                        tracking_number: finalOrder.tracking_number,
                        tracking_url: finalOrder.tracking_url,
                        carrier: 'Standard',
                        shipping_method: finalOrder.shipping_method,
                        email_status: 'sent'
                      });

                      // Update order status to shipped
                      await orderWithDetails.update({
                        status: 'shipped',
                        fulfillment_status: 'shipped',
                        shipped_at: new Date()
                      });

                      console.log('✅ Shipment record created and order marked as shipped');
                    } catch (shipmentError) {
                      console.error('❌ Failed to send shipment notification:', shipmentError);
                      // Don't fail if shipment notification fails
                    }
                  }
                } catch (invoiceCreateError) {
                  console.error('❌ Failed to create invoice record:', invoiceCreateError);
                  // Don't fail if invoice record creation fails
                }
              } catch (invoiceError) {
                console.error('❌ Failed to send invoice email:', invoiceError);
                // Don't fail the webhook if invoice email fails
              }
            }
            } catch (emailError) {
              console.error(`❌ Error preparing order success email:`, emailError.message);
              // Don't fail the webhook if email fails
            }
          }
        } else {
          console.log('⚠️ Skipping order success email - no customer email found');
        }

      } catch (error) {
        console.error('Error processing order from checkout session:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          code: error.code,
          sql: error.sql
        });
        return res.status(500).json({ error: 'Failed to process order' });
      }
      
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const piRequestId = Math.random().toString(36).substring(7);

      console.log('='.repeat(80));
      console.log(`💳 [${piRequestId}] PAYMENT INTENT SUCCEEDED`);
      console.log(`💳 [${piRequestId}] Payment Intent ID: ${paymentIntent.id}`);
      console.log(`💳 [${piRequestId}] Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
      console.log(`💳 [${piRequestId}] Status: ${paymentIntent.status}`);
      console.log('='.repeat(80));

      console.log(`🔍 [${piRequestId}] Payment Intent Metadata:`, {
        metadata: paymentIntent.metadata,
        hasType: !!paymentIntent.metadata?.type,
        type: paymentIntent.metadata?.type,
        hasTransactionId: !!paymentIntent.metadata?.transaction_id,
        transactionId: paymentIntent.metadata?.transaction_id,
        userId: paymentIntent.metadata?.user_id,
        creditsAmount: paymentIntent.metadata?.credits_amount
      });

      // Check if this is a credit purchase
      if (paymentIntent.metadata?.type === 'credit_purchase' && paymentIntent.metadata?.transaction_id) {
        console.log(`✅ [${piRequestId}] This is a CREDIT PURCHASE - processing...`);
        console.log(`📋 [${piRequestId}] Transaction ID: ${paymentIntent.metadata.transaction_id}`);
        console.log(`👤 [${piRequestId}] User ID: ${paymentIntent.metadata.user_id}`);
        console.log(`💰 [${piRequestId}] Credits: ${paymentIntent.metadata.credits_amount}`);

        try {
          console.log(`🔄 [${piRequestId}] Calling creditService.completePurchaseTransaction...`);

          const creditService = require('../services/credit-service');
          const result = await creditService.completePurchaseTransaction(
            paymentIntent.metadata.transaction_id,
            paymentIntent.id
          );

          console.log(`✅ [${piRequestId}] Credit purchase COMPLETED successfully!`);
          console.log(`✅ [${piRequestId}] Transaction result:`, {
            id: result.id,
            status: result.status,
            credits_purchased: result.credits_purchased,
            user_id: result.user_id
          });

          // Verify user credits were updated
          let finalUserBalance = null;
          try {
            const { sequelize } = require('../database/connection');
            const [user] = await sequelize.query(`
              SELECT id, email, credits FROM users WHERE id = $1
            `, {
              bind: [paymentIntent.metadata.user_id],
              type: sequelize.QueryTypes.SELECT
            });

            finalUserBalance = user?.credits;

            console.log(`✅ [${piRequestId}] User balance after purchase:`, {
              userId: user?.id,
              email: user?.email,
              credits: user?.credits
            });
          } catch (verifyError) {
            console.warn(`⚠️ [${piRequestId}] Could not verify user balance:`, verifyError.message);
          }

          // Send credit purchase confirmation email
          try {
            console.log(`📧 [${piRequestId}] Sending credit purchase confirmation email...`);

            const { User: UserModel, Store: StoreModel } = require('../models');
            const emailService = require('../services/email-service');

            const user = await UserModel.findByPk(result.user_id);
            const store = await StoreModel.findByPk(result.store_id);

            if (user && store) {
              console.log(`📧 [${piRequestId}] Email recipients:`, {
                userEmail: user.email,
                storeName: store.name
              });

              // Send email asynchronously (don't block webhook response)
              emailService.sendTransactionalEmail(result.store_id, 'credit_purchase_email', {
                recipientEmail: user.email,
                customer: {
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email
                },
                transaction: {
                  id: result.id,
                  credits_purchased: result.credits_purchased,
                  amount_usd: result.amount_usd,
                  created_at: result.created_at || new Date(),
                  balance: finalUserBalance || user.credits || 0,
                  metadata: result.metadata || {}
                },
                store: {
                  name: store.name,
                  domain: store.custom_domain || `https://yourdomain.com/public/${store.slug}`
                },
                languageCode: 'en'
              }).then(() => {
                console.log(`✅ [${piRequestId}] Credit purchase email sent successfully to: ${user.email}`);
              }).catch(emailError => {
                console.error(`❌ [${piRequestId}] Failed to send credit purchase email:`, emailError.message);
                console.error(`❌ [${piRequestId}] Email error details:`, emailError);
                // Don't fail the webhook if email fails
              });
            } else {
              console.warn(`⚠️ [${piRequestId}] Cannot send email - user or store not found:`, {
                hasUser: !!user,
                hasStore: !!store
              });
            }
          } catch (emailError) {
            console.error(`❌ [${piRequestId}] Error preparing credit purchase email:`, emailError.message);
            // Don't fail the webhook if email fails
          }

          console.log('='.repeat(80));
        } catch (error) {
          console.error('='.repeat(80));
          console.error(`❌ [${piRequestId}] FAILED to complete credit purchase`);
          console.error(`❌ [${piRequestId}] Error:`, {
            message: error.message,
            stack: error.stack,
            transactionId: paymentIntent.metadata.transaction_id
          });
          console.error('='.repeat(80));
          return res.status(500).json({ error: 'Failed to complete credit purchase' });
        }
      } else {
        console.log(`ℹ️ [${piRequestId}] Not a credit purchase - payment intent succeeded but no action needed`);
        console.log(`ℹ️ [${piRequestId}] Metadata type: ${paymentIntent.metadata?.type || 'NONE'}`);
        console.log(`ℹ️ [${piRequestId}] Transaction ID: ${paymentIntent.metadata?.transaction_id || 'NONE'}`);
        console.log('='.repeat(80));
      }
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

// Helper function to create preliminary order immediately after checkout session creation
async function createPreliminaryOrder(session, orderData) {
  const {
    items,
    store_id,
    customer_email,
    customer_id,
    shipping_address,
    billing_address,
    shipping_method,
    selected_shipping_method,
    shipping_cost,
    tax_amount,
    payment_fee,
    selected_payment_method,
    selected_payment_method_name,
    discount_amount,
    applied_coupon,
    delivery_date,
    delivery_time_slot,
    delivery_instructions,
    store
  } = orderData;

  console.log('💾 Creating preliminary order with session ID:', session.id);
  console.log('🔍 Received customer_id:', customer_id);
  console.log('🔍 Received shipping_address:', JSON.stringify(shipping_address, null, 2));
  console.log('🔍 Received billing_address:', JSON.stringify(billing_address, null, 2));

  // Lookup payment method to check payment_flow (online vs offline)
  let paymentFlow = 'online'; // default to online for Stripe
  let paymentMethodRecord = null;
  if (selected_payment_method) {
    try {
      const PaymentMethod = require('../models/PaymentMethod');
      paymentMethodRecord = await PaymentMethod.findOne({
        where: { code: selected_payment_method, store_id: store_id }
      });
      if (paymentMethodRecord) {
        paymentFlow = paymentMethodRecord.payment_flow || 'online';
        console.log(`🔍 Payment method "${selected_payment_method}" has flow: ${paymentFlow}`);
      }
    } catch (error) {
      console.warn('⚠️ Could not lookup payment method, defaulting to online flow:', error.message);
    }
  } else {
    console.log('🔍 No payment method specified, defaulting to online flow for Stripe');
  }

  // Validate customer_id BEFORE starting transaction - ensure it exists AND matches the email
  let validatedCustomerId = null;
  if (customer_id) {
    try {
      const { Customer } = require('../models');
      console.log('🔍 Looking up customer_id in database:', customer_id);
      console.log('🔍 Order email:', customer_email);
      const customerExists = await Customer.findByPk(customer_id);
      console.log('🔍 Customer lookup result:', customerExists ? 'Found' : 'Not found');
      console.log('🔍 Customer details:', customerExists ? { id: customerExists.id, email: customerExists.email } : 'None');

      if (customerExists) {
        // IMPORTANT: Verify that the customer email matches the order email
        if (customerExists.email === customer_email) {
          validatedCustomerId = customer_id;
          console.log('✅ Validated customer_id and email match:', customer_id);
        } else {
          console.log('⚠️ Customer ID exists but email does not match! Customer email:', customerExists.email, 'Order email:', customer_email);
          console.log('⚠️ This is a data integrity issue - treating as guest checkout to prevent wrong customer assignment');
          validatedCustomerId = null;
        }
      } else {
        console.log('⚠️ Customer ID provided but not found in database, treating as guest checkout:', customer_id);
        validatedCustomerId = null; // Explicitly set to null
      }
    } catch (error) {
      console.log('⚠️ Error validating customer_id, treating as guest checkout:', error.message);
      console.log('⚠️ Error stack:', error.stack);
      validatedCustomerId = null; // Explicitly set to null on error
    }
  } else {
    console.log('ℹ️ No customer_id provided, creating guest order');
  }

  console.log('🔍 Final validatedCustomerId to be used:', validatedCustomerId);

  const { sequelize } = require('../database/connection');
  const transaction = await sequelize.transaction();

  try {

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const basePrice = parseFloat(item.price || 0);
      const optionsPrice = (item.selected_options || []).reduce((optSum, opt) => optSum + parseFloat(opt.price || 0), 0);
      return sum + ((basePrice + optionsPrice) * (item.quantity || 1));
    }, 0);

    const taxAmountNum = parseFloat(tax_amount) || 0;
    const shippingCostNum = parseFloat(shipping_cost) || 0;
    const paymentFeeNum = parseFloat(payment_fee) || 0;
    const discountAmountNum = parseFloat(discount_amount) || 0;
    const totalAmount = subtotal + taxAmountNum + shippingCostNum + paymentFeeNum - discountAmountNum;

    // Generate order number
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const order_number = `ORD-${timestamp}-${randomStr}`;

    console.log('💾 Generated order_number:', order_number);

    // Ensure addresses are objects and not null/undefined
    const finalShippingAddress = shipping_address && typeof shipping_address === 'object' ? shipping_address : {};
    const finalBillingAddress = billing_address && typeof billing_address === 'object' ? billing_address : (shipping_address && typeof shipping_address === 'object' ? shipping_address : {});

    console.log('💾 Final shipping address for order:', JSON.stringify(finalShippingAddress, null, 2));
    console.log('💾 Final billing address for order:', JSON.stringify(finalBillingAddress, null, 2));

    // Determine order status based on payment_flow
    // Online payments (Stripe, PayPal): pending until webhook confirms
    // Offline payments (Bank Transfer, COD): immediately confirmed
    const orderStatus = paymentFlow === 'offline' ? 'processing' : 'pending';
    const paymentStatus = paymentFlow === 'offline' ? 'paid' : 'pending';

    console.log(`💾 Order status will be: ${orderStatus}, payment status: ${paymentStatus} (payment flow: ${paymentFlow})`);

    // Create the preliminary order
    const order = await Order.create({
      order_number: order_number,
      status: orderStatus,
      payment_status: paymentStatus,
      fulfillment_status: 'pending',
      customer_email,
      customer_id: validatedCustomerId, // Only set if customer exists in database
      billing_address: finalBillingAddress,
      shipping_address: finalShippingAddress,
      subtotal: subtotal.toFixed(2),
      tax_amount: taxAmountNum.toFixed(2),
      shipping_amount: shippingCostNum.toFixed(2),
      discount_amount: discountAmountNum.toFixed(2),
      payment_fee_amount: paymentFeeNum.toFixed(2),
      total_amount: totalAmount.toFixed(2),
      currency: store.currency || 'USD',
      delivery_date: delivery_date ? new Date(delivery_date) : null,
      delivery_time_slot,
      delivery_instructions,
      payment_method: 'stripe',
      payment_reference: session.id, // Use session ID as payment reference
      shipping_method: selected_shipping_method,
      coupon_code: applied_coupon?.code || null,
      store_id
    }, { transaction });

    console.log('💾 Preliminary order created:', order.id, order.order_number);

    // Create OrderItems
    for (const item of items) {
      const basePrice = parseFloat(item.price || 0);
      const optionsPrice = (item.selected_options || []).reduce((sum, opt) => sum + parseFloat(opt.price || 0), 0);
      const unitPrice = basePrice + optionsPrice;
      const totalPrice = unitPrice * (item.quantity || 1);

      const orderItemData = {
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name || item.name || 'Product',
        product_sku: item.sku || '',
        quantity: item.quantity || 1,
        unit_price: unitPrice.toFixed(2),
        total_price: totalPrice.toFixed(2),
        original_price: unitPrice.toFixed(2),
        selected_options: item.selected_options || [],
        product_attributes: {}
      };

      console.log('💾 Creating preliminary OrderItem:', orderItemData.product_name);
      await OrderItem.create(orderItemData, { transaction });
    }

    await transaction.commit();
    console.log('✅ Preliminary order and items created successfully');

    // Send order success email immediately ONLY for offline payments
    // For online payments, webhook will send the email after payment confirmation
    if (order && order.customer_email && paymentFlow === 'offline') {
      try {
        console.log('📧 Sending order success email to:', order.customer_email);

        const emailService = require('../services/email-service');
        const { Customer } = require('../models');

        // Get order with full details for email
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
            as: 'Store'
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

        // Send order success email asynchronously for offline payments only
        emailService.sendTransactionalEmail(order.store_id, 'order_success_email', {
          recipientEmail: order.customer_email,
          customer: customer || {
            first_name: firstName,
            last_name: lastName,
            email: order.customer_email
          },
          order: orderWithDetails.toJSON(),
          store: orderWithDetails.Store.toJSON(),
          languageCode: 'en'
        }).then(() => {
          console.log(`✅ Order success email sent successfully to: ${order.customer_email} (offline payment)`);
        }).catch(emailError => {
          console.error(`❌ Failed to send order success email:`, emailError.message);
          // Don't fail the order creation if email fails
        });
      } catch (emailError) {
        console.error(`❌ Error preparing order success email:`, emailError.message);
        // Don't fail the order creation if email fails
      }
    } else if (order && order.customer_email && paymentFlow === 'online') {
      console.log(`📧 Skipping email for online payment - will be sent after webhook confirmation`);
    }

    return order;

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating preliminary order:', error);
    throw error;
  }
}

// Helper function to create order from Stripe checkout session
async function createOrderFromCheckoutSession(session) {
  const { sequelize } = require('../database/connection');
  const transaction = await sequelize.transaction();
  
  try {
    const { store_id, delivery_date, delivery_time_slot, delivery_instructions, coupon_code, shipping_method_name, shipping_method_id, payment_fee, payment_method, tax_amount } = session.metadata || {};
    
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
    const sessionStripeOptions = {};
    if (store.stripe_account_id) {
      sessionStripeOptions.stripeAccount = store.stripe_account_id;
      console.log('Using Connect account for session retrieval:', store.stripe_account_id);
    }
    
    // Get line items from the session with correct account context
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    }, sessionStripeOptions);
    
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
    // Use tax from metadata if available, otherwise from Stripe's total_details
    const tax_amount_calculated = (session.total_details?.amount_tax || 0) / 100;
    const tax_amount_from_metadata = parseFloat(tax_amount) || 0;
    const final_tax_amount = tax_amount_from_metadata || tax_amount_calculated;
    
    let shipping_cost = (session.total_details?.amount_shipping || 0) / 100;
    const payment_fee_amount = parseFloat(payment_fee) || 0;
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

    // Validate customer_id from metadata if provided - must exist AND match email
    let validatedCustomerId = null;
    const metadataCustomerId = session.metadata?.customer_id;
    const sessionEmail = session.customer_email || session.customer_details?.email;

    if (metadataCustomerId) {
      try {
        const { Customer } = require('../models');
        const customerExists = await Customer.findByPk(metadataCustomerId);
        console.log('🔍 Customer lookup result from metadata:', customerExists ? 'Found' : 'Not found');
        console.log('🔍 Session email:', sessionEmail);
        console.log('🔍 Customer email:', customerExists?.email);

        if (customerExists) {
          // IMPORTANT: Verify email match to prevent wrong customer assignment
          if (customerExists.email === sessionEmail) {
            validatedCustomerId = metadataCustomerId;
            console.log('✅ Validated customer_id from metadata and email match:', metadataCustomerId);
          } else {
            console.log('⚠️ Customer ID exists but email mismatch! Customer email:', customerExists.email, 'Session email:', sessionEmail);
            console.log('⚠️ Treating as guest checkout to prevent wrong customer assignment');
            validatedCustomerId = null;
          }
        } else {
          console.log('⚠️ Customer ID in metadata not found in database, treating as guest checkout:', metadataCustomerId);
        }
      } catch (error) {
        console.log('⚠️ Error validating customer_id from metadata, treating as guest checkout:', error.message);
      }
    }

    // Prepare shipping address with name included
    const shippingAddress = session.shipping_details?.address || session.customer_details?.address || {};
    if (shippingAddress && Object.keys(shippingAddress).length > 0) {
      // Add name to address object from shipping_details or customer_details
      const shippingName = session.shipping_details?.name || session.customer_details?.name || '';
      if (shippingName) {
        shippingAddress.full_name = shippingName;
        shippingAddress.name = shippingName; // Add both for compatibility
      }
    }

    // Prepare billing address with name included
    const billingAddress = session.customer_details?.address || {};
    if (billingAddress && Object.keys(billingAddress).length > 0) {
      const billingName = session.customer_details?.name || '';
      if (billingName) {
        billingAddress.full_name = billingName;
        billingAddress.name = billingName; // Add both for compatibility
      }
    }

    // Create the order within transaction
    const order = await Order.create({
      order_number: order_number,
      store_id: store_id, // Keep as UUID string
      customer_email: session.customer_email || session.customer_details?.email,
      customer_id: validatedCustomerId, // Only set if customer exists in database
      customer_phone: session.customer_details?.phone,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      subtotal: subtotal,
      tax_amount: final_tax_amount,
      shipping_amount: shipping_cost, // Use shipping_amount instead of shipping_cost
      discount_amount: (session.total_details?.amount_discount || 0) / 100,
      payment_fee_amount: payment_fee_amount,
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