const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// Conditional auth middleware
const conditionalAuth = (req, res, next) => {
  const isPublicRequest = req.originalUrl.includes('/api/public/attribute-sets');
  if (isPublicRequest) {
    next();
  } else {
    authMiddleware(req, res, next);
  }
};

router.get('/', conditionalAuth, async (req, res) => {
  try {
    const { store_id, page = 1, limit = 100, search } = req.query;
    const offset = (page - 1) * limit;

    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/attribute-sets');

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query
    let query = tenantDb
      .from('attribute_sets')
      .select('*')
      .eq('store_id', store_id)
      .order('name', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    // Add search functionality if provided
    if (search) {
      query = tenantDb
        .from('attribute_sets')
        .select('*')
        .eq('store_id', store_id)
        .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
        .order('name', { ascending: true })
        .range(offset, offset + parseInt(limit) - 1);
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error('Error fetching attribute sets:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching attribute sets',
        error: error.message
      });
    }

    // Get total count
    const countQuery = search
      ? tenantDb
          .from('attribute_sets')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id)
          .or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      : tenantDb
          .from('attribute_sets')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', store_id);

    const { count: totalCount } = await countQuery;

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(rows || []);
    } else {
      // Return wrapped response for authenticated requests with pagination
      res.json({
        success: true,
        data: {
          attribute_sets: rows || [],
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: totalCount || 0,
            total_pages: Math.ceil((totalCount || 0) / limit)
          }
        }
      });
    }
  } catch (error) {
    console.error('Get attribute sets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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

    // Need store_id to get the right tenant DB
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: attributeSet, error } = await tenantDb
      .from('attribute_sets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !attributeSet) {
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
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/attribute-sets
// @desc    Create a new attribute set
// @access  Private
router.post('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { store_id, ...attributeSetData } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: attributeSet, error } = await tenantDb
      .from('attribute_sets')
      .insert({
        ...attributeSetData,
        store_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attribute set:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating attribute set',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: attributeSet
    });
  } catch (error) {
    console.error('Create attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/attribute-sets/:id
// @desc    Update attribute set
// @access  Private
router.put('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.body.store_id || req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if attribute set exists
    const { data: existing, error: checkError } = await tenantDb
      .from('attribute_sets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Attribute set not found'
      });
    }

    const { data: attributeSet, error } = await tenantDb
      .from('attribute_sets')
      .update({
        ...req.body,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating attribute set:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating attribute set',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: attributeSet
    });
  } catch (error) {
    console.error('Update attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/attribute-sets/:id
// @desc    Delete attribute set
// @access  Private
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const store_id = req.query.store_id || req.headers['x-store-id'];

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Check if attribute set exists
    const { data: existing, error: checkError } = await tenantDb
      .from('attribute_sets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Attribute set not found'
      });
    }

    const { error } = await tenantDb
      .from('attribute_sets')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Error deleting attribute set:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting attribute set',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Attribute set deleted successfully'
    });
  } catch (error) {
    console.error('Delete attribute set error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
