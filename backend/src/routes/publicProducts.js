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
    
    console.log('🔍 Public Products API called with params:', req.query);
    console.log('📊 Featured param:', featured, typeof featured);
    console.log('🔍 Request URL:', req.originalUrl);

    const where = {
      status: 'active',  // Only show active products in public API
      visibility: 'visible'  // Only show visible products
    };

    console.log('🔎 Building WHERE clause with:', {
      store_id,
      slug,
      status: where.status,
      visibility: where.visibility
    });
    
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
        
        console.log(`📦 Stock filtering: display_out_of_stock=${displayOutOfStock}`);
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
          console.log('Parsed ID object:', parsedId);
          
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

    // Temporarily remove include to avoid association errors
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    console.log('✅ Public Products query result:', rows.length, 'products found');
    console.log('📊 Final WHERE conditions:', JSON.stringify(where, null, 2));
    if (rows.length > 0) {
      console.log('🎯 Sample product:', {
        id: rows[0].id,
        name: rows[0].name,
        slug: rows[0].slug,
        sku: rows[0].sku,
        status: rows[0].status,
        visibility: rows[0].visibility,
        store_id: rows[0].store_id
      });
    } else {
      console.log('❌ No products found with WHERE:', JSON.stringify(where, null, 2));
    }

    // Return just the array for public requests (for compatibility)
    res.json(rows);
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