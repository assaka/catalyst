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
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const attributeRoutes = require('./routes/attributes');
const cmsRoutes = require('./routes/cms');
const shippingRoutes = require('./routes/shipping');
const taxRoutes = require('./routes/tax');
const deliveryRoutes = require('./routes/delivery');
const oauthTestRoutes = require('./routes/oauth-test');
const dbTestRoutes = require('./routes/db-test');
const dbInitRoutes = require('./routes/db-init');
const dbSetupRoutes = require('./routes/db-setup');
const migrateRoutes = require('./routes/migrate');
const migrateSupabaseRoutes = require('./routes/migrate-supabase');

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

// Public database migration endpoint
app.post('/debug/migrate', async (req, res) => {
  try {
    console.log('🔄 Running database migration...');
    
    // Import all models to ensure they're synced
    const { User, Store, Product, Category, Order, OrderItem, Coupon, CmsPage, Tax, ShippingMethod, DeliverySettings } = require('./models');
    
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
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/stores', authMiddleware, storeRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/coupons', authMiddleware, couponRoutes);
app.use('/api/attributes', authMiddleware, attributeRoutes);
app.use('/api/cms', authMiddleware, cmsRoutes);
app.use('/api/shipping', authMiddleware, shippingRoutes);
app.use('/api/tax', authMiddleware, taxRoutes);
app.use('/api/delivery', authMiddleware, deliveryRoutes);
app.use('/api/oauth-test', oauthTestRoutes);
app.use('/api/db-test', dbTestRoutes);
app.use('/api/db-init', dbInitRoutes);
app.use('/api/db-setup', dbSetupRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/migrate-supabase', migrateSupabaseRoutes);

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