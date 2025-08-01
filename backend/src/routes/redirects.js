const express = require('express');
const { Redirect } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/redirects
// @desc    Get redirects for a store
// @access  Private (admin only)
router.get('/', auth, async (req, res) => {
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
router.get('/:id', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
  try {
    const redirect = await Redirect.create(req.body);
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
router.put('/:id', auth, async (req, res) => {
  try {
    const redirect = await Redirect.findByPk(req.params.id);

    if (!redirect) {
      return res.status(404).json({
        success: false,
        message: 'Redirect not found'
      });
    }

    await redirect.update(req.body);
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
router.delete('/:id', auth, async (req, res) => {
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

module.exports = router;