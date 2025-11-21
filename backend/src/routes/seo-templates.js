const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authAdmin } = require('../middleware/authMiddleware');

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

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query
    let query = tenantDb
      .from('seo_templates')
      .select('*')
      .eq('store_id', store_id);

    // Only return active templates for public access
    if (isPublicRequest) {
      query = query.eq('is_active', true);
    }

    if (page_type) {
      query = query.eq('type', page_type);
    }

    // Order by
    if (isPublicRequest) {
      query = query.order('sort_order', { ascending: true }).order('type', { ascending: true });
    } else {
      query = query.order('type', { ascending: true });
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Get SEO templates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }

    // Return array format that the frontend expects
    res.json(templates || []);
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
// @access  Private (Admin/Store Owner)
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: template, error } = await tenantDb
      .from('seo_templates')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !template) {
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
// @access  Private (Admin/Store Owner)
router.post('/', authAdmin, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: template, error } = await tenantDb
      .from('seo_templates')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      console.error('Create SEO template error:', error);

      // Check for unique constraint violation
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'A template with this name already exists for this store'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Server error: ' + (error.message || 'Unknown error')
      });
    }

    // Return format that frontend expects
    res.status(201).json(template);
  } catch (error) {
    console.error('Create SEO template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + (error.message || 'Unknown error')
    });
  }
});

// @route   PUT /api/seo-templates/:id
// @desc    Update SEO template
// @access  Private (Admin/Store Owner)
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: template, error } = await tenantDb
      .from('seo_templates')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !template) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

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
// @access  Private (Admin/Store Owner)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { error } = await tenantDb
      .from('seo_templates')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'SEO template not found'
      });
    }

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