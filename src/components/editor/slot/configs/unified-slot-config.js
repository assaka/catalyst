/**
 * Unified Slot System Configuration
 * Replaces the complex majorSlot/microSlot hierarchy with a flexible slot system
 * where any slot can contain other slots via drag & drop
 */

// Available slot types
export const SLOT_TYPES = {
  CONTAINER: 'container',
  TEXT: 'text', 
  BUTTON: 'button',
  IMAGE: 'image',
  HTML: 'html',
  CUSTOM: 'custom',
  EMPTY: 'empty'
};

// Slot type definitions with default properties
export const SLOT_TYPE_DEFINITIONS = {
  [SLOT_TYPES.CONTAINER]: {
    name: 'Container',
    description: 'A flexible container that can hold other slots',
    icon: '📦',
    defaultContent: '',
    defaultStyles: {
      className: 'p-4 border border-gray-200 rounded-lg',
      styles: {
        minHeight: '60px',
        backgroundColor: '#fafafa'
      }
    },
    canHaveChildren: true,
    allowedParents: ['container', null], // can be nested in containers or be root
    defaultChildren: []
  },
  
  [SLOT_TYPES.TEXT]: {
    name: 'Text',
    description: 'Editable text content',
    icon: '📝',
    defaultContent: 'Click to edit text',
    defaultStyles: {
      className: 'text-gray-900',
      styles: {}
    },
    canHaveChildren: false,
    allowedParents: ['container', null],
    defaultChildren: []
  },
  
  [SLOT_TYPES.BUTTON]: {
    name: 'Button',
    description: 'Interactive button element',
    icon: '🔘',
    defaultContent: 'Click Me',
    defaultStyles: {
      className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
      styles: {}
    },
    canHaveChildren: false,
    allowedParents: ['container', null],
    defaultChildren: []
  },
  
  [SLOT_TYPES.IMAGE]: {
    name: 'Image',
    description: 'Image placeholder or upload',
    icon: '🖼️',
    defaultContent: 'https://placehold.co/200x150?text=Image',
    defaultStyles: {
      className: 'w-full h-auto rounded-lg',
      styles: {
        maxWidth: '200px',
        height: 'auto'
      }
    },
    canHaveChildren: false,
    allowedParents: ['container', null],
    defaultChildren: []
  },
  
  [SLOT_TYPES.HTML]: {
    name: 'HTML',
    description: 'Custom HTML content',
    icon: '🔧',
    defaultContent: '<div class="p-4 bg-gray-100 rounded"><p>Custom HTML content</p></div>',
    defaultStyles: {
      className: '',
      styles: {}
    },
    canHaveChildren: false,
    allowedParents: ['container', null],
    defaultChildren: []
  },
  
  [SLOT_TYPES.CUSTOM]: {
    name: 'Custom',
    description: 'Custom component or functionality',
    icon: '⚡',
    defaultContent: 'Custom component placeholder',
    defaultStyles: {
      className: 'p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg text-center',
      styles: {}
    },
    canHaveChildren: true,
    allowedParents: ['container', null],
    defaultChildren: []
  },
  
  [SLOT_TYPES.EMPTY]: {
    name: 'Empty Slot',
    description: 'Placeholder slot ready for customization',
    icon: '⭕',
    defaultContent: '<div class="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50"><p>Empty slot - drag content here or click to edit</p></div>',
    defaultStyles: {
      className: 'empty-slot',
      styles: {
        minHeight: '100px'
      }
    },
    canHaveChildren: true,
    allowedParents: ['container', null],
    defaultChildren: []
  }
};

// Default cart layout using unified slot system
export const DEFAULT_CART_SLOTS = {
  slots: {
    // Root header container
    'header_container': {
      id: 'header_container',
      type: SLOT_TYPES.CONTAINER,
      content: '',
      parentId: null,
      children: ['header_title'],
      position: { order: 0 },
      styles: {
        className: 'mb-8',
        styles: {}
      },
      metadata: {
        name: 'Header Container',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    },
    
    // Header title
    'header_title': {
      id: 'header_title',
      type: SLOT_TYPES.TEXT,
      content: '<h1 class="text-3xl font-bold text-gray-900">My Cart</h1>',
      parentId: 'header_container',
      children: [],
      position: { order: 0 },
      styles: {
        className: 'text-3xl font-bold text-gray-900',
        styles: {}
      },
      metadata: {
        name: 'Header Title',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    },
    
    // Empty cart container
    'empty_cart_container': {
      id: 'empty_cart_container',
      type: SLOT_TYPES.CONTAINER,
      content: '',
      parentId: null,
      children: ['empty_icon', 'empty_title', 'empty_text', 'empty_button'],
      position: { order: 1 },
      styles: {
        className: 'text-center py-12',
        styles: {}
      },
      metadata: {
        name: 'Empty Cart Section',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    },
    
    // Empty cart icon
    'empty_icon': {
      id: 'empty_icon',
      type: SLOT_TYPES.HTML,
      content: '<svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
      parentId: 'empty_cart_container',
      children: [],
      position: { order: 0 },
      styles: {
        className: 'w-16 h-16 mx-auto text-gray-400 mb-4',
        styles: {}
      },
      metadata: {
        name: 'Empty Cart Icon',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    },
    
    // Empty cart title
    'empty_title': {
      id: 'empty_title',
      type: SLOT_TYPES.TEXT,
      content: '<h2 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>',
      parentId: 'empty_cart_container',
      children: [],
      position: { order: 1 },
      styles: {
        className: 'text-xl font-semibold text-gray-900 mb-2',
        styles: {}
      },
      metadata: {
        name: 'Empty Cart Title',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    },
    
    // Empty cart text
    'empty_text': {
      id: 'empty_text',
      type: SLOT_TYPES.TEXT,
      content: '<p class="text-gray-600 mb-6">Looks like you haven\'t added anything to your cart yet.</p>',
      parentId: 'empty_cart_container',
      children: [],
      position: { order: 2 },
      styles: {
        className: 'text-gray-600 mb-6',
        styles: {}
      },
      metadata: {
        name: 'Empty Cart Description',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    },
    
    // Continue shopping button
    'empty_button': {
      id: 'empty_button',
      type: SLOT_TYPES.BUTTON,
      content: 'Continue Shopping',
      parentId: 'empty_cart_container',
      children: [],
      position: { order: 3 },
      styles: {
        className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
        styles: {}
      },
      metadata: {
        name: 'Continue Shopping Button',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    }
  },
  
  // Root level slots in order
  rootSlots: ['header_container', 'empty_cart_container'],
  
  // Configuration metadata
  metadata: {
    name: 'Default Cart Layout',
    version: '2.0',
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    system: 'unified-slots'
  }
};

// Utility functions for slot management
export class UnifiedSlotManager {
  static generateSlotId(type = 'slot') {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static createSlot(type, parentId = null, position = { order: 0 }) {
    const definition = SLOT_TYPE_DEFINITIONS[type];
    if (!definition) {
      throw new Error(`Unknown slot type: ${type}`);
    }
    
    return {
      id: this.generateSlotId(type),
      type,
      content: definition.defaultContent,
      parentId,
      children: [...definition.defaultChildren],
      position,
      styles: {
        className: definition.defaultStyles.className,
        styles: { ...definition.defaultStyles.styles }
      },
      metadata: {
        name: `New ${definition.name}`,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }
  
  static canSlotBeChild(childType, parentType) {
    const childDef = SLOT_TYPE_DEFINITIONS[childType];
    const parentDef = SLOT_TYPE_DEFINITIONS[parentType];
    
    if (!childDef || !parentDef) return false;
    if (!parentDef.canHaveChildren) return false;
    
    return childDef.allowedParents.includes(parentType) || 
           childDef.allowedParents.includes(null);
  }
  
  static moveSlot(slots, slotId, newParentId, newPosition) {
    const slot = slots[slotId];
    if (!slot) return slots;
    
    // Remove from old parent
    if (slot.parentId && slots[slot.parentId]) {
      slots[slot.parentId].children = slots[slot.parentId].children.filter(id => id !== slotId);
    }
    
    // Add to new parent
    slot.parentId = newParentId;
    slot.position = newPosition;
    
    if (newParentId && slots[newParentId]) {
      if (!slots[newParentId].children.includes(slotId)) {
        slots[newParentId].children.push(slotId);
        // Sort children by position order
        slots[newParentId].children.sort((a, b) => 
          (slots[a]?.position?.order || 0) - (slots[b]?.position?.order || 0)
        );
      }
    }
    
    return { ...slots };
  }
  
  static getRootSlots(slots) {
    return Object.values(slots)
      .filter(slot => slot.parentId === null)
      .sort((a, b) => (a.position?.order || 0) - (b.position?.order || 0));
  }
  
  static getChildSlots(slots, parentId) {
    const parent = slots[parentId];
    if (!parent || !parent.children) return [];
    
    return parent.children
      .map(childId => slots[childId])
      .filter(Boolean)
      .sort((a, b) => (a.position?.order || 0) - (b.position?.order || 0));
  }
}