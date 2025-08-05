const fs = require('fs').promises;
const path = require('path');
const Plugin = require('./Plugin');

/**
 * Plugin Manager
 * Handles plugin discovery, installation, and lifecycle management
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.installedPlugins = new Map();
    this.enabledPlugins = new Map();
    this.pluginDirectory = path.join(__dirname, '../plugins');
    this.configFile = path.join(__dirname, '../config/plugins.json');
    this.hooks = new Map();
  }

  /**
   * Initialize the plugin manager
   */
  async initialize() {
    console.log('🔌 Initializing Plugin Manager...');
    
    // Ensure plugin directory exists
    await this.ensurePluginDirectory();
    
    // Load plugin configuration
    await this.loadPluginConfig();
    
    // Discover available plugins
    await this.discoverPlugins();
    
    // Auto-enable previously enabled plugins
    await this.autoEnablePlugins();
    
    console.log(`✅ Plugin Manager initialized with ${this.plugins.size} plugins`);
  }

  /**
   * Discover all available plugins
   */
  async discoverPlugins() {
    try {
      const pluginDirs = await fs.readdir(this.pluginDirectory);
      
      for (const dirName of pluginDirs) {
        const pluginPath = path.join(this.pluginDirectory, dirName);
        const stat = await fs.stat(pluginPath);
        
        if (stat.isDirectory()) {
          await this.loadPlugin(dirName, pluginPath);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not discover plugins:', error.message);
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(name, pluginPath) {
    try {
      const manifestPath = path.join(pluginPath, 'plugin.json');
      const indexPath = path.join(pluginPath, 'index.js');
      
      // Check if required files exist
      try {
        await fs.access(manifestPath);
        await fs.access(indexPath);
      } catch (error) {
        console.warn(`⚠️ Plugin ${name} missing required files (plugin.json or index.js)`);
        return;
      }
      
      // Load plugin manifest
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Load plugin class
      const PluginClass = require(indexPath);
      
      // Verify plugin extends Plugin base class
      if (!(PluginClass.prototype instanceof Plugin)) {
        console.warn(`⚠️ Plugin ${name} does not extend Plugin base class`);
        return;
      }
      
      // Create plugin instance
      const plugin = new PluginClass(manifest.config || {});
      plugin.manifest = manifest;
      plugin.pluginPath = pluginPath;
      
      // Store plugin
      this.plugins.set(name, plugin);
      
      console.log(`📦 Discovered plugin: ${name} v${manifest.version}`);
    } catch (error) {
      console.error(`❌ Failed to load plugin ${name}:`, error.message);
    }
  }

  /**
   * Install a plugin
   */
  async installPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }

    if (plugin.isInstalled) {
      throw new Error(`Plugin ${name} is already installed`);
    }

    console.log(`📦 Installing plugin: ${name}`);

    try {
      // Check dependencies
      const depCheck = await plugin.checkDependencies();
      if (!depCheck.satisfied) {
        throw new Error(`Missing dependencies: ${depCheck.missing.join(', ')}`);
      }

      // Install the plugin
      await plugin.install();

      // Mark as installed
      this.installedPlugins.set(name, plugin);
      
      // Save configuration
      await this.savePluginConfig();

      console.log(`✅ Plugin ${name} installed successfully`);
      
      // Emit hook
      await this.emitHook('plugin:installed', { plugin, name });
      
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to install plugin ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(name) {
    const plugin = this.installedPlugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not installed`);
    }

    console.log(`🗑️ Uninstalling plugin: ${name}`);

    try {
      // Disable first if enabled
      if (plugin.isEnabled) {
        await this.disablePlugin(name);
      }

      // Uninstall the plugin
      await plugin.uninstall();

      // Remove from installed plugins
      this.installedPlugins.delete(name);
      
      // Save configuration
      await this.savePluginConfig();

      console.log(`✅ Plugin ${name} uninstalled successfully`);
      
      // Emit hook
      await this.emitHook('plugin:uninstalled', { plugin, name });
      
    } catch (error) {
      console.error(`❌ Failed to uninstall plugin ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(name) {
    const plugin = this.installedPlugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not installed`);
    }

    if (plugin.isEnabled) {
      throw new Error(`Plugin ${name} is already enabled`);
    }

    console.log(`🚀 Enabling plugin: ${name}`);

    try {
      // Enable the plugin
      await plugin.enable();

      // Mark as enabled
      this.enabledPlugins.set(name, plugin);
      
      // Save configuration
      await this.savePluginConfig();

      console.log(`✅ Plugin ${name} enabled successfully`);
      
      // Emit hook
      await this.emitHook('plugin:enabled', { plugin, name });
      
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to enable plugin ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(name) {
    const plugin = this.enabledPlugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not enabled`);
    }

    console.log(`⏸️ Disabling plugin: ${name}`);

    try {
      // Disable the plugin
      await plugin.disable();

      // Remove from enabled plugins
      this.enabledPlugins.delete(name);
      
      // Save configuration
      await this.savePluginConfig();

      console.log(`✅ Plugin ${name} disabled successfully`);
      
      // Emit hook
      await this.emitHook('plugin:disabled', { plugin, name });
      
    } catch (error) {
      console.error(`❌ Failed to disable plugin ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all plugins with their status
   */
  getAllPlugins() {
    const result = [];
    
    for (const [name, plugin] of this.plugins.entries()) {
      result.push({
        name,
        ...plugin.getStatus(),
        manifest: plugin.manifest
      });
    }
    
    return result;
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Check plugin health
   */
  async checkPluginHealth(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return { status: 'not_found', message: 'Plugin not found' };
    }

    return await plugin.healthCheck();
  }

  /**
   * Register a hook listener
   */
  registerHook(eventName, callback) {
    if (!this.hooks.has(eventName)) {
      this.hooks.set(eventName, []);
    }
    this.hooks.get(eventName).push(callback);
  }

  /**
   * Emit a hook event
   */
  async emitHook(eventName, data) {
    const listeners = this.hooks.get(eventName) || [];
    
    for (const listener of listeners) {
      try {
        await listener(data);
      } catch (error) {
        console.error(`❌ Hook listener error for ${eventName}:`, error.message);
      }
    }
  }

  /**
   * Load plugin configuration from file
   */
  async loadPluginConfig() {
    try {
      const configContent = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configContent);
      
      this.installedPluginNames = new Set(config.installed || []);
      this.enabledPluginNames = new Set(config.enabled || []);
    } catch (error) {
      // Config file doesn't exist or is invalid, start fresh
      this.installedPluginNames = new Set();
      this.enabledPluginNames = new Set();
    }
  }

  /**
   * Save plugin configuration to file
   */
  async savePluginConfig() {
    const config = {
      installed: Array.from(this.installedPlugins.keys()),
      enabled: Array.from(this.enabledPlugins.keys()),
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
  }

  /**
   * Auto-enable previously enabled plugins
   */
  async autoEnablePlugins() {
    if (!this.enabledPluginNames) return;

    for (const pluginName of this.enabledPluginNames) {
      try {
        const plugin = this.plugins.get(pluginName);
        if (plugin && !plugin.isInstalled) {
          await this.installPlugin(pluginName);
        }
        if (plugin && !plugin.isEnabled) {
          await this.enablePlugin(pluginName);
        }
      } catch (error) {
        console.error(`❌ Failed to auto-enable plugin ${pluginName}:`, error.message);
      }
    }
  }

  /**
   * Ensure plugin directory exists
   */
  async ensurePluginDirectory() {
    try {
      await fs.access(this.pluginDirectory);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.pluginDirectory, { recursive: true });
      console.log(`📁 Created plugin directory: ${this.pluginDirectory}`);
    }
  }

  /**
   * Get plugin manager status
   */
  getStatus() {
    return {
      totalPlugins: this.plugins.size,
      installedPlugins: this.installedPlugins.size,
      enabledPlugins: this.enabledPlugins.size,
      pluginDirectory: this.pluginDirectory,
      plugins: this.getAllPlugins()
    };
  }
}

// Singleton instance
const pluginManager = new PluginManager();

module.exports = pluginManager;