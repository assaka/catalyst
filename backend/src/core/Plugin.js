/**
 * Base Plugin Class
 * All plugins must extend this class and implement required methods
 */
class Plugin {
  constructor(config = {}) {
    this.config = config;
    this.name = this.constructor.name;
    this.version = '1.0.0';
    this.isEnabled = false;
    this.isInstalled = false;
    this.dependencies = [];
    this.hooks = new Map();
    this.routes = [];
    this.models = [];
    this.migrations = [];
  }

  /**
   * Plugin metadata - must be implemented by each plugin
   */
  static getMetadata() {
    throw new Error('Plugin must implement getMetadata() method');
  }

  /**
   * Plugin installation - override if needed
   */
  async install() {
    console.log(`📦 Installing plugin: ${this.name}`);
    
    // Run migrations
    await this.runMigrations();
    
    // Register models
    await this.registerModels();
    
    // Set up initial configuration
    await this.setupInitialConfig();
    
    this.isInstalled = true;
    console.log(`✅ Plugin ${this.name} installed successfully`);
  }

  /**
   * Plugin uninstallation - override if needed
   */
  async uninstall() {
    console.log(`🗑️ Uninstalling plugin: ${this.name}`);
    
    // Clean up data (optional - ask user)
    await this.cleanup();
    
    // Remove routes
    this.unregisterRoutes();
    
    // Remove hooks
    this.unregisterHooks();
    
    this.isInstalled = false;
    this.isEnabled = false;
    console.log(`✅ Plugin ${this.name} uninstalled successfully`);
  }

  /**
   * Plugin activation
   */
  async enable() {
    if (!this.isInstalled) {
      throw new Error(`Plugin ${this.name} must be installed before enabling`);
    }

    console.log(`🚀 Enabling plugin: ${this.name}`);
    
    // Register routes
    await this.registerRoutes();
    
    // Register hooks
    await this.registerHooks();
    
    // Start services
    await this.startServices();
    
    this.isEnabled = true;
    console.log(`✅ Plugin ${this.name} enabled successfully`);
  }

  /**
   * Plugin deactivation
   */
  async disable() {
    console.log(`⏸️ Disabling plugin: ${this.name}`);
    
    // Stop services
    await this.stopServices();
    
    // Unregister routes
    this.unregisterRoutes();
    
    // Unregister hooks
    this.unregisterHooks();
    
    this.isEnabled = false;
    console.log(`✅ Plugin ${this.name} disabled successfully`);
  }

  /**
   * Check if plugin dependencies are met
   */
  async checkDependencies() {
    const missing = [];
    
    for (const dep of this.dependencies) {
      const isAvailable = await this.isDependencyAvailable(dep);
      if (!isAvailable) {
        missing.push(dep);
      }
    }
    
    return {
      satisfied: missing.length === 0,
      missing: missing
    };
  }

  /**
   * Plugin health check
   */
  async healthCheck() {
    try {
      // Check dependencies
      const deps = await this.checkDependencies();
      if (!deps.satisfied) {
        return {
          status: 'unhealthy',
          message: `Missing dependencies: ${deps.missing.join(', ')}`
        };
      }

      // Plugin-specific health checks
      const customCheck = await this.customHealthCheck();
      
      return {
        status: 'healthy',
        message: 'Plugin is working correctly',
        details: customCheck
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        error: error
      };
    }
  }

  // ===== Methods to override in specific plugins =====

  /**
   * Run database migrations - override in plugin
   */
  async runMigrations() {
    // Default: no migrations
  }

  /**
   * Register Sequelize models - override in plugin
   */
  async registerModels() {
    // Default: no models
  }

  /**
   * Set up initial plugin configuration - override in plugin
   */
  async setupInitialConfig() {
    // Default: no setup needed
  }

  /**
   * Clean up plugin data - override in plugin
   */
  async cleanup() {
    // Default: no cleanup needed
  }

  /**
   * Register API routes - override in plugin
   */
  async registerRoutes() {
    // Default: no routes
  }

  /**
   * Unregister API routes - override in plugin
   */
  unregisterRoutes() {
    // Default: no routes to unregister
  }

  /**
   * Register event hooks - override in plugin
   */
  async registerHooks() {
    // Default: no hooks
  }

  /**
   * Unregister event hooks - override in plugin
   */
  unregisterHooks() {
    // Default: no hooks to unregister
  }

  /**
   * Start plugin services - override in plugin
   */
  async startServices() {
    // Default: no services to start
  }

  /**
   * Stop plugin services - override in plugin
   */
  async stopServices() {
    // Default: no services to stop
  }

  /**
   * Custom health check logic - override in plugin
   */
  async customHealthCheck() {
    return { status: 'ok' };
  }

  /**
   * Check if a dependency is available - override if needed
   */
  async isDependencyAvailable(dependency) {
    // Default: assume dependency is available
    // Override for specific dependency checking logic
    return true;
  }

  // ===== Utility methods =====

  /**
   * Get plugin configuration
   */
  getConfig(key = null) {
    if (key) {
      return this.config[key];
    }
    return this.config;
  }

  /**
   * Update plugin configuration
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Log plugin message
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`, data || '');
  }

  /**
   * Get plugin status
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      isInstalled: this.isInstalled,
      isEnabled: this.isEnabled,
      dependencies: this.dependencies,
      config: this.config
    };
  }
}

module.exports = Plugin;