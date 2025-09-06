/**
 * Type definitions and schemas for the Slot Configuration Editor System
 */

/**
 * @typedef {Object} SlotConfigurationSchema
 * @property {string} version - Configuration schema version
 * @property {Object<string, SlotConfiguration>} slots - Slot configurations by slot ID
 * @property {Object} [metadata] - Optional metadata about the configuration
 */

/**
 * @typedef {Object} SlotConfiguration
 * @property {boolean} [enabled=true] - Whether the slot is enabled
 * @property {number} [order] - Display order of the slot
 * @property {string} [component] - Custom component name to use
 * @property {Object} [props] - Props to pass to the slot component
 * @property {boolean} [required] - Whether the slot is required (cannot be disabled)
 */

/**
 * @typedef {Object} ComponentMetadata
 * @property {string} name - Component name (e.g., "ProductCard", "Cart")
 * @property {string} displayName - Human-readable name
 * @property {string} description - Component description
 * @property {Array<string>} availableSlots - List of available slot IDs for this component
 * @property {Object} defaultProps - Default props for testing/preview
 */

/**
 * Props interface for ConfigurationEditor
 */
export const ConfigurationEditorPropTypes = {
  /** The component's default slot configuration */
  defaultConfig: {
    type: 'object',
    required: true,
    description: 'Default slot configuration from the component registry'
  },
  
  /** Current user's override configuration */
  userConfig: {
    type: 'object',
    required: false,
    default: { version: '1.0', slots: {}, metadata: {} },
    description: 'User\'s current slot configuration overrides'
  },
  
  /** Component to configure (e.g., "ProductCard", "Cart") */
  componentName: {
    type: 'string',
    required: true,
    description: 'Name of the component being configured'
  },
  
  /** Callback fired when configuration changes */
  onChange: {
    type: 'function',
    required: true,
    description: 'Callback with (newUserConfig: Object) => void'
  },
  
  /** Available slot definitions for autocompletion */
  slotDefinitions: {
    type: 'object',
    required: false,
    description: 'Schema definitions for available slots'
  },
  
  /** Editor theme */
  theme: {
    type: 'string',
    required: false,
    default: 'vs-dark',
    description: 'Monaco editor theme'
  },
  
  /** Read-only mode */
  readOnly: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Whether the editor is read-only'
  }
};

/**
 * Props interface for ConfigurationPreview
 */
export const ConfigurationPreviewPropTypes = {
  /** The component's default slot configuration */
  defaultConfig: {
    type: 'object',
    required: true,
    description: 'Default slot configuration from the component registry'
  },
  
  /** User's configuration to preview */
  userConfig: {
    type: 'object',
    required: false,
    default: { version: '1.0', slots: {}, metadata: {} },
    description: 'User\'s slot configuration to preview'
  },
  
  /** Component name to preview */
  componentName: {
    type: 'string',
    required: true,
    description: 'Name of the component to preview (e.g., "ProductCard")'
  },
  
  /** Props to pass to the previewed component */
  componentProps: {
    type: 'object',
    required: false,
    default: {},
    description: 'Props to pass to the component being previewed'
  },
  
  /** Store context for preview */
  storeContext: {
    type: 'object',
    required: false,
    description: 'Store context needed for component preview'
  },
  
  /** Preview container className */
  className: {
    type: 'string',
    required: false,
    default: '',
    description: 'CSS classes for the preview container'
  },
  
  /** Error handler callback */
  onError: {
    type: 'function',
    required: false,
    description: 'Callback fired when preview encounters an error'
  }
};

/**
 * JSON Schema for slot configuration validation
 */
export const SlotConfigurationJSONSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$",
      "description": "Configuration schema version"
    },
    "slots": {
      "type": "object",
      "patternProperties": {
        "^[a-z]+\\.[a-z]+\\.[a-z]+(\\.[a-z]+)?$": {
          "type": "object",
          "properties": {
            "enabled": {
              "type": "boolean",
              "description": "Whether the slot is enabled"
            },
            "order": {
              "type": "number",
              "minimum": 0,
              "description": "Display order of the slot"
            },
            "component": {
              "type": "string",
              "description": "Custom component name to use"
            },
            "props": {
              "type": "object",
              "description": "Props to pass to the slot component"
            },
            "required": {
              "type": "boolean",
              "description": "Whether the slot is required"
            }
          },
          "additionalProperties": false
        }
      },
      "description": "Slot configurations by slot ID"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Configuration name"
        },
        "description": {
          "type": "string", 
          "description": "Configuration description"
        },
        "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "When the configuration was created"
        },
        "updatedAt": {
          "type": "string",
          "format": "date-time",
          "description": "When the configuration was last updated"
        }
      },
      "additionalProperties": true
    }
  },
  "required": ["version", "slots"],
  "additionalProperties": false
};

/**
 * Available slot definitions for different components
 */
export const ComponentSlotDefinitions = {
  ProductCard: {
    name: 'ProductCard',
    displayName: 'Product Card',
    description: 'Individual product display component',
    availableSlots: [
      'product.card.container',
      'product.card.image', 
      'product.card.content',
      'product.card.name',
      'product.card.pricing',
      'product.card.actions',
      'product.card.add_to_cart'
    ],
    defaultProps: {
      product: {
        id: 1,
        name: 'Sample Product',
        price: 29.99,
        compare_price: 39.99,
        images: ['https://placehold.co/400x400?text=Product'],
        description: 'A sample product for preview'
      },
      settings: {
        currency_symbol: '$',
        hide_currency_product: false,
        theme: {
          add_to_cart_button_color: '#3B82F6'
        }
      }
    }
  },
  
  Cart: {
    name: 'Cart',
    displayName: 'Shopping Cart',
    description: 'Shopping cart page component',
    availableSlots: [
      'cart.page.container',
      'cart.page.header',
      'cart.empty.display',
      'cart.layout.grid',
      'cart.items.container',
      'cart.item.single',
      'cart.sidebar.container',
      'cart.coupon.section',
      'cart.summary.order',
      'cart.checkout.button'
    ],
    defaultProps: {
      store: { id: 1, slug: 'demo-store', name: 'Demo Store' },
      settings: {
        currency_symbol: '$',
        theme: {
          checkout_button_color: '#007bff'
        }
      },
      cartItems: [
        {
          id: 1,
          product_id: 1,
          quantity: 2,
          price: 29.99,
          product: {
            id: 1,
            name: 'Demo Product',
            price: 29.99,
            images: ['https://placehold.co/100x100?text=Demo']
          }
        }
      ],
      subtotal: 59.98,
      tax: 4.80,
      total: 64.78
    }
  }
};

/**
 * Configuration validation utilities
 */
export const ValidationUtils = {
  /**
   * Validate a slot configuration against the schema
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with errors array
   */
  validateConfiguration(config) {
    const errors = [];
    
    // Check required fields
    if (!config.version) {
      errors.push('Configuration must have a version field');
    }
    
    if (!config.slots || typeof config.slots !== 'object') {
      errors.push('Configuration must have a slots object');
    }
    
    // Validate slot IDs
    if (config.slots) {
      Object.keys(config.slots).forEach(slotId => {
        if (!this.isValidSlotId(slotId)) {
          errors.push(`Invalid slot ID format: ${slotId}`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Check if a slot ID follows the correct format
   * @param {string} slotId - Slot ID to validate
   * @returns {boolean} Whether the slot ID is valid
   */
  isValidSlotId(slotId) {
    return /^[a-z]+\.[a-z]+\.[a-z]+(\.[a-z]+)?$/.test(slotId);
  }
};