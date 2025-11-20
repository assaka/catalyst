const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/canonical-urls/check
// @desc    Check for canonical URL (for storefront use)
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

    const connection = await ConnectionManager.getConnection(store_id);
    const { CanonicalUrl } = connection.models;

    const canonicalUrl = await CanonicalUrl.findOne({
      where: {
        store_id,
        page_url: path,
        is_active: true
      }
    });

    if (canonicalUrl) {
      res.json({
        success: true,
        found: true,
        canonical_url: canonicalUrl.canonical_url
      });
    } else {
      res.json({
        success: true,
        found: false
      });
    }
  } catch (error) {
    console.error('Error checking canonical URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check canonical URL'
    });
  }
});

// @route   GET /api/canonical-urls
// @desc    Get canonical URLs for a store
// @access  Private (admin only)
router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
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

    const connection = await ConnectionManager.getConnection(store_id);
    const { CanonicalUrl } = connection.models;

    const canonicalUrls = await CanonicalUrl.findAll({
      where: { store_id },
      order: [['page_url', 'ASC']]
    });

    // Return array format that the frontend expects
    res.json(canonicalUrls);
  } catch (error) {
    console.error('Get canonical URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/canonical-urls/:id
// @desc    Get single canonical URL
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Note: This route needs store_id to get the connection
    // We'll need to fetch the record first or get store_id from query/body
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { CanonicalUrl } = connection.models;

    const canonicalUrl = await CanonicalUrl.findByPk(req.params.id);

    if (!canonicalUrl) {
      return res.status(404).json({
        success: false,
        message: 'Canonical URL not found'
      });
    }

    res.json(canonicalUrl);
  } catch (error) {
    console.error('Get canonical URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/canonical-urls
// @desc    Create a new canonical URL
// @access  Private
router.post('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { CanonicalUrl } = connection.models;

    const canonicalUrl = await CanonicalUrl.create({
      ...req.body,
      created_by: req.user?.id
    });
    res.status(201).json(canonicalUrl);
  } catch (error) {
    console.error('Create canonical URL error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/canonical-urls/:id
// @desc    Update canonical URL
// @access  Private
router.put('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { CanonicalUrl } = connection.models;

    const canonicalUrl = await CanonicalUrl.findByPk(req.params.id);

    if (!canonicalUrl) {
      return res.status(404).json({
        success: false,
        message: 'Canonical URL not found'
      });
    }

    await canonicalUrl.update(req.body);
    res.json(canonicalUrl);
  } catch (error) {
    console.error('Update canonical URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/canonical-urls/:id
// @desc    Delete canonical URL
// @access  Private
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const connection = await ConnectionManager.getConnection(store_id);
    const { CanonicalUrl } = connection.models;

    const canonicalUrl = await CanonicalUrl.findByPk(req.params.id);

    if (!canonicalUrl) {
      return res.status(404).json({
        success: false,
        message: 'Canonical URL not found'
      });
    }

    await canonicalUrl.destroy();
    res.json({
      success: true,
      message: 'Canonical URL deleted successfully'
    });
  } catch (error) {
    console.error('Delete canonical URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
