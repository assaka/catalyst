const express = require('express');
const { Store, Language, Category } = require('../models');
const translationService = require('../services/translation-service');
const { getCategoriesWithTranslations } = require('../utils/categoryHelpers');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const router = express.Router();

/**
 * @route   GET /api/public/storefront/bootstrap
 * @desc    Get all storefront initialization data in one request
 * @access  Public
 * @query   {string} slug - Store slug (required)
 * @query   {string} lang - Language code (optional, defaults to 'en')
 *
 * @returns {Object} Combined response containing:
 *   - store: Store configuration
 *   - languages: Available languages
 *   - translations: UI translations for the specified language
 *   - categories: Category tree for navigation
 */
router.get('/', async (req, res) => {
  try {
    const { slug, lang } = req.query;

    // Validate required parameters
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Store slug is required'
      });
    }

    const language = lang || 'en';

    // Execute all queries in parallel for optimal performance
    const [
      stores,
      languages,
      translationsResult,
      categoriesResult
    ] = await Promise.all([
      // 1. Get store by slug
      Store.findAll({
        where: {
          slug,
          is_active: true
        },
        limit: 1
      }),

      // 2. Get all active languages
      Language.findAll({
        where: { is_active: true },
        order: [['name', 'ASC']]
      }),

      // 3. Get UI translations for the specified language
      translationService.getUILabels(language),

      // 4. Get categories for navigation (limited to 1000 for performance)
      (async () => {
        // First find the store to get its ID
        const storeForCategories = await Store.findOne({
          where: { slug, is_active: true }
        });

        if (!storeForCategories) {
          return { rows: [], count: 0 };
        }

        return getCategoriesWithTranslations(
          {
            store_id: storeForCategories.id,
            is_active: true,
            hide_in_menu: false
          },
          language,
          { limit: 1000, offset: 0 }
        );
      })()
    ]);

    // Check if store exists
    if (!stores || stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    const store = stores[0];

    // Build category tree for navigation
    const categoriesFlat = categoriesResult.rows || [];
    const categoryTree = buildCategoryTree(categoriesFlat);

    // Apply cache headers based on store settings
    await applyCacheHeaders(res, store.id);

    // Return combined response
    res.json({
      success: true,
      data: {
        store: store,
        languages: languages,
        translations: {
          language: language,
          labels: translationsResult.labels || {},
          customKeys: translationsResult.customKeys || []
        },
        categories: categoryTree,
        meta: {
          categoriesCount: categoriesResult.count || 0,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Storefront bootstrap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load storefront data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Build a hierarchical category tree from flat category list
 * @param {Array} categories - Flat array of categories
 * @returns {Array} Hierarchical category tree
 */
function buildCategoryTree(categories) {
  // Create a map for quick lookup
  const categoryMap = new Map();
  const tree = [];

  // First pass: create map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category.toJSON ? category.toJSON() : category,
      children: []
    });
  });

  // Second pass: build tree structure
  categories.forEach(category => {
    const node = categoryMap.get(category.id);
    if (category.parent_id === null || category.parent_id === undefined) {
      // Root level category
      tree.push(node);
    } else {
      // Child category - add to parent
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found (might be inactive), add as root
        tree.push(node);
      }
    }
  });

  return tree;
}

module.exports = router;
