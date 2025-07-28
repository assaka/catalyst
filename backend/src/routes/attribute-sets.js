const express = require('express');
const { AttributeSet } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Conditional auth middleware
const conditionalAuth = (req, res, next) => {
  const isPublicRequest = req.originalUrl.includes('/api/public/attribute-sets');
  if (isPublicRequest) {
    next();
  } else {
    auth(req, res, next);
  }
};

router.get('/', conditionalAuth, async (req, res) => {
  try {
    const { store_id } = req.query;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/attribute-sets');

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const attributeSets = await AttributeSet.findAll({
      where: { store_id },
      order: [['name', 'ASC']]
    });

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(attributeSets);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: { attribute_sets: attributeSets }
      });
    }
  } catch (error) {
    console.error('Get attribute sets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/attribute-sets/:id
// @desc    Get single attribute set
// @access  Public/Private
router.get('/:id', conditionalAuth, async (req, res) => {
  try {
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/attribute-sets');

    const attributeSet = await AttributeSet.findByPk(req.params.id);

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: 'Attribute set not found'
      });
    }

    if (isPublicRequest) {
      // Return just the data for public requests
      res.json(attributeSet);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: attributeSet
      });
    }
  } catch (error) {
    console.error('Get attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/attribute-sets
// @desc    Create a new attribute set
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const attributeSet = await AttributeSet.create(req.body);
    res.status(201).json({
      success: true,
      data: attributeSet
    });
  } catch (error) {
    console.error('Create attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/attribute-sets/:id
// @desc    Update attribute set
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findByPk(req.params.id);

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: 'Attribute set not found'
      });
    }

    await attributeSet.update(req.body);
    res.json({
      success: true,
      data: attributeSet
    });
  } catch (error) {
    console.error('Update attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/attribute-sets/:id
// @desc    Delete attribute set
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const attributeSet = await AttributeSet.findByPk(req.params.id);

    if (!attributeSet) {
      return res.status(404).json({
        success: false,
        message: 'Attribute set not found'
      });
    }

    await attributeSet.destroy();
    res.json({
      success: true,
      message: 'Attribute set deleted successfully'
    });
  } catch (error) {
    console.error('Delete attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;