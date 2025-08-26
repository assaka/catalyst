/**
 * Overlay Persistence Service
 * Manages database persistence for temporary overlays and bridges with OverlayManager
 */

const { CustomizationOverlay, CustomizationSnapshot } = require('../models');

class OverlayPersistenceService {
  constructor(options = {}) {
    this.options = {
      autoSaveInterval: 30000, // 30 seconds
      maxTemporaryOverlays: 50,
      enableAutoCleanup: true,
      overlayTTL: 30 * 60 * 1000, // 30 minutes
      ...options
    };

    this.temporaryOverlays = new Map(); // In-memory storage for quick access
    this.cleanupInterval = null;

    if (this.options.enableAutoCleanup) {
      this.startCleanupScheduler();
    }
  }

  /**
   * Save overlay to database (persistent storage)
   */
  async saveOverlay({ userId, filePath, originalCode, modifiedCode, metadata = {}, temporary = false }) {
    try {
      // Check if customization already exists for this user and file
      let customization = await CustomizationOverlay.findOne({
        where: {
          user_id: userId,
          file_path: filePath,
          status: 'active'
        }
      });

      if (!customization) {
        // Create new customization
        customization = await CustomizationOverlay.create({
          user_id: userId,
          name: `Auto-saved changes to ${filePath.split('/').pop()}`,
          description: 'Auto-generated from overlay system',
          file_path: filePath,
          component_type: this.detectComponentType(filePath),
          baseline_code: originalCode,
          current_code: modifiedCode,
          status: temporary ? 'draft' : 'active',
          change_type: 'manual_edit',
          metadata: {
            ...metadata,
            source: 'overlay_persistence',
            temporary,
            created_at: Date.now()
          }
        });
      } else {
        // Update existing customization
        await customization.update({
          current_code: modifiedCode,
          metadata: {
            ...customization.metadata,
            ...metadata,
            last_overlay_update: Date.now()
          }
        });
      }

      // Create snapshot for this overlay state
      const snapshot = await CustomizationSnapshot.create({
        customization_id: customization.id,
        version_number: await this.getNextVersionNumber(customization.id),
        change_summary: metadata.changeSummary || 'Auto-saved overlay changes',
        change_description: metadata.changeDescription || `Overlay update at ${new Date().toLocaleTimeString()}`,
        change_type: 'auto_save',
        status: temporary ? 'open' : 'finalized',
        created_by: userId,
        metadata: {
          overlay_id: metadata.overlayId,
          auto_saved: true,
          temporary
        }
      });

      // Store in temporary cache if it's a temporary overlay
      if (temporary) {
        const overlayId = `${userId}_${filePath}_${Date.now()}`;
        this.temporaryOverlays.set(overlayId, {
          id: overlayId,
          customization,
          snapshot,
          createdAt: Date.now(),
          expiresAt: Date.now() + this.options.overlayTTL
        });
      }

      return {
        success: true,
        customization,
        snapshot,
        overlayId: temporary ? `${userId}_${filePath}_${Date.now()}` : null
      };
    } catch (error) {
      console.error('Error saving overlay:', error);
      return {
        success: false,
        error: error.message || 'Failed to save overlay'
      };
    }
  }

  /**
   * Load overlay from database
   */
  async loadOverlay(userId, filePath, temporary = false) {
    try {
      if (temporary) {
        // Check temporary cache first
        for (const [overlayId, overlay] of this.temporaryOverlays) {
          if (overlay.customization.user_id === userId && 
              overlay.customization.file_path === filePath && 
              overlay.expiresAt > Date.now()) {
            return {
              success: true,
              overlay,
              fromCache: true
            };
          }
        }
      }

      // Load from database
      const customization = await CustomizationOverlay.findOne({
        where: {
          user_id: userId,
          file_path: filePath,
          status: temporary ? 'draft' : 'active'
        },
        include: [{
          model: CustomizationSnapshot,
          as: 'snapshots',
          limit: 5,
          order: [['version_number', 'DESC']]
        }]
      });

      if (!customization) {
        return {
          success: false,
          error: 'No overlay found for this file'
        };
      }

      return {
        success: true,
        customization,
        snapshots: customization.snapshots,
        fromCache: false
      };
    } catch (error) {
      console.error('Error loading overlay:', error);
      return {
        success: false,
        error: error.message || 'Failed to load overlay'
      };
    }
  }

  /**
   * Update existing overlay
   */
  async updateOverlay(customizationId, { modifiedCode, metadata = {}, userId }) {
    try {
      const customization = await CustomizationOverlay.findByPk(customizationId);
      if (!customization) {
        return { success: false, error: 'Customization not found' };
      }

      // Update customization
      await customization.update({
        current_code: modifiedCode,
        metadata: {
          ...customization.metadata,
          ...metadata,
          last_update: Date.now()
        }
      });

      // Create new snapshot
      const snapshot = await CustomizationSnapshot.create({
        customization_id: customizationId,
        version_number: await this.getNextVersionNumber(customizationId),
        change_summary: metadata.changeSummary || 'Overlay updated',
        change_description: metadata.changeDescription || `Updated at ${new Date().toLocaleTimeString()}`,
        change_type: 'modification',
        status: 'open',
        created_by: userId,
        metadata: {
          ...metadata,
          updated_via: 'overlay_persistence'
        }
      });

      // Update temporary cache if exists
      for (const [overlayId, overlay] of this.temporaryOverlays) {
        if (overlay.customization.id === customizationId) {
          overlay.customization = customization;
          overlay.snapshot = snapshot;
          break;
        }
      }

      return {
        success: true,
        customization,
        snapshot
      };
    } catch (error) {
      console.error('Error updating overlay:', error);
      return {
        success: false,
        error: error.message || 'Failed to update overlay'
      };
    }
  }

  /**
   * Remove overlay
   */
  async removeOverlay(customizationId, archive = true) {
    try {
      const customization = await CustomizationOverlay.findByPk(customizationId);
      if (!customization) {
        return { success: false, error: 'Customization not found' };
      }

      if (archive) {
        // Archive instead of delete
        await customization.update({ status: 'archived' });
      } else {
        // Hard delete (also deletes related snapshots due to CASCADE)
        await customization.destroy();
      }

      // Remove from temporary cache
      for (const [overlayId, overlay] of this.temporaryOverlays) {
        if (overlay.customization.id === customizationId) {
          this.temporaryOverlays.delete(overlayId);
          break;
        }
      }

      return {
        success: true,
        message: archive ? 'Overlay archived' : 'Overlay deleted'
      };
    } catch (error) {
      console.error('Error removing overlay:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove overlay'
      };
    }
  }

  /**
   * Get all overlays for user
   */
  async getUserOverlays(userId, options = {}) {
    try {
      const {
        storeId = null,
        status = 'active',
        limit = 50,
        includeTemporary = false
      } = options;

      const where = { user_id: userId };
      if (storeId) where.store_id = storeId;
      if (status) where.status = status;

      const overlays = await CustomizationOverlay.findAll({
        where,
        include: [{
          model: CustomizationSnapshot,
          as: 'snapshots',
          limit: 3,
          order: [['version_number', 'DESC']]
        }],
        order: [['updated_at', 'DESC']],
        limit
      });

      // Add temporary overlays if requested
      let temporaryOverlays = [];
      if (includeTemporary) {
        temporaryOverlays = Array.from(this.temporaryOverlays.values())
          .filter(overlay => overlay.customization.user_id === userId && overlay.expiresAt > Date.now());
      }

      return {
        success: true,
        persistentOverlays: overlays,
        temporaryOverlays,
        totalCount: overlays.length + temporaryOverlays.length
      };
    } catch (error) {
      console.error('Error getting user overlays:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user overlays'
      };
    }
  }

  /**
   * Finalize temporary overlay (make it permanent)
   */
  async finalizeOverlay(overlayId, userId) {
    try {
      const temporaryOverlay = this.temporaryOverlays.get(overlayId);
      if (!temporaryOverlay) {
        return { success: false, error: 'Temporary overlay not found' };
      }

      // Update customization status to active
      await temporaryOverlay.customization.update({ status: 'active' });

      // Update latest snapshot status to finalized
      if (temporaryOverlay.snapshot) {
        await temporaryOverlay.snapshot.update({ 
          status: 'finalized',
          finalized_at: new Date()
        });
      }

      // Remove from temporary cache
      this.temporaryOverlays.delete(overlayId);

      return {
        success: true,
        customization: temporaryOverlay.customization,
        snapshot: temporaryOverlay.snapshot,
        message: 'Overlay finalized successfully'
      };
    } catch (error) {
      console.error('Error finalizing overlay:', error);
      return {
        success: false,
        error: error.message || 'Failed to finalize overlay'
      };
    }
  }

  /**
   * Get persistence statistics
   */
  async getStats(userId = null) {
    try {
      const where = {};
      if (userId) where.user_id = userId;

      const totalOverlays = await CustomizationOverlay.count({ where });
      const activeOverlays = await CustomizationOverlay.count({ 
        where: { ...where, status: 'active' } 
      });
      const draftOverlays = await CustomizationOverlay.count({ 
        where: { ...where, status: 'draft' } 
      });
      const archivedOverlays = await CustomizationOverlay.count({ 
        where: { ...where, status: 'archived' } 
      });

      const temporaryCount = Array.from(this.temporaryOverlays.values())
        .filter(overlay => !userId || overlay.customization.user_id === userId)
        .length;

      return {
        totalOverlays,
        activeOverlays,
        draftOverlays,
        archivedOverlays,
        temporaryOverlays: temporaryCount,
        cleanupScheduled: !!this.cleanupInterval
      };
    } catch (error) {
      console.error('Error getting persistence stats:', error);
      return {
        totalOverlays: 0,
        activeOverlays: 0,
        draftOverlays: 0,
        archivedOverlays: 0,
        temporaryOverlays: 0,
        cleanupScheduled: false
      };
    }
  }

  /**
   * Detect component type from file path
   */
  detectComponentType(filePath) {
    if (filePath.includes('/pages/')) return 'page';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/utils/')) return 'util';
    if (filePath.includes('/config/')) return 'config';
    return 'component';
  }

  /**
   * Get next version number for customization
   */
  async getNextVersionNumber(customizationId) {
    try {
      const lastSnapshot = await CustomizationSnapshot.findOne({
        where: { customization_id: customizationId },
        order: [['version_number', 'DESC']]
      });

      return lastSnapshot ? lastSnapshot.version_number + 1 : 1;
    } catch (error) {
      console.error('Error getting next version number:', error);
      return 1;
    }
  }

  /**
   * Start cleanup scheduler for expired temporary overlays
   */
  startCleanupScheduler() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredOverlays();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Cleanup expired temporary overlays
   */
  cleanupExpiredOverlays() {
    const now = Date.now();
    const expired = [];

    for (const [overlayId, overlay] of this.temporaryOverlays) {
      if (overlay.expiresAt < now) {
        expired.push(overlayId);
      }
    }

    expired.forEach(overlayId => {
      this.temporaryOverlays.delete(overlayId);
    });

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired temporary overlays`);
    }

    // Also cleanup temporary overlays in database
    this.cleanupDatabaseTemporaryOverlays();
  }

  /**
   * Cleanup temporary overlays in database that are older than TTL
   */
  async cleanupDatabaseTemporaryOverlays() {
    try {
      const cutoffTime = new Date(Date.now() - this.options.overlayTTL);

      const result = await CustomizationOverlay.destroy({
        where: {
          status: 'draft',
          created_at: {
            [require('sequelize').Op.lt]: cutoffTime
          }
        }
      });

      if (result > 0) {
        console.log(`Cleaned up ${result} expired temporary overlays from database`);
      }
    } catch (error) {
      console.error('Error cleaning up database temporary overlays:', error);
    }
  }

  /**
   * Destroy service and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.temporaryOverlays.clear();
  }
}

module.exports = OverlayPersistenceService;