const AkeneoClient = require('./akeneo-client');
const AkeneoMapping = require('./akeneo-mapping');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Attribute = require('../models/Attribute');
const AttributeSet = require('../models/AttributeSet');
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
      families: { total: 0, imported: 0, skipped: 0, failed: 0 },
      attributes: { total: 0, imported: 0, skipped: 0, failed: 0 },
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
    const { locale = 'en_US', dryRun = false, filters = {} } = options;
    
    try {
      console.log('Starting category import from Akeneo...');
      
      // Get all categories from Akeneo
      let akeneoCategories = await this.client.getAllCategories();
      
      // Apply filters if specified
      if (filters.channels && filters.channels.length > 0) {
        console.log(`🔍 Filtering categories by channels: ${filters.channels.join(', ')}`);
        // Note: Category filtering by channel would need additional Akeneo API calls
        // For now, we'll log this for future implementation
      }
      
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        console.log(`🔍 Filtering to specific categories: ${filters.categoryIds.join(', ')}`);
        akeneoCategories = akeneoCategories.filter(cat => filters.categoryIds.includes(cat.code));
      }
      
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
    const { locale = 'en_US', dryRun = false, batchSize = 50, filters = {} } = options;
    
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
   * Import attributes from Akeneo to Catalyst
   */
  async importAttributes(storeId, options = {}) {
    const { dryRun = false } = options;
    
    try {
      console.log('🚀 Starting attribute import from Akeneo...');
      console.log(`📍 Store ID: ${storeId}`);
      console.log(`🧪 Dry run mode: ${dryRun}`);
      
      // Get all attributes from Akeneo
      console.log('📡 Fetching attributes from Akeneo API...');
      const akeneoAttributes = await this.client.getAllAttributes();
      this.importStats.attributes.total = akeneoAttributes.length;

      console.log(`📦 Found ${akeneoAttributes.length} attributes in Akeneo`);
      
      // Log sample of attribute types
      const attributeTypes = {};
      akeneoAttributes.slice(0, 10).forEach(attr => {
        attributeTypes[attr.type] = (attributeTypes[attr.type] || 0) + 1;
      });
      console.log('🏷️ Sample attribute types:', attributeTypes);

      // Transform attributes to Catalyst format
      console.log('🔄 Transforming attributes to Catalyst format...');
      const catalystAttributes = akeneoAttributes.map(akeneoAttribute => 
        this.mapping.transformAttribute(akeneoAttribute, storeId)
      );

      console.log(`✅ Transformed ${catalystAttributes.length} attributes`);

      // Import attributes
      console.log('💾 Starting database import process...');
      let processed = 0;
      for (const attribute of catalystAttributes) {
        processed++;
        if (processed % 50 === 0) {
          console.log(`📊 Progress: ${processed}/${catalystAttributes.length} attributes processed`);
        }
        try {
          // Validate attribute
          const validationErrors = this.mapping.validateAttribute(attribute);
          if (validationErrors.length > 0) {
            this.importStats.attributes.failed++;
            this.importStats.errors.push({
              type: 'attribute',
              akeneo_code: attribute.akeneo_code,
              errors: validationErrors
            });
            continue;
          }

          if (!dryRun) {
            // Check if attribute already exists
            const existingAttribute = await Attribute.findOne({
              where: { 
                store_id: storeId,
                code: attribute.code
              }
            });

            if (existingAttribute) {
              // Update existing attribute
              await existingAttribute.update({
                name: attribute.name,
                type: attribute.type,
                is_required: attribute.is_required,
                is_filterable: attribute.is_filterable,
                is_searchable: attribute.is_searchable,
                is_usable_in_conditions: attribute.is_usable_in_conditions,
                filter_type: attribute.filter_type,
                options: attribute.options,
                file_settings: attribute.file_settings,
                sort_order: attribute.sort_order
              });
              
              console.log(`✅ Updated attribute: ${attribute.name} (${attribute.code})`);
            } else {
              // Remove temporary fields
              const attributeData = { ...attribute };
              delete attributeData.akeneo_code;
              delete attributeData.akeneo_type;
              delete attributeData.akeneo_group;
              
              // Create new attribute
              const newAttribute = await Attribute.create(attributeData);
              if (processed <= 10 || processed % 100 === 0) {
                console.log(`✅ Created attribute: ${newAttribute.name} (${newAttribute.code}) - Type: ${newAttribute.type}`);
              }
            }
          } else {
            if (processed <= 5) {
              console.log(`🔍 Dry run - would process attribute: ${attribute.name} (${attribute.code}) - Type: ${attribute.type}`);
            }
          }

          this.importStats.attributes.imported++;
        } catch (error) {
          this.importStats.attributes.failed++;
          this.importStats.errors.push({
            type: 'attribute',
            akeneo_code: attribute.akeneo_code,
            error: error.message
          });
          console.error(`Failed to import attribute ${attribute.code}:`, error.message);
        }
      }

      console.log('🎉 Attribute import completed successfully!');
      console.log(`📊 Final stats: ${this.importStats.attributes.imported} imported, ${this.importStats.attributes.failed} failed, ${this.importStats.attributes.total} total`);
      
      const response = {
        success: true,
        stats: this.importStats.attributes,
        dryRun: dryRun,
        details: {
          processedCount: processed,
          completedSuccessfully: true
        }
      };
      
      if (dryRun) {
        response.message = `Dry run completed. Would import ${this.importStats.attributes.imported} attributes`;
        console.log(`🧪 Dry run result: Would import ${this.importStats.attributes.imported}/${this.importStats.attributes.total} attributes`);
      } else {
        response.message = `Successfully imported ${this.importStats.attributes.imported} attributes`;
        console.log(`✅ Live import result: Imported ${this.importStats.attributes.imported}/${this.importStats.attributes.total} attributes to database`);
      }
      
      return response;

    } catch (error) {
      console.error('Attribute import failed:', error);
      return {
        success: false,
        error: error.message,
        stats: this.importStats.attributes
      };
    }
  }

  /**
   * Import families from Akeneo to Catalyst AttributeSets
   */
  async importFamilies(storeId, options = {}) {
    const { dryRun = false } = options;
    
    try {
      console.log('Starting family import from Akeneo...');
      
      // Get all families from Akeneo
      const akeneoFamilies = await this.client.getAllFamilies();
      this.importStats.families.total = akeneoFamilies.length;

      console.log(`Found ${akeneoFamilies.length} families in Akeneo`);

      // Transform families to Catalyst format
      const catalystFamilies = akeneoFamilies.map(akeneoFamily => 
        this.mapping.transformFamily(akeneoFamily, storeId)
      );

      // Build mapping of attribute codes to IDs for linking
      const attributeMapping = await this.buildAttributeMapping(storeId);

      // Import families
      for (const family of catalystFamilies) {
        try {
          // Validate family
          const validationErrors = this.mapping.validateFamily(family);
          if (validationErrors.length > 0) {
            this.importStats.families.failed++;
            this.importStats.errors.push({
              type: 'family',
              akeneo_code: family.akeneo_code,
              errors: validationErrors
            });
            continue;
          }

          if (!dryRun) {
            // Map attribute codes to IDs
            const attributeIds = family.akeneo_attribute_codes
              .map(code => attributeMapping[code])
              .filter(id => id); // Remove undefined mappings

            // Check if family already exists
            const existingFamily = await AttributeSet.findOne({
              where: { 
                store_id: storeId,
                name: family.name
              }
            });

            if (existingFamily) {
              // Update existing family
              await existingFamily.update({
                name: family.name,
                description: family.description,
                attribute_ids: attributeIds
              });
              
              console.log(`✅ Updated family: ${family.name} with ${attributeIds.length} attributes`);
            } else {
              // Remove temporary fields
              const familyData = { ...family };
              delete familyData.akeneo_code;
              delete familyData.akeneo_attribute_codes;
              familyData.attribute_ids = attributeIds;
              
              // Create new family
              const newFamily = await AttributeSet.create(familyData);
              console.log(`✅ Created family: ${newFamily.name} with ${attributeIds.length} attributes`);
            }
          } else {
            console.log(`🔍 Dry run - would process family: ${family.name} with ${family.akeneo_attribute_codes.length} attributes`);
          }

          this.importStats.families.imported++;
        } catch (error) {
          this.importStats.families.failed++;
          this.importStats.errors.push({
            type: 'family',
            akeneo_code: family.akeneo_code,
            error: error.message
          });
          console.error(`Failed to import family ${family.name}:`, error.message);
        }
      }

      console.log('Family import completed');
      
      const response = {
        success: true,
        stats: this.importStats.families,
        dryRun: dryRun
      };
      
      if (dryRun) {
        response.message = `Dry run completed. Would import ${this.importStats.families.imported} families`;
      } else {
        response.message = `Imported ${this.importStats.families.imported} families`;
      }
      
      return response;

    } catch (error) {
      console.error('Family import failed:', error);
      return {
        success: false,
        error: error.message,
        stats: this.importStats.families
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
   * Build mapping from Akeneo attribute codes to Catalyst attribute IDs
   */
  async buildAttributeMapping(storeId) {
    const attributes = await Attribute.findAll({
      where: { store_id: storeId },
      attributes: ['id', 'code']
    });

    const mapping = {};
    attributes.forEach(attribute => {
      mapping[attribute.code] = attribute.id;
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
      families: { total: 0, imported: 0, skipped: 0, failed: 0 },
      attributes: { total: 0, imported: 0, skipped: 0, failed: 0 },
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