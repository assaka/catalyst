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

  // Revert to a specific version
  async revertToVersion(versionId) {
    try {
      const response = await apiClient.post(`${API_BASE}/revert/${versionId}`);
      return response;
    } catch (error) {
      console.error('Error reverting to version:', error);
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

  // Transform CartSlotsEditor configuration to SlotConfiguration API format
  transformToSlotConfigFormat(cartConfig) {
    // Check if it's already in the correct format
    if (cartConfig.slots && cartConfig.metadata) {
      return cartConfig;
    }

    // Transform from CartSlotsEditor format to API format
    const transformed = {
      slots: {},
      metadata: {
        created: cartConfig.timestamp || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        page_name: cartConfig.page_name || 'Cart',
        page_type: cartConfig.page_type || 'cart',
        slot_type: cartConfig.slot_type || 'cart_layout'
      },
      // Preserve CartSlotsEditor specific data structure
      cartData: {
        majorSlots: cartConfig.majorSlots || {},
        microSlotOrders: cartConfig.microSlotOrders || {},
        microSlotSpans: cartConfig.microSlotSpans || {},
        slotContent: cartConfig.slotContent || {},
        elementClasses: cartConfig.elementClasses || {},
        elementStyles: cartConfig.elementStyles || {},
        componentSizes: cartConfig.componentSizes || {},
        customSlots: cartConfig.customSlots || {}
      }
    };

    // Build slots structure for compatibility with generic slot system
    const { slotContent, elementClasses, elementStyles, microSlotSpans } = cartConfig;
    
    if (slotContent) {
      Object.keys(slotContent).forEach(slotId => {
        transformed.slots[slotId] = {
          content: slotContent[slotId],
          className: elementClasses?.[slotId] || '',
          styles: elementStyles?.[slotId] || {},
          // Include alignment from microSlotSpans
          alignment: this.extractAlignment(slotId, microSlotSpans),
          metadata: {
            lastModified: new Date().toISOString()
          }
        };
      });
    }

    console.log('🔄 Transformed configuration:', transformed);
    return transformed;
  }

  // Extract alignment information for a slot
  extractAlignment(slotId, microSlotSpans) {
    if (!microSlotSpans) return null;
    
    // Check all parent slots for this micro slot
    for (const parentSlot in microSlotSpans) {
      if (microSlotSpans[parentSlot]?.[slotId]?.align) {
        return microSlotSpans[parentSlot][slotId].align;
      }
    }
    return null;
  }

  // Transform SlotConfiguration API format back to CartSlotsEditor format
  transformFromSlotConfigFormat(apiConfig) {
    // If it's already in CartSlotsEditor format, return as-is
    if (apiConfig.majorSlots || apiConfig.microSlotOrders || apiConfig.cartData) {
      return apiConfig;
    }

    // If it has cartData section, use that
    if (apiConfig.cartData) {
      return {
        page_name: apiConfig.metadata?.page_name || 'Cart',
        page_type: apiConfig.metadata?.page_type || 'cart',
        slot_type: apiConfig.metadata?.slot_type || 'cart_layout',
        timestamp: apiConfig.metadata?.lastModified || apiConfig.metadata?.created,
        ...apiConfig.cartData
      };
    }

    // Otherwise, it's in the old slots format - convert to CartSlotsEditor format
    const cartConfig = {
      page_name: apiConfig.metadata?.page_name || 'Cart',
      page_type: apiConfig.metadata?.page_type || 'cart', 
      slot_type: apiConfig.metadata?.slot_type || 'cart_layout',
      timestamp: apiConfig.metadata?.lastModified || apiConfig.metadata?.created,
      majorSlots: {},
      microSlotOrders: {},
      microSlotSpans: {},
      slotContent: {},
      elementClasses: {},
      elementStyles: {},
      componentSizes: {},
      customSlots: {}
    };

    // Extract data from slots structure
    if (apiConfig.slots) {
      Object.keys(apiConfig.slots).forEach(slotId => {
        const slot = apiConfig.slots[slotId];
        cartConfig.slotContent[slotId] = slot.content || '';
        cartConfig.elementClasses[slotId] = slot.className || '';
        cartConfig.elementStyles[slotId] = slot.styles || {};
        
        // Handle alignment - need to determine parent slot
        if (slot.alignment) {
          // For now, assume all micro slots belong to a default parent
          // This can be enhanced based on actual slot hierarchy
          const parentSlot = this.determineParentSlot(slotId);
          if (!cartConfig.microSlotSpans[parentSlot]) {
            cartConfig.microSlotSpans[parentSlot] = {};
          }
          cartConfig.microSlotSpans[parentSlot][slotId] = {
            align: slot.alignment
          };
        }
      });
    }

    console.log('🔄 Transformed from API format:', cartConfig);
    return cartConfig;
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