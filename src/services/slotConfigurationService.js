import apiClient from '@/api/client';

const API_BASE = 'slot-configurations';

class SlotConfigurationService {
  // Get or create draft configuration for editing
  async getDraftConfiguration(storeId, pageType = 'cart', staticConfig = null) {
    try {
      // Debug what we're sending to the API
      const payload = {
        staticConfiguration: staticConfig
      };

      const response = await apiClient.post(`${API_BASE}/draft/${storeId}/${pageType}`, payload)

      return response;
    } catch (error) {
      console.error('Error getting draft configuration:', error);
      throw error;
    }
  }

  // Get published configuration for display (used by storefront)
  async getPublishedConfiguration(storeId, pageType = 'cart') {
    try {
      const url = `${API_BASE}/published/${storeId}/${pageType}?status=published&latest=true`;
      const response = await apiClient.get(url);

      // Additional verification: ensure we got a published record
      if (response.data && response.data.status !== 'published') {
        console.warn('⚠️ WARNING: API returned non-published record:', response.data.status);
        console.warn('⚠️ This may indicate a backend issue with the /published endpoint');
      }

      return response;
    } catch (error) {
      console.error('Error getting published configuration:', error);
      throw error;
    }
  }

  // Update draft configuration
  async updateDraftConfiguration(configId, configuration, isReset = false) {
    try {
      const response = await apiClient.put(`${API_BASE}/draft/${configId}`, {
        configuration,
        isReset
      });
      return response;
    } catch (error) {
      console.error('Error updating draft configuration:', error);
      throw error;
    }
  }

  // Get acceptance configuration for preview
  async getAcceptanceConfiguration(storeId, pageType = 'cart') {
    try {
      const response = await apiClient.get(`${API_BASE}/acceptance/${storeId}/${pageType}`);
      return response;
    } catch (error) {
      console.error('Error getting acceptance configuration:', error);
      throw error;
    }
  }

  // Publish a draft to acceptance (preview environment)
  async publishToAcceptance(configId) {
    try {
      const response = await apiClient.post(`${API_BASE}/publish-to-acceptance/${configId}`);
      return response;
    } catch (error) {
      console.error('Error publishing to acceptance:', error);
      throw error;
    }
  }

  // Publish acceptance to production
  async publishToProduction(configId) {
    try {
      const response = await apiClient.post(`${API_BASE}/publish-to-production/${configId}`);
      return response;
    } catch (error) {
      console.error('Error publishing to production:', error);
      throw error;
    }
  }

  // Publish a draft configuration directly to production (legacy method)
  async publishDraft(configId) {
    try {
      const response = await apiClient.post(`${API_BASE}/publish/${configId}`);
      return response;
    } catch (error) {
      console.error('Error publishing draft:', error);
      throw error;
    }
  }

  // Get version history
  async getVersionHistory(storeId, pageType = 'cart', limit = 20) {
    try {
      const response = await apiClient.get(`${API_BASE}/history/${storeId}/${pageType}?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }

  // Create a revert draft (new approach - creates draft instead of publishing)
  async createRevertDraft(versionId) {
    try {
      const response = await apiClient.post(`${API_BASE}/revert-draft/${versionId}`);
      return response;
    } catch (error) {
      console.error('Error creating revert draft:', error);
      throw error;
    }
  }

  // Revert to a specific version (DEPRECATED - use createRevertDraft instead)
  async revertToVersion(versionId) {
    try {
      const response = await apiClient.post(`${API_BASE}/revert/${versionId}`);
      return response;
    } catch (error) {
      console.error('Error reverting to version:', error);
      throw error;
    }
  }

  // Undo revert with smart restoration of previous draft state
  async undoRevert(draftId) {
    try {
      const response = await apiClient.post(`${API_BASE}/undo-revert/${draftId}`);
      return response;
    } catch (error) {
      console.error('Error undoing revert:', error);
      throw error;
    }
  }

  // Delete a draft
  async deleteDraft(configId) {
    try {
      const response = await apiClient.delete(`${API_BASE}/draft/${configId}`);
      return response;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  // Set current editing configuration
  async setCurrentEdit(configId, storeId, pageType = 'cart') {
    try {
      const response = await apiClient.post(`${API_BASE}/set-current-edit/${configId}`, {
        storeId,
        pageType
      });
      return response;
    } catch (error) {
      console.error('Error setting current edit:', error);
      throw error;
    }
  }

  // Get current editing configuration
  async getCurrentEdit(storeId, pageType = 'cart') {
    try {
      const response = await apiClient.get(`${API_BASE}/current-edit/${storeId}/${pageType}`);
      return response;
    } catch (error) {
      console.error('Error getting current edit:', error);
      throw error;
    }
  }

  // Check if a draft configuration exists for a store/page type
  async hasDraftConfiguration(storeId, pageType = 'cart') {
    try {
      const response = await this.getDraftConfiguration(storeId, pageType);
      return response.success && response.data;
    } catch (error) {
      console.warn('No draft configuration found:', error);
      return false;
    }
  }

  // Helper method to save configuration with auto-draft creation
  async saveConfiguration(storeId, configuration, pageType = 'cart', isReset = false) {
    try {
      console.log('💾 SAVING CONFIGURATION:', {
        storeId,
        pageType,
        slotsCount: configuration?.slots ? Object.keys(configuration.slots).length : 0,
        productItemsSlot: configuration?.slots?.product_items,
        productItemsMetadata: configuration?.slots?.product_items?.metadata,
        productItemsGridConfig: configuration?.slots?.product_items?.metadata?.gridConfig
      });

      // First get or create a draft
      const draftResponse = await this.getDraftConfiguration(storeId, pageType);
      const draftConfig = draftResponse.data;

      // Transform CartSlotsEditor format to SlotConfiguration API format
      const apiConfiguration = this.transformToSlotConfigFormat(configuration);

      console.log('💾 TRANSFORMED API CONFIG:', {
        slotsCount: apiConfiguration?.slots ? Object.keys(apiConfiguration.slots).length : 0,
        productItemsSlot: apiConfiguration?.slots?.product_items,
        productItemsMetadata: apiConfiguration?.slots?.product_items?.metadata,
        productItemsGridConfig: apiConfiguration?.slots?.product_items?.metadata?.gridConfig
      });

      // Update the draft with new configuration
      const updateResponse = await this.updateDraftConfiguration(draftConfig.id, apiConfiguration, isReset);
      console.log('✅ Configuration saved successfully');
      return updateResponse;
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
      throw error;
    }
  }

  // Create a new draft based on published configuration (after publish)
  async createDraftFromPublished(storeId, configuration, pageType = 'cart') {
    try {
      const response = await apiClient.post(`${API_BASE}/create-draft-from-published`, {
        storeId,
        pageType,
        configuration
      });
      return response;
    } catch (error) {
      console.error('Error creating draft from published:', error);
      throw error;
    }
  }

  // Check if draft exists, create from initial values if not
  async ensureDraftExists(storeId, pageType = 'cart', fileName = null) {
    try {
      
      // Try to get existing draft
      try {
        const draftResponse = await this.getDraftConfiguration(storeId, pageType);
        if (draftResponse.success && draftResponse.data) {
          return {
            exists: true,
            draft: draftResponse.data,
            created: false
          };
        }
      } catch (error) {
        // Draft doesn't exist, we'll create it
        console.log(`📝 No draft found for ${storeId}/${pageType}, will create new one`);
      }

      // Create new draft from cart-config.js initial values
      const initialConfiguration = await this.getInitialConfiguration(pageType, fileName);
      
      // Create draft using the API
      const createResponse = await apiClient.post(`${API_BASE}/draft`, {
        storeId,
        pageType,
        configuration: initialConfiguration
      });

      if (createResponse.success) {
        return {
          exists: false,
          draft: createResponse.data,
          created: true
        };
      } else {
        throw new Error('Failed to create draft configuration');
      }

    } catch (error) {
      console.error('Error ensuring draft exists:', error);
      throw error;
    }
  }

  // Get initial configuration from appropriate config file based on pageType
  async getInitialConfiguration(pageType = 'cart', fileName = null) {
    console.log('🏗️ getInitialConfiguration called for:', pageType);
    // Dynamic import to get the appropriate config based on pageType
    let config;
    if (pageType === 'category') {
      const { categoryConfig } = await import('@/components/editor/slot/configs/category-config.js');
      config = categoryConfig;
    } else {
      const { cartConfig } = await import('@/components/editor/slot/configs/cart-config.js');
      config = cartConfig;
    }

    // Create clean slots with all properties preserved including position coordinates
    const cleanSlots = {};
    if (config.slots) {
      Object.entries(config.slots).forEach(([key, slot]) => {
        // Copy all serializable properties, ensure no undefined values
        console.log(`🔧 SLOT ${key}:`, {
          type: slot.type,
          component: slot.component,
          hasComponent: !!slot.component
        });
        cleanSlots[key] = {
          id: slot.id || key,
          type: slot.type || 'container',
          component: slot.component || null, // ← MISSING: Component name for component slots
          content: slot.content || '',
          className: slot.className || '',
          parentClassName: slot.parentClassName || '',
          styles: slot.styles ? { ...slot.styles } : {},
          parentId: slot.parentId === undefined ? null : slot.parentId,
          layout: slot.layout || null,
          gridCols: slot.gridCols || null,
          colSpan: slot.colSpan || 12,
          rowSpan: slot.rowSpan || 1,
          position: slot.position ? { ...slot.position } : null,
          viewMode: slot.viewMode ? [...slot.viewMode] : [],
          metadata: slot.metadata ? { ...slot.metadata } : {}
        };
      });
    }

    // Use the new nested structure
    const initialConfig = {
      // Use the root slots and nested structure
      rootSlots: config.rootSlots || [],
      slotDefinitions: config.slotDefinitions || {},
      slots: cleanSlots,

      // Add metadata
      metadata: {
        name: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Layout`,
        version: '2.0',
        system: 'nested-',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        pageType: pageType,
        fileName: fileName,
        source: pageType === 'category' ? 'category-config.js' : 'cart-config.js',
        page_name: config.page_name,
        slot_type: config.slot_type
      }
    };

    return initialConfig;
  }

  // Transform CartSlotsEditor configuration to SlotConfiguration API format
  transformToSlotConfigFormat(cartConfig) {
    // Helper function to remove editor-only temporary classes
    const removeEditorClasses = (className) => {
      if (!className) return '';

      // Split into individual classes
      const classes = className.split(/\s+/).filter(Boolean);

      // List of editor-only classes and patterns to remove
      const editorClasses = [
        'border-2',
        'border-blue-500',
        'border-blue-600',
        'border-blue-400',
        'border-dashed',
        'bg-blue-50/10',
        'bg-blue-50/20',
        'bg-blue-50/60',
        'shadow-lg',
        'shadow-xl',
        'shadow-md',
        'ring-2',
        'ring-blue-200',
        'ring-blue-300'
      ];

      // Filter out editor classes and hover variants
      const cleanClasses = classes.filter(cls => {
        // Remove if it's an editor class
        if (editorClasses.includes(cls)) return false;

        // Remove if it starts with hover: and is editor-related
        if (cls.startsWith('hover:')) {
          const baseClass = cls.replace('hover:', '');
          if (editorClasses.includes(baseClass)) return false;
        }

        // Remove shadow classes with blue color
        if (cls.startsWith('shadow-') && cls.includes('blue')) return false;

        return true;
      });

      return cleanClasses.join(' ');
    };

    // Clean editor classes from slots
    const cleanSlots = (slots) => {
      if (!slots) return {};
      const cleaned = {};
      Object.entries(slots).forEach(([key, slot]) => {
        cleaned[key] = {
          ...slot,
          className: removeEditorClasses(slot.className || '')
        };
      });
      return cleaned;
    };

    // Check if it's already in the correct format
    if (cartConfig.slots && cartConfig.metadata) {
      return {
        ...cartConfig,
        slots: cleanSlots(cartConfig.slots)
      };
    }

    // Transform from hierarchical CartSlotsEditor format to API format
    const transformed = {
      slots: cleanSlots(cartConfig.slots || {}),
      metadata: {
        created: cartConfig.timestamp || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        page_name: cartConfig.page_name || 'Cart',
        page_type: cartConfig.page_type || 'cart',
        slot_type: cartConfig.slot_type || 'cart_layout'
      }
    };

    // If slots are already properly structured, use them as-is
    if (!transformed.slots || Object.keys(transformed.slots).length === 0) {
      // Handle legacy slotContent format if it exists
      const { slotContent } = cartConfig;
      if (slotContent) {
        Object.keys(slotContent).forEach(slotId => {
          transformed.slots[slotId] = {
            id: slotId,
            type: 'text',
            content: slotContent[slotId],
            parentId: null,
            metadata: {
              lastModified: new Date().toISOString()
            }
          };
        });
      }
    }

    return transformed;
  }

  // Keep hierarchical structure - no more legacy transformations
  transformFromSlotConfigFormat(apiConfig) {

    // Return the hierarchical structure as-is (no transformation needed)
    // All configs should now use the standard hierarchical format
    return {
      page_name: apiConfig.page_name || apiConfig.metadata?.page_name || 'Unknown Page',
      slot_type: apiConfig.slot_type || apiConfig.metadata?.slot_type || 'unknown_layout',
      slots: apiConfig.slots || {},
      metadata: apiConfig.metadata || {}
    };
  }

  // Determine parent slot for a micro slot (can be enhanced)
  determineParentSlot(slotId) {
    // Simple logic - can be improved based on actual slot hierarchy
    if (slotId.includes('.')) {
      return slotId.split('.')[0];
    }
    return 'default';
  }
}

export default new SlotConfigurationService();