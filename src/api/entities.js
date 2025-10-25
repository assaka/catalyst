import apiClient from './client';
import { shouldUsePublicAPI, hasAccessToEndpoint } from './endpointAccess';
import { setRoleBasedAuthData } from '../utils/auth';

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
      
      // Check authentication status and determine which API to use
      const hasToken = apiClient.getToken();
      const userRole = apiClient.getCurrentUserRole();
      const usePublicAPI = shouldUsePublicAPI(this.endpoint, hasToken, userRole);

      let response;
      if (usePublicAPI) {
        // Use public endpoint for endpoints that support it
        response = await apiClient.publicRequest('GET', url);
        
        // Public API usually returns just an array
        return Array.isArray(response) ? response : [];
      } else {
        // Use regular authenticated endpoint
        response = await apiClient.get(url);

        // Check if response has pagination structure
        if (response && response.success && response.data) {
          // If data is directly an array, return it (e.g., { success: true, data: [...] })
          if (Array.isArray(response.data)) {
            return response.data;
          }

          // Handle paginated response structure (e.g., { success: true, data: { products: [...], pagination: {...} } })
          const entityKey = Object.keys(response.data).find(key =>
            key !== 'pagination' && Array.isArray(response.data[key])
          );

          if (entityKey && response.data[entityKey]) {
            // Return the entity array along with pagination info
            const result = response.data[entityKey];
            result.pagination = response.data.pagination;
            return result;
          }
        }

        // Fallback to treating response as array
        return Array.isArray(response) ? response : [];
      }
    } catch (error) {
      console.error(`BaseEntity.findAll() error for ${this.endpoint}:`, error.message);
      return [];
    }
  }

  // Get single record by ID
  async findById(id) {
    return await apiClient.get(`${this.endpoint}/${id}`);;
  }

  // Create new record
  async create(data) {
    return await apiClient.post(this.endpoint, data);;
  }

  // Update record by ID
  async update(id, data) {
    return await apiClient.put(`${this.endpoint}/${id}`, data);;
  }

  // Delete record by ID
  async delete(id) {
    return await apiClient.delete(`${this.endpoint}/${id}`);
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

  // Get paginated records with full pagination metadata
  async findPaginated(page = 1, limit = 10, filters = {}) {
    try {
      const params = {
        page: page,
        limit: limit,
        ...filters
      };
      
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.endpoint}?${queryString}`;
      
      // Check authentication status and determine which API to use
      const hasToken = apiClient.getToken();
      const userRole = apiClient.getCurrentUserRole();
      const usePublicAPI = shouldUsePublicAPI(this.endpoint, hasToken, userRole);

      let response;
      if (usePublicAPI) {
        // Use public endpoint for endpoints that support it
        response = await apiClient.publicRequest('GET', url);
        
        // Public API usually returns just an array, simulate pagination
        const data = Array.isArray(response) ? response : [];
        return {
          data: data,
          pagination: {
            current_page: page,
            per_page: limit,
            total: data.length,
            total_pages: Math.ceil(data.length / limit)
          }
        };
      } else {
        // Use regular authenticated endpoint
        response = await apiClient.get(url);
        
        // Check if response has pagination structure
        if (response && response.success && response.data) {
          // Handle different entity key formats (attributes, attribute_sets, etc.)
          const possibleKeys = ['attributes', 'attribute_sets', 'categories', 'products'];
          let entityKey = Object.keys(response.data).find(key => 
            key !== 'pagination' && Array.isArray(response.data[key])
          );
          
          // If no key found, try the possible keys
          if (!entityKey) {
            entityKey = possibleKeys.find(key => 
              response.data[key] && Array.isArray(response.data[key])
            );
          }
          
          if (entityKey && response.data[entityKey]) {
            return {
              data: response.data[entityKey],
              pagination: response.data.pagination || {
                current_page: page,
                per_page: limit,
                total: response.data[entityKey].length,
                total_pages: Math.ceil(response.data[entityKey].length / limit)
              }
            };
          }
        }
        
        // Fallback
        const data = Array.isArray(response) ? response : [];
        return {
          data: data,
          pagination: {
            current_page: page,
            per_page: limit,
            total: data.length,
            total_pages: Math.ceil(data.length / limit)
          }
        };
      }
    } catch (error) {
      console.error(`BaseEntity.findPaginated() error for ${this.endpoint}:`, error.message);
      return {
        data: [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: 0,
          total_pages: 0
        }
      };
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
  async login(email, password, rememberMe = false, role = 'store_owner', store_id = null) {

    // Use customer-specific endpoint for customer login
    const endpoint = role === 'customer' ? 'auth/customer/login' : 'auth/login';

    // Build request payload - include store_id for customer login
    const payload = { email, password, rememberMe, role };
    if (role === 'customer' && store_id) {
      payload.store_id = store_id;
    }

    const response = await apiClient.post(endpoint, payload);

    let token = null;
    if (response.data && response.data.token) {
      token = response.data.token;
      apiClient.setToken(token);
    } else if (response.token) {
      token = response.token;
      apiClient.setToken(token);
    } else {
      console.error('❌ AuthService.login: No token found in response!');
    }

    const result = response.data || response;

    // CRITICAL FIX: Store user data if we have both token and user info
    // For customers, also store the current store slug to bind session to store
    const currentStoreSlug = role === 'customer' ? this.getCurrentStoreSlug() : null;

    if (token && result.user) {
      setRoleBasedAuthData(result.user, token, currentStoreSlug);
    } else if (token && result.id) {
      // Handle case where user data is at root level
      setRoleBasedAuthData(result, token, currentStoreSlug);
    } else if (token) {
      // If we have token but no user data, fetch it immediately
      try {
        const userResponse = await apiClient.get('auth/me');
        const userData = userResponse.data || userResponse;
        if (userData && userData.id) {
          setRoleBasedAuthData(userData, token, currentStoreSlug);
          // Update result to include user data
          result.user = userData;
        } else {
          console.error('❌ AuthService.login: Fetched user data invalid');
        }
      } catch (fetchError) {
        console.error('❌ Failed to fetch user data after login:', fetchError.message);
      }
    } else {
      console.error('❌ AuthService.login: No token, cannot store user data');
    }

    // Notify components that user data is ready
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('userDataReady', {
        detail: { timestamp: Date.now() }
      }));
    }, 100);

    return result;
  }

  // Get current store slug from URL (for customer sessions)
  getCurrentStoreSlug() {
    try {
      const pathname = window.location.pathname;
      // Extract store slug from URL pattern: /public/{storeSlug}/...
      const match = pathname.match(/^\/public\/([^\/]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting store slug:', error);
      return null;
    }
  }

  googleLogin() {
    window.location.href = `${apiClient.baseURL}/api/auth/google`;
  }

  async register(userData) {
    // Use customer-specific endpoint for customer registration
    const endpoint = userData.role === 'customer' ? 'auth/customer/register' : 'auth/register';
    const response = await apiClient.post(endpoint, userData);
    
    let token = null;
    if (response.data && response.data.token) {
      token = response.data.token;
      apiClient.setToken(token);
    } else if (response.token) {
      token = response.token;
      apiClient.setToken(token);
    }
    
    // Return the full response to maintain compatibility
    const result = response.data || response;

    // CRITICAL FIX: Store user data if we have both token and user info
    // For customers, also store the current store slug to bind session to store
    const currentStoreSlug = userData.role === 'customer' ? this.getCurrentStoreSlug() : null;

    if (token && result.user) {
      setRoleBasedAuthData(result.user, token, currentStoreSlug);
    } else if (token && result.id) {
      // Handle case where user data is at root level
      setRoleBasedAuthData(result, token, currentStoreSlug);
    }

    return result;
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

  // Get current user (alias for auth/me) - fetches user based on current token
  async me() {
    try {
      const response = await apiClient.get('auth/me');
      const data = response.data || response;
      // Handle case where data is returned as an array
      const user = Array.isArray(data) ? data[0] : data;
      
      // Ensure we return null if no valid user data
      if (!user || !user.id) {
        return null;
      }
      
      return user;
    } catch (error) {
      // Clear invalid token if authentication fails
      if (error.status === 401 || error.status === 403) {
        apiClient.setToken(null);
      }
      return null;
    }
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

  // Get user's stores for dropdown/selection (authenticated) - only Editor+ permissions
  async getUserStores() {
    try {
      const response = await apiClient.get('stores/dropdown');
      // Handle both direct array response and {success: true, data: []} format
      const stores = response?.data || response;
      const result = Array.isArray(stores) ? stores : [];
      return result;
    } catch (error) {
      console.error(`❌ StoreService.getUserStores() error:`, error.message);
      return [];
    }
  }

  // Public store access (no authentication required)
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `stores?${queryString}` : 'stores';

      const response = await apiClient.publicRequest('GET', url);
      
      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      
      return result;
    } catch (error) {
      console.error(`❌ StoreService.filter() error:`, error.message);
      console.error('Error details:', error);
      return [];
    }
  }

  // Get stores - uses dropdown endpoint for authenticated users (Editor+ only), public endpoint for others
  async findAll(params = {}) {
    try {
      const hasToken = apiClient.getToken();

      if (hasToken) {
        // Check user role from token
        try {
          const token = apiClient.getToken();
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userRole = payload.role;

          // Only admin/store_owner should use dropdown endpoint
          if (userRole === 'admin' || userRole === 'store_owner') {
            return this.getUserStores();
          }
          // Customers fall through to public endpoint
        } catch (roleCheckError) {
          console.error('Error checking user role:', roleCheckError);
          // Fall through to public endpoint on error
        }
      }

      // Public users and customers get all active stores
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

  // Update store settings specifically
  async updateSettings(id, settingsData) {
    try {
      // Use the specific settings endpoint
      const response = await apiClient.put(`stores/${id}/settings`, settingsData);
      return response;
    } catch (error) {
      console.error(`StoreService.updateSettings() error:`, error.message);
      throw error;
    }
  }
}

// Product service with additional methods
class ProductService extends BaseEntity {
  constructor() {
    super('products');
  }

  // Override findById to always use authenticated API for admin operations
  async findById(id) {
    try {
      // Always use authenticated API for product details
      const response = await apiClient.get(`${this.endpoint}/${id}`);
      return response?.data || response;
    } catch (error) {
      console.error(`ProductService.findById() error:`, error.message);
      return null;
    }
  }

  // Override findPaginated to handle both authenticated and public access
  async findPaginated(page = 1, limit = 10, filters = {}) {
    try {
      const params = {
        page: page,
        limit: limit,
        ...filters
      };
      
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.endpoint}?${queryString}`;

      // Check if we have a token
      const token = apiClient.getToken();
      let response;
      
      if (token) {
        // Use authenticated endpoint if token is available
        response = await apiClient.get(url);
      } else {
        // Fall back to public endpoint if no token with proper query params
        const publicUrl = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
        response = await apiClient.publicRequest('GET', publicUrl, null);
      }

      // Check if response has pagination structure
      if (response && response.success && response.data) {
        // Handle different entity key formats (products, etc.)
        const entityKey = Object.keys(response.data).find(key => 
          key !== 'pagination' && Array.isArray(response.data[key])
        ) || 'products';
        
        if (entityKey && response.data[entityKey]) {
          return {
            data: response.data[entityKey],
            pagination: response.data.pagination || {
              current_page: page,
              per_page: limit,
              total: response.data[entityKey].length,
              total_pages: Math.ceil(response.data[entityKey].length / limit)
            }
          };
        }
        
        // If data structure is different, try to extract products directly
        if (response.data.products !== undefined) {
          return {
            data: response.data.products || [],
            pagination: response.data.pagination || {
              current_page: page,
              per_page: limit,
              total: 0,
              total_pages: 0
            }
          };
        }
      }
      
      // Handle array response (typically from public API)
      const data = Array.isArray(response) ? response : [];
      return {
        data: data,
        pagination: {
          current_page: page,
          per_page: limit,
          total: data.length,
          total_pages: Math.ceil(data.length / limit)
        }
      };
    } catch (error) {
      console.error(`ProductService.findPaginated() error:`, error.message);
      
      // Try public API as fallback if authenticated fails
      if (error.status === 401) {
        try {
          const params = {
            page: page,
            limit: limit,
            ...filters
          };
          const queryString = new URLSearchParams(params).toString();
          const publicUrl = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;
          const response = await apiClient.publicRequest('GET', publicUrl, null);
          const data = Array.isArray(response) ? response : [];
          return {
            data: data,
            pagination: {
              current_page: page,
              per_page: limit,
              total: data.length,
              total_pages: Math.ceil(data.length / limit)
            }
          };
        } catch (publicError) {
          console.error(`ProductService.findPaginated() public fallback error:`, publicError.message);
        }
      }
      
      return {
        data: [],
        pagination: {
          current_page: page,
          per_page: limit,
          total: 0,
          total_pages: 0
        }
      };
    }
  }

  // Public product access (no authentication required)
  async filter(params = {}) {
    try {
      
      // Safely serialize params, converting objects to strings
      const sanitizedParams = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            // Handle objects by stringifying them or using specific ID
            sanitizedParams[key] = value.id || JSON.stringify(value);
          } else {
            sanitizedParams[key] = value;
          }
        }
      }
      
      const queryString = new URLSearchParams(sanitizedParams).toString();
      const url = queryString ? `products?${queryString}` : 'products';
      
      // Use public request for product filtering (no authentication required)
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

  // Admin category access (authentication required)
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `categories?${queryString}` : 'categories';

      // Use authenticated request for admin API, not public API
      const response = await apiClient.get(url);

      // Handle paginated admin response: {success: true, data: {categories: [...], pagination: {...}}}
      if (response && response.success && response.data) {
        if (Array.isArray(response.data.categories)) {
          return response.data.categories;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      // Handle direct array response
      const result = Array.isArray(response) ? response : [];
      return result;
    } catch (error) {
      console.error(`CategoryService.filter() error:`, error.message);
      return [];
    }
  }

  // Smart findAll - uses authenticated API for admin, public API for storefront
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `categories?${queryString}` : 'categories';

      // Check if user is authenticated (admin or store owner)
      const hasToken = apiClient.getToken();
      let response;

      if (hasToken) {
        try {
          // Try authenticated API first for admin users
          console.log('CategoryService.findAll() - Using authenticated API:', url);
          response = await apiClient.get(url);
          console.log('CategoryService.findAll() - Response structure:', {
            hasSuccess: !!response?.success,
            hasData: !!response?.data,
            hasCategories: !!response?.data?.categories,
            categoriesLength: response?.data?.categories?.length,
            isArray: Array.isArray(response)
          });

          // Handle paginated admin response: {success: true, data: {categories: [...], pagination: {...}}}
          if (response && response.success && response.data) {
            if (Array.isArray(response.data.categories)) {
              console.log(`CategoryService.findAll() - Returning ${response.data.categories.length} categories from admin API`);
              return response.data.categories;
            } else if (Array.isArray(response.data)) {
              console.log(`CategoryService.findAll() - Returning ${response.data.length} categories (data is array)`);
              return response.data;
            }
          }

          // Handle direct array response
          const result = Array.isArray(response) ? response : [];
          console.log(`CategoryService.findAll() - Returning ${result.length} categories (direct array)`);
          return result;
        } catch (authError) {
          // If authenticated request fails (e.g., 401), fall back to public API
          if (authError.status === 401 || authError.status === 403) {
            console.warn('CategoryService: Authenticated request failed, falling back to public API');
            response = await apiClient.publicRequest('GET', url);
          } else {
            throw authError;
          }
        }
      } else {
        // No token, use public API
        console.log('CategoryService.findAll() - Using public API (no token):', url);
        response = await apiClient.publicRequest('GET', url);
      }

      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];
      console.log(`CategoryService.findAll() - Returning ${result.length} categories from public API`);
      return result;
    } catch (error) {
      console.error(`CategoryService.findAll() error:`, error.message, error);
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

  // Override filter to ensure proper order items loading
  async filter(params = {}) {
    try {
      const result = await this.findAll(params);
      
      // Double-check that result is an array and log first order structure
      const finalResult = Array.isArray(result) ? result : [];
      return finalResult;
    } catch (error) {
      console.error(`OrderService.filter() error:`, error.message);
      return [];
    }
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

// CmsPage service - ADMIN ONLY (use StorefrontCmsPage for public/storefront)
class CmsPageService extends BaseEntity {
  constructor() {
    super('cms-pages');
  }

  // Admin filter - uses authenticated API only
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `cms-pages?${queryString}` : 'cms-pages';

      console.log('🔍 CmsPageService.filter() - Fetching CMS pages (admin) with params:', params);

      const response = await apiClient.get(url);
      console.log('CmsPageService.filter() - Response structure:', {
        hasSuccess: !!response?.success,
        hasData: !!response?.data,
        hasPages: !!response?.data?.pages,
        pagesLength: response?.data?.pages?.length
      });

      // Handle paginated admin response: {success: true, data: {pages: [...], pagination: {...}}}
      if (response && response.success && response.data) {
        if (Array.isArray(response.data.pages)) {
          console.log(`CmsPageService.filter() - Returning ${response.data.pages.length} pages from admin API`);
          return response.data.pages;
        } else if (Array.isArray(response.data)) {
          console.log(`CmsPageService.filter() - Returning ${response.data.length} pages`);
          return response.data;
        }
      }

      // Handle direct array response
      const result = Array.isArray(response) ? response : [];
      console.log(`CmsPageService.filter() - Returning ${result.length} pages`);
      return result;
    } catch (error) {
      console.error(`❌ CmsPageService.filter() error:`, error.message);
      return [];
    }
  }

  // Admin findAll - uses authenticated API only
  async findAll(params = {}) {
    return this.filter(params);
  }
}

// CmsBlock service - ADMIN ONLY (use StorefrontCmsBlock for public/storefront)
class CmsBlockService extends BaseEntity {
  constructor() {
    super('cms-blocks');
  }

  // Admin filter - uses authenticated API only
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `cms-blocks?${queryString}` : 'cms-blocks';

      console.log('🔍 CmsBlockService.filter() - Fetching CMS blocks (admin) with params:', params);

      const response = await apiClient.get(url);
      console.log('CmsBlockService.filter() - Response structure:', {
        hasSuccess: !!response?.success,
        hasData: !!response?.data,
        hasBlocks: !!response?.data?.blocks,
        blocksLength: response?.data?.blocks?.length
      });

      // Handle paginated admin response: {success: true, data: {blocks: [...], pagination: {...}}}
      if (response && response.success && response.data) {
        if (Array.isArray(response.data.blocks)) {
          console.log(`CmsBlockService.filter() - Returning ${response.data.blocks.length} blocks from admin API`);
          return response.data.blocks;
        } else if (Array.isArray(response.data)) {
          console.log(`CmsBlockService.filter() - Returning ${response.data.length} blocks`);
          return response.data;
        }
      }

      // Handle direct array response
      const result = Array.isArray(response) ? response : [];
      console.log(`CmsBlockService.filter() - Returning ${result.length} blocks`);
      return result;
    } catch (error) {
      console.error(`❌ CmsBlockService.filter() error:`, error.message);
      return [];
    }
  }

  // Admin findAll - uses authenticated API only
  async findAll(params = {}) {
    return this.filter(params);
  }
}

export const CmsPage = new CmsPageService();
export const CmsBlock = new CmsBlockService();
export const Tax = new BaseEntity('tax');
export const ShippingMethod = new BaseEntity('shipping');
export const ShippingMethodType = new BaseEntity('shipping-types');
export const DeliverySettings = new BaseEntity('delivery');

// Additional entities (you can implement these as needed)
export const Cart = new BaseEntity('cart');
export const ProductLabel = new BaseEntity('product-labels');
// Admin ProductTab entity - forces authenticated API usage for admin operations
class AdminProductTabEntity extends BaseEntity {
  constructor() {
    super('product-tabs');
  }

  // Override to force authenticated API usage for admin operations
  async findAll(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

      // Always use authenticated API for admin operations
      const response = await apiClient.get(url);

      if (response && response.data) {
        // Backend returns {success: true, data: [...]}
        const result = Array.isArray(response.data) ? response.data : [];
        return result;
      } else {
        // Direct array response
        const result = Array.isArray(response) ? response : [];
        return result;
      }
    } catch (error) {
      console.error(`AdminProductTab.findAll() error:`, error.message);
      return [];
    }
  }

  async filter(params = {}) {
    return this.findAll(params);
  }
}

export const ProductTab = new AdminProductTabEntity();
export const TaxType = new BaseEntity('tax-types');
export const Service = new BaseEntity('services');

// CustomOptionRule entity that uses public API for storefront access
class CustomOptionRuleEntity extends BaseEntity {
  constructor() {
    super('custom-option-rules');
  }

  // Override filter to use public API for storefront access
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `custom-option-rules?${queryString}` : 'custom-option-rules';

      // Use public request for custom option rule filtering (no authentication required for storefront)
      const response = await apiClient.publicRequest('GET', url);

      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];

      return result;
    } catch (error) {
      console.error(`CustomOptionRuleEntity.filter() error:`, error.message);
      return [];
    }
  }

  // Override findAll to use public API
  async findAll(params = {}) {
    return this.filter(params);
  }
}

export const CustomOptionRule = new CustomOptionRuleEntity();
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

// Team Management Service
class StoreTeamService extends BaseEntity {
  constructor() {
    super('store-teams');
  }

  // Get team members for a store
  async getTeamMembers(storeId) {
    try {
      const response = await apiClient.get(`${this.endpoint}/${storeId}`);
      return response?.data || response || [];
    } catch (error) {
      console.error(`StoreTeamService.getTeamMembers() error:`, error.message);
      return [];
    }
  }

  // Invite a team member
  async inviteMember(storeId, inviteData) {
    try {
      const response = await apiClient.post(`${this.endpoint}/${storeId}/invite`, inviteData);
      return response;
    } catch (error) {
      console.error(`StoreTeamService.inviteMember() error:`, error.message);
      throw error;
    }
  }

  // Update team member
  async updateMember(storeId, memberId, updateData) {
    try {
      const response = await apiClient.put(`${this.endpoint}/${storeId}/members/${memberId}`, updateData);
      return response;
    } catch (error) {
      console.error(`StoreTeamService.updateMember() error:`, error.message);
      throw error;
    }
  }

  // Remove team member
  async removeMember(storeId, memberId) {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${storeId}/members/${memberId}`);
      return response;
    } catch (error) {
      console.error(`StoreTeamService.removeMember() error:`, error.message);
      throw error;
    }
  }
}

export const StoreTeam = new StoreTeamService();
export const Language = new BaseEntity('languages');
export const SeoTemplate = new BaseEntity('seo-templates');
export const SeoSetting = new BaseEntity('seo-settings');
export const CreditTransaction = new BaseEntity('credit-transactions');
export const CookieConsentSettings = new BaseEntity('cookie-consent-settings');
export const ConsentLog = new BaseEntity('consent-logs');
export const PriceAlertSubscription = new BaseEntity('price-alert-subscriptions');
export const StockAlertSubscription = new BaseEntity('stock-alert-subscriptions');

// PaymentMethod service with public API support for storefront
class PaymentMethodService extends BaseEntity {
  constructor() {
    super('payment-methods');
  }

  // Override filter to use public API for storefront access with language support
  async filter(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `payment-methods?${queryString}` : 'payment-methods';

      console.log('🔍 PaymentMethodService.filter() - Fetching payment methods with params:', params);

      // Use public request for payment method filtering (no authentication required for storefront)
      // This will automatically send X-Language header from localStorage
      const response = await apiClient.publicRequest('GET', url);

      console.log('📥 PaymentMethodService.filter() - Received payment methods:', response?.length || 0);
      if (response && response.length > 0) {
        console.log('📝 PaymentMethodService.filter() - First payment method:', {
          code: response[0].code,
          name: response[0].name,
          has_name: !!response[0].name,
          name_value: response[0].name,
          name_type: typeof response[0].name
        });
      }

      // Ensure response is always an array
      const result = Array.isArray(response) ? response : [];

      return result;
    } catch (error) {
      console.error(`❌ PaymentMethodService.filter() error:`, error.message);
      return [];
    }
  }

  // Override findAll to use public API
  async findAll(params = {}) {
    return this.filter(params);
  }
}

export const PaymentMethod = new PaymentMethodService();
export const Customer = new BaseEntity('customers');
export const CustomerActivity = new BaseEntity('customer-activity');
export const Redirect = new BaseEntity('redirects');
export const MediaAsset = new BaseEntity('media-assets');
export const SlotConfiguration = new BaseEntity('slot-configurations');

// For backward compatibility, export common methods
export const getCurrentUser = () => User.me();
export const login = (email, password) => Auth.login(email, password);
export const logout = () => Auth.logout();
export const register = (userData) => Auth.register(userData);

// Export API client for advanced usage
export { apiClient };

// Health check
export const healthCheck = () => apiClient.healthCheck();