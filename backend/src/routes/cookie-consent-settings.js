const express = require('express');
const { body, validationResult } = require('express-validator');
const { CookieConsentSettings, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Helper function to check store ownership
const checkStoreOwnership = async (storeId, userEmail, userRole) => {
  if (userRole === 'admin') return true;
  
  const store = await Store.findByPk(storeId);
  return store && store.owner_email === userEmail;
};

// @route   GET /api/cookie-consent-settings
// @desc    Get cookie consent settings
// @access  Public/Private
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    // Check if this is a public request
    const isPublicRequest = req.originalUrl.includes('/api/public/cookie-consent-settings');
    const where = {};
    
    if (isPublicRequest) {
      // Public access - only return settings for specific store
      if (store_id) where.store_id = store_id;
    } else {
      // Authenticated access - check authentication
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }
      
      // Filter by store ownership
      if (req.user.role !== 'admin') {
        const userStores = await Store.findAll({
          where: { owner_email: req.user.email },
          attributes: ['id']
        });
        const storeIds = userStores.map(store => store.id);
        where.store_id = { [Op.in]: storeIds };
      }

      if (store_id) where.store_id = store_id;
    }

    const settings = await CookieConsentSettings.findAll({
      where,
      include: [{
        model: Store,
        attributes: ['id', 'name']
      }]
    });

    if (isPublicRequest) {
      // Return just the array for public requests (for compatibility)
      res.json(settings);
    } else {
      // Return wrapped response for authenticated requests
      res.json({
        success: true,
        data: settings
      });
    }
  } catch (error) {
    console.error('Get cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cookie-consent-settings/:id
// @desc    Get cookie consent settings by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const settings = await CookieConsentSettings.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && settings.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cookie-consent-settings
// @desc    Create new cookie consent settings
// @access  Private
router.post('/', [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id } = req.body;

    // Check store ownership
    const hasAccess = await checkStoreOwnership(store_id, req.user.email, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const settings = await CookieConsentSettings.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Cookie consent settings created successfully',
      data: settings
    });
  } catch (error) {
    console.error('Create cookie consent settings error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: error.errors?.map(e => ({field: e.path, message: e.message})) || null
    });
  }
});

// @route   PUT /api/cookie-consent-settings/:id
// @desc    Update cookie consent settings
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const settings = await CookieConsentSettings.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && settings.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await settings.update(req.body);

    res.json({
      success: true,
      message: 'Cookie consent settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/cookie-consent-settings/:id
// @desc    Delete cookie consent settings
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const settings = await CookieConsentSettings.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Cookie consent settings not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && settings.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await settings.destroy();

    res.json({
      success: true,
      message: 'Cookie consent settings deleted successfully'
    });
  } catch (error) {
    console.error('Delete cookie consent settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;