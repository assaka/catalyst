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
const authMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const storeRoutes = require('./routes/stores');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const publicProductRoutes = require('./routes/publicProducts');
const publicCategoryRoutes = require('./routes/publicCategories');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const attributeRoutes = require('./routes/attributes');
const cmsRoutes = require('./routes/cms');
const cmsBlockRoutes = require('./routes/cms-blocks');
const shippingRoutes = require('./routes/shipping');
const taxRoutes = require('./routes/tax');
const deliveryRoutes = require('./routes/delivery');
const oauthTestRoutes = require('./routes/oauth-test');
const dbTestRoutes = require('./routes/db-test');
const dbInitRoutes = require('./routes/db-init');
const dbSetupRoutes = require('./routes/db-setup');
const migrateRoutes = require('./routes/migrate');
const migrateSupabaseRoutes = require('./routes/migrate-supabase');
const customerRoutes = require('./routes/customers');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const languageRoutes = require('./routes/languages');
const customerActivityRoutes = require('./routes/customer-activity');
const storePluginRoutes = require('./routes/store-plugins');
const seoSettingsRoutes = require('./routes/seo-settings');
const seoTemplateRoutes = require('./routes/seo-templates');
const attributeSetRoutes = require('./routes/attribute-sets');
const productLabelRoutes = require('./routes/product-labels');
const productTabRoutes = require('./routes/product-tabs');
const paymentRoutes = require('./routes/payments');
const paymentMethodRoutes = require('./routes/payment-methods');
const cookieConsentRoutes = require('./routes/cookie-consent-settings');
const consentLogRoutes = require('./routes/consent-logs');
const customOptionRuleRoutes = require('./routes/custom-option-rules');
const addCustomOptionRulesTableRoutes = require('./routes/add-custom-option-rules-table');
const addressRoutes = require('./routes/addresses');

const app = express();

// Trust proxy for Render.com
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
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
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
// IMPORTANT: Webhook endpoint needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes
app.use(express.json({ limit: '10mb' }));
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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static('uploads'));

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

// Environment variables test endpoint
app.get('/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSupabaseDbUrl: !!process.env.SUPABASE_DB_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'Not set',
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Simple database test endpoint
app.get('/debug/simple-db', async (req, res) => {
  try {
    const { Sequelize } = require('sequelize');
    const dns = require('dns');
    const { promisify } = require('util');
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'No DATABASE_URL found'
      });
    }
    
    console.log('🔄 Testing direct database connection...');
    console.log('📊 Database URL format check:', databaseUrl.substring(0, 50) + '...');
    
    // Parse URL to check components
    let parsedUrl;
    try {
      parsedUrl = new URL(databaseUrl);
    } catch (urlError) {
      return res.status(500).json({
        success: false,
        message: 'Invalid DATABASE_URL format',
        error: urlError.message
      });
    }
    
    console.log('📊 Parsed URL components:', {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      database: parsedUrl.pathname.slice(1),
      username: parsedUrl.username
    });
    
    // Try to resolve hostname to IPv4 address
    const resolve4 = promisify(dns.resolve4);
    let ipv4Address = null;
    
    try {
      console.log('🔄 Resolving hostname to IPv4...');
      const addresses = await resolve4(parsedUrl.hostname);
      ipv4Address = addresses[0];
      console.log('✅ Resolved to IPv4:', ipv4Address);
    } catch (dnsError) {
      console.log('❌ DNS resolution failed:', dnsError.message);
    }
    
    // Use IPv4 address if available, otherwise use original hostname
    const connectionHost = ipv4Address || parsedUrl.hostname;
    console.log('📊 Using connection host:', connectionHost);
    
    // Create explicit connection config to force IPv4
    const connectionConfig = {
      dialect: 'postgres',
      host: connectionHost,
      port: parseInt(parsedUrl.port) || 5432,
      username: parsedUrl.username,
      password: parsedUrl.password,
      database: parsedUrl.pathname.slice(1),
      logging: (msg) => console.log('🔧 SQL:', msg),
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        // Force IPv4 to avoid IPv6 connectivity issues on Render.com
        family: 4,
        // Additional connection options
        connectTimeout: 60000,
        keepAlive: true,
        keepAliveInitialDelayMs: 0
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
      }
    };
    
    console.log('📊 Using explicit connection config with forced IPv4');
    const testSequelize = new Sequelize(connectionConfig);
    
    console.log('🔄 Attempting authentication...');
    await testSequelize.authenticate();
    console.log('✅ Direct database connection successful');
    
    // Test a simple query
    const [results] = await testSequelize.query('SELECT 1 as test');
    console.log('✅ Simple query successful:', results);
    
    await testSequelize.close();
    
    res.json({
      success: true,
      message: 'Direct database connection successful',
      connectionType: 'Explicit config with IPv4',
      originalHost: parsedUrl.hostname,
      resolvedHost: connectionHost,
      port: parsedUrl.port,
      database: parsedUrl.pathname.slice(1),
      username: parsedUrl.username
    });
  } catch (error) {
    console.error('❌ Direct database connection failed:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    
    res.status(500).json({
      success: false,
      message: 'Direct database connection failed',
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
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

// Test cookie consent settings endpoint
app.get('/debug/test-cookie-settings', async (req, res) => {
  try {
    const { CookieConsentSettings } = require('./models');
    
    // Test if table exists and can be queried
    const count = await CookieConsentSettings.count();
    
    // Test table structure
    const attributes = CookieConsentSettings.getTableName ? 
      Object.keys(CookieConsentSettings.rawAttributes) : 
      'Unknown';
    
    res.json({
      success: true,
      message: 'CookieConsentSettings table is accessible',
      recordCount: count,
      attributes: attributes
    });
  } catch (error) {
    console.error('❌ CookieConsentSettings test failed:', error);
    res.status(500).json({
      success: false,
      message: 'CookieConsentSettings table test failed',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
});

// Test cookie consent creation endpoint
app.post('/debug/test-cookie-create', async (req, res) => {
  try {
    const { CookieConsentSettings } = require('./models');
    
    console.log('🔍 Test cookie create - received data:', JSON.stringify(req.body, null, 2));
    
    // Try to create with the exact data sent
    const settings = await CookieConsentSettings.create(req.body);
    
    res.json({
      success: true,
      message: 'CookieConsentSettings created successfully',
      data: settings
    });
  } catch (error) {
    console.error('❌ Test cookie create failed:', error);
    res.status(500).json({
      success: false,
      message: 'CookieConsentSettings creation failed',
      error: error.message,
      validationErrors: error.errors?.map(e => ({field: e.path, message: e.message})) || null
    });
  }
});

// Cookie consent settings migration endpoint
app.post('/debug/migrate-cookie-settings', async (req, res) => {
  try {
    console.log('🔄 Running CookieConsentSettings migration...');
    
    const { CookieConsentSettings } = require('./models');
    
    // Sync CookieConsentSettings table
    await CookieConsentSettings.sync({ alter: true });
    console.log('✅ CookieConsentSettings table synced successfully');
    
    // Test the table
    const count = await CookieConsentSettings.count();
    
    res.json({
      success: true,
      message: 'CookieConsentSettings migration completed successfully',
      recordCount: count
    });
  } catch (error) {
    console.error('❌ CookieConsentSettings migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'CookieConsentSettings migration failed',
      error: error.message
    });
  }
});

// Consent logs migration endpoint
app.post('/debug/migrate-consent', async (req, res) => {
  try {
    console.log('🔄 Running ConsentLog migration...');
    
    const { ConsentLog } = require('./models');
    
    // Just sync ConsentLog table
    await ConsentLog.sync({ force: false });
    console.log('✅ ConsentLog table synced successfully');
    
    res.json({
      success: true,
      message: 'ConsentLog migration completed successfully'
    });
  } catch (error) {
    console.error('❌ ConsentLog migration failed:', error);
    
    // Try manual creation
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS consent_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id VARCHAR(255) NOT NULL,
          user_id UUID,
          store_id UUID NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          consent_given BOOLEAN NOT NULL,
          categories_accepted JSONB NOT NULL DEFAULT '[]'::jsonb,
          country_code VARCHAR(2),
          consent_method VARCHAR(20) NOT NULL,
          page_url TEXT,
          created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT fk_consent_logs_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
          CONSTRAINT fk_consent_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT chk_consent_method CHECK (consent_method IN ('accept_all', 'reject_all', 'custom'))
        );
      `);
      
      res.json({
        success: true,
        message: 'ConsentLog table created manually'
      });
    } catch (manualError) {
      res.status(500).json({
        success: false,
        message: 'ConsentLog migration failed',
        error: manualError.message
      });
    }
  }
});

// Public database migration endpoint
app.post('/debug/migrate', async (req, res) => {
  try {
    console.log('🔄 Running database migration...');
    
    // Import all models to ensure they're synced
    const { 
      User, Store, Product, Category, Order, OrderItem, Coupon, CmsPage, Tax, ShippingMethod, DeliverySettings,
      Customer, Cart, Wishlist, Language, CustomerActivity, StorePlugin, SeoSettings, SeoTemplate, ProductLabel,
      ConsentLog
    } = require('./models');
    
    // Sync all models in the correct order
    await sequelize.sync({ alter: true });
    console.log('✅ All tables synchronized');
    
    res.json({
      success: true,
      message: 'Database migration completed successfully'
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Detailed database debug endpoint
app.get('/debug/db', async (req, res) => {
  const { supabase } = require('./database/connection');
  
  try {
    // Log environment variables (without revealing sensitive data)
    console.log('🔍 Starting database debug...');
    console.log('📊 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasDatabaseUrl: !!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL),
      supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'Not set',
      databaseUrlPrefix: (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) ? 
        (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL).substring(0, 30) + '...' : 'Not set'
    });
    
    // Test Sequelize connection
    console.log('🔄 Testing Sequelize connection...');
    await sequelize.authenticate();
    console.log('✅ Sequelize connection successful');
    
    // Get database info
    const dialectName = sequelize.getDialect();
    const databaseName = sequelize.getDatabaseName();
    
    // Test Supabase client if available
    let supabaseStatus = 'Not configured';
    let supabaseError = null;
    
    if (supabase) {
      try {
        console.log('🔄 Testing Supabase client...');
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (error) {
          supabaseStatus = `Error: ${error.message}`;
          supabaseError = error;
          console.log('❌ Supabase query error:', error);
        } else {
          supabaseStatus = 'Connected';
          console.log('✅ Supabase connection successful');
        }
      } catch (supabaseErr) {
        supabaseStatus = `Error: ${supabaseErr.message}`;
        supabaseError = supabaseErr;
        console.log('❌ Supabase connection error:', supabaseErr);
      }
    } else {
      console.log('⚠️  Supabase client not initialized');
    }
    
    // Test if we can create a simple table
    let queryTestStatus = 'Not tested';
    try {
      await sequelize.query('SELECT 1 as test');
      queryTestStatus = 'Query successful';
    } catch (queryError) {
      queryTestStatus = `Query failed: ${queryError.message}`;
    }
    
    res.json({
      success: true,
      message: 'Database debug completed',
      database: {
        dialect: dialectName,
        database: databaseName,
        host: sequelize.config.host || 'N/A',
        port: sequelize.config.port || 'N/A',
        ssl: sequelize.config.dialectOptions?.ssl ? 'Enabled' : 'Disabled'
      },
      supabase: {
        status: supabaseStatus,
        url: process.env.SUPABASE_URL ? 'Configured' : 'Not configured',
        error: supabaseError?.message || null
      },
      tests: {
        sequelize: 'Connected',
        query: queryTestStatus
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        hasDatabaseUrl: !!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)
      }
    });
  } catch (error) {
    console.error('❌ Database debug failed:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Database debug failed',
      error: error.message,
      details: {
        name: error.name,
        code: error.code || 'N/A',
        stack: error.stack?.split('\n')[0] || 'N/A'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        hasDatabaseUrl: !!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)
      }
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Fallback for legacy paths

// Public routes for guest access
app.use('/api/public/stores', storeRoutes);
app.use('/api/public/products', publicProductRoutes);
app.use('/api/public/categories', publicCategoryRoutes);
app.use('/api/public/shipping', shippingRoutes);
app.use('/api/public/tax', taxRoutes);
app.use('/api/public/delivery', deliveryRoutes);
app.use('/api/public/attributes', attributeRoutes);
app.use('/api/public/coupons', couponRoutes);
app.use('/api/public/product-labels', productLabelRoutes);
app.use('/api/public/attribute-sets', attributeSetRoutes);
app.use('/api/public/seo-templates', seoTemplateRoutes);
app.use('/api/public/seo-settings', seoSettingsRoutes);
app.use('/api/public/cookie-consent-settings', cookieConsentRoutes);

// Authenticated routes (keep existing for admin/authenticated users)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/stores', authMiddleware, storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Public order lookup by payment reference (MUST be before authenticated routes)
app.get('/api/orders/by-payment-reference/:payment_reference', async (req, res) => {
  try {
    const { payment_reference } = req.params;
    console.log('Looking up order with payment_reference:', payment_reference);
    
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

    console.log('Order found:', order ? 'YES' : 'NO');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Try to add associations gradually
    let orderWithDetails = order;
    try {
      const { Store, OrderItem, Product } = require('./models');
      
      console.log('Looking for order items with order_id:', order.id);
      
      // Get order items separately
      const orderItems = await OrderItem.findAll({
        where: { order_id: order.id },
        include: [{ 
          model: Product, 
          attributes: ['id', 'name', 'sku', 'image_url'],
          required: false
        }]
      });
      
      console.log('Found order items:', orderItems.length);
      console.log('Order items data:', JSON.stringify(orderItems, null, 2));
      
      // Get store separately  
      const store = await Store.findByPk(order.store_id, {
        attributes: ['id', 'name']
      });

      orderWithDetails = {
        ...order.toJSON(),
        Store: store,
        OrderItems: orderItems
      };
      
      console.log('Successfully loaded order with details. OrderItems count:', orderItems.length);
      console.log('Sample OrderItem:', orderItems[0] ? JSON.stringify(orderItems[0], null, 2) : 'No items');
    } catch (includeError) {
      console.error('Error loading associations:', includeError.message);
      console.error('Include error stack:', includeError.stack);
      
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
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Now register authenticated order routes
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/coupons', authMiddleware, couponRoutes);
app.use('/api/attributes', authMiddleware, attributeRoutes);
app.use('/api/cms', authMiddleware, cmsRoutes);
app.use('/api/cms-blocks', authMiddleware, cmsBlockRoutes);
app.use('/api/shipping', authMiddleware, shippingRoutes);
app.use('/api/tax', authMiddleware, taxRoutes);
app.use('/api/delivery', authMiddleware, deliveryRoutes);
app.use('/api/oauth-test', oauthTestRoutes);
app.use('/api/db-test', dbTestRoutes);
app.use('/api/db-init', dbInitRoutes);
app.use('/api/db-setup', dbSetupRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/migrate-supabase', migrateSupabaseRoutes);

// New endpoint routes
app.use('/api/customers', customerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/customer-activity', customerActivityRoutes);
app.use('/api/store-plugins', storePluginRoutes);
app.use('/api/seo-settings', seoSettingsRoutes);
app.use('/api/seo-templates', seoTemplateRoutes);
app.use('/api/attribute-sets', attributeSetRoutes);
app.use('/api/product-labels', productLabelRoutes);
app.use('/api/product-tabs', productTabRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-methods', authMiddleware, paymentMethodRoutes);
app.use('/api/cookie-consent-settings', authMiddleware, cookieConsentRoutes);
app.use('/api/consent-logs', authMiddleware, consentLogRoutes);
app.use('/api/custom-option-rules', authMiddleware, customOptionRuleRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/debug', addCustomOptionRulesTableRoutes);

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
    console.log(`🚀 Server started on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'Not set'}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  // Connect to database after server is running
  try {
    console.log('🔍 Checking environment variables...');
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`- PORT: ${PORT}`);
    console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    
    console.log('\n🔗 Attempting database connection...');
    
    // Test database connection with retry logic
    let retries = 3;
    let dbConnected = false;
    
    while (retries > 0 && !dbConnected) {
      try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        dbConnected = true;
        
        // Sync database tables
        if (process.env.NODE_ENV === 'development') {
          await sequelize.sync({ alter: true });
          console.log('📊 Database synchronized (development mode).');
        } else {
          await sequelize.sync({ alter: false });
          console.log('📊 Database schema validated (production mode).');
        }
        
      } catch (dbError) {
        retries--;
        console.error(`❌ Database connection failed (${3 - retries}/3):`, dbError.message);
        
        if (retries === 0) {
          console.warn('⚠️  Database connection failed. Server will continue without database.');
          console.warn('⚠️  Some features may not work properly.');
          break;
        }
        
        console.log(`🔄 Retrying database connection in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n✅ Server startup completed successfully!');
    
  } catch (error) {
    console.error('❌ Server startup error:', error.message);
    
    // Don't exit - let the server run for health checks
    if (error.message.includes('ENETUNREACH')) {
      console.error('\n🔧 DATABASE TROUBLESHOOTING TIPS:');
      console.error('- Verify DATABASE_URL environment variable');
      console.error('- Check Supabase project status');
      console.error('- Try IPv4 connection string');
      console.error('- Check network connectivity');
    }
  }
};

startServer();

module.exports = app;