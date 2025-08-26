/**
 * Overlay Database Bridge Service
 * Bridges frontend OverlayManager with backend database persistence
 */

import { apiClient } from '../lib/api-client';

class OverlayDatabaseBridge {
  constructor(options = {}) {
    this.options = {
      apiBaseUrl: '/api/customization-overlays',
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      enableVersionControl: true,
      ...options
    };
    
    this.pendingOperations = new Map();
    this.saveTimeouts = new Map();
  }

  /**
   * Save overlay to database
   */
  async saveOverlay({ filePath, originalCode, modifiedCode, metadata = {}, temporary = false }) {
    try {
      const response = await apiClient.post(this.options.apiBaseUrl, {
        filePath,
        originalCode,
        modifiedCode,
        metadata,
        temporary,
        changeSummary: metadata.changeSummary || 'Auto-saved changes',
        changeType: metadata.changeType || 'manual_edit'
      });

      if (response.data?.success) {
        return {
          success: true,
          customization: response.data.customization,
          snapshot: response.data.snapshot,
          overlayId: response.data.overlayId
        };
      } else {
        throw new Error(response.data?.error || 'Failed to save overlay');
      }
    } catch (error) {
      console.error('Error saving overlay to database:', error);
      return {
        success: false,
        error: error.message || 'Failed to save overlay'
      };
    }
  }

  /**
   * Load overlay from database
   */
  async loadOverlay(filePath, temporary = false) {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await apiClient.get(
        `${this.options.apiBaseUrl}/${encodedPath}?temporary=${temporary}`
      );

      return response.data;
    } catch (error) {
      console.error('Error loading overlay from database:', error);
      return {
        success: false,
        error: error.message || 'Failed to load overlay'
      };
    }
  }

  /**
   * Update existing overlay
   */
  async updateOverlay(customizationId, modifiedCode, metadata = {}) {
    try {
      const response = await apiClient.put(`${this.options.apiBaseUrl}/${customizationId}`, {
        modifiedCode,
        metadata
      });

      return response.data;
    } catch (error) {
      console.error('Error updating overlay in database:', error);
      return {
        success: false,
        error: error.message || 'Failed to update overlay'
      };
    }
  }

  /**
   * Remove overlay from database
   */
  async removeOverlay(customizationId, archive = true) {
    try {
      const response = await apiClient.delete(
        `${this.options.apiBaseUrl}/${customizationId}?archive=${archive}`
      );

      return response.data;
    } catch (error) {
      console.error('Error removing overlay from database:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove overlay'
      };
    }
  }

  /**
   * Get user's overlays
   */
  async getUserOverlays(options = {}) {
    try {
      const {
        userId,
        storeId = null,
        status = 'active',
        limit = 50,
        includeTemporary = false
      } = options;

      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      if (status) params.append('status', status);
      if (limit) params.append('limit', limit.toString());
      if (includeTemporary) params.append('includeTemporary', includeTemporary.toString());

      const response = await apiClient.get(
        `${this.options.apiBaseUrl}/user/${userId}?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting user overlays:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user overlays'
      };
    }
  }

  /**
   * Finalize temporary overlay
   */
  async finalizeOverlay(overlayId) {
    try {
      const response = await apiClient.post(`${this.options.apiBaseUrl}/${overlayId}/finalize`);

      return response.data;
    } catch (error) {
      console.error('Error finalizing overlay:', error);
      return {
        success: false,
        error: error.message || 'Failed to finalize overlay'
      };
    }
  }

  /**
   * Get overlay statistics
   */
  async getStats(userId = null) {
    try {
      const params = userId ? `?userId=${userId}` : '';
      const response = await apiClient.get(`${this.options.apiBaseUrl}/stats${params}`);

      return response.data;
    } catch (error) {
      console.error('Error getting overlay stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to get overlay stats'
      };
    }
  }

  /**
   * Auto-save overlay with debouncing
   */
  autoSaveOverlay(filePath, originalCode, modifiedCode, metadata = {}) {
    // Clear existing timeout for this file
    if (this.saveTimeouts.has(filePath)) {
      clearTimeout(this.saveTimeouts.get(filePath));
    }

    // Set new timeout for debounced save
    const timeout = setTimeout(async () => {
      try {
        await this.saveOverlay({
          filePath,
          originalCode,
          modifiedCode,
          metadata: {
            ...metadata,
            autoSaved: true,
            saveTimestamp: Date.now()
          },
          temporary: true // Auto-saves are temporary until finalized
        });
        
        console.log(`Auto-saved overlay for ${filePath}`);
      } catch (error) {
        console.error(`Auto-save failed for ${filePath}:`, error);
      } finally {
        this.saveTimeouts.delete(filePath);
      }
    }, this.options.autoSaveInterval);

    this.saveTimeouts.set(filePath, timeout);
  }

  /**
   * VERSION CONTROL METHODS
   */

  /**
   * Create new customization with version control
   */
  async createCustomization({ name, description, componentType = 'component', filePath, baselineCode, initialCode, changeType = 'manual_edit', changeSummary }) {
    try {
      const response = await apiClient.post(`${this.options.apiBaseUrl}/version-control/create`, {
        name,
        description,
        componentType,
        filePath,
        baselineCode,
        initialCode,
        changeType,
        changeSummary
      });

      return response.data;
    } catch (error) {
      console.error('Error creating customization:', error);
      return {
        success: false,
        error: error.message || 'Failed to create customization'
      };
    }
  }

  /**
   * Apply changes to existing customization
   */
  async applyChanges(customizationId, { modifiedCode, changeSummary, changeDescription, changeType = 'modification' }) {
    try {
      const response = await apiClient.post(
        `${this.options.apiBaseUrl}/version-control/${customizationId}/changes`,
        {
          modifiedCode,
          changeSummary,
          changeDescription,
          changeType
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error applying changes:', error);
      return {
        success: false,
        error: error.message || 'Failed to apply changes'
      };
    }
  }

  /**
   * Get customization with version history
   */
  async getCustomization(customizationId, includeSnapshots = true) {
    try {
      const response = await apiClient.get(
        `${this.options.apiBaseUrl}/version-control/${customizationId}?includeSnapshots=${includeSnapshots}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting customization:', error);
      return {
        success: false,
        error: error.message || 'Failed to get customization'
      };
    }
  }

  /**
   * Get user's customizations
   */
  async getUserCustomizations(userId, storeId = null, status = 'active') {
    try {
      const params = new URLSearchParams();
      if (storeId) params.append('storeId', storeId);
      if (status) params.append('status', status);

      const response = await apiClient.get(
        `${this.options.apiBaseUrl}/version-control/user/${userId}?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting user customizations:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user customizations'
      };
    }
  }

  /**
   * Get customizations by file
   */
  async getCustomizationsByFile(filePath) {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await apiClient.get(
        `${this.options.apiBaseUrl}/version-control/file/${encodedPath}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting customizations by file:', error);
      return {
        success: false,
        error: error.message || 'Failed to get customizations by file'
      };
    }
  }

  /**
   * Finalize snapshot
   */
  async finalizeSnapshot(snapshotId, metadata = {}) {
    try {
      const response = await apiClient.post(
        `${this.options.apiBaseUrl}/version-control/snapshots/${snapshotId}/finalize`,
        { metadata }
      );

      return response.data;
    } catch (error) {
      console.error('Error finalizing snapshot:', error);
      return {
        success: false,
        error: error.message || 'Failed to finalize snapshot'
      };
    }
  }

  /**
   * Revert to snapshot
   */
  async revertToSnapshot(customizationId, snapshotId, metadata = {}) {
    try {
      const response = await apiClient.post(
        `${this.options.apiBaseUrl}/version-control/${customizationId}/revert/${snapshotId}`,
        { metadata }
      );

      return response.data;
    } catch (error) {
      console.error('Error reverting to snapshot:', error);
      return {
        success: false,
        error: error.message || 'Failed to revert to snapshot'
      };
    }
  }

  /**
   * Archive customization
   */
  async archiveCustomization(customizationId) {
    try {
      const response = await apiClient.post(
        `${this.options.apiBaseUrl}/version-control/${customizationId}/archive`
      );

      return response.data;
    } catch (error) {
      console.error('Error archiving customization:', error);
      return {
        success: false,
        error: error.message || 'Failed to archive customization'
      };
    }
  }

  /**
   * Get version control statistics
   */
  async getVersionControlStats(userId = null, storeId = null) {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (storeId) params.append('storeId', storeId);

      const response = await apiClient.get(
        `${this.options.apiBaseUrl}/version-control/stats?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error getting version control stats:', error);
      return {
        success: false,
        error: error.message || 'Failed to get version control stats'
      };
    }
  }

  /**
   * Clean up pending operations
   */
  cleanup() {
    // Clear all pending save timeouts
    for (const timeout of this.saveTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.saveTimeouts.clear();
    this.pendingOperations.clear();
  }
}

export default OverlayDatabaseBridge;