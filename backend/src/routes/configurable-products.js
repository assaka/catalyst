const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { masterDbClient } = require('../database/masterConnection');
const router = express.Router();

const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth');
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

      // Get store_id from master DB
      const { data: masterProduct, error: masterError } = await masterDbClient
        .from('products')
        .select('id, store_id, type')
        .eq('id', req.params.id)
        .single();

      if (masterError || !masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

      const { data: parentProduct, error: parentError } = await tenantDb
        .from('products')
        .select('*, stores!inner(id, name, user_id)')
        .eq('id', req.params.id)
        .single();

      if (parentError || !parentProduct) {
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
      const { data: variantProducts, error: variantError } = await tenantDb
        .from('products')
        .select('*')
        .in('id', variant_ids)
        .eq('store_id', parentProduct.store_id)
        .eq('type', 'simple');

      if (variantError || !variantProducts || variantProducts.length !== variant_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more variant products not found or not of type "simple"'
        });
      }

      // Get all existing variants for this configurable product
      const { data: existingVariants } = await tenantDb
        .from('product_variants')
        .select('*')
        .eq('parent_product_id', parentProduct.id);

      // Check for duplicate attribute combinations
      const duplicates = [];
      for (const variantId of variant_ids) {
        const newAttributeValues = attribute_values_map?.[variantId] || {};

        // Check if this exact attribute combination already exists
        const isDuplicate = (existingVariants || []).some(existingVariant => {
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
        const { data: existing } = await tenantDb
          .from('product_variants')
          .select('*')
          .eq('parent_product_id', parentProduct.id)
          .eq('variant_product_id', variantId)
          .maybeSingle();

        if (!existing) {
          const { data: variant, error: createError } = await tenantDb
            .from('product_variants')
            .insert({
              parent_product_id: parentProduct.id,
              variant_product_id: variantId,
              attribute_values: attributeValues
            })
            .select()
            .single();

          if (!createError && variant) {
            variantRelationships.push(variant);

            // Update variant's parent_id
            await tenantDb
              .from('products')
              .update({ parent_id: parentProduct.id })
              .eq('id', variantId);
          }
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
    // Get store_id from master DB
    const { data: masterProduct, error: masterError } = await masterDbClient
      .from('products')
      .select('id, store_id')
      .eq('id', req.params.id)
      .single();

    if (masterError || !masterProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

    const { data: parentProduct, error: parentError } = await tenantDb
      .from('products')
      .select('*, stores!inner(id, name, user_id)')
      .eq('id', req.params.id)
      .single();

    if (parentError || !parentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, parentProduct.stores.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get variants with their attribute values and related products
    const { data: variants, error: variantsError } = await tenantDb
      .from('product_variants')
      .select('*, variant:products!variant_product_id(*, stores!inner(id, name))')
      .eq('parent_product_id', req.params.id)
      .order('sort_order', { ascending: true });

    if (variantsError) {
      throw new Error(variantsError.message);
    }

    res.json({
      success: true,
      data: variants || []
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

      // Get store_id from master DB
      const { data: masterProduct, error: masterError } = await masterDbClient
        .from('products')
        .select('id, store_id')
        .eq('id', req.params.id)
        .single();

      if (masterError || !masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

      const { data: variantRelation, error: relationError } = await tenantDb
        .from('product_variants')
        .select('*')
        .eq('parent_product_id', req.params.id)
        .eq('variant_product_id', req.params.variantId)
        .single();

      if (relationError || !variantRelation) {
        return res.status(404).json({
          success: false,
          message: 'Variant relationship not found'
        });
      }

      const { data: updated, error: updateError } = await tenantDb
        .from('product_variants')
        .update(req.body)
        .eq('parent_product_id', req.params.id)
        .eq('variant_product_id', req.params.variantId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      res.json({
        success: true,
        message: 'Variant updated successfully',
        data: updated
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
      // Get store_id from master DB
      const { data: masterProduct, error: masterError } = await masterDbClient
        .from('products')
        .select('id, store_id')
        .eq('id', req.params.id)
        .single();

      if (masterError || !masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

      const { data: variantRelation, error: relationError } = await tenantDb
        .from('product_variants')
        .select('*')
        .eq('parent_product_id', req.params.id)
        .eq('variant_product_id', req.params.variantId)
        .single();

      if (relationError || !variantRelation) {
        return res.status(404).json({
          success: false,
          message: 'Variant relationship not found'
        });
      }

      await tenantDb
        .from('product_variants')
        .delete()
        .eq('parent_product_id', req.params.id)
        .eq('variant_product_id', req.params.variantId);

      // Remove parent_id from variant product
      await tenantDb
        .from('products')
        .update({ parent_id: null })
        .eq('id', req.params.variantId);

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

      // Get store_id from master DB
      const { data: masterProduct, error: masterError } = await masterDbClient
        .from('products')
        .select('id, store_id')
        .eq('id', req.params.id)
        .single();

      if (masterError || !masterProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Get tenant connection
      const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

      const { data: product, error: productError } = await tenantDb
        .from('products')
        .select('*, stores!inner(id, name, user_id)')
        .eq('id', req.params.id)
        .single();

      if (productError || !product) {
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
      const { data: attributes, error: attrError } = await tenantDb
        .from('attributes')
        .select('*')
        .in('id', configurable_attributes)
        .eq('store_id', product.store_id)
        .eq('is_configurable', true);

      if (attrError || !attributes || attributes.length !== configurable_attributes.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more attributes not found or not marked as configurable'
        });
      }

      const { data: updated, error: updateError } = await tenantDb
        .from('products')
        .update({ configurable_attributes })
        .eq('id', req.params.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      res.json({
        success: true,
        message: 'Configurable attributes updated successfully',
        data: updated
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
    // Get store_id from master DB
    const { data: masterProduct, error: masterError } = await masterDbClient
      .from('products')
      .select('id, store_id')
      .eq('id', req.params.id)
      .single();

    if (masterError || !masterProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

    const { data: parentProduct, error: parentError } = await tenantDb
      .from('products')
      .select('*, stores!inner(id, name)')
      .eq('id', req.params.id)
      .single();

    if (parentError || !parentProduct) {
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
    const { data: store } = await tenantDb
      .from('stores')
      .select('settings')
      .eq('id', parentProduct.stores.id)
      .single();

    const displayOutOfStockVariants = store?.settings?.display_out_of_stock_variants !== false; // Default to true

    console.log('🔍 display_out_of_stock_variants setting:', displayOutOfStockVariants);

    // Get all variants for this product
    const { data: allVariants, error: variantsError } = await tenantDb
      .from('product_variants')
      .select('*, variant:products!variant_product_id(*)')
      .eq('parent_product_id', req.params.id)
      .order('sort_order', { ascending: true });

    if (variantsError) {
      throw new Error(variantsError.message);
    }

    // Filter variants based on status, visibility, and stock
    const variants = (allVariants || []).filter(v => {
      const variant = v.variant;
      if (!variant) return false;

      // Must be active and visible
      if (variant.status !== 'active' || variant.visibility !== 'visible') {
        return false;
      }

      // If store doesn't display out-of-stock variants, check stock
      if (!displayOutOfStockVariants) {
        const hasInfiniteStock = variant.infinite_stock === true;
        const doesNotManageStock = variant.manage_stock === false;
        const hasStock = variant.manage_stock === true && variant.stock_quantity > 0;

        return hasInfiniteStock || doesNotManageStock || hasStock;
      }

      return true;
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
    // Get store_id from master DB
    const { data: masterProduct, error: masterError } = await masterDbClient
      .from('products')
      .select('id, store_id')
      .eq('id', req.params.id)
      .single();

    if (masterError || !masterProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(masterProduct.store_id);

    const { data: parentProduct, error: parentError } = await tenantDb
      .from('products')
      .select('*, stores!inner(id, name, user_id)')
      .eq('id', req.params.id)
      .single();

    if (parentError || !parentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, parentProduct.stores.id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get currently assigned variant IDs
    const { data: assignedVariants } = await tenantDb
      .from('product_variants')
      .select('variant_product_id')
      .eq('parent_product_id', req.params.id);

    const assignedIds = (assignedVariants || []).map(v => v.variant_product_id);
    const excludeIds = [...assignedIds, parentProduct.id];

    // Get simple products that are not already assigned
    // Note: We include all simple products regardless of status/visibility
    // so admins can add inactive or hidden products as variants
    const { data: availableProducts, error: productsError } = await tenantDb
      .from('products')
      .select('*')
      .eq('store_id', parentProduct.store_id)
      .eq('type', 'simple')
      .not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`)
      .is('parent_id', null)
      .order('name', { ascending: true })
      .limit(100);

    if (productsError) {
      throw new Error(productsError.message);
    }

    console.log(`📦 Available variants for ${parentProduct.name}:`, {
      total: (availableProducts || []).length,
      alreadyAssigned: assignedIds.length,
      products: (availableProducts || []).map(p => ({ id: p.id, name: p.name, sku: p.sku, status: p.status, visibility: p.visibility, parent_id: p.parent_id }))
    });

    res.json({
      success: true,
      data: availableProducts || []
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
