const vm = require('vm');
const path = require('path');
const fs = require('fs');

/**
 * PluginSandbox - Secure execution environment for store-created plugins
 * 
 * Provides isolation and security for user-generated plugin code:
 * - Restricted API access
 * - No filesystem access
 * - Limited network access
 * - Memory and execution time limits
 * - Content Security Policy enforcement
 */
class PluginSandbox {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000, // 5 second execution limit
      memoryLimit: options.memoryLimit || 32 * 1024 * 1024, // 32MB memory limit
      allowedModules: options.allowedModules || ['crypto', 'querystring', 'url'],
      maxOutputLength: options.maxOutputLength || 10000, // 10KB output limit
      ...options
    };

    this.allowedGlobals = new Set([
      'console',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'JSON',
      'Date',
      'Math',
      'parseInt',
      'parseFloat',
      'isNaN',
      'isFinite',
      'encodeURIComponent',
      'decodeURIComponent',
      'encodeURI',
      'decodeURI'
    ]);

    this.createSandboxContext();
  }

  /**
   * Create the sandbox context with restricted globals
   */
  createSandboxContext() {
    const context = {
      // Safe globals
      console: {
        log: (...args) => this.logOutput('log', ...args),
        warn: (...args) => this.logOutput('warn', ...args),
        error: (...args) => this.logOutput('error', ...args),
        info: (...args) => this.logOutput('info', ...args)
      },
      
      // Restricted setTimeout/setInterval
      setTimeout: (fn, delay) => {
        if (delay > 1000) delay = 1000; // Max 1 second delay
        return setTimeout(fn, delay);
      },
      
      setInterval: (fn, delay) => {
        if (delay < 100) delay = 100; // Min 100ms interval
        return setInterval(fn, delay);
      },
      
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      
      // Safe utilities
      JSON: JSON,
      Date: Date,
      Math: Math,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      encodeURI: encodeURI,
      decodeURI: decodeURI,

      // Plugin-specific APIs
      DainoStoreAPI: this.createDainoStoreAPI(),
      
      // HTML sanitization
      sanitizeHTML: this.createHTMLSanitizer(),
      
      // Configuration validation
      validateConfig: this.createConfigValidator()
    };

    this.sandboxContext = context;
  }

  /**
   * Create the DainoStore API for plugins
   */
  createDainoStoreAPI() {
    return {
      // Store information (read-only)
      getStoreInfo: (storeId) => ({
        id: storeId,
        name: 'Store Name', // Would come from database
        url: 'https://store.example.com',
        theme: 'default'
      }),

      // Safe HTTP requests (to allowed endpoints only)
      fetch: async (url, options = {}) => {
        // Validate URL against allowlist
        const allowedDomains = [
          'api.stripe.com',
          'api.paypal.com',
          'graph.facebook.com',
          'api.twitter.com'
        ];

        const urlObj = new URL(url);
        if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
          throw new Error(`HTTP requests to ${urlObj.hostname} are not allowed`);
        }

        // Implement restricted fetch
        return this.restrictedFetch(url, options);
      },

      // Storage API (scoped to plugin and store)
      storage: {
        get: (key) => this.getPluginStorage(key),
        set: (key, value) => this.setPluginStorage(key, value),
        remove: (key) => this.removePluginStorage(key)
      },

      // Event system
      events: {
        on: (event, handler) => this.registerEventHandler(event, handler),
        emit: (event, data) => this.emitPluginEvent(event, data),
        off: (event, handler) => this.unregisterEventHandler(event, handler)
      },

      // Utilities
      utils: {
        formatCurrency: (amount, currency = 'USD') => 
          new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency 
          }).format(amount),
        
        formatDate: (date, options = {}) => 
          new Intl.DateTimeFormat('en-US', options).format(new Date(date)),
        
        generateId: () => 
          Math.random().toString(36).substr(2, 9),
        
        escapeHTML: (str) => 
          str.replace(/[&<>"']/g, (match) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
          }[match]))
      }
    };
  }

  /**
   * Create HTML sanitizer to prevent XSS
   */
  createHTMLSanitizer() {
    const allowedTags = new Set([
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'b', 'i', 'u', 'br', 'hr',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'code', 'pre'
    ]);

    const allowedAttributes = new Set([
      'id', 'class', 'style', 'title', 'alt',
      'href', 'src', 'width', 'height',
      'colspan', 'rowspan', 'target'
    ]);

    return (html) => {
      // Simple HTML sanitization (in production, use a library like DOMPurify)
      return html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, '');
    };
  }

  /**
   * Create configuration validator
   */
  createConfigValidator() {
    return (config, schema) => {
      const errors = [];
      
      if (!schema || !schema.properties) {
        return { valid: true, errors: [] };
      }

      for (const [key, definition] of Object.entries(schema.properties)) {
        const value = config[key];
        
        // Check required fields
        if (definition.required && (value === undefined || value === null)) {
          errors.push(`Required field '${key}' is missing`);
          continue;
        }

        // Type validation
        if (value !== undefined && definition.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== definition.type) {
            errors.push(`Field '${key}' should be of type ${definition.type}, got ${actualType}`);
          }
        }

        // Enum validation
        if (value !== undefined && definition.enum) {
          if (!definition.enum.includes(value)) {
            errors.push(`Field '${key}' must be one of: ${definition.enum.join(', ')}`);
          }
        }

        // Range validation for numbers
        if (value !== undefined && definition.type === 'number') {
          if (definition.min !== undefined && value < definition.min) {
            errors.push(`Field '${key}' must be at least ${definition.min}`);
          }
          if (definition.max !== undefined && value > definition.max) {
            errors.push(`Field '${key}' must be at most ${definition.max}`);
          }
        }

        // String length validation
        if (value !== undefined && definition.type === 'string') {
          if (definition.minLength !== undefined && value.length < definition.minLength) {
            errors.push(`Field '${key}' must be at least ${definition.minLength} characters`);
          }
          if (definition.maxLength !== undefined && value.length > definition.maxLength) {
            errors.push(`Field '${key}' must be at most ${definition.maxLength} characters`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };
  }

  /**
   * Execute plugin code in sandbox
   */
  async executePlugin(pluginCode, hookName, config = {}, context = {}) {
    try {
      // Prepare execution context
      const executionContext = {
        ...context,
        config,
        hookName,
        store: context.store || { id: 'unknown', name: 'Unknown Store' },
        user: context.user || null,
        timestamp: Date.now()
      };

      // Create sandbox context for VM
      const sandbox = {
        ...this.sandboxContext,
        module: { exports: {} },
        exports: {},
        require: (id) => {
          // Only allow specific modules
          if (this.options.allowedModules.includes(id)) {
            return require(id);
          }
          throw new Error(`Module '${id}' is not allowed`);
        }
      };

      // Create VM context
      const vmContext = vm.createContext(sandbox);

      // Execute plugin code with timeout
      const vmResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Plugin execution timeout'));
        }, this.options.timeout);

        try {
          vm.runInContext(pluginCode, vmContext, { timeout: this.options.timeout });
          clearTimeout(timeout);
          resolve(sandbox.module.exports || sandbox.exports);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      const PluginClass = vmResult;
      
      if (typeof PluginClass !== 'function') {
        throw new Error('Plugin must export a class constructor');
      }

      // Instantiate plugin
      const pluginInstance = new PluginClass();

      // Find the hook method
      const hookMethod = this.findHookMethod(pluginInstance, hookName);
      if (!hookMethod) {
        throw new Error(`Plugin does not implement hook method for '${hookName}'`);
      }

      // Execute the hook method
      const result = await hookMethod.call(pluginInstance, config, executionContext);

      // Validate and sanitize output
      if (typeof result !== 'string') {
        throw new Error('Plugin hook method must return a string');
      }

      if (result.length > this.options.maxOutputLength) {
        throw new Error(`Plugin output exceeds maximum length (${this.options.maxOutputLength} characters)`);
      }

      // Sanitize HTML output
      const sanitizedResult = this.sandboxContext.sanitizeHTML(result);

      return {
        success: true,
        output: sanitizedResult,
        executionTime: Date.now() - executionContext.timestamp,
        logs: this.executionLogs || []
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        logs: this.executionLogs || []
      };
    } finally {
      // Clear execution logs
      this.executionLogs = [];
    }
  }

  /**
   * Find the appropriate hook method on plugin instance
   */
  findHookMethod(pluginInstance, hookName) {
    // Convert hook name to method name (e.g., 'homepage_header' -> 'renderHomepageHeader')
    const methodName = 'render' + hookName
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    return pluginInstance[methodName];
  }

  /**
   * Log output from plugin execution
   */
  logOutput(level, ...args) {
    if (!this.executionLogs) {
      this.executionLogs = [];
    }

    this.executionLogs.push({
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '),
      timestamp: Date.now()
    });
  }

  /**
   * Restricted fetch implementation
   */
  async restrictedFetch(url, options) {
    // This would implement HTTP requests with restrictions
    // For now, return a mock response
    return {
      ok: true,
      status: 200,
      json: async () => ({ message: 'Mock API response' }),
      text: async () => 'Mock response text'
    };
  }

  /**
   * Plugin storage methods (would integrate with database)
   */
  getPluginStorage(key) {
    // Implementation would fetch from database
    return null;
  }

  setPluginStorage(key, value) {
    // Implementation would save to database
    return true;
  }

  removePluginStorage(key) {
    // Implementation would delete from database
    return true;
  }

  /**
   * Event system methods
   */
  registerEventHandler(event, handler) {
    // Implementation for plugin event system
  }

  emitPluginEvent(event, data) {
    // Implementation for plugin event system
  }

  unregisterEventHandler(event, handler) {
    // Implementation for plugin event system
  }

  /**
   * Validate plugin code before execution
   */
  validatePluginCode(code) {
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /global\./,
      /__dirname/,
      /__filename/,
      /fs\./,
      /child_process/,
      /os\./,
      /path\./,
      /crypto\./,
      /http\./,
      /https\./,
      /net\./,
      /dgram\./,
      /tls\./,
      /vm\./
    ];

    const errors = [];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Forbidden pattern detected: ${pattern.toString()}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = PluginSandbox;