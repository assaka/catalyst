const express = require('express');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { getCMSBlocksWithTranslations } = require('../utils/cmsHelpers');
const router = express.Router();

// @route   GET /api/public-cms-blocks
// @desc    Get active CMS blocks for public display with translations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;

    console.log('🎯 Public CMS Blocks: Request received', { store_id });

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Public CMS Blocks: Requesting language:', lang);

    // Build where conditions
    const where = {
      store_id: store_id,
      is_active: true
    };

    // Get CMS blocks with translations from normalized table
    const blocks = await getCMSBlocksWithTranslations(where, lang);

    console.log('🎯 Public CMS Blocks: Query successful, found:', blocks.length, 'blocks');
    if (blocks.length > 0) {
      console.log('📝 First CMS block:', {
        identifier: blocks[0].identifier,
        title: blocks[0].title,
        has_content: !!blocks[0].content,
        lang: lang
      });
    }

    // Return data directly (not wrapped) for storefront client compatibility
    // Storefront client expects direct array, not {success: true, data: ...}
    res.json(blocks);

  } catch (error) {
    console.error('🚨 Public CMS Blocks error:', error);
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