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
      
      // Update the draft with new configuration
      const updateResponse = await this.updateDraftConfiguration(draftConfig.id, configuration);
      return updateResponse;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }
}

export default new SlotConfigurationService();