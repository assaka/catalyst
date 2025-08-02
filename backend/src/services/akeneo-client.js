const axios = require('axios');

class AkeneoClient {
  constructor(baseUrl, clientId, clientSecret, username, password) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.username = username;
    this.password = password;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate base64 encoded credentials for authentication
   */
  getEncodedCredentials() {
    const credentials = `${this.clientId}:${this.clientSecret}`;
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Authenticate with Akeneo PIM and get access token
   */
  async authenticate() {
    try {
      const response = await this.axiosInstance.post('/api/oauth/v1/token', {
        grant_type: 'password',
        username: this.username,
        password: this.password
      }, {
        headers: {
          'Authorization': `Basic ${this.getEncodedCredentials()}`,
          'Content-Type': 'application/json'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

      // Set default authorization header for future requests
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      console.log('Successfully authenticated with Akeneo PIM');
      return true;
    } catch (error) {
      console.error('Failed to authenticate with Akeneo PIM:', error.response?.data || error.message);
      throw new Error(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available. Re-authentication required.');
    }

    try {
      const response = await this.axiosInstance.post('/api/oauth/v1/token', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }, {
        headers: {
          'Authorization': `Basic ${this.getEncodedCredentials()}`,
          'Content-Type': 'application/json'
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

      // Update authorization header
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      console.log('Successfully refreshed Akeneo access token');
      return true;
    } catch (error) {
      console.error('Failed to refresh Akeneo access token:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Check if token is expired and refresh if needed
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      await this.authenticate();
      return;
    }

    // Check if token is expired or will expire in the next 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + (5 * 60 * 1000));
    if (this.tokenExpiresAt && this.tokenExpiresAt <= fiveMinutesFromNow) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Make authenticated request to Akeneo API
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    await this.ensureValidToken();

    try {
      const config = {
        method,
        url: endpoint,
        params
      };

      if (data) {
        config.data = data;
      }

      console.log(`🌐 Making ${method} request to ${endpoint}`, { params, hasData: !!data });
      const response = await this.axiosInstance.request(config);
      return response.data;
    } catch (error) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: endpoint,
        method,
        params
      };
      
      console.error(`❌ Failed to ${method} ${endpoint}:`, errorDetails);
      
      // More specific error message for 422
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.errors || [];
        const errorMessage = validationErrors.length > 0 
          ? `Validation errors: ${validationErrors.map(e => e.message || e).join(', ')}`
          : `Invalid request parameters for ${endpoint}`;
        throw new Error(`422 Unprocessable Entity: ${errorMessage}`);
      }
      
      throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get categories from Akeneo
   */
  async getCategories(params = {}) {
    return this.makeRequest('GET', '/api/rest/v1/categories', null, params);
  }

  /**
   * Get specific category by code
   */
  async getCategory(code) {
    return this.makeRequest('GET', `/api/rest/v1/categories/${code}`);
  }

  /**
   * Get products from Akeneo v7 (UUID-based endpoint)
   */
  async getProducts(params = {}) {
    return this.makeRequest('GET', '/api/rest/v1/products-uuid', null, params);
  }

  /**
   * Get specific product by UUID
   */
  async getProduct(uuid) {
    return this.makeRequest('GET', `/api/rest/v1/products-uuid/${uuid}`);
  }

  /**
   * Search products with advanced criteria
   */
  async searchProducts(searchCriteria, params = {}) {
    return this.makeRequest('POST', '/api/rest/v1/products-uuid/search', searchCriteria, params);
  }

  /**
   * Get all categories with pagination handling
   */
  async getAllCategories() {
    const allCategories = [];
    let nextUrl = null;

    do {
      const params = nextUrl ? {} : { limit: 100 };
      const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/categories';
      
      const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

      if (response._embedded && response._embedded.items) {
        allCategories.push(...response._embedded.items);
      }

      nextUrl = response._links && response._links.next ? response._links.next.href : null;
    } while (nextUrl);

    return allCategories;
  }

  /**
   * Get all products with pagination handling
   */
  async getAllProducts() {
    const allProducts = [];
    
    try {
      // Try multiple approaches for Akeneo v7 compatibility
      console.log('🔍 Attempting to fetch products using different methods...');
      
      // Method 1: Try direct products-uuid endpoint
      try {
        console.log('📦 Method 1: Direct products-uuid endpoint');
        const response = await this.getProducts({ 
          limit: 10,
          'with_count': false
        });
        
        if (response._embedded && response._embedded.items) {
          allProducts.push(...response._embedded.items);
          console.log(`✅ Method 1 successful: ${response._embedded.items.length} products`);
          return allProducts;
        }
      } catch (error1) {
        console.log(`❌ Method 1 failed: ${error1.message}`);
      }
      
      // Method 2: Try search endpoint with empty criteria
      try {
        console.log('📦 Method 2: Search endpoint');
        const searchCriteria = {};
        const response = await this.searchProducts(searchCriteria, { 
          limit: 10,
          'with_count': false
        });
        
        if (response._embedded && response._embedded.items) {
          allProducts.push(...response._embedded.items);
          console.log(`✅ Method 2 successful: ${response._embedded.items.length} products`);
          return allProducts;
        }
      } catch (error2) {
        console.log(`❌ Method 2 failed: ${error2.message}`);
      }
      
      // Method 3: Try old identifier-based endpoint as fallback
      try {
        console.log('📦 Method 3: Fallback to identifier-based endpoint');
        const response = await this.makeRequest('GET', '/api/rest/v1/products', null, { 
          limit: 10,
          'with_count': false
        });
        
        if (response._embedded && response._embedded.items) {
          allProducts.push(...response._embedded.items);
          console.log(`✅ Method 3 successful: ${response._embedded.items.length} products`);
          return allProducts;
        }
      } catch (error3) {
        console.log(`❌ Method 3 failed: ${error3.message}`);
        throw new Error(`All product fetch methods failed. Last error: ${error3.message}`);
      }
      
      throw new Error('No products found using any method');
      
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      throw error;
    }
  }

  /**
   * Test connection to Akeneo PIM
   */
  async testConnection() {
    try {
      await this.authenticate();
      await this.getCategories({ limit: 1 });
      
      // Test product endpoint with different approaches
      try {
        console.log('🔍 Testing product endpoints...');
        
        // Test 1: Simple products-uuid request without parameters
        try {
          console.log('Test 1: Basic products-uuid');
          await this.makeRequest('GET', '/api/rest/v1/products-uuid');
          console.log('✅ Basic products-uuid works');
          return { success: true, message: 'Connection successful (categories and products-uuid)' };
        } catch (e1) {
          console.log(`Test 1 failed: ${e1.message}`);
        }
        
        // Test 2: Products-uuid with minimal params
        try {
          console.log('Test 2: Products-uuid with limit only');
          await this.makeRequest('GET', '/api/rest/v1/products-uuid', null, { limit: 1 });
          console.log('✅ Products-uuid with limit works');
          return { success: true, message: 'Connection successful (categories and products-uuid with limit)' };
        } catch (e2) {
          console.log(`Test 2 failed: ${e2.message}`);
        }
        
        // Test 3: Old products endpoint
        try {
          console.log('Test 3: Old products endpoint');
          await this.makeRequest('GET', '/api/rest/v1/products', null, { limit: 1 });
          console.log('✅ Old products endpoint works');
          return { success: true, message: 'Connection successful (categories and old products)' };
        } catch (e3) {
          console.log(`Test 3 failed: ${e3.message}`);
        }
        
        // Test 4: Check user permissions by trying to get product model
        try {
          console.log('Test 4: Product models endpoint');
          await this.makeRequest('GET', '/api/rest/v1/product-models', null, { limit: 1 });
          console.log('✅ Product models endpoint works');
          return { success: true, message: 'Connection successful (categories and product-models)' };
        } catch (e4) {
          console.log(`Test 4 failed: ${e4.message}`);
        }
        
        // Test 5: Check other endpoints to understand permission scope
        const permissionTests = [
          { name: 'families', endpoint: '/api/rest/v1/families' },
          { name: 'attributes', endpoint: '/api/rest/v1/attributes' },
          { name: 'channels', endpoint: '/api/rest/v1/channels' },
          { name: 'locales', endpoint: '/api/rest/v1/locales' }
        ];
        
        const workingEndpoints = [];
        for (const test of permissionTests) {
          try {
            await this.makeRequest('GET', test.endpoint, null, { limit: 1 });
            workingEndpoints.push(test.name);
            console.log(`✅ ${test.name} endpoint works`);
          } catch (e) {
            console.log(`❌ ${test.name} endpoint failed: ${e.message}`);
          }
        }
        
        console.error('❌ All product endpoint tests failed');
        const permissionMessage = workingEndpoints.length > 0 
          ? `Working endpoints: ${workingEndpoints.join(', ')}. Check if your Akeneo user has 'Product' read permissions.`
          : 'Very limited API access. Check if your user has proper API permissions in Akeneo.';
          
        return { success: true, message: `Connection successful (categories only). ${permissionMessage}` };
        
      } catch (productError) {
        console.error('❌ Product endpoint test failed:', productError.message);
        return { success: true, message: `Connection successful (categories only). Product endpoint error: ${productError.message}` };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = AkeneoClient;