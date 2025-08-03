const AkeneoIntegration = require('./akeneo-integration');
const IntegrationConfig = require('../models/IntegrationConfig');

/**
 * Unified Akeneo Sync Service
 * Handles all Akeneo operations through a single, consistent interface
 */
class AkeneoSyncService {
  constructor() {
    this.integration = null;
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
    
    console.log('🔧 AkeneoSyncService initialized:', {
      storeId: this.storeId,
      baseUrl: this.config.baseUrl,
      username: this.config.username,
      clientId: this.config.clientId,
      clientSecretLength: this.config.clientSecret?.length
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
              result = await this.integration.importProducts(this.storeId, options);
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
   * Clean up resources
   */
  cleanup() {
    this.integration = null;
    this.config = null;
    this.storeId = null;
  }
}

module.exports = AkeneoSyncService;