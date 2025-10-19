/**
 * Plugin Module Loader
 * Loads and manages plugin modules from database with virtual module system
 */

class PluginModuleLoader {
  constructor(db, pluginRegistry) {
    this.db = db;
    this.pluginRegistry = pluginRegistry;
    this.moduleCache = new Map(); // Cache loaded modules
    this.dependencyCache = new Map(); // Cache npm dependencies
    this.pluginContexts = new Map(); // Plugin execution contexts
  }

  /**
   * Load a complete plugin with all its modules, dependencies, hooks, and events
   */
  async loadPlugin(pluginId) {
    console.log(`📦 Loading plugin: ${pluginId}`);

    try {
      // 1. Get plugin metadata
      const pluginResult = await this.db.query(
        'SELECT * FROM plugin_registry WHERE id = $1 AND status = $2',
        [pluginId, 'active']
      );

      if (pluginResult.rows.length === 0) {
        throw new Error(`Plugin ${pluginId} not found or not active`);
      }

      const plugin = pluginResult.rows[0];

      // 2. Create plugin execution context
      const context = this.createPluginContext(pluginId, plugin);

      // 3. Load dependencies first
      const dependencies = await this.pluginRegistry.getPluginDependencies(pluginId);
      for (const dep of dependencies) {
        await this.loadDependency(dep, context);
      }

      // 4. Load plugin scripts/modules in order
      const scripts = await this.pluginRegistry.getPluginScripts(pluginId);
      for (const script of scripts) {
        await this.loadModule(script, context);
      }

      // 5. Load hooks
      const hooks = await this.pluginRegistry.getPluginHooks(pluginId);
      for (const hook of hooks) {
        await this.loadHook(hook, context);
      }

      // 6. Load events
      const events = await this.db.query(
        'SELECT * FROM plugin_events WHERE plugin_id = $1 AND is_enabled = true ORDER BY priority ASC',
        [pluginId]
      );
      for (const event of events.rows) {
        await this.loadEvent(event, context);
      }

      // Store context
      this.pluginContexts.set(pluginId, context);

      console.log(`✅ Plugin loaded successfully: ${plugin.name}`);
      return { success: true, context };
    } catch (error) {
      console.error(`❌ Error loading plugin ${pluginId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create isolated execution context for a plugin
   */
  createPluginContext(pluginId, plugin) {
    const modules = new Map();
    const hooks = new Map();
    const events = new Map();

    // Create require function for this plugin
    const require = (modulePath) => {
      // Check if it's an external dependency
      if (this.dependencyCache.has(modulePath)) {
        return this.dependencyCache.get(modulePath);
      }

      // Check if it's an internal module
      const normalizedPath = this.normalizeModulePath(modulePath);
      if (modules.has(normalizedPath)) {
        return modules.get(normalizedPath);
      }

      // Try with plugin prefix
      const pluginModulePath = `${pluginId}/${normalizedPath}`;
      if (modules.has(pluginModulePath)) {
        return modules.get(pluginModulePath);
      }

      throw new Error(`Module not found: ${modulePath}`);
    };

    // Plugin data storage API
    const pluginData = {
      get: async (key) => {
        return await this.pluginRegistry.getPluginData(pluginId, key);
      },
      set: async (key, value, expiresAt = null) => {
        return await this.pluginRegistry.setPluginData(pluginId, key, value, expiresAt);
      },
      delete: async (key) => {
        return await this.pluginRegistry.deletePluginData(pluginId, key);
      }
    };

    return {
      pluginId,
      plugin,
      modules,
      hooks,
      events,
      require,
      pluginData,
      // Safe globals
      console,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      Promise,
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean
    };
  }

  /**
   * Normalize module path (handle ./, ../, etc.)
   */
  normalizeModulePath(modulePath) {
    // Remove leading ./
    let normalized = modulePath.replace(/^\.\//, '');

    // Remove .js extension if present
    normalized = normalized.replace(/\.js$/, '');

    return normalized;
  }

  /**
   * Load an npm dependency into the context
   */
  async loadDependency(dep, context) {
    try {
      const packageName = dep.package_name;

      // Check if already loaded
      if (this.dependencyCache.has(packageName)) {
        return;
      }

      console.log(`  📚 Loading dependency: ${packageName}@${dep.version}`);

      // Execute bundled dependency code
      const func = new Function('module', 'exports', 'require', 'console', dep.bundled_code);
      const module = { exports: {} };
      func(module, module.exports, context.require, console);

      // Cache the dependency
      this.dependencyCache.set(packageName, module.exports);

      console.log(`  ✅ Dependency loaded: ${packageName}`);
    } catch (error) {
      console.error(`  ❌ Error loading dependency ${dep.package_name}:`, error);
      throw error;
    }
  }

  /**
   * Load a plugin module/script
   */
  async loadModule(script, context) {
    try {
      const moduleName = script.file_name;
      console.log(`  📄 Loading module: ${moduleName}`);

      // Transform ES6 syntax to CommonJS
      const transformedCode = this.transformModuleCode(script.file_content);

      // Create module object
      const module = { exports: {} };
      const exports = module.exports;

      // Execute module in isolated context
      const func = new Function(
        'module',
        'exports',
        'require',
        'console',
        'pluginData',
        'setTimeout',
        'setInterval',
        'clearTimeout',
        'clearInterval',
        'Promise',
        'JSON',
        'Math',
        'Date',
        transformedCode
      );

      func(
        module,
        exports,
        context.require,
        console,
        context.pluginData,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Promise,
        JSON,
        Math,
        Date
      );

      // Store module in context
      const normalizedName = this.normalizeModulePath(moduleName);
      context.modules.set(normalizedName, module.exports);
      context.modules.set(`./${normalizedName}`, module.exports);
      context.modules.set(`${context.pluginId}/${normalizedName}`, module.exports);

      console.log(`  ✅ Module loaded: ${moduleName}`);
      return module.exports;
    } catch (error) {
      console.error(`  ❌ Error loading module ${script.name}:`, error);
      throw error;
    }
  }

  /**
   * Transform ES6 imports/exports to CommonJS
   */
  transformModuleCode(code) {
    let transformed = code;

    // import X from 'Y' → const X = require('Y')
    transformed = transformed.replace(
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      'const $1 = require("$2")'
    );

    // import { X, Y } from 'Z' → const { X, Y } = require('Z')
    transformed = transformed.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
      'const {$1} = require("$2")'
    );

    // import * as X from 'Y' → const X = require('Y')
    transformed = transformed.replace(
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      'const $1 = require("$2")'
    );

    // export default X → module.exports = X
    transformed = transformed.replace(
      /export\s+default\s+/g,
      'module.exports = '
    );

    // export { X, Y } → module.exports = { X, Y }
    transformed = transformed.replace(
      /export\s+\{([^}]+)\}/g,
      'module.exports = {$1}'
    );

    // export const X = ... → const X = ...; module.exports.X = X
    transformed = transformed.replace(
      /export\s+const\s+(\w+)\s*=/g,
      (match, varName) => `const ${varName} =`
    );

    // Add exports for named exports
    const exportMatches = code.matchAll(/export\s+const\s+(\w+)/g);
    const exportedVars = Array.from(exportMatches, m => m[1]);
    if (exportedVars.length > 0) {
      transformed += `\n\n// Auto-generated exports\n`;
      exportedVars.forEach(varName => {
        transformed += `module.exports.${varName} = ${varName};\n`;
      });
    }

    // export function X → function X ...; module.exports.X = X
    transformed = transformed.replace(
      /export\s+function\s+(\w+)/g,
      (match, funcName) => `function ${funcName}`
    );

    const funcMatches = code.matchAll(/export\s+function\s+(\w+)/g);
    const exportedFuncs = Array.from(funcMatches, m => m[1]);
    if (exportedFuncs.length > 0) {
      exportedFuncs.forEach(funcName => {
        transformed += `\nmodule.exports.${funcName} = ${funcName};`;
      });
    }

    // export class X → class X ...; module.exports = X
    transformed = transformed.replace(
      /export\s+default\s+class\s+(\w+)/g,
      (match, className) => `class ${className}`
    );

    return transformed;
  }

  /**
   * Load a hook and register it
   */
  async loadHook(hook, context) {
    try {
      console.log(`  🪝 Loading hook: ${hook.hook_name}`);

      const transformedCode = this.transformModuleCode(hook.handler_function);

      // Execute hook code
      const func = new Function(
        'module',
        'exports',
        'require',
        'console',
        'pluginData',
        transformedCode
      );

      const module = { exports: {} };
      func(module, module.exports, context.require, console, context.pluginData);

      // Store hook handler
      const handler = module.exports.default || module.exports;
      context.hooks.set(hook.hook_name, {
        handler,
        priority: hook.priority,
        enabled: hook.is_enabled
      });

      console.log(`  ✅ Hook loaded: ${hook.hook_name}`);
    } catch (error) {
      console.error(`  ❌ Error loading hook ${hook.hook_name}:`, error);
      throw error;
    }
  }

  /**
   * Load an event listener and register it
   */
  async loadEvent(event, context) {
    try {
      console.log(`  📡 Loading event: ${event.event_name}`);

      const transformedCode = this.transformModuleCode(event.listener_function);

      // Execute event code
      const func = new Function(
        'module',
        'exports',
        'require',
        'console',
        'pluginData',
        transformedCode
      );

      const module = { exports: {} };
      func(module, module.exports, context.require, console, context.pluginData);

      // Store event listener
      const listener = module.exports.default || module.exports;
      context.events.set(event.event_name, {
        listener,
        priority: event.priority,
        enabled: event.is_enabled
      });

      console.log(`  ✅ Event loaded: ${event.event_name}`);
    } catch (error) {
      console.error(`  ❌ Error loading event ${event.event_name}:`, error);
      throw error;
    }
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName, ...args) {
    const results = [];

    for (const [pluginId, context] of this.pluginContexts) {
      if (context.hooks.has(hookName)) {
        const { handler, enabled } = context.hooks.get(hookName);

        // Skip if disabled
        if (!enabled) continue;

        try {
          const result = await handler.apply(context, args);
          results.push({ pluginId, result });
        } catch (error) {
          console.error(`Error executing hook ${hookName} in plugin ${pluginId}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Emit an event to all listeners
   */
  async emitEvent(eventName, data) {
    const listeners = [];

    // Collect all listeners for this event
    for (const [pluginId, context] of this.pluginContexts) {
      if (context.events.has(eventName)) {
        const { listener, priority, enabled } = context.events.get(eventName);

        // Skip if disabled
        if (!enabled) continue;

        listeners.push({ pluginId, listener, priority });
      }
    }

    // Sort by priority
    listeners.sort((a, b) => a.priority - b.priority);

    // Execute listeners
    for (const { pluginId, listener } of listeners) {
      try {
        const context = this.pluginContexts.get(pluginId);
        await listener.call(context, data);
      } catch (error) {
        console.error(`Error executing event ${eventName} in plugin ${pluginId}:`, error);
      }
    }
  }

  /**
   * Get plugin context
   */
  getPluginContext(pluginId) {
    return this.pluginContexts.get(pluginId);
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginId) {
    console.log(`🔄 Reloading plugin: ${pluginId}`);

    // Remove existing context
    this.pluginContexts.delete(pluginId);

    // Clear module cache for this plugin
    for (const [key] of this.moduleCache) {
      if (key.startsWith(pluginId)) {
        this.moduleCache.delete(key);
      }
    }

    // Load plugin again
    return await this.loadPlugin(pluginId);
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(pluginId) {
    console.log(`🗑️ Unloading plugin: ${pluginId}`);

    // Remove context
    this.pluginContexts.delete(pluginId);

    // Clear module cache
    for (const [key] of this.moduleCache) {
      if (key.startsWith(pluginId)) {
        this.moduleCache.delete(key);
      }
    }
  }

  /**
   * Load all active plugins
   */
  async loadAllPlugins() {
    console.log('📦 Loading all active plugins...');

    const plugins = await this.pluginRegistry.getActivePlugins();

    for (const plugin of plugins) {
      await this.loadPlugin(plugin.id);
    }

    console.log(`✅ Loaded ${plugins.length} plugins`);
  }
}

module.exports = PluginModuleLoader;
