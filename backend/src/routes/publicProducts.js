const express = require('express');
const { Product, Store, ProductAttributeValue, Attribute, AttributeValue } = require('../models');
const { Op } = require('sequelize');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyProductTranslationsToMany, applyProductTranslations } = require('../utils/productHelpers');
const { getAttributesWithTranslations, getAttributeValuesWithTranslations } = require('../utils/attributeHelpers');
const { applyCacheHeaders } = require('../utils/cacheUtils');
const { getStoreSettings } = require('../utils/storeCache');
const router = express.Router();

// @route   GET /api/public/products
// @desc    Get all active products (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, category_id, status = 'active', search, slug, sku, id, ids, featured } = req.query;
    const offset = (page - 1) * limit;

    console.log('📦 Public Products API called:', {
      id: id ? (typeof id === 'string' && id.length > 100 ? id.substring(0, 100) + '...' : id) : undefined,
      ids: ids ? (typeof ids === 'string' && ids.length > 100 ? ids.substring(0, 100) + '...' : ids) : undefined,
      store_id,
      page,
      limit
    });

    const where = {
      status: 'active',  // Only show active products in public API
      visibility: 'visible'  // Only show visible products
    };

    if (store_id) {
      where.store_id = store_id;

      // Check store's display_out_of_stock setting (cached)
      try {
        const storeSettings = await getStoreSettings(store_id);
        const displayOutOfStock = storeSettings?.display_out_of_stock !== false; // Default to true

        if (!displayOutOfStock) {
          // Filter out products that are out of stock
          // Note: Configurable products are EXCLUDED from stock filtering
          // because their stock is managed by their child variants
          where[Op.or] = [
            { type: 'configurable' },  // Always show configurable products (variants control stock)
            { infinite_stock: true },  // Products with infinite stock are always available
            { manage_stock: false },   // Products not managing stock are always available
            {
              [Op.and]: [
                { manage_stock: true },
                { stock_quantity: { [Op.gt]: 0 } }  // In stock
              ]
            }
          ];
        }

      } catch (error) {
        console.warn('Could not load store settings for stock filtering:', error.message);
      }
    }
    if (category_id) {
      // Filter by category using JSON array field
      where.category_ids = {
        [Op.contains]: [category_id]
      };
    }
    if (featured === 'true' || featured === true) where.featured = true;
    if (slug) where.slug = slug;
    if (sku) where.sku = sku;
    // Handle 'ids' parameter (plural) - array of IDs for batch fetching
    if (ids) {
      try {
        // Parse JSON array string like ["id1","id2"]
        const idsArray = typeof ids === 'string' && ids.startsWith('[')
          ? JSON.parse(ids)
          : Array.isArray(ids)
            ? ids
            : [ids]; // Single ID as array

        if (idsArray.length > 0) {
          where.id = { [Op.in]: idsArray };
          console.log(`✅ Using 'ids' parameter: Batch fetching ${idsArray.length} products`);
        }
      } catch (error) {
        console.error('❌ Error parsing ids parameter:', error);
      }
    }
    // Handle 'id' parameter (singular) - supports various formats
    else if (id) {
      try {
        // Handle JSON objects like {"$in":["uuid"]} or {"in":["uuid"]} or simple strings
        if (typeof id === 'string' && id.startsWith('{')) {
          const parsedId = JSON.parse(id);

          // Handle Sequelize operators - support both $in and in
          if ((parsedId.$in && Array.isArray(parsedId.$in)) ||
              (parsedId.in && Array.isArray(parsedId.in))) {
            const idList = parsedId.$in || parsedId.in;
            where.id = { [Op.in]: idList };
            console.log(`✅ Using 'id' parameter with ${parsedId.$in ? '$in' : 'in'} operator: Batch fetching ${idList.length} products`);
          } else {
            where.id = parsedId;
            console.log('✅ Using \'id\' parameter: Single product');
          }
        } else {
          where.id = id;
          console.log('✅ Using \'id\' parameter: Single product (string)');
        }
      } catch (error) {
        console.error('❌ Error parsing id parameter:', error);
        where.id = id; // fallback to original value
      }
    }
    
    // Search with normalized translations (much faster!)
    if (search) {
      const { sequelize } = require('../database/connection');

      // Search in normalized translation tables for product IDs
      const productIds = await sequelize.query(`
        SELECT DISTINCT product_id
        FROM product_translations
        WHERE name ILIKE :search
           OR description ILIKE :search
      `, {
        replacements: { search: `%${search}%` },
        type: sequelize.QueryTypes.SELECT
      });

      if (productIds.length > 0) {
        where[Op.or] = [
          { id: { [Op.in]: productIds.map(p => p.product_id) } },
          { sku: { [Op.iLike]: `%${search}%` } }
        ];
      } else {
        where[Op.or] = [
          { sku: { [Op.iLike]: `%${search}%` } }
        ];
      }
    }

    // Include attributeValues with associations (WITHOUT translations - using normalized tables)
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['translations'] }, // Exclude translations column - using normalized table
      include: [
        {
          model: ProductAttributeValue,
          as: 'attributeValues',
          include: [
            {
              model: Attribute,
              attributes: ['id', 'code', 'type', 'is_filterable'] // NO translations - using normalized table
            },
            {
              model: AttributeValue,
              as: 'value',
              attributes: ['id', 'code', 'metadata'] // NO translations - using normalized table
            }
          ]
        }
      ]
    });

    // Get language from request headers/query
    const lang = getLanguageFromRequest(req);

    // Apply product translations from normalized table
    const productsWithTranslations = await applyProductTranslationsToMany(rows, lang);

    // Collect all attribute and attribute value IDs
    const attributeIds = new Set();
    const attributeValueIds = new Set();

    productsWithTranslations.forEach(product => {
      if (product.attributeValues && Array.isArray(product.attributeValues)) {
        product.attributeValues.forEach(pav => {
          if (pav.Attribute) {
            attributeIds.add(pav.Attribute.id);
          }
          if (pav.value_id && pav.value) {
            attributeValueIds.add(pav.value.id);
          }
        });
      }
    });

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

    // Transform products to include formatted attributes with normalized translations
    const productsWithAttributes = productsWithTranslations.map(productData => {

      // Format attributes for frontend
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

      return productData;
    });

    // Add cache headers based on store settings
    if (store_id) {
      await applyCacheHeaders(res, store_id);
    }

    console.log(`📊 Returning ${productsWithAttributes.length} products (total: ${count})`);

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
router.get('/:id', async (req, res) => {
  try {
    const lang = getLanguageFromRequest(req);

    const product = await Product.findByPk(req.params.id, {
      attributes: { exclude: ['translations'] }, // Exclude translations column - using normalized table
      include: [
        {
          model: ProductAttributeValue,
          as: 'attributeValues',
          include: [
            {
              model: Attribute,
              attributes: ['id', 'code', 'type'] // NO translations - using normalized table
            },
            {
              model: AttributeValue,
              as: 'value',
              attributes: ['id', 'code', 'metadata'] // NO translations - using normalized table
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Apply product translations from normalized table
    const productData = await applyProductTranslations(product, lang);

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