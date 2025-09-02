/**
 * Slot System Schema Definitions
 * Dual-layer approach:
 * - JSON Schema: AI-facing contracts and documentation
 * - Zod: Runtime validation and TypeScript integration
 */

import { z } from 'zod';

// =============================================================================
// 🤖 JSON SCHEMA - AI-Driven Development Contracts
// =============================================================================

export const slotDefinitionJsonSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Slot Definition",
  "description": "Defines a single slot component for the slot system",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the slot (kebab-case)",
      "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$"
    },
    "type": {
      "type": "string",
      "description": "Type of slot component",
      "enum": ["component", "container", "layout", "content", "action", "micro-slot"]
    },
    "component": {
      "type": "string",
      "description": "React component name or string reference"
    },
    "name": {
      "type": "string",
      "description": "Human-readable display name for the slot"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the slot's purpose and usage"
    },
    "required": {
      "type": "boolean",
      "description": "Whether this slot is required and cannot be removed",
      "default": false
    },
    "enabled": {
      "type": "boolean",
      "description": "Whether this slot is currently enabled/visible",
      "default": true
    },
    "order": {
      "type": "integer",
      "description": "Display order for this slot (0-based)",
      "minimum": 0
    },
    "props": {
      "type": "object",
      "description": "Default props to pass to the slot component",
      "additionalProperties": true
    },
    "children": {
      "type": "array",
      "description": "Array of child slot IDs that render inside this slot",
      "items": {
        "type": "string"
      }
    },
    "parent": {
      "type": "string",
      "description": "Parent slot ID that contains this slot"
    },
    "layout": {
      "type": "object",
      "description": "Layout configuration for this slot",
      "properties": {
        "direction": {
          "type": "string",
          "enum": ["row", "column"],
          "description": "Flex direction for child elements"
        },
        "gap": {
          "type": "integer",
          "minimum": 0,
          "description": "Gap between child elements (in spacing units)"
        },
        "align": {
          "type": "string", 
          "enum": ["start", "center", "end", "stretch"],
          "description": "Cross-axis alignment"
        },
        "justify": {
          "type": "string",
          "enum": ["start", "center", "end", "between", "around"],
          "description": "Main-axis alignment"
        }
      }
    },
    "responsive": {
      "type": "object",
      "description": "Responsive overrides for different screen sizes",
      "properties": {
        "mobile": { "type": "object" },
        "tablet": { "type": "object" },
        "desktop": { "type": "object" }
      }
    },
    "conditions": {
      "type": "object", 
      "description": "Conditional display rules",
      "properties": {
        "showWhen": {
          "type": "string",
          "description": "JavaScript expression for when to show this slot"
        },
        "hideWhen": {
          "type": "string", 
          "description": "JavaScript expression for when to hide this slot"
        },
        "requiredData": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Data keys required for this slot to function"
        }
      }
    },
    "styling": {
      "type": "object",
      "description": "Styling configuration",
      "properties": {
        "className": {
          "type": "string",
          "description": "CSS classes to apply to the slot"
        },
        "style": {
          "type": "object", 
          "description": "Inline styles object"
        },
        "theme": {
          "type": "string",
          "description": "Theme variant to apply"
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata for documentation and tooling",
      "properties": {
        "category": {
          "type": "string",
          "description": "Logical category for grouping slots"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Tags for searching and filtering"
        },
        "version": {
          "type": "string",
          "description": "Semantic version for this slot definition"
        },
        "author": {
          "type": "string", 
          "description": "Author or maintainer of this slot"
        },
        "documentation": {
          "type": "string",
          "description": "Extended documentation or usage notes"
        }
      }
    }
  },
  "required": ["id", "type", "name"],
  "additionalProperties": false
};

export const pageSlotConfigJsonSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema", 
  "title": "Page Slot Configuration",
  "description": "Complete slot configuration for a page",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "description": "Configuration format version",
      "default": "1.0"
    },
    "pageName": {
      "type": "string", 
      "description": "Name of the page this configuration is for"
    },
    "slotDefinitions": {
      "type": "object",
      "description": "Map of slot ID to slot definition",
      "patternProperties": {
        "^[a-z][a-z0-9-]*[a-z0-9]$": {
          "$ref": "#/$defs/slotDefinition"
        }
      }
    },
    "slotOrder": {
      "type": "array",
      "description": "Ordered list of slot IDs defining render order",
      "items": {
        "type": "string",
        "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$"
      }
    },
    "layoutPresets": {
      "type": "object",
      "description": "Named layout presets for quick switching",
      "patternProperties": {
        "^[a-zA-Z][a-zA-Z0-9-]*$": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "description": { "type": "string" },
            "slotOrder": {
              "type": "array",
              "items": { "type": "string" }
            },
            "overrides": { "type": "object" }
          },
          "required": ["name", "slotOrder"]
        }
      }
    },
    "settings": {
      "type": "object",
      "description": "Global page settings",
      "properties": {
        "allowCustomSlots": {
          "type": "boolean",
          "description": "Allow users to add custom slots"
        },
        "maxSlots": {
          "type": "integer",
          "minimum": 1,
          "description": "Maximum number of slots allowed"
        },
        "theme": {
          "type": "string",
          "description": "Default theme for this page"
        },
        "responsive": {
          "type": "boolean", 
          "description": "Enable responsive slot behavior"
        }
      }
    }
  },
  "required": ["version", "pageName", "slotDefinitions", "slotOrder"],
  "$defs": {
    "slotDefinition": slotDefinitionJsonSchema
  }
};

// Base slot types
export const SlotType = z.enum([
  'component',   // React component slot
  'container',   // Layout container
  'layout',      // Grid/flex layout
  'content',     // Content block
  'action',      // Button/interactive element
  'micro-slot'   // Fine-grained element within component
]);

// Slot configuration schema
export const SlotDefinitionSchema = z.object({
  id: z.string().min(1, 'Slot ID is required'),
  type: SlotType,
  component: z.any().optional(), // React component reference
  name: z.string().min(1, 'Slot name is required'),
  description: z.string().optional(),
  required: z.boolean().default(false),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).optional(),
  props: z.record(z.any()).default({}),
  children: z.array(z.string()).default([]), // Child slot IDs
  parent: z.string().optional(), // Parent slot ID
  
  // Layout configuration
  layout: z.object({
    direction: z.enum(['row', 'column']).default('column'),
    gap: z.number().int().min(0).default(4),
    align: z.enum(['start', 'center', 'end', 'stretch']).default('start'),
    justify: z.enum(['start', 'center', 'end', 'between', 'around']).default('start')
  }).optional(),
  
  // Responsive configuration
  responsive: z.object({
    mobile: z.any().optional(),
    tablet: z.any().optional(), 
    desktop: z.any().optional()
  }).optional(),
  
  // Conditional display
  conditions: z.object({
    showWhen: z.string().optional(), // JS expression
    hideWhen: z.string().optional(),
    requiredData: z.array(z.string()).default([])
  }).optional(),
  
  // Styling
  styling: z.object({
    className: z.string().optional(),
    style: z.record(z.any()).optional(),
    theme: z.string().optional()
  }).optional(),
  
  // Metadata
  metadata: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    version: z.string().default('1.0'),
    author: z.string().optional(),
    documentation: z.string().optional()
  }).optional()
});

// Page slot configuration schema
export const PageSlotConfigSchema = z.object({
  version: z.string().default('1.0'),
  pageName: z.string().min(1),
  slotDefinitions: z.record(SlotDefinitionSchema),
  slotOrder: z.array(z.string()),
  layoutPresets: z.record(z.object({
    name: z.string(),
    description: z.string().optional(),
    slotOrder: z.array(z.string()),
    overrides: z.record(z.any()).default({})
  })).default({}),
  
  // Global page settings
  settings: z.object({
    allowCustomSlots: z.boolean().default(true),
    maxSlots: z.number().int().min(1).default(50),
    theme: z.string().optional(),
    responsive: z.boolean().default(true)
  }).optional(),
  
  // Metadata
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string().optional(),
    description: z.string().optional()
  }).optional()
});

// Validation utilities
export class SlotValidator {
  static validateSlotDefinition(definition) {
    try {
      return {
        valid: true,
        data: SlotDefinitionSchema.parse(definition),
        errors: []
      };
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
  }
  
  static validatePageConfig(config) {
    try {
      return {
        valid: true,
        data: PageSlotConfigSchema.parse(config),
        errors: []
      };
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
  }
  
  static validateSlotOrder(slotOrder, slotDefinitions) {
    const errors = [];
    const warnings = [];
    
    // Check for missing slots
    slotOrder.forEach(slotId => {
      if (!slotDefinitions[slotId]) {
        errors.push(`Slot "${slotId}" in order but not found in definitions`);
      }
    });
    
    // Check for unused slots
    Object.keys(slotDefinitions).forEach(slotId => {
      if (!slotOrder.includes(slotId)) {
        warnings.push(`Slot "${slotId}" defined but not in order array`);
      }
    });
    
    // Check for required slots
    Object.values(slotDefinitions).forEach(slot => {
      if (slot.required && !slotOrder.includes(slot.id)) {
        errors.push(`Required slot "${slot.id}" must be included in order`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Schema-based slot configuration builder
export class SlotConfigBuilder {
  constructor(pageName) {
    this.config = {
      version: '1.0',
      pageName,
      slotDefinitions: {},
      slotOrder: [],
      layoutPresets: {},
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  addSlot(definition) {
    const validation = SlotValidator.validateSlotDefinition(definition);
    if (!validation.valid) {
      throw new Error(`Invalid slot definition: ${validation.errors.join(', ')}`);
    }
    
    this.config.slotDefinitions[definition.id] = validation.data;
    if (!this.config.slotOrder.includes(definition.id)) {
      this.config.slotOrder.push(definition.id);
    }
    
    return this;
  }
  
  setOrder(slotOrder) {
    const validation = SlotValidator.validateSlotOrder(slotOrder, this.config.slotDefinitions);
    if (!validation.valid) {
      throw new Error(`Invalid slot order: ${validation.errors.join(', ')}`);
    }
    
    this.config.slotOrder = slotOrder;
    return this;
  }
  
  addLayoutPreset(name, preset) {
    this.config.layoutPresets[name] = preset;
    return this;
  }
  
  build() {
    const validation = SlotValidator.validatePageConfig(this.config);
    if (!validation.valid) {
      throw new Error(`Invalid page config: ${validation.errors.join(', ')}`);
    }
    
    return validation.data;
  }
}

export default {
  SlotType,
  SlotDefinitionSchema,
  PageSlotConfigSchema,
  SlotValidator,
  SlotConfigBuilder
};