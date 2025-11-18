const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const router = express.Router();

// @route   GET /api/public/categories
// @desc    Get all active categories (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const { page = 1, limit = 100, parent_id, search } = req.query;
    const offset = (page - 1) * limit;
    const lang = getLanguageFromRequest(req);

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query
    let query = tenantDb
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('store_id', store_id)
      .eq('is_active', true)
      .eq('hide_in_menu', false);

    if (parent_id !== undefined) {
      query = query.eq('parent_id', parent_id);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query
      .order('sort_order', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: categories, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Load translations for categories
    const categoryIds = (categories || []).map(c => c.id);
    let translations = [];

    if (categoryIds.length > 0) {
      const { data: trans } = await tenantDb
        .from('category_translations')
        .select('*')
        .in('category_id', categoryIds)
        .in('language_code', [lang, 'en']);

      translations = trans || [];
    }

    // Build translation map
    const transMap = {};
    translations.forEach(t => {
      if (!transMap[t.category_id]) transMap[t.category_id] = {};
      transMap[t.category_id][t.language_code] = t;
    });

    // Apply translations
    const categoriesWithTrans = (categories || []).map(cat => {
      const trans = transMap[cat.id];
      const reqLang = trans?.[lang];
      const enLang = trans?.['en'];

      return {
        ...cat,
        name: reqLang?.name || enLang?.name || cat.slug || cat.name,
        description: reqLang?.description || enLang?.description || null
      };
    });

    // Apply cache headers
    await applyCacheHeaders(res, store_id);

    // Return structured response with pagination
    res.json({
      success: true,
      data: categoriesWithTrans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
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

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // 1. Find category by slug
    const { data: category, error: catError } = await tenantDb
      .from('categories')
      .select('*')
      .eq('store_id', store_id)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (catError || !category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Load category translation
    const { data: categoryTrans } = await tenantDb
      .from('category_translations')
      .select('*')
      .eq('category_id', category.id)
      .in('language_code', [lang, 'en']);

    const transMap = {};
    (categoryTrans || []).forEach(t => {
      transMap[t.language_code] = t;
    });

    const reqLang = transMap[lang];
    const enLang = transMap['en'];

    const categoryWithTrans = {
      ...category,
      name: reqLang?.name || enLang?.name || category.slug || category.name,
      description: reqLang?.description || enLang?.description || null
    };

    // TODO: Load products for this category
    // For now, skip complex product loading - can add later

    res.json({
      success: true,
      data: {
        category: categoryWithTrans,
        products: [] // TODO: Load products
      }
    });
  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Legacy route structure - keeping for compatibility
router.get('/by-slug-old/:slug/full', async (req, res) => {
  try {
    const { slug } = req.params;
    const { store_id } = req.query;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // OLD IMPLEMENTATION - using Sequelize models (deprecated)
    const Category = require('../models').Category;
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
      // Ensure images is properly parsed as JSON array
      if (productData.images && typeof productData.images === 'string') {
        try {
          productData.images = JSON.parse(productData.images);
        } catch (e) {
          console.error('Failed to parse product images:', e);
          productData.images = [];
        }
      }

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

    // Return structured response
    res.json({
      success: true,
      data: {
        category: categoryWithTranslations,
        products: productsWithAttributes,
        total: productsWithAttributes.length
      }
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