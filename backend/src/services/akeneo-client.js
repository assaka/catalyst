const axios = require('axios');

class AkeneoClient {
  constructor(baseUrl, clientId, clientSecret, username, password) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.username = username;
    this.password = password;
    
    // Debug logging to verify credentials are passed correctly
    console.log('🔧 AkeneoClient initialized with:');
    console.log('  Base URL:', this.baseUrl);
    console.log('  Username:', this.username);
    console.log('  Client ID present:', !!this.clientId);
    console.log('  Client Secret present:', !!this.clientSecret);
    console.log('  Password present:', !!this.password);
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
    console.log('🔍 Encoding credentials:', {
      clientId: this.clientId,
      clientIdType: typeof this.clientId,
      clientIdLength: this.clientId?.length,
      clientSecretPresent: !!this.clientSecret,
      clientSecretType: typeof this.clientSecret,
      clientSecretLength: this.clientSecret?.length,
      credentialsString: credentials.substring(0, 15) + '...',
      credentialsLength: credentials.length,
      base64Length: Buffer.from(credentials).toString('base64').length
    });
    return Buffer.from(credentials).toString('base64');
  }

  /**
   * Authenticate with Akeneo PIM and get access token
   */
  async authenticate() {
    console.log('🔑 Starting authentication...');
    console.log('  Using credentials - ClientID exists:', !!this.clientId, 'Username:', this.username);
    console.log('  Base URL:', this.baseUrl);
    
    try {
      // Use axios directly to avoid any baseURL issues
      const authUrl = `${this.baseUrl}/api/oauth/v1/token`;
      console.log('  Auth URL:', authUrl);
      
      const authData = {
        grant_type: 'password',
        username: this.username,
        password: this.password
      };
      
      const authHeaders = {
        'Authorization': `Basic ${this.getEncodedCredentials()}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      console.log('  Auth data:', { ...authData, password: '***' });
      console.log('  Auth headers:', { ...authHeaders, Authorization: authHeaders.Authorization.substring(0, 20) + '...' });
      
      const response = await axios.post(authUrl, authData, { headers: authHeaders });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

      // Set default authorization header for future requests
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      console.log('Successfully authenticated with Akeneo PIM');
      return true;
    } catch (error) {
      console.error('Failed to authenticate with Akeneo PIM:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      // Special handling for 422 errors
      if (error.response?.status === 422 && error.response?.data?.message?.includes('client_id')) {
        console.error('Client ID validation error. Check if client_id and client_secret are correct.');
        console.error('Current client_id:', this.clientId);
        console.error('Client_id length:', this.clientId?.length);
      }
      
      throw new Error(`Authentication failed: ${error.response?.data?.message || error.response?.data?.error_description || error.message}`);
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
          'Content-Type': 'application/json',
          'Accept': 'application/json'
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
        params,
        headers: {}
      };

      if (data) {
        config.data = data;
      }

      // Use application/json for all endpoints (hal+json not supported by this Akeneo instance)
      config.headers['Accept'] = 'application/json';

      console.log(`🌐 Making ${method} request to ${endpoint}`, { params, hasData: !!data, acceptHeader: config.headers['Accept'] || 'default' });
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
        console.error('🔴 422 Validation Error Details:');
        console.error('Full response data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request endpoint:', endpoint);
        console.error('Request params:', params);
        console.error('Request headers:', config.headers);
        
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
   * Get channels from Akeneo
   */
  async getChannels(params = {}) {
    return this.makeRequest('GET', '/api/rest/v1/channels', null, params);
  }

  /**
   * Get all channels with pagination handling
   */
  async getAllChannels() {
    const allChannels = [];
    let nextUrl = null;

    do {
      const params = nextUrl ? {} : { limit: 100 };
      const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/channels';
      
      const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

      if (response._embedded && response._embedded.items) {
        allChannels.push(...response._embedded.items);
      }

      nextUrl = response._links && response._links.next ? response._links.next.href : null;
    } while (nextUrl);

    return allChannels;
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
   * Get families from Akeneo
   */
  async getFamilies(params = {}) {
    return this.makeRequest('GET', '/api/rest/v1/families', null, params);
  }

  /**
   * Get specific family by code
   */
  async getFamily(code) {
    return this.makeRequest('GET', `/api/rest/v1/families/${code}`);
  }

  /**
   * Get attributes from Akeneo
   */
  async getAttributes(params = {}) {
    return this.makeRequest('GET', '/api/rest/v1/attributes', null, params);
  }

  /**
   * Get specific attribute by code
   */
  async getAttribute(code) {
    return this.makeRequest('GET', `/api/rest/v1/attributes/${code}`);
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
      console.log('🔍 Fetching ALL products with pagination...');
      
      // Method 1: Try standard products endpoint with full pagination
      try {
        console.log('📦 Method 1: Standard products endpoint with pagination');
        let nextUrl = null;
        let pageCount = 0;

        do {
          pageCount++;
          const params = nextUrl ? {} : { limit: 100 };
          const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/products';
          
          console.log(`📄 Fetching page ${pageCount}${nextUrl ? ' (from next URL)' : ''}`);
          const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

          if (response._embedded && response._embedded.items) {
            allProducts.push(...response._embedded.items);
            console.log(`✅ Page ${pageCount}: ${response._embedded.items.length} products (total: ${allProducts.length})`);
          }

          nextUrl = response._links && response._links.next ? response._links.next.href : null;
        } while (nextUrl);
        
        console.log(`✅ Method 1 successful: ${allProducts.length} total products`);
        return allProducts;
        
      } catch (error1) {
        console.log(`❌ Method 1 failed: ${error1.message}`);
        allProducts.length = 0; // Clear any partial data
      }
      
      // Method 2: Try search endpoint with pagination
      try {
        console.log('📦 Method 2: Search endpoint with pagination');
        let page = 1;
        let hasMorePages = true;

        while (hasMorePages) {
          console.log(`📄 Fetching page ${page} via search`);
          const searchCriteria = {};
          const response = await this.searchProducts(searchCriteria, { 
            limit: 100,
            page: page
          });
          
          if (response._embedded && response._embedded.items) {
            allProducts.push(...response._embedded.items);
            console.log(`✅ Page ${page}: ${response._embedded.items.length} products (total: ${allProducts.length})`);
            
            // Check if there are more pages
            hasMorePages = response._embedded.items.length === 100;
            page++;
          } else {
            hasMorePages = false;
          }
        }
        
        console.log(`✅ Method 2 successful: ${allProducts.length} total products`);
        return allProducts;
        
      } catch (error2) {
        console.log(`❌ Method 2 failed: ${error2.message}`);
        allProducts.length = 0; // Clear any partial data
      }
      
      // Method 3: Try UUID-based endpoint with pagination
      try {
        console.log('📦 Method 3: UUID-based endpoint with pagination');
        let nextUrl = null;
        let pageCount = 0;

        do {
          pageCount++;
          const params = nextUrl ? {} : { limit: 100 };
          const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/products-uuid';
          
          console.log(`📄 Fetching page ${pageCount}${nextUrl ? ' (from next URL)' : ''}`);
          const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

          if (response._embedded && response._embedded.items) {
            allProducts.push(...response._embedded.items);
            console.log(`✅ Page ${pageCount}: ${response._embedded.items.length} products (total: ${allProducts.length})`);
          }

          nextUrl = response._links && response._links.next ? response._links.next.href : null;
        } while (nextUrl);
        
        console.log(`✅ Method 3 successful: ${allProducts.length} total products`);
        return allProducts;
        
      } catch (error3) {
        console.log(`❌ Method 3 failed: ${error3.message}`);
        throw new Error(`All product fetch methods failed. Last error: ${error3.message}`);
      }
      
    } catch (error) {
      console.error('❌ Error fetching all products:', error.message);
      throw error;
    }
  }

  /**
   * Get all product models with pagination handling
   */
  async getAllProductModels() {
    const allProductModels = [];

    try {
      console.log('🔍 Fetching ALL product models with pagination...');
      let nextUrl = null;
      let pageCount = 0;

      do {
        pageCount++;
        const params = nextUrl ? {} : { limit: 100 };
        const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/product-models';

        console.log(`📄 Fetching product models page ${pageCount}${nextUrl ? ' (from next URL)' : ''}`);
        const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

        if (response._embedded && response._embedded.items) {
          allProductModels.push(...response._embedded.items);
          console.log(`✅ Page ${pageCount}: ${response._embedded.items.length} product models (total: ${allProductModels.length})`);
        }

        nextUrl = response._links && response._links.next ? response._links.next.href : null;
      } while (nextUrl);

      console.log(`✅ Fetched ${allProductModels.length} total product models`);
      return allProductModels;

    } catch (error) {
      console.error('❌ Error fetching product models:', error.message);
      throw error;
    }
  }

  /**
   * Get specific product model by code
   */
  async getProductModel(code) {
    return this.makeRequest('GET', `/api/rest/v1/product-models/${code}`);
  }

  /**
   * Get all families with pagination handling
   */
  async getAllFamilies() {
    const allFamilies = [];
    let nextUrl = null;

    do {
      const params = nextUrl ? {} : { limit: 100 };
      const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/families';

      const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

      if (response._embedded && response._embedded.items) {
        allFamilies.push(...response._embedded.items);
      }

      nextUrl = response._links && response._links.next ? response._links.next.href : null;
    } while (nextUrl);

    return allFamilies;
  }

  /**
   * Get all attributes with pagination handling
   */
  async getAllAttributes() {
    const allAttributes = [];
    let nextUrl = null;

    do {
      const params = nextUrl ? {} : { limit: 100 };
      const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : '/api/rest/v1/attributes';
      
      const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

      if (response._embedded && response._embedded.items) {
        allAttributes.push(...response._embedded.items);
      }

      nextUrl = response._links && response._links.next ? response._links.next.href : null;
    } while (nextUrl);

    return allAttributes;
  }

  /**
   * Get attribute options for a specific attribute
   * @param {string} attributeCode - The attribute code to get options for
   * @returns {Promise<Array>} Array of attribute options
   */
  async getAttributeOptions(attributeCode) {
    const allOptions = [];
    let nextUrl = null;

    do {
      const params = nextUrl ? {} : { limit: 100 };
      const endpoint = nextUrl ? nextUrl.replace(this.baseUrl, '') : `/api/rest/v1/attributes/${attributeCode}/options`;
      
      const response = await this.makeRequest('GET', endpoint, null, nextUrl ? null : params);

      if (response._embedded && response._embedded.items) {
        allOptions.push(...response._embedded.items);
      }

      nextUrl = response._links && response._links.next ? response._links.next.href : null;
    } while (nextUrl);

    return allOptions;
  }

  /**
   * Get media file download URL with authentication
   * @param {string} code - Media file code
   * @returns {Promise<object>} Media file info with download URL
   */
  async getMediaFile(code) {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', `/api/rest/v1/media-files/${code}`);
      return response;
    } catch (error) {
      console.error(`Failed to get media file ${code}:`, error.message);
      throw error;
    }
  }

  /**
   * Get asset (Asset Manager) information
   * @param {string} assetCode - Asset code
   * @returns {Promise<object>} Asset info with reference files
   */
  async getAsset(assetCode) {
    try {
      await this.ensureValidToken();
      const response = await this.makeRequest('GET', `/api/rest/v1/assets/${assetCode}`);
      return response;
    } catch (error) {
      console.error(`Failed to get asset ${assetCode}:`, error.message);
      throw error;
    }
  }

  /**
   * Download file with authentication
   * @param {string} url - URL to download
   * @returns {Promise<Buffer>} File buffer
   */
  async downloadAuthenticatedFile(url) {
    try {
      await this.ensureValidToken();
      
      // If it's a relative URL, make it absolute
      if (!url.startsWith('http')) {
        url = `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': '*/*'
        },
        responseType: 'arraybuffer'
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      console.error(`Failed to download authenticated file from ${url}:`, error.message);
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
          console.log('Trying simplified products-uuid request...');
          
          // Try even simpler request with manual headers
          try {
            const response = await this.axiosInstance.get('/api/rest/v1/products-uuid', {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/json'
              }
            });
            console.log('✅ Simplified products-uuid with application/json works');
            return { success: true, message: 'Connection successful (simplified products-uuid)' };
          } catch (e1b) {
            console.log(`Simplified products-uuid also failed: ${e1b.message}`);
          }
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