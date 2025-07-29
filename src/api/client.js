// API Client for backend communication
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    this.apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
    
    // Check if user was explicitly logged out (persists across page reloads)
    const logoutFlag = localStorage.getItem('user_logged_out');
    
    this.isLoggedOut = logoutFlag === 'true';
    this.token = null; // Will be set dynamically based on current context
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.removeItem('user_logged_out'); // Clear logout flag when setting new token
      this.isLoggedOut = false; // Reset logout state when setting new token
    } else {
      localStorage.setItem('user_logged_out', 'true'); // Persist logout state across page reloads
      // Ensure in-memory token is also cleared
      this.token = null;
      this.isLoggedOut = true; // Mark as logged out when clearing token
    }
  }

  // Get auth token - automatically determine which role-specific token to use
  getToken() {
    // Always check the logout flag in localStorage as well
    if (this.isLoggedOut || localStorage.getItem('user_logged_out') === 'true') {
      return null;
    }
    
    // If token was explicitly set (e.g., by role switching), use it
    if (this.token) {
      return this.token;
    }
    
    // Auto-determine token based on current context - prioritize store owner for admin pages
    const currentPath = window.location.pathname.toLowerCase();
    
    // Admin context: /admin/* routes
    const isAdminContext = currentPath.startsWith('/admin/') ||
                          currentPath.includes('/dashboard') || 
                          currentPath.includes('/products') || 
                          currentPath.includes('/categories') || 
                          currentPath.includes('/settings') ||
                          currentPath.includes('/auth');
    
    // Customer context: /public/* routes and legacy customer routes
    const isCustomerContext = currentPath.startsWith('/public/') ||
                             currentPath.includes('/storefront') || 
                             currentPath.includes('/cart') || 
                             currentPath.includes('/checkout') ||
                             currentPath.includes('/customerdashboard');
    
    // Check role-specific tokens
    const storeOwnerToken = localStorage.getItem('store_owner_auth_token');
    const customerToken = localStorage.getItem('customer_auth_token');
    
    if (isAdminContext && storeOwnerToken) {
      return storeOwnerToken;
    } else if (isCustomerContext && customerToken) {
      return customerToken;
    } else if (storeOwnerToken) {
      // Default to store owner token if available (admin priority)
      return storeOwnerToken;
    } else if (customerToken) {
      // Fallback to customer token
      return customerToken;
    }
    
    return null;
  }

  // Build full URL
  buildUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/api/${cleanEndpoint}`;
  }

  // Default headers
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Public request method (no authentication required)
  async publicRequest(method, endpoint, data = null, customHeaders = {}) {
    // For public endpoints, use /api/public/ prefix
    const publicEndpoint = endpoint.startsWith('public/') ? endpoint : `public/${endpoint}`;
    const url = this.buildUrl(publicEndpoint);
    
    console.log('🔄 PublicRequest:', method, url);
    
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const config = {
      method,
      headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected response type: ${contentType}`);
      }

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = result;
        throw error;
      }

      // Handle wrapped API responses
      if (result && typeof result === 'object' && result.success && result.data) {
        if (Array.isArray(result.data)) {
          return result.data;
        }
        
        if (result.data && typeof result.data === 'object' && result.data.id) {
          return [result.data];
        }
        
        const dataEntries = Object.entries(result.data);
        for (const [key, value] of dataEntries) {
          if (Array.isArray(value) && key !== 'gdpr_countries') {
            return value;
          }
        }
        
        return [result.data];
      }
      
      return result;
    } catch (error) {
      console.error(`Public API request failed: ${method} ${url}`, error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      
      throw error;
    }
  }

  // Generic request method
  async request(method, endpoint, data = null, customHeaders = {}) {
    // Check for different route types
    const publicRoutes = ['stores', 'products', 'categories', 'shipping', 'tax', 'delivery', 'attributes', 'coupons', 'product-labels', 'attribute-sets', 'seo-templates', 'seo-settings', 'cookie-consent-settings'];
    const isPublicRoute = publicRoutes.some(route => endpoint.startsWith(route));
    const isAuthRoute = endpoint.startsWith('auth/');
    
    // For public routes, use public endpoint when user has no valid token
    const hasValidToken = this.getToken();
    
    if (!hasValidToken && isPublicRoute) {
      console.log(`🔄 Using public endpoint for ${endpoint} (hasToken: ${!!hasValidToken})`);
      return this.publicRequest(method, endpoint, data, customHeaders);
    }
    
    // Prevent authenticated requests if user has been logged out, except for auth routes
    if (!isAuthRoute && (this.isLoggedOut || localStorage.getItem('user_logged_out') === 'true')) {
      throw new Error('Session has been terminated. Please log in again.');
    }
    
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders(customHeaders);

    const config = {
      method,
      headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }


    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected response type: ${contentType}`);
      }

      const result = await response.json();


      if (!response.ok) {
        // Handle API errors
        const error = new Error(result.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = result;
        throw error;
      }

      // Handle wrapped API responses - extract the actual data array
      if (result && typeof result === 'object' && result.success && result.data) {
        // If data is already an array, return it directly (for list responses)
        if (Array.isArray(result.data)) {
          return result.data;
        }
        
        // If data is an object with an 'id' field, it's a single record - wrap in array
        if (result.data && typeof result.data === 'object' && result.data.id) {
          return [result.data];
        }
        
        // Handle paginated responses with arrays in data properties (only for list endpoints)
        const dataEntries = Object.entries(result.data);
        for (const [key, value] of dataEntries) {
          if (Array.isArray(value) && key !== 'gdpr_countries') {
            return value;
          }
        }
        
        // Default: return the data object wrapped in array
        return [result.data];
      }
      
      return result;
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, customHeaders = {}) {
    return this.request('GET', endpoint, null, customHeaders);
  }

  async post(endpoint, data, customHeaders = {}) {
    return this.request('POST', endpoint, data, customHeaders);
  }

  async put(endpoint, data, customHeaders = {}) {
    return this.request('PUT', endpoint, data, customHeaders);
  }

  async patch(endpoint, data, customHeaders = {}) {
    return this.request('PATCH', endpoint, data, customHeaders);
  }

  async delete(endpoint, customHeaders = {}) {
    return this.request('DELETE', endpoint, null, customHeaders);
  }

  // File upload
  async uploadFile(endpoint, file, additionalData = {}) {
    const url = this.buildUrl(endpoint);
    const token = this.getToken();

    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data to form
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = result;
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`File upload failed: ${url}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Clear token (for role switching)
  clearToken() {
    this.token = null;
  }

  // Manual logout for testing
  manualLogout() {
    // Clear role-specific tokens
    localStorage.removeItem('customer_auth_token');
    localStorage.removeItem('customer_user_data');
    localStorage.removeItem('store_owner_auth_token');
    localStorage.removeItem('store_owner_user_data');
    localStorage.setItem('user_logged_out', 'true');
    localStorage.removeItem('selectedStoreId');
    this.token = null;
    this.isLoggedOut = true;
  }

  // Manual role assignment for testing
  async setUserRole(role = 'store_owner', accountType = 'agency') {
    try {
      const response = await this.patch('auth/me', {
        role: role,
        account_type: accountType
      });
      return response;
    } catch (error) {
      console.error('Failed to set role', error);
      throw error;
    }
  }

  // Fix existing user role immediately
  async fixUserRole() {
    try {
      const user = await this.get('auth/me');
      
      if (!user.role || user.role === 'customer') {
        const response = await this.patch('auth/me', {
          role: 'store_owner',
          account_type: 'agency'
        });
        return response;
      } else {
        return user;
      }
    } catch (error) {
      console.error('Failed to fix user role', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Make apiClient globally accessible for debugging
window.apiClient = apiClient;

export default apiClient;