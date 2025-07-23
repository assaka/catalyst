const express = require('express');
const { SeoSettings, Store } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/seo-settings
// @desc    Get SEO settings for a store
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store ownership
    if (req.user.role !== 'admin') {
      const store = await Store.findByPk(store_id);
      if (!store || store.owner_email !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    let seoSettings = await SeoSettings.findOne({ where: { store_id } });

    if (!seoSettings) {
      // Create default SEO settings
      seoSettings = await SeoSettings.create({
        store_id,
        enable_rich_snippets: true,
        enable_open_graph: true,
        enable_twitter_cards: true
      });
    }

    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    console.error('Get SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/seo-settings
// @desc    Create or update SEO settings
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('🐛 POST /api/seo-settings DEBUG:', {
      body: req.body,
      user: req.user?.email,
      userRole: req.user?.role
    });

    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Check store ownership
    if (req.user.role !== 'admin') {
      const store = await Store.findByPk(store_id);
      if (!store || store.owner_email !== req.user.email) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    let seoSettings = await SeoSettings.findOne({ where: { store_id } });

    if (seoSettings) {
      // Update existing settings
      console.log('🔄 Updating existing SEO settings for store:', store_id);
      await seoSettings.update(req.body);
    } else {
      // Create new settings
      console.log('✨ Creating new SEO settings for store:', store_id);
      seoSettings = await SeoSettings.create(req.body);
    }

    console.log('✅ SEO settings saved successfully:', seoSettings.id);

    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    console.error('Save SEO settings error:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/seo-settings/:id
// @desc    Update SEO settings
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('🐛 PUT /api/seo-settings/:id DEBUG:', {
      id: req.params.id,
      body: req.body,
      user: req.user?.email,
      userRole: req.user?.role
    });

    const seoSettings = await SeoSettings.findByPk(req.params.id, {
      include: [{ model: Store, attributes: ['id', 'owner_email'] }]
    });

    if (!seoSettings) {
      return res.status(404).json({
        success: false,
        message: 'SEO settings not found'
      });
    }

    // Check store ownership
    if (req.user.role !== 'admin' && seoSettings.Store.owner_email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('🔄 Updating SEO settings with ID:', req.params.id);
    await seoSettings.update(req.body);
    console.log('✅ SEO settings updated successfully');

    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    console.error('Update SEO settings error:', error);
    console.error('Error details:', error.message);
    console.error('Error name:', error.name);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;