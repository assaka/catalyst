const express = require('express');
const { body, validationResult } = require('express-validator');
const { Store } = require('../models');
const { authorize } = require('../middleware/auth');
const { sequelize } = require('../database/connection');
const router = express.Router();

// Initialize stores table on module load
const initializeStoresTable = async () => {
  try {
    console.log('Initializing stores table...');
    await Store.sync({ alter: true });
    console.log('✅ Stores table initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize stores table:', error.message);
  }
};

// Initialize table
initializeStoresTable();

// @route   GET /api/stores/setup
// @desc    Setup stores table
// @access  Public (for debugging)
router.get('/setup', async (req, res) => {
  try {
    console.log('Setting up stores table...');
    await Store.sync({ alter: true });
    console.log('Stores table setup completed');
    res.json({
      success: true,
      message: 'Stores table setup completed'
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Setup failed',
      error: error.message
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
router.get('/', async (req, res) => {
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

    res.json({
      success: true,
      data: {
        stores: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/stores/:id
// @desc    Get store by ID
// @access  Private
router.get('/:id', async (req, res) => {
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
router.post('/', [
  body('name').notEmpty().withMessage('Store name is required'),
  body('slug').optional().isString().isLength({ min: 1 }).withMessage('Slug cannot be empty if provided'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    console.log('Store creation request received:', req.body);
    console.log('User info:', { email: req.user.email, role: req.user.role });
    
    // Test database connection and table existence
    try {
      await Store.findAll({ limit: 1 });
      console.log('Database connection test passed');
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      
      // If table doesn't exist, try to create it
      if (dbError.name === 'SequelizeDatabaseError' && dbError.message.includes('does not exist')) {
        try {
          console.log('Attempting to create stores table...');
          await Store.sync({ alter: true });
          console.log('Stores table created successfully');
        } catch (syncError) {
          console.error('Failed to create stores table:', syncError);
          return res.status(500).json({
            success: false,
            message: 'Failed to create stores table',
            error: syncError.message
          });
        }
      } else {
        return res.status(500).json({
          success: false,
          message: 'Database connection failed',
          error: dbError.message
        });
      }
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
router.put('/:id', [
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
router.delete('/:id', async (req, res) => {
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