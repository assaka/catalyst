const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { getCMSPagesWithTranslations } = require('../utils/cmsHelpers');
const router = express.Router();

// @route   GET /api/public-cms-pages
// @desc    Get active CMS pages for public display with translations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { slug, store_id } = req.query;

    console.log('🎯 Public CMS Pages: Request received', { slug, store_id });

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug is required'
      });
    }

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Public CMS Pages: Requesting language:', lang);

    // Build where conditions
    const where = {
      slug: slug,
      is_active: true
    };

    if (store_id) {
      where.store_id = store_id;
    }

    // Get CMS pages with translations from normalized table
    const pages = await getCMSPagesWithTranslations(where, lang);

    console.log('🎯 Public CMS Pages: Query successful, found:', pages.length, 'page(s)');
    if (pages.length > 0) {
      console.log('📝 First CMS page:', {
        slug: pages[0].slug,
        title: pages[0].title,
        has_content: !!pages[0].content,
        lang: lang
      });
    }

    if (pages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'CMS page not found'
      });
    }

    res.json({
      success: true,
      data: pages[0]
    });

  } catch (error) {
    console.error('🚨 Public CMS Pages error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql || 'No SQL'
    });

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
