import apiClient from './client';

// Base Entity class for common CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  // Get all records with pagination and filters
  async findAll(params = {}) {
    console.log(`🔍 BaseEntity.findAll() called:`, {
      endpoint: this.endpoint,
      params,
      paramsString: JSON.stringify(params)
    });
    
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      console.log(`🔍 BaseEntity.findAll() about to call API:`, {
        endpoint: this.endpoint,
        url,
        queryString
      });
      
      const response = await apiClient.get(url);
      
      console.log(`🔍 BaseEntity.findAll() received response:`, {
        endpoint: this.endpoint,
        responseType: typeof response,
        isArray: Array.isArray(response),
        responseLength: Array.isArray(response) ? response.length : 'N/A',
        responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'N/A',
        responseSample: response && typeof response === 'object' ? JSON.stringify(response).substring(0, 200) : response
      });
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      console.log(`🔍 BaseEntity.findAll() returning:`, {
        endpoint: this.endpoint,
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultLength: result.length,
        resultSample: JSON.stringify(result).substring(0, 200)
      });
      
      return result;
    } catch (error) {
      console.warn(`⚠️ BaseEntity.findAll() error for ${this.endpoint}:`, error.message);
      console.log(`🔍 BaseEntity.findAll() returning empty array due to error:`, {
        endpoint: this.endpoint,
        error: error.message
      });
      return [];
    }
  }

  // Get single record by ID
  async findById(id) {
    const response = await apiClient.get(`${this.endpoint}/${id}`);
    return response;
  }

  // Create new record
  async create(data) {
    const response = await apiClient.post(this.endpoint, data);
    return response;
  }

  // Update record by ID
  async update(id, data) {
    const response = await apiClient.put(`${this.endpoint}/${id}`, data);
    return response;
  }

  // Delete record by ID
  async delete(id) {
    const response = await apiClient.delete(`${this.endpoint}/${id}`);
    return response;
  }

  // Filter records (alias for findAll for compatibility)
  async filter(params = {}) {
    console.log(`🔍 BaseEntity.filter() called:`, {
      endpoint: this.endpoint,
      params,
      paramsString: JSON.stringify(params)
    });
    
    try {
      const result = await this.findAll(params);
      
      console.log(`🔍 BaseEntity.filter() received from findAll():`, {
        endpoint: this.endpoint,
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultLength: Array.isArray(result) ? result.length : 'N/A',
        resultSample: result && typeof result === 'object' ? JSON.stringify(result).substring(0, 200) : result
      });
      
      // Double-check that result is an array
      const finalResult = Array.isArray(result) ? result : [];
      
      console.log(`🔍 BaseEntity.filter() returning:`, {
        endpoint: this.endpoint,
        finalResultType: typeof finalResult,
        isArray: Array.isArray(finalResult),
        finalResultLength: finalResult.length,
        finalResultSample: JSON.stringify(finalResult).substring(0, 200)
      });
      
      return finalResult;
    } catch (error) {
      console.warn(`⚠️ BaseEntity.filter() error for ${this.endpoint}:`, error.message);
      console.log(`🔍 BaseEntity.filter() returning empty array due to error:`, {
        endpoint: this.endpoint,
        error: error.message
      });
      return [];
    }
  }

  // Find one record (returns first match)
  async findOne(params = {}) {
    const results = await this.findAll({ ...params, limit: 1 });
    // Ensure results is an array before accessing length
    const safeResults = Array.isArray(results) ? results : [];
    return safeResults.length > 0 ? safeResults[0] : null;
  }
}

// Authentication service
class AuthService {
  async login(email, password, rememberMe = false) {
    const response = await apiClient.post('auth/login', { email, password, rememberMe });
    if (response.data && response.data.token) {
      apiClient.setToken(response.data.token);
    } else if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.data || response;
  }

  googleLogin() {
    window.location.href = `${apiClient.baseURL}/api/auth/google`;
  }

  async register(userData) {
    const response = await apiClient.post('auth/register', userData);
    if (response.data && response.data.token) {
      apiClient.setToken(response.data.token);
    } else if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.data || response;
  }

  async logout() {
    console.log('🔄 User.logout() called');
    
    try {
      // Call backend logout endpoint to log the event
      console.log('🔄 Calling backend logout...');
      await apiClient.post('auth/logout');
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('❌ Backend logout failed:', error.message);
      // Continue with client-side logout even if backend fails
    }
    
    // Clear the token from client-side storage
    console.log('🔄 Clearing client-side token...');
    apiClient.setToken(null);
    
    // Clear any cached user data
    console.log('🔄 Clearing cached user data...');
    localStorage.removeItem('user_data');
    
    console.log('✅ User.logout() completed');
    return { success: true };
  }

  async me() {
    const response = await apiClient.get('auth/me');
    return response.data || response;
  }

  async getCurrentUser() {
    return this.me();
  }

  isAuthenticated() {
    return !!apiClient.getToken();
  }
}

// User service with special methods
class UserService extends BaseEntity {
  constructor() {
    super('users');
  }

  // Get current user (alias for auth/me)
  async me() {
    const response = await apiClient.get('auth/me');
    return response.data || response;
  }

  // Update profile
  async updateProfile(data) {
    const user = await this.me();
    return this.update(user.id, data);
  }
}

// Store service
class StoreService extends BaseEntity {
  constructor() {
    super('stores');
  }

  // Get user's stores
  async getUserStores() {
    const result = await this.findAll();
    return Array.isArray(result) ? result : [];
  }
}

// Product service with additional methods
class ProductService extends BaseEntity {
  constructor() {
    super('products');
  }

  // Search products
  async search(query, params = {}) {
    const result = await this.findAll({ ...params, search: query });
    return Array.isArray(result) ? result : [];
  }

  // Get products by category
  async getByCategory(categoryId, params = {}) {
    const result = await this.findAll({ ...params, category_id: categoryId });
    return Array.isArray(result) ? result : [];
  }

  // Get featured products
  async getFeatured(params = {}) {
    const result = await this.findAll({ ...params, featured: true });
    return Array.isArray(result) ? result : [];
  }
}

// Category service with hierarchy methods
class CategoryService extends BaseEntity {
  constructor() {
    super('categories');
  }

  // Get root categories
  async getRootCategories(params = {}) {
    const result = await this.findAll({ ...params, parent_id: null });
    return Array.isArray(result) ? result : [];
  }

  // Get child categories
  async getChildren(parentId, params = {}) {
    const result = await this.findAll({ ...params, parent_id: parentId });
    return Array.isArray(result) ? result : [];
  }
}

// Order service with status methods
class OrderService extends BaseEntity {
  constructor() {
    super('orders');
  }

  // Get orders by status
  async getByStatus(status, params = {}) {
    const result = await this.findAll({ ...params, status });
    return Array.isArray(result) ? result : [];
  }

  // Update order status
  async updateStatus(id, status) {
    return this.update(id, { status });
  }
}

// Create entity instances
export const Auth = new AuthService();
export const User = new UserService();
export const Store = new StoreService();
export const Product = new ProductService();
export const Category = new CategoryService();
export const Attribute = new BaseEntity('attributes');
export const AttributeSet = new BaseEntity('attribute-sets');
export const Order = new OrderService();
export const OrderItem = new BaseEntity('order-items');
export const Coupon = new BaseEntity('coupons');
export const CmsPage = new BaseEntity('cms');
export const Tax = new BaseEntity('tax');
export const ShippingMethod = new BaseEntity('shipping');
export const DeliverySettings = new BaseEntity('delivery');

// Additional entities (you can implement these as needed)
export const Cart = new BaseEntity('cart');
export const Wishlist = new BaseEntity('wishlist');
export const Address = new BaseEntity('addresses');
export const CmsBlock = new BaseEntity('cms-blocks');
export const ProductLabel = new BaseEntity('product-labels');
export const ProductTab = new BaseEntity('product-tabs');
export const TaxType = new BaseEntity('tax-types');
export const Service = new BaseEntity('services');
export const CustomOptionRule = new BaseEntity('custom-option-rules');
export const Plugin = new BaseEntity('plugins');
export const StorePlugin = new BaseEntity('store-plugins');
export const Language = new BaseEntity('languages');
export const SeoTemplate = new BaseEntity('seo-templates');
export const SeoSetting = new BaseEntity('seo-settings');
export const CreditTransaction = new BaseEntity('credit-transactions');
export const CookieConsentSettings = new BaseEntity('cookie-consent-settings');
export const CookieConsent = new BaseEntity('cookie-consent');
export const PriceAlertSubscription = new BaseEntity('price-alert-subscriptions');
export const StockAlertSubscription = new BaseEntity('stock-alert-subscriptions');
export const PaymentMethod = new BaseEntity('payment-methods');
export const Customer = new BaseEntity('customers');
export const CustomerActivity = new BaseEntity('customer-activity');
export const Redirect = new BaseEntity('redirects');
export const MediaAsset = new BaseEntity('media-assets');

// For backward compatibility, export common methods
export const getCurrentUser = () => User.me();
export const login = (email, password) => Auth.login(email, password);
export const logout = () => Auth.logout();
export const register = (userData) => Auth.register(userData);

// Export API client for advanced usage
export { apiClient };

// Health check
export const healthCheck = () => apiClient.healthCheck();