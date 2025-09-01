/**
 * Configuration Merger - Deep merges user configs with core defaults
 * Handles complex merging scenarios for the slot system
 */

class ConfigMerger {
  /**
   * Deep merge user configuration with default configuration
   * @param {Object} defaultConfig - Base configuration
   * @param {Object} userConfig - User overrides
   * @returns {Object} Merged configuration
   */
  merge(defaultConfig = {}, userConfig = {}) {
    return this.deepMerge(defaultConfig, userConfig);
  }

  /**
   * Deep merge two objects, with special handling for arrays and functions
   * @param {any} target - Target object to merge into
   * @param {any} source - Source object to merge from
   * @returns {any} Merged result
   */
  deepMerge(target, source) {
    // Handle null/undefined cases
    if (!source) return target;
    if (!target) return source;

    // Handle non-object types
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source; // Source overwrites target for primitives
    }

    // Handle arrays - replace rather than merge
    if (Array.isArray(target) || Array.isArray(source)) {
      return Array.isArray(source) ? [...source] : source;
    }

    // Handle Date objects
    if (target instanceof Date || source instanceof Date) {
      return source instanceof Date ? new Date(source) : source;
    }

    // Deep merge objects
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] !== undefined) {
        if (key in result && typeof result[key] === 'object' && typeof source[key] === 'object') {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    });

    return result;
  }

  /**
   * Merge slot configurations with special handling for slot-specific properties
   * @param {Object} defaultSlotConfig - Default slot configuration
   * @param {Object} userSlotConfig - User slot overrides
   * @returns {Object} Merged slot configuration
   */
  mergeSlotConfig(defaultSlotConfig = {}, userSlotConfig = {}) {
    const merged = this.deepMerge(defaultSlotConfig, userSlotConfig);

    // Special handling for certain slot properties
    return {
      ...merged,
      
      // Order should be a simple override, not a merge
      order: userSlotConfig.order !== undefined ? userSlotConfig.order : defaultSlotConfig.order,
      
      // Enabled should be a boolean override
      enabled: userSlotConfig.enabled !== undefined ? userSlotConfig.enabled : defaultSlotConfig.enabled,
      
      // Props should be deeply merged
      props: this.deepMerge(defaultSlotConfig.props || {}, userSlotConfig.props || {}),
      
      // Component should be a simple override
      component: userSlotConfig.component || defaultSlotConfig.component,
      
      // Required should not be overrideable by users
      required: defaultSlotConfig.required
    };
  }

  /**
   * Validate merged configuration
   * @param {Object} mergedConfig - Configuration to validate
   * @returns {Object} Validation result with errors
   */
  validateConfig(mergedConfig) {
    const errors = [];
    const warnings = [];

    // Check for required fields
    if (!mergedConfig.version) {
      warnings.push('Configuration missing version field');
    }

    // Validate slots
    if (mergedConfig.slots) {
      Object.entries(mergedConfig.slots).forEach(([slotId, slotConfig]) => {
        // Validate slot ID format
        if (!this.isValidSlotId(slotId)) {
          errors.push(`Invalid slot ID format: ${slotId}. Should match pattern: domain.component.section[.element]`);
        }

        // Validate slot configuration
        const slotValidation = this.validateSlotConfig(slotId, slotConfig);
        if (!slotValidation.valid) {
          errors.push(...slotValidation.errors);
        }
        warnings.push(...(slotValidation.warnings || []));
      });
    }

    // Validate custom components
    if (mergedConfig.components) {
      Object.entries(mergedConfig.components).forEach(([componentName, componentConfig]) => {
        if (!componentConfig.type) {
          errors.push(`Component ${componentName} missing type field`);
        }
        
        if (!componentConfig.source) {
          errors.push(`Component ${componentName} missing source field`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate slot ID format
   * @param {string} slotId - Slot identifier to validate
   * @returns {boolean} Is valid
   */
  isValidSlotId(slotId) {
    // Format: domain.component.section[.element]
    // Examples: product.card.image, checkout.address.shipping.form
    const parts = slotId.split('.');
    return parts.length >= 3 && parts.length <= 5 && parts.every(part => part.length > 0);
  }

  /**
   * Validate individual slot configuration
   * @param {string} slotId - Slot identifier
   * @param {Object} slotConfig - Slot configuration
   * @returns {Object} Validation result
   */
  validateSlotConfig(slotId, slotConfig) {
    const errors = [];
    const warnings = [];

    // Check order is a number
    if (slotConfig.order !== undefined && typeof slotConfig.order !== 'number') {
      errors.push(`Slot ${slotId}: order must be a number`);
    }

    // Check enabled is a boolean
    if (slotConfig.enabled !== undefined && typeof slotConfig.enabled !== 'boolean') {
      errors.push(`Slot ${slotId}: enabled must be a boolean`);
    }

    // Check component is a string
    if (slotConfig.component !== undefined && typeof slotConfig.component !== 'string') {
      errors.push(`Slot ${slotId}: component must be a string`);
    }

    // Check props is an object
    if (slotConfig.props !== undefined && (typeof slotConfig.props !== 'object' || Array.isArray(slotConfig.props))) {
      errors.push(`Slot ${slotId}: props must be an object`);
    }

    // Warn about unknown properties
    const knownProperties = ['order', 'enabled', 'component', 'props', 'required'];
    Object.keys(slotConfig).forEach(key => {
      if (!knownProperties.includes(key)) {
        warnings.push(`Slot ${slotId}: unknown property '${key}'`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a configuration diff showing what changed
   * @param {Object} oldConfig - Previous configuration
   * @param {Object} newConfig - New configuration
   * @returns {Object} Configuration diff
   */
  createConfigDiff(oldConfig = {}, newConfig = {}) {
    const diff = {
      added: {},
      modified: {},
      removed: {},
      unchanged: {}
    };

    // Find all unique keys
    const allKeys = new Set([
      ...Object.keys(oldConfig.slots || {}),
      ...Object.keys(newConfig.slots || {})
    ]);

    allKeys.forEach(slotId => {
      const oldSlot = oldConfig.slots?.[slotId];
      const newSlot = newConfig.slots?.[slotId];

      if (!oldSlot && newSlot) {
        diff.added[slotId] = newSlot;
      } else if (oldSlot && !newSlot) {
        diff.removed[slotId] = oldSlot;
      } else if (oldSlot && newSlot) {
        const slotsEqual = JSON.stringify(oldSlot) === JSON.stringify(newSlot);
        if (slotsEqual) {
          diff.unchanged[slotId] = newSlot;
        } else {
          diff.modified[slotId] = {
            old: oldSlot,
            new: newSlot
          };
        }
      }
    });

    return diff;
  }
}

// Create singleton instance
const configMerger = new ConfigMerger();

export default configMerger;