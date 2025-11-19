const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { Product: MasterProduct } = require('../models'); // Tenant DB model
const { Op } = require('sequelize');
const router = express.Router();

const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { checkStoreOwnership, checkResourceOwnership } = require('../middleware/storeAuth');

// @route   POST /api/configurable-products/:id/variants
// @desc    Add variants to a configurable product
// @access  Private
router.post('/:id/variants',
  authMiddleware,
  authorize(['admin', 'store_owner']),
  checkResourceOwnership('Product'),
  [
    body('variant_ids').isArray().withMessage('variant_ids must be an array'),
    body('variant_ids.*').isUUID().withMessage('Each variant_id must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Get store_id from master Product
      const masterProduct = await MasterProduct.findByPk(req.params.id, {
        attributes: ['id', 'store_id', 'type']
      });

      if (!masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection and models
      const connection = await ConnectionManager.getConnection(masterProduct.store_id);
      const { Product, ProductVariant, Store } = connection.models;

      const parentProduct = await Product.findByPk(req.params.id, {
        include: [{
          model: Store,
          attributes: ['id', 'name', 'user_id']
        }]
      });

      if (!parentProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if product is configurable
      if (parentProduct.type !== 'configurable') {
        return res.status(400).json({
          success: false,
          message: 'Product must be of type "configurable" to add variants'
        });
      }

      const { variant_ids, attribute_values_map } = req.body;

      // Validate all variant products exist and are simple products
      const variantProducts = await Product.findAll({
        where: {
          id: { [Op.in]: variant_ids },
          store_id: parentProduct.store_id,
          type: 'simple'
        }
      });

      if (variantProducts.length !== variant_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more variant products not found or not of type "simple"'
        });
      }

      // Get all existing variants for this configurable product
      const existingVariants = await ProductVariant.findAll({
        where: { parent_product_id: parentProduct.id }
      });

      // Check for duplicate attribute combinations
      const duplicates = [];
      for (const variantId of variant_ids) {
        const newAttributeValues = attribute_values_map?.[variantId] || {};

        // Check if this exact attribute combination already exists
        const isDuplicate = existingVariants.some(existingVariant => {
          const existingAttrs = existingVariant.attribute_values || {};

          // Compare attribute values
          const existingKeys = Object.keys(existingAttrs).sort();
          const newKeys = Object.keys(newAttributeValues).sort();

          // Must have same keys
          if (existingKeys.length !== newKeys.length) return false;
          if (!existingKeys.every((key, idx) => key === newKeys[idx])) return false;

          // Must have same values for all keys
          return existingKeys.every(key => existingAttrs[key] === newAttributeValues[key]);
        });

        if (isDuplicate) {
          // Get human-readable attribute values
          const attrDisplay = Object.entries(newAttributeValues)
            .map(([key, val]) => `${key}=${val}`)
            .join(', ');
          duplicates.push(attrDisplay || 'empty attributes');
        }
      }

      if (duplicates.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot add variants: A variant with these attribute combinations already exists: ${duplicates.join('; ')}`
        });
      }

      // Create variant relationships
      const variantRelationships = [];
      for (const variantId of variant_ids) {
        const attributeValues = attribute_values_map?.[variantId] || {};

        // Check if relationship already exists
        const existing = await ProductVariant.findOne({
          where: {
            parent_product_id: parentProduct.id,
            variant_product_id: variantId
          }
        });

        if (!existing) {
          const variant = await ProductVariant.create({
            parent_product_id: parentProduct.id,
            variant_product_id: variantId,
            attribute_values: attributeValues
          });
          variantRelationships.push(variant);

          // Update variant's parent_id
          await Product.update(
            { parent_id: parentProduct.id },
            { where: { id: variantId } }
          );
        } else {
          variantRelationships.push(existing);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Variants added successfully',
        data: variantRelationships
      });
    } catch (error) {
      console.error('Add variants error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @route   GET /api/configurable-products/:id/variants
// @desc    Get all variants for a configurable product
// @access  Private
router.get('/:id/variants', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    // Get store_id from master Product
    const masterProduct = await MasterProduct.findByPk(req.params.id, {
      attributes: ['id', 'store_id']
    });

    if (!masterProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(masterProduct.store_id);
    const { Product, ProductVariant, Store } = connection.models;

    const parentProduct = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });

    if (!parentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, parentProduct.Store.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get variants with their attribute values
    const variants = await ProductVariant.findAll({
      where: { parent_product_id: req.params.id },
      include: [
        {
          model: Product,
          as: 'variant',
          include: [{
            model: Store,
            attributes: ['id', 'name']
          }]
        }
      ],
      order: [['sort_order', 'ASC']]
    });

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/configurable-products/:id/variants/:variantId
// @desc    Update variant attribute values
// @access  Private
router.put('/:id/variants/:variantId',
  authMiddleware,
  authorize(['admin', 'store_owner']),
  checkResourceOwnership('Product'),
  [
    body('attribute_values').optional().isObject().withMessage('attribute_values must be an object')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Get store_id from master Product
      const masterProduct = await MasterProduct.findByPk(req.params.id, {
        attributes: ['id', 'store_id']
      });

      if (!masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection and models
      const connection = await ConnectionManager.getConnection(masterProduct.store_id);
      const { ProductVariant } = connection.models;

      const variantRelation = await ProductVariant.findOne({
        where: {
          parent_product_id: req.params.id,
          variant_product_id: req.params.variantId
        }
      });

      if (!variantRelation) {
        return res.status(404).json({
          success: false,
          message: 'Variant relationship not found'
        });
      }

      await variantRelation.update(req.body);

      res.json({
        success: true,
        message: 'Variant updated successfully',
        data: variantRelation
      });
    } catch (error) {
      console.error('Update variant error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   DELETE /api/configurable-products/:id/variants/:variantId
// @desc    Remove variant from configurable product
// @access  Private
router.delete('/:id/variants/:variantId',
  authMiddleware,
  authorize(['admin', 'store_owner']),
  checkResourceOwnership('Product'),
  async (req, res) => {
    try {
      // Get store_id from master Product
      const masterProduct = await MasterProduct.findByPk(req.params.id, {
        attributes: ['id', 'store_id']
      });

      if (!masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection and models
      const connection = await ConnectionManager.getConnection(masterProduct.store_id);
      const { Product, ProductVariant } = connection.models;

      const variantRelation = await ProductVariant.findOne({
        where: {
          parent_product_id: req.params.id,
          variant_product_id: req.params.variantId
        }
      });

      if (!variantRelation) {
        return res.status(404).json({
          success: false,
          message: 'Variant relationship not found'
        });
      }

      await variantRelation.destroy();

      // Remove parent_id from variant product
      await Product.update(
        { parent_id: null },
        { where: { id: req.params.variantId } }
      );

      res.json({
        success: true,
        message: 'Variant removed successfully'
      });
    } catch (error) {
      console.error('Delete variant error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   PUT /api/configurable-products/:id/configurable-attributes
// @desc    Update configurable attributes for a product
// @access  Private
router.put('/:id/configurable-attributes',
  authMiddleware,
  authorize(['admin', 'store_owner']),
  checkResourceOwnership('Product'),
  [
    body('configurable_attributes').isArray().withMessage('configurable_attributes must be an array'),
    body('configurable_attributes.*').isUUID().withMessage('Each attribute ID must be a valid UUID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Get store_id from master Product
      const masterProduct = await MasterProduct.findByPk(req.params.id, {
        attributes: ['id', 'store_id']
      });

      if (!masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection and models
      const connection = await ConnectionManager.getConnection(masterProduct.store_id);
      const { Product, Attribute, Store } = connection.models;

      const product = await Product.findByPk(req.params.id, {
        include: [{
          model: Store,
          attributes: ['id', 'name', 'user_id']
        }]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      if (product.type !== 'configurable') {
        return res.status(400).json({
          success: false,
          message: 'Product must be of type "configurable"'
        });
      }

      const { configurable_attributes } = req.body;

      // Validate all attributes exist and are configurable
      const attributes = await Attribute.findAll({
        where: {
          id: { [Op.in]: configurable_attributes },
          store_id: product.store_id,
          is_configurable: true
        }
      });

      if (attributes.length !== configurable_attributes.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attributes not found or not marked as configurable'
        });
      }

      await product.update({ configurable_attributes });

      res.json({
        success: true,
        message: 'Configurable attributes updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Update configurable attributes error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// @route   GET /api/configurable-products/:id/public-variants
// @desc    Get all variants for a configurable product (public access)
// @access  Public
router.get('/:id/public-variants', async (req, res) => {
  try {
    // Get store_id from master Product
    const masterProduct = await MasterProduct.findByPk(req.params.id, {
      attributes: ['id', 'store_id']
    });

    if (!masterProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(masterProduct.store_id);
    const { Product, ProductVariant, Store } = connection.models;

    const parentProduct = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name']
      }]
    });

    if (!parentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is configurable
    if (parentProduct.type !== 'configurable') {
      return res.status(400).json({
        success: false,
        message: 'Product is not configurable'
      });
    }

    // Check store's display_out_of_stock_variants setting
    const store = await Store.findByPk(parentProduct.Store.id, {
      attributes: ['settings']
    });
    const displayOutOfStockVariants = store?.settings?.display_out_of_stock_variants !== false; // Default to true

    // Build variant product WHERE clause
    const variantWhere = {
      status: 'active',
      visibility: 'visible'
    };

    // If store doesn't display out-of-stock variants, filter them by stock
    if (!displayOutOfStockVariants) {
      variantWhere[Op.or] = [
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

    console.log('🔍 public-variants WHERE clause:', JSON.stringify(variantWhere, null, 2));
    console.log('🔍 display_out_of_stock_variants setting:', displayOutOfStockVariants);

    // Get variants with their attribute values - only active and visible
    const variants = await ProductVariant.findAll({
      where: { parent_product_id: req.params.id },
      include: [
        {
          model: Product,
          as: 'variant',
          where: variantWhere,
          required: true // Only return ProductVariants with valid products
        }
      ],
      order: [['sort_order', 'ASC']]
    });

    console.log(`📦 Public variants for ${parentProduct.name}: Found ${variants.length} variants (display_out_of_stock_variants=${displayOutOfStockVariants})`);

    // Log each variant's details
    variants.forEach((v, i) => {
      console.log(`  Variant ${i + 1}:`, {
        id: v.variant_product_id,
        name: v.variant?.name,
        attribute_values: v.attribute_values,
        status: v.variant?.status,
        visibility: v.variant?.visibility,
        stock: v.variant?.stock_quantity
      });
    });

    res.json({
      success: true,
      data: variants
    });
  } catch (error) {
    console.error('Get public variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/configurable-products/:id/available-variants
// @desc    Get available simple products that can be added as variants
// @access  Private
router.get('/:id/available-variants', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    // Get store_id from master Product
    const masterProduct = await MasterProduct.findByPk(req.params.id, {
      attributes: ['id', 'store_id']
    });

    if (!masterProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get tenant connection and models
    const connection = await ConnectionManager.getConnection(masterProduct.store_id);
    const { Product, ProductVariant, Store } = connection.models;

    const parentProduct = await Product.findByPk(req.params.id, {
      include: [{
        model: Store,
        attributes: ['id', 'name', 'user_id']
      }]
    });

    if (!parentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, parentProduct.Store.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get currently assigned variant IDs
    const assignedVariants = await ProductVariant.findAll({
      where: { parent_product_id: req.params.id },
      attributes: ['variant_product_id']
    });

    const assignedIds = assignedVariants.map(v => v.variant_product_id);

    // Get simple products that are not already assigned
    // Note: We include all simple products regardless of status/visibility
    // so admins can add inactive or hidden products as variants
    const availableProducts = await Product.findAll({
      where: {
        store_id: parentProduct.store_id,
        type: 'simple',
        id: { [Op.notIn]: [...assignedIds, parentProduct.id] },
        parent_id: null // Only products not already assigned to another configurable
      },
      order: [['name', 'ASC']],
      limit: 100
    });

    console.log(`📦 Available variants for ${parentProduct.name}:`, {
      total: availableProducts.length,
      alreadyAssigned: assignedIds.length,
      products: availableProducts.map(p => ({ id: p.id, name: p.name, sku: p.sku, status: p.status, visibility: p.visibility, parent_id: p.parent_id }))
    });

    res.json({
      success: true,
      data: availableProducts
    });
  } catch (error) {
    console.error('Get available variants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
