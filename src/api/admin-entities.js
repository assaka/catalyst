import adminApiClient from './admin-client';

// Base Entity class for admin/store owner operations
class AdminBaseEntity {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.client = adminApiClient;
  }

  // Get all records with pagination and filters
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
      const response = await this.client.get(url);

      // Handle new structured response format {success: true, data: [...], pagination: {...}}
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }

      // Handle direct array response (backwards compatibility)
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error(`Admin ${this.endpoint}.findAll()c error:`, error.message);
      throw error; // Don't suppress errors in admin context
    }
  }

  // Get single record by ID
  async findById(id) {
    const response = await this.client.get(`${this.endpoint}/${id}`);
    return response;
  }

  // Create new record
  async create(data) {
    const response = await this.client.post(this.endpoint, data);
    return response;
  }

  // Update record by ID
  async update(id, data) {
    const response = await this.client.put(`${this.endpoint}/${id}`, data);
    return response;
  }

  // Delete record by ID
  async delete(id) {
    const response = await this.client.delete(`${this.endpoint}/${id}`);
    return response;
  }

  // List records with optional ordering
  async list(orderBy = null, limit = null) {
    const params = {};
    if (orderBy) params.order_by = orderBy;
    if (limit) params.limit = limit;
    return this.findAll(params);
  }

  // Filter records
  async filter(params = {}) {
    return this.findAll(params);
  }

  // Find one record
  async findOne(params = {}) {
    const results = await this.findAll({ ...params, limit: 1 });
    const safeResults = Array.isArray(results) ? results : [];
    return safeResults.length > 0 ? safeResults[0] : null;
  }
}

// Admin Authentication service
class AdminAuthService {
  constructor() {
    this.client = adminApiClient;
  }

  async login(email, password, rememberMe = false) {
    const response = await this.client.post('auth/login', { email, password, rememberMe });
    if (response.data && response.data.token) {
      this.client.setToken(response.data.token);
    } else if (response.token) {
      this.client.setToken(response.token);
    }
    return response.data || response;
  }

  async logout() {
    return this.client.logout();
  }

  async me() {
    const response = await this.client.get('auth/me');
    const data = response.data || response;
    return Array.isArray(data) ? data[0] : data;
  }

  async getCurrentUser() {
    return this.me();
  }

  isAuthenticated() {
    return this.client.isAuthenticated();
  }
}

// Admin User service
class AdminUserService extends AdminBaseEntity {
  constructor() {
    super('users');
  }

  async me() {
    const response = await this.client.get('auth/me');
    const data = response.data || response;
    return Array.isArray(data) ? data[0] : data;
  }

  async updateProfile(data) {
    const user = await this.me();
    return this.update(user.id, data);
  }
}

// Admin Store service
class AdminStoreService extends AdminBaseEntity {
  constructor() {
    super('stores');
  }

  async getUserStores() {
    const result = await this.findAll();
    return Array.isArray(result) ? result : [];
  }
}

// Admin Product service
class AdminProductService extends AdminBaseEntity {
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

// Admin Category service
class AdminCategoryService extends AdminBaseEntity {
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

// Admin Order service
class AdminOrderService extends AdminBaseEntity {
  constructor() {
    super('orders');
  }

  async getByStatus(status, params = {}) {
    const result = await this.findAll({ ...params, status });
    return Array.isArray(result) ? result : [];
  }

  async updateStatus(id, status) {
    return this.update(id, { status });
  }
}

// Create admin entity instances
export const AdminAuth = new AdminAuthService();
export const AdminUser = new AdminUserService();
export const AdminStore = new AdminStoreService();
export const AdminProduct = new AdminProductService();
export const AdminCategory = new AdminCategoryService();
export const AdminAttribute = new AdminBaseEntity('attributes');
export const AdminAttributeSet = new AdminBaseEntity('attribute-sets');
export const AdminOrder = new AdminOrderService();
export const AdminOrderItem = new AdminBaseEntity('order-items');
export const AdminCoupon = new AdminBaseEntity('coupons');
export const AdminCmsPage = new AdminBaseEntity('cms-pages');
export const AdminTax = new AdminBaseEntity('tax');
export const AdminShippingMethod = new AdminBaseEntity('shipping');
export const AdminShippingMethodType = new AdminBaseEntity('shipping-types');
export const AdminDeliverySettings = new AdminBaseEntity('delivery');
export const AdminAddress = new AdminBaseEntity('addresses');
export const AdminCmsBlock = new AdminBaseEntity('cms-blocks');
export const AdminProductLabel = new AdminBaseEntity('product-labels');
export const AdminProductTab = new AdminBaseEntity('product-tabs');
export const AdminTaxType = new AdminBaseEntity('tax-types');
export const AdminService = new AdminBaseEntity('services');
export const AdminCustomOptionRule = new AdminBaseEntity('custom-option-rules');
export const AdminPlugin = new AdminBaseEntity('plugins');
export const AdminStorePlugin = new AdminBaseEntity('store-plugins');
export const AdminLanguage = new AdminBaseEntity('languages');
export const AdminSeoTemplate = new AdminBaseEntity('seo-templates');
export const AdminSeoSetting = new AdminBaseEntity('seo-settings');
export const AdminCreditTransaction = new AdminBaseEntity('credit-transactions');
export const AdminCookieConsentSettings = new AdminBaseEntity('cookie-consent-settings');
export const AdminConsentLog = new AdminBaseEntity('consent-logs');
export const AdminPriceAlertSubscription = new AdminBaseEntity('price-alert-subscriptions');
export const AdminStockAlertSubscription = new AdminBaseEntity('stock-alert-subscriptions');
export const AdminPaymentMethod = new AdminBaseEntity('payment-methods');
export const AdminCustomer = new AdminBaseEntity('customers');
export const AdminCustomerActivity = new AdminBaseEntity('customer-activity');
export const AdminRedirect = new AdminBaseEntity('redirects');
export const AdminMediaAsset = new AdminBaseEntity('media-assets');

// For backward compatibility
export const getCurrentUser = () => AdminUser.me();
export const login = (email, password) => AdminAuth.login(email, password);
export const logout = () => AdminAuth.logout();

// Export API client for advanced usage
export { adminApiClient };