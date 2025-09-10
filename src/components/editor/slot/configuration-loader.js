/**
 * Configuration Loader - Transforms database configuration format to editor format
 * Handles the mapping between saved configuration and current editor structure
 */

export function transformDatabaseConfigToEditor(dbConfig) {
  if (!dbConfig || typeof dbConfig !== 'object') {
    return getDefaultEditorConfig();
  }

  // Parse configuration if it's a string
  const config = typeof dbConfig.configuration === 'string' 
    ? JSON.parse(dbConfig.configuration)
    : dbConfig.configuration;

  // Extract the needed data structures
  const majorSlots = config.majorSlots || ["header", "emptyCart", "cartItem", "coupon", "orderSummary"];
  const microSlotOrders = config.microSlotOrders || {};
  const microSlotSpans = config.microSlotSpans || {};
  
  // Transform slot content and classes
  const slotContent = {};
  const elementClasses = {};
  const elementStyles = {};
  
  if (config.slots) {
    Object.keys(config.slots).forEach(slotId => {
      const slot = config.slots[slotId];
      
      // Extract content
      if (slot.content) {
        slotContent[slotId] = slot.content;
      }
      
      // Extract CSS classes
      if (slot.className) {
        elementClasses[slotId] = slot.className;
      }
      
      // Extract inline styles
      if (slot.styles && typeof slot.styles === 'object') {
        elementStyles[slotId] = slot.styles;
      }
      
      // Handle parent classes - merge with element classes
      if (slot.parentClassName) {
        // Create a wrapper class for parent alignment
        const wrapperSlotId = `${slotId}_wrapper`;
        elementClasses[wrapperSlotId] = slot.parentClassName;
      }
    });
  }

  return {
    majorSlots,
    microSlotOrders,
    microSlotSpans,
    slotContent,
    elementClasses,
    elementStyles,
    customSlots: config.customSlots || {},
    componentSizes: config.componentSizes || {}
  };
}

export function getDefaultEditorConfig() {
  return {
    majorSlots: ["header", "emptyCart", "cartItem", "coupon", "orderSummary"],
    microSlotOrders: {
      header: ["header.title"],
      emptyCart: ["emptyCart.icon", "emptyCart.title", "emptyCart.text", "emptyCart.button"],
      cartItem: ["cartItem.productImage", "cartItem.productTitle", "cartItem.quantityControl", "cartItem.productPrice", "cartItem.removeButton"],
      coupon: ["coupon.title", "coupon.input", "coupon.button"],
      orderSummary: ["orderSummary.title", "orderSummary.subtotal", "orderSummary.total", "orderSummary.checkoutButton"]
    },
    microSlotSpans: {
      header: {
        "header.title": { col: 12, row: 1 }
      },
      emptyCart: {
        "emptyCart.icon": { col: 2, row: 1 },
        "emptyCart.title": { col: 10, row: 1 },
        "emptyCart.text": { col: 12, row: 1 },
        "emptyCart.button": { col: 12, row: 1 }
      },
      cartItem: {
        "cartItem.productImage": { col: 2, row: 2 },
        "cartItem.productTitle": { col: 6, row: 1 },
        "cartItem.quantityControl": { col: 2, row: 1 },
        "cartItem.productPrice": { col: 2, row: 1 },
        "cartItem.removeButton": { col: 12, row: 1 }
      }
    },
    slotContent: {},
    elementClasses: {},
    elementStyles: {},
    customSlots: {},
    componentSizes: {}
  };
}

export function transformEditorConfigToDatabase(editorConfig) {
  const slots = {};
  
  // Get all slot IDs from content, classes, and styles
  const allSlotIds = new Set([
    ...Object.keys(editorConfig.slotContent || {}),
    ...Object.keys(editorConfig.elementClasses || {}),
    ...Object.keys(editorConfig.elementStyles || {})
  ]);

  // Transform editor format back to database format
  allSlotIds.forEach(slotId => {
    // Skip wrapper keys (they're handled as parentClassName)
    if (slotId.includes('_wrapper')) return;
    
    slots[slotId] = {
      content: editorConfig.slotContent[slotId] || '',
      className: editorConfig.elementClasses[slotId] || '',
      parentClassName: editorConfig.elementClasses[`${slotId}_wrapper`] || '',
      styles: editorConfig.elementStyles[slotId] || {},
      metadata: {
        lastModified: new Date().toISOString()
      }
    };
  });

  return {
    slots,
    majorSlots: editorConfig.majorSlots,
    microSlotOrders: editorConfig.microSlotOrders,
    microSlotSpans: editorConfig.microSlotSpans,
    customSlots: editorConfig.customSlots || {},
    componentSizes: editorConfig.componentSizes || {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    },
    page_name: "Cart"
  };
}