const express = require('express');
const { Category, Store } = require('../models');
const { Op } = require('sequelize');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getCategoriesWithTranslations,
  getCategoryById
} = require('../utils/categoryHelpers');
const router = express.Router();

// @route   GET /api/public/categories
// @desc    Get all active categories (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, parent_id, search } = req.query;
    const offset = (page - 1) * limit;

    console.log('🔍 Public Categories API called with params:', req.query);
    console.log('🔍 Request URL:', req.originalUrl);

    const where = {
      is_active: true,  // Only show active categories
      hide_in_menu: false  // Only show categories not hidden in menu
    };

    if (store_id) where.store_id = store_id;
    if (parent_id !== undefined) where.parent_id = parent_id;

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Public Categories: Requesting language:', lang);

    // Get categories with translations
    const categories = await getCategoriesWithTranslations(where, lang);

    // Handle search in memory (if needed) - already supports translation search in normalized table
    let filteredCategories = categories;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const paginatedCategories = filteredCategories.slice(offset, offset + parseInt(limit));

    console.log('✅ Public Categories query result:', paginatedCategories.length, 'categories found');
    if (paginatedCategories.length > 0) {
      console.log('🎯 Sample category:', {
        id: paginatedCategories[0].id,
        name: paginatedCategories[0].name,
        lang: lang
      });
    }

    // Return just the array for public requests (for compatibility)
    res.json(paginatedCategories);
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/categories/:id
// @desc    Get single category by ID (no authentication required)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lang = getLanguageFromRequest(req);
    const category = await getCategoryById(req.params.id, lang);

    if (!category || !category.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get public category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;