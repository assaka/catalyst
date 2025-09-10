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
 * Format price for display
 */
export function formatPrice(value) {
  return typeof value === "number" ? value : parseFloat(value) || 0;
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
 * Trigger a custom save event for any page type
 */
export function triggerSave(pageType = 'cart') {
  window.dispatchEvent(new CustomEvent(`force-save-${pageType}-layout`));
}

/**
 * Handle major slot drag end (for reordering top-level slots)
 */
export function handleMajorSlotDragEnd(event, items, setItems, onSave) {
  const { active, over } = event;
  
  if (!over || active.id === over.id) return;

  const oldIndex = items.indexOf(active.id);
  const newIndex = items.indexOf(over.id);
  
  if (oldIndex !== -1 && newIndex !== -1) {
    // This would need arrayMove import from @dnd-kit/sortable
    const newOrder = [...items];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    
    setItems(newOrder);
    
    // Auto-save after reorder
    if (onSave) {
      setTimeout(onSave, 100);
    }
  }
}

/**
 * Get Tailwind grid span classes
 */
export function getGridSpanClasses(colSpan = 1, rowSpan = 1) {
  const colClasses = {
    1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
    5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
    9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12'
  };
  
  const rowClasses = {
    1: '', 2: 'row-span-2', 3: 'row-span-3', 4: 'row-span-4'
  };
  
  const safeColSpan = Math.min(12, Math.max(1, colSpan));
  const safeRowSpan = Math.min(4, Math.max(1, rowSpan));
  
  const colClass = colClasses[safeColSpan] || 'col-span-12';
  const rowClass = rowClasses[safeRowSpan] || '';
  
  return `${colClass} ${rowClass}`.trim();
}

/**
 * Get alignment classes for grid items
 */
export function getAlignmentClasses(alignment) {
  switch (alignment) {
    case 'left':
      return 'justify-self-start';
    case 'center':
      return 'justify-self-center';
    case 'right':
      return 'justify-self-end';
    default:
      return '';
  }
}