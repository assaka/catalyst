const express = require('express');
const { Redirect } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper function to ensure relative URLs start with /
const normalizeUrl = (url) => {
  if (!url) return url;

  const trimmedUrl = url.trim();

  // If it's an absolute URL (starts with http:// or https://), don't modify it
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // For relative URLs, ensure they start with /
  if (!trimmedUrl.startsWith('/')) {
    return '/' + trimmedUrl;
  }

  return trimmedUrl;
};

// @route   GET /api/redirects/check
// @desc    Check for redirect (for storefront use)
// @access  Public (no auth required)
router.get('/check', async (req, res) => {
  try {
    const { store_id, path } = req.query;
    
    if (!store_id || !path) {
      return res.status(400).json({ 
        success: false,
        message: 'store_id and path are required' 
      });
    }

    const redirect = await Redirect.findOne({
      where: {
        store_id,
        from_url: path,
        is_active: true
      }
    });

    if (redirect) {
      // Update hit count and last used timestamp if fields exist
      if (redirect.hit_count !== undefined) {
        await redirect.increment('hit_count');
      }
      if (redirect.last_used_at !== undefined) {
        await redirect.update({ last_used_at: new Date() });
      }
      
      res.json({
        success: true,
        found: true,
        to_url: redirect.to_url,
        type: redirect.type
      });
    } else {
      res.json({ 
        success: true,
        found: false 
      });
    }
  } catch (error) {
    console.error('Error checking redirect:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check redirect' 
    });
  }
});

// @route   GET /api/redirects
// @desc    Get redirects for a store
// @access  Private (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check authentication and store access
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

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

    const redirects = await Redirect.findAll({
      where: { store_id },
      order: [['from_url', 'ASC']]
    });

    // Return array format that the frontend expects
    res.json(redirects);
  } catch (error) {
    console.error('Get redirects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/redirects/:id
// @desc    Get single redirect
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const redirect = await Redirect.findByPk(req.params.id);

    if (!redirect) {
      return res.status(404).json({
        success: false,
        message: 'Redirect not found'
      });
    }

    // Return format that frontend expects
    res.json(redirect);
  } catch (error) {
    console.error('Get redirect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/redirects
// @desc    Create a new redirect
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Normalize URLs to ensure relative URLs start with /
    const redirectData = {
      ...req.body,
      from_url: normalizeUrl(req.body.from_url),
      to_url: normalizeUrl(req.body.to_url)
    };

    const redirect = await Redirect.create(redirectData);
    // Return format that frontend expects
    res.status(201).json(redirect);
  } catch (error) {
    console.error('Create redirect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/redirects/:id
// @desc    Update redirect
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const redirect = await Redirect.findByPk(req.params.id);

    if (!redirect) {
      return res.status(404).json({
        success: false,
        message: 'Redirect not found'
      });
    }

    // Normalize URLs to ensure relative URLs start with /
    const updateData = { ...req.body };
    if (updateData.from_url) {
      updateData.from_url = normalizeUrl(updateData.from_url);
    }
    if (updateData.to_url) {
      updateData.to_url = normalizeUrl(updateData.to_url);
    }

    await redirect.update(updateData);
    // Return format that frontend expects
    res.json(redirect);
  } catch (error) {
    console.error('Update redirect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/redirects/:id
// @desc    Delete redirect
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const redirect = await Redirect.findByPk(req.params.id);

    if (!redirect) {
      return res.status(404).json({
        success: false,
        message: 'Redirect not found'
      });
    }

    await redirect.destroy();
    res.json({
      success: true,
      message: 'Redirect deleted successfully'
    });
  } catch (error) {
    console.error('Delete redirect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/redirects/slug-change
// @desc    Create redirect when slug changes
// @access  Private
router.post('/slug-change', authMiddleware, async (req, res) => {
  try {
    const {
      store_id,
      entity_type,
      entity_id,
      old_slug,
      new_slug,
      entity_path_prefix // e.g., '/category', '/product', '/page'
    } = req.body;

    if (!store_id || !entity_type || !entity_id || !old_slug || !new_slug) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required for slug change redirect' 
      });
    }

    if (old_slug === new_slug) {
      return res.json({ 
        success: true,
        message: 'No redirect needed - slug unchanged' 
      });
    }

    const from_url = `${entity_path_prefix}/${old_slug}`;
    const to_url = `${entity_path_prefix}/${new_slug}`;

    // Check if redirect already exists
    const existingRedirect = await Redirect.findOne({
      where: {
        store_id,
        from_url
      }
    });

    if (existingRedirect) {
      // Update existing redirect to point to new URL
      await existingRedirect.update({
        to_url,
        notes: `Auto-updated redirect due to ${entity_type} slug change from "${old_slug}" to "${new_slug}"`
      });
      
      res.json({ 
        success: true,
        message: 'Updated existing redirect',
        redirect: existingRedirect 
      });
    } else {
      // Create new redirect
      const redirect = await Redirect.create({
        store_id,
        from_url,
        to_url,
        type: '301',
        entity_type,
        entity_id,
        created_by: req.user.id,
        notes: `Auto-created redirect due to ${entity_type} slug change from "${old_slug}" to "${new_slug}"`
      });

      res.status(201).json({ 
        success: true,
        message: 'Created new redirect',
        redirect 
      });
    }
  } catch (error) {
    console.error('Error creating slug change redirect:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create slug change redirect' 
    });
  }
});

module.exports = router;