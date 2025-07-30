import storefrontApiClient from './storefront-client';

// Base Entity class for storefront operations (public by default)
class StorefrontBaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.client = storefrontApiClient;
  }

  // Get all records - always uses public API
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`🌐 Storefront Public API: ${this.endpoint}.findAll() with URL: ${url}`);
      console.log(`🔍 API params:`, params);
      const response = await this.client.getPublic(url);
      console.log(`✅ API response for ${this.endpoint}:`, response);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`❌ Storefront ${this.endpoint}.findAll() error:`, error.message);
      console.error(`❌ Full error:`, error);
      return []; // Return empty array instead of throwing for public APIs
    }
  }

  // Get single record by ID - uses public API
  async findById(id) {
    try {
      const response = await this.client.getPublic(`${this.endpoint}/${id}`);
      return Array.isArray(response) ? response[0] : response;
    } catch (error) {
      console.error(`Storefront ${this.endpoint}.findById() error:`, error.message);
      return null;
    }
  }

  // Filter records - uses public API
  async filter(params = {}) {
    return this.findAll(params);
  }

  // List records with optional ordering
  async list(orderBy = null, limit = null) {
    const params = {};
    if (orderBy) params.order_by = orderBy;
    if (limit) params.limit = limit;
    return this.findAll(params);
  }

  // Find one record
  async findOne(params = {}) {
    const results = await this.findAll({ ...params, limit: 1 });
    const safeResults = Array.isArray(results) ? results : [];
    return safeResults.length > 0 ? safeResults[0] : null;
  }
}

// Customer-specific base entity (requires authentication)
class CustomerBaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.client = storefrontApiClient;
  }

  // Customer operations require authentication
  async findAll(params = {}) {
    try {
      let url = this.endpoint;
      
      // Add params as query string if provided
      if (params && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url = `${this.endpoint}?${queryString}`;
      }
      
      console.log(`👤 Customer API: ${this.endpoint}.findAll() with URL: ${url}`);
      const response = await this.client.getCustomer(url);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Customer ${this.endpoint}.findAll() error:`, error.message);
      throw error; // Throw errors for customer operations
    }
  }

  async findById(id) {
    const response = await this.client.getCustomer(`${this.endpoint}/${id}`);
    return response;
  }

  async create(data) {
    const response = await this.client.postCustomer(this.endpoint, data);
    return response;
  }

  async update(id, data) {
    const response = await this.client.putCustomer(`${this.endpoint}/${id}`, data);
    return response;
  }

  async delete(id) {
    const response = await this.client.deleteCustomer(`${this.endpoint}/${id}`);
    return response;
  }

  async filter(params = {}) {
    return this.findAll(params);
  }
}

// Customer Authentication service
class CustomerAuthService {
  constructor() {
    this.client = storefrontApiClient;
  }

  async login(email, password, rememberMe = false) {
    const response = await this.client.postCustomer('auth/login', { email, password, rememberMe });
    if (response.data && response.data.token) {
      this.client.setCustomerToken(response.data.token);
    } else if (response.token) {
      this.client.setCustomerToken(response.token);
    }
    return response.data || response;
  }

  async register(userData) {
    const response = await this.client.postCustomer('auth/register', userData);
    if (response.data && response.data.token) {
      this.client.setCustomerToken(response.data.token);
    } else if (response.token) {
      this.client.setCustomerToken(response.token);
    }
    return response.data || response;
  }

  async logout() {
    return this.client.customerLogout();
  }

  async me() {
    const response = await this.client.getCustomer('auth/me');
    const data = response.data || response;
    return Array.isArray(data) ? data[0] : data;
  }

  async getCurrentUser() {
    return this.me();
  }

  isAuthenticated() {
    return this.client.isCustomerAuthenticated();
  }
}

// Store service (public)
class StorefrontStoreService extends StorefrontBaseEntity {
  constructor() {
    super('stores');
  }

  // Override to use direct public call without extra processing
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `stores?${queryString}` : 'stores';
      
      console.log(`🏪 Storefront Store Filter: ${url}`);
      const response = await this.client.getPublic(url);
      
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`StorefrontStore.filter() error:`, error.message);
      return [];
    }
  }

  async findAll(params = {}) {
    return this.filter(params);
  }
}

// Product service (public)
class StorefrontProductService extends StorefrontBaseEntity {
  constructor() {
    super('products');
  }

  async search(query, params = {}) {
    const result = await this.findAll({ ...params, search: query });
    return Array.isArray(result) ? result : [];
  }

  async getByCategory(categoryId, params = {}) {
    const result = await this.findAll({ ...params, category_id: categoryId });
    return Array.isArray(result) ? result : [];
  }

  async getFeatured(params = {}) {
    const result = await this.findAll({ ...params, featured: true });
    return Array.isArray(result) ? result : [];
  }
}

// Category service (public)
class StorefrontCategoryService extends StorefrontBaseEntity {
  constructor() {
    super('categories');
  }

  async getRootCategories(params = {}) {
    const result = await this.findAll({ ...params, parent_id: null });
    return Array.isArray(result) ? result : [];
  }

  async getChildren(parentId, params = {}) {
    const result = await this.findAll({ ...params, parent_id: parentId });
    return Array.isArray(result) ? result : [];
  }
}

// Cart service (hybrid - supports both authenticated and guest users)
class StorefrontCartService {
  constructor() {
    this.endpoint = 'cart';
    this.client = storefrontApiClient;
  }

  async addItem(productId, quantity = 1, options = {}) {
    const data = { product_id: productId, quantity, options };
    
    try {
      return await this.client.customerRequest('POST', this.endpoint, data);
    } catch (error) {
      console.error(`Cart addItem error:`, error.message);
      throw error;
    }
  }

  async updateItem(itemId, quantity) {
    const data = { quantity };
    
    try {
      return await this.client.customerRequest('PUT', `${this.endpoint}/${itemId}`, data);
    } catch (error) {
      console.error(`Cart updateItem error:`, error.message);
      throw error;
    }
  }

  async removeItem(itemId) {
    try {
      return await this.client.customerRequest('DELETE', `${this.endpoint}/${itemId}`);
    } catch (error) {
      console.error(`Cart removeItem error:`, error.message);
      throw error;
    }
  }

  async getItems() {
    try {
      const response = await this.client.customerRequest('GET', this.endpoint);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Cart getItems error:`, error.message);
      return [];
    }
  }

  async clear() {
    try {
      return await this.client.customerRequest('DELETE', 'cart/clear');
    } catch (error) {
      console.error(`Cart clear error:`, error.message);
      throw error;
    }
  }
}

// Wishlist service (hybrid - supports both authenticated and guest users)
class StorefrontWishlistService {
  constructor() {
    this.endpoint = 'wishlist';
    this.client = storefrontApiClient;
  }

  // Check if user is authenticated and should use authenticated endpoints
  isAuthenticated() {
    return this.client.isCustomerAuthenticated();
  }

  async addItem(productId, storeId) {
    const data = { 
      product_id: productId,
      store_id: storeId 
    };
    
    try {
      // Use customerRequest which handles both authenticated and guest users
      return await this.client.customerRequest('POST', this.endpoint, data);
    } catch (error) {
      console.error(`Wishlist addItem error:`, error.message);
      throw error;
    }
  }

  async removeItem(productId, storeId) {
    try {
      // Use customerRequest which handles both authenticated and guest users
      const endpoint = storeId 
        ? `${this.endpoint}/product/${productId}?store_id=${storeId}`
        : `${this.endpoint}/product/${productId}`;
      return await this.client.customerRequest('DELETE', endpoint);
    } catch (error) {
      console.error(`Wishlist removeItem error:`, error.message);
      throw error;
    }
  }

  async getItems(storeId) {
    try {
      // Always use customerRequest which handles both authenticated and guest users
      const endpoint = storeId 
        ? `${this.endpoint}?store_id=${storeId}`
        : this.endpoint;
      console.log(`📋 Wishlist.getItems() called with storeId: ${storeId}, endpoint: ${endpoint}`);
      const response = await this.client.customerRequest('GET', endpoint);
      
      // Handle wrapped response structure from backend
      let items = [];
      if (response && response.success && response.data) {
        items = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        items = response;
      }
      
      console.log(`📋 Wishlist.getItems() returning ${items.length} items:`, items);
      return items;
    } catch (error) {
      console.error(`Wishlist ${this.endpoint}.getItems() error:`, error.message);
      return []; // Return empty array instead of throwing for guest users
    }
  }
}

// Create storefront entity instances
export const CustomerAuth = new CustomerAuthService();
export const StorefrontStore = new StorefrontStoreService();
export const StorefrontProduct = new StorefrontProductService();
export const StorefrontCategory = new StorefrontCategoryService();

// Public entities (no authentication required)
export const StorefrontTax = new StorefrontBaseEntity('tax');
export const StorefrontAttribute = new StorefrontBaseEntity('attributes');
export const StorefrontAttributeSet = new StorefrontBaseEntity('attribute-sets');
export const StorefrontProductLabel = new StorefrontBaseEntity('product-labels');
export const StorefrontProductTab = new StorefrontBaseEntity('product-tabs');
export const StorefrontSeoTemplate = new StorefrontBaseEntity('seo-templates');
export const StorefrontSeoSetting = new StorefrontBaseEntity('seo-settings');
export const StorefrontCookieConsentSettings = new StorefrontBaseEntity('cookie-consent-settings');

// Customer entities (authentication required)
export const CustomerCart = new StorefrontCartService();
export const CustomerWishlist = new StorefrontWishlistService();
export const CustomerOrder = new CustomerBaseEntity('orders');
export const CustomerAddress = new CustomerBaseEntity('addresses');
export const CustomerProfile = new CustomerBaseEntity('customers');

// For backward compatibility and customer operations
export const customerLogin = (email, password) => CustomerAuth.login(email, password);
export const customerLogout = () => CustomerAuth.logout();
export const customerRegister = (userData) => CustomerAuth.register(userData);
export const getCurrentCustomer = () => CustomerAuth.me();

// Export API client for advanced usage
export { storefrontApiClient };