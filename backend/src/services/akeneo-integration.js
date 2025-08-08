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
    const { locale = 'en_US', dryRun = false, filters = {}, settings = {} } = options;
    
    // Create separate stats for this import job
    const jobStats = {
      categories: { total: 0, imported: 0, skipped: 0, failed: 0 },
      errors: []
    };
    
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
      
      // Filter by root categories and their descendants
      if (filters.rootCategories && filters.rootCategories.length > 0) {
        console.log(`🌱 Filtering to root categories and their descendants: ${filters.rootCategories.join(', ')}`);
        
        // Find all categories that belong to the selected root category trees
        const selectedCategoryTree = new Set();
        
        // First, add all selected root categories
        filters.rootCategories.forEach(rootCode => {
          const rootCategory = akeneoCategories.find(cat => cat.code === rootCode);
          if (rootCategory) {
            selectedCategoryTree.add(rootCode);
          }
        });
        
        // Then, recursively add all descendants
        const addDescendants = (parentCode) => {
          akeneoCategories.forEach(cat => {
            if (cat.parent === parentCode && !selectedCategoryTree.has(cat.code)) {
              selectedCategoryTree.add(cat.code);
              addDescendants(cat.code); // Recursively add children
            }
          });
        };
        
        filters.rootCategories.forEach(rootCode => {
          addDescendants(rootCode);
        });
        
        // Filter to only include categories in the selected trees
        akeneoCategories = akeneoCategories.filter(cat => selectedCategoryTree.has(cat.code));
        console.log(`📊 After root category filtering: ${akeneoCategories.length} categories selected`);
      }
      
      jobStats.categories.total = akeneoCategories.length;

      console.log(`Found ${akeneoCategories.length} categories in Akeneo`);

      // Transform categories to Catalyst format
      const catalystCategories = akeneoCategories.map(akeneoCategory => 
        this.mapping.transformCategory(akeneoCategory, storeId, locale, settings)
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
            jobStats.categories.failed++;
            jobStats.errors.push({
              type: 'category',
              akeneo_code: category._temp_akeneo_code,
              errors: validationErrors
            });
            continue;
          }

          if (!dryRun) {
            // Resolve parent_id if this category has a parent
            let parentId = null;
            if (category._temp_parent_akeneo_code && createdCategories[category._temp_parent_akeneo_code] && !category.isRoot) {
              parentId = createdCategories[category._temp_parent_akeneo_code];
            }
            
            // Log category processing info
            console.log(`🔍 Processing category: "${category.name}" (${category._temp_akeneo_code})`);
            console.log(`   - Level: ${category.level}, IsRoot: ${category.isRoot}, Parent: ${category._temp_parent_akeneo_code || 'none'}`);
            console.log(`   - Resolved parent_id: ${parentId}`);
            
            if (category.isRoot) {
              console.log(`   🌱 This is a ROOT category - parent_id will be set to null`);
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
              // Prepare update data
              const updateData = {
                name: category.name,
                description: category.description,
                image_url: category.image_url,
                sort_order: category.sort_order,
                is_active: category.is_active,
                hide_in_menu: category.hide_in_menu,
                meta_title: category.meta_title,
                meta_description: category.meta_description,
                meta_keywords: category.meta_keywords,
                parent_id: category.isRoot ? null : parentId,
                level: category.level,
                path: category.path
              };

              // Check if prevent URL key override is enabled
              const preventOverride = settings.preventUrlKeyOverride || false;
              if (!preventOverride || !existingCategory.slug) {
                // Update slug only if setting is disabled or existing category has no slug
                updateData.slug = category.slug;
                console.log(`  🔗 Updating slug to: ${category.slug}`);
              } else {
                console.log(`  🔒 Preserving existing slug: ${existingCategory.slug} (prevent override enabled)`);
              }

              // Update existing category
              await existingCategory.update(updateData);
              
              createdCategories[category._temp_akeneo_code] = existingCategory.id;
              
              // Create or update Akeneo mapping
              const AkeneoMapping = require('../models/AkeneoMapping');
              await AkeneoMapping.createMapping(
                storeId,
                category._temp_akeneo_code,
                'category',
                'category',
                existingCategory.id,
                existingCategory.slug,
                { source: 'import', notes: `Updated during category import: ${category.name}`, force: true }
              );
              
              console.log(`✅ Updated category: ${category.name} (ID: ${existingCategory.id})`);
              console.log(`  📋 Created/Updated mapping: ${category._temp_akeneo_code} -> ${existingCategory.id}`);
            } else {
              // Prepare category data with resolved parent_id
              const categoryData = { ...category };
              delete categoryData.id;
              delete categoryData._temp_parent_akeneo_code;
              delete categoryData._temp_akeneo_code; // Remove temporary akeneo code
              delete categoryData.isRoot; // Remove temporary flag
              delete categoryData._originalSlug; // Remove temporary slug field
              categoryData.parent_id = category.isRoot ? null : parentId;
              
              // Create new category
              const newCategory = await Category.create(categoryData);
              createdCategories[category._temp_akeneo_code] = newCategory.id;
              
              // Create Akeneo mapping for new category
              const AkeneoMapping = require('../models/AkeneoMapping');
              await AkeneoMapping.createMapping(
                storeId,
                category._temp_akeneo_code,
                'category',
                'category',
                newCategory.id,
                newCategory.slug,
                { source: 'import', notes: `Created during category import: ${category.name}` }
              );
              
              console.log(`✅ Created category: ${newCategory.name} (ID: ${newCategory.id})`);
              console.log(`  📋 Created mapping: ${category._temp_akeneo_code} -> ${newCategory.id}`);
            }
          } else {
            console.log(`🔍 Dry run - would process category: ${category.name}`);
          }

          jobStats.categories.imported++;
        } catch (error) {
          jobStats.categories.failed++;
          jobStats.errors.push({
            type: 'category',
            akeneo_code: category._temp_akeneo_code,
            error: error.message
          });
          console.error(`Failed to import category ${category.name}:`, error.message);
        }
      }

      console.log('Category import completed');
      
      // Update global stats for overall tracking
      this.importStats.categories = jobStats.categories;
      this.importStats.errors = [...this.importStats.errors, ...jobStats.errors];
      
      // Save import statistics to database (only if not a dry run)
      if (!dryRun) {
        try {
          const ImportStatistic = require('../models/ImportStatistic');
          await ImportStatistic.saveImportResults(storeId, 'categories', {
            totalProcessed: jobStats.categories.total,
            successfulImports: jobStats.categories.imported,
            failedImports: jobStats.categories.failed,
            skippedImports: jobStats.categories.skipped,
            errorDetails: jobStats.errors.length > 0 ? JSON.stringify(jobStats.errors) : null,
            importMethod: 'manual'
          });
          console.log('✅ Category import statistics saved to database');
        } catch (statsError) {
          console.error('❌ Failed to save category import statistics:', statsError.message);
        }
      }

      // Prepare response based on dry run mode
      const response = {
        success: true,
        stats: jobStats.categories,
        errors: jobStats.errors,
        dryRun: dryRun
      };
      
      if (dryRun) {
        response.message = `Dry run completed. Would import ${jobStats.categories.imported} categories`;
        response.preview = {
          totalFound: jobStats.categories.total,
          wouldImport: jobStats.categories.imported,
          wouldSkip: jobStats.categories.skipped,
          wouldFail: jobStats.categories.failed
        };
      } else {
        response.message = `Imported ${jobStats.categories.imported} categories`;
      }
      
      return response;

    } catch (error) {
      console.error('Category import failed:', error);
      return {
        success: false,
        error: error.message,
        stats: jobStats.categories,
        errors: jobStats.errors
      };
    }
  }

  /**
   * Import products from Akeneo to Catalyst
   */
  async importProducts(storeId, options = {}) {
    const { locale = 'en_US', dryRun = false, batchSize = 50, filters = {}, settings = {}, customMappings = {} } = options;
    
    // Ensure downloadImages is enabled by default in settings
    const enhancedSettings = {
      includeImages: true,
      downloadImages: true,
      includeFiles: true,
      includeStock: true,
      akeneoBaseUrl: this.config.baseUrl,
      ...settings
    };
    
    try {
      console.log('🚀 Starting product import from Akeneo...');
      console.log(`📍 Store ID: ${storeId}`);
      console.log(`🧪 Dry run mode: ${dryRun}`);
      console.log(`📦 Batch size: ${batchSize}`);
      
      // Get category mapping for product category assignment
      console.log('📂 Building category mapping...');
      const categoryMapping = await this.buildCategoryMapping(storeId);
      console.log(`✅ Category mapping built: ${Object.keys(categoryMapping).length} categories`);
      
      // Get family mapping for product attribute set assignment
      console.log('🏷️ Building family mapping...');
      const familyMapping = await this.buildFamilyMapping(storeId);
      console.log(`✅ Family mapping built: ${Object.keys(familyMapping).length} families`);
      
      // Get all products from Akeneo using the robust client method
      console.log('📡 Fetching all products from Akeneo...');
      let akeneoProducts = await this.client.getAllProducts();
      
      console.log(`📦 Found ${akeneoProducts.length} products in Akeneo`);
      console.log(`🎯 Product filters:`, filters);
      console.log(`⚙️ Product settings:`, enhancedSettings);
      console.log(`🗺️ Custom mappings:`, customMappings);
      
      // Apply product filters
      if (filters.families && filters.families.length > 0) {
        console.log(`🔍 Filtering by families: ${filters.families.join(', ')}`);
        akeneoProducts = akeneoProducts.filter(product => 
          filters.families.includes(product.family)
        );
        console.log(`📊 After family filtering: ${akeneoProducts.length} products`);
      }
      
      if (filters.completeness && filters.completeness > 0) {
        console.log(`🔍 Filtering by completeness: ${filters.completeness}%`);
        // Note: This would require additional API calls to check completeness
        // For now, we'll log this requirement for future implementation
        console.log(`⚠️ Completeness filtering requires additional implementation`);
      }
      
      if (filters.updatedSince) {
        console.log(`🔍 Filtering by updated interval: ${filters.updatedSince} hours`);
        // Calculate the date threshold
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - filters.updatedSince);
        
        akeneoProducts = akeneoProducts.filter(product => {
          if (product.updated) {
            const updatedDate = new Date(product.updated);
            return updatedDate >= hoursAgo;
          }
          return true; // Include products without update timestamp
        });
        console.log(`📊 After time filtering: ${akeneoProducts.length} products`);
      }
      
      this.importStats.products.total = akeneoProducts.length;
      
      if (akeneoProducts.length === 0) {
        console.log('⚠️ No products found in Akeneo');
        return {
          success: true,
          stats: this.importStats.products,
          message: 'No products found in Akeneo to import',
          dryRun: dryRun
        };
      }

      // Process products in batches
      console.log(`💾 Processing ${akeneoProducts.length} products in batches of ${batchSize}...`);
      let processed = 0;
      
      for (let i = 0; i < akeneoProducts.length; i += batchSize) {
        const batch = akeneoProducts.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(akeneoProducts.length/batchSize)} (${batch.length} products)`);
        
        for (const akeneoProduct of batch) {
          processed++;
          try {
            // Log progress for every 10 products or if it's a small batch
            if (processed % 10 === 0 || batch.length <= 10) {
              console.log(`📊 Processing product ${processed}/${akeneoProducts.length}: ${akeneoProduct.identifier || akeneoProduct.uuid || 'Unknown'}`);
            }
            
            // Transform product to Catalyst format (now async)
            const catalystProduct = await this.mapping.transformProduct(akeneoProduct, storeId, locale, null, customMappings, enhancedSettings, this.client);
            
            // Apply product settings
            if (enhancedSettings.status === 'disabled') {
              catalystProduct.status = 'inactive';
            } else if (enhancedSettings.status === 'enabled') {
              catalystProduct.status = 'active';
            }
            
            // Handle image inclusion setting
            if (!enhancedSettings.includeImages) {
              catalystProduct.images = [];
            }
            
            // Handle file inclusion setting (if implemented in transformProduct)
            if (!enhancedSettings.includeFiles) {
              if (catalystProduct.files) {
                catalystProduct.files = [];
              }
            }
            
            // Handle stock inclusion setting
            if (!enhancedSettings.includeStock) {
              catalystProduct.stock_quantity = 0;
              catalystProduct.manage_stock = true;
              catalystProduct.infinite_stock = false;
              if (catalystProduct.stock_data) {
                delete catalystProduct.stock_data;
              }
            }
            
            // Map category IDs
            const originalCategoryIds = akeneoProduct.categories || [];
            catalystProduct.category_ids = this.mapping.mapCategoryIds(originalCategoryIds, categoryMapping);
            
            if (originalCategoryIds.length > 0 && catalystProduct.category_ids.length === 0) {
              console.warn(`⚠️ Product ${catalystProduct.sku}: No valid category mappings found for ${originalCategoryIds.join(', ')}`);
            }
            
            // Map family to attribute set
            if (akeneoProduct.family && familyMapping[akeneoProduct.family]) {
              catalystProduct.attribute_set_id = familyMapping[akeneoProduct.family];
            } else if (akeneoProduct.family) {
              console.warn(`⚠️ Product ${catalystProduct.sku}: No valid family mapping found for ${akeneoProduct.family}`);
            }

            // Validate product
            const validationErrors = this.mapping.validateProduct(catalystProduct);
            if (validationErrors.length > 0) {
              this.importStats.products.failed++;
              this.importStats.errors.push({
                type: 'product',
                akeneo_identifier: catalystProduct.akeneo_identifier,
                errors: validationErrors
              });
              console.error(`❌ Validation failed for ${catalystProduct.sku}: ${validationErrors.join(', ')}`);
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
                // Log image data for debugging
                if (catalystProduct.images && catalystProduct.images.length > 0) {
                  console.log(`[Akeneo] Images for product ${catalystProduct.sku}:`, catalystProduct.images);
                } else {
                  console.log(`[Akeneo] No images for product ${catalystProduct.sku}`);
                }
                
                // Prepare update data
                const updateData = {
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
                  category_ids: catalystProduct.category_ids,
                  // Include stock-related fields
                  manage_stock: catalystProduct.manage_stock,
                  stock_quantity: catalystProduct.stock_quantity,
                  allow_backorders: catalystProduct.allow_backorders,
                  low_stock_threshold: catalystProduct.low_stock_threshold,
                  infinite_stock: catalystProduct.infinite_stock,
                  // Include custom fields if they exist
                  custom_attributes: catalystProduct.custom_attributes,
                  files: catalystProduct.files
                };

                // Check if prevent URL key override is enabled
                const preventOverride = settings.preventUrlKeyOverride || false;
                if (!preventOverride || !existingProduct.slug) {
                  // Update slug only if setting is disabled or existing product has no slug
                  updateData.slug = catalystProduct.slug;
                  if (processed <= 5 || processed % 25 === 0) {
                    console.log(`  🔗 Updating slug to: ${catalystProduct.slug}`);
                  }
                } else {
                  if (processed <= 5 || processed % 25 === 0) {
                    console.log(`  🔒 Preserving existing slug: ${existingProduct.slug} (prevent override enabled)`);
                  }
                }

                // Update existing product
                await existingProduct.update(updateData);
                
                if (processed <= 5 || processed % 25 === 0) {
                  console.log(`✅ Updated product: ${catalystProduct.name} (${catalystProduct.sku})`);
                }
              } else {
                // Prepare product data for creation
                const productData = { ...catalystProduct };
                delete productData._originalSlug; // Remove temporary slug field
                
                // Create new product
                await Product.create(productData);
                if (processed <= 5 || processed % 25 === 0) {
                  console.log(`✅ Created product: ${catalystProduct.name} (${catalystProduct.sku})`);
                }
              }
            } else {
              if (processed <= 5) {
                console.log(`🔍 Dry run - would process product: ${catalystProduct.name} (${catalystProduct.sku})`);
              }
            }

            this.importStats.products.imported++;
          } catch (error) {
            this.importStats.products.failed++;
            this.importStats.errors.push({
              type: 'product',
              akeneo_identifier: akeneoProduct.identifier || akeneoProduct.uuid || 'Unknown',
              error: error.message
            });
            console.error(`❌ Failed to import product ${akeneoProduct.identifier || akeneoProduct.uuid}: ${error.message}`);
          }
        }

        // Log batch progress
        const batchEnd = Math.min(i + batchSize, akeneoProducts.length);
        console.log(`📊 Batch ${Math.floor(i/batchSize) + 1} completed: ${batchEnd}/${akeneoProducts.length} products processed`);
      }

      console.log('🎉 Product import completed successfully!');
      console.log(`📊 Final stats: ${this.importStats.products.imported} imported, ${this.importStats.products.failed} failed, ${this.importStats.products.total} total`);
      
      const response = {
        success: true,
        stats: this.importStats.products,
        dryRun: dryRun,
        details: {
          processedCount: processed,
          completedSuccessfully: true
        }
      };
      
      // Save import statistics to database (only if not a dry run)
      if (!dryRun) {
        try {
          const ImportStatistic = require('../models/ImportStatistic');
          await ImportStatistic.saveImportResults(storeId, 'products', {
            totalProcessed: this.importStats.products.total,
            successfulImports: this.importStats.products.imported,
            failedImports: this.importStats.products.failed,
            skippedImports: this.importStats.products.skipped,
            errorDetails: this.importStats.errors.length > 0 ? JSON.stringify(this.importStats.errors) : null,
            importMethod: 'manual'
          });
          console.log('✅ Product import statistics saved to database');
        } catch (statsError) {
          console.error('❌ Failed to save product import statistics:', statsError.message);
        }
      }

      if (dryRun) {
        response.message = `Dry run completed. Would import ${this.importStats.products.imported} products`;
        console.log(`🧪 Dry run result: Would import ${this.importStats.products.imported}/${this.importStats.products.total} products`);
      } else {
        response.message = `Successfully imported ${this.importStats.products.imported} products`;
        console.log(`✅ Live import result: Imported ${this.importStats.products.imported}/${this.importStats.products.total} products to database`);
      }
      
      return response;

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
    const { dryRun = false, filters = {}, settings = {} } = options;
    
    try {
      console.log('🚀 Starting attribute import from Akeneo...');
      console.log(`📍 Store ID: ${storeId}`);
      console.log(`🧪 Dry run mode: ${dryRun}`);
      
      // Get all attributes from Akeneo
      console.log('📡 Fetching attributes from Akeneo API...');
      let akeneoAttributes = await this.client.getAllAttributes();
      
      console.log(`📦 Found ${akeneoAttributes.length} attributes in Akeneo`);
      console.log(`🎯 Attribute filters:`, filters);
      console.log(`⚙️ Attribute settings:`, settings);
      
      // Apply attribute filters
      if (filters.families && filters.families.length > 0) {
        console.log(`🔍 Filtering by families: ${filters.families.join(', ')}`);
        // Note: This would require additional API calls to get family attributes
        // For now, we'll log this requirement for future implementation
        console.log(`⚠️ Family filtering for attributes requires additional implementation`);
      }
      
      if (filters.updatedSince) {
        console.log(`🔍 Filtering by updated interval: ${filters.updatedSince} hours`);
        // Calculate the date threshold
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - filters.updatedSince);
        
        akeneoAttributes = akeneoAttributes.filter(attribute => {
          if (attribute.updated) {
            const updatedDate = new Date(attribute.updated);
            return updatedDate >= hoursAgo;
          }
          return true; // Include attributes without update timestamp
        });
        console.log(`📊 After time filtering: ${akeneoAttributes.length} attributes`);
      }
      
      this.importStats.attributes.total = akeneoAttributes.length;
      
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
      
      // Save import statistics to database (only if not a dry run)
      if (!dryRun) {
        try {
          const ImportStatistic = require('../models/ImportStatistic');
          await ImportStatistic.saveImportResults(storeId, 'attributes', {
            totalProcessed: this.importStats.attributes.total,
            successfulImports: this.importStats.attributes.imported,
            failedImports: this.importStats.attributes.failed,
            skippedImports: this.importStats.attributes.skipped,
            errorDetails: this.importStats.errors.length > 0 ? JSON.stringify(this.importStats.errors) : null,
            importMethod: 'manual'
          });
          console.log('✅ Attribute import statistics saved to database');
        } catch (statsError) {
          console.error('❌ Failed to save attribute import statistics:', statsError.message);
        }
      }

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
    const { dryRun = false, filters = {} } = options;
    
    try {
      console.log('Starting family import from Akeneo...');
      console.log(`🎯 Family filters:`, filters);
      
      // Get all families from Akeneo
      let akeneoFamilies = await this.client.getAllFamilies();
      
      // Apply family filter if specified
      if (filters.families && filters.families.length > 0) {
        console.log(`🔍 Filtering to specific families: ${filters.families.join(', ')}`);
        akeneoFamilies = akeneoFamilies.filter(family => 
          filters.families.includes(family.code)
        );
        console.log(`📊 After filtering: ${akeneoFamilies.length} families selected`);
      }
      
      this.importStats.families.total = akeneoFamilies.length;

      console.log(`Found ${akeneoFamilies.length} families to import`);

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
      
      // Save import statistics to database (only if not a dry run)
      if (!dryRun) {
        try {
          const ImportStatistic = require('../models/ImportStatistic');
          await ImportStatistic.saveImportResults(storeId, 'families', {
            totalProcessed: this.importStats.families.total,
            successfulImports: this.importStats.families.imported,
            failedImports: this.importStats.families.failed,
            skippedImports: this.importStats.families.skipped,
            errorDetails: this.importStats.errors.length > 0 ? JSON.stringify(this.importStats.errors) : null,
            importMethod: 'manual'
          });
          console.log('✅ Family import statistics saved to database');
        } catch (statsError) {
          console.error('❌ Failed to save family import statistics:', statsError.message);
        }
      }

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
        stats: {
          categories: categoryResult.stats,
          products: productResult.stats,
          total: (categoryResult.stats?.imported || 0) + (productResult.stats?.imported || 0)
        },
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
        stats: null, // Add missing stats property for consistency
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
   * Uses dedicated akeneo_mappings table for flexible mapping
   */
  async buildCategoryMapping(storeId) {
    const AkeneoMapping = require('../models/AkeneoMapping');
    
    // First, try to get explicit mappings from the mapping table
    const explicitMapping = await AkeneoMapping.buildCategoryMapping(storeId);
    
    // If no explicit mappings exist, auto-create them from existing categories
    if (Object.keys(explicitMapping).length === 0) {
      console.log('📋 No explicit Akeneo mappings found. Auto-generating from existing categories...');
      await AkeneoMapping.autoCreateCategoryMappings(storeId);
      
      // Rebuild mapping after auto-creation
      const autoMapping = await AkeneoMapping.buildCategoryMapping(storeId);
      console.log(`✅ Auto-created ${Object.keys(autoMapping).length} category mappings`);
      return autoMapping;
    }
    
    console.log(`📋 Category mapping loaded: ${Object.keys(explicitMapping).length} explicit mappings from akeneo_mappings table`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Sample mappings:', Object.keys(explicitMapping).slice(0, 10).join(', '), '...');
    }

    return explicitMapping;
  }

  /**
   * Build mapping from Akeneo family codes to Catalyst AttributeSet IDs
   */
  async buildFamilyMapping(storeId) {
    const attributeSets = await AttributeSet.findAll({
      where: { store_id: storeId },
      attributes: ['id', 'name']
    });

    const mapping = {};
    attributeSets.forEach(attributeSet => {
      // Map by name since families are stored by name in AttributeSet
      mapping[attributeSet.name] = attributeSet.id;
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