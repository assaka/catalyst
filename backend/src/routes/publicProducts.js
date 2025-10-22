const express = require('express');
const { Product, Store, ProductAttributeValue, Attribute, AttributeValue } = require('../models');
const { Op } = require('sequelize');
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
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Include attributeValues with associations
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: ProductAttributeValue,
          as: 'attributeValues',
          include: [
            {
              model: Attribute,
              attributes: ['id', 'code', 'type', 'translations', 'is_filterable']
            },
            {
              model: AttributeValue,
              as: 'value',
              attributes: ['id', 'code', 'translations', 'metadata']
            }
          ]
        }
      ]
    });

    // Get language from query or default to 'en'
    const lang = req.query.lang || 'en';

    // Transform products to include formatted attributes
    const productsWithAttributes = rows.map(product => {
      const productData = product.toJSON();

      // Format attributes for frontend
      if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
        productData.attributes = productData.attributeValues.map(pav => {
          const attr = pav.Attribute;
          if (!attr) return null;

          const attrLabel = attr.translations?.[lang]?.label ||
                           attr.translations?.en?.label ||
                           attr.code;

          let value, valueLabel, metadata = null;

          if (pav.value_id && pav.value) {
            // Select/multiselect attribute
            value = pav.value.code;
            valueLabel = pav.value.translations?.[lang]?.label ||
                        pav.value.translations?.en?.label ||
                        pav.value.code;
            metadata = pav.value.metadata || null;
          } else {
            // Text/number/date/boolean attribute
            value = pav.text_value || pav.number_value || pav.date_value || pav.boolean_value;
            valueLabel = String(value);
          }

          return {
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
    const { lang = 'en' } = req.query;

    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: ProductAttributeValue,
          as: 'attributeValues',
          include: [
            {
              model: Attribute,
              attributes: ['id', 'code', 'type', 'translations']
            },
            {
              model: AttributeValue,
              as: 'value',
              attributes: ['id', 'code', 'translations', 'metadata']
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

    // Transform product to include formatted attributes
    const productData = product.toJSON();

    // Format attributes for frontend
    if (productData.attributeValues && Array.isArray(productData.attributeValues)) {
      productData.attributes = productData.attributeValues.map(pav => {
        const attr = pav.Attribute;
        if (!attr) return null;

        const attrLabel = attr.translations?.[lang]?.label ||
                         attr.translations?.en?.label ||
                         attr.code;

        let value, valueLabel, metadata = null;

        if (pav.value_id && pav.value) {
          // Select/multiselect attribute
          value = pav.value.code;
          valueLabel = pav.value.translations?.[lang]?.label ||
                      pav.value.translations?.en?.label ||
                      pav.value.code;
          metadata = pav.value.metadata || null;
        } else {
          // Text/number/date/boolean attribute
          value = pav.text_value || pav.number_value || pav.date_value || pav.boolean_value;
          valueLabel = String(value);
        }

        return {
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