const AkeneoClient = require('./akeneo-client');
const AkeneoMapping = require('./akeneo-mapping');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { Op } = require('sequelize');

class AkeneoIntegration {
  constructor(config) {
    this.config = config;
    this.client = new AkeneoClient(
      config.baseUrl,
      config.clientId,
      config.clientSecret,
      config.username,
      config.password
    );
    this.mapping = new AkeneoMapping();
    this.importStats = {
      categories: { total: 0, imported: 0, skipped: 0, failed: 0 },
      products: { total: 0, imported: 0, skipped: 0, failed: 0 },
      errors: []
    };
  }

  /**
   * Test connection to Akeneo PIM
   */
  async testConnection() {
    try {
      return await this.client.testConnection();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Import categories from Akeneo to Catalyst
   */
  async importCategories(storeId, options = {}) {
    const { locale = 'en_US', dryRun = false } = options;
    
    try {
      console.log('Starting category import from Akeneo...');
      
      // Get all categories from Akeneo
      const akeneoCategories = await this.client.getAllCategories();
      this.importStats.categories.total = akeneoCategories.length;

      console.log(`Found ${akeneoCategories.length} categories in Akeneo`);

      // Transform categories to Catalyst format
      const catalystCategories = akeneoCategories.map(akeneoCategory => 
        this.mapping.transformCategory(akeneoCategory, storeId, locale)
      );

      // Build category hierarchy
      const hierarchicalCategories = this.mapping.buildCategoryHierarchy(
        akeneoCategories, 
        catalystCategories
      );

      // Import categories (respecting hierarchy - parents first)
      const sortedCategories = hierarchicalCategories.sort((a, b) => a.level - b.level);
      const createdCategories = {}; // Map of akeneo_code to database ID
      
      for (const category of sortedCategories) {
        try {
          // Validate category
          const validationErrors = this.mapping.validateCategory(category);
          if (validationErrors.length > 0) {
            this.importStats.categories.failed++;
            this.importStats.errors.push({
              type: 'category',
              akeneo_code: category.akeneo_code,
              errors: validationErrors
            });
            continue;
          }

          if (!dryRun) {
            // Resolve parent_id if this category has a parent
            let parentId = null;
            if (category._temp_parent_akeneo_code && createdCategories[category._temp_parent_akeneo_code]) {
              parentId = createdCategories[category._temp_parent_akeneo_code];
            }
            
            // Check if category already exists by akeneo_code or slug
            const existingCategory = await Category.findOne({
              where: { 
                store_id: storeId,
                [Op.or]: [
                  { slug: category.slug },
                  { name: category.name }
                ]
              }
            });

            if (existingCategory) {
              // Update existing category
              await existingCategory.update({
                name: category.name,
                description: category.description,
                image_url: category.image_url,
                sort_order: category.sort_order,
                is_active: category.is_active,
                hide_in_menu: category.hide_in_menu,
                meta_title: category.meta_title,
                meta_description: category.meta_description,
                meta_keywords: category.meta_keywords,
                parent_id: parentId,
                level: category.level,
                path: category.path
              });
              
              createdCategories[category.akeneo_code] = existingCategory.id;
              console.log(`✅ Updated category: ${category.name} (ID: ${existingCategory.id})`);
            } else {
              // Prepare category data with resolved parent_id
              const categoryData = { ...category };
              delete categoryData.id;
              delete categoryData._temp_parent_akeneo_code;
              categoryData.parent_id = parentId;
              
              // Create new category
              const newCategory = await Category.create(categoryData);
              createdCategories[category.akeneo_code] = newCategory.id;
              console.log(`✅ Created category: ${newCategory.name} (ID: ${newCategory.id})`);
            }
          } else {
            console.log(`🔍 Dry run - would process category: ${category.name}`);
          }

          this.importStats.categories.imported++;
        } catch (error) {
          this.importStats.categories.failed++;
          this.importStats.errors.push({
            type: 'category',
            akeneo_code: category.akeneo_code,
            error: error.message
          });
          console.error(`Failed to import category ${category.name}:`, error.message);
        }
      }

      console.log('Category import completed');
      
      // Prepare response based on dry run mode
      const response = {
        success: true,
        stats: this.importStats.categories,
        dryRun: dryRun
      };
      
      if (dryRun) {
        response.message = `Dry run completed. Would import ${this.importStats.categories.imported} categories`;
        response.preview = {
          totalFound: this.importStats.categories.total,
          wouldImport: this.importStats.categories.imported,
          wouldSkip: this.importStats.categories.skipped,
          wouldFail: this.importStats.categories.failed
        };
      } else {
        response.message = `Imported ${this.importStats.categories.imported} categories`;
      }
      
      return response;

    } catch (error) {
      console.error('Category import failed:', error);
      return {
        success: false,
        error: error.message,
        stats: this.importStats.categories
      };
    }
  }

  /**
   * Import products from Akeneo to Catalyst
   */
  async importProducts(storeId, options = {}) {
    const { locale = 'en_US', dryRun = false, batchSize = 50 } = options;
    
    try {
      console.log('Starting product import from Akeneo...');
      
      // First, test which product endpoints are available
      console.log('🔍 Testing product endpoint availability...');
      const testResult = await this.testProductEndpoints();
      console.log('📊 Product endpoint test results:', testResult);
      
      if (!testResult.hasWorkingEndpoint) {
        return {
          success: false,
          error: `No working product endpoints found. Tested: ${testResult.testedEndpoints.join(', ')}. Last error: ${testResult.lastError}`,
          stats: this.importStats.products
        };
      }
      
      console.log(`✅ Using working endpoint: ${testResult.workingEndpoint}`);
      
      // Get category mapping for product category assignment
      const categoryMapping = await this.buildCategoryMapping(storeId);
      
      // Get all products from Akeneo using the working endpoint
      const productResponse = await this.getProductsUsingWorkingEndpoint(testResult.workingEndpoint);
      const akeneoProducts = productResponse._embedded?.items || [];
      this.importStats.products.total = akeneoProducts.length;

      console.log(`Found ${akeneoProducts.length} products in Akeneo`);

      // Process products in batches
      for (let i = 0; i < akeneoProducts.length; i += batchSize) {
        const batch = akeneoProducts.slice(i, i + batchSize);
        
        for (const akeneoProduct of batch) {
          try {
            // Transform product to Catalyst format
            const catalystProduct = this.mapping.transformProduct(akeneoProduct, storeId, locale);
            
            // Map category IDs
            catalystProduct.category_ids = this.mapping.mapCategoryIds(
              akeneoProduct.categories || [], 
              categoryMapping
            );

            // Validate product
            const validationErrors = this.mapping.validateProduct(catalystProduct);
            if (validationErrors.length > 0) {
              this.importStats.products.failed++;
              this.importStats.errors.push({
                type: 'product',
                akeneo_identifier: catalystProduct.akeneo_identifier,
                errors: validationErrors
              });
              continue;
            }

            if (!dryRun) {
              // Check if product already exists
              const existingProduct = await Product.findOne({
                where: { 
                  store_id: storeId,
                  sku: catalystProduct.sku
                }
              });

              if (existingProduct) {
                // Update existing product
                await existingProduct.update({
                  name: catalystProduct.name,
                  description: catalystProduct.description,
                  short_description: catalystProduct.short_description,
                  price: catalystProduct.price,
                  compare_price: catalystProduct.compare_price,
                  cost_price: catalystProduct.cost_price,
                  weight: catalystProduct.weight,
                  dimensions: catalystProduct.dimensions,
                  images: catalystProduct.images,
                  status: catalystProduct.status,
                  visibility: catalystProduct.visibility,
                  featured: catalystProduct.featured,
                  tags: catalystProduct.tags,
                  attributes: catalystProduct.attributes,
                  seo: catalystProduct.seo,
                  category_ids: catalystProduct.category_ids
                });
                
                console.log(`Updated product: ${catalystProduct.name}`);
              } else {
                // Create new product
                await Product.create(catalystProduct);
                console.log(`Created product: ${catalystProduct.name}`);
              }
            }

            this.importStats.products.imported++;
          } catch (error) {
            this.importStats.products.failed++;
            this.importStats.errors.push({
              type: 'product',
              akeneo_identifier: akeneoProduct.identifier,
              error: error.message
            });
            console.error(`Failed to import product ${akeneoProduct.identifier}:`, error.message);
          }
        }

        // Log progress
        console.log(`Processed ${Math.min(i + batchSize, akeneoProducts.length)} of ${akeneoProducts.length} products`);
      }

      console.log('Product import completed');
      return {
        success: true,
        stats: this.importStats.products,
        message: `Imported ${this.importStats.products.imported} products`
      };

    } catch (error) {
      console.error('Product import failed:', error);
      return {
        success: false,
        error: error.message,
        stats: this.importStats.products
      };
    }
  }

  /**
   * Import both categories and products
   */
  async importAll(storeId, options = {}) {
    const { locale = 'en_US', dryRun = false } = options;

    try {
      console.log('Starting full import from Akeneo...');

      // Reset stats
      this.resetStats();

      // Import categories first (needed for product category mapping)
      const categoryResult = await this.importCategories(storeId, { locale, dryRun });
      
      if (!categoryResult.success) {
        return {
          success: false,
          error: 'Category import failed',
          results: { categories: categoryResult }
        };
      }

      // Import products
      const productResult = await this.importProducts(storeId, { locale, dryRun });

      return {
        success: true,
        results: {
          categories: categoryResult,
          products: productResult
        },
        totalStats: {
          categories: this.importStats.categories,
          products: this.importStats.products,
          errors: this.importStats.errors
        }
      };

    } catch (error) {
      console.error('Full import failed:', error);
      return {
        success: false,
        error: error.message,
        totalStats: {
          categories: this.importStats.categories,
          products: this.importStats.products,
          errors: this.importStats.errors
        }
      };
    }
  }

  /**
   * Build mapping from Akeneo category codes to Catalyst category IDs
   */
  async buildCategoryMapping(storeId) {
    const categories = await Category.findAll({
      where: { store_id: storeId },
      attributes: ['id', 'name']
    });

    const mapping = {};
    categories.forEach(category => {
      // Create mapping based on category name (could be enhanced)
      const akeneoCode = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      mapping[akeneoCode] = category.id;
    });

    return mapping;
  }

  /**
   * Reset import statistics
   */
  resetStats() {
    this.importStats = {
      categories: { total: 0, imported: 0, skipped: 0, failed: 0 },
      products: { total: 0, imported: 0, skipped: 0, failed: 0 },
      errors: []
    };
  }

  /**
   * Get import statistics
   */
  getStats() {
    return this.importStats;
  }

  /**
   * Test which product endpoints are available
   */
  async testProductEndpoints() {
    const results = {
      hasWorkingEndpoint: false,
      workingEndpoint: null,
      testedEndpoints: [],
      lastError: null
    };
    
    const endpointsToTest = [
      { name: 'products-uuid', endpoint: '/api/rest/v1/products-uuid' },
      { name: 'products-uuid-search', endpoint: '/api/rest/v1/products-uuid/search', method: 'POST', data: {} },
      { name: 'products', endpoint: '/api/rest/v1/products' },
      { name: 'product-models', endpoint: '/api/rest/v1/product-models' }
    ];
    
    for (const test of endpointsToTest) {
      try {
        console.log(`🧪 Testing ${test.name}: ${test.endpoint}`);
        results.testedEndpoints.push(test.name);
        
        if (test.method === 'POST') {
          await this.client.makeRequest('POST', test.endpoint, test.data, { limit: 1 });
        } else {
          await this.client.makeRequest('GET', test.endpoint, null, { limit: 1 });
        }
        
        console.log(`✅ ${test.name} works!`);
        results.hasWorkingEndpoint = true;
        results.workingEndpoint = test.name;
        break;
        
      } catch (error) {
        console.log(`❌ ${test.name} failed: ${error.message}`);
        results.lastError = error.message;
      }
    }
    
    return results;
  }
  
  /**
   * Get products using the working endpoint
   */
  async getProductsUsingWorkingEndpoint(endpointName) {
    console.log(`📦 Fetching products using ${endpointName}`);
    
    switch (endpointName) {
      case 'products-uuid':
        return await this.client.makeRequest('GET', '/api/rest/v1/products-uuid', null, { limit: 10 });
      case 'products-uuid-search':
        return await this.client.makeRequest('POST', '/api/rest/v1/products-uuid/search', {}, { limit: 10 });
      case 'products':
        return await this.client.makeRequest('GET', '/api/rest/v1/products', null, { limit: 10 });
      case 'product-models':
        return await this.client.makeRequest('GET', '/api/rest/v1/product-models', null, { limit: 10 });
      default:
        throw new Error(`Unknown endpoint: ${endpointName}`);
    }
  }

  /**
   * Get configuration status
   */
  getConfigStatus() {
    return {
      hasConfig: !!(this.config.baseUrl && this.config.clientId && this.config.clientSecret),
      baseUrl: this.config.baseUrl || null,
      clientId: this.config.clientId || null,
      username: this.config.username || null
    };
  }
}

module.exports = AkeneoIntegration;