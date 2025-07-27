const express = require('express');
const { SeoTemplate } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/seo-templates
// @desc    Get SEO templates for a store
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    const { store_id, page_type } = req.query;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/seo-templates');

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    if (!isPublicRequest) {
      // Authenticated access - check authentication
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
    }

    const whereClause = { store_id };
    if (page_type) whereClause.page_type = page_type;

    const templates = await SeoTemplate.findAll({
      where: whereClause,
      order: [['page_type', 'ASC']]
    });

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(templates);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: { seo_templates: templates }
      });
    }
  } catch (error) {
    console.error('Get SEO templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/seo-templates/:id
// @desc    Get single SEO template
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await SeoTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Get SEO template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/seo-templates
// @desc    Create a new SEO template
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const template = await SeoTemplate.create(req.body);
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Create SEO template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/seo-templates/:id
// @desc    Update SEO template
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const template = await SeoTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

    await template.update(req.body);
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Update SEO template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/seo-templates/:id
// @desc    Delete SEO template
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await SeoTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

    await template.destroy();
    res.json({
      success: true,
      message: 'SEO template deleted successfully'
    });
  } catch (error) {
    console.error('Delete SEO template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;