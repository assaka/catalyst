const express = require('express');
const { body, validationResult } = require('express-validator');
const { Product, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Helper function to check store ownership
const checkStoreOwnership = async (storeId, userEmail, userRole) => {
  if (userRole === 'admin') return true;
  
  const store = await Store.findByPk(storeId);
  return store && store.owner_email === userEmail;
};

// @route   GET /api/products
// @desc    Get products
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, store_id, category_id, status, search, slug } = req.query;
    const offset = (page - 1) * limit;

    console.log('🔍 Products GET request received:', {
      page, limit, store_id, category_id, status, search, slug,
      userRole: req.user?.role,
      userEmail: req.user?.email
    });

    const where = {};
    
    // Filter by store ownership
    if (req.user.role !== 'admin') {
      const userStores = await Store.findAll({
        where: { owner_email: req.user.email },
        attributes: ['id']
      });
      const storeIds = userStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
      
      console.log('🔍 User store ownership filter applied:', {
        userEmail: req.user.email,
        userStoreIds: storeIds
      });
    }

    if (store_id) where.store_id = store_id;
    if (category_id) where.category_id = category_id;
    if (status) where.status = status;
    if (slug) where.slug = slug;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    console.log('🔍 Final where clause for product query:', JSON.stringify(where, null, 2));

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

    console.log('🔍 Product query results:', {
      totalCount: count,
      productsFound: rows.length,
      productSlugs: rows.map(p => p.slug),
      firstProductSample: rows[0] ? {
        id: rows[0].id,
        name: rows[0].name,
        slug: rows[0].slug,
        sku: rows[0].sku,
        status: rows[0].status,
        store_id: rows[0].store_id
      } : 'No products found'
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
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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
router.post('/', [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isDecimal().withMessage('Price must be a valid decimal'),
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id } = req.body;

    // Check store ownership
    const hasAccess = await checkStoreOwnership(store_id, req.user.email, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

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
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
  body('price').optional().isDecimal().withMessage('Price must be a valid decimal')
], async (req, res) => {
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
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
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