const express = require('express');
const { body, validationResult } = require('express-validator');
const { Store, User } = require('../models');
const UserModel = require('../models/User'); // Direct import
const { authorize } = require('../middleware/auth');
const { sequelize, supabase } = require('../database/connection');
const { getUserAccessibleStores, getUserAccessibleStoresCount, getUserStoresForDropdown } = require('../utils/storeAccess');
const { Op } = require('sequelize');
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

// @route   GET /api/public/stores (when accessed via /api/public/stores)
// @desc    Get stores for public access (storefront)
// @access  Public
router.get('/', async (req, res) => {
  // Check if this is a public request (will be true when accessed via /api/public/stores)
  const isPublicRequest = req.originalUrl.includes('/api/public/stores');
  
  if (isPublicRequest) {
    try {
      const { id, slug, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        is_active: true // Only return active stores
      };

      if (id) {
        where.id = id;
      }
      else if (slug) {
        if (slug.includes('.')) {
          const CustomDomain = require('../models/CustomDomain');
          const domainRecord = await CustomDomain.findOne({
            where: {
              domain: slug,
              is_active: true,
              verification_status: 'verified'
            },
            attributes: ['store_id']
          });

          if (domainRecord) {
            where.id = domainRecord.store_id;
          } else {
            return res.json([]);
          }
        } else {
          where.slug = slug;
        }
      }

      const { count, rows } = await Store.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      // Return just the data array for public requests (for compatibility with frontend)
      return res.json(rows);
    } catch (error) {
      console.error('Get public stores error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
  
  // Continue with private store access (original code below)
  const authorize = require('../middleware/auth').authorize;
  
  // Apply authorization for private requests
  return authorize(['admin', 'store_owner'])(req, res, async () => {
    // Private store access logic will go here
    return privateStoreAccess(req, res);
  });
});

// Private store access function
async function privateStoreAccess(req, res) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    if (req.user.role === 'admin') {
      // Admin can see all stores (existing logic)
      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Store.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } else {
      // Regular users see only stores they own or are team members of
      const stores = await getUserAccessibleStores(req.user.id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        search,
        includeInactive: false
      });

      const totalCount = await getUserAccessibleStoresCount(req.user.id, {
        search,
        includeInactive: false
      });

      res.json({
        success: true,
        data: stores,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    }
  } catch (error) {
    console.error('Get user stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}


// @route   GET /api/stores/dropdown
// @desc    Get stores for dropdown/selection (minimal data)
// @access  Private
router.get('/dropdown', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    console.log(`🔍 Dropdown request from user: ${req.user.email} (role: ${req.user.role})`);
    
    // ALL USERS (including admins) should only see stores they have access to
    // This prevents unauthorized access to stores
    const stores = await getUserStoresForDropdown(req.user.id);
    
    console.log(`📊 Returning ${stores.length} stores for user ${req.user.email}`);
    stores.forEach(store => {
      console.log(`   - ${store.name} (${store.access_role})`);
    });

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Get stores dropdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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

    // Check ownership or team access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Add access info to response
      store.dataValues.access_info = {
        access_role: access.access_role,
        is_direct_owner: access.is_direct_owner,
        team_permissions: access.team_permissions
      };
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
      user_id: req.user.id  // Set the user_id for proper ownership
    };

    // Generate slug if not provided
    if (!storeData.slug) {
      storeData.slug = storeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    console.log('Final store data to create:', storeData);
    console.log('User ID from JWT:', req.user.id);
    console.log('User email from JWT:', req.user.email);
    console.log('User ID type:', typeof req.user.id);
    
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
      const existingUser = await UserModel.findOne({ where: { id: req.user.id } });
      
      if (!existingUser) {
        console.error('❌ User not found via Sequelize User.findOne');
        
        // Try direct SQL query as fallback with detailed debugging
        console.log('🔍 Trying direct SQL query...');
        console.log('Query user ID parameter:', JSON.stringify(req.user.id));
        
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
            'SELECT id, email FROM users ORDER BY created_at DESC LIMIT 5',
            { type: sequelize.QueryTypes.SELECT }
          );
          console.log('All users in database:');
          allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ID: "${user.id}", Email: "${user.email}"`);
            console.log(`   ID Match check: "${user.id}" === "${req.user.id}" = ${user.id === req.user.id}`);
          });
        } catch (listError) {
          console.error('❌ List users query failed:', listError.message);
        }
        
        // Now try the specific query with detailed logging
        const directResults = await sequelize.query(
          'SELECT id, email, role FROM users WHERE id = :id',
          { 
            replacements: { id: req.user.id },
            type: sequelize.QueryTypes.SELECT
          }
        );
        
        console.log('Direct query results:', directResults);
        console.log('Results length:', directResults.length);
        
        if (directResults.length > 0) {
          console.log('✅ User found via direct SQL:', directResults[0]);
          // Continue with store creation since user exists
        } else {
          console.error('❌ User not found in database with ID:', req.user.id);
          return res.status(400).json({
            success: false,
            message: 'User not found. Please log in again.',
            debug: {
              userId: req.user.id,
              userIdType: typeof req.user.id,
              sequelizeResult: 'not found',
              directSqlResult: 'not found'
            }
          });
        }
      } else {
        console.log('✅ User found in database via Sequelize:', {
          id: existingUser.id,
          email: existingUser.email,
          idMatch: existingUser.id === req.user.id
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

    // Create default root category for the new store
    try {
      const { createCategoryWithTranslations } = require('../utils/categoryTenantHelpers');

      const defaultRootCategory = await createCategoryWithTranslations(
        store.id,
        {
          slug: 'root',
          parent_id: null,
          is_active: true,
          hide_in_menu: false,
          sort_order: 0
        },
        {
          en: {
            name: 'Root Category',
            description: 'Default root category for store navigation'
          }
        }
      );

      // Update store settings with the root category ID
      await store.update({
        settings: {
          ...store.settings,
          rootCategoryId: defaultRootCategory.id,
          excludeRootFromMenu: true
        }
      });

      console.log('Default root category created:', defaultRootCategory.id);
    } catch (categoryError) {
      console.error('Error creating default root category:', categoryError);
      // Don't fail store creation if category creation fails
    }

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
    console.log('🐛 PUT /api/stores/:id DEBUG:', {
      storeId: req.params.id,
      body: req.body,
      user: req.user?.email,
      userRole: req.user?.role,
      bodySize: JSON.stringify(req.body).length
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      console.log('❌ Store not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership or team membership with editor+ permissions
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store.id);
      
      if (!access) {
        console.log('❌ Access denied. User has no access to store:', store.id);
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      console.log('✅ Access granted:', {
        userId: req.user.id,
        storeId: store.id,
        accessRole: access.access_role,
        isDirectOwner: access.is_direct_owner
      });
    }

    console.log('🔄 Updating store with data:', {
      storeId: req.params.id,
      hasSettings: !!req.body.settings,
      settingsKeys: req.body.settings ? Object.keys(req.body.settings) : [],
      settingsValues: req.body.settings ? JSON.stringify(req.body.settings).substring(0, 200) : 'none',
      otherFields: Object.keys(req.body).filter(key => key !== 'settings')
    });
    
    // Log current settings before update
    console.log('📝 Current store settings before update:', JSON.stringify(store.settings));
    console.log('📝 Settings type:', typeof store.settings);
    console.log('📝 Incoming settings:', JSON.stringify(req.body.settings));
    console.log('📝 Incoming settings type:', typeof req.body.settings);

    // Update the store directly
    if (req.body.settings) {
      console.log('🔧 Merging settings with existing store settings');
      
      // Merge with existing settings to avoid overwriting other settings
      const currentSettings = store.settings || {};
      const mergedSettings = {
        ...currentSettings,
        ...req.body.settings
      };
      
      console.log('🔄 Merged settings:', JSON.stringify(mergedSettings));
      await store.update({ settings: mergedSettings });
      console.log('✅ Settings field updated with merge');
    }
    
    // Update other fields if they exist
    const otherFields = { ...req.body };
    delete otherFields.settings;
    
    if (Object.keys(otherFields).length > 0) {
      console.log('🔧 Updating other fields:', Object.keys(otherFields));
      await store.update(otherFields);
      console.log('✅ Other fields updated');
    }
    
    console.log('✅ Store update completed');
    
    // Reload the store to get the updated data
    await store.reload();
    console.log('🔄 Reloaded store data:', {
      hasSettings: !!store.settings,
      settingsKeys: store.settings ? Object.keys(store.settings) : [],
      settingsData: JSON.stringify(store.settings)
    });
    
    // Double-check by querying directly
    const verifyStore = await Store.findByPk(store.id);
    console.log('🔍 Verification query - settings:', JSON.stringify(verifyStore.settings));

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: verifyStore // Use the verification query result instead of the reloaded store
    });
  } catch (error) {
    console.error('Update store error:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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

    // Check ownership or team membership with editor+ permissions
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

// @route   GET /api/stores/:id/settings
// @desc    Get store settings
// @access  Private
router.get('/:id/settings', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership or team access
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

    res.json({
      success: true,
      settings: store.settings || {}
    });
  } catch (error) {
    console.error('Get store settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/stores/:id/settings
// @desc    Update store settings
// @access  Private
router.put('/:id/settings', authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    console.log('🐛 PUT /api/stores/:id/settings DEBUG:', {
      storeId: req.params.id,
      body: req.body,
      hasSettings: !!req.body.settings,
      settingsKeys: req.body.settings ? Object.keys(req.body.settings) : [],
      currency: req.body.currency,
      user: req.user?.email
    });

    const store = await Store.findByPk(req.params.id);

    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check ownership or team access
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

    console.log('📝 Current store before update:', {
      currency: store.currency,
      settings: JSON.stringify(store.settings)
    });
    console.log('📝 Incoming request body:', {
      currency: req.body.currency,
      settings: JSON.stringify(req.body.settings)
    });

    // Merge with existing settings
    const currentSettings = store.settings || {};
    const incomingSettings = req.body.settings || {};
    const mergedSettings = {
      ...currentSettings,
      ...incomingSettings
    };

    console.log('🔄 Merged settings to save:', JSON.stringify(mergedSettings));

    // Update store with merged settings
    await store.update({ settings: mergedSettings });

    // Also update other fields if provided (like name, description, contact info, currency, etc.)
    const otherFields = { ...req.body };
    delete otherFields.settings;

    if (Object.keys(otherFields).length > 0) {
      console.log('🔧 Updating other fields:', Object.keys(otherFields), otherFields);
      await store.update(otherFields);
    }

    // Reload to verify
    await store.reload();
    console.log('✅ Store saved successfully:', {
      currency: store.currency,
      settings: JSON.stringify(store.settings)
    });

    res.json({
      success: true,
      message: 'Store settings updated successfully',
      data: store,
      settings: store.settings
    });
  } catch (error) {
    console.error('Update store settings error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;