const AkeneoIntegration = require('./akeneo-integration');
const AkeneoImageProcessor = require('./akeneo-image-processor');
const IntegrationConfig = require('../models/IntegrationConfig');

/**
 * Unified Akeneo Sync Service
 * Handles all Akeneo operations through a single, consistent interface
 */
class AkeneoSyncService {
  constructor() {
    this.integration = null;
    this.imageProcessor = null;
    this.config = null;
    this.storeId = null;
  }

  /**
   * Initialize the service with store configuration
   */
  async initialize(storeId) {
    this.storeId = storeId;
    
    // Load configuration once
    const integrationConfig = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    if (!integrationConfig || !integrationConfig.config_data) {
      throw new Error('Akeneo integration not configured for this store');
    }

    this.config = integrationConfig.config_data;
    
    // Validate configuration
    const requiredFields = ['baseUrl', 'clientId', 'clientSecret', 'username', 'password'];
    const missingFields = requiredFields.filter(field => !this.config[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    // Create single integration instance
    this.integration = new AkeneoIntegration(this.config);
    
    // Initialize image processor with configuration
    const imageConfig = {
      cloudflare: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
        imagesApiKey: process.env.CLOUDFLARE_IMAGES_API_KEY,
        r2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        r2AccessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        r2SecretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        r2Endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        imageDomain: process.env.CLOUDFLARE_IMAGES_DOMAIN,
        useCloudflareImages: process.env.ENABLE_CLOUDFLARE_IMAGES !== 'false',
        useR2Storage: process.env.ENABLE_CLOUDFLARE_R2 !== 'false'
      },
      processingEnabled: process.env.ENABLE_IMAGE_PROCESSING !== 'false'
    };
    
    this.imageProcessor = new AkeneoImageProcessor(imageConfig);
    
    console.log('🔧 AkeneoSyncService initialized:', {
      storeId: this.storeId,
      baseUrl: this.config.baseUrl,
      username: this.config.username,
      clientId: this.config.clientId,
      clientSecretLength: this.config.clientSecret?.length,
      imageProcessingEnabled: imageConfig.processingEnabled
    });
  }

  /**
   * Test connection to Akeneo
   */
  async testConnection() {
    if (!this.integration) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    
    return await this.integration.testConnection();
  }

  /**
   * Sync multiple operations in sequence
   */
  async sync(operations, options = {}) {
    if (!this.integration) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const results = {
      success: true,
      operations: {},
      summary: {
        total: 0,
        successful: 0,
        failed: 0
      },
      errors: []
    };

    console.log(`🚀 Starting Akeneo sync for store ${this.storeId}`);
    console.log(`📋 Operations: ${operations.join(', ')}`);
    console.log(`⚙️ Options:`, options);

    // Update sync status to 'syncing'
    const integrationConfig = await IntegrationConfig.findByStoreAndType(this.storeId, 'akeneo');
    if (integrationConfig) {
      await integrationConfig.updateSyncStatus('syncing');
    }

    try {
      // Execute operations in order: attributes -> families -> categories -> products
      const orderedOps = this.getOrderedOperations(operations);
      
      for (const operation of orderedOps) {
        try {
          console.log(`\n📦 Starting ${operation} sync...`);
          results.summary.total++;
          
          let result;
          switch (operation) {
            case 'attributes':
              result = await this.integration.importAttributes(this.storeId, options);
              break;
            case 'families':
              result = await this.integration.importFamilies(this.storeId, options);
              break;
            case 'categories':
              result = await this.integration.importCategories(this.storeId, options);
              break;
            case 'products':
              // Add image processing to options if enabled
              const productOptions = {
                ...options,
                imageProcessor: this.imageProcessor,
                processImages: process.env.ENABLE_IMAGE_PROCESSING !== 'false'
              };
              result = await this.integration.importProducts(this.storeId, productOptions);
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }

          results.operations[operation] = result;
          
          if (result.success) {
            results.summary.successful++;
            console.log(`✅ ${operation} sync completed successfully`);
            
            // Update last import date for this section
            if (integrationConfig) {
              const currentConfig = integrationConfig.config_data || {};
              const lastImportDates = currentConfig.lastImportDates || {};
              lastImportDates[operation] = new Date().toISOString();
              integrationConfig.config_data = {
                ...currentConfig,
                lastImportDates
              };
              await integrationConfig.save();
            }
          } else {
            results.summary.failed++;
            results.success = false;
            results.errors.push(`${operation}: ${result.message || 'Unknown error'}`);
            console.log(`❌ ${operation} sync failed: ${result.message}`);
          }
          
        } catch (operationError) {
          results.summary.failed++;
          results.success = false;
          results.operations[operation] = { 
            success: false, 
            message: operationError.message,
            error: operationError.message
          };
          results.errors.push(`${operation}: ${operationError.message}`);
          console.error(`❌ ${operation} sync error:`, operationError.message);
        }
      }

      // Update final sync status
      if (integrationConfig) {
        const finalStatus = results.success ? 'success' : 'error';
        const errorMessage = results.errors.length > 0 ? results.errors.join('; ') : null;
        await integrationConfig.updateSyncStatus(finalStatus, errorMessage);
      }

      console.log(`\n🎯 Sync completed: ${results.summary.successful}/${results.summary.total} operations successful`);
      return results;

    } catch (error) {
      // Update sync status on critical error
      if (integrationConfig) {
        await integrationConfig.updateSyncStatus('error', error.message);
      }
      
      results.success = false;
      results.errors.push(`Critical error: ${error.message}`);
      console.error('❌ Critical sync error:', error.message);
      return results;
    }
  }

  /**
   * Order operations to respect dependencies
   * Attributes -> Families -> Categories -> Products
   */
  getOrderedOperations(operations) {
    const order = ['attributes', 'families', 'categories', 'products'];
    return order.filter(op => operations.includes(op));
  }

  /**
   * Get sync status
   */
  async getStatus() {
    const integrationConfig = await IntegrationConfig.findByStoreAndType(this.storeId, 'akeneo');
    if (!integrationConfig) {
      return { status: 'not_configured' };
    }

    return {
      status: integrationConfig.sync_status,
      lastSync: integrationConfig.last_sync_at,
      error: integrationConfig.sync_error,
      lastImportDates: integrationConfig.config_data?.lastImportDates || {}
    };
  }

  /**
   * Process images for existing products
   */
  async processProductImages(options = {}) {
    if (!this.integration || !this.imageProcessor) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const { 
      limit = 50, 
      offset = 0, 
      forceReprocess = false,
      concurrency = 2 
    } = options;

    try {
      console.log(`🖼️ Processing images for products (limit: ${limit}, offset: ${offset})`);
      
      // Get products that need image processing
      const { Product } = require('../models'); // Tenant DB model
      
      const { Op } = require('sequelize');
      
      const whereClause = forceReprocess ? 
        { store_id: this.storeId } : 
        { 
          store_id: this.storeId,
          [Op.or]: [
            { images: null },
            { images: [] }
          ]
        };

      const products = await Product.findAll({
        where: whereClause,
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      if (products.length === 0) {
        return {
          success: true,
          processed: 0,
          message: 'No products found that need image processing'
        };
      }

      console.log(`📦 Found ${products.length} products to process`);
      
      let processedCount = 0;
      const errors = [];

      // Process products in batches
      for (let i = 0; i < products.length; i += concurrency) {
        const batch = products.slice(i, i + concurrency);
        
        const batchPromises = batch.map(async (product) => {
          try {
            // Get fresh product data from Akeneo if needed
            const akeneoProduct = await this.integration.client.getProduct(product.akeneo_uuid || product.sku);
            
            // Process images
            const processedImages = await this.imageProcessor.processProductImages(
              akeneoProduct, 
              this.config.baseUrl
            );

            if (processedImages.length > 0) {
              // Convert to Catalyst format
              const catalystImages = this.imageProcessor.convertToCatalystFormat(processedImages);
              
              // Update product
              await product.update({ images: catalystImages });
              console.log(`✅ Updated images for product: ${product.sku}`);
              return true;
            }
            
            return false;
          } catch (error) {
            console.error(`❌ Failed to process images for product ${product.sku}:`, error.message);
            errors.push({
              product_sku: product.sku,
              error: error.message
            });
            return false;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        processedCount += batchResults.filter(r => r.status === 'fulfilled' && r.value).length;

        // Small delay between batches
        if (i + concurrency < products.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        processed: processedCount,
        total: products.length,
        errors: errors,
        message: `Processed images for ${processedCount} out of ${products.length} products`
      };

    } catch (error) {
      console.error('❌ Image processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test image processing configuration
   */
  async testImageProcessing(testUrl = null) {
    if (!this.imageProcessor) {
      throw new Error('Image processor not initialized');
    }

    try {
      // Test Cloudflare connection
      const connectionTest = await this.imageProcessor.cloudflareService.testConnection();
      
      // Test image processing if URL provided
      let processingTest = null;
      if (testUrl) {
        processingTest = await this.imageProcessor.testProcessing(testUrl);
      }

      return {
        success: true,
        configuration: this.imageProcessor.getStatus(),
        connection: connectionTest,
        processing: processingTest
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        configuration: this.imageProcessor.getStatus()
      };
    }
  }

  /**
   * Get image processing statistics
   */
  async getImageStats() {
    try {
      const { Product } = require('../models'); // Tenant DB model
      const { Op } = require('sequelize');
      
      const totalProducts = await Product.count({ 
        where: { store_id: this.storeId }
      });
      
      const productsWithImages = await Product.count({
        where: { 
          store_id: this.storeId,
          images: { [Op.ne]: null }
        }
      });

      // For processed images, we'll use a simpler approach since JSON queries can be complex
      const processedImages = await Product.count({
        where: {
          store_id: this.storeId,
          images: { [Op.ne]: null }
        }
      });

      return {
        total_products: totalProducts,
        products_with_images: productsWithImages,
        processed_images: processedImages,
        processing_rate: totalProducts > 0 ? (processedImages / totalProducts * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting image stats:', error.message);
      return {
        error: error.message
      };
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.integration = null;
    this.imageProcessor = null;
    this.config = null;
    this.storeId = null;
  }
}

module.exports = AkeneoSyncService;