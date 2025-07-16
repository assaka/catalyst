import apiClient from './client';

// Base Entity class for common CRUD operations
class BaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  // Get all records with pagination and filters
  async findAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
    const response = await apiClient.get(url);
    return response.data;
  }

  // Get single record by ID
  async findById(id) {
    const response = await apiClient.get(`${this.endpoint}/${id}`);
    return response.data;
  }

  // Create new record
  async create(data) {
    const response = await apiClient.post(this.endpoint, data);
    return response.data;
  }

  // Update record by ID
  async update(id, data) {
    const response = await apiClient.put(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  // Delete record by ID
  async delete(id) {
    const response = await apiClient.delete(`${this.endpoint}/${id}`);
    return response.data;
  }

  // Filter records (alias for findAll for compatibility)
  async filter(params = {}) {
    return this.findAll(params);
  }

  // Find one record (returns first match)
  async findOne(params = {}) {
    const results = await this.findAll({ ...params, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }
}

// Authentication service
class AuthService {
  async login(email, password, rememberMe = false) {
    const response = await apiClient.post('auth/login', { email, password, rememberMe });
    if (response.data.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
  }

  googleLogin() {
    window.location.href = `${apiClient.baseURL}/api/auth/google`;
  }

  async register(userData) {
    const response = await apiClient.post('auth/register', userData);
    if (response.data.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
  }

  async logout() {
    apiClient.setToken(null);
    return { success: true };
  }

  async me() {
    const response = await apiClient.get('auth/me');
    return response.data;
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
    return response.data;
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
    return this.findAll();
  }
}

// Product service with additional methods
class ProductService extends BaseEntity {
  constructor() {
    super('products');
  }

  // Search products
  async search(query, params = {}) {
    return this.findAll({ ...params, search: query });
  }

  // Get products by category
  async getByCategory(categoryId, params = {}) {
    return this.findAll({ ...params, category_id: categoryId });
  }

  // Get featured products
  async getFeatured(params = {}) {
    return this.findAll({ ...params, featured: true });
  }
}

// Category service with hierarchy methods
class CategoryService extends BaseEntity {
  constructor() {
    super('categories');
  }

  // Get root categories
  async getRootCategories(params = {}) {
    return this.findAll({ ...params, parent_id: null });
  }

  // Get child categories
  async getChildren(parentId, params = {}) {
    return this.findAll({ ...params, parent_id: parentId });
  }
}

// Order service with status methods
class OrderService extends BaseEntity {
  constructor() {
    super('orders');
  }

  // Get orders by status
  async getByStatus(status, params = {}) {
    return this.findAll({ ...params, status });
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