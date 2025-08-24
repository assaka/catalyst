const express = require('express');
const { body, validationResult } = require('express-validator');
const { Product, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Import the new store auth middleware
const { checkStoreOwnership: storeAuthMiddleware, checkResourceOwnership } = require('../middleware/storeAuth');

// @route   GET /api/products
// @desc    Get products (authenticated users only)
// @access  Private
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, category_id, status, search, slug, sku, id } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Admin Products API called with params:', req.query);
    console.log('📊 Status parameter:', status, typeof status);

    const where = {};
    
    // Filter by store access (ownership + team membership)
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const userStoreIds = accessibleStores.map(store => store.id);
      

      // If a specific store_id is requested, check if user owns it
      if (store_id) {
        if (userStoreIds.includes(store_id)) {
          where.store_id = store_id;
        } else {
          // Return empty result if user doesn't own the requested store
          return res.json({
            success: true,
            data: {
              products: [],
              pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: 0,
                total_pages: 0
              }
            }
          });
        }
      } else {
        // No specific store requested, filter by all user's stores
        where.store_id = { [Op.in]: userStoreIds };
      }
    } else {
      // Admin user - can access any store
      if (store_id) where.store_id = store_id;
    }
    if (category_id) {
      // category_ids is stored as JSON array, need to check if it contains the category_id
      where.category_ids = { [Op.contains]: [category_id] };
    }
    if (status) where.status = status;
    if (slug) {
      where.slug = slug;
    }
    if (sku) {
      where.sku = sku;
    }
    if (id) {
      where.id = id;
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    console.log('🔎 Final WHERE clause for products query:', JSON.stringify(where, null, 2));

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{
        model: Store,
        attributes: ['id', 'name']
      }]
    });


    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.Store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', 
  authMiddleware, 
  authorize(['admin', 'store_owner']), 
  storeAuthMiddleware, // Check store ownership
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('price').isDecimal().withMessage('Price must be a valid decimal'),
    body('store_id').isUUID().withMessage('Store ID must be a valid UUID')
  ], 
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id } = req.body;

    // Store ownership check is now handled by middleware

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', 
  authMiddleware, 
  authorize(['admin', 'store_owner']),
  checkResourceOwnership('Product'), // Check if user owns the product's store
  [
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
    body('price').optional().isDecimal().withMessage('Price must be a valid decimal')
  ], 
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.Store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await product.update(req.body);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.Store.id);
      
      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;