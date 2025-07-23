const express = require('express');
const { Language } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/languages
// @desc    Get all languages
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { is_active } = req.query;
    const whereClause = {};

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const languages = await Language.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { languages }
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
// @desc    Get single language
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const language = await Language.findByPk(req.params.id);

    if (!language) {
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
router.post('/', auth, async (req, res) => {
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
router.put('/:id', auth, async (req, res) => {
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
router.delete('/:id', auth, async (req, res) => {
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