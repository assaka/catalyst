const express = require('express');
const { body, validationResult } = require('express-validator');
const { Store, User } = require('../models');
const UserModel = require('../models/User'); // Direct import
const { authorize } = require('../middleware/auth');
const { sequelize, supabase } = require('../database/connection');
const router = express.Router();

// Initialize stores table on module load with retry logic
const initializeStoresTable = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Initializing stores table... (${i + 1}/${retries})`);
      
      // First check if we can connect to the database
      await sequelize.authenticate();
      console.log('✅ Database connection verified');
      
      // Now sync the stores table
      await Store.sync({ alter: true });
      console.log('✅ Stores table initialized successfully');
      
      // Test if we can query the table
      const storeCount = await Store.count();
      console.log(`📊 Current stores count: ${storeCount}`);
      
      // Success, exit the loop
      return;
      
    } catch (error) {
      console.error(`❌ Database connection failed (${i + 1}/${retries}):`, error.message);
      if (i < retries - 1) {
        console.log('🔄 Retrying database connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.log('⚠️  Database connection failed. Server will continue without database.');
      }
    }
  }
};

// Initialize table with retry logic
initializeStoresTable().catch(() => {
  console.log('');
  console.log('✅ Server startup completed successfully!');
  console.log('⚠️  Some features may not work properly.');
});

// @route   GET /api/stores/health
// @desc    Simple health check
// @access  Public (for debugging)
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Stores API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// @route   GET /api/stores/setup
// @desc    Setup stores table
// @access  Public (for debugging)
router.get('/setup', async (req, res) => {
  try {
    console.log('🔄 Setting up stores table...');
    
    // Check database connection first
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Sync the stores table
    await Store.sync({ alter: true });
    console.log('✅ Stores table setup completed');
    
    // Test table by counting records
    const storeCount = await Store.count();
    console.log(`📊 Current stores count: ${storeCount}`);
    
    res.json({
      success: true,
      message: 'Stores table setup completed',
      storeCount: storeCount
    });
  } catch (error) {
    console.error('❌ Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Setup failed',
      error: error.message,
      details: {
        name: error.name,
        code: error.code
      }
    });
  }
});

// @route   POST /api/stores/migrate
// @desc    Run database migration for stores
// @access  Public (for debugging)
router.post('/migrate', async (req, res) => {
  try {
    console.log('🔄 Running database migration...');
    
    // Import all models to ensure they're synced
    const { User, Store, Product, Category, Order, OrderItem, Coupon, CmsPage, Tax, ShippingMethod, DeliverySettings } = require('../models');
    
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

// @route   GET /api/stores/test-connection
// @desc    Test basic database connection
// @access  Public (for debugging)
router.get('/test-connection', async (req, res) => {
  console.log('🔍 Starting database connection test...');
  
  try {
    // Log environment variables (without revealing sensitive data)
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
      } catch (supabaseError) {
        supabaseStatus = `Error: ${supabaseError.message}`;
        console.log('❌ Supabase connection error:', supabaseError);
      }
    } else {
      console.log('⚠️  Supabase client not initialized');
    }
    
    // Test if we can create a simple table
    let tableTestStatus = 'Not tested';
    try {
      await sequelize.query('SELECT 1 as test');
      tableTestStatus = 'Query successful';
    } catch (queryError) {
      tableTestStatus = `Query failed: ${queryError.message}`;
    }
    
    res.json({
      success: true,
      message: 'Database connection successful',
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
        query: tableTestStatus
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        hasDatabaseUrl: !!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)
      }
    });
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
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

// @route   GET /api/stores/debug
// @desc    Debug stores table and model
// @access  Public (for debugging)
router.get('/debug', async (req, res) => {
  try {
    console.log('Running stores debug...');
    
    // Test 1: Check if Store model is defined
    const modelInfo = {
      name: Store.name,
      tableName: Store.tableName,
      attributes: Object.keys(Store.rawAttributes)
    };
    console.log('Store model info:', modelInfo);
    
    // Test 2: Test database connection
    await sequelize.authenticate();
    console.log('Database connection: OK');
    
    // Test 3: Try to describe the table
    let tableExists = true;
    try {
      const tableDescription = await sequelize.getQueryInterface().describeTable(Store.tableName);
      console.log('Table description:', tableDescription);
    } catch (describeError) {
      console.log('Table describe error:', describeError.message);
      tableExists = false;
    }
    
    // Test 4: Try to find all stores
    let storesData = [];
    try {
      storesData = await Store.findAll({ limit: 5 });
      console.log(`Found ${storesData.length} stores`);
    } catch (findError) {
      console.log('Find stores error:', findError.message);
    }
    
    res.json({
      success: true,
      message: 'Debug completed',
      debug: {
        model: modelInfo,
        tableExists,
        storeCount: storesData.length
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// @route   GET /api/stores
// @desc    Get user's stores
// @access  Private
router.get('/', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Admin can see all stores, others see only their own
    if (req.user.role !== 'admin') {
      where.owner_email = req.user.email;
    }

    const { count, rows } = await Store.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Return direct array for frontend compatibility
    // The frontend expects stores as a direct array, not nested in data object
    res.json(rows);
  } catch (error) {
    console.error('Get stores error:', error);
    // Return empty array to prevent frontend .map() errors
    res.json([]);
  }
});

// @route   GET /api/stores/:id
// @desc    Get store by ID
// @access  Private
router.get('/:id', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: store
    });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/stores
// @desc    Create new store
// @access  Private
router.post('/', authorize(['admin', 'store_owner']), [
  body('name').notEmpty().withMessage('Store name is required'),
  body('slug').optional().isString().isLength({ min: 1 }).withMessage('Slug cannot be empty if provided'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    console.log('Store creation request received:', req.body);
    console.log('User info from JWT:', { 
      id: req.user.id,
      email: req.user.email, 
      role: req.user.role,
      fullUserObject: req.user
    });
    
    // Ensure table exists (lightweight check)
    try {
      await Store.sync({ alter: false }); // Don't alter, just sync
      console.log('✅ Stores table verified');
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const storeData = {
      ...req.body,
      owner_email: req.user.email
    };

    // Generate slug if not provided
    if (!storeData.slug) {
      storeData.slug = storeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    console.log('Final store data to create:', storeData);
    console.log('User email from JWT:', req.user.email);
    console.log('User email type:', typeof req.user.email);
    console.log('User email length:', req.user.email?.length);
    
    // Verify the user exists in the database before creating store
    console.log('🔍 Verifying user exists before store creation...');
    console.log('User model info:', {
      name: User.name,
      tableName: User.tableName,
      tableNameFromOptions: User.options?.tableName
    });
    console.log('UserModel (direct) info:', {
      name: UserModel.name,
      tableName: UserModel.tableName,
      tableNameFromOptions: UserModel.options?.tableName
    });
    
    try {
      // First, ensure the User model is synced
      console.log('🔍 Syncing UserModel (direct)...');
      await UserModel.sync({ alter: false });
      console.log('✅ UserModel synced');
      
      // Try Sequelize User.findOne first
      console.log('🔍 Trying UserModel.findOne...');
      const existingUser = await UserModel.findOne({ where: { email: req.user.email } });
      
      if (!existingUser) {
        console.error('❌ User not found via Sequelize User.findOne');
        
        // Try direct SQL query as fallback with detailed debugging
        console.log('🔍 Trying direct SQL query...');
        console.log('Query email parameter:', JSON.stringify(req.user.email));
        
        // First, let's check if we can connect and see what tables exist
        console.log('🔍 Testing database connection...');
        try {
          const [tables] = await sequelize.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 5",
            { type: sequelize.QueryTypes.SELECT }
          );
          console.log('✅ Database connection works, sample tables:', tables.map(t => t.tablename));
        } catch (tableError) {
          console.error('❌ Database connection failed:', tableError.message);
        }
        
        // Check total user count
        console.log('🔍 Checking total user count...');
        try {
          const [countResult] = await sequelize.query(
            'SELECT COUNT(*) as total FROM users',
            { type: sequelize.QueryTypes.SELECT }
          );
          console.log(`✅ Total users in database: ${countResult[0].total}`);
        } catch (countError) {
          console.error('❌ Count query failed:', countError.message);
        }
        
        // List all users to compare
        console.log('🔍 Listing all users for comparison...');
        try {
          const allUsers = await sequelize.query(
            'SELECT email, LENGTH(email) as email_length FROM users ORDER BY created_at DESC LIMIT 5',
            { type: sequelize.QueryTypes.SELECT }
          );
          console.log('All users in database:');
          allUsers.forEach((user, index) => {
            console.log(`${index + 1}. "${user.email}" (length: ${user.email_length})`);
            console.log(`   Match check: "${user.email}" === "${req.user.email}" = ${user.email === req.user.email}`);
          });
        } catch (listError) {
          console.error('❌ List users query failed:', listError.message);
        }
        
        // Now try the specific query with detailed logging
        const directResults = await sequelize.query(
          'SELECT id, email, role FROM users WHERE email = :email',
          { 
            replacements: { email: req.user.email },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        console.log('Direct query results:', directResults);
        console.log('Results length:', directResults.length);
        
        if (directResults.length > 0) {
          console.log('✅ User found via direct SQL:', directResults[0]);
          // Continue with store creation since user exists
        } else {
          console.error('❌ User not found in database with email:', req.user.email);
          
          // Try case-insensitive search as last resort
          console.log('🔍 Trying case-insensitive search...');
          const caseInsensitiveResults = await sequelize.query(
            'SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(:email)',
            { 
              replacements: { email: req.user.email },
              type: sequelize.QueryTypes.SELECT
            }
          );
          
          if (caseInsensitiveResults.length > 0) {
            console.log('✅ User found via case-insensitive search:', caseInsensitiveResults[0]);
            // Continue with store creation
          } else {
            return res.status(400).json({
              success: false,
              message: 'User not found. Please log in again.',
              debug: {
                userEmail: req.user.email,
                userEmailType: typeof req.user.email,
                sequelizeResult: 'not found',
                directSqlResult: 'not found',
                caseInsensitiveResult: 'not found',
                totalUsersInDb: 'check logs'
              }
            });
          }
        }
      } else {
        console.log('✅ User found in database via Sequelize:', {
          id: existingUser.id,
          email: existingUser.email,
          emailMatch: existingUser.email === req.user.email
        });
      }
    } catch (userCheckError) {
      console.error('❌ Error checking user existence:', userCheckError);
      return res.status(500).json({
        success: false,
        message: 'Database error while verifying user',
        error: userCheckError.message
      });
    }

    // Check for duplicate slug
    const existingStore = await Store.findOne({ where: { slug: storeData.slug } });
    if (existingStore) {
      console.log('Duplicate slug found:', storeData.slug);
      return res.status(400).json({
        success: false,
        message: 'A store with this slug already exists'
      });
    }

    const store = await Store.create(storeData);
    console.log('Store created successfully:', store.id);

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: store
    });
  } catch (error) {
    console.error('Create store error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Unique constraint error:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'A store with this slug already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      console.log('Validation error:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      console.log('Database error:', error.message);
      return res.status(500).json({
        success: false,
        message: `Database error: ${error.message}`
      });
    }

    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update store
// @access  Private
router.put('/:id', authorize(['admin', 'store_owner']), [
  body('name').optional().notEmpty().withMessage('Store name cannot be empty'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await store.update(req.body);

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: store
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/stores/:id
// @desc    Delete store
// @access  Private
router.delete('/:id', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await store.destroy();

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;