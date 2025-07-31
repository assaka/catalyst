const express = require('express');
const { body, validationResult } = require('express-validator');
const { ProductTab, Store } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/product-tabs
// @desc    Get product tabs for a store
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const productTabs = await ProductTab.findAll({
      where: { 
        store_id,
        is_active: true
      },
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // Check if this is a public request - return just the array for consistency with other public APIs
    const isPublicRequest = req.originalUrl.includes('/api/public/product-tabs');
    
    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility with StorefrontBaseEntity)
      res.json(productTabs);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: productTabs
      });
    }
  } catch (error) {
    console.error('Get product tabs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/product-tabs/:id
// @desc    Get product tab by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const productTab = await ProductTab.findByPk(req.params.id);
    
    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    res.json({
      success: true,
      data: productTab
    });
  } catch (error) {
    console.error('Get product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-tabs
// @desc    Create new product tab
// @access  Private
router.post('/', auth, [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('tab_type').optional().isIn(['text', 'description', 'attributes', 'attribute_sets']).withMessage('Invalid tab type'),
  body('content').optional().isString(),
  body('attribute_ids').optional().isArray().withMessage('Attribute IDs must be an array'),
  body('attribute_set_ids').optional().isArray().withMessage('Attribute set IDs must be an array'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, name, tab_type, content, attribute_ids, attribute_set_ids, sort_order, is_active } = req.body;

    // Check store ownership
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    if (req.user.role !== 'admin' && store.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Ensure name is properly trimmed and not empty
    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Tab name cannot be empty'
      });
    }

    // Generate slug from name before creating
    const generatedSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const finalSlug = generatedSlug || `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔧 Route: Creating ProductTab with explicit slug:', { name: trimmedName, slug: finalSlug });

    const productTab = await ProductTab.create({
      store_id,
      name: trimmedName,
      slug: finalSlug,
      tab_type: tab_type || 'text',
      content: content || '',
      attribute_ids: attribute_ids || [],
      attribute_set_ids: attribute_set_ids || [],
      sort_order: sort_order || 0,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      message: 'Product tab created successfully',
      data: productTab
    });
  } catch (error) {
    console.error('Create product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/product-tabs/:id
// @desc    Update product tab
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('tab_type').optional().isIn(['text', 'description', 'attributes', 'attribute_sets']).withMessage('Invalid tab type'),
  body('content').optional().isString(),
  body('attribute_ids').optional().isArray().withMessage('Attribute IDs must be an array'),
  body('attribute_set_ids').optional().isArray().withMessage('Attribute set IDs must be an array'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const productTab = await ProductTab.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['user_id'] }]
    });
    
    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && productTab.Store.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await productTab.update(req.body);

    res.json({
      success: true,
      message: 'Product tab updated successfully',
      data: productTab
    });
  } catch (error) {
    console.error('Update product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/product-tabs/:id
// @desc    Delete product tab
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const productTab = await ProductTab.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['user_id'] }]
    });
    
    if (!productTab) {
      return res.status(404).json({
        success: false,
        message: 'Product tab not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && productTab.Store.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await productTab.destroy();

    res.json({
      success: true,
      message: 'Product tab deleted successfully'
    });
  } catch (error) {
    console.error('Delete product tab error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;