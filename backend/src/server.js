const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
require('dotenv').config();

const { sequelize } = require('./database/connection');
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import all models to ensure associations are loaded
const models = require('./models');

// Import and start automatic migrations
require('./database/auto-migrations');

// Import services  
const extensionService = require('./services/extension-service');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');
const configurableProductRoutes = require('./routes/configurable-products');
const categoryRoutes = require('./routes/categories');
const publicProductRoutes = require('./routes/publicProducts');
const publicCategoryRoutes = require('./routes/publicCategories');
const publicShippingRoutes = require('./routes/publicShipping');
const publicDeliveryRoutes = require('./routes/publicDelivery');
const publicPaymentMethodRoutes = require('./routes/publicPaymentMethods');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const attributeRoutes = require('./routes/attributes');
const cmsRoutes = require('./routes/cms');
const cmsBlockRoutes = require('./routes/cms-blocks');
const shippingRoutes = require('./routes/shipping');
const taxRoutes = require('./routes/tax');
const deliveryRoutes = require('./routes/delivery');
const customerRoutes = require('./routes/customers');
const blacklistRoutes = require('./routes/blacklist');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const languageRoutes = require('./routes/languages');
const translationRoutes = require('./routes/translations');
const aiStudioRoutes = require('./routes/ai-studio');
const aiPluginAssistantRoutes = require('./routes/ai-plugin-assistant');
const aiRoutes = require('./routes/ai'); // Centralized AI service
const migrationsRoutes = require('./routes/migrations');
// const diagnosticRoutes = require('./routes/diagnostic'); // Temporarily disabled
const customerActivityRoutes = require('./routes/customer-activity');
const abTestingRoutes = require('./routes/ab-testing');
const analyticsRoutes = require('./routes/analytics');
const analyticsDashboardRoutes = require('./routes/analytics-dashboard');
const gdprRoutes = require('./routes/gdpr');
const customAnalyticsEventsRoutes = require('./routes/custom-analytics-events');
const seoSettingsRoutes = require('./routes/seo-settings');
const seoTemplateRoutes = require('./routes/seo-templates');
const redirectRoutes = require('./routes/redirects');
const canonicalUrlRoutes = require('./routes/canonical-urls');
const attributeSetRoutes = require('./routes/attribute-sets');
const productLabelRoutes = require('./routes/product-labels');
const productTabRoutes = require('./routes/product-tabs');
const paymentRoutes = require('./routes/payments');
const paymentMethodRoutes = require('./routes/payment-methods');
const cookieConsentRoutes = require('./routes/cookie-consent-settings');
const consentLogRoutes = require('./routes/consent-logs');
const customOptionRuleRoutes = require('./routes/custom-option-rules');

// Public route modules (lightweight, no auth)
const storefrontBootstrapRoutes = require('./routes/storefront-bootstrap');
const publicProductTabRoutes = require('./routes/publicProductTabs');
const publicProductLabelRoutes = require('./routes/publicProductLabels');
const publicAttributeRoutes = require('./routes/publicAttributes');
const addressRoutes = require('./routes/addresses');
const publicCmsBlocksRoutes = require('./routes/public-cms-blocks');
const publicCmsPagesRoutes = require('./routes/public-cms-pages');
const storeTeamRoutes = require('./routes/store-teams');
const robotsRoutes = require('./routes/robots');
const sitemapRoutes = require('./routes/sitemap');
const integrationRoutes = require('./routes/integrations');
const supabaseRoutes = require('./routes/supabase');
const supabaseSetupRoutes = require('./routes/supabase-setup');
const shopifyRoutes = require('./routes/shopify');
const imageRoutes = require('./routes/images');
const cloudflareOAuthRoutes = require('./routes/cloudflare-oauth');
const domainSettingsRoutes = require('./routes/domain-settings');
const pluginRoutes = require('./routes/plugins');
const storePluginRoutes = require('./routes/store-plugins');
const pluginCreationRoutes = require('./routes/plugin-creation');
const storageRoutes = require('./routes/storage');
const productImageRoutes = require('./routes/product-images');
const categoryImageRoutes = require('./routes/category-images');
const fileManagerRoutes = require('./routes/file-manager');
const sourceFilesRoutes = require('./routes/source-files');
const storeProvisioningRoutes = require('./routes/store-provisioning');
const domainsRoutes = require('./routes/domains');
const storeDatabaseRoutes = require('./routes/store-database');
const storeMediaStorageRoutes = require('./routes/store-mediastorage');
const heatmapRoutes = require('./routes/heatmap');
const backgroundJobRoutes = require('./routes/background-jobs');
const cronJobRoutes = require('./routes/cron-jobs');
const extensionsRoutes = require('./routes/extensions');
const previewRoutes = require('./routes/preview');
const slotConfigurationRoutes = require('./routes/slotConfigurations');
const dynamicPluginRoutes = require('./routes/dynamic-plugins');
const adminNavigationRoutes = require('./routes/admin-navigation');
const pluginApiRoutes = require('./routes/plugin-api');
const pluginVersionApiRoutes = require('./routes/plugin-version-api');
const pluginAIRoutes = require('./routes/pluginAIRoutes');
const chatApiRoutes = require('./routes/chat-api');
const databaseProvisioningRoutes = require('./routes/database-provisioning');
const customDomainsRoutes = require('./routes/custom-domains');
const creditRoutes = require('./routes/credits');
const serviceCreditCostsRoutes = require('./routes/service-credit-costs');
const emailTemplatesRoutes = require('./routes/email-templates');
const pdfTemplatesRoutes = require('./routes/pdf-templates');
const brevoOAuthRoutes = require('./routes/brevo-oauth');

// Import usage tracking middleware
const {
  trackApiCall,
  trackApiError,
  checkUsageLimits
} = require('./middleware/usageTracking');

// Import subscription enforcement middleware
const {
  requireActiveSubscription,
  enforceReadOnly,
  checkResourceLimit,
  warnApproachingLimits
} = require('./middleware/subscriptionEnforcement');

const app = express();

// Trust proxy for Render.com
app.set('trust proxy', 1);

// Security middleware with exceptions for preview route
app.use((req, res, next) => {
  // Skip helmet for preview routes to allow iframe embedding
  if (req.path.startsWith('/preview/') || req.path.startsWith('/api/preview/')) {
    // Force override CSP headers for preview routes
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', 'frame-ancestors *; frame-src *; child-src *; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' *; style-src \'self\' \'unsafe-inline\' *; default-src *;');
    return next();
  }
  helmet()(req, res, next);
});
app.use(compression());

// Request timing and query count tracking
const { timingMiddleware } = require('./middleware/timingMiddleware');
app.use(timingMiddleware);

// Rate limiting - increased limits for development
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000, // Increased from 100 to 1000
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://catalyst-pearl.vercel.app',
  'https://catalyst-ecommerce.vercel.app',
  'https://catalyst-683t6upsk-hamids-projects-1928df2f.vercel.app',
  'https://catalyst-backend-fzhu.onrender.com', // Allow backend for preview pages
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: async function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check for exact match first
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Simple and permissive checks
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercelApp = origin.endsWith('.vercel.app');
    const isRenderApp = origin.endsWith('.onrender.com');

    if (isLocalhost || isVercelApp || isRenderApp) {
      return callback(null, true);
    }

    // Check if origin is a verified custom domain
    try {
      const { CustomDomain } = require('./models');
      const hostname = new URL(origin).hostname;

      const customDomain = await CustomDomain.findOne({
        where: {
          domain: hostname,
          is_active: true,
          verification_status: 'verified'
        }
      });

      if (customDomain) {
        return callback(null, true);
      }
    } catch (error) {
      // Silently fail domain check
    }

    callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-store-id', 'X-Language', 'params', 'cache-control', 'pragma', 'expires', 'headers'],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Body parsing middleware
// IMPORTANT: Webhook endpoint needs raw body for signature verification
// CRITICAL: Raw body middleware MUST come BEFORE JSON parsing middleware

// Step 1: Apply raw body parser to webhook endpoint FIRST
app.use((req, res, next) => {
  // Check if this is the Stripe webhook endpoint (be flexible with the check)
  const isWebhook = req.originalUrl.includes('/webhook') || req.url.includes('/webhook') || req.path.includes('/webhook');

  if (isWebhook) {
    console.log('🔧 Using RAW body parser for webhook:', req.originalUrl);
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

// URL encoded for all other routes
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Allow cross-site cookies in production
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static('uploads'));

// Usage tracking middleware (must be after body parsers, before routes)
app.use(trackApiCall); // Track API usage for billing
app.use(trackApiError); // Track API errors
// Note: checkUsageLimits is applied selectively on routes that need it

// Custom domain resolution middleware (must be before routes)
const domainResolver = require('./middleware/domainResolver');
app.use(domainResolver);

// Health check endpoint (no DB required)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    nodeVersion: process.version
  });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Redis cache health check endpoint
app.get('/health/cache', async (req, res) => {
  try {
    const { isRedisConnected, getRedisInfo } = require('./config/redis');
    const { getStats } = require('./utils/cacheManager');

    const redisInfo = getRedisInfo();
    const stats = await getStats();

    res.json({
      status: 'OK',
      redis: {
        connected: isRedisConnected(),
        ...redisInfo
      },
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);

// Public routes for guest access
app.use('/api/public/auth', authRoutes); // Public auth endpoints (login, register, etc.)
app.use('/api/public/storefront/bootstrap', storefrontBootstrapRoutes); // Unified storefront initialization endpoint
app.use('/api/public/stores', storeRoutes);
app.use('/api/public/products', publicProductRoutes);
app.use('/api/public/categories', publicCategoryRoutes);
app.use('/api/public/shipping', publicShippingRoutes);
app.use('/api/public/tax', taxRoutes);
app.use('/api/public/delivery', publicDeliveryRoutes);
app.use('/api/public/attributes', publicAttributeRoutes);
app.use('/api/public/coupons', couponRoutes);
app.use('/api/public/product-labels', publicProductLabelRoutes);
app.use('/api/public/attribute-sets', attributeSetRoutes);
app.use('/api/public/seo-templates', seoTemplateRoutes);
app.use('/api/public/seo-settings', seoSettingsRoutes);
app.use('/api/public/cookie-consent-settings', cookieConsentRoutes);
// Use dedicated working route for public CMS blocks
app.use('/api/public/cms-blocks', publicCmsBlocksRoutes);
app.use('/api/public/cms-pages', publicCmsPagesRoutes);
app.use('/api/public/product-tabs', publicProductTabRoutes);
app.use('/api/public/custom-option-rules', customOptionRuleRoutes);
app.use('/api/public/payment-methods', publicPaymentMethodRoutes);
// Robots.txt serving route
app.use('/api/robots', robotsRoutes);
// Sitemap.xml serving route
app.use('/api/sitemap', sitemapRoutes);
// Public preview routes (no authentication required)
app.use('/api/preview', previewRoutes);

// Store-specific robots.txt route (for multi-store)
app.get('/public/:storeSlug/robots.txt', async (req, res) => {
  try {
    const { storeSlug } = req.params;

    // Redirect to the store-specific robots.txt API endpoint
    return res.redirect(301, `/api/robots/store/${storeSlug}`);
  } catch (error) {
    console.error('[Robots] Error serving store robots.txt:', error);
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }).send(`User-agent: *
Allow: /
Disallow: /admin/`);
  }
});

// Standard robots.txt route (for default store)
app.get('/robots.txt', async (req, res) => {
  try {
    const { Store, SeoSettings } = require('./models');

    // Get the first active store as default
    const defaultStore = await Store.findOne({
      where: { is_active: true },
      order: [['createdAt', 'ASC']]
    });

    if (!defaultStore) {
      return res.set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }).send(`User-agent: *
Allow: /
Disallow: /admin/`);
    }

    // Redirect to the store-specific robots.txt API endpoint
    return res.redirect(301, `/api/robots/store/${defaultStore.slug}`);
  } catch (error) {
    console.error('[Robots] Error serving default robots.txt:', error);
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }).send(`User-agent: *
Allow: /
Disallow: /admin/`);
  }
});

// Standard sitemap.xml route (for default store)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const { Store } = require('./models');

    // Get the first active store as default
    const defaultStore = await Store.findOne({
      where: { is_active: true },
      order: [['createdAt', 'ASC']]
    });

    if (!defaultStore) {
      return res.status(404).set({
        'Content-Type': 'text/plain; charset=utf-8'
      }).send('No active store found');
    }

    // Redirect to the store-specific sitemap.xml API endpoint
    return res.redirect(301, `/api/sitemap/store/${defaultStore.slug}`);
  } catch (error) {
    console.error('[Sitemap] Error serving default sitemap.xml:', error);
    res.status(500).set({
      'Content-Type': 'text/plain; charset=utf-8'
    }).send('Error generating sitemap');
  }
});

// Public store-specific sitemap.xml route
app.get('/public/:storeSlug/sitemap.xml', async (req, res) => {
  try {
    const { storeSlug } = req.params;
    // Redirect to the API endpoint
    return res.redirect(301, `/api/sitemap/store/${storeSlug}`);
  } catch (error) {
    console.error('[Sitemap] Error serving public sitemap.xml:', error);
    res.status(500).set({
      'Content-Type': 'text/plain; charset=utf-8'
    }).send('Error generating sitemap');
  }
});

// Authenticated routes (keep existing for admin/authenticated users)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/stores', authMiddleware, storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/configurable-products', configurableProductRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api', slotConfigurationRoutes); // Slot configurations for cart layout

// Public order lookup by payment reference (MUST be before authenticated routes)
app.get('/api/orders/by-payment-reference/:payment_reference', async (req, res) => {
  try {
    const { payment_reference } = req.params;

    if (!payment_reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    // Try simple lookup first
    const { Order } = require('./models');
    const order = await Order.findOne({
      where: { payment_reference }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Try to add associations gradually
    let orderWithDetails = order;
    try {
      const { Store, OrderItem, Product, ProductTranslation } = require('./models');

      // Get order items separately
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id },
        include: [{
          model: Product,
          attributes: ['id', 'sku'],
          include: [{
            model: ProductTranslation,
            as: 'translations',
            attributes: ['name', 'language_code'],
            required: false
          }],
          required: false
        }]
      });

      // Get store separately
      const store = await Store.findByPk(order.store_id, {
        attributes: ['id', 'name']
      });

      orderWithDetails = {
        ...order.toJSON(),
        Store: store,
        OrderItems: orderItems
      };
    } catch (includeError) {
      // Return basic order with empty OrderItems if associations fail
      orderWithDetails = {
        ...order.toJSON(),
        Store: null,
        OrderItems: []
      };
    }

    res.json({
      success: true,
      data: orderWithDetails
    });
  } catch (error) {
    console.error('Get order by payment reference error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Register public order endpoints BEFORE auth middleware
const publicOrderRouter = express.Router();

// Import the finalization logic from orders.js
const { Order, OrderItem, Product, Customer } = require('./models');
const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Public endpoint: Finalize order (called from OrderSuccess page)
publicOrderRouter.post('/finalize-order', async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    // Find the order by payment reference
    const order = await Order.findOne({
      where: {
        payment_reference: session_id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if already finalized
    if (order.status === 'processing' && order.payment_status === 'paid') {
      return res.json({
        success: true,
        message: 'Order already finalized',
        data: { order_id: order.id, already_finalized: true }
      });
    }

    // Get the store for the connected account
    const { Store } = require('./models');
    const store = await Store.findByPk(order.store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Determine payment provider from order metadata or default to Stripe
    const paymentProvider = order.payment_method || 'stripe';

    // Verify payment based on provider
    let paymentVerified = false;

    if (paymentProvider === 'stripe' || paymentProvider.includes('card') || paymentProvider.includes('credit')) {
      // Stripe payment verification
      const stripeOptions = {};
      if (store.stripe_account_id) {
        stripeOptions.stripeAccount = store.stripe_account_id;
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(session_id, stripeOptions);

        if (session.payment_status === 'paid') {
          paymentVerified = true;
        } else {
          return res.json({
            success: false,
            message: 'Payment not yet completed',
            data: { payment_status: session.payment_status, provider: 'stripe' }
          });
        }
      } catch (stripeError) {
        return res.status(400).json({
          success: false,
          message: 'Failed to verify payment with Stripe',
          error: stripeError.message
        });
      }
    } else if (paymentProvider === 'adyen') {
      // TODO: Implement Adyen payment verification
      return res.status(501).json({
        success: false,
        message: 'Adyen payment verification not yet implemented'
      });
    } else if (paymentProvider === 'mollie') {
      // TODO: Implement Mollie payment verification
      return res.status(501).json({
        success: false,
        message: 'Mollie payment verification not yet implemented'
      });
    } else {
      // Unknown provider - assume verified for offline payments
      paymentVerified = true;
    }

    if (!paymentVerified) {
      return res.json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update order status
    await order.update({
      status: 'processing',
      payment_status: 'paid',
      updatedAt: new Date()
    });

    // Send confirmation email (atomic check-and-set to prevent race condition)
    // Use UPDATE with WHERE to atomically claim email sending rights
    const [affectedRows] = await Order.update(
      { confirmation_email_sent_at: new Date() },
      {
        where: {
          id: order.id,
          confirmation_email_sent_at: null // Only update if still null
        }
      }
    );

    if (affectedRows > 0) {
      // We successfully claimed the email sending (atomic operation)
      try {
        const emailService = require('./services/email-service');

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

        // Extract customer name
        const customerName = customer
          ? `${customer.first_name} ${customer.last_name}`
          : (order.shipping_address?.full_name || order.shipping_address?.name || 'Customer');

        const [firstName, ...lastNameParts] = customerName.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        // Send email
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
      } catch (emailError) {
        // Rollback the flag if email failed
        await order.update({ confirmation_email_sent_at: null });
      }
    }

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
    res.status(500).json({
      success: false,
      message: 'Failed to finalize order',
      error: error.message
    });
  }
});

// Register public order endpoints without auth
app.use('/api/orders', publicOrderRouter);

// Now register authenticated order routes
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/coupons', authMiddleware, couponRoutes);
app.use('/api/attributes', authMiddleware, attributeRoutes);
app.use('/api/cms-pages', authMiddleware, cmsRoutes);
app.use('/api/cms-blocks', authMiddleware, cmsBlockRoutes);
app.use('/api/shipping', authMiddleware, shippingRoutes);
app.use('/api/tax', authMiddleware, taxRoutes);
app.use('/api/delivery', authMiddleware, deliveryRoutes);

// New endpoint routes
app.use('/api/customers', customerRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/translations', translationRoutes);
// app.use('/api/diagnostic', diagnosticRoutes); // Temporarily disabled
app.use('/api/migrations', migrationsRoutes); // Database migrations
app.use('/api/ai', aiRoutes); // Centralized AI service (new unified system)
app.use('/api/ai', aiStudioRoutes);
app.use('/api/ai', aiPluginAssistantRoutes); // AI Plugin Assistant for no-code and developer modes
app.use('/api/plugins/ai', pluginAIRoutes); // Claude API integration for plugin generation
app.use('/api/customer-activity', customerActivityRoutes);
app.use('/api/ab-testing', abTestingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics-dashboard', analyticsDashboardRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/custom-analytics-events', customAnalyticsEventsRoutes);
app.use('/api/seo-settings', seoSettingsRoutes);
app.use('/api/seo-templates', seoTemplateRoutes);
app.use('/api/redirects', redirectRoutes);
app.use('/api/canonical-urls', canonicalUrlRoutes);
app.use('/api/attribute-sets', attributeSetRoutes);
app.use('/api/product-labels', productLabelRoutes);
app.use('/api/product-tabs', productTabRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', authMiddleware, paymentMethodRoutes);
app.use('/api/cookie-consent-settings', authMiddleware, cookieConsentRoutes);
app.use('/api/consent-logs', authMiddleware, consentLogRoutes);
app.use('/api/custom-option-rules', authMiddleware, customOptionRuleRoutes);
app.use('/api/addresses', addressRoutes);
// CMS blocks route moved to line 1522 with correct /api/public/cms-blocks path
app.use('/api/store-teams', authMiddleware, storeTeamRoutes);
app.use('/api/integrations', authMiddleware, integrationRoutes);
app.use('/api/supabase', supabaseRoutes);
app.use('/api/supabase', supabaseSetupRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/database-provisioning', authMiddleware, databaseProvisioningRoutes); // Master DB: provisioning, subscriptions, billing
app.use('/api/custom-domains', customDomainsRoutes); // Custom domain management: DNS verification, SSL provisioning
app.use('/api/images', authMiddleware, imageRoutes);
app.use('/api/cloudflare/oauth', cloudflareOAuthRoutes);
app.use('/api/admin', adminNavigationRoutes); // Dynamic navigation API (Plugin Architecture Phase 1)
app.use('/api/plugins', pluginApiRoutes); // Modern plugin system: widgets, marketplace, purchases (Plugin Architecture Phase 1)
app.use('/api/plugins', pluginVersionApiRoutes); // Plugin version control: git-like versioning, snapshots, patches, rollback
app.use('/api/stores/:store_id/plugins', storePluginRoutes); // Store-specific plugin routes (enable/disable/configure)
app.use('/api/stores/:store_id/plugins/create', pluginCreationRoutes);
app.use('/api/plugins', dynamicPluginRoutes.router);
app.use('/api/chat', chatApiRoutes); // Customer service chat plugin API
app.use('/api/storage', storageRoutes); // Main storage routes for File Library
app.use('/api/stores/:store_id/products', productImageRoutes);
app.use('/api/stores/:store_id/categories', categoryImageRoutes);
app.use('/api/file-manager', fileManagerRoutes);
app.use('/api/source-files', sourceFilesRoutes);
app.use('/api/store-provisioning', storeProvisioningRoutes);
app.use('/api/stores/:store_id/domains', domainsRoutes);
app.use('/api/stores', domainSettingsRoutes); // Domain settings for Store -> Settings -> Domain
app.use('/api/heatmap', heatmapRoutes); // Add heatmap routes (public tracking, auth for analytics) - MUST come before broad /api middleware
app.use('/api/background-jobs', backgroundJobRoutes); // Background job management routes
app.use('/api/cron-jobs', cronJobRoutes); // Dynamic cron job management routes
app.use('/api/extensions', extensionsRoutes); // Modern extension system API with hook-based architecture
app.use('/api/slot-configurations', slotConfigurationRoutes); // Slot configuration versioning API
app.use('/api/credits', creditRoutes); // Credit system: balance, purchases, usage tracking
app.use('/api/service-credit-costs', serviceCreditCostsRoutes); // Service credit costs management (admin)
app.use('/api/email-templates', emailTemplatesRoutes); // Email template management with translations
app.use('/api/pdf-templates', pdfTemplatesRoutes); // PDF template management for invoices, shipments
app.use('/api/brevo', brevoOAuthRoutes); // Brevo email service OAuth and configuration
// Conditional auth middleware that excludes preview routes
const conditionalAuthMiddleware = (req, res, next) => {
  // Skip authentication for preview routes
  if (req.path.startsWith('/api/preview')) {
    return next();
  }
  return authMiddleware(req, res, next);
};

app.use('/api', conditionalAuthMiddleware, storeDatabaseRoutes); // Add store database routes
app.use('/api', conditionalAuthMiddleware, storeMediaStorageRoutes); // Add media storage routes

// Preview route for serving content with customizations
// Server-side patch rendering for preview
app.get('/preview/:storeId', async (req, res) => {
  // Set headers to allow iframe embedding and prevent caching
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *;");
  res.removeHeader('X-Content-Type-Options');
  
  try {
    const { storeId } = req.params;
    const { fileName, patches = 'true', storeSlug, pageName: providedPageName } = req.query;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName query parameter is required' });
    }

    // Get store information
    const Store = require('./models/Store');
    const store = await Store.findByPk(storeId);

    if (!store) {
      return res.status(404).json({
        error: 'Store not found',
        storeId,
        message: `Store with ID "${storeId}" not found`
      });
    }

    const actualStoreSlug = storeSlug || store.slug || 'store';

    // Get current published version for this store
    const currentVersionResult = await extensionService.getCurrentVersion(storeId);
    const hasExtensions = currentVersionResult.success && currentVersionResult.version;

    // Redirect to main application
    const publicStoreBaseUrl = process.env.PUBLIC_STORE_BASE_URL || 'https://catalyst-pearl.vercel.app';
    const routePath = '';

    // Add extension system parameters instead of patches
    const queryParams = new URLSearchParams({
      extensions: 'true',
      storeId: storeId,
      fileName: fileName,
      preview: 'true',
      _t: Date.now()
    });

    const extensionPreviewUrl = `${publicStoreBaseUrl}/public/${actualStoreSlug}/${routePath}?${queryParams.toString()}`;

    return res.redirect(302, extensionPreviewUrl);

  } catch (error) {
    res.status(500).json({
      error: 'Preview failed',
      message: error.message
    });
  }
});

// Extension System Status Endpoint
app.get('/api/extension-system-status', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Extension system is active',
      status: 'active',
      features: [
        'Hook-based architecture',
        'Event-driven system', 
        'Version management',
        'Preview system',
        'Extension modules'
      ],
      legacy_systems_removed: [
        'diff-patching',
        'overlay-patch-system',
        'patch-service',
        'hybrid-patch-service'
      ]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Database connection and server startup
const startServer = async () => {
  // Start HTTP server first (for health checks)
  const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');

    // Close Redis connection
    try {
      const { closeRedis } = require('./config/redis');
      await closeRedis();
    } catch (error) {
      console.error('Error closing Redis:', error);
    }

    server.close(() => {
      console.log('Process terminated');
    });
  });

  // Connect to database after server is running
  try {
    
    // Test database connection with retry logic
    let retries = 3;
    let dbConnected = false;
    
    while (retries > 0 && !dbConnected) {
      try {
        await sequelize.authenticate();
        dbConnected = true;

        // Sync database tables
        if (process.env.NODE_ENV === 'development') {
          await sequelize.sync({ alter: true });
        } else {
          await sequelize.sync({ alter: false });
        }

        // Initialize Redis cache
        try {
          const { initRedis } = require('./config/redis');
          await initRedis();
          console.log('✅ Redis cache initialized');
        } catch (error) {
          console.warn('⚠️  Redis initialization failed, continuing without cache:', error.message);
        }

        // Initialize Plugin Manager
        try {
          const pluginManager = require('./core/PluginManager');
          await pluginManager.initialize();
        } catch (error) {
          console.warn('Plugin Manager initialization failed:', error.message);
        }

        // Initialize Database-Driven Plugin Registry
        try {
          const { initializePluginRegistry } = require('./routes/dynamic-plugins');
          await initializePluginRegistry(sequelize);
        } catch (error) {
          console.warn('Plugin Registry initialization failed:', error.message);
        }

        // Initialize Background Job Manager
        try {
          const jobManager = require('./core/BackgroundJobManager');
          await jobManager.initialize();

          // Initialize Akeneo Scheduler Integration
          const akeneoSchedulerIntegration = require('./services/akeneo-scheduler-integration');
          await akeneoSchedulerIntegration.initialize();

        } catch (error) {
          console.warn('Background Job Manager initialization failed:', error.message);
        }

        // Run all pending database migrations automatically
        try {
          const { runPendingMigrations } = require('./database/migrations/migration-tracker');
          const migrationResult = await runPendingMigrations();

          if (!migrationResult.success && migrationResult.error) {
            console.warn('Some database migrations failed:', migrationResult.error);
          }
        } catch (migrationError) {
          console.warn('Database migration warning:', migrationError.message);
        }

      } catch (dbError) {
        retries--;
        console.error(`Database connection failed (${3 - retries}/3):`, dbError.message);

        if (retries === 0) {
          console.warn('Database connection failed. Server will continue without database.');
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
  } catch (error) {
    console.error('Server startup error:', error.message);
  }
};

startServer();

module.exports = app;