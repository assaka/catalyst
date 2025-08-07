const ShopifyClient = require('./shopify-client');
const ShopifyOAuthToken = require('../models/ShopifyOAuthToken');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Attribute = require('../models/Attribute');
const AttributeSet = require('../models/AttributeSet');
const ImportStatistic = require('../models/ImportStatistic');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class ShopifyImportService {
  constructor(storeId) {
    this.storeId = storeId;
    this.client = null;
    this.importStats = {
      collections: { total: 0, imported: 0, skipped: 0, failed: 0 },
      products: { total: 0, imported: 0, skipped: 0, failed: 0 },
      customers: { total: 0, imported: 0, skipped: 0, failed: 0 },
      orders: { total: 0, imported: 0, skipped: 0, failed: 0 },
      errors: []
    };
  }

  /**
   * Initialize the service with Shopify credentials
   */
  async initialize() {
    try {
      const tokenRecord = await ShopifyOAuthToken.findByStore(this.storeId);
      
      if (!tokenRecord) {
        throw new Error('No Shopify connection found for this store. Please connect your Shopify account first.');
      }

      this.client = new ShopifyClient(tokenRecord.shop_domain, tokenRecord.access_token);
      this.shopDomain = tokenRecord.shop_domain;
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Shopify import service:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Test connection to Shopify
   */
  async testConnection() {
    if (!this.client) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    return await this.client.testConnection();
  }

  /**
   * Import Shopify collections as categories
   */
  async importCollections(options = {}) {
    const { dryRun = false, progressCallback = null } = options;
    
    try {
      if (!this.client) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      console.log('Starting Shopify collections import...');

      // Get all collections (custom + smart)
      const collectionsData = await this.client.getAllCollections((progress) => {
        if (progressCallback) {
          progressCallback({
            stage: 'fetching_collections',
            ...progress
          });
        }
      });

      const allCollections = collectionsData.all;
      this.importStats.collections.total = allCollections.length;

      console.log(`Found ${allCollections.length} collections to import`);

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          stats: this.importStats,
          preview: allCollections.slice(0, 5).map(collection => ({
            id: collection.id,
            title: collection.title,
            handle: collection.handle,
            type: collection.collection_type || 'custom'
          }))
        };
      }

      // Process collections
      for (const collection of allCollections) {
        try {
          await this.importCollection(collection);
          this.importStats.collections.imported++;
          
          if (progressCallback) {
            progressCallback({
              stage: 'importing_collections',
              current: this.importStats.collections.imported,
              total: this.importStats.collections.total,
              item: collection.title
            });
          }
        } catch (error) {
          console.error(`Failed to import collection ${collection.title}:`, error);
          this.importStats.collections.failed++;
          this.importStats.errors.push({
            type: 'collection',
            id: collection.id,
            title: collection.title,
            error: error.message
          });
        }
      }

      // Save import statistics
      await ImportStatistic.saveImportResults(this.storeId, 'collections', {
        totalProcessed: this.importStats.collections.total,
        successfulImports: this.importStats.collections.imported,
        failedImports: this.importStats.collections.failed,
        skippedImports: this.importStats.collections.skipped,
        errorDetails: JSON.stringify(this.importStats.errors.filter(e => e.type === 'collection')),
        importMethod: 'shopify'
      });

      return {
        success: true,
        stats: this.importStats.collections,
        errors: this.importStats.errors.filter(e => e.type === 'collection')
      };

    } catch (error) {
      console.error('Collections import failed:', error);
      return {
        success: false,
        message: error.message,
        stats: this.importStats.collections
      };
    }
  }

  /**
   * Import a single Shopify collection as a category
   */
  async importCollection(collection) {
    try {
      // Check if category already exists
      const existingCategory = await Category.findOne({
        where: {
          store_id: this.storeId,
          [Op.or]: [
            { external_id: collection.id.toString() },
            { slug: collection.handle }
          ]
        }
      });

      const categoryData = {
        name: collection.title,
        description: collection.body_html || '',
        slug: collection.handle,
        is_active: collection.published_at ? true : false,
        external_id: collection.id.toString(),
        external_source: 'shopify',
        store_id: this.storeId,
        parent_id: null, // Shopify collections are flat
        level: 0,
        sort_order: collection.sort_order || 0,
        meta_title: collection.title,
        meta_description: collection.body_html ? collection.body_html.replace(/<[^>]*>/g, '').substring(0, 160) : '',
        seo_data: {
          handle: collection.handle,
          template_suffix: collection.template_suffix,
          shopify_id: collection.id,
          collection_type: collection.collection_type || 'custom'
        }
      };

      if (existingCategory) {
        await existingCategory.update(categoryData);
        console.log(`Updated collection: ${collection.title}`);
        return existingCategory;
      } else {
        const newCategory = await Category.create(categoryData);
        console.log(`Created collection: ${collection.title}`);
        return newCategory;
      }
    } catch (error) {
      console.error(`Error importing collection ${collection.title}:`, error);
      throw error;
    }
  }

  /**
   * Import Shopify products
   */
  async importProducts(options = {}) {
    const { dryRun = false, progressCallback = null, limit = null } = options;
    
    try {
      if (!this.client) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult;
        }
      }

      console.log('Starting Shopify products import...');

      // Get all products
      const products = await this.client.getAllProducts((progress) => {
        if (progressCallback) {
          progressCallback({
            stage: 'fetching_products',
            ...progress
          });
        }
      });

      // Apply limit if specified
      const productsToImport = limit ? products.slice(0, limit) : products;
      this.importStats.products.total = productsToImport.length;

      console.log(`Found ${productsToImport.length} products to import`);

      if (dryRun) {
        return {
          success: true,
          dryRun: true,
          stats: this.importStats,
          preview: productsToImport.slice(0, 5).map(product => ({
            id: product.id,
            title: product.title,
            handle: product.handle,
            variants: product.variants?.length || 0,
            status: product.status
          }))
        };
      }

      // Ensure we have required attributes for products
      await this.ensureProductAttributes();

      // Process products
      for (const product of productsToImport) {
        try {
          await this.importProduct(product);
          this.importStats.products.imported++;
          
          if (progressCallback) {
            progressCallback({
              stage: 'importing_products',
              current: this.importStats.products.imported,
              total: this.importStats.products.total,
              item: product.title
            });
          }
        } catch (error) {
          console.error(`Failed to import product ${product.title}:`, error);
          this.importStats.products.failed++;
          this.importStats.errors.push({
            type: 'product',
            id: product.id,
            title: product.title,
            error: error.message
          });
        }
      }

      // Save import statistics
      await ImportStatistic.saveImportResults(this.storeId, 'products', {
        totalProcessed: this.importStats.products.total,
        successfulImports: this.importStats.products.imported,
        failedImports: this.importStats.products.failed,
        skippedImports: this.importStats.products.skipped,
        errorDetails: JSON.stringify(this.importStats.errors.filter(e => e.type === 'product')),
        importMethod: 'shopify'
      });

      return {
        success: true,
        stats: this.importStats.products,
        errors: this.importStats.errors.filter(e => e.type === 'product')
      };

    } catch (error) {
      console.error('Products import failed:', error);
      return {
        success: false,
        message: error.message,
        stats: this.importStats.products
      };
    }
  }

  /**
   * Import a single Shopify product
   */
  async importProduct(product) {
    try {
      // Check if product already exists
      const existingProduct = await Product.findOne({
        where: {
          store_id: this.storeId,
          [Op.or]: [
            { external_id: product.id.toString() },
            { sku: product.handle }
          ]
        }
      });

      // Map collections to categories
      const categoryIds = [];
      if (product.collections && product.collections.length > 0) {
        for (const collectionId of product.collections) {
          const category = await Category.findOne({
            where: {
              store_id: this.storeId,
              external_id: collectionId.toString()
            }
          });
          if (category) {
            categoryIds.push(category.id);
          }
        }
      }

      // Prepare product data
      const productData = {
        name: product.title,
        description: product.body_html || '',
        short_description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 255) : '',
        sku: product.handle,
        status: product.status === 'active' ? 'active' : 'draft',
        price: product.variants?.[0]?.price || 0,
        compare_price: product.variants?.[0]?.compare_at_price || null,
        cost: null,
        track_quantity: product.variants?.[0]?.inventory_management === 'shopify',
        quantity: product.variants?.reduce((total, variant) => total + (variant.inventory_quantity || 0), 0) || 0,
        allow_backorder: product.variants?.[0]?.inventory_policy === 'continue',
        weight: product.variants?.[0]?.weight || null,
        weight_unit: product.variants?.[0]?.weight_unit || 'kg',
        category_ids: categoryIds,
        external_id: product.id.toString(),
        external_source: 'shopify',
        store_id: this.storeId,
        meta_title: product.title,
        meta_description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 160) : '',
        url_key: product.handle,
        seo_data: {
          handle: product.handle,
          template_suffix: product.template_suffix,
          shopify_id: product.id,
          vendor: product.vendor,
          product_type: product.product_type,
          tags: product.tags,
          variants_count: product.variants?.length || 0
        },
        custom_attributes: this.extractProductAttributes(product)
      };

      // Handle images
      if (product.images && product.images.length > 0) {
        productData.images = product.images.map((image, index) => ({
          src: image.src,
          alt: image.alt || product.title,
          position: image.position || index + 1,
          shopify_id: image.id
        }));
        
        // Set main image
        if (product.image) {
          productData.image_url = product.image.src;
        }
      }

      if (existingProduct) {
        await existingProduct.update(productData);
        console.log(`Updated product: ${product.title}`);
        return existingProduct;
      } else {
        const newProduct = await Product.create(productData);
        console.log(`Created product: ${product.title}`);
        return newProduct;
      }
    } catch (error) {
      console.error(`Error importing product ${product.title}:`, error);
      throw error;
    }
  }

  /**
   * Extract custom attributes from Shopify product
   */
  extractProductAttributes(product) {
    const attributes = {};

    // Map standard Shopify fields to custom attributes
    if (product.vendor) attributes.vendor = product.vendor;
    if (product.product_type) attributes.product_type = product.product_type;
    if (product.tags) attributes.tags = product.tags;
    
    // Handle metafields if available
    if (product.metafields) {
      product.metafields.forEach(metafield => {
        const key = `${metafield.namespace}_${metafield.key}`;
        attributes[key] = metafield.value;
      });
    }

    // Handle variant-specific attributes
    if (product.variants && product.variants.length > 0) {
      const mainVariant = product.variants[0];
      
      if (mainVariant.option1) attributes.option1 = mainVariant.option1;
      if (mainVariant.option2) attributes.option2 = mainVariant.option2;
      if (mainVariant.option3) attributes.option3 = mainVariant.option3;
      if (mainVariant.barcode) attributes.barcode = mainVariant.barcode;
      if (mainVariant.grams) attributes.grams = mainVariant.grams;
    }

    return attributes;
  }

  /**
   * Ensure required product attributes exist
   */
  async ensureProductAttributes() {
    const requiredAttributes = [
      { code: 'vendor', name: 'Vendor', type: 'text' },
      { code: 'product_type', name: 'Product Type', type: 'text' },
      { code: 'tags', name: 'Tags', type: 'text' },
      { code: 'barcode', name: 'Barcode', type: 'text' },
      { code: 'option1', name: 'Option 1', type: 'text' },
      { code: 'option2', name: 'Option 2', type: 'text' },
      { code: 'option3', name: 'Option 3', type: 'text' }
    ];

    for (const attrData of requiredAttributes) {
      const existingAttr = await Attribute.findOne({
        where: {
          store_id: this.storeId,
          code: attrData.code
        }
      });

      if (!existingAttr) {
        await Attribute.create({
          ...attrData,
          store_id: this.storeId,
          is_required: false,
          is_filterable: attrData.code === 'vendor' || attrData.code === 'product_type',
          is_searchable: true,
          sort_order: 100
        });
      }
    }
  }

  /**
   * Get import statistics
   */
  getImportStats() {
    return this.importStats;
  }

  /**
   * Full import (collections + products)
   */
  async fullImport(options = {}) {
    const { progressCallback = null } = options;
    const results = {
      collections: null,
      products: null,
      success: true,
      errors: []
    };

    try {
      // Import collections first
      if (progressCallback) {
        progressCallback({ stage: 'starting_collections', progress: 0 });
      }
      
      results.collections = await this.importCollections({
        ...options,
        progressCallback: (progress) => {
          if (progressCallback) {
            progressCallback({
              ...progress,
              overall_progress: Math.round((progress.current || 0) / (progress.total || 1) * 50) // 0-50% for collections
            });
          }
        }
      });

      if (!results.collections.success) {
        results.success = false;
        results.errors.push(...(results.collections.errors || []));
      }

      // Then import products
      if (progressCallback) {
        progressCallback({ stage: 'starting_products', progress: 50 });
      }
      
      results.products = await this.importProducts({
        ...options,
        progressCallback: (progress) => {
          if (progressCallback) {
            progressCallback({
              ...progress,
              overall_progress: 50 + Math.round((progress.current || 0) / (progress.total || 1) * 50) // 50-100% for products
            });
          }
        }
      });

      if (!results.products.success) {
        results.success = false;
        results.errors.push(...(results.products.errors || []));
      }

      return results;

    } catch (error) {
      console.error('Full import failed:', error);
      return {
        ...results,
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ShopifyImportService;