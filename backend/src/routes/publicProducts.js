const express = require('express');
const { Product, Store, ProductAttributeValue, Attribute, AttributeValue } = require('../models');
const { Op } = require('sequelize');
const { getLanguageFromRequest } = require('../utils/languageUtils');
const { applyProductTranslationsToMany, applyProductTranslations } = require('../utils/productHelpers');
const { getAttributesWithTranslations, getAttributeValuesWithTranslations } = require('../utils/attributeHelpers');
const router = express.Router();

// @route   GET /api/public/products
// @desc    Get all active products (no authentication required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, category_id, status = 'active', search, slug, sku, id, featured } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      status: 'active',  // Only show active products in public API
      visibility: 'visible'  // Only show visible products
    };

    if (store_id) {
      where.store_id = store_id;
      
      // Check store's display_out_of_stock setting
      try {
        const store = await Store.findByPk(store_id, {
          attributes: ['settings']
        });
        
        const displayOutOfStock = store?.settings?.display_out_of_stock !== false; // Default to true
        
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
    if (id) {
      try {
        // Handle JSON objects like {"$in":["uuid"]} or simple strings
        if (typeof id === 'string' && id.startsWith('{')) {
          const parsedId = JSON.parse(id);
          
          // Handle Sequelize operators
          if (parsedId.$in && Array.isArray(parsedId.$in)) {
            where.id = { [Op.in]: parsedId.$in };
          } else {
            where.id = parsedId;
          }
        } else {
          where.id = id;
        }
      } catch (error) {
        console.error('Error parsing id parameter:', error);
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
    console.log('🌍 Public Products: Requesting language:', lang);

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

    // Return just the array for public requests (for compatibility)
    res.json(productsWithAttributes);
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
    console.log('🌍 Public Product Detail: Requesting language:', lang);

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

module.exports = router;