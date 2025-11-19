const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/languages
// @desc    Get all languages from tenant DB
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;
    // Get store_id from header (frontend sends X-Store-Id)
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required (X-Store-Id header)'
      });
    }

    // Get tenant DB connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query
    let query = tenantDb.from('languages').select('*').order('name', { ascending: true });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data: languages, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: { languages: languages || [] }
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/languages/:id
// @desc    Get single language from tenant DB
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    // Get store_id from header (frontend sends X-Store-Id)
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required (X-Store-Id header)'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: language, error } = await tenantDb
      .from('languages')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    res.json({
      success: true,
      data: language
    });
  } catch (error) {
    console.error('Get language error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/languages
// @desc    Create a new language
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const language = await Language.create(req.body);
    res.status(201).json({
      success: true,
      data: language
    });
  } catch (error) {
    console.error('Create language error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/languages/:id
// @desc    Update language
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const language = await Language.findByPk(req.params.id);

    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    await language.update(req.body);
    res.json({
      success: true,
      data: language
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/languages/:id
// @desc    Delete language
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const language = await Language.findByPk(req.params.id);

    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found'
      });
    }

    await language.destroy();
    res.json({
      success: true,
      message: 'Language deleted successfully'
    });
  } catch (error) {
    console.error('Delete language error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;