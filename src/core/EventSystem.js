/**
 * Core Event System
 * Provides event-driven architecture for loose coupling
 */

class EventSystem {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.debug = process.env.NODE_ENV === 'development';
    this.eventHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * Add an event listener
   */
  on(eventName, listener, priority = 10) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    const listeners = this.listeners.get(eventName);
    listeners.push({ listener, priority });
    
    // Sort by priority (lower number = higher priority)
    listeners.sort((a, b) => a.priority - b.priority);

    return () => this.off(eventName, listener);
  }

  /**
   * Add a one-time event listener
   */
  once(eventName, listener, priority = 10) {
    const onceWrapper = (...args) => {
      this.off(eventName, onceWrapper);
      listener(...args);
    };
    
    return this.on(eventName, onceWrapper, priority);
  }

  /**
   * Remove an event listener
   */
  off(eventName, listener) {
    if (!this.listeners.has(eventName)) return;
    
    const listeners = this.listeners.get(eventName);
    const index = listeners.findIndex(l => l.listener === listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit an event synchronously
   */
  emit(eventName, ...args) {
    // Record event in history
    this.recordEvent(eventName, args);
    
    if (!this.listeners.has(eventName)) {
      return;
    }
    
    const listeners = this.listeners.get(eventName);

    for (const { listener } of listeners) {
      try {
        listener(...args);
      } catch (error) {
        // Continue with other listeners
      }
    }
  }

  /**
   * Emit an event asynchronously
   */
  async emitAsync(eventName, ...args) {
    // Record event in history
    this.recordEvent(eventName, args);
    
    if (!this.listeners.has(eventName)) {
      return;
    }
    
    const listeners = this.listeners.get(eventName);

    const promises = listeners.map(async ({ listener }) => {
      try {
        await listener(...args);
      } catch (error) {
      }
    });
    
    await Promise.all(promises);
  }

  /**
   * Record event in history for debugging
   */
  recordEvent(eventName, args) {
    if (this.eventHistory.length >= this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    this.eventHistory.push({
      eventName,
      args: JSON.parse(JSON.stringify(args)), // Deep copy for safety
      timestamp: Date.now()
    });
  }

  /**
   * Check if an event has any listeners
   */
  hasListeners(eventName) {
    return this.listeners.has(eventName) && this.listeners.get(eventName).length > 0;
  }

  /**
   * Get list of events with listeners
   */
  getRegisteredEvents() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(limit = 20) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Get statistics about event usage
   */
  getStats() {
    const stats = {};
    for (const [eventName, listeners] of this.listeners) {
      stats[eventName] = listeners.length;
    }
    return {
      listeners: stats,
      totalEvents: this.listeners.size,
      historySize: this.eventHistory.length
    };
  }
}

// Create singleton instance
const eventSystem = new EventSystem();

export default eventSystem;
export { EventSystem };