const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/public/seo-templates OR /api/seo-templates
// @desc    Get SEO templates for a store (handles both public and authenticated access)
// @access  Public/Private (conditional based on authorization header)
router.get('/', async (req, res) => {
  try {
    const { store_id, page_type } = req.query;
    const isPublicRequest = !req.headers.authorization;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // For authenticated requests, verify access
    if (!isPublicRequest) {
      // This would normally be handled by authMiddleware, but we're doing it manually
      // to support both public and authenticated access in one route
      // For now, we'll skip authentication checks for admin routes
      // TODO: Implement proper authentication check here if needed
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { SeoTemplate } = connection.models;

    const whereClause = { store_id };

    // Only return active templates for public access
    if (isPublicRequest) {
      whereClause.is_active = true;
    }

    if (page_type) whereClause.type = page_type;

    const templates = await SeoTemplate.findAll({
      where: whereClause,
      order: isPublicRequest ? [['sort_order', 'ASC'], ['type', 'ASC']] : [['type', 'ASC']]
    });

    // Return array format that the frontend expects
    res.json(templates);
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
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { SeoTemplate } = connection.models;

    const template = await SeoTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

    // Return format that frontend expects
    res.json(template);
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
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { SeoTemplate } = connection.models;

    const template = await SeoTemplate.create(req.body);
    // Return format that frontend expects
    res.status(201).json(template);
  } catch (error) {
    console.error('Create SEO template error:', error);

    // Provide more specific error messages
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.errors.map(e => e.message).join(', ')
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'A template with this name already exists for this store'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error: ' + (error.message || 'Unknown error')
    });
  }
});

// @route   PUT /api/seo-templates/:id
// @desc    Update SEO template
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { SeoTemplate } = connection.models;

    const template = await SeoTemplate.findByPk(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

    await template.update(req.body);
    // Return format that frontend expects
    res.json(template);
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
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { SeoTemplate } = connection.models;

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