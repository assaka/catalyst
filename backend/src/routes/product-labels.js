const express = require('express');
const { ProductLabel } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/product-labels
// @desc    Get all product labels for a store
// @access  Public/Private
router.get('/', auth, async (req, res) => {
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
      order: [['priority', 'DESC'], ['name', 'ASC']]
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
router.get('/:id', auth, async (req, res) => {
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
router.post('/test', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
  try {
    console.log('🔍 Creating product label with data:', req.body);
    
    // Ensure slug is generated if not provided (fallback for hook issues)
    const labelData = { ...req.body };
    if (!labelData.slug && labelData.name) {
      labelData.slug = labelData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      console.log('🔧 Fallback slug generation:', labelData.slug);
    }
    
    const label = await ProductLabel.create(labelData);
    console.log('✅ Product label created successfully:', label);
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
router.put('/:id', auth, async (req, res) => {
  try {
    const label = await ProductLabel.findByPk(req.params.id);

    if (!label) {
      return res.status(404).json({
        success: false,
        message: 'Product label not found'
      });
    }

    await label.update(req.body);
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
router.delete('/:id', auth, async (req, res) => {
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

module.exports = router;