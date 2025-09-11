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
  // For parent elements (isWrapperSlot = true), we still use text-alignment classes
  // because our alignment handler applies text-center, text-right to the parent
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
 * @param {Function} config.setMajorSlots - State setter for major slots
 * @param {Function} config.setLayoutConfig - State setter for layout configuration
 * @param {Function} config.saveConfiguration - Function to save configuration
 * @param {Array} config.majorSlots - Current major slots array
 * @param {Object} config.layoutConfig - Current layout configuration
 * @param {Function} config.arrayMove - Array move utility function
 * @returns {Function} Drag end handler
 */
export function createDragEndHandler({
  setActiveDragSlot,
  setMajorSlots,
  setLayoutConfig,
  saveConfiguration,
  majorSlots,
  layoutConfig,
  arrayMove
}) {
  return (event) => {
    const { active, over } = event;
    setActiveDragSlot(null);

    if (!over || active.id === over.id) return;

    // Determine if this is a majorSlot or microSlot drag
    const activeId = active.id;
    const overId = over.id;

    // Check if dragging majorSlots
    if (majorSlots.includes(activeId) && majorSlots.includes(overId)) {
      setMajorSlots((slots) => {
        const oldIndex = slots.indexOf(activeId);
        const newIndex = slots.indexOf(overId);
        const newSlots = arrayMove(slots, oldIndex, newIndex);
        
        // Auto-save after reordering
        setTimeout(saveConfiguration, 100);
        
        return newSlots;
      });
      return;
    }

    // Check if dragging microSlots
    const activeSlotParts = activeId.split('.');
    const overSlotParts = overId.split('.');
    
    if (activeSlotParts.length >= 2 && overSlotParts.length >= 2) {
      const activeMajorSlot = activeSlotParts[0];
      const overMajorSlot = overSlotParts[0];
      
      // Only allow reordering within the same majorSlot
      if (activeMajorSlot === overMajorSlot && layoutConfig?.microSlotOrders?.[activeMajorSlot]) {
        setLayoutConfig(prevConfig => {
          const currentOrder = prevConfig.microSlotOrders[activeMajorSlot] || [];
          const oldIndex = currentOrder.indexOf(activeId);
          const newIndex = currentOrder.indexOf(overId);
          
          if (oldIndex === -1 || newIndex === -1) return prevConfig;
          
          const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
          
          const updatedConfig = {
            ...prevConfig,
            microSlotOrders: {
              ...prevConfig.microSlotOrders,
              [activeMajorSlot]: newOrder
            }
          };
          
          // Auto-save after reordering
          setTimeout(saveConfiguration, 100);
          
          return updatedConfig;
        });
      }
    }
  };
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
    
    // For button elements, generate full HTML structure if not already stored
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


/**
 * Create custom slot renderer with ALL editor customizations
 * @param {Object} config - Configuration object
 * @param {Object} config.layoutConfig - Current layout configuration
 * @param {Function} config.getMicroSlotStyling - Function to get micro slot styling
 * @param {Function} config.getSlotPositioning - Function to get slot positioning
 * @param {Function} config.handleEditSlot - Function to handle slot editing
 * @param {string} config.mode - Editor mode ('edit' or 'preview')
 * @returns {Function} Custom slot renderer
 */
export function createCustomSlotRenderer({
  layoutConfig,
  getMicroSlotStyling,
  getSlotPositioning,
  handleEditSlot,
  mode
}) {
  return (slotId, parentSlot) => {
    if (!layoutConfig?.customSlots?.[slotId]) return null;
    
    const customSlot = layoutConfig.customSlots[slotId];
    const slotContent = layoutConfig.slotContent?.[slotId] || customSlot?.content || '';
    
    // Get all editor customizations
    const elementClasses = layoutConfig.elementClasses?.[slotId] || '';
    const elementStyles = layoutConfig.elementStyles?.[slotId] || {};
    const microSlotSpans = layoutConfig.microSlotSpans?.[parentSlot]?.[slotId] || { col: 12, row: 1 };
    
    // Debug: Log what customizations are being applied
    console.log(`🎨 Rendering custom slot ${slotId}:`);
    console.log('  - elementClasses:', elementClasses);
    console.log('  - elementStyles:', elementStyles);
    console.log('  - microSlotSpans:', microSlotSpans);
    console.log('  - slotContent:', slotContent);
    
    // Build container styles with positioning from slot configuration
    const containerStyle = {
      ...elementStyles,
      // Get positioning from slot configuration instead of fixed grid spans
      ...(microSlotSpans.position ? { position: microSlotSpans.position } : {}),
      ...(microSlotSpans.left ? { left: microSlotSpans.left } : {}),
      ...(microSlotSpans.top ? { top: microSlotSpans.top } : {}),
      ...(microSlotSpans.right ? { right: microSlotSpans.right } : {}),
      ...(microSlotSpans.bottom ? { bottom: microSlotSpans.bottom } : {}),
      ...(microSlotSpans.width ? { width: microSlotSpans.width } : {}),
      ...(microSlotSpans.height ? { height: microSlotSpans.height } : {}),
      // Only apply grid spans if they exist in configuration
      ...(microSlotSpans.col ? { gridColumn: `span ${Math.min(12, Math.max(1, microSlotSpans.col))}` } : {}),
      ...(microSlotSpans.row ? { gridRow: `span ${Math.min(4, Math.max(1, microSlotSpans.row))}` } : {})
    };
    
    const renderContent = () => {
      // Get wrapper styling
      const wrapperStyling = getMicroSlotStyling(`${slotId}_wrapper`);
      
      // Combine inline styles with container positioning
      const combinedStyles = {
        ...elementStyles,
        ...containerStyle
      };
      
      console.log(`🎨 Final styles for ${slotId}:`, combinedStyles);
      console.log(`🎨 Final classes for ${slotId}:`, elementClasses);
      console.log(`🎯 Wrapper styling for ${slotId}_wrapper:`, wrapperStyling);
      
      if (customSlot.type === 'text') {
        return React.createElement('div', null,
          React.createElement('div', { className: wrapperStyling.elementClasses, style: wrapperStyling.elementStyles },
            React.createElement('div', { 
              className: `custom-slot-content ${elementClasses || 'text-gray-600'}`,
              style: combinedStyles
            }, slotContent)
          )
        );
      } else if (customSlot.type === 'html' || customSlot.type === 'javascript') {
        return React.createElement('div', null,
          React.createElement('div', { className: wrapperStyling.elementClasses, style: wrapperStyling.elementStyles },
            React.createElement('div', { 
              className: `custom-slot-content ${elementClasses || ''}`,
              style: combinedStyles,
              dangerouslySetInnerHTML: { __html: slotContent }
            })
          )
        );
      }
      return null;
    };
    
    const positioning = getSlotPositioning(slotId, parentSlot);
    
    return React.createElement('div', {
      key: slotId,
      className: `custom-slot ${customSlot.type}-slot ${positioning.gridClasses} ${mode === 'edit' ? 'relative group' : ''}`,
      'data-slot-id': slotId,
      'data-parent-slot': parentSlot,
      style: positioning.elementStyles
    },
      // Editor action bar - only show in edit mode
      mode === 'edit' && React.createElement('div', {
        className: 'absolute top-0 right-0 bg-blue-600 text-white px-2 py-1 text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-10'
      },
        React.createElement('button', {
          onClick: () => handleEditSlot(slotId, slotContent),
          className: 'mr-2 hover:underline'
        }, 'Edit')
      ),
      renderContent()
    );
  };
}
