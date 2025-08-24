const express = require('express');
const { SeoTemplate } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/public/seo-templates
// @desc    Get SEO templates for a store (public access)
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/public/seo-templates called');
    console.log('🔍 Query params:', req.query);
    
    const { store_id, page_type } = req.query;

    if (!store_id) {
      console.log('❌ No store_id provided');
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const whereClause = { 
      store_id,
      is_active: true // Only return active templates for public access
    };
    if (page_type) whereClause.type = page_type;
    
    console.log('🔍 Where clause:', whereClause);

    const templates = await SeoTemplate.findAll({
      where: whereClause,
      order: [['sort_order', 'ASC'], ['type', 'ASC']]
    });
    
    console.log('🔍 Found templates:', templates.length);
    console.log('🔍 Templates data:', templates.map(t => ({ id: t.id, name: t.name, type: t.type, is_active: t.is_active })));

    // Return array format that the frontend expects
    res.json(templates);
  } catch (error) {
    console.error('Get public SEO templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/seo-templates (main admin route)
// @desc    Get SEO templates for a store (admin access)
// @access  Private (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 GET /api/seo-templates called');
    console.log('🔍 Query params:', req.query);
    console.log('🔍 User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
    const { store_id, page_type } = req.query;

    if (!store_id) {
      console.log('❌ No store_id provided');
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check authentication and store access
    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      console.log('🔍 Non-admin user, checking store access...');
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);
      
      if (!access) {
        console.log('❌ User does not have access to store');
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      console.log('✅ User has store access');
    }

    const whereClause = { store_id };
    if (page_type) whereClause.type = page_type;
    
    console.log('🔍 Where clause:', whereClause);

    const templates = await SeoTemplate.findAll({
      where: whereClause,
      order: [['type', 'ASC']]
    });
    
    console.log('🔍 Found templates:', templates.length);
    console.log('🔍 Templates data:', templates.map(t => ({ id: t.id, name: t.name, type: t.type })));

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
    const template = await SeoTemplate.create(req.body);
    // Return format that frontend expects
    res.status(201).json(template);
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
router.put('/:id', authMiddleware, async (req, res) => {
  try {
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