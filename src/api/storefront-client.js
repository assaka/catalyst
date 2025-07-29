// Storefront API Client - Public by default, optional customer authentication
class StorefrontApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    this.customerToken = localStorage.getItem('customer_auth_token');
    
    // Storefront client is public by default
    this.isPublic = true;
    
    // Initialize or get guest session ID
    this.sessionId = this.getOrCreateSessionId();
    
  }

  // Get or create a guest session ID
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
      // Generate a new session ID
      sessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('guest_session_id', sessionId);
    }
    return sessionId;
  }

  // Set customer auth token
  setCustomerToken(token) {
    this.customerToken = token;
    if (token) {
      localStorage.setItem('customer_auth_token', token);
    } else {
      localStorage.removeItem('customer_auth_token');
    }
  }

  // Get customer auth token
  getCustomerToken() {
    return this.customerToken || localStorage.getItem('customer_auth_token');
  }

  // Build public URL
  buildPublicUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/api/public/${cleanEndpoint}`;
  }

  // Build authenticated URL
  buildAuthUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/api/${cleanEndpoint}`;
  }

  // Public headers (no auth required)
  getPublicHeaders(customHeaders = {}) {
    return {
      'Content-Type': 'application/json',
      ...customHeaders
    };
  }

  // Customer headers (with optional auth)
  getCustomerHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    const token = this.getCustomerToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Public request method (no authentication required)
  async publicRequest(method, endpoint, data = null, customHeaders = {}) {
    const url = this.buildPublicUrl(endpoint);
    const headers = this.getPublicHeaders(customHeaders);

    console.log(`🌐 Storefront Public Request: ${method} ${url}`);
    console.log(`🔍 Original endpoint: ${endpoint}`);

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

      // Public endpoints return arrays directly
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error(`Storefront public API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  // Customer request method (optional authentication)
  async customerRequest(method, endpoint, data = null, customHeaders = {}) {
    // Add session_id to the request if not authenticated or if token is invalid
    const token = this.getCustomerToken();
    let finalEndpoint = endpoint;
    
    // Always ensure we have a session ID for guest functionality
    this.sessionId = this.getOrCreateSessionId();
    
    // If no token or we need guest session support, add session_id
    if (!token || this.sessionId) {
      // For non-authenticated or guest requests, add session_id as a query parameter
      const separator = endpoint.includes('?') ? '&' : '?';
      finalEndpoint = `${endpoint}${separator}session_id=${this.sessionId}`;
    }
    
    const url = this.buildAuthUrl(finalEndpoint);
    const headers = this.getCustomerHeaders(customHeaders);

    console.log(`👤 Storefront Customer Request: ${method} ${url}`);

    const config = {
      method,
      headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      // Also add session_id to the body data if not authenticated or for guest support
      if ((!token || this.sessionId) && this.sessionId) {
        data = { ...data, session_id: this.sessionId };
      }
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
        if (response.status === 401) {
          // Clear invalid customer token
          this.setCustomerToken(null);
          throw new Error('Customer session expired. Please log in again.');
        }
        
        const error = new Error(result.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = result;
        throw error;
      }

      return result;
    } catch (error) {
      console.error(`Storefront customer API request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  // Public HTTP methods
  async getPublic(endpoint, customHeaders = {}) {
    return this.publicRequest('GET', endpoint, null, customHeaders);
  }

  async postPublic(endpoint, data, customHeaders = {}) {
    return this.publicRequest('POST', endpoint, data, customHeaders);
  }

  // Customer HTTP methods
  async getCustomer(endpoint, customHeaders = {}) {
    return this.customerRequest('GET', endpoint, null, customHeaders);
  }

  async postCustomer(endpoint, data, customHeaders = {}) {
    return this.customerRequest('POST', endpoint, data, customHeaders);
  }

  async putCustomer(endpoint, data, customHeaders = {}) {
    return this.customerRequest('PUT', endpoint, data, customHeaders);
  }

  async patchCustomer(endpoint, data, customHeaders = {}) {
    return this.customerRequest('PATCH', endpoint, data, customHeaders);
  }

  async deleteCustomer(endpoint, customHeaders = {}) {
    return this.customerRequest('DELETE', endpoint, null, customHeaders);
  }

  // Customer logout
  async customerLogout() {
    try {
      if (this.getCustomerToken()) {
        await this.postCustomer('auth/logout');
      }
    } catch (error) {
      console.error('Customer logout failed:', error.message);
    }
    
    this.setCustomerToken(null);
    localStorage.removeItem('customer_user_data');
    localStorage.removeItem('cart_session_id');
    
    return { success: true };
  }

  // Check if customer is authenticated
  isCustomerAuthenticated() {
    return !!this.getCustomerToken();
  }
}

// Create singleton instance
const storefrontApiClient = new StorefrontApiClient();

export default storefrontApiClient;