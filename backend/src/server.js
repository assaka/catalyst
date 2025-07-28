const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('./config/passport');
require('dotenv').config();

// Force deployment trigger - v2.1

const { sequelize } = require('./database/connection');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import all models to ensure associations are loaded
const models = require('./models');
console.log('🔧 Models loaded with associations initialized');

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
const populateAttributesRoutes = require('./routes/populate-attributes');
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

// Sample data seeding endpoint
app.post('/debug/seed', async (req, res) => {
  try {
    console.log('🌱 Starting sample data seeding via API...');
    
    const { Store, Product, Category, User } = require('./models');
    
    // First, ensure the user exists
    const ownerEmail = 'playamin998@gmail.com';
    let user = await User.findOne({ where: { email: ownerEmail } });
    
    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      user = await User.create({
        email: ownerEmail,
        password: hashedPassword,
        first_name: 'Hamid',
        last_name: 'Test'
      });
      console.log('✅ Created user:', user.email);
    } else {
      console.log('✅ User already exists:', user.email);
    }
    
    // Check if we have the hamid2 store
    let store = await Store.findOne({ where: { slug: 'hamid2' } });
    
    if (!store) {
      // Create store with only essential fields
      store = await Store.create({
        name: 'Hamid',
        slug: 'hamid2',
        description: 'Sample store for testing',
        owner_email: ownerEmail
      });
      console.log('✅ Created new store:', store.name);
    } else {
      console.log('✅ Using existing store:', store.name);
    }

    // Check existing products
    const existingProducts = await Product.findAll({ where: { store_id: store.id } });
    
    let productsCreated = 0;
    if (existingProducts.length === 0) {
      const sampleProducts = [
        {
          name: 'Sample Product 1',
          slug: 'sample-product-1',
          description: 'This is a sample product for testing the storefront',
          sku: 'SAMPLE-001',
          price: 29.99,
          featured: true,
          store_id: store.id
        },
        {
          name: 'Featured Product 2',
          slug: 'featured-product-2',
          description: 'Another great sample product',
          sku: 'SAMPLE-002',
          price: 49.99,
          featured: true,
          store_id: store.id
        },
        {
          name: 'Regular Product 3',
          slug: 'regular-product-3',
          description: 'A regular sample product',
          sku: 'SAMPLE-003',
          price: 19.99,
          featured: false,
          store_id: store.id
        },
        {
          name: 'Premium Product 4',
          slug: 'premium-product-4',
          description: 'Premium sample product with great features',
          sku: 'SAMPLE-004',
          price: 99.99,
          featured: true,
          store_id: store.id
        }
      ];

      for (const productData of sampleProducts) {
        try {
          console.log('Creating product:', productData.name);
          await Product.create(productData);
          productsCreated++;
          console.log('✅ Product created successfully');
        } catch (prodError) {
          console.error('❌ Product creation failed:', prodError.message);
          throw prodError;
        }
      }
    }

    // Check existing categories
    const existingCategories = await Category.findAll({ where: { store_id: store.id } });
    
    let categoriesCreated = 0;
    if (existingCategories.length === 0) {
      const sampleCategories = [
        {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products and gadgets',
          store_id: store.id
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Fashion and clothing items',
          store_id: store.id
        }
      ];

      for (const categoryData of sampleCategories) {
        await Category.create(categoryData);
        categoriesCreated++;
      }
    }

    // Final counts
    const finalProductCount = await Product.count({ where: { store_id: store.id } });
    const finalCategoryCount = await Category.count({ where: { store_id: store.id } });
    const featuredProductCount = await Product.count({ 
      where: { 
        store_id: store.id, 
        featured: true 
      } 
    });

    res.json({
      success: true,
      message: 'Sample data seeding completed successfully',
      data: {
        user: {
          id: user.id,
          email: user.email
        },
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug
        },
        created: {
          products: productsCreated,
          categories: categoriesCreated
        },
        totals: {
          products: finalProductCount,
          categories: finalCategoryCount,
          featured_products: featuredProductCount
        }
      }
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    
    // Provide more detailed error information
    let errorDetails = error.message;
    if (error.errors && Array.isArray(error.errors)) {
      errorDetails = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
    }
    
    res.status(500).json({
      success: false,
      message: 'Sample data seeding failed',
      error: errorDetails,
      fullError: error.name
    });
  }
});

// Update products to correct store
app.post('/debug/fix-product-stores', async (req, res) => {
  try {
    console.log('🔧 Fixing product store associations...');
    
    const { Product, Store } = require('./models');
    
    // Find the Hamid store
    const hamidStore = await Store.findOne({ where: { slug: 'hamid2' } });
    
    if (!hamidStore) {
      return res.status(404).json({
        success: false,
        message: 'Hamid store not found'
      });
    }
    
    console.log(`📍 Target store: ${hamidStore.name} (${hamidStore.id})`);
    
    // Update all products to belong to the Hamid store
    const updateResult = await Product.update(
      { store_id: hamidStore.id },
      { where: {} } // Update all products
    );
    
    console.log(`✅ Updated ${updateResult[0]} products`);
    
    // Verify the update
    const productCount = await Product.count({ where: { store_id: hamidStore.id } });
    const featuredCount = await Product.count({ where: { store_id: hamidStore.id, featured: true } });
    
    res.json({
      success: true,
      message: 'Product store associations fixed',
      data: {
        store: {
          id: hamidStore.id,
          name: hamidStore.name,
          slug: hamidStore.slug
        },
        products_updated: updateResult[0],
        total_products: productCount,
        featured_products: featuredCount
      }
    });
    
  } catch (error) {
    console.error('❌ Fix product stores failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix product stores',
      error: error.message
    });
  }
});

// Create categories for store
app.post('/debug/create-categories', async (req, res) => {
  try {
    console.log('📂 Creating categories...');
    
    const { Category, Store } = require('./models');
    
    // Find the Hamid store
    const hamidStore = await Store.findOne({ where: { slug: 'hamid2' } });
    
    if (!hamidStore) {
      return res.status(404).json({
        success: false,
        message: 'Hamid store not found'
      });
    }
    
    // Check existing categories
    const existingCategories = await Category.count({ where: { store_id: hamidStore.id } });
    
    if (existingCategories > 0) {
      return res.json({
        success: true,
        message: 'Categories already exist',
        data: {
          store_id: hamidStore.id,
          existing_categories: existingCategories
        }
      });
    }
    
    // Create sample categories with proper flags
    const categories = [
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic products and gadgets',
        store_id: hamidStore.id,
        is_active: true,
        hide_in_menu: false
      },
      {
        name: 'Clothing',
        slug: 'clothing', 
        description: 'Fashion and apparel',
        store_id: hamidStore.id,
        is_active: true,
        hide_in_menu: false
      },
      {
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home and garden products',
        store_id: hamidStore.id,
        is_active: true,
        hide_in_menu: false
      }
    ];
    
    let created = 0;
    for (const catData of categories) {
      try {
        const [category, wasCreated] = await Category.findOrCreate({
          where: { slug: catData.slug, store_id: hamidStore.id },
          defaults: catData
        });
        if (wasCreated) created++;
        console.log(`Category ${wasCreated ? 'created' : 'exists'}: ${category.name} (is_active: ${category.is_active}, hide_in_menu: ${category.hide_in_menu})`);
      } catch (err) {
        console.error('Category creation error:', err.message);
      }
    }
    
    const finalCount = await Category.count({ where: { store_id: hamidStore.id } });
    
    res.json({
      success: true,
      message: 'Categories created successfully',
      data: {
        store_id: hamidStore.id,
        categories_created: created,
        total_categories: finalCount
      }
    });
    
  } catch (error) {
    console.error('❌ Create categories failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create categories',
      error: error.message
    });
  }
});

// Debug: View all categories
app.get('/debug/view-categories', async (req, res) => {
  try {
    const { Category, Store } = require('./models');
    
    const categories = await Category.findAll({
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'slug']
      }],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        is_active: cat.is_active,
        hide_in_menu: cat.hide_in_menu,
        store_id: cat.store_id,
        store_name: cat.store?.name
      }))
    });
  } catch (error) {
    console.error('❌ View categories failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view categories',
      error: error.message
    });
  }
});

// Debug: Associate products with categories
app.post('/debug/associate-products-categories', async (req, res) => {
  try {
    const { Product, Category } = require('./models');
    
    // Get all products and categories for the store
    const store_id = '157d4590-49bf-4b0b-bd77-abe131909528';
    const products = await Product.findAll({ where: { store_id } });
    const categories = await Category.findAll({ where: { store_id } });
    
    console.log(`Found ${products.length} products and ${categories.length} categories`);
    
    let updated = 0;
    for (const product of products) {
      // Associate first product with Home & Garden category
      const homeGardenCategory = categories.find(cat => cat.slug === 'home-garden');
      if (homeGardenCategory && (!product.category_ids || product.category_ids.length === 0)) {
        await product.update({
          category_ids: [homeGardenCategory.id]
        });
        updated++;
        console.log(`Associated ${product.name} with ${homeGardenCategory.name}`);
      }
    }

    res.json({
      success: true,
      message: `Associated ${updated} products with categories`,
      products: products.length,
      categories: categories.length
    });
  } catch (error) {
    console.error('❌ Associate products failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to associate products',
      error: error.message
    });
  }
});

// Simple product test endpoint
app.get('/debug/test-products', async (req, res) => {
  try {
    console.log('🧪 Testing product queries...');
    
    const { Product, Store } = require('./models');
    
    // Test 1: Simple count
    const productCount = await Product.count();
    console.log('📊 Total products in database:', productCount);
    
    // Test 2: Simple findAll without associations
    const productsSimple = await Product.findAll({ limit: 5 });
    console.log('📦 Products (simple query):', productsSimple.length);
    
    // Test 3: Find products with store association (like the publicProducts route)
    try {
      const productsWithStore = await Product.findAll({
        limit: 2,
        include: [{
          model: Store,
          as: 'store',
          attributes: ['id', 'name', 'slug']
        }]
      });
      console.log('🏪 Products with store association:', productsWithStore.length);
    } catch (assocError) {
      console.error('❌ Association query failed:', assocError.message);
    }
    
    res.json({
      success: true,
      message: 'Product test completed',
      results: {
        total_count: productCount,
        simple_query_count: productsSimple.length,
        sample_products: productsSimple.map(p => ({ id: p.id, name: p.name, store_id: p.store_id }))
      }
    });
    
  } catch (error) {
    console.error('❌ Product test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Product test failed',
      error: error.message
    });
  }
});

// Complete database wipe and recreation
app.post('/debug/reset-db-complete', async (req, res) => {
  try {
    console.log('🗑️ Starting COMPLETE database wipe...');
    
    const fs = require('fs');
    const path = require('path');
    const { Client } = require('pg');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        message: 'DATABASE_URL not configured'
      });
    }

    // Create PostgreSQL client
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Drop ALL objects including types, functions, etc.
    console.log('🗑️ Step 1: Dropping ALL database objects...');
    
    // Drop all types first (including enums)
    const dropTypesQuery = `
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        -- Drop all custom types
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') 
        LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    try {
      await client.query(dropTypesQuery);
      console.log('✅ All custom types dropped');
    } catch (error) {
      console.log('⚠️ Type drop failed:', error.message);
    }

    // Drop all tables with CASCADE
    const dropTablesQuery = `
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        -- Drop all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
        LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    try {
      await client.query(dropTablesQuery);
      console.log('✅ All tables dropped with CASCADE');
    } catch (error) {
      console.log('⚠️ Table drop failed:', error.message);
    }

    // Drop all functions
    const dropFunctionsQuery = `
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        -- Drop all functions
        FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) 
        LOOP
          EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
        END LOOP;
      END $$;
    `;
    
    try {
      await client.query(dropFunctionsQuery);
      console.log('✅ All functions dropped');
    } catch (error) {
      console.log('⚠️ Function drop failed:', error.message);
    }

    // Drop all sequences
    const dropSequencesQuery = `
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        -- Drop all sequences
        FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') 
        LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequencename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    try {
      await client.query(dropSequencesQuery);
      console.log('✅ All sequences dropped');
    } catch (error) {
      console.log('⚠️ Sequence drop failed:', error.message);
    }

    // Verify everything is clean
    const verifyCleanQuery = `
      SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables,
        (SELECT COUNT(*) FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') as enums,
        (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as functions,
        (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public') as sequences;
    `;
    
    const cleanResult = await client.query(verifyCleanQuery);
    console.log('🔍 Database clean status:', cleanResult.rows[0]);

    // Step 2: Create all tables fresh
    console.log('\n📋 Step 2: Creating all tables from scratch...');
    const createSqlPath = path.join(__dirname, 'database/migrations/create-all-tables.sql');
    const createSqlContent = fs.readFileSync(createSqlPath, 'utf8');

    // Execute the entire creation script
    try {
      await client.query(createSqlContent);
      console.log('✅ Tables created successfully');
    } catch (error) {
      console.error('❌ Table creation failed:', error.message);
      
      // Try statement by statement if full script fails
      console.log('🔄 Trying statement-by-statement execution...');
      const statements = createSqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.query(statement);
            successCount++;
          } catch (stmtError) {
            errorCount++;
            console.error(`❌ Statement failed:`, stmtError.message);
          }
        }
      }
      
      console.log(`📊 Statement execution: ${successCount} success, ${errorCount} failed`);
    }

    // Verify final state
    const finalTablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    const finalTypesResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e'
      ORDER BY typname;
    `);

    await client.end();

    res.json({
      success: true,
      message: 'Complete database wipe and recreation successful',
      before_cleanup: cleanResult.rows[0],
      final_state: {
        tables_created: finalTablesResult.rows.length,
        enums_created: finalTypesResult.rows.length
      },
      tables: finalTablesResult.rows.map(row => row.tablename),
      enums: finalTypesResult.rows.map(row => row.typname)
    });

  } catch (error) {
    console.error('❌ Complete database reset failed:', error);
    res.status(500).json({
      success: false,
      message: 'Complete database reset failed',
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
app.use('/api/public/cms-blocks', cmsBlockRoutes);
app.use('/api/public/product-tabs', productTabRoutes);

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
app.use('/api/populate-attributes', populateAttributesRoutes);
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