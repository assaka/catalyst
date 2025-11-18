const express = require('express');
const { body, validationResult } = require('express-validator');
const ConnectionManager = require('../services/database/ConnectionManager');
const { Op } = require('sequelize');
const translationService = require('../services/translation-service');
const creditService = require('../services/credit-service');
const { applyAllProductTranslations, updateProductTranslations } = require('../utils/productHelpers');
const router = express.Router();

// Import the new store auth middleware
const { checkStoreOwnership: storeAuthMiddleware, checkResourceOwnership } = require('../middleware/storeAuth');

// @route   GET /api/products
// @desc    Get products (authenticated users only)
// @access  Private
const { authMiddleware } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

router.get('/', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const { page = 1, limit = 100, store_id, category_id, status, search, slug, sku, id, include_all_translations } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('🔍 Admin Products API called with params:', req.query);
    console.log('📊 Status parameter:', status, typeof status);

    const where = {};
    
    // Filter by store access (ownership + team membership)
    if (req.user.role !== 'admin') {
      const { getUserStoresForDropdown } = require('../utils/storeAccess');
      const accessibleStores = await getUserStoresForDropdown(req.user.id);
      const userStoreIds = accessibleStores.map(store => store.id);
      

      // If a specific store_id is requested, check if user owns it
      if (store_id) {
        if (userStoreIds.includes(store_id)) {
          where.store_id = store_id;
        } else {
          // Return empty result if user doesn't own the requested store
          return res.json({
            success: true,
            data: {
              products: [],
              pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: 0,
                total_pages: 0
              }
            }
          });
        }
      } else {
        // No specific store requested, filter by all user's stores
        where.store_id = { [Op.in]: userStoreIds };
      }
    } else {
      // Admin user - can access any store
      if (store_id) where.store_id = store_id;
    }
    if (category_id) {
      // category_ids is stored as JSON array, need to check if it contains the category_id
      where.category_ids = { [Op.contains]: [category_id] };
    }
    if (status) where.status = status;
    if (slug) {
      where.slug = slug;
    }
    if (sku) {
      where.sku = sku;
    }
    if (id) {
      where.id = id;
    }
    if (search) {
      // Note: Search limited to SKU only - Product model now uses translations JSON
      // field instead of direct name/description columns
      // TODO: Implement JSON-based search or add computed columns for search
      where.sku = { [Op.iLike]: `%${search}%` };
    }

    console.log('🔎 Final WHERE clause for products query:', JSON.stringify(where, null, 2));

    // Temporarily remove Store include to avoid association errors
    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Apply all translations if requested (for admin translation management)
    let products = rows;
    if (include_all_translations === 'true') {
      console.log('🌍 Products: Including all translations');
      products = await applyAllProductTranslations(rows);
    }

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', 
  authMiddleware, 
  authorize(['admin', 'store_owner']), 
  storeAuthMiddleware, // Check store ownership
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('price').isDecimal().withMessage('Price must be a valid decimal'),
    body('store_id').isUUID().withMessage('Store ID must be a valid UUID')
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

    const { store_id } = req.body;

    // Store ownership check is now handled by middleware

    // Get tenant database connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Insert product using Supabase client
    const { data: product, error } = await tenantDb
      .from('products')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);

    // Handle specific database errors
    let statusCode = 500;
    let message = 'Server error';

    // Supabase/Postgres error handling
    if (error.code === '23505') { // Unique constraint violation
      statusCode = 409;
      if (error.message.includes('products_sku_store_id_key')) {
        message = `A product with SKU "${req.body.sku}" already exists in this store`;
      } else if (error.message.includes('products_slug_store_id_key')) {
        message = `A product with slug "${req.body.slug}" already exists in this store`;
      } else {
        message = 'A product with these values already exists';
      }
    } else if (error.code === '23503') { // Foreign key constraint violation
      statusCode = 400;
      message = 'Invalid reference: Please ensure all product settings are valid';
    } else if (error.message) {
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', 
  authMiddleware, 
  authorize(['admin', 'store_owner']),
  checkResourceOwnership('Product'), // Check if user owns the product's store
  [
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('sku').optional().notEmpty().withMessage('SKU cannot be empty'),
    body('price').optional().isDecimal().withMessage('Price must be a valid decimal')
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

    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Extract translations from request body
    const { translations, ...productData } = req.body;

    // Update product data (excluding translations)
    await product.update(productData);

    // Update translations in normalized table if provided
    if (translations && Object.keys(translations).length > 0) {
      await updateProductTranslations(product.id, translations);
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', authMiddleware, authorize(['admin', 'store_owner']), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products/:id/translate
// @desc    AI translate a single product to target language
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
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check store access
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, product.store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Check if source translation exists
    if (!product.translations || !product.translations[fromLang]) {
      return res.status(400).json({
        success: false,
        message: `No ${fromLang} translation found for this product`
      });
    }

    // Translate the product
    const updatedProduct = await translationService.aiTranslateEntity('product', req.params.id, fromLang, toLang);

    res.json({
      success: true,
      message: `Product translated to ${toLang} successfully`,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Translate product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/products/bulk-translate
// @desc    AI translate all products in a store to target language
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
    if (req.user.role !== 'admin') {
      const { checkUserStoreAccess } = require('../utils/storeAccess');
      const access = await checkUserStoreAccess(req.user.id, store_id);

      if (!access) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Get all products for this store with ALL translations from product_translations table
    const { applyAllProductTranslations } = require('../utils/productHelpers');

    const productsRaw = await Product.findAll({
      where: { store_id },
      order: [['created_at', 'DESC']]
    });

    // Load all translations from product_translations table
    const products = await applyAllProductTranslations(productsRaw);

    console.log(`📦 Loaded ${products.length} products from database with ALL translations`);
    if (products.length > 0) {
      console.log(`🔍 First product structure:`, JSON.stringify({
        id: products[0].id,
        name: products[0].name,
        translations: products[0].translations,
        hasTranslations: !!products[0].translations,
        translationKeys: products[0].translations ? Object.keys(products[0].translations) : 'none'
      }, null, 2));
    }

    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'No products found to translate',
        data: {
          total: 0,
          translated: 0,
          skipped: 0,
          failed: 0
        }
      });
    }

    // Translate each product
    const results = {
      total: products.length,
      translated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      skippedDetails: []
    };

    console.log(`🌐 Starting product translation: ${fromLang} → ${toLang} (${products.length} products)`);

    for (const product of products) {
      try {
        const productName = product.translations?.[fromLang]?.name || product.name || `Product ${product.id}`;

        console.log(`\n📋 Processing product: ${productName}`);
        console.log(`   - Has translations object: ${!!product.translations}`);
        console.log(`   - Has ${fromLang} translation: ${!!(product.translations && product.translations[fromLang])}`);
        console.log(`   - Translations keys:`, product.translations ? Object.keys(product.translations) : 'none');

        // Check if source translation exists
        if (!product.translations || !product.translations[fromLang]) {
          console.log(`⏭️  Skipping product "${productName}": No ${fromLang} translation`);
          results.skipped++;
          results.skippedDetails.push({
            productId: product.id,
            productName,
            reason: `No ${fromLang} translation found`
          });
          continue;
        }

        // Check if ALL target fields have content (aiTranslateEntity will handle field-level merging)
        const sourceFields = Object.entries(product.translations[fromLang] || {});
        const targetTranslation = product.translations[toLang] || {};

        const allFieldsTranslated = sourceFields.every(([key, value]) => {
          if (!value || typeof value !== 'string' || !value.trim()) return true; // Ignore empty source fields
          const targetValue = targetTranslation[key];
          return targetValue && typeof targetValue === 'string' && targetValue.trim().length > 0;
        });

        if (allFieldsTranslated && sourceFields.length > 0) {
          console.log(`⏭️  Skipping product "${productName}": All fields already translated`);
          results.skipped++;
          results.skippedDetails.push({
            productId: product.id,
            productName,
            reason: `All fields already translated`
          });
          continue;
        }

        // Translate the product (field-level translation handled by aiTranslateEntity)
        console.log(`🔄 Translating product "${productName}"...`);
        await translationService.aiTranslateEntity('product', product.id, fromLang, toLang);
        console.log(`✅ Successfully translated product "${productName}"`);
        results.translated++;
      } catch (error) {
        const productName = product.translations?.[fromLang]?.name || product.name || `Product ${product.id}`;
        console.error(`❌ Error translating product "${productName}":`, error);
        results.failed++;
        results.errors.push({
          productId: product.id,
          productName,
          error: error.message
        });
      }
    }

    console.log(`✅ Product translation complete: ${results.translated} translated, ${results.skipped} skipped, ${results.failed} failed`);

    // Deduct credits for ALL items (including skipped)
    const totalItems = products.length;
    let actualCost = 0;

    if (totalItems > 0) {
      const costPerItem = await translationService.getTranslationCost('product');
      actualCost = totalItems * costPerItem;

      console.log(`💰 Product bulk translate - charging for ${totalItems} items × ${costPerItem} credits = ${actualCost} credits`);

      try {
        await creditService.deduct(
          req.user.id,
          store_id,
          actualCost,
          `Bulk Product Translation (${fromLang} → ${toLang})`,
          {
            fromLang,
            toLang,
            totalItems,
            translated: results.translated,
            skipped: results.skipped,
            failed: results.failed,
            note: 'Charged for all items including skipped'
          },
          null,
          'ai_translation'
        );
        console.log(`✅ Deducted ${actualCost} credits for ${totalItems} products`);
      } catch (deductError) {
        console.error(`❌ CREDIT DEDUCTION FAILED (product-bulk-translate):`, deductError);
        actualCost = 0;
      }
    }

    res.json({
      success: true,
      message: `Bulk translation completed. Translated: ${results.translated}, Skipped: ${results.skipped}, Failed: ${results.failed}`,
      data: { ...results, creditsDeducted: actualCost }
    });
  } catch (error) {
    console.error('Bulk translate products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;