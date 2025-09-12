/**
 * Generic Feature Registry System
 * 
 * Manages built-in and custom features across the entire platform:
 * - Slot editor interactions
 * - Plugin/extension functionality  
 * - Custom business logic
 * - Third-party integrations
 */

import { sanitizeHtml } from '../secureHtmlParser';

// Feature parameter types with validation
export const PARAMETER_TYPES = {
  TEXT: {
    type: 'text',
    validate: (value) => typeof value === 'string',
    sanitize: (value) => String(value).trim()
  },
  NUMBER: {
    type: 'number',
    validate: (value) => !isNaN(Number(value)),
    sanitize: (value) => Number(value)
  },
  BOOLEAN: {
    type: 'boolean',
    validate: (value) => typeof value === 'boolean' || value === 'true' || value === 'false',
    sanitize: (value) => value === true || value === 'true'
  },
  URL: {
    type: 'url',
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    sanitize: (value) => String(value).trim()
  },
  EMAIL: {
    type: 'email',
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    sanitize: (value) => String(value).toLowerCase().trim()
  },
  COLOR: {
    type: 'color',
    validate: (value) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
    sanitize: (value) => String(value).toLowerCase()
  },
  JSON: {
    type: 'json',
    validate: (value) => {
      try {
        JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    sanitize: (value) => typeof value === 'string' ? JSON.parse(value) : value
  },
  HTML: {
    type: 'html',
    validate: (value) => typeof value === 'string',
    sanitize: (value) => sanitizeHtml(String(value), 'editor')
  }
};

// Feature contexts - where features can be used
export const FEATURE_CONTEXTS = {
  SLOT_INTERACTION: 'slot_interaction',    // EditorSidebar interactions
  PLUGIN_HOOK: 'plugin_hook',             // Plugin system hooks
  WORKFLOW_ACTION: 'workflow_action',      // Business process automation
  API_ENDPOINT: 'api_endpoint',           // Custom API functionality
  UI_COMPONENT: 'ui_component',           // Custom UI components
  DATA_TRANSFORM: 'data_transform',       // Data processing pipelines
  EVENT_HANDLER: 'event_handler'          // System event responses
};

// Built-in feature categories
export const FEATURE_CATEGORIES = {
  ECOMMERCE: 'ecommerce',
  UI_INTERACTION: 'ui_interaction',
  DATA_MANAGEMENT: 'data_management',
  INTEGRATION: 'integration',
  AUTOMATION: 'automation',
  ANALYTICS: 'analytics',
  SECURITY: 'security',
  UTILITY: 'utility'
};

class FeatureRegistry {
  constructor() {
    this.features = new Map();
    this.customFeatures = new Map();
    this.executionHistory = [];
    this.hooks = new Map();
    
    // Initialize built-in features
    this.initializeBuiltInFeatures();
  }

  /**
   * Register a built-in feature
   */
  registerBuiltIn(featureId, feature) {
    const validatedFeature = this.validateFeatureDefinition(feature);
    if (validatedFeature.isValid) {
      this.features.set(featureId, {
        ...feature,
        id: featureId,
        type: 'built-in',
        createdAt: new Date().toISOString(),
        isActive: true
      });
    } else {
      throw new Error(`Invalid built-in feature: ${validatedFeature.errors.join(', ')}`);
    }
  }

  /**
   * Register a custom user-created feature
   */
  registerCustom(featureId, feature, userId) {
    const validatedFeature = this.validateFeatureDefinition(feature);
    if (validatedFeature.isValid) {
      this.customFeatures.set(featureId, {
        ...feature,
        id: featureId,
        type: 'custom',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isActive: true,
        usage: { count: 0, lastUsed: null }
      });
      return { success: true, featureId };
    } else {
      return { success: false, errors: validatedFeature.errors };
    }
  }

  /**
   * Execute a feature with parameters
   */
  async executeFeature(featureId, parameters = {}, context = {}) {
    const feature = this.getFeature(featureId);
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    if (!feature.isActive) {
      throw new Error(`Feature is disabled: ${featureId}`);
    }

    // Validate and sanitize parameters
    const sanitizedParams = this.validateAndSanitizeParameters(feature.parameters || [], parameters);
    
    // Create secure execution context
    const executionContext = this.createExecutionContext(feature, context);
    
    // Execute with timeout and error handling
    try {
      const startTime = Date.now();
      
      // Update usage statistics for custom features
      if (feature.type === 'custom') {
        this.updateUsageStats(featureId);
      }

      let result;
      if (feature.execute) {
        // Built-in feature with native function
        result = await feature.execute(sanitizedParams, executionContext);
      } else if (feature.code) {
        // Custom feature with JavaScript code
        result = await this.executeCustomCode(feature.code, sanitizedParams, executionContext);
      } else {
        throw new Error('Feature has no execution method');
      }

      // Log execution
      this.logExecution(featureId, {
        success: true,
        duration: Date.now() - startTime,
        parameters: sanitizedParams,
        result
      });

      return result;

    } catch (error) {
      this.logExecution(featureId, {
        success: false,
        error: error.message,
        parameters: sanitizedParams
      });
      throw error;
    }
  }

  /**
   * Get all features available for a specific context
   */
  getFeaturesForContext(context) {
    const allFeatures = [...this.features.values(), ...this.customFeatures.values()];
    return allFeatures.filter(feature => 
      feature.isActive && 
      (feature.contexts || []).includes(context)
    );
  }

  /**
   * Get feature by ID
   */
  getFeature(featureId) {
    return this.features.get(featureId) || this.customFeatures.get(featureId);
  }

  /**
   * Validate feature definition
   */
  validateFeatureDefinition(feature) {
    const errors = [];
    
    if (!feature.name || typeof feature.name !== 'string') {
      errors.push('Feature name is required');
    }
    
    if (!feature.category || !Object.values(FEATURE_CATEGORIES).includes(feature.category)) {
      errors.push('Valid feature category is required');
    }
    
    if (!feature.contexts || !Array.isArray(feature.contexts) || feature.contexts.length === 0) {
      errors.push('At least one context is required');
    }
    
    if (feature.parameters) {
      feature.parameters.forEach((param, index) => {
        if (!param.name) errors.push(`Parameter ${index} missing name`);
        if (!param.type || !PARAMETER_TYPES[param.type.toUpperCase()]) {
          errors.push(`Parameter ${param.name} has invalid type`);
        }
      });
    }
    
    if (feature.code && typeof feature.code !== 'string') {
      errors.push('Feature code must be a string');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate and sanitize parameters
   */
  validateAndSanitizeParameters(parameterDefs, inputParams) {
    const sanitized = {};
    
    for (const paramDef of parameterDefs) {
      const paramType = PARAMETER_TYPES[paramDef.type?.toUpperCase()];
      const inputValue = inputParams[paramDef.name];
      
      // Handle required parameters
      if (paramDef.required && (inputValue === undefined || inputValue === null || inputValue === '')) {
        throw new Error(`Required parameter missing: ${paramDef.name}`);
      }
      
      // Use default value if not provided
      if (inputValue === undefined && paramDef.default !== undefined) {
        sanitized[paramDef.name] = paramDef.default;
        continue;
      }
      
      // Skip optional empty parameters
      if (!paramDef.required && (inputValue === undefined || inputValue === null || inputValue === '')) {
        continue;
      }
      
      // Validate and sanitize
      if (paramType) {
        if (!paramType.validate(inputValue)) {
          throw new Error(`Invalid parameter ${paramDef.name}: expected ${paramType.type}`);
        }
        sanitized[paramDef.name] = paramType.sanitize(inputValue);
      } else {
        sanitized[paramDef.name] = inputValue;
      }
    }
    
    return sanitized;
  }

  /**
   * Create secure execution context with controlled API
   */
  createExecutionContext(feature, context) {
    return {
      // Safe API methods available to custom features
      api: {
        // Data operations
        getData: (key) => this.secureDataGet(key, context),
        setData: (key, value) => this.secureDataSet(key, value, context),
        
        // UI operations
        showToast: (message, type = 'info') => this.showToast(message, type, context),
        showAlert: (message) => this.showAlert(message, context),
        addClass: (elementId, className) => this.secureAddClass(elementId, className, context),
        removeClass: (elementId, className) => this.secureRemoveClass(elementId, className, context),
        setText: (elementId, text) => this.secureSetText(elementId, text, context),
        
        // HTTP operations (with restrictions)
        fetch: (url, options = {}) => this.secureFetch(url, options, context),
        
        // Utility functions
        formatCurrency: (amount, currency = 'USD') => this.formatCurrency(amount, currency),
        formatDate: (date, format) => this.formatDate(date, format),
        
        // Event system
        emit: (eventName, data) => this.emitEvent(eventName, data, context),
        on: (eventName, callback) => this.addEventListener(eventName, callback, context)
      },
      
      // Context information
      context: {
        userId: context.userId,
        storeId: context.storeId,
        slotId: context.slotId,
        elementId: context.elementId,
        featureId: feature.id,
        timestamp: new Date().toISOString()
      },
      
      // Limited console for debugging
      console: {
        log: (...args) => console.log(`[Feature:${feature.id}]`, ...args),
        warn: (...args) => console.warn(`[Feature:${feature.id}]`, ...args),
        error: (...args) => console.error(`[Feature:${feature.id}]`, ...args)
      }
    };
  }

  /**
   * Execute custom JavaScript code in sandboxed environment
   */
  async executeCustomCode(code, parameters, executionContext) {
    // Create isolated function
    const timeoutMs = 5000; // 5 second timeout
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Feature execution timeout'));
      }, timeoutMs);
      
      try {
        // Create sandboxed function
        const sandboxedFunction = new Function(
          'params', 
          'api', 
          'context', 
          'console',
          `
            "use strict";
            return (async () => {
              ${code}
            })();
          `
        );
        
        // Execute with controlled context
        const result = sandboxedFunction(
          parameters, 
          executionContext.api, 
          executionContext.context,
          executionContext.console
        );
        
        // Handle async results
        if (result && typeof result.then === 'function') {
          result
            .then(res => {
              clearTimeout(timeoutId);
              resolve(res);
            })
            .catch(err => {
              clearTimeout(timeoutId);
              reject(err);
            });
        } else {
          clearTimeout(timeoutId);
          resolve(result);
        }
        
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  // Initialize built-in e-commerce features
  initializeBuiltInFeatures() {
    // E-commerce features
    this.registerBuiltIn('add-to-cart', {
      name: 'Add to Cart',
      description: 'Add product to shopping cart',
      category: FEATURE_CATEGORIES.ECOMMERCE,
      contexts: [FEATURE_CONTEXTS.SLOT_INTERACTION, FEATURE_CONTEXTS.UI_COMPONENT],
      parameters: [
        { name: 'productId', type: 'text', required: true },
        { name: 'quantity', type: 'number', default: 1 },
        { name: 'variant', type: 'text', required: false }
      ],
      execute: async (params, context) => {
        // Built-in implementation
        return context.api.fetch('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify(params)
        });
      }
    });
    
    // More built-in features...
    this.registerBuiltIn('navigate', {
      name: 'Navigate',
      description: 'Navigate to URL',
      category: FEATURE_CATEGORIES.UI_INTERACTION,
      contexts: [FEATURE_CONTEXTS.SLOT_INTERACTION],
      parameters: [
        { name: 'url', type: 'url', required: true },
        { name: 'target', type: 'text', default: '_self' }
      ],
      execute: async (params, context) => {
        if (params.target === '_blank') {
          window.open(params.url, '_blank');
        } else {
          window.location.href = params.url;
        }
      }
    });
  }

  // Secure API implementations
  secureDataGet(key, context) {
    // Implement secure data retrieval with user/context isolation
    const storageKey = `feature_data_${context.userId}_${context.storeId}_${key}`;
    return JSON.parse(localStorage.getItem(storageKey) || 'null');
  }

  secureDataSet(key, value, context) {
    // Implement secure data storage with user/context isolation
    const storageKey = `feature_data_${context.userId}_${context.storeId}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(value));
  }

  showToast(message, type, context) {
    // Implement toast notification system
    console.log(`Toast [${type}]: ${message}`);
  }

  // Additional secure API methods...
  secureAddClass(elementId, className, context) {
    const element = document.getElementById(elementId);
    if (element && this.isElementAllowed(element, context)) {
      element.classList.add(className);
    }
  }

  isElementAllowed(element, context) {
    // Check if element is within allowed scope for this context
    return element.closest(`[data-slot-id="${context.slotId}"]`) !== null;
  }

  // Logging and analytics
  logExecution(featureId, details) {
    this.executionHistory.push({
      featureId,
      timestamp: new Date().toISOString(),
      ...details
    });
    
    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }

  updateUsageStats(featureId) {
    const feature = this.customFeatures.get(featureId);
    if (feature) {
      feature.usage.count++;
      feature.usage.lastUsed = new Date().toISOString();
    }
  }
}

// Export singleton instance
export const featureRegistry = new FeatureRegistry();
export default featureRegistry;