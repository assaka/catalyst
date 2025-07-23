const express = require('express');
const { SeoSettings } = require('../models');
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
    const { store_id } = req.body;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    let seoSettings = await SeoSettings.findOne({ where: { store_id } });

    if (seoSettings) {
      // Update existing settings
      await seoSettings.update(req.body);
    } else {
      // Create new settings
      seoSettings = await SeoSettings.create(req.body);
    }

    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    console.error('Save SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/seo-settings/:id
// @desc    Update SEO settings
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const seoSettings = await SeoSettings.findByPk(req.params.id);

    if (!seoSettings) {
      return res.status(404).json({
        success: false,
        message: 'SEO settings not found'
      });
    }

    await seoSettings.update(req.body);
    res.json({
      success: true,
      data: seoSettings
    });
  } catch (error) {
    console.error('Update SEO settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;