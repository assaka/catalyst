/**
 * Shared utilities for slot editors across all page types
 * These functions can be used by Cart, Category, ProductDetail, and other page editors
 */

import React from 'react';


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
  if (className.includes('text-center')) return 'center';
  if (className.includes('text-right')) return 'right';
  return 'left';
}

/**
 * Get current font size from class string
 */
export function getCurrentFontSize(className) {
  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
  return sizes.find(size => className.includes(size)) || 'text-base';
}


/**
 * Format price for display
 */
export function formatPrice(value) {
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

/**
 * Event Handling Utilities
 */

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// =============================================================================
// GENERIC EDITOR UTILITY FUNCTIONS FOR SLOT EDITORS
// =============================================================================

/**
 * Generic drag and drop handlers for slot editors
 */

/**
 * Create drag start handler for slot editors
 * @param {Function} setActiveDragSlot - State setter for active drag slot
 * @returns {Function} Drag start handler
 */
export function createDragStartHandler(setActiveDragSlot) {
  return (event) => {
    setActiveDragSlot(event.active.id);
  };
}

/**
 * Create drag end handler for slot editors with major and micro slot support
 * @param {Object} config - Configuration object
 * @param {Function} config.setActiveDragSlot - State setter for active drag slot
 * @returns {Function} Drag end handler
 */
export function createDragEndHandler({
  setActiveDragSlot,
}) {
  return (event) => {
    const {active, over} = event;
    setActiveDragSlot(null);
  }
}

/**
 * Generic slot editing handlers
 */

/**
 * Create edit slot handler
 * @param {Function} setEditingComponent - State setter for editing component
 * @param {Function} setTempCode - State setter for temporary code
 * @returns {Function} Edit slot handler
 */
export function createEditSlotHandler(setEditingComponent, setTempCode) {
  return (slotId, content, layoutConfig, elementType) => {
    setEditingComponent(slotId);
    
    let htmlContent = layoutConfig?.slots?.[slotId]?.content || content || '';
    
    if (elementType === 'button' && htmlContent && !htmlContent.includes('<')) {
      // If it's just text, wrap it in a proper button HTML structure
      const buttonClasses = layoutConfig?.slots?.[slotId]?.className || 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded';
      const buttonStyles = layoutConfig?.slots?.[slotId]?.styles || {};
      
      const styleString = Object.entries(buttonStyles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');
      
      htmlContent = `<button class="${buttonClasses}"${styleString ? ` style="${styleString}"` : ''}>${htmlContent}</button>`;
    }
    
    setTempCode(htmlContent);
  };
}