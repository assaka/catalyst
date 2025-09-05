/**
 * Utility functions for the slot editor system
 */

// Storage utilities
export const SlotStorage = {
  // Save slot configuration to localStorage
  save: (pageType, config) => {
    const key = `${pageType}_slot_config`;
    localStorage.setItem(key, JSON.stringify({
      ...config,
      timestamp: new Date().toISOString()
    }));
  },
  
  // Load slot configuration from localStorage
  load: (pageType) => {
    const key = `${pageType}_slot_config`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored config:', e);
      }
    }
    return null;
  },
  
  // Clear slot configuration
  clear: (pageType) => {
    const key = `${pageType}_slot_config`;
    localStorage.removeItem(key);
  },
  
  // Save to database
  saveToDatabase: async (pageType, storeId, config) => {
    try {
      const { default: apiClient } = await import('@/api/client');
      
      // Check if configuration exists
      const queryParams = new URLSearchParams({
        store_id: storeId,
        page_type: pageType
      }).toString();
      
      const response = await apiClient.get(`slot-configurations?${queryParams}`);
      const existing = response?.data?.find(cfg => 
        cfg.page_name === pageType && cfg.store_id === storeId
      );
      
      const payload = {
        page_name: pageType,
        slot_type: `${pageType}_layout`,
        store_id: storeId,
        configuration: config,
        is_active: true
      };
      
      if (existing) {
        // Update existing
        await apiClient.put(`slot-configurations/${existing.id}`, payload);
      } else {
        // Create new
        await apiClient.post('slot-configurations', payload);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save to database:', error);
      return false;
    }
  },
  
  // Load from database
  loadFromDatabase: async (pageType, storeId) => {
    try {
      const { default: apiClient } = await import('@/api/client');
      
      const queryParams = new URLSearchParams({
        store_id: storeId,
        page_type: pageType
      }).toString();
      
      const response = await apiClient.get(`slot-configurations?${queryParams}`);
      const config = response?.data?.find(cfg => 
        cfg.page_name === pageType && cfg.store_id === storeId
      );
      
      return config?.configuration || null;
    } catch (error) {
      console.error('Failed to load from database:', error);
      return null;
    }
  }
};

// Slot manipulation utilities
export const SlotUtils = {
  // Reorder slots
  reorderSlots: (slots, fromIndex, toIndex) => {
    const result = Array.from(slots);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  },
  
  // Add slot
  addSlot: (slots, slotId, position = -1) => {
    if (slots.includes(slotId)) return slots;
    
    const result = Array.from(slots);
    if (position === -1) {
      result.push(slotId);
    } else {
      result.splice(position, 0, slotId);
    }
    return result;
  },
  
  // Remove slot
  removeSlot: (slots, slotId) => {
    return slots.filter(id => id !== slotId);
  },
  
  // Toggle slot visibility
  toggleSlot: (slots, slotId) => {
    if (slots.includes(slotId)) {
      return slots.filter(id => id !== slotId);
    } else {
      return [...slots, slotId];
    }
  },
  
  // Validate slots against page config
  validateSlots: (slots, pageConfig) => {
    const validSlotIds = Object.keys(pageConfig.slots || {});
    return slots.filter(slotId => validSlotIds.includes(slotId));
  },
  
  // Get slot by ID
  getSlot: (slotId, pageConfig) => {
    return pageConfig.slots?.[slotId] || null;
  },
  
  // Check if slot is visible in view
  isSlotVisibleInView: (slotId, viewMode, pageConfig) => {
    const slot = pageConfig.slots?.[slotId];
    if (!slot) return false;
    if (!slot.views) return true; // No view restrictions
    return slot.views.includes(viewMode);
  },
  
  // Get visible slots for view
  getVisibleSlotsForView: (slots, viewMode, pageConfig) => {
    return slots.filter(slotId => 
      SlotUtils.isSlotVisibleInView(slotId, viewMode, pageConfig)
    );
  }
};

// Content utilities
export const ContentUtils = {
  // Sanitize HTML content
  sanitizeHtml: (html) => {
    // Basic sanitization - in production, use a library like DOMPurify
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },
  
  // Merge content with template
  mergeContent: (template, variables) => {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
  },
  
  // Extract variables from content
  extractVariables: (content) => {
    const regex = /{{(\w+)}}/g;
    const variables = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.push(match[1]);
    }
    return [...new Set(variables)];
  },
  
  // Validate content structure
  validateContent: (content, expectedType) => {
    if (expectedType === 'html') {
      // Check if it's valid HTML
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        return !doc.querySelector('parsererror');
      } catch {
        return false;
      }
    } else if (expectedType === 'json') {
      // Check if it's valid JSON
      try {
        JSON.parse(content);
        return true;
      } catch {
        return false;
      }
    }
    return true; // Default to valid for plain text
  }
};

// Export utilities
export const ExportUtils = {
  // Export configuration as JSON
  exportAsJson: (config) => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `slot-config-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },
  
  // Import configuration from JSON
  importFromJson: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          resolve(config);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
  
  // Copy configuration to clipboard
  copyToClipboard: async (config) => {
    const json = JSON.stringify(config, null, 2);
    await navigator.clipboard.writeText(json);
  },
  
  // Generate shareable URL
  generateShareUrl: (pageType, config) => {
    const compressed = btoa(JSON.stringify(config));
    const baseUrl = window.location.origin;
    return `${baseUrl}/editor/${pageType}?config=${compressed}`;
  }
};

// Migration utilities for converting old format to new
export const MigrationUtils = {
  // Convert old cart configuration to new generic format
  migrateCartConfig: (oldConfig) => {
    return {
      majorSlots: oldConfig.majorSlots || [],
      slotContent: {
        ...oldConfig.slotContent,
        ...oldConfig.textContent, // Merge old textContent
        ...oldConfig.componentCode // Merge old componentCode
      },
      elementClasses: oldConfig.elementClasses || {},
      elementStyles: oldConfig.elementStyles || {},
      componentSizes: oldConfig.componentSizes || {},
      customSlots: oldConfig.customSlots || {},
      timestamp: oldConfig.timestamp || new Date().toISOString()
    };
  },
  
  // Convert page-specific config to generic format
  convertToGeneric: (config, pageType) => {
    const base = {
      pageType,
      majorSlots: config.majorSlots || [],
      slotContent: config.slotContent || {},
      metadata: {
        createdAt: config.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '2.0'
      }
    };
    
    // Page-specific conversions
    if (pageType === 'cart') {
      base.viewMode = config.viewMode || 'empty';
      base.microSlotOrders = config.microSlotOrders || {};
      base.microSlotSpans = config.microSlotSpans || {};
    }
    
    return base;
  }
};

// Validation utilities
export const ValidationUtils = {
  // Validate slot configuration
  validateConfig: (config, pageConfig) => {
    const errors = [];
    
    // Check required fields
    if (!config.majorSlots || !Array.isArray(config.majorSlots)) {
      errors.push('majorSlots must be an array');
    }
    
    if (!config.slotContent || typeof config.slotContent !== 'object') {
      errors.push('slotContent must be an object');
    }
    
    // Validate slots exist in page config
    const validSlots = Object.keys(pageConfig.slots || {});
    const invalidSlots = config.majorSlots?.filter(slot => 
      !validSlots.includes(slot)
    ) || [];
    
    if (invalidSlots.length > 0) {
      errors.push(`Invalid slots: ${invalidSlots.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },
  
  // Auto-fix common issues
  autoFix: (config, pageConfig) => {
    const fixed = { ...config };
    
    // Ensure required fields
    if (!fixed.majorSlots) {
      fixed.majorSlots = pageConfig.defaultSlots || [];
    }
    
    if (!fixed.slotContent) {
      fixed.slotContent = {};
    }
    
    // Remove invalid slots
    const validSlots = Object.keys(pageConfig.slots || {});
    fixed.majorSlots = fixed.majorSlots.filter(slot => 
      validSlots.includes(slot)
    );
    
    // Add missing default slots
    const missingDefaults = (pageConfig.defaultSlots || []).filter(slot =>
      !fixed.majorSlots.includes(slot)
    );
    
    if (missingDefaults.length > 0) {
      fixed.majorSlots = [...fixed.majorSlots, ...missingDefaults];
    }
    
    return fixed;
  }
};