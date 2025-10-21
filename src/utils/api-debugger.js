/**
 * Advanced API Debugging and Monitoring System
 * Automatically detects transformation issues, schema mismatches, and performance problems
 */

export class APIDebugger {
  constructor() {
    this.isEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_API_DEBUG === 'true';
    this.logs = [];
    this.maxLogs = 1000;
    this.schemas = new Map();
    this.transformationRules = new Map();
    this.performanceThresholds = {
      slow: 1000,    // 1 second
      critical: 3000 // 3 seconds
    };
    
    if (this.isEnabled) {
      this.setupGlobalErrorHandling();
      this.setupPerformanceMonitoring();
    }
  }

  // Register expected schemas for endpoints
  registerSchema(endpoint, schema, description = '') {
    this.schemas.set(endpoint, { schema, description, registeredAt: Date.now() });
    this.debug('Schema registered', { endpoint, schema, description });
  }

  // Register transformation rules
  registerTransformation(endpoint, rule, description = '') {
    this.transformationRules.set(endpoint, { rule, description, registeredAt: Date.now() });
    this.debug('Transformation rule registered', { endpoint, rule, description });
  }

  // Main debugging method - call before and after API requests
  debugAPICall(phase, data) {
    if (!this.isEnabled) return;

    const timestamp = Date.now();
    const logEntry = {
      id: this.generateId(),
      timestamp,
      phase,
      ...data
    };

    // Store log
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Real-time analysis
    this.analyzeAPICall(logEntry);

    return logEntry.id;
  }

  // Analyze API calls for issues
  analyzeAPICall(logEntry) {
    const { phase, endpoint, method, response, rawResponse, duration, error } = logEntry;

    if (phase === 'response') {
      // 1. Check response transformation issues
      this.checkTransformationIssues(endpoint, rawResponse, response);
      
      // 2. Validate against registered schemas
      this.validateSchema(endpoint, response);
      
      // 3. Performance analysis
      this.analyzePerformance(endpoint, method, duration);
      
      // 4. Check for common anti-patterns
      this.checkAntiPatterns(endpoint, response, rawResponse);
    }

    if (phase === 'error') {
      this.analyzeError(endpoint, method, error, logEntry);
    }
  }

  // Check if response transformation broke the data structure
  checkTransformationIssues(endpoint, rawResponse, transformedResponse) {
    if (!rawResponse || !transformedResponse) return;

    const rawKeys = this.getObjectKeys(rawResponse);
    const transformedKeys = this.getObjectKeys(transformedResponse);
    
    // Detect missing keys after transformation
    const missingKeys = rawKeys.filter(key => !transformedKeys.includes(key));
    const addedKeys = transformedKeys.filter(key => !rawKeys.includes(key));
    
    if (missingKeys.length > 0 || addedKeys.length > 0) {
      this.alert('TRANSFORMATION_MISMATCH', {
        endpoint,
        missingKeys,
        addedKeys,
        rawKeys,
        transformedKeys,
        rawSample: this.getSample(rawResponse),
        transformedSample: this.getSample(transformedResponse)
      });
    }

    // Check if transformation made critical data undefined
    const criticalFields = ['data', 'mappings', 'success', 'results'];
    criticalFields.forEach(field => {
      if (rawResponse[field] !== undefined && transformedResponse[field] === undefined) {
        this.alert('CRITICAL_DATA_LOST', {
          endpoint,
          field,
          rawValue: rawResponse[field],
          transformedValue: transformedResponse[field]
        });
      }
    });
  }

  // Validate response against registered schema
  validateSchema(endpoint, response) {
    const schemaEntry = this.schemas.get(endpoint);
    if (!schemaEntry) return;

    const { schema } = schemaEntry;
    const validation = this.validateObject(response, schema);
    
    if (!validation.valid) {
      this.alert('SCHEMA_VALIDATION_FAILED', {
        endpoint,
        expectedSchema: schema,
        actualResponse: this.getSample(response),
        errors: validation.errors
      });
    }
  }

  // Analyze API performance
  analyzePerformance(endpoint, method, duration) {
    if (duration > this.performanceThresholds.critical) {
      this.alert('CRITICAL_PERFORMANCE', {
        endpoint,
        method,
        duration,
        threshold: this.performanceThresholds.critical
      });
    } else if (duration > this.performanceThresholds.slow) {
      this.warn('Slow API call', { endpoint, method, duration });
    }
  }

  // Check for API anti-patterns
  checkAntiPatterns(endpoint, response, rawResponse) {
    // Anti-pattern: Large response bodies
    const responseSize = JSON.stringify(response || {}).length;
    if (responseSize > 100000) { // 100KB
      this.warn('Large response detected', { endpoint, sizeKB: Math.round(responseSize / 1024) });
    }

    // Anti-pattern: Nested success flags
    if (response?.data?.success !== undefined && response?.success !== undefined) {
      this.warn('Nested success flags detected', { endpoint });
    }

    // Anti-pattern: Inconsistent response structure
    if (response?.success && !response?.data && !response?.mappings && !response?.results) {
      this.warn('Success response without data payload', { endpoint });
    }
  }

  // Analyze errors
  analyzeError(endpoint, method, error, logEntry) {
    const errorInfo = {
      endpoint,
      method,
      message: error?.message || 'Unknown error',
      status: error?.status,
      stack: error?.stack,
      timestamp: logEntry.timestamp
    };

    // Common error patterns
    if (error?.message?.includes('fetch')) {
      this.alert('NETWORK_ERROR', { ...errorInfo, type: 'Network connectivity issue' });
    } else if (error?.status === 401) {
      this.alert('AUTH_ERROR', { ...errorInfo, type: 'Authentication failure' });
    } else if (error?.status >= 500) {
      this.alert('SERVER_ERROR', { ...errorInfo, type: 'Server-side error' });
    }
  }

  // Validate object against schema
  validateObject(obj, schema, path = '') {
    const errors = [];

    if (typeof schema === 'string') {
      // Simple type check
      if (typeof obj !== schema) {
        errors.push(`${path}: expected ${schema}, got ${typeof obj}`);
      }
    } else if (Array.isArray(schema)) {
      // Array validation
      if (!Array.isArray(obj)) {
        errors.push(`${path}: expected array, got ${typeof obj}`);
      }
    } else if (typeof schema === 'object') {
      // Object validation
      if (typeof obj !== 'object' || obj === null) {
        errors.push(`${path}: expected object, got ${typeof obj}`);
      } else {
        Object.entries(schema).forEach(([key, valueSchema]) => {
          const newPath = path ? `${path}.${key}` : key;
          if (obj[key] === undefined) {
            errors.push(`${newPath}: missing required field`);
          } else {
            const subValidation = this.validateObject(obj[key], valueSchema, newPath);
            errors.push(...subValidation.errors);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Alert system
  alert(type, data) {
    const alertData = {
      type,
      severity: 'HIGH',
      timestamp: Date.now(),
      ...data
    };

    // Store alert
    this.logs.push({
      id: this.generateId(),
      timestamp: Date.now(),
      phase: 'alert',
      alertType: type,
      ...alertData
    });

    // In development, show visual notification
    if (import.meta.env.DEV) {
      this.showVisualAlert(type, alertData);
    }
  }

  // Show visual alert in development
  showVisualAlert(type, data) {
    // Create visual notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.innerHTML = `
      <strong>🚨 ${type}</strong><br>
      <small>${data.endpoint || 'Unknown endpoint'}</small><br>
      <button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 4px 8px; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 4px; cursor: pointer;">Dismiss</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Setup global error handling
  setupGlobalErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('API') || event.reason?.status) {
        this.alert('UNHANDLED_API_ERROR', {
          error: event.reason.message,
          stack: event.reason.stack
        });
      }
    });
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Monitor fetch calls
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const start = performance.now();
      const url = args[0];
      const config = args[1] || {};
      
      return originalFetch(...args).then(response => {
        const duration = performance.now() - start;
        
        if (url.includes('/api/')) {
          this.debugAPICall('performance', {
            endpoint: url.replace(window.location.origin, ''),
            method: config.method || 'GET',
            duration: Math.round(duration),
            status: response.status
          });
        }
        
        return response;
      });
    };
  }

  // Utility methods
  getObjectKeys(obj) {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  getSample(obj, maxDepth = 2) {
    if (maxDepth <= 0 || !obj || typeof obj !== 'object') return obj;
    
    const sample = {};
    Object.entries(obj).slice(0, 5).forEach(([key, value]) => {
      if (typeof value === 'object') {
        sample[key] = this.getSample(value, maxDepth - 1);
      } else {
        sample[key] = value;
      }
    });
    return sample;
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Export logs for analysis
  exportLogs() {
    const exportData = {
      logs: this.logs,
      schemas: Object.fromEntries(this.schemas),
      transformationRules: Object.fromEntries(this.transformationRules),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-debug-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Get debugging dashboard data
  getDashboardData() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentLogs = this.logs.filter(log => log.timestamp > last24h);
    
    const alerts = recentLogs.filter(log => log.phase === 'alert');
    const apiCalls = recentLogs.filter(log => log.phase === 'response');
    const errors = recentLogs.filter(log => log.phase === 'error');

    return {
      summary: {
        totalAPICalls: apiCalls.length,
        totalAlerts: alerts.length,
        totalErrors: errors.length,
        averageResponseTime: this.calculateAverageResponseTime(apiCalls)
      },
      alerts: alerts.slice(-10), // Last 10 alerts
      slowestEndpoints: this.getSlowestEndpoints(apiCalls),
      mostErroredEndpoints: this.getMostErroredEndpoints(errors),
      schemaViolations: alerts.filter(a => a.alertType === 'SCHEMA_VALIDATION_FAILED')
    };
  }

  calculateAverageResponseTime(apiCalls) {
    if (apiCalls.length === 0) return 0;
    const total = apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
    return Math.round(total / apiCalls.length);
  }

  getSlowestEndpoints(apiCalls) {
    const endpointStats = {};
    
    apiCalls.forEach(call => {
      const endpoint = call.endpoint;
      if (!endpointStats[endpoint]) {
        endpointStats[endpoint] = { totalTime: 0, count: 0 };
      }
      endpointStats[endpoint].totalTime += call.duration || 0;
      endpointStats[endpoint].count++;
    });

    return Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: Math.round(stats.totalTime / stats.count),
        callCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);
  }

  getMostErroredEndpoints(errors) {
    const errorStats = {};
    
    errors.forEach(error => {
      const endpoint = error.endpoint;
      if (!errorStats[endpoint]) {
        errorStats[endpoint] = 0;
      }
      errorStats[endpoint]++;
    });

    return Object.entries(errorStats)
      .map(([endpoint, count]) => ({ endpoint, errorCount: count }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, 5);
  }
}

// Global instance
export const apiDebugger = new APIDebugger();

// Make available in dev tools
if (typeof window !== 'undefined') {
  window.apiDebugger = apiDebugger;
}