/**
 * Slot Registry - Core system for managing component slots
 * Replaces the fragile diff-based customization system
 */

class SlotRegistry {
  constructor() {
    this.defaultComponents = new Map();
    this.userOverrides = new Map();
    this.slotConfigurations = new Map();
    this.componentSlots = new Map();
  }

  /**
   * Register a default component for a slot
   * @param {string} slotId - Unique slot identifier (e.g., 'product.card.image')
   * @param {React.ComponentType} component - Default React component
   * @param {Object} config - Slot configuration
   */
  register(slotId, component, config = {}) {
    const defaultConfig = {
      order: 1,
      required: false,
      defaultProps: {},
      validation: null,
      ...config
    };

    this.defaultComponents.set(slotId, component);
    this.slotConfigurations.set(slotId, defaultConfig);

    // Track which slots belong to which component
    const [domain, componentName] = slotId.split('.');
    const componentKey = `${domain}.${componentName}`;
    
    if (!this.componentSlots.has(componentKey)) {
      this.componentSlots.set(componentKey, new Set());
    }
    this.componentSlots.get(componentKey).add(slotId);

    console.log(`📝 Registered slot: ${slotId}`);
  }

  /**
   * Get component for a slot (considering user overrides)
   * @param {string} slotId - Slot identifier
   * @param {Object} context - Rendering context
   * @returns {React.ComponentType|null}
   */
  getComponent(slotId, context = {}) {
    // Check user overrides first
    const userOverride = this.userOverrides.get(slotId);
    if (userOverride && userOverride.enabled !== false) {
      const customComponent = this.resolveCustomComponent(userOverride.component);
      if (customComponent) {
        return customComponent;
      }
    }

    // Fall back to default component
    return this.defaultComponents.get(slotId) || null;
  }

  /**
   * Get slot configuration including user props
   * @param {string} slotId - Slot identifier
   * @returns {Object}
   */
  getSlotConfig(slotId) {
    const defaultConfig = this.slotConfigurations.get(slotId) || {};
    const userOverride = this.userOverrides.get(slotId) || {};

    return {
      ...defaultConfig,
      ...userOverride,
      props: {
        ...defaultConfig.defaultProps,
        ...userOverride.props
      }
    };
  }

  /**
   * Apply user configuration
   * @param {Object} userConfig - User slot configuration
   */
  applyUserConfig(userConfig) {
    if (!userConfig || !userConfig.slots) {
      console.warn('⚠️ Invalid user config provided to SlotRegistry');
      return;
    }

    console.log(`🔧 Applying user config with ${Object.keys(userConfig.slots).length} slot overrides`);

    // Clear existing user overrides
    this.userOverrides.clear();

    // Apply new overrides
    Object.entries(userConfig.slots).forEach(([slotId, override]) => {
      this.userOverrides.set(slotId, override);
    });

    // Store custom components if provided
    if (userConfig.components) {
      this.customComponents = userConfig.components;
    }
  }

  /**
   * Get all slots for a component
   * @param {string} componentName - Component name (e.g., 'product.card')
   * @returns {Array}
   */
  getSlotsForComponent(componentName) {
    const slots = this.componentSlots.get(componentName);
    if (!slots) return [];

    return Array.from(slots).sort((a, b) => {
      const configA = this.getSlotConfig(a);
      const configB = this.getSlotConfig(b);
      return (configA.order || 1) - (configB.order || 1);
    });
  }

  /**
   * Get all enabled slots for a component with their configs
   * @param {string} componentName - Component name
   * @returns {Array}
   */
  getEnabledSlotsForComponent(componentName) {
    const slotIds = this.getSlotsForComponent(componentName);
    
    return slotIds
      .map(slotId => ({
        slotId,
        component: this.getComponent(slotId),
        config: this.getSlotConfig(slotId)
      }))
      .filter(slot => slot.config.enabled !== false && slot.component)
      .sort((a, b) => (a.config.order || 1) - (b.config.order || 1));
  }

  /**
   * Validate a slot configuration
   * @param {string} slotId - Slot identifier
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result
   */
  validateSlotConfig(slotId, config) {
    const slotConfig = this.slotConfigurations.get(slotId);
    
    if (!slotConfig) {
      return {
        valid: false,
        errors: [`Slot ${slotId} is not registered`]
      };
    }

    const errors = [];

    // Check required fields
    if (slotConfig.required && config.enabled === false) {
      errors.push(`Slot ${slotId} is required and cannot be disabled`);
    }

    // Run custom validation if provided
    if (slotConfig.validation && typeof slotConfig.validation === 'function') {
      const validationResult = slotConfig.validation(config);
      if (!validationResult.valid) {
        errors.push(...validationResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Resolve custom component from configuration
   * @param {string} componentName - Custom component name
   * @returns {React.ComponentType|null}
   */
  resolveCustomComponent(componentName) {
    // In a real implementation, this would load custom components
    // from user-provided sources (files, CDN, etc.)
    
    if (this.customComponents && this.customComponents[componentName]) {
      const componentConfig = this.customComponents[componentName];
      
      // For now, return null - this will be implemented in Phase 4
      // when we build the full custom component loading system
      console.log(`🔄 Would load custom component: ${componentName}`, componentConfig);
      return null;
    }

    return null;
  }

  /**
   * Export current registry state for debugging
   * @returns {Object}
   */
  exportState() {
    return {
      defaultComponents: Array.from(this.defaultComponents.keys()),
      userOverrides: Object.fromEntries(this.userOverrides),
      slotConfigurations: Object.fromEntries(this.slotConfigurations),
      componentSlots: Object.fromEntries(
        Array.from(this.componentSlots.entries()).map(([key, set]) => [
          key,
          Array.from(set)
        ])
      )
    };
  }

  /**
   * Clear all registrations (for testing)
   */
  clear() {
    this.defaultComponents.clear();
    this.userOverrides.clear();
    this.slotConfigurations.clear();
    this.componentSlots.clear();
    this.customComponents = {};
  }
}

// Create singleton instance
const slotRegistry = new SlotRegistry();

export default slotRegistry;