const express = require('express');
const { body, validationResult } = require('express-validator');
const { Category, Store, Language } = require('../models');
const { Op } = require('sequelize');
const translationService = require('../services/translation-service');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getCategoriesWithTranslations,
  getCategoriesWithAllTranslations,
  getCategoryById,
  createCategoryWithTranslations,
  updateCategoryWithTranslations,
  deleteCategory
} = require('../utils/categoryHelpers');
const router = express.Router();

// Helper function to check store access (ownership or team membership)
const checkStoreAccess = async (storeId, userId, userRole) => {
  if (userRole === 'admin') return true;
  
  const { checkUserStoreAccess } = require('../utils/storeAccess');
  const access = await checkUserStoreAccess(userId, storeId);
  return access !== null;
};

// @route   GET /api/categories
// @desc    Get categories (authenticated users only)
// @access  Private
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, parent_id, search, include_all_translations } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Filter by store access (ownership + team membership)
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const storeIds = accessibleStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;
    if (parent_id) where.parent_id = parent_id;

    const lang = getLanguageFromRequest(req);
    console.log('🌍 Admin Categories: Requesting language:', lang);
    console.log('🔍 Admin Categories: Where clause:', JSON.stringify(where, null, 2));
    console.log('🔍 Admin Categories: User role:', req.user?.role, 'User ID:', req.user?.id);
    console.log('🔍 Admin Categories: Include all translations:', include_all_translations);

    // Get categories with translations (all or single language)
    const categories = include_all_translations === 'true'
      ? await getCategoriesWithAllTranslations(where)
      : await getCategoriesWithTranslations(where, lang);
    console.log('✅ Admin Categories: Fetched', categories.length, 'categories from DB');

    // Handle search in memory (if needed) - TODO: move to SQL query
    let filteredCategories = categories;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchLower) ||
        cat.description?.toLowerCase().includes(searchLower)
      );
      console.log('🔍 Admin Categories: After search filter:', filteredCategories.length);
    }

    // Apply pagination
    const total = filteredCategories.length;
    const paginatedCategories = filteredCategories.slice(offset, offset + parseInt(limit));

    console.log('🔍 Admin Categories: After pagination:', paginatedCategories.length);
    if (paginatedCategories.length > 0) {
      console.log('🎯 Admin Categories: First category:', JSON.stringify({
        id: paginatedCategories[0].id,
        name: paginatedCategories[0].name,
        slug: paginatedCategories[0].slug,
        is_active: paginatedCategories[0].is_active,
        store_id: paginatedCategories[0].store_id,
        has_name: !!paginatedCategories[0].name
      }, null, 2));
    } else {
      console.log('⚠️ Admin Categories: NO CATEGORIES TO RETURN');
    }

    console.log('📤 Admin Categories: Returning', paginatedCategories.length, 'categories');

    res.json({
      success: true,
      data: {
        categories: paginatedCategories,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private
router.get('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const lang = getLanguageFromRequest(req);
    const category = await getCategoryById(req.params.id, lang);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, category.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', authMiddleware, authorize(['admin', 'store_owner']), [
  body('name').notEmpty().withMessage('Category name is required'),
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

    // Check store access
    const hasAccess = await checkStoreAccess(store_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Extract translations from request body
    const { translations, ...categoryData } = req.body;

    const category = await createCategoryWithTranslations(categoryData, translations || {});

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', authMiddleware, authorize(['admin', 'store_owner']), [
  body('name').optional().notEmpty().withMessage('Category name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if category exists
    const existingCategory = await Category.findByPk(req.params.id);

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, existingCategory.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Extract translations from request body
    const { translations, ...categoryData } = req.body;

    const category = await updateCategoryWithTranslations(req.params.id, categoryData, translations || {});

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, category.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await deleteCategory(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/categories/:id/translate
// @desc    AI translate a single category to target language
// @access  Private
router.post('/:id/translate', authMiddleware, authorize(['admin', 'store_owner']), [
  body('fromLang').notEmpty().withMessage('Source language is required'),
  body('toLang').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { fromLang, toLang } = req.body;
    const category = await getCategoryById(req.params.id, fromLang);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, category.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists (from normalized table)
    if (!category.name && !category.description) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this category`
      });
    }

    // Translate each field using AI
    const translatedData = {};
    if (category.name) {
      translatedData.name = await translationService.aiTranslate(category.name, fromLang, toLang);
    }
    if (category.description) {
      translatedData.description = await translationService.aiTranslate(category.description, fromLang, toLang);
    }

    // Save the translation using normalized tables
    const translations = {};
    translations[toLang] = translatedData;

    const updatedCategory = await updateCategoryWithTranslations(
      req.params.id,
      {},
      translations
    );

    res.json({
      success: true,
      message: `Category translated to ${toLang} successfully`,
      data: updatedCategory
    });
  } catch (error) {
    console.error('Translate category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/categories/bulk-translate
// @desc    AI translate all categories in a store to target language
// @access  Private
router.post('/bulk-translate', authMiddleware, authorize(['admin', 'store_owner']), [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('fromLang').notEmpty().withMessage('Source language is required'),
  body('toLang').notEmpty().withMessage('Target language is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { store_id, fromLang, toLang } = req.body;

    // Check store access
    const hasAccess = await checkStoreAccess(store_id, req.user.id, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all categories for this store with fromLang translations
    const categories = await getCategoriesWithTranslations({ store_id }, fromLang);

    if (categories.length === 0) {
      return res.json({
        success: true,
        message: 'No categories found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each category
    const results = {
      total: categories.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    for (const category of categories) {
      try {
        // Check if source translation exists
        if (!category.name && !category.description) {
          results.skipped++;
          continue;
        }

        // Check if target translation already exists
        const categoryWithToLang = await getCategoryById(category.id, toLang);
        if (categoryWithToLang && (categoryWithToLang.name || categoryWithToLang.description)) {
          results.skipped++;
          continue;
        }

        // Translate each field using AI
        const translatedData = {};
        if (category.name) {
          translatedData.name = await translationService.aiTranslate(category.name, fromLang, toLang);
        }
        if (category.description) {
          translatedData.description = await translationService.aiTranslate(category.description, fromLang, toLang);
        }

        // Save the translation using normalized tables
        const translations = {};
        translations[toLang] = translatedData;

        await updateCategoryWithTranslations(category.id, {}, translations);
        results.translated++;
      } catch (error) {
        console.error(`Error translating category ${category.id}:`, error);
        results.failed++;
        results.errors.push({
          categoryId: category.id,
          categoryName: category.name || 'Unknown',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    console.error('Bulk translate categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;