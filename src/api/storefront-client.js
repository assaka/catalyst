// Storefront API Client - Public by default, optional customer authentication
class StorefrontApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    this.customerToken = localStorage.getItem('customer_auth_token');
    
    // Storefront client is public by default
    this.isPublic = true;
    
    // Initialize or get guest session ID
    this.sessionId = this.getOrCreateSessionId();
    
    console.log('🔧 StorefrontApiClient initialized:', {
      hasCustomerToken: !!this.customerToken,
      customerTokenPreview: this.customerToken ? this.customerToken.substring(0, 20) + '...' : null,
      sessionId: this.sessionId,
      baseURL: this.baseURL
    });
  }

  // Get or create a guest session ID
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
      // Generate a new session ID
      sessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('guest_session_id', sessionId);
      console.log('🆕 Generated new guest session ID:', sessionId);
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
    
    // Always add session_id for guest/session-based functionality
    const separator = endpoint.includes('?') ? '&' : '?';
    finalEndpoint = `${endpoint}${separator}session_id=${this.sessionId}`;
    
    // If we have a token, we'll send both (backend will prioritize token over session_id)
    console.log(`🔍 Session ID added to endpoint: ${finalEndpoint}`);
    
    const url = this.buildAuthUrl(finalEndpoint);
    const headers = this.getCustomerHeaders(customHeaders);

    console.log(`👤 Storefront Customer Request: ${method} ${url}`, {
      hasToken: !!token,
      sessionId: this.sessionId,
      finalEndpoint: finalEndpoint,
      originalEndpoint: endpoint
    });

    const config = {
      method,
      headers,
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      // Always add session_id to the body data for guest support
      if (this.sessionId) {
        data = { ...data, session_id: this.sessionId };
        console.log(`🔍 Session ID added to request body:`, { session_id: this.sessionId });
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

      // Add debugging for wishlist requests
      if (finalEndpoint.includes('wishlist')) {
        console.log(`📋 Wishlist API Response for ${method} ${finalEndpoint}:`, result);
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
    console.log('🚪 Customer logout initiated');
    
    try {
      if (this.getCustomerToken()) {
        console.log('🔐 Calling logout API with token');
        await this.postCustomer('auth/logout');
      }
    } catch (error) {
      console.error('Customer logout failed:', error.message);
    }
    
    // Clear all customer-related data
    console.log('🧹 Clearing customer authentication data');
    this.setCustomerToken(null);
    localStorage.removeItem('customer_user_data');
    localStorage.removeItem('cart_session_id');
    localStorage.removeItem('user_logged_out'); // Clear this flag too
    
    // Reset customer token reference
    this.customerToken = null;
    
    console.log('✅ Customer logout completed');
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