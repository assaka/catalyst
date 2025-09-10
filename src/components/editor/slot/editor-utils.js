/**
 * Shared utilities for slot editors across all page types
 * These functions can be used by Cart, Category, ProductDetail, and other page editors
 */

/**
 * Toggle a Tailwind class on a className string
 * @param {string} currentClasses - Current className string
 * @param {string} classToToggle - Class to add/remove
 * @param {string} classCategory - Category to handle mutual exclusivity
 * @param {boolean} isWrapperSlot - Whether this is a wrapper element
 * @returns {string} Updated className string
 */
export function toggleClass(currentClasses, classToToggle, classCategory, isWrapperSlot = false) {
  let classes = currentClasses.split(' ').filter(c => c);
  
  switch(classCategory) {
    case 'font-weight':
      classes = classes.filter(c => !['font-normal', 'font-medium', 'font-semibold', 'font-bold'].includes(c));
      break;
      
    case 'font-style':
      classes = classes.filter(c => !['italic', 'not-italic'].includes(c));
      break;
      
    case 'text-align':
      if (isWrapperSlot) {
        // For wrapper slots, use flexbox justify classes
        classes = classes.filter(c => !['justify-start', 'justify-center', 'justify-end'].includes(c));
      } else {
        // For text elements, use text alignment classes
        classes = classes.filter(c => !['text-left', 'text-center', 'text-right'].includes(c));
      }
      break;
      
    case 'font-size':
      classes = classes.filter(c => !['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'].includes(c));
      break;
      
    case 'text-color':
      // Only remove text COLOR classes, keep text sizes and utilities
      classes = classes.filter(cls => {
        if (!cls.startsWith('text-')) return true;
        
        const parts = cls.split('-');
        // text-red-500 = ['text', 'red', '500'] - remove (color)
        // text-2xl = ['text', '2xl'] - keep (size)
        // text-center = ['text', 'center'] - keep (utility)
        
        if (parts.length === 3 && /^\d+$/.test(parts[2])) {
          return false; // Remove color classes
        }
        if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
          return false; // Remove special colors
        }
        return true; // Keep everything else
      });
      break;
      
    case 'bg-color':
      // Only remove background COLOR classes, keep bg utilities
      classes = classes.filter(cls => {
        if (!cls.startsWith('bg-')) return true;
        
        const parts = cls.split('-');
        if (parts.length === 3 && /^\d+$/.test(parts[2])) {
          return false; // Remove color classes
        }
        if (parts.length === 2 && ['black', 'white', 'transparent', 'current', 'inherit'].includes(parts[1])) {
          return false; // Remove special colors
        }
        return true; // Keep utilities like bg-cover, bg-gradient-to-r
      });
      break;
  }
  
  // Add the new class if provided
  if (classToToggle) {
    classes.push(classToToggle);
  }
  
  return classes.join(' ');
}

/**
 * Check if a class string contains bold styling
 */
export function isBold(className) {
  return className.includes('font-bold') || className.includes('font-semibold');
}

/**
 * Check if a class string contains italic styling
 */
export function isItalic(className) {
  return className.includes('italic');
}

/**
 * Get current alignment from class string
 */
export function getCurrentAlign(className, isWrapperSlot = false) {
  if (isWrapperSlot) {
    if (className.includes('justify-center')) return 'center';
    if (className.includes('justify-end')) return 'right';
    return 'left';
  } else {
    if (className.includes('text-center')) return 'center';
    if (className.includes('text-right')) return 'right';
    return 'left';
  }
}

/**
 * Get current font size from class string
 */
export function getCurrentFontSize(className) {
  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  return sizes.find(size => className.includes(size)) || 'text-base';
}

/**
 * Handle bold toggle
 */
export function handleBoldToggle(className) {
  const bold = isBold(className);
  return toggleClass(className, bold ? 'font-normal' : 'font-bold', 'font-weight');
}

/**
 * Handle italic toggle
 */
export function handleItalicToggle(className) {
  const italic = isItalic(className);
  return toggleClass(className, italic ? 'not-italic' : 'italic', 'font-style');
}

/**
 * Handle alignment change
 */
export function handleAlignmentChange(className, alignment, isWrapperSlot = false) {
  let alignClass;
  
  if (isWrapperSlot) {
    const alignMap = {
      'left': 'justify-start',
      'center': 'justify-center',
      'right': 'justify-end'
    };
    alignClass = alignMap[alignment];
  } else {
    const alignMap = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    };
    alignClass = alignMap[alignment];
  }
  
  return toggleClass(className, alignClass, 'text-align', isWrapperSlot);
}

/**
 * Handle font size change
 */
export function handleFontSizeChange(className, size) {
  return toggleClass(className, size, 'font-size');
}

/**
 * Transform slot configuration from database format to editor format
 */
export function transformFromDatabaseFormat(config) {
  if (!config) return null;
  
  // Extract styles, content, and classes from slots structure
  const elementStyles = {};
  const slotContent = {};
  const elementClasses = {};
  
  if (config.slots) {
    Object.entries(config.slots).forEach(([slotId, slotData]) => {
      if (slotData?.styles) {
        elementStyles[slotId] = slotData.styles;
      }
      if (slotData?.content !== undefined) {
        slotContent[slotId] = slotData.content;
      }
      if (slotData?.className) {
        elementClasses[slotId] = slotData.className;
      }
      // Load parentClassName as wrapper classes
      if (slotData?.parentClassName) {
        const wrapperId = `${slotId}-wrapper`;
        elementClasses[wrapperId] = slotData.parentClassName;
      }
    });
  }
  
  return {
    ...config,
    elementStyles,
    slotContent,
    elementClasses
  };
}

/**
 * Transform slot configuration from editor format to database format
 */
export function transformToDatabaseFormat(slotContent, elementStyles, elementClasses, otherConfig = {}) {
  const slots = {};
  
  // Combine all slot IDs
  const allSlotIds = new Set([
    ...Object.keys(slotContent || {}),
    ...Object.keys(elementStyles || {}),
    ...Object.keys(elementClasses || {})
  ]);
  
  // Add base slot IDs from wrapper IDs
  Object.keys(elementClasses || {}).forEach(key => {
    if (key.endsWith('-wrapper')) {
      const baseSlotId = key.replace('-wrapper', '');
      allSlotIds.add(baseSlotId);
    }
  });
  
  // Build slots structure
  allSlotIds.forEach(id => {
    // Skip processing wrapper IDs themselves
    if (id.endsWith('-wrapper')) {
      return;
    }
    
    // Check for parent wrapper classes (for alignment and other parent styles)
    const wrapperId = `${id}-wrapper`;
    const parentClassName = elementClasses[wrapperId] || '';
    
    slots[id] = {
      content: slotContent[id] || '',
      styles: elementStyles[id] || {},
      className: elementClasses[id] || '',
      parentClassName: parentClassName,
      metadata: {
        lastModified: new Date().toISOString()
      }
    };
  });
  
  return {
    ...otherConfig,
    slots,
    metadata: {
      lastModified: new Date().toISOString()
    }
  };
}

/**
 * Debounce function for auto-save
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format price for display
 */
export function formatPrice(value) {
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

/**
 * Generate a unique slot ID
 */
export function generateSlotId(prefix = 'slot') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a slot ID is a micro-slot (contains a dot)
 */
export function isMicroSlot(slotId) {
  return slotId && slotId.includes('.');
}

/**
 * Get parent slot ID from a micro-slot ID
 */
export function getParentSlotId(microSlotId) {
  if (!isMicroSlot(microSlotId)) return null;
  return microSlotId.split('.')[0];
}

/**
 * Get micro-slot name from a micro-slot ID
 */
export function getMicroSlotName(microSlotId) {
  if (!isMicroSlot(microSlotId)) return null;
  return microSlotId.split('.').slice(1).join('.');
}

/**
 * Validate slot configuration
 */
export function validateSlotConfig(config) {
  const errors = [];
  
  if (!config) {
    errors.push('Configuration is empty');
    return errors;
  }
  
  // Check required fields
  if (!config.slots && !config.slotContent) {
    errors.push('No slot content found');
  }
  
  // Validate slot structure
  if (config.slots) {
    Object.entries(config.slots).forEach(([slotId, slotData]) => {
      if (typeof slotData !== 'object') {
        errors.push(`Invalid slot data for ${slotId}`);
      }
    });
  }
  
  return errors;
}

/**
 * Merge slot configurations (useful for applying templates)
 */
export function mergeSlotConfigs(baseConfig, overrideConfig) {
  return {
    ...baseConfig,
    ...overrideConfig,
    slots: {
      ...(baseConfig?.slots || {}),
      ...(overrideConfig?.slots || {})
    },
    microSlotOrders: {
      ...(baseConfig?.microSlotOrders || {}),
      ...(overrideConfig?.microSlotOrders || {})
    },
    microSlotSpans: {
      ...(baseConfig?.microSlotSpans || {}),
      ...(overrideConfig?.microSlotSpans || {})
    }
  };
}

/**
 * Color palette for Tailwind color picker
 */
export const COLOR_PALETTE = [
  // Grayscale
  { hex: '#000000', tailwind: 'black', label: 'Black' },
  { hex: '#374151', tailwind: 'gray-700', label: 'Dark Gray' },
  { hex: '#6B7280', tailwind: 'gray-500', label: 'Gray' },
  { hex: '#D1D5DB', tailwind: 'gray-300', label: 'Light Gray' },
  // Primary colors
  { hex: '#DC2626', tailwind: 'red-600', label: 'Red' },
  { hex: '#EA580C', tailwind: 'orange-600', label: 'Orange' },
  { hex: '#D97706', tailwind: 'amber-600', label: 'Amber' },
  { hex: '#CA8A04', tailwind: 'yellow-600', label: 'Yellow' },
  { hex: '#16A34A', tailwind: 'green-600', label: 'Green' },
  { hex: '#059669', tailwind: 'emerald-600', label: 'Emerald' },
  { hex: '#0891B2', tailwind: 'cyan-600', label: 'Cyan' },
  { hex: '#2563EB', tailwind: 'blue-600', label: 'Blue' },
  { hex: '#4F46E5', tailwind: 'indigo-600', label: 'Indigo' },
  { hex: '#7C3AED', tailwind: 'purple-600', label: 'Purple' },
  { hex: '#C026D3', tailwind: 'fuchsia-600', label: 'Fuchsia' },
  { hex: '#DB2777', tailwind: 'pink-600', label: 'Pink' },
  { hex: '#E11D48', tailwind: 'rose-600', label: 'Rose' },
];

/**
 * Font size options
 */
export const FONT_SIZES = [
  { label: 'XS', value: 'text-xs' },
  { label: 'SM', value: 'text-sm' },
  { label: 'Base', value: 'text-base' },
  { label: 'LG', value: 'text-lg' },
  { label: 'XL', value: 'text-xl' },
  { label: '2XL', value: 'text-2xl' },
  { label: '3XL', value: 'text-3xl' },
  { label: '4XL', value: 'text-4xl' },
];

/**
 * Font weight options
 */
export const FONT_WEIGHTS = [
  { label: 'Normal', value: 'font-normal' },
  { label: 'Medium', value: 'font-medium' },
  { label: 'Semibold', value: 'font-semibold' },
  { label: 'Bold', value: 'font-bold' },
];

/**
 * Default slot configurations for different page types
 */
export const DEFAULT_PAGE_CONFIGS = {
  cart: {
    majorSlots: ['flashMessage', 'header', 'emptyCart'],
    pageType: 'cart'
  },
  category: {
    majorSlots: ['header', 'filters', 'products', 'pagination'],
    pageType: 'category'
  },
  product: {
    majorSlots: ['breadcrumbs', 'gallery', 'info', 'description', 'reviews'],
    pageType: 'product'
  }
};

/**
 * Trigger a custom save event
 */
export function triggerSave() {
  window.dispatchEvent(new CustomEvent('force-save-cart-layout'));
}