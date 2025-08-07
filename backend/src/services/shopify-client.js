const axios = require('axios');

class ShopifyClient {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.apiVersion = '2023-10';
    this.baseUrl = `https://${shopDomain}/admin/api/${this.apiVersion}`;
    this.rateLimitDelay = 500; // 500ms delay between requests to respect rate limits
  }

  /**
   * Make authenticated request to Shopify API
   */
  async makeRequest(endpoint, method = 'GET', data = null, params = {}) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        },
        params
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axios(config);
      
      // Handle rate limiting
      if (response.headers['x-shopify-shop-api-call-limit']) {
        const [used, limit] = response.headers['x-shopify-shop-api-call-limit'].split('/');
        const usageRatio = parseInt(used) / parseInt(limit);
        
        // If we're using more than 80% of the rate limit, add delay
        if (usageRatio > 0.8) {
          await this.delay(this.rateLimitDelay * 2);
        } else if (usageRatio > 0.6) {
          await this.delay(this.rateLimitDelay);
        }
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limited - wait and retry once
        await this.delay(2000);
        return this.makeRequest(endpoint, method, data, params);
      }
      
      console.error('Shopify API Error:', {
        endpoint,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(`Shopify API Error: ${error.response?.data?.errors || error.message}`);
    }
  }

  /**
   * Utility function to add delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to Shopify
   */
  async testConnection() {
    try {
      const shop = await this.makeRequest('/shop.json');
      return {
        success: true,
        message: 'Successfully connected to Shopify',
        data: shop.shop
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get shop information
   */
  async getShop() {
    const response = await this.makeRequest('/shop.json');
    return response.shop;
  }

  /**
   * Get products with pagination
   */
  async getProducts(params = {}) {
    const defaultParams = {
      limit: 250, // Max limit for products
      ...params
    };
    
    const response = await this.makeRequest('/products.json', 'GET', null, defaultParams);
    return response.products;
  }

  /**
   * Get all products (with pagination handling)
   */
  async getAllProducts(progressCallback = null) {
    const allProducts = [];
    let params = { limit: 250 };
    let page = 1;
    
    while (true) {
      const products = await this.getProducts(params);
      
      if (products.length === 0) break;
      
      allProducts.push(...products);
      
      if (progressCallback) {
        progressCallback({
          page,
          fetched: allProducts.length,
          lastBatch: products.length
        });
      }
      
      // If we got less than the limit, we're done
      if (products.length < params.limit) break;
      
      // Set up for next page
      const lastProduct = products[products.length - 1];
      params.since_id = lastProduct.id;
      page++;
      
      // Add delay to respect rate limits
      await this.delay(this.rateLimitDelay);
    }
    
    return allProducts;
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    const response = await this.makeRequest(`/products/${productId}.json`);
    return response.product;
  }

  /**
   * Get custom collections (categories)
   */
  async getCustomCollections(params = {}) {
    const defaultParams = {
      limit: 250,
      ...params
    };
    
    const response = await this.makeRequest('/custom_collections.json', 'GET', null, defaultParams);
    return response.custom_collections;
  }

  /**
   * Get smart collections
   */
  async getSmartCollections(params = {}) {
    const defaultParams = {
      limit: 250,
      ...params
    };
    
    const response = await this.makeRequest('/smart_collections.json', 'GET', null, defaultParams);
    return response.smart_collections;
  }

  /**
   * Get all collections (custom + smart)
   */
  async getAllCollections(progressCallback = null) {
    const [customCollections, smartCollections] = await Promise.all([
      this.getAllCustomCollections(progressCallback),
      this.getAllSmartCollections(progressCallback)
    ]);

    return {
      custom: customCollections,
      smart: smartCollections,
      all: [...customCollections, ...smartCollections]
    };
  }

  /**
   * Get all custom collections with pagination
   */
  async getAllCustomCollections(progressCallback = null) {
    const allCollections = [];
    let params = { limit: 250 };
    let page = 1;
    
    while (true) {
      const collections = await this.getCustomCollections(params);
      
      if (collections.length === 0) break;
      
      allCollections.push(...collections);
      
      if (progressCallback) {
        progressCallback({
          type: 'custom_collections',
          page,
          fetched: allCollections.length,
          lastBatch: collections.length
        });
      }
      
      if (collections.length < params.limit) break;
      
      const lastCollection = collections[collections.length - 1];
      params.since_id = lastCollection.id;
      page++;
      
      await this.delay(this.rateLimitDelay);
    }
    
    return allCollections;
  }

  /**
   * Get all smart collections with pagination
   */
  async getAllSmartCollections(progressCallback = null) {
    const allCollections = [];
    let params = { limit: 250 };
    let page = 1;
    
    while (true) {
      const collections = await this.getSmartCollections(params);
      
      if (collections.length === 0) break;
      
      allCollections.push(...collections);
      
      if (progressCallback) {
        progressCallback({
          type: 'smart_collections',
          page,
          fetched: allCollections.length,
          lastBatch: collections.length
        });
      }
      
      if (collections.length < params.limit) break;
      
      const lastCollection = collections[collections.length - 1];
      params.since_id = lastCollection.id;
      page++;
      
      await this.delay(this.rateLimitDelay);
    }
    
    return allCollections;
  }

  /**
   * Get customers with pagination
   */
  async getCustomers(params = {}) {
    const defaultParams = {
      limit: 250,
      ...params
    };
    
    const response = await this.makeRequest('/customers.json', 'GET', null, defaultParams);
    return response.customers;
  }

  /**
   * Get orders with pagination
   */
  async getOrders(params = {}) {
    const defaultParams = {
      limit: 250,
      status: 'any',
      ...params
    };
    
    const response = await this.makeRequest('/orders.json', 'GET', null, defaultParams);
    return response.orders;
  }

  /**
   * Get product variants
   */
  async getProductVariants(productId, params = {}) {
    const defaultParams = {
      limit: 250,
      ...params
    };
    
    const response = await this.makeRequest(`/products/${productId}/variants.json`, 'GET', null, defaultParams);
    return response.variants;
  }

  /**
   * Get inventory levels
   */
  async getInventoryLevels(params = {}) {
    const response = await this.makeRequest('/inventory_levels.json', 'GET', null, params);
    return response.inventory_levels;
  }

  /**
   * Get metafields for a resource
   */
  async getMetafields(resourceType, resourceId, params = {}) {
    const endpoint = resourceId 
      ? `/${resourceType}/${resourceId}/metafields.json`
      : `/metafields.json`;
    
    const response = await this.makeRequest(endpoint, 'GET', null, params);
    return response.metafields;
  }
}

module.exports = ShopifyClient;