/**
 * Diff Integration Service
 * Bridges the hybrid customization system with the existing DiffPreviewSystem.jsx
 * Transforms snapshot data into the format expected by the Diff tab
 */

const { HybridCustomization } = require('../models');
const { Op } = require('sequelize');

class DiffIntegrationService {
  constructor() {
    this.eventEmitter = null;
  }

  /**
   * Set the event emitter for broadcasting diff updates
   * @param {EventEmitter} emitter - Node.js EventEmitter instance
   */
  setEventEmitter(emitter) {
    this.eventEmitter = emitter;
  }

  /**
   * Get diff patches for a specific file path
   * Transforms hybrid system data into DiffPreviewSystem format
   * @param {string} filePath - File path to get diffs for
   * @param {string} userId - User ID for filtering
   * @returns {Array} Array of patches in DiffPreviewSystem format
   */
  async getDiffPatchesForFile(filePath, userId) {
    try {
      // Find all customizations for this file path
      const customizations = await HybridCustomization.findAll({
        where: {
          file_path: filePath,
          user_id: userId,
          status: 'active'
        },
        include: [{
          association: 'snapshots',
          separate: true,
          order: [['snapshot_number', 'DESC']],
          limit: 10 // Get latest 10 snapshots
        }],
        order: [['updated_at', 'DESC']]
      });

      const patches = [];

      for (const customization of customizations) {
        for (const snapshot of customization.snapshots) {
          // Transform snapshot into DiffPreviewSystem format
          const patch = await this.transformSnapshotToDiffPatch(snapshot, customization);
          if (patch && patch.diffHunks && patch.diffHunks.length > 0) {
            patches.push(patch);
          }
        }
      }

      return patches;
    } catch (error) {
      console.error('Error getting diff patches for file:', error);
      return [];
    }
  }

  /**
   * Transform a snapshot into DiffPreviewSystem format
   * @param {Object} snapshot - Customization snapshot from database
   * @param {Object} customization - Parent customization
   * @returns {Object} Transformed patch object
   */
  async transformSnapshotToDiffPatch(snapshot, customization) {
    try {
      // Parse patch operations to create diff hunks
      const patchOps = snapshot.patch_operations || [];
      const diffHunks = this.convertPatchOperationsToDiffHunks(
        patchOps, 
        snapshot.code_before || customization.baseline_code,
        snapshot.code_after
      );

      return {
        id: snapshot.id,
        customization_id: snapshot.customization_id,
        snapshot_number: snapshot.snapshot_number,
        change_type: snapshot.change_type,
        change_summary: snapshot.change_summary,
        created_at: snapshot.created_at,
        ai_prompt: snapshot.ai_prompt,
        
        // DiffPreviewSystem expected format
        diffHunks: diffHunks,
        
        // Additional metadata for the UI
        metadata: {
          customization_name: customization.name,
          version_number: customization.version_number,
          component_type: customization.component_type,
          affected_symbols: snapshot.affected_symbols
        }
      };
    } catch (error) {
      console.error('Error transforming snapshot to diff patch:', error);
      return null;
    }
  }

  /**
   * Convert JSON Patch operations to diff hunks format expected by DiffPreviewSystem
   * @param {Array} patchOps - JSON Patch operations
   * @param {string} beforeCode - Code before changes
   * @param {string} afterCode - Code after changes
   * @returns {Array} Array of diff hunks
   */
  convertPatchOperationsToDiffHunks(patchOps, beforeCode, afterCode) {
    try {
      const beforeLines = (beforeCode || '').split('\n');
      const afterLines = (afterCode || '').split('\n');
      
      // Simple line-based diff algorithm
      const hunks = [];
      let currentHunk = null;
      
      const maxLines = Math.max(beforeLines.length, afterLines.length);
      
      for (let i = 0; i < maxLines; i++) {
        const beforeLine = beforeLines[i];
        const afterLine = afterLines[i];
        
        if (beforeLine !== afterLine) {
          // Start new hunk if needed
          if (!currentHunk) {
            currentHunk = {
              oldStart: i + 1,
              oldLines: 0,
              newStart: i + 1,
              newLines: 0,
              changes: []
            };
          }
          
          // Add changes to current hunk
          if (beforeLine !== undefined && afterLine !== undefined) {
            // Modified line
            currentHunk.changes.push({
              type: 'del',
              content: beforeLine,
              oldLine: i + 1
            });
            currentHunk.changes.push({
              type: 'add',
              content: afterLine,
              newLine: i + 1
            });
            currentHunk.oldLines++;
            currentHunk.newLines++;
          } else if (beforeLine !== undefined) {
            // Deleted line
            currentHunk.changes.push({
              type: 'del',
              content: beforeLine,
              oldLine: i + 1
            });
            currentHunk.oldLines++;
          } else if (afterLine !== undefined) {
            // Added line
            currentHunk.changes.push({
              type: 'add',
              content: afterLine,
              newLine: i + 1
            });
            currentHunk.newLines++;
          }
        } else if (currentHunk && beforeLine === afterLine) {
          // Context line - add a few for readability
          if (currentHunk.changes.length < 50) { // Limit context lines
            currentHunk.changes.push({
              type: 'normal',
              content: beforeLine || '',
              oldLine: i + 1,
              newLine: i + 1
            });
          } else {
            // End current hunk and start collecting again
            hunks.push(currentHunk);
            currentHunk = null;
          }
        }
      }
      
      // Add final hunk if exists
      if (currentHunk && currentHunk.changes.length > 0) {
        hunks.push(currentHunk);
      }
      
      return hunks;
    } catch (error) {
      console.error('Error converting patch operations to diff hunks:', error);
      return [];
    }
  }

  /**
   * Broadcast diff patches loaded event for the frontend
   * This is what DiffPreviewSystem.jsx listens for
   * @param {string} filePath - File path
   * @param {Array} patches - Array of diff patches
   * @param {Object} io - Socket.io instance (optional)
   */
  broadcastDiffPatchesLoaded(filePath, patches, io = null) {
    const eventData = {
      file: { path: filePath },
      patches: patches
    };

    // Emit to WebSocket clients if available
    if (io) {
      io.emit('astPatchesLoaded', eventData);
    }

    // Emit to Node.js event emitter if available
    if (this.eventEmitter) {
      this.eventEmitter.emit('astPatchesLoaded', eventData);
    }

    console.log(`📡 Broadcasted ${patches.length} diff patches for file: ${filePath}`);
  }

  /**
   * Get diff patches and broadcast them
   * @param {string} filePath - File path to get diffs for
   * @param {string} userId - User ID for filtering
   * @param {Object} io - Socket.io instance (optional)
   */
  async loadAndBroadcastDiffPatches(filePath, userId, io = null) {
    try {
      const patches = await this.getDiffPatchesForFile(filePath, userId);
      this.broadcastDiffPatchesLoaded(filePath, patches, io);
      return patches;
    } catch (error) {
      console.error('Error loading and broadcasting diff patches:', error);
      this.broadcastDiffPatchesLoaded(filePath, [], io);
      return [];
    }
  }

  /**
   * Handle snapshot creation - automatically broadcast updates
   * Call this after creating snapshots in the hybrid system
   * @param {Object} snapshot - Created snapshot
   * @param {Object} customization - Parent customization
   * @param {Object} io - Socket.io instance (optional)
   */
  async handleSnapshotCreated(snapshot, customization, io = null) {
    try {
      console.log(`📸 New snapshot created for ${customization.file_path}`);
      
      // Reload and broadcast patches for this file
      await this.loadAndBroadcastDiffPatches(
        customization.file_path,
        customization.user_id,
        io
      );
    } catch (error) {
      console.error('Error handling snapshot created:', error);
    }
  }

  /**
   * Handle rollback completion - broadcast updated patches
   * @param {Object} customization - Customization that was rolled back
   * @param {Object} io - Socket.io instance (optional)
   */
  async handleRollbackCompleted(customization, io = null) {
    try {
      console.log(`↩️ Rollback completed for ${customization.file_path}`);
      
      // Reload and broadcast patches for this file
      await this.loadAndBroadcastDiffPatches(
        customization.file_path,
        customization.user_id,
        io
      );
    } catch (error) {
      console.error('Error handling rollback completed:', error);
    }
  }
}

// Export singleton instance
const diffIntegrationService = new DiffIntegrationService();

module.exports = {
  DiffIntegrationService,
  diffIntegrationService
};