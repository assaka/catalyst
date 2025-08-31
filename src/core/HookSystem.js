/**
 * Core Hook System
 * Provides extensible hook points throughout the application
 */

class HookSystem {
  constructor() {
    this.hooks = new Map();
    this.middleware = new Map();
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Register a hook handler
   */
  register(hookName, handler, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    const handlers = this.hooks.get(hookName);
    handlers.push({ handler, priority });
    
    // Sort by priority (lower number = higher priority)
    handlers.sort((a, b) => a.priority - b.priority);
    
    if (this.debug) {
      console.log(`🪝 Hook registered: ${hookName} (priority: ${priority})`);
    }
    
    return () => this.unregister(hookName, handler);
  }

  /**
   * Unregister a hook handler
   */
  unregister(hookName, handler) {
    if (!this.hooks.has(hookName)) return;
    
    const handlers = this.hooks.get(hookName);
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      if (this.debug) {
        console.log(`🪝 Hook unregistered: ${hookName}`);
      }
    }
  }

  /**
   * Apply a filter hook - transforms a value through registered handlers
   */
  apply(hookName, value, ...args) {
    if (!this.hooks.has(hookName)) {
      return value;
    }
    
    const handlers = this.hooks.get(hookName);
    let result = value;
    
    if (this.debug) {
      console.log(`🪝 Applying filter hook: ${hookName}`, { originalValue: value, handlers: handlers.length });
    }
    
    for (const { handler } of handlers) {
      try {
        const newResult = handler(result, ...args);
        if (newResult !== undefined) {
          result = newResult;
        }
      } catch (error) {
        console.error(`❌ Hook handler error in ${hookName}:`, error);
        // Continue with other handlers
      }
    }
    
    if (this.debug && result !== value) {
      console.log(`🪝 Hook ${hookName} transformed:`, { from: value, to: result });
    }
    
    return result;
  }

  /**
   * Execute an action hook - runs handlers without expecting return values
   */
  do(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return;
    }
    
    const handlers = this.hooks.get(hookName);
    
    if (this.debug) {
      console.log(`🪝 Executing action hook: ${hookName}`, { handlers: handlers.length });
    }
    
    for (const { handler } of handlers) {
      try {
        handler(...args);
      } catch (error) {
        console.error(`❌ Hook handler error in ${hookName}:`, error);
        // Continue with other handlers
      }
    }
  }

  /**
   * Async version of apply hook
   */
  async applyAsync(hookName, value, ...args) {
    if (!this.hooks.has(hookName)) {
      return value;
    }
    
    const handlers = this.hooks.get(hookName);
    let result = value;
    
    if (this.debug) {
      console.log(`🪝 Applying async filter hook: ${hookName}`, { originalValue: value, handlers: handlers.length });
    }
    
    for (const { handler } of handlers) {
      try {
        const newResult = await handler(result, ...args);
        if (newResult !== undefined) {
          result = newResult;
        }
      } catch (error) {
        console.error(`❌ Async hook handler error in ${hookName}:`, error);
        // Continue with other handlers
      }
    }
    
    return result;
  }

  /**
   * Async version of do hook
   */
  async doAsync(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return;
    }
    
    const handlers = this.hooks.get(hookName);
    
    if (this.debug) {
      console.log(`🪝 Executing async action hook: ${hookName}`, { handlers: handlers.length });
    }
    
    for (const { handler } of handlers) {
      try {
        await handler(...args);
      } catch (error) {
        console.error(`❌ Async hook handler error in ${hookName}:`, error);
        // Continue with other handlers
      }
    }
  }

  /**
   * Check if a hook has any handlers
   */
  hasHandlers(hookName) {
    return this.hooks.has(hookName) && this.hooks.get(hookName).length > 0;
  }

  /**
   * Get list of registered hooks
   */
  getRegisteredHooks() {
    return Array.from(this.hooks.keys());
  }

  /**
   * Clear all hooks (useful for testing)
   */
  clear() {
    this.hooks.clear();
    if (this.debug) {
      console.log('🧹 All hooks cleared');
    }
  }

  /**
   * Get statistics about hook usage
   */
  getStats() {
    const stats = {};
    for (const [hookName, handlers] of this.hooks) {
      stats[hookName] = handlers.length;
    }
    return stats;
  }
}

// Create singleton instance
const hookSystem = new HookSystem();

export default hookSystem;
export { HookSystem };