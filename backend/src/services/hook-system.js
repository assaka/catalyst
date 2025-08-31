/**
 * Hook System Service
 * Provides extensible event/hook functionality for the customization system
 */

class HookSystem {
  constructor() {
    this.hooks = new Map();
    this.filters = new Map();
  }

  /**
   * Register a hook handler
   */
  register(hookName, handler, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const handlers = this.hooks.get(hookName);
    handlers.push({
      handler,
      priority
    });

    // Sort by priority (lower numbers = higher priority)
    handlers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute a hook (action hook)
   */
  do(hookName, data = {}) {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) {
      return;
    }

    for (const { handler } of handlers) {
      try {
        if (typeof handler === 'function') {
          handler(data);
        }
      } catch (error) {
        console.error(`❌ Error executing hook ${hookName}:`, error);
      }
    }
  }

  /**
   * Apply a filter hook
   */
  apply(hookName, value, ...args) {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) {
      return value;
    }

    let result = value;
    for (const { handler } of handlers) {
      try {
        if (typeof handler === 'function') {
          result = handler(result, ...args);
        }
      } catch (error) {
        console.error(`❌ Error applying filter ${hookName}:`, error);
      }
    }

    return result;
  }

  /**
   * Remove a hook handler
   */
  remove(hookName, handler) {
    const handlers = this.hooks.get(hookName);
    if (!handlers) {
      return false;
    }

    const index = handlers.findIndex(h => h.handler === handler);
    if (index > -1) {
      handlers.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Remove all handlers for a hook
   */
  removeAll(hookName) {
    return this.hooks.delete(hookName);
  }

  /**
   * Get all registered hooks
   */
  getHooks() {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get handlers for a specific hook
   */
  getHandlers(hookName) {
    return this.hooks.get(hookName) || [];
  }

  /**
   * Check if a hook has handlers
   */
  hasHandlers(hookName) {
    const handlers = this.hooks.get(hookName);
    return handlers && handlers.length > 0;
  }
}

module.exports = new HookSystem();