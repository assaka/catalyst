import apiClient from './client';

// Base Entity class for common CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  // Get all records with pagination and filters
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      
      const response = await apiClient.get(url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`BaseEntity.findAll() error for ${this.endpoint}:`, error.message);
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

  // List records with optional ordering (alias for findAll)
  async list(orderBy = null, limit = null) {
    const params = {};
    if (orderBy) {
      params.order_by = orderBy;
    }
    if (limit) {
      params.limit = limit;
    }
    return this.findAll(params);
  }

  // Filter records (alias for findAll for compatibility)
  async filter(params = {}) {
    try {
      const result = await this.findAll(params);
      
      // Double-check that result is an array
      const finalResult = Array.isArray(result) ? result : [];
      
      return finalResult;
    } catch (error) {
      console.error(`BaseEntity.filter() error for ${this.endpoint}:`, error.message);
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
    try {
      await apiClient.post('auth/logout');
    } catch (error) {
      console.error('Backend logout failed:', error.message);
    }

    // Clear the token from client-side storage
    apiClient.setToken(null);
    
    // Clear all user-related cached data
    localStorage.removeItem('user_data');
    localStorage.removeItem('selectedStoreId');
    localStorage.removeItem('storeProviderCache');
    localStorage.removeItem('onboarding_form_data');
    
    // Clear session IDs
    localStorage.removeItem('guest_session_id');
    localStorage.removeItem('cart_session_id');
    
    // Clear authentication cookies (if any exist)
    // This attempts to clear common auth cookie names
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      // Clear cookies that might be authentication related
      if (name.toLowerCase().includes('auth') || 
          name.toLowerCase().includes('session') || 
          name.toLowerCase().includes('token') ||
          name === 'connect.sid' || 
          name === 'jwt') {
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    });
    
    // Dispatch logout event to notify other components
    window.dispatchEvent(new CustomEvent('userLoggedOut', { 
      detail: { timestamp: new Date().toISOString() } 
    }));
    
    return { success: true };
  }

  async me() {
    const response = await apiClient.get('auth/me');
    const data = response.data || response;
    // Handle case where data is returned as an array
    return Array.isArray(data) ? data[0] : data;
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
    const data = response.data || response;
    // Handle case where data is returned as an array
    return Array.isArray(data) ? data[0] : data;
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

  // Get user's stores (authenticated)
  async getUserStores() {
    const result = await this.findAll();
    return Array.isArray(result) ? result : [];
  }

  // Public store access (no authentication required)
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `stores?${queryString}` : 'stores';
      
      console.log(`🚀 StoreService.filter: Calling ${url} with params:`, params);
      const response = await apiClient.publicRequest('GET', url);
      console.log(`📊 StoreService.filter: Response:`, response);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      console.log(`✅ StoreService.filter: Final result (${result.length} stores):`, result);
      
      return result;
    } catch (error) {
      console.error(`❌ StoreService.filter() error:`, error.message);
      console.error('Error details:', error);
      return [];
    }
  }

  // Public findAll (no authentication required)
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `stores?${queryString}` : 'stores';
      
      const response = await apiClient.publicRequest('GET', url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`StoreService.findAll() error:`, error.message);
      return [];
    }
  }
}

// Product service with additional methods
class ProductService extends BaseEntity {
  constructor() {
    super('products');
  }

  // Public product access (no authentication required)
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `products?${queryString}` : 'products';
      
      const response = await apiClient.publicRequest('GET', url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`ProductService.filter() error:`, error.message);
      return [];
    }
  }

  // Public findAll (no authentication required)
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `products?${queryString}` : 'products';
      
      const response = await apiClient.publicRequest('GET', url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`ProductService.findAll() error:`, error.message);
      return [];
    }
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

  // Public category access (no authentication required)
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `categories?${queryString}` : 'categories';
      
      const response = await apiClient.publicRequest('GET', url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`CategoryService.filter() error:`, error.message);
      return [];
    }
  }

  // Public findAll (no authentication required)
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `categories?${queryString}` : 'categories';
      
      const response = await apiClient.publicRequest('GET', url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`CategoryService.findAll() error:`, error.message);
      return [];
    }
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
export const ShippingMethodType = new BaseEntity('shipping-types');
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
class StorePluginEntity extends BaseEntity {
  constructor() {
    super('store-plugins');
  }

  // Public method to get active plugins without authentication
  async getPublic(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.endpoint}/public?${queryString}` : `${this.endpoint}/public`;
    
    try {
      const response = await apiClient.get(url);
      const plugins = response?.data?.store_plugins || response?.store_plugins || response || [];
      return Array.isArray(plugins) ? plugins : [];
    } catch (error) {
      console.error(`Failed to load public store plugins:`, error.message);
      return [];
    }
  }
}

export const StorePlugin = new StorePluginEntity();
export const Language = new BaseEntity('languages');
export const SeoTemplate = new BaseEntity('seo-templates');
export const SeoSetting = new BaseEntity('seo-settings');
export const CreditTransaction = new BaseEntity('credit-transactions');
export const CookieConsentSettings = new BaseEntity('cookie-consent-settings');
export const ConsentLog = new BaseEntity('consent-logs');
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