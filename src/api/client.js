// API Client for backend communication
class ApiClient {
  constructor() {
    console.log('🚀 ApiClient constructor called');
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    this.apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
    
    // Check if user was explicitly logged out (persists across page reloads)
    const logoutFlag = localStorage.getItem('user_logged_out');
    const storedToken = localStorage.getItem('auth_token');
    
    console.log('🔍 ApiClient constructor state:', {
      logoutFlag,
      hasStoredToken: !!storedToken,
      storedTokenPrefix: storedToken ? storedToken.substring(0, 20) + '...' : 'none'
    });
    
    this.isLoggedOut = logoutFlag === 'true';
    this.token = storedToken;
    
    // If user was logged out, don't load token even if it exists
    if (this.isLoggedOut) {
      this.token = null;
      console.log('🔍 ApiClient: User was previously logged out, ignoring token');
    } else if (!this.token) {
      this.isLoggedOut = true;
      console.log('🔍 ApiClient: No token found, marking as logged out');
    } else {
      console.log('🔍 ApiClient: Token found and user not logged out, ready for authenticated requests');
    }
    
    console.log('🔍 ApiClient constructor final state:', {
      isLoggedOut: this.isLoggedOut,
      hasToken: !!this.token
    });
  }

  // Set auth token
  setToken(token) {
    console.log('🔧 setToken called with:', token ? 'new token' : 'null (logout)');
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.removeItem('user_logged_out'); // Clear logout flag when setting new token
      this.isLoggedOut = false; // Reset logout state when setting new token
      console.log('✅ Token set, user logged in');
    } else {
      console.log('🔄 CRITICAL: Removing auth_token from localStorage...');
      localStorage.removeItem('auth_token');
      console.log('🔄 CRITICAL: Setting user_logged_out=true in localStorage...');
      localStorage.setItem('user_logged_out', 'true'); // Persist logout state across page reloads
      console.log('🔄 CRITICAL: Verifying logout flag was set:', localStorage.getItem('user_logged_out'));
      // Ensure in-memory token is also cleared
      this.token = null;
      this.isLoggedOut = true; // Mark as logged out when clearing token
      console.log('❌ Token cleared, user logged out, logout flag set');
    }
    console.log('🔧 setToken final state:', {
      isLoggedOut: this.isLoggedOut,
      hasToken: !!this.token,
      logoutFlagInStorage: localStorage.getItem('user_logged_out')
    });
  }

  // Get auth token
  getToken() {
    console.log('🔍 getToken called, state:', {
      isLoggedOut: this.isLoggedOut,
      hasToken: !!this.token,
      logoutFlag: localStorage.getItem('user_logged_out')
    });
    
    // Always check the logout flag in localStorage as well
    if (this.isLoggedOut || localStorage.getItem('user_logged_out') === 'true') {
      console.log('❌ getToken: User is logged out (flag check), returning null');
      return null;
    }
    // If token was explicitly set to null, don't fall back to localStorage
    if (this.token === null) {
      console.log('❌ getToken: Token is null, returning null');
      return null;
    }
    
    const token = this.token || localStorage.getItem('auth_token');
    console.log('✅ getToken: Returning token:', token ? 'found' : 'not found');
    return token;
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

  // Generic request method
  async request(method, endpoint, data = null, customHeaders = {}) {
    console.log(`🌐 API request: ${method} ${endpoint}`);
    console.log('🔍 Request state check:', {
      isLoggedOut: this.isLoggedOut,
      hasToken: !!this.token,
      endpoint
    });
    
    // Prevent authenticated requests if user has been logged out
    if (this.isLoggedOut || localStorage.getItem('user_logged_out') === 'true') {
      console.log('❌ Request blocked: Session has been terminated');
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

    // Debug logging for authentication issues
    if (endpoint.includes('stores') || endpoint.includes('auth/me')) {
      console.log(`🔍 API Request Debug:`, {
        method,
        url,
        hasToken: !!this.getToken(),
        tokenPrefix: this.getToken() ? this.getToken().substring(0, 20) + '...' : 'none',
        headers: { ...headers, Authorization: headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : 'none' }
      });
    }

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected response type: ${contentType}`);
      }

      const result = await response.json();

      // Debug logging for authentication issues
      if (endpoint.includes('stores') || endpoint.includes('auth/me')) {
        console.log(`📥 API Response Debug:`, {
          status: response.status,
          ok: response.ok,
          hasData: !!result,
          dataType: Array.isArray(result) ? `array[${result.length}]` : typeof result,
          errorMessage: result?.message || 'none'
        });
      }

      if (!response.ok) {
        // Handle API errors
        const error = new Error(result.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = result;
        throw error;
      }

      console.log(`🔍 API Client Response Debug:`, {
        method,
        endpoint,
        url,
        resultType: typeof result,
        isArray: Array.isArray(result),
        resultLength: Array.isArray(result) ? result.length : 'N/A',
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : 'N/A',
        resultSample: result && typeof result === 'object' ? JSON.stringify(result).substring(0, 200) : result
      });
      
      // Handle wrapped API responses - extract the actual data array
      if (result && typeof result === 'object' && result.success && result.data) {
        console.log(`🔍 API Client unwrapping success response:`, {
          originalResult: result,
          dataKeys: Object.keys(result.data),
          extractedData: result.data
        });
        
        // Extract the array from common response patterns
        if (Array.isArray(result.data)) {
          return result.data;
        }
        
        // Handle paginated responses with arrays in data properties
        const dataEntries = Object.entries(result.data);
        for (const [key, value] of dataEntries) {
          if (Array.isArray(value)) {
            console.log(`🔍 API Client found array in data.${key}:`, value);
            return value;
          }
        }
        
        // If no array found, return the data object wrapped in array
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

  // Manual logout for testing
  manualLogout() {
    console.log('🔧 MANUAL LOGOUT: Forcing logout state');
    localStorage.removeItem('auth_token');
    localStorage.setItem('user_logged_out', 'true');
    localStorage.removeItem('user_data');
    localStorage.removeItem('selectedStoreId');
    this.token = null;
    this.isLoggedOut = true;
    console.log('🔧 MANUAL LOGOUT: Complete');
    console.log('🔍 Final state:', {
      isLoggedOut: this.isLoggedOut,
      hasToken: !!this.token,
      logoutFlag: localStorage.getItem('user_logged_out'),
      tokenInStorage: localStorage.getItem('auth_token')
    });
  }

  // Manual role assignment for testing
  async setUserRole(role = 'store_owner', accountType = 'agency') {
    console.log('🔧 MANUAL ROLE: Setting user role to', role);
    try {
      const response = await this.patch('auth/me', {
        role: role,
        account_type: accountType
      });
      console.log('✅ MANUAL ROLE: Role set successfully', response);
      return response;
    } catch (error) {
      console.error('❌ MANUAL ROLE: Failed to set role', error);
      throw error;
    }
  }

  // Fix existing user role immediately
  async fixUserRole() {
    console.log('🔧 FIXING USER ROLE: Checking current user...');
    try {
      const user = await this.get('auth/me');
      console.log('Current user:', user);
      
      if (!user.role || user.role === 'customer') {
        console.log('🔧 FIXING USER ROLE: Setting role to store_owner...');
        const response = await this.patch('auth/me', {
          role: 'store_owner',
          account_type: 'agency'
        });
        console.log('✅ FIXED USER ROLE: Role updated successfully', response);
        return response;
      } else {
        console.log('✅ User already has role:', user.role);
        return user;
      }
    } catch (error) {
      console.error('❌ FIXING USER ROLE: Failed', error);
      throw error;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Make apiClient globally accessible for debugging
window.apiClient = apiClient;

export default apiClient;