import apiClient from '@/api/client';

const API_BASE = 'slot-configurations';

class SlotConfigurationService {
  // Get or create draft configuration for editing
  async getDraftConfiguration(storeId, pageType = 'cart') {
    try {
      const response = await apiClient.get(`${API_BASE}/draft/${storeId}/${pageType}`);
      return response;
    } catch (error) {
      console.error('Error getting draft configuration:', error);
      throw error;
    }
  }

  // Get published configuration for display (used by storefront)
  async getPublishedConfiguration(storeId, pageType = 'cart') {
    try {
      const response = await apiClient.get(`${API_BASE}/published/${storeId}/${pageType}`);
      return response;
    } catch (error) {
      console.error('Error getting published configuration:', error);
      throw error;
    }
  }

  // Update draft configuration
  async updateDraftConfiguration(configId, configuration) {
    try {
      const response = await apiClient.put(`${API_BASE}/draft/${configId}`, {
        configuration
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

  // Helper method to save configuration with auto-draft creation
  async saveConfiguration(storeId, configuration, pageType = 'cart') {
    try {
      // First get or create a draft
      const draftResponse = await this.getDraftConfiguration(storeId, pageType);
      const draftConfig = draftResponse.data;

      // Transform CartSlotsEditor format to SlotConfiguration API format
      const apiConfiguration = this.transformToSlotConfigFormat(configuration);

      // Update the draft with new configuration
      const updateResponse = await this.updateDraftConfiguration(draftConfig.id, apiConfiguration);
      return updateResponse;
    } catch (error) {
      console.error('Error saving configuration:', error);
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
      console.log(`🔍 Checking draft configuration for ${storeId}/${pageType}...`);
      
      // Try to get existing draft
      try {
        const draftResponse = await this.getDraftConfiguration(storeId, pageType);
        if (draftResponse.success && draftResponse.data) {
          console.log(`✅ Found existing draft configuration for ${storeId}/${pageType}`);
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
        console.log(`✨ Created new draft configuration for ${storeId}/${pageType} from initial values`);
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

  // Get initial configuration from cart-config.js
  async getInitialConfiguration(pageType = 'cart', fileName = null) {
    // Dynamic import to get the latest cart config
    const { cartConfig } = await import('@/components/editor/slot/configs/cart-config.js');
    
    console.log(`🏗️ Creating initial configuration for ${pageType} from cart-config.js`);
    
    // Check if cart config has the new unified structure or original structure
    let initialConfig;
    
    // Use the new nested  structure
    initialConfig = {
      // Use the root slots and nested  structure
      rootSlots: cartConfig.rootSlots || [],
      slotDefinitions: cartConfig.slotDefinitions || {},
      slots: { ...cartConfig.slots },
      
      // Add metadata
      metadata: {
        name: `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Layout`,
        version: '2.0',
        system: 'nested-',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        pageType: pageType,
        fileName: fileName,
        source: 'cart-config.js',
        page_name: cartConfig.page_name,
        slot_type: cartConfig.slot_type
      }
    };

    return initialConfig;
  }

  // Transform CartSlotsEditor configuration to SlotConfiguration API format
  transformToSlotConfigFormat(cartConfig) {
    // Check if it's already in the correct format
    if (cartConfig.slots && cartConfig.metadata) {
      return cartConfig;
    }

    // Transform from hierarchical CartSlotsEditor format to API format
    const transformed = {
      slots: cartConfig.slots || {},
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

    console.log('🔄 Transformed configuration:', transformed);
    return transformed;
  }

  // Keep hierarchical structure - no more legacy transformations
  transformFromSlotConfigFormat(apiConfig) {
    console.log('🔄 Preserving hierarchical structure (no legacy transformation):', apiConfig);
    
    // Return the hierarchical structure as-is for CartSlotsEditor
    return {
      page_name: apiConfig.metadata?.page_name || 'Cart',
      slot_type: apiConfig.metadata?.slot_type || 'cart_layout',
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