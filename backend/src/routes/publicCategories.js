const express = require('express');
const { Category, Store } = require('../models');
const { Op } = require('sequelize');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const {
  getCategoriesWithTranslations,
  getCategoryById
} = require('../utils/categoryHelpers');
const { applyCacheHeaders } = require('../utils/cacheUtils');
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
    console.log('🔍 Total categories before pagination:', filteredCategories.length);
    console.log('🔍 Pagination: offset =', offset, ', limit =', limit);

    if (paginatedCategories.length > 0) {
      console.log('🎯 First category being returned:', JSON.stringify({
        id: paginatedCategories[0].id,
        name: paginatedCategories[0].name,
        slug: paginatedCategories[0].slug,
        is_active: paginatedCategories[0].is_active,
        hide_in_menu: paginatedCategories[0].hide_in_menu,
        parent_id: paginatedCategories[0].parent_id,
        lang: lang,
        has_name: !!paginatedCategories[0].name,
        name_value: paginatedCategories[0].name
      }, null, 2));
    } else {
      console.log('⚠️ NO CATEGORIES TO RETURN');
      console.log('⚠️ Categories from DB:', categories.length);
      console.log('⚠️ After filtering:', filteredCategories.length);
      console.log('⚠️ Where clause:', JSON.stringify(where, null, 2));
    }

    // Apply cache headers based on store settings
    if (store_id) {
      await applyCacheHeaders(res, store_id);
    }

    // Return just the array for public requests (for compatibility)
    console.log('📤 Returning', paginatedCategories.length, 'categories to frontend');
    res.json(paginatedCategories);
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/categories/by-slug/:slug/full
// @desc    Get complete category data with products in one request
// @access  Public
router.get('/by-slug/:slug/full', async (req, res) => {
  try {
    const { slug } = req.params;
    const { store_id } = req.query;
    const lang = getLanguageFromRequest(req);

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // 1. Find category by slug
    const category = await Category.findOne({
      where: {
        store_id,
        slug,
        is_active: true,
        hide_in_menu: false
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Apply category translations
    const categoryWithTranslations = await getCategoryById(category.id, lang);

    // 2. Get all products in this category
    const { Product, ProductAttributeValue, Attribute, AttributeValue } = require('../models');
    const { applyProductTranslationsToMany } = require('../utils/productHelpers');
    const { getAttributesWithTranslations, getAttributeValuesWithTranslations } = require('../utils/attributeHelpers');

    const products = await Product.findAll({
      where: {
        store_id,
        status: 'active',
        visibility: 'visible',
        category_ids: {
          [Op.contains]: [category.id]
        }
      },
      attributes: { exclude: ['translations'] },
      include: [
        {
          model: ProductAttributeValue,
          as: 'attributeValues',
          include: [
            {
              model: Attribute,
              attributes: ['id', 'code', 'type']
            },
            {
              model: AttributeValue,
              as: 'value',
              attributes: ['id', 'code', 'metadata']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Apply product translations
    const productsWithTranslations = await applyProductTranslationsToMany(products, lang);

    // Collect attribute and value IDs for bulk translation lookup
    const attributeIds = new Set();
    const attributeValueIds = new Set();

    productsWithTranslations.forEach(product => {
      if (product.attributeValues && Array.isArray(product.attributeValues)) {
        product.attributeValues.forEach(pav => {
          if (pav.Attribute) attributeIds.add(pav.Attribute.id);
          if (pav.value_id && pav.value) attributeValueIds.add(pav.value.id);
        });
      }
    });

    // Fetch attribute translations in bulk
    const [attributeTranslations, valueTranslations] = await Promise.all([
      attributeIds.size > 0 ? getAttributesWithTranslations({ id: Array.from(attributeIds) }) : [],
      attributeValueIds.size > 0 ? getAttributeValuesWithTranslations({ id: Array.from(attributeValueIds) }) : []
    ]);

    // Create lookup maps
    const attrTransMap = new Map(attributeTranslations.map(attr => [attr.id, attr.translations]));
    const valTransMap = new Map(valueTranslations.map(val => [val.id, val.translations]));

    // Format products with attributes and translations
    const productsWithAttributes = productsWithTranslations.map(productData => {
      // Format attributes for frontend
      if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
        productData.attributes = productData.attributeValues.map(pav => {
          const attr = pav.Attribute;
          if (!attr) return null;

          const attrTranslations = attrTransMap.get(attr.id) || {};
          const attrLabel = attrTranslations[lang]?.label || attrTranslations.en?.label || attr.code;

          let value, valueLabel, metadata = null;

          if (pav.value_id && pav.value) {
            value = pav.value.code;
            const valTranslations = valTransMap.get(pav.value.id) || {};
            valueLabel = valTranslations[lang]?.label || valTranslations.en?.label || pav.value.code;
            metadata = pav.value.metadata || null;
          } else {
            value = pav.text_value || pav.number_value || pav.date_value || pav.boolean_value;
            valueLabel = String(value);
          }

          return {
            id: attr.id,
            code: attr.code,
            label: attrLabel,
            value: valueLabel,
            rawValue: value,
            type: attr.type,
            metadata
          };
        }).filter(Boolean);
      } else {
        productData.attributes = [];
      }

      delete productData.attributeValues;
      return productData;
    });

    // Apply cache headers based on store settings
    await applyCacheHeaders(res, store_id);

    // Return combined response
    res.json({
      category: categoryWithTranslations,
      products: productsWithAttributes,
      total: productsWithAttributes.length
    });

  } catch (error) {
    console.error('Get category with products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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