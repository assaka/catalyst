const express = require('express');
const { body, validationResult } = require('express-validator');
const { Store } = require('../models');
const { authorize } = require('../middleware/auth');
const router = express.Router();

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

    res.status(500).json({
      success: false,
      message: 'Server error'
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