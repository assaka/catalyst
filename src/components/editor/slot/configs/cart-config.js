import { ShoppingCart, Package } from 'lucide-react';

// Unified Cart Slot Configuration - No backward compatibility
export const cartConfig = {
  page_name: 'Cart',
  slot_type: 'unified_slots',
  
  // Available slot types for the unified system
  slotTypes: {
    container: {
      name: 'Container',
      description: 'A flexible container that can hold other slots',
      icon: '📦',
      canHaveChildren: true,
      defaultStyles: {
        className: 'p-4 border border-gray-200 rounded-lg bg-gray-50',
        styles: { minHeight: '60px' }
      }
    },
    text: {
      name: 'Text',
      description: 'Editable text content',
      icon: '📝',
      canHaveChildren: false,
      defaultStyles: {
        className: 'text-gray-900',
        styles: {}
      }
    },
    button: {
      name: 'Button',
      description: 'Interactive button element',
      icon: '🔘',
      canHaveChildren: false,
      defaultStyles: {
        className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
        styles: {}
      }
    },
    image: {
      name: 'Image',
      description: 'Image placeholder or upload',
      icon: '🖼️',
      canHaveChildren: false,
      defaultStyles: {
        className: 'w-full h-auto rounded-lg',
        styles: { maxWidth: '200px' }
      }
    },
    html: {
      name: 'HTML',
      description: 'Custom HTML content',
      icon: '🔧',
      canHaveChildren: false,
      defaultStyles: {
        className: 'custom-html',
        styles: {}
      }
    },
    empty: {
      name: 'Empty Slot',
      description: 'Placeholder slot ready for customization',
      icon: '⭕',
      canHaveChildren: true,
      defaultStyles: {
        className: 'p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50',
        styles: { minHeight: '100px' }
      }
    }
  },

  // Default cart layout using unified slot system
  defaultLayout: {
    slots: {
      // Root header container
      'header_container': {
        id: 'header_container',
        type: 'container',
        content: '',
        parentId: null,
        children: ['header_title'],
        position: { order: 0 },
        styles: {
          className: 'mb-8 p-4 bg-white rounded-lg',
          styles: {}
        },
        metadata: {
          name: 'Header Container',
          created: new Date().toISOString()
        }
      },
      
      // Header title
      'header_title': {
        id: 'header_title',
        type: 'text',
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
          created: new Date().toISOString()
        }
      },
      
      // Empty cart container
      'empty_cart_container': {
        id: 'empty_cart_container',
        type: 'container',
        content: '',
        parentId: null,
        children: ['empty_icon', 'empty_title', 'empty_text', 'empty_button'],
        position: { order: 1 },
        styles: {
          className: 'text-center py-12 bg-gray-50 rounded-lg',
          styles: {}
        },
        metadata: {
          name: 'Empty Cart Section',
          created: new Date().toISOString()
        }
      },
      
      // Empty cart elements
      'empty_icon': {
        id: 'empty_icon',
        type: 'html',
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
          created: new Date().toISOString()
        }
      },
      
      'empty_title': {
        id: 'empty_title',
        type: 'text',
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
          created: new Date().toISOString()
        }
      },
      
      'empty_text': {
        id: 'empty_text',
        type: 'text',
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
          created: new Date().toISOString()
        }
      },
      
      'empty_button': {
        id: 'empty_button',
        type: 'button',
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
          created: new Date().toISOString()
        }
      }
    },
    
    // Root level slots in order
    rootSlots: ['header_container', 'empty_cart_container'],
    
    // Configuration metadata
    metadata: {
      name: 'Default Cart Layout',
      version: '2.0',
      system: 'unified-slots',
      created: new Date().toISOString()
    }
  },

  // View configuration (simplified)
  views: [
    { id: 'empty', label: 'Empty Cart', icon: ShoppingCart },
    { id: 'withProducts', label: 'With Products', icon: Package }
  ]
};

// Utility functions for the unified slot system
export class SlotManager {
  static generateSlotId(type = 'slot') {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static createSlot(type, parentId = null, position = { order: 0 }) {
    const typeDefinition = cartConfig.slotTypes[type];
    if (!typeDefinition) {
      throw new Error(`Unknown slot type: ${type}`);
    }
    
    return {
      id: this.generateSlotId(type),
      type,
      content: type === 'empty' ? 
        '<div class="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 bg-gray-50"><p>Empty slot - click to edit</p></div>' :
        'New ' + typeDefinition.name,
      parentId,
      children: [],
      position,
      styles: {
        className: typeDefinition.defaultStyles.className,
        styles: { ...typeDefinition.defaultStyles.styles }
      },
      metadata: {
        name: `New ${typeDefinition.name}`,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
  }
  
  static canSlotBeChild(childType, parentType) {
    const parentDef = cartConfig.slotTypes[parentType];
    return parentDef && parentDef.canHaveChildren;
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

export default cartConfig;