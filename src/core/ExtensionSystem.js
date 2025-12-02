/**
 * Extension System
 * Manages loading and lifecycle of extension modules
 */

import hookSystem from './HookSystem.js';
import eventSystem from './EventSystem.js';

class ExtensionSystem {
  constructor() {
    this.extensions = new Map();
    this.loadedExtensions = new Set();
    this.extensionDependencies = new Map();
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Register an extension module
   */
  async register(extensionModule) {
    try {
      // Validate extension format
      this.validateExtension(extensionModule);
      
      const { name, version } = extensionModule;
      const extensionId = `${name}@${version}`;
      
      if (this.extensions.has(extensionId)) {
        throw new Error(`Extension ${extensionId} is already registered`);
      }
      
      // Check dependencies
      if (extensionModule.dependencies) {
        await this.checkDependencies(extensionModule.dependencies);
      }
      
      this.extensions.set(extensionId, extensionModule);
      
      return extensionId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load and activate an extension
   */
  async load(extensionId) {
    if (this.loadedExtensions.has(extensionId)) {
      return;
    }
    
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error(`Extension ${extensionId} not found`);
    }
    
    try {
      // Load dependencies first
      if (extension.dependencies) {
        for (const dep of extension.dependencies) {
          await this.load(dep);
        }
      }
      
      // Initialize extension
      if (extension.init) {
        await extension.init();
      }
      
      // Register hooks
      if (extension.hooks) {
        for (const [hookName, handler] of Object.entries(extension.hooks)) {
          const priority = extension.hookPriorities?.[hookName] || 10;
          hookSystem.register(hookName, handler, priority);
        }
      }
      
      // Register event listeners
      if (extension.events) {
        for (const [eventName, listener] of Object.entries(extension.events)) {
          const priority = extension.eventPriorities?.[eventName] || 10;
          eventSystem.on(eventName, listener, priority);
        }
      }
      
      this.loadedExtensions.add(extensionId);
      
      // Emit extension loaded event
      eventSystem.emit('extension.loaded', { extensionId, extension });
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Unload an extension
   */
  async unload(extensionId) {
    if (!this.loadedExtensions.has(extensionId)) {
      return;
    }
    
    const extension = this.extensions.get(extensionId);
    if (!extension) return;
    
    try {
      // Unregister hooks
      if (extension.hooks) {
        for (const [hookName, handler] of Object.entries(extension.hooks)) {
          hookSystem.unregister(hookName, handler);
        }
      }
      
      // Unregister event listeners
      if (extension.events) {
        for (const [eventName, listener] of Object.entries(extension.events)) {
          eventSystem.off(eventName, listener);
        }
      }
      
      // Call cleanup
      if (extension.cleanup) {
        await extension.cleanup();
      }
      
      this.loadedExtensions.delete(extensionId);
      
      // Emit extension unloaded event
      eventSystem.emit('extension.unloaded', { extensionId, extension });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load extensions from configuration
   */
  async loadFromConfig(extensionsConfig) {
    const loadPromises = [];
    
    for (const config of extensionsConfig) {
      if (config.enabled !== false) {
        loadPromises.push(this.loadExtensionFromConfig(config));
      }
    }
    
    await Promise.all(loadPromises);
  }

  /**
   * Load a single extension from config
   */
  async loadExtensionFromConfig(config) {
    try {
      let extension;
      
      if (config.module) {
        // Dynamic import
        const module = await import(config.module);
        extension = module.default || module;
      } else if (config.inline) {
        // Inline extension definition
        extension = config.inline;
      } else {
        throw new Error('Extension config must specify module or inline definition');
      }
      
      // Override config properties
      if (config.name) extension.name = config.name;
      if (config.version) extension.version = config.version;
      if (config.config) extension.config = { ...extension.config, ...config.config };
      
      const extensionId = await this.register(extension);
      await this.load(extensionId);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate extension format
   */
  validateExtension(extension) {
    if (!extension.name || typeof extension.name !== 'string') {
      throw new Error('Extension must have a valid name');
    }
    
    if (!extension.version || typeof extension.version !== 'string') {
      throw new Error('Extension must have a valid version');
    }
    
    // Validate hooks
    if (extension.hooks) {
      if (typeof extension.hooks !== 'object') {
        throw new Error('Extension hooks must be an object');
      }
      
      for (const [hookName, handler] of Object.entries(extension.hooks)) {
        if (typeof handler !== 'function') {
          throw new Error(`Hook ${hookName} must be a function`);
        }
      }
    }
    
    // Validate events
    if (extension.events) {
      if (typeof extension.events !== 'object') {
        throw new Error('Extension events must be an object');
      }
      
      for (const [eventName, listener] of Object.entries(extension.events)) {
        if (typeof listener !== 'function') {
          throw new Error(`Event listener ${eventName} must be a function`);
        }
      }
    }
  }

  /**
   * Check if dependencies are available
   */
  async checkDependencies(dependencies) {
    for (const dependency of dependencies) {
      if (!this.extensions.has(dependency)) {
        throw new Error(`Dependency ${dependency} not found`);
      }
    }
  }

  /**
   * Get loaded extensions
   */
  getLoadedExtensions() {
    return Array.from(this.loadedExtensions);
  }

  /**
   * Get all registered extensions
   */
  getAllExtensions() {
    return Array.from(this.extensions.keys());
  }

  /**
   * Check if extension is loaded
   */
  isLoaded(extensionId) {
    return this.loadedExtensions.has(extensionId);
  }

  /**
   * Get extension info
   */
  getExtensionInfo(extensionId) {
    const extension = this.extensions.get(extensionId);
    if (!extension) return null;
    
    return {
      id: extensionId,
      name: extension.name,
      version: extension.version,
      description: extension.description,
      loaded: this.isLoaded(extensionId),
      dependencies: extension.dependencies || [],
      hooks: extension.hooks ? Object.keys(extension.hooks) : [],
      events: extension.events ? Object.keys(extension.events) : []
    };
  }

  /**
   * Get system statistics
   */
  getStats() {
    return {
      totalExtensions: this.extensions.size,
      loadedExtensions: this.loadedExtensions.size,
      unloadedExtensions: this.extensions.size - this.loadedExtensions.size
    };
  }
}

// Create singleton instance
const extensionSystem = new ExtensionSystem();

export default extensionSystem;
export { ExtensionSystem };