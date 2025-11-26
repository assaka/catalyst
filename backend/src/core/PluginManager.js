const fs = require('fs').promises;
const path = require('path');
const Plugin = require('./Plugin');
const PluginModel = require('../models/Plugin');
const PluginUninstaller = require('./PluginUninstaller');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Plugin Manager
 * Handles plugin discovery, installation, and lifecycle management
 */
class PluginManager {
  constructor() {
    this.plugins = new Map(); // Runtime plugin instances
    this.installedPlugins = new Map(); // Installed plugin instances
    this.enabledPlugins = new Map(); // Enabled plugin instances
    this.pluginDirectory = path.join(__dirname, '../plugins');
    this.hooks = new Map();
    this.marketplace = new Map(); // Available plugins from marketplace/registry
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
    this.uninstaller = new PluginUninstaller(this); // Enhanced uninstaller
  }

  /**
   * Initialize the plugin manager
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('✅ Plugin Manager already initialized');
      return;
    }
    
    if (this.isInitializing) {
      console.log('⏳ Plugin Manager initialization in progress, waiting...');
      return this.initPromise;
    }
    
    this.isInitializing = true;
    this.initPromise = this._doInitialize();
    
    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }
  
  async _doInitialize() {
    console.log('🔌 Initializing Plugin Manager...');

    // Ensure plugin directory exists
    await this.ensurePluginDirectory();

    // Discover plugins from filesystem (no database required)
    await this.discoverPlugins();

    // Load marketplace plugins (in-memory, no database required)
    await this.loadMarketplace();

    // Try to sync with database, but don't fail initialization if it fails
    try {
      await this.syncPluginsWithDatabase();
      await this.loadInstalledPlugins();
      await this.autoEnablePlugins();
    } catch (error) {
      console.warn('⚠️ Could not sync plugins with database:', error.message);
      console.warn('   Plugin manager will work with filesystem plugins only');
    }

    this.isInitialized = true;
    console.log(`✅ Plugin Manager initialized with ${this.plugins.size} plugins, ${this.marketplace.size} marketplace plugins`);
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
      // Try manifest.json first, then plugin.json for backward compatibility
      let manifestPath = path.join(pluginPath, 'manifest.json');
      try {
        await fs.access(manifestPath);
      } catch {
        manifestPath = path.join(pluginPath, 'plugin.json');
      }
      
      const indexPath = path.join(pluginPath, 'index.js');
      
      // Check if required files exist
      try {
        await fs.access(manifestPath);
        await fs.access(indexPath);
      } catch (error) {
        console.warn(`⚠️ Plugin ${name} missing required files (manifest.json/plugin.json or index.js)`);
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
    // Check if it's a marketplace plugin
    if (this.marketplace.has(name)) {
      return await this.installFromMarketplace(name);
    }
    
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

      // Update database
      const pluginRecord = await PluginModel.findBySlug(name);
      if (pluginRecord) {
        await pluginRecord.markInstalled();
        plugin.dbRecord = pluginRecord;
      }

      // Mark as installed in memory
      plugin.isInstalled = true;
      this.installedPlugins.set(name, plugin);

      console.log(`✅ Plugin ${name} installed successfully`);
      
      // Emit hook
      await this.emitHook('plugin:installed', { plugin, name });
      
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to install plugin ${name}:`, error.message);
      
      // Update database with error
      const pluginRecord = await PluginModel.findBySlug(name);
      if (pluginRecord) {
        await pluginRecord.update({
          status: 'error',
          installationLog: `Installation failed: ${error.message}`
        });
      }
      
      throw error;
    }
  }

  /**
   * Uninstall a plugin (enhanced with cleanup options)
   */
  async uninstallPlugin(name, options = {}) {
    return await this.uninstaller.uninstallPlugin(name, options);
  }

  /**
   * Legacy uninstall method (basic removal)
   */
  async basicUninstallPlugin(name) {
    const plugin = this.installedPlugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} is not installed`);
    }

    console.log(`🗑️ Basic uninstalling plugin: ${name}`);

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
   * Remove plugin from installed list (used by uninstaller)
   */
  async removeFromInstalled(name) {
    this.installedPlugins.delete(name);
    await this.savePluginConfig();
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
   * Sync filesystem plugins with database
   */
  async syncPluginsWithDatabase() {
    try {
      // Discover plugins from filesystem
      await this.discoverPlugins();
      
      // Define built-in plugins that should be marked as installed
      const builtInPlugins = ['akeneo'];
      
      // Sync each discovered plugin with database
      for (const [name, plugin] of this.plugins.entries()) {
        try {
          const isBuiltIn = builtInPlugins.includes(name);
          
          await PluginModel.createOrUpdate({
            name: plugin.manifest.name || name,
            slug: name,
            version: plugin.manifest.version || '1.0.0',
            description: plugin.manifest.description || '',
            author: plugin.manifest.author || 'Unknown',
            category: plugin.manifest.category || 'other',
            type: plugin.manifest.type || 'plugin',
            sourceType: 'local',
            installPath: plugin.pluginPath,
            status: isBuiltIn ? 'installed' : 'available',
            isInstalled: isBuiltIn,
            isEnabled: isBuiltIn,
            configSchema: plugin.manifest.config || {},
            dependencies: plugin.manifest.dependencies || {},
            permissions: plugin.manifest.permissions || [],
            manifest: plugin.manifest,
            installedAt: isBuiltIn ? new Date() : null,
            enabledAt: isBuiltIn ? new Date() : null
          });
          
          // Mark built-in plugins as installed and enabled in memory
          if (isBuiltIn) {
            plugin.isInstalled = true;
            plugin.isEnabled = true;
            this.installedPlugins.set(name, plugin);
            this.enabledPlugins.set(name, plugin);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to sync plugin ${name} with database:`, error.message);
        }
      }
      
      console.log(`🔄 Synced ${this.plugins.size} filesystem plugins with database`);
    } catch (error) {
      console.error('❌ Failed to sync plugins with database:', error.message);
    }
  }

  /**
   * Load installed plugins from database
   */
  async loadInstalledPlugins() {
    try {
      const installedPlugins = await PluginModel.findInstalled();
      
      for (const pluginRecord of installedPlugins) {
        const plugin = this.plugins.get(pluginRecord.slug);
        if (plugin) {
          this.installedPlugins.set(pluginRecord.slug, plugin);
          plugin.isInstalled = true;
          plugin.dbRecord = pluginRecord;
          
          if (pluginRecord.isEnabled) {
            this.enabledPlugins.set(pluginRecord.slug, plugin);
            plugin.isEnabled = true;
          }
        }
      }
      
      console.log(`📦 Loaded ${this.installedPlugins.size} installed plugins from database`);
    } catch (error) {
      console.error('❌ Failed to load installed plugins:', error.message);
    }
  }

  /**
   * Load marketplace plugins
   */
  async loadMarketplace() {
    try {
      // TODO: Load from actual marketplace registry
      // For now, just load GitHub plugins or known registry
      const marketplacePlugins = [
        {
          name: 'Google Analytics 4',
          slug: 'google-analytics-4',
          description: 'Integrate Google Analytics 4 for advanced tracking',
          author: 'Catalyst Team',
          category: 'analytics',
          version: '1.0.0',
          sourceType: 'github',
          sourceUrl: 'https://github.com/catalyst-plugins/google-analytics-4',
          status: 'available'
        },
        {
          name: 'Stripe Payment Gateway',
          slug: 'stripe-payment',
          description: 'Accept payments through Stripe',
          author: 'Catalyst Team',
          category: 'payment',
          version: '2.0.0',
          sourceType: 'github',
          sourceUrl: 'https://github.com/catalyst-plugins/stripe-payment',
          status: 'available'
        }
      ];
      
      for (const plugin of marketplacePlugins) {
        this.marketplace.set(plugin.slug, plugin);
      }
      
      console.log(`🏪 Loaded ${this.marketplace.size} marketplace plugins`);
    } catch (error) {
      console.error('❌ Failed to load marketplace:', error.message);
    }
  }

  /**
   * Install plugin from GitHub
   */
  async installFromGitHub(githubUrl, options = {}) {
    try {
      console.log(`📥 Installing plugin from GitHub: ${githubUrl}`);
      
      // Parse GitHub URL
      const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub URL format');
      }
      
      const [, owner, repo] = urlMatch;
      const pluginName = repo.replace(/[^a-zA-Z0-9-]/g, '');
      const pluginPath = path.join(this.pluginDirectory, pluginName);
      
      // Create database record first
      const pluginRecord = await PluginModel.create({
        name: pluginName,
        slug: pluginName,
        version: '0.0.0', // Will be updated after cloning
        description: 'Installing from GitHub...',
        author: owner,
        category: 'unknown',
        sourceType: 'github',
        sourceUrl: githubUrl,
        installPath: pluginPath,
        status: 'installing',
        installationLog: `Starting installation from ${githubUrl}`
      });
      
      try {
        // Clone the repository
        const cloneCmd = `git clone ${githubUrl} "${pluginPath}"`;
        const { stdout, stderr } = await execAsync(cloneCmd);
        
        // Check if plugin.json exists
        const manifestPath = path.join(pluginPath, 'plugin.json');
        try {
          await fs.access(manifestPath);
        } catch (error) {
          throw new Error('Plugin manifest (plugin.json) not found in repository');
        }
        
        // Load and validate manifest
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        if (!manifest.name || !manifest.version) {
          throw new Error('Invalid plugin manifest: missing name or version');
        }
        
        // Update database record with manifest data
        await pluginRecord.update({
          name: manifest.name,
          version: manifest.version,
          description: manifest.description || '',
          category: manifest.category || 'other',
          type: manifest.type || 'plugin',
          configSchema: manifest.config || {},
          dependencies: manifest.dependencies || {},
          permissions: manifest.permissions || [],
          manifest: manifest,
          status: 'installed',
          isInstalled: true,
          installedAt: new Date(),
          installationLog: `Successfully installed from ${githubUrl}\n\nClone output:\n${stdout}\n${stderr}`
        });
        
        // Load the plugin
        await this.loadPlugin(pluginName, pluginPath);
        const plugin = this.plugins.get(pluginName);
        if (plugin) {
          plugin.isInstalled = true;
          plugin.dbRecord = pluginRecord;
          this.installedPlugins.set(pluginName, plugin);
        }
        
        console.log(`✅ Successfully installed plugin ${manifest.name} v${manifest.version} from GitHub`);
        
        return {
          success: true,
          plugin: pluginRecord,
          message: `Plugin ${manifest.name} installed successfully`
        };
        
      } catch (installError) {
        // Update database with error
        await pluginRecord.update({
          status: 'error',
          installationLog: `Installation failed: ${installError.message}`
        });
        
        // Clean up failed installation
        try {
          await fs.rmdir(pluginPath, { recursive: true });
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to clean up ${pluginPath}:`, cleanupError.message);
        }
        
        throw installError;
      }
      
    } catch (error) {
      console.error(`❌ GitHub installation failed:`, error.message);
      throw new Error(`GitHub installation failed: ${error.message}`);
    }
  }

  /**
   * Install plugin from marketplace
   */
  async installFromMarketplace(pluginSlug, options = {}) {
    const marketplacePlugin = this.marketplace.get(pluginSlug);
    if (!marketplacePlugin) {
      throw new Error(`Plugin ${pluginSlug} not found in marketplace`);
    }
    
    if (marketplacePlugin.sourceType === 'github') {
      return await this.installFromGitHub(marketplacePlugin.sourceUrl, options);
    } else {
      throw new Error(`Unsupported marketplace source type: ${marketplacePlugin.sourceType}`);
    }
  }

  /**
   * Get all plugins (filesystem + marketplace)
   */
  getAllPlugins() {
    const result = [];
    
    // Add filesystem plugins
    for (const [name, plugin] of this.plugins.entries()) {
      result.push({
        name: plugin.manifest?.name || name,
        slug: name,
        ...plugin.getStatus(),
        manifest: plugin.manifest,
        source: 'local'
      });
    }
    
    // Add marketplace plugins that aren't installed
    for (const [slug, marketplacePlugin] of this.marketplace.entries()) {
      if (!this.plugins.has(slug)) {
        result.push({
          ...marketplacePlugin,
          isInstalled: false,
          isEnabled: false,
          source: 'marketplace'
        });
      }
    }
    
    return result;
  }

  /**
   * Get plugin manager status
   */
  getStatus() {
    return {
      totalPlugins: this.plugins.size,
      installedPlugins: this.installedPlugins.size,
      enabledPlugins: this.enabledPlugins.size,
      marketplacePlugins: this.marketplace.size,
      pluginDirectory: this.pluginDirectory,
      plugins: this.getAllPlugins()
    };
  }
}

// Singleton instance
const pluginManager = new PluginManager();

module.exports = pluginManager;