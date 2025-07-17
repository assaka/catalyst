// API Client for backend communication
class ApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    this.apiVersion = import.meta.env.VITE_API_VERSION || 'v1';
    this.token = localStorage.getItem('auth_token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get auth token
  getToken() {
    return this.token || localStorage.getItem('auth_token');
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
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;