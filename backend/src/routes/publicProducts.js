const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyProductTranslationsToMany, applyProductTranslations } = require('../utils/productHelpers');
const { getAttributesWithTranslations, getAttributeValuesWithTranslations } = require('../utils/attributeHelpers');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const { getStoreSettings } = require('../utils/storeCache');
const { cacheProducts, cacheProduct } = require('../middleware/cacheMiddleware');
const { wrap, generateKey, CACHE_KEYS, DEFAULT_TTL } = require('../utils/cacheManager');
const router = express.Router();

// @route   GET /api/public/products
// @desc    Get all active products (no authentication required)
// @access  Public
// @cache   3 minutes (Redis/in-memory)
router.get('/', cacheProducts(180), async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const { page = 1, limit = 100, category_id, status = 'active', search, slug, sku, id, ids, featured } = req.query;
    const offset = (page - 1) * limit;

    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build Supabase query
    let query = tenantDb
      .from('products')
      .select('*', { count: 'exact' })
      .eq('store_id', store_id)
      .eq('status', 'active')
      .eq('visibility', 'visible');

    // Stock filtering based on store settings
    try {
      const storeSettings = await getStoreSettings(store_id);
      const displayOutOfStock = storeSettings?.display_out_of_stock !== false;

      if (!displayOutOfStock) {
        // Show products that are: configurable OR infinite_stock OR not managing stock OR in stock
        query = query.or('type.eq.configurable,infinite_stock.eq.true,manage_stock.eq.false,and(manage_stock.eq.true,stock_quantity.gt.0)');
      }
    } catch (error) {
      console.warn('Could not load store settings for stock filtering:', error.message);
    }

    // Category filtering (JSON contains)
    if (category_id) {
      query = query.contains('category_ids', [category_id]);
    }

    // Simple filters
    if (featured === 'true' || featured === true) query = query.eq('featured', true);
    if (slug) query = query.eq('slug', slug);
    if (sku) query = query.eq('sku', sku);
    // Handle 'ids' parameter - array of IDs
    if (ids) {
      try {
        const idsArray = typeof ids === 'string' && ids.startsWith('[')
          ? JSON.parse(ids)
          : Array.isArray(ids) ? ids : [ids];

        if (idsArray.length > 0) {
          query = query.in('id', idsArray);
        }
      } catch (error) {
        console.error('❌ Error parsing ids parameter:', error);
      }
    }
    // Handle 'id' parameter
    else if (id) {
      try {
        if (typeof id === 'string' && id.startsWith('{')) {
          const parsedId = JSON.parse(id);
          const idList = parsedId.$in || parsedId.in;
          if (Array.isArray(idList)) {
            query = query.in('id', idList);
          } else {
            query = query.eq('id', id);
          }
        } else {
          query = query.eq('id', id);
        }
      } catch (error) {
        console.error('❌ Error parsing id parameter:', error);
        query = query.eq('id', id);
      }
    }

    // Search in translations and SKU
    if (search) {
      // Search product translations in tenant DB
      const { data: searchResults } = await tenantDb
        .from('product_translations')
        .select('product_id')
        .or(`name.ilike.%${search}%,description.ilike.%${search}%`);

      const productIds = (searchResults || []).map(r => r.product_id);

      if (productIds.length > 0) {
        // Match products by translation OR SKU
        query = query.or(`id.in.(${productIds.join(',')}),sku.ilike.%${search}%`);
      } else {
        // Only search SKU if no translation matches
        query = query.ilike('sku', `%${search}%`);
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: rows, error: queryError, count } = await query;

    if (queryError) {
      throw new Error(queryError.message);
    }

    // Get language from request headers/query
    const lang = getLanguageFromRequest(req);

    // Apply product translations from normalized table
    const productsWithTranslations = await applyProductTranslationsToMany(rows || [], lang);

    // TODO: Load attribute values and translations (complex joins)
    // For now, return products with basic translations
    const productsWithAttributes = productsWithTranslations.map(productData => {
      // Ensure images is properly parsed as JSON array
      if (productData.images && typeof productData.images === 'string') {
        try {
          productData.images = JSON.parse(productData.images);
        } catch (e) {
          productData.images = [];
        }
      }

      return {
        ...productData,
        attributes: [] // TODO: Load from product_attribute_values table
      };
    });

    // Add cache headers
    await applyCacheHeaders(res, store_id);

    // Return structured response with pagination
    res.json({
      success: true,
      data: productsWithAttributes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get public products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/products/:id
// @desc    Get single product by ID (no authentication required)
// @access  Public
// @cache   5 minutes (Redis/in-memory)
router.get('/:id', cacheProduct(300), async (req, res) => {
  try {
    const store_id = req.headers['x-store-id'] || req.query.store_id;

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    const lang = getLanguageFromRequest(req);
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const { data: product, error } = await tenantDb
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Apply product translations from normalized table
    const productData = await applyProductTranslations(product, lang);

    // Ensure images is properly parsed as JSON array
    if (productData.images && typeof productData.images === 'string') {
      try {
        productData.images = JSON.parse(productData.images);
      } catch (e) {
        console.error('Failed to parse product images:', e);
        productData.images = [];
      }
    }

    // Collect attribute and attribute value IDs
    const attributeIds = new Set();
    const attributeValueIds = new Set();

    if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
      productData.attributeValues.forEach(pav => {
        if (pav.Attribute) {
          attributeIds.add(pav.Attribute.id);
        }
        if (pav.value_id && pav.value) {
          attributeValueIds.add(pav.value.id);
        }
      });
    }

    // Fetch attribute translations from normalized tables
    const attributeTranslations = attributeIds.size > 0
      ? await getAttributesWithTranslations({ id: Array.from(attributeIds) })
      : [];

    const valueTranslations = attributeValueIds.size > 0
      ? await getAttributeValuesWithTranslations({ id: Array.from(attributeValueIds) })
      : [];

    // Create lookup maps
    const attrTransMap = new Map(
      attributeTranslations.map(attr => [attr.id, attr.translations])
    );
    const valTransMap = new Map(
      valueTranslations.map(val => [val.id, val.translations])
    );

    // Format attributes for frontend with normalized translations
    if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
      productData.attributes = productData.attributeValues.map(pav => {
        const attr = pav.Attribute;
        if (!attr) return null;

        // Get translations from normalized table
        const attrTranslations = attrTransMap.get(attr.id) || {};
        const attrLabel = attrTranslations[lang]?.label ||
                         attrTranslations.en?.label ||
                         attr.code;

        let value, valueLabel, metadata = null;

        if (pav.value_id && pav.value) {
          // Select/multiselect attribute - get translation from normalized table
          value = pav.value.code;
          const valTranslations = valTransMap.get(pav.value.id) || {};
          valueLabel = valTranslations[lang]?.label ||
                      valTranslations.en?.label ||
                      pav.value.code;
          metadata = pav.value.metadata || null;
        } else {
          // Text/number/date/boolean attribute
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
      }).filter(Boolean); // Remove null values
    } else {
      productData.attributes = [];
    }

    // Remove the raw attributeValues array
    delete productData.attributeValues;

    // Add cache headers based on store settings
    const storeId = product.store_id;
    if (storeId) {
      await applyCacheHeaders(res, storeId);
    }

    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Get public product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/public/products/by-slug/:slug/full
// @desc    Get complete product data with tabs, labels, and custom options in one request
// @access  Public
// @cache   5 minutes (Redis/in-memory)
router.get('/by-slug/:slug/full', cacheProduct(300), async (req, res) => {
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

    // 1. Find product by slug or SKU
    let product = await Product.findOne({
      where: {
        store_id,
        slug,
        status: 'active',
        visibility: 'visible'
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
      ]
    });

    // Try SKU if slug not found
    if (!product) {
      product = await Product.findOne({
        where: {
          store_id,
          sku: slug,
          status: 'active',
          visibility: 'visible'
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
        ]
      });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Apply product translations
    const productData = await applyProductTranslations(product, lang);

    // Collect attribute and value IDs for translation lookup
    const attributeIds = new Set();
    const attributeValueIds = new Set();

    if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
      productData.attributeValues.forEach(pav => {
        if (pav.Attribute) attributeIds.add(pav.Attribute.id);
        if (pav.value_id && pav.value) attributeValueIds.add(pav.value.id);
      });
    }

    // Fetch attribute translations
    const [attributeTranslations, valueTranslations] = await Promise.all([
      attributeIds.size > 0 ? getAttributesWithTranslations({ id: Array.from(attributeIds) }) : [],
      attributeValueIds.size > 0 ? getAttributeValuesWithTranslations({ id: Array.from(attributeValueIds) }) : []
    ]);

    // Create lookup maps
    const attrTransMap = new Map(attributeTranslations.map(attr => [attr.id, attr.translations]));
    const valTransMap = new Map(valueTranslations.map(val => [val.id, val.translations]));

    // Format attributes with translations
    if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
      productData.attributes = productData.attributeValues.map(pav => {
        const attr = pav.Attribute;
        if (!attr) return null;

        const attrTranslations = attrTransMap.get(attr.id) || {};
        const attrLabel = attrTranslations[lang]?.name || attrTranslations.en?.name || attr.code;

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

    // 2. Load product tabs
    const { getProductTabsWithTranslations } = require('../utils/productTabHelpers');
    const productTabs = await getProductTabsWithTranslations({
      store_id,
      is_active: true
    }, lang, false); // false = only current language

    // 3. Load and evaluate product labels
    const { getProductLabelsWithTranslations } = require('../utils/productLabelHelpers');
    const allLabels = await getProductLabelsWithTranslations({
      store_id,
      is_active: true
    }, lang, false);

    // Evaluate labels server-side
    const applicableLabels = allLabels.filter(label => {
      let conditions;
      try {
        conditions = typeof label.conditions === 'string' ? JSON.parse(label.conditions) : label.conditions;
      } catch (e) {
        return false;
      }

      // Check attribute conditions
      if (conditions?.attribute_conditions?.length > 0) {
        for (const condition of conditions.attribute_conditions) {
          const productAttr = productData.attributes?.find(
            attr => attr.code === condition.attribute_code
          );
          if (!productAttr || productAttr.value !== condition.attribute_value) {
            return false;
          }
        }
      }

      // Check price conditions
      if (conditions?.price_conditions && Object.keys(conditions.price_conditions).length > 0) {
        const price = parseFloat(productData.price) || 0;
        const { min, max } = conditions.price_conditions;

        if (min !== undefined && price < parseFloat(min)) return false;
        if (max !== undefined && price > parseFloat(max)) return false;
      }

      // Check stock conditions
      if (conditions?.stock_conditions && Object.keys(conditions.stock_conditions).length > 0) {
        const stockQty = parseInt(productData.stock_quantity) || 0;
        const { min, max } = conditions.stock_conditions;

        if (min !== undefined && stockQty < parseInt(min)) return false;
        if (max !== undefined && stockQty > parseInt(max)) return false;
      }

      return true;
    });

    // 4. Load custom option rules
    const { supabase } = require('../database/connection');
    const { data: customOptionRules } = await supabase
      .from('custom_option_rules')
      .select('*')
      .eq('store_id', store_id)
      .eq('is_active', true);

    // Filter applicable custom option rules
    const applicableCustomOptions = (customOptionRules || []).filter(rule => {
      let conditions;
      try {
        conditions = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
      } catch (e) {
        return false;
      }

      // Check SKU conditions
      if (conditions?.skus?.includes(productData.sku)) return true;

      // Check category conditions
      if (conditions?.categories?.length > 0 && productData.category_ids?.length > 0) {
        if (conditions.categories.some(catId => productData.category_ids.includes(catId))) {
          return true;
        }
      }

      // Check attribute conditions
      if (conditions?.attribute_conditions?.length > 0) {
        for (const condition of conditions.attribute_conditions) {
          const productAttr = productData.attributes?.find(
            attr => attr.code === condition.attribute_code
          );
          if (productAttr && productAttr.value === condition.attribute_value) {
            return true;
          }
        }
      }

      return false;
    });

    // Return structured response with cache headers based on store settings
    await applyCacheHeaders(res, store_id);

    res.json({
      success: true,
      data: {
        product: productData,
        productTabs: productTabs || [],
        productLabels: applicableLabels || [],
        customOptions: applicableCustomOptions || []
      }
    });

  } catch (error) {
    console.error('Get full product data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;