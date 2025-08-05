const axios = require('axios');
const AkeneoMapping = require('./AkeneoMapping');

/**
 * Akeneo Integration Service
 * Handles all interactions with Akeneo PIM API
 */
class AkeneoIntegration {
  constructor(config = {}) {
    this.config = config;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.client = null;
    this.mapping = new AkeneoMapping(config);
  }

  /**
   * Initialize the Akeneo client
   */
  async initialize() {
    if (!this.config.baseUrl || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('Missing required Akeneo configuration');
    }

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          this.accessToken = null;
          this.tokenExpiry = null;
          
          // Retry the request once
          if (!error.config._retry) {
            error.config._retry = true;
            await this.ensureValidToken();
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client.request(error.config);
          }
        }
        throw error;
      }
    );
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureValidToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return; // Token is still valid
    }

    try {
      const response = await axios.post(`${this.config.baseUrl}/api/oauth/v1/token`, {
        grant_type: 'password',
        username: this.config.username,
        password: this.config.password
      }, {
        auth: {
          username: this.config.clientId,
          password: this.config.clientSecret
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      console.log('🔑 Akeneo access token obtained successfully');
    } catch (error) {
      console.error('❌ Failed to obtain Akeneo access token:', error.response?.data || error.message);
      throw new Error(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Test connection to Akeneo
   */
  async testConnection() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client.get('/api/rest/v1/catalogs');
      
      return {
        success: true,
        message: 'Connection successful',
        data: {
          baseUrl: this.config.baseUrl,
          catalogCount: response.data._links?.self ? 1 : 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get product count from Akeneo
   */
  async getProductCount() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client.get('/api/rest/v1/products', {
        params: { limit: 1 }
      });

      return {
        count: response.data._links?.self?.href ? 
          parseInt(response.data._links.self.href.match(/limit=(\d+)/)?.[1] || '0') : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get product count: ${error.message}`);
    }
  }

  /**
   * Get category count from Akeneo
   */
  async getCategoryCount() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client.get('/api/rest/v1/categories', {
        params: { limit: 1 }
      });

      return {
        count: response.data._embedded?.items?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get category count: ${error.message}`);
    }
  }

  /**
   * Get attribute count from Akeneo
   */
  async getAttributeCount() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client.get('/api/rest/v1/attributes', {
        params: { limit: 1 }
      });

      return {
        count: response.data._embedded?.items?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get attribute count: ${error.message}`);
    }
  }

  /**
   * Sync products from Akeneo
   */
  async syncProducts(options = {}) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const {
        dryRun = false,
        batchSize = 100,
        storeId,
        locale = this.config.locale || 'en_US'
      } = options;

      console.log(`🔄 Starting product sync (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        startTime: new Date(),
        endTime: null
      };

      let hasMore = true;
      let searchAfter = null;

      while (hasMore) {
        const params = {
          limit: batchSize,
          'locales': locale
        };

        if (searchAfter) {
          params.search_after = searchAfter;
        }

        const response = await this.client.get('/api/rest/v1/products', { params });
        const products = response.data._embedded?.items || [];

        if (products.length === 0) {
          hasMore = false;
          break;
        }

        for (const akeneoProduct of products) {
          try {
            const mappedProduct = await this.mapping.mapProduct(akeneoProduct, { 
              locale, 
              storeId,
              preventUrlKeyOverride: this.config.preventUrlKeyOverride 
            });

            if (!dryRun) {
              // TODO: Save to database
              console.log(`📦 Would save product: ${mappedProduct.name}`);
            } else {
              console.log(`📦 [DRY RUN] Product: ${mappedProduct.name}`);
            }

            results.processed++;
            results.created++; // TODO: Distinguish between created/updated
          } catch (error) {
            console.error(`❌ Error processing product ${akeneoProduct.identifier}:`, error.message);
            results.errors.push({
              identifier: akeneoProduct.identifier,
              error: error.message
            });
            results.skipped++;
          }
        }

        // Check for more pages
        searchAfter = response.data._links?.next?.href?.match(/search_after=([^&]+)/)?.[1];
        hasMore = !!searchAfter;
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(`✅ Product sync completed: ${results.processed} processed, ${results.created} created, ${results.errors.length} errors`);

      return results;
    } catch (error) {
      throw new Error(`Product sync failed: ${error.message}`);
    }
  }

  /**
   * Sync categories from Akeneo
   */
  async syncCategories(options = {}) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const {
        dryRun = false,
        batchSize = 100,
        storeId,
        locale = this.config.locale || 'en_US'
      } = options;

      console.log(`🔄 Starting category sync (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        startTime: new Date(),
        endTime: null
      };

      let hasMore = true;
      let searchAfter = null;

      while (hasMore) {
        const params = {
          limit: batchSize
        };

        if (searchAfter) {
          params.search_after = searchAfter;
        }

        const response = await this.client.get('/api/rest/v1/categories', { params });
        const categories = response.data._embedded?.items || [];

        if (categories.length === 0) {
          hasMore = false;
          break;
        }

        for (const akeneoCategory of categories) {
          try {
            const mappedCategory = await this.mapping.mapCategory(akeneoCategory, { 
              locale, 
              storeId,
              preventUrlKeyOverride: this.config.preventUrlKeyOverride,
              akeneoUrlField: this.config.akeneoUrlField
            });

            if (!dryRun) {
              // TODO: Save to database
              console.log(`📁 Would save category: ${mappedCategory.name}`);
            } else {
              console.log(`📁 [DRY RUN] Category: ${mappedCategory.name}`);
            }

            results.processed++;
            results.created++; // TODO: Distinguish between created/updated
          } catch (error) {
            console.error(`❌ Error processing category ${akeneoCategory.code}:`, error.message);
            results.errors.push({
              code: akeneoCategory.code,
              error: error.message
            });
            results.skipped++;
          }
        }

        // Check for more pages
        searchAfter = response.data._links?.next?.href?.match(/search_after=([^&]+)/)?.[1];
        hasMore = !!searchAfter;
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(`✅ Category sync completed: ${results.processed} processed, ${results.created} created, ${results.errors.length} errors`);

      return results;
    } catch (error) {
      throw new Error(`Category sync failed: ${error.message}`);
    }
  }

  /**
   * Sync attributes from Akeneo
   */
  async syncAttributes(options = {}) {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const {
        dryRun = false,
        batchSize = 100,
        storeId,
        locale = this.config.locale || 'en_US'
      } = options;

      console.log(`🔄 Starting attribute sync (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

      const results = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        startTime: new Date(),
        endTime: null
      };

      let hasMore = true;
      let searchAfter = null;

      while (hasMore) {
        const params = {
          limit: batchSize
        };

        if (searchAfter) {
          params.search_after = searchAfter;
        }

        const response = await this.client.get('/api/rest/v1/attributes', { params });
        const attributes = response.data._embedded?.items || [];

        if (attributes.length === 0) {
          hasMore = false;
          break;
        }

        for (const akeneoAttribute of attributes) {
          try {
            const mappedAttribute = await this.mapping.mapAttribute(akeneoAttribute, { 
              locale, 
              storeId 
            });

            if (!dryRun) {
              // TODO: Save to database
              console.log(`🏷️ Would save attribute: ${mappedAttribute.name}`);
            } else {
              console.log(`🏷️ [DRY RUN] Attribute: ${mappedAttribute.name}`);
            }

            results.processed++;
            results.created++; // TODO: Distinguish between created/updated
          } catch (error) {
            console.error(`❌ Error processing attribute ${akeneoAttribute.code}:`, error.message);
            results.errors.push({
              code: akeneoAttribute.code,
              error: error.message
            });
            results.skipped++;
          }
        }

        // Check for more pages
        searchAfter = response.data._links?.next?.href?.match(/search_after=([^&]+)/)?.[1];
        hasMore = !!searchAfter;
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      console.log(`✅ Attribute sync completed: ${results.processed} processed, ${results.created} created, ${results.errors.length} errors`);

      return results;
    } catch (error) {
      throw new Error(`Attribute sync failed: ${error.message}`);
    }
  }
}

module.exports = AkeneoIntegration;