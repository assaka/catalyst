const express = require('express');
const { body, validationResult } = require('express-validator');
const { ProductLabel } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const translationService = require('../services/translation-service');

const router = express.Router();

// Optional auth middleware that doesn't block public requests
const optionalAuth = (req, res, next) => {
  // Check if this is a public request
  if (req.originalUrl.includes('/api/public/')) {
    // For public requests, skip authentication
    return next();
  }
  // For non-public requests, require authentication
  return authMiddleware(req, res, next);
};

// @route   GET /api/product-labels
// @desc    Get all product labels for a store
// @access  Public/Private
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { store_id, is_active } = req.query;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/product-labels');

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const whereClause = { store_id };
    
    if (isPublicRequest) {
      // Public access - only return active labels
      whereClause.is_active = true;
    } else {
      // Authenticated access - check authentication
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }
    }

    const labels = await ProductLabel.findAll({
      where: whereClause,
      order: [['sort_order', 'ASC'], ['priority', 'DESC'], ['name', 'ASC']]
    });

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(labels);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: { product_labels: labels }
      });
    }
  } catch (error) {
    console.error('Get product labels error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/product-labels/:id
// @desc    Get single product label
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const label = await ProductLabel.findByPk(req.params.id);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    res.json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('Get product label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-labels/test
// @desc    Create a test product label for debugging
// @access  Private
router.post('/test', authMiddleware, async (req, res) => {
  try {
    console.log('🧪 Creating test product label...');
    
    const testLabelData = {
      store_id: req.body.store_id || req.query.store_id,
      name: 'Test Label - Debug',
      slug: 'test-label-debug',
      text: 'TEST',
      background_color: '#FF0000',
      color: '#FFFFFF',
      position: 'top-right',
      is_active: true,
      conditions: {}
    };
    
    console.log('🧪 Test label data:', testLabelData);
    
    const label = await ProductLabel.create(testLabelData);
    console.log('✅ Test label created successfully:', label.toJSON());
    
    res.status(201).json({
      success: true,
      data: label,
      message: 'Test label created successfully'
    });
  } catch (error) {
    console.error('❌ Create test label error:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error: error.name
    });
  }
});

// @route   POST /api/product-labels
// @desc    Create a new product label
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Creating product label with data:', req.body);
    console.log('🔍 Priority field debug (backend):', {
      priority: req.body.priority,
      priorityType: typeof req.body.priority,
      sort_order: req.body.sort_order,
      sortOrderType: typeof req.body.sort_order
    });
    
    // Ensure slug is generated if not provided (fallback for hook issues)
    const labelData = { ...req.body };
    if (!labelData.slug && labelData.name) {
      labelData.slug = labelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      console.log('🔧 Fallback slug generation:', labelData.slug);
    }
    
    const label = await ProductLabel.create(labelData);
    console.log('✅ Product label created successfully:', label.toJSON());
    console.log('✅ Created label priority field:', {
      priority: label.priority,
      sort_order: label.sort_order
    });
    res.status(201).json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('❌ Create product label error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      sql: error.sql
    });
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error: error.name
    });
  }
});

// @route   PUT /api/product-labels/:id
// @desc    Update product label
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Updating product label with data:', req.body);
    console.log('🔍 Priority field debug (backend update):', {
      priority: req.body.priority,
      priorityType: typeof req.body.priority,
      sort_order: req.body.sort_order,
      sortOrderType: typeof req.body.sort_order
    });
    
    const label = await ProductLabel.findByPk(req.params.id);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    await label.update(req.body);
    console.log('✅ Updated label priority field:', {
      priority: label.priority,
      sort_order: label.sort_order
    });
    res.json({
      success: true,
      data: label
    });
  } catch (error) {
    console.error('Update product label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/product-labels/:id
// @desc    Delete product label
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const label = await ProductLabel.findByPk(req.params.id);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    await label.destroy();
    res.json({
      success: true,
      message: 'Product label deleted successfully'
    });
  } catch (error) {
    console.error('Delete product label error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/product-labels/:id/translate
// @desc    AI translate a single product label to target language
// @access  Private
router.post('/:id/translate', authMiddleware, [
  body('fromLang').notEmpty().withMessage('Source language is required'),
  body('toLang').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fromLang, toLang } = req.body;
    const productLabel = await ProductLabel.findByPk(req.params.id);

    if (!productLabel) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, productLabel.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!productLabel.translations || !productLabel.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this product label`
      });
    }

    // Translate the product label
    const updatedLabel = await translationService.aiTranslateEntity('product_label', req.params.id, fromLang, toLang);

    res.json({
      success: true,
      message: `Product label translated to ${toLang} successfully`,
      data: updatedLabel
    });
  } catch (error) {
    console.error('Translate product label error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/product-labels/bulk-translate
// @desc    AI translate all product labels in a store to target language
// @access  Private
router.post('/bulk-translate', authMiddleware, [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('fromLang').notEmpty().withMessage('Source language is required'),
  body('toLang').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, fromLang, toLang } = req.body;

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get all product labels for this store
    const labels = await ProductLabel.findAll({
      where: { store_id },
      order: [['sort_order', 'ASC'], ['priority', 'DESC'], ['name', 'ASC']]
    });

    if (labels.length === 0) {
      return res.json({
        success: true,
        message: 'No product labels found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each label
    const results = {
      total: labels.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const label of labels) {
      try {
        // Check if source translation exists
        if (!label.translations || !label.translations[fromLang]) {
          results.skipped++;
          continue;
        }

        // Check if target translation already exists
        if (label.translations[toLang]) {
          results.skipped++;
          continue;
        }

        // Translate the label
        await translationService.aiTranslateEntity('product_label', label.id, fromLang, toLang);
        results.translated++;
      } catch (error) {
        console.error(`Error translating product label ${label.id}:`, error);
        results.failed++;
        results.errors.push({
          labelId: label.id,
          labelText: label.translations?.[fromLang]?.text || label.text,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate product labels error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;