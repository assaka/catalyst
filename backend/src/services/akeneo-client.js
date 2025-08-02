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

      const response = await this.axiosInstance.request(config);
      return response.data;
    } catch (error) {
      console.error(`Failed to ${method} ${endpoint}:`, error.response?.data || error.message);
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
   * Get products from Akeneo (UUID-based endpoint)
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
    let hasNextPage = true;
    let currentPage = 1;

    while (hasNextPage) {
      const response = await this.getCategories({ 
        limit: 100,
        page: currentPage
      });

      if (response._embedded && response._embedded.items) {
        allCategories.push(...response._embedded.items);
      }

      hasNextPage = response._links && response._links.next;
      currentPage++;
    }

    return allCategories;
  }

  /**
   * Get all products with pagination handling
   */
  async getAllProducts() {
    const allProducts = [];
    let hasNextPage = true;
    let currentPage = 1;

    while (hasNextPage) {
      const response = await this.getProducts({ 
        limit: 100,
        page: currentPage
      });

      if (response._embedded && response._embedded.items) {
        allProducts.push(...response._embedded.items);
      }

      hasNextPage = response._links && response._links.next;
      currentPage++;
    }

    return allProducts;
  }

  /**
   * Test connection to Akeneo PIM
   */
  async testConnection() {
    try {
      await this.authenticate();
      await this.getCategories({ limit: 1 });
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = AkeneoClient;