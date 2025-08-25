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
   * Get diff patches for a specific file path (optimized for line-diff storage)
   * Transforms hybrid system data into DiffPreviewSystem format
   * @param {string} filePath - File path to get diffs for
   * @param {string} userId - User ID for filtering
   * @param {string} storeId - Store ID for filtering (store-scoped patches)
   * @returns {Array} Array of patches in DiffPreviewSystem format
   */
  async getDiffPatchesForFile(filePath, userId, storeId = null) {
    try {
      console.log(`🔍 Retrieving patches for: ${filePath} (${storeId ? `store: ${storeId}` : `user: ${userId}`})`);
      
      // Find all customizations for this file path (store-scoped)
      const whereCondition = {
        file_path: filePath,
        status: 'active'
      };
      
      // Use store-scoped filtering if storeId provided, otherwise fall back to user-scoped
      if (storeId) {
        whereCondition.store_id = storeId;
        console.log(`🏪 Using store-scoped patches for store: ${storeId}`);
      } else {
        whereCondition.user_id = userId;
        console.log(`👤 Using user-scoped patches for user: ${userId}`);
      }
      
      // Optimized query: only get snapshots with line diffs, sorted by latest first
      const customizations = await HybridCustomization.findAll({
        where: whereCondition,
        include: [{
          association: 'snapshots',
          separate: true,
          where: {
            ast_diff: { [Op.ne]: null }, // Only get snapshots with diff data
            [Op.or]: [
              { status: 'open' }, // Current editing session
              { status: 'finalized' } // Published changes
            ]
          },
          order: [['snapshot_number', 'DESC']],
          limit: 20, // Get latest 20 snapshots with diffs
          attributes: [
            'id', 'customization_id', 'snapshot_number', 'change_type', 
            'change_summary', 'change_description', 'ast_diff', 'affected_symbols',
            'patch_preview', 'ai_prompt', 'created_at', 'status'
          ]
        }],
        order: [['updated_at', 'DESC']],
        attributes: [
          'id', 'name', 'component_type', 'file_path', 'version_number',
          'baseline_code', 'created_at', 'updated_at'
        ]
      });

      console.log(`📊 Found ${customizations.length} customizations with ${customizations.reduce((total, c) => total + (c.snapshots?.length || 0), 0)} snapshots`);

      const patches = [];

      for (const customization of customizations) {
        for (const snapshot of customization.snapshots || []) {
          // Process snapshots with valid diff data (both unified_diff and line_diff formats)
          if (snapshot.ast_diff && snapshot.ast_diff.hasChanges) {
            const patch = await this.transformSnapshotToDiffPatch(snapshot, customization);
            if (patch && patch.diffHunks && patch.diffHunks.length > 0) {
              patches.push(patch);
            }
          }
        }
      }

      console.log(`📦 Generated ${patches.length} patches for Diff tab`);
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
      let diffHunks = [];
      
      // Check if we have unified diff data (latest format)
      if (snapshot.ast_diff && snapshot.ast_diff.type === 'unified_diff') {
        console.log(`📄 Using unified diff data for snapshot ${snapshot.id}`);
        diffHunks = this.convertUnifiedDiffToDiffHunks(snapshot.ast_diff);
      } else if (snapshot.ast_diff && snapshot.ast_diff.type === 'line_diff') {
        console.log(`📄 Using line diff data for snapshot ${snapshot.id}`);
        diffHunks = this.convertLineDiffToDiffHunks(snapshot.ast_diff);
      } else {
        // Fallback for older snapshots without diff data (legacy format)
        console.log(`📄 Using legacy patch operations for snapshot ${snapshot.id}`);
        const patchOps = snapshot.patch_operations || [];
        diffHunks = this.convertPatchOperationsToDiffHunks(
          patchOps, 
          customization.baseline_code || '',
          '' // No code_after column - reconstruct from operations if needed
        );
      }

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
   * Convert line diff data to diff hunks format expected by DiffPreviewSystem
   * @param {Object} lineDiff - Line diff data from ast_diff column
   * @returns {Array} Array of diff hunks
   */
  convertLineDiffToDiffHunks(lineDiff) {
    try {
      if (!lineDiff || !lineDiff.changes || lineDiff.changes.length === 0) {
        return [];
      }

      console.log(`📄 Converting line diff with ${lineDiff.changes.length} changes`);
      
      // Group consecutive line changes into hunks
      const hunks = [];
      let currentHunk = null;
      
      for (const change of lineDiff.changes) {
        const lineNumber = change.lineNumber; // Fixed: use correct property name
        
        // Start a new hunk if needed
        if (!currentHunk || lineNumber > (currentHunk.lastLine + 2)) {
          // Finish current hunk if exists
          if (currentHunk) {
            hunks.push(this.finalizeHunk(currentHunk));
          }
          
          // Start new hunk
          currentHunk = {
            oldStart: lineNumber,
            oldLines: 0,
            newStart: lineNumber,
            newLines: 0,
            changes: [],
            lastLine: lineNumber
          };
        }
        
        // Add change to current hunk with correct change type mappings
        if (change.type === 'add') {
          currentHunk.changes.push({
            type: 'add',
            content: change.content,
            newLine: lineNumber
          });
          currentHunk.newLines++;
        } else if (change.type === 'del') {
          currentHunk.changes.push({
            type: 'del',
            content: change.oldContent || change.content,
            oldLine: lineNumber
          });
          currentHunk.oldLines++;
        } else if (change.type === 'mod') { // Fixed: use 'mod' not 'modify'
          // For modify, show as delete + add
          currentHunk.changes.push({
            type: 'del',
            content: change.oldContent,
            oldLine: lineNumber
          });
          currentHunk.changes.push({
            type: 'add',
            content: change.content,
            newLine: lineNumber
          });
          currentHunk.oldLines++;
          currentHunk.newLines++;
        }
        
        currentHunk.lastLine = lineNumber;
      }
      
      // Finalize last hunk
      if (currentHunk) {
        hunks.push(this.finalizeHunk(currentHunk));
      }
      
      console.log(`📄 Generated ${hunks.length} diff hunks from line diff data`);
      return hunks;
    } catch (error) {
      console.error('Error converting line diff to diff hunks:', error);
      return [];
    }
  }

  /**
   * Finalize a hunk by cleaning up line numbers and ensuring proper format
   * @param {Object} hunk - Hunk to finalize
   * @returns {Object} Finalized hunk
   */
  finalizeHunk(hunk) {
    // Clean up the hunk object by removing helper properties
    const { lastLine, ...finalHunk } = hunk;
    return finalHunk;
  }

  /**
   * Convert unified diff data to diff hunks format expected by DiffPreviewSystem
   * @param {Object} unifiedDiff - Unified diff data from ast_diff column
   * @returns {Array} Array of diff hunks
   */
  convertUnifiedDiffToDiffHunks(unifiedDiff) {
    try {
      if (!unifiedDiff || !unifiedDiff.patch) {
        return [];
      }

      console.log(`📄 Converting unified diff patch with ${unifiedDiff.patch.length} characters`);
      
      // Parse the unified diff patch into hunks
      const hunks = [];
      const lines = unifiedDiff.patch.split('\n');
      let currentHunk = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('@@')) {
          // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
          const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
          if (hunkMatch) {
            // Finish previous hunk if exists
            if (currentHunk) {
              hunks.push(currentHunk);
            }
            
            // Start new hunk
            const oldStart = parseInt(hunkMatch[1]);
            const oldCount = parseInt(hunkMatch[2] || '1');
            const newStart = parseInt(hunkMatch[3]);
            const newCount = parseInt(hunkMatch[4] || '1');
            
            currentHunk = {
              oldStart: oldStart,
              oldLines: oldCount,
              newStart: newStart,
              newLines: newCount,
              changes: []
            };
          }
        } else if (currentHunk && (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-'))) {
          // Diff content line
          const changeType = line.charAt(0);
          const content = line.substring(1);
          
          if (changeType === ' ') {
            // Context line (unchanged)
            currentHunk.changes.push({
              type: 'normal',
              content: content,
              oldLine: currentHunk.changes.length + currentHunk.oldStart,
              newLine: currentHunk.changes.length + currentHunk.newStart
            });
          } else if (changeType === '-') {
            // Deleted line
            currentHunk.changes.push({
              type: 'del',
              content: content,
              oldLine: currentHunk.changes.filter(c => c.type !== 'add').length + currentHunk.oldStart
            });
          } else if (changeType === '+') {
            // Added line
            currentHunk.changes.push({
              type: 'add',
              content: content,
              newLine: currentHunk.changes.filter(c => c.type !== 'del').length + currentHunk.newStart
            });
          }
        }
      }
      
      // Add final hunk
      if (currentHunk) {
        hunks.push(currentHunk);
      }
      
      console.log(`📄 Generated ${hunks.length} diff hunks from unified diff patch`);
      return hunks;
    } catch (error) {
      console.error('Error converting unified diff to diff hunks:', error);
      return [];
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
   * Broadcast hybrid customization patches loaded event for the frontend
   * This is what DiffPreviewSystem.jsx listens for
   * @param {string} filePath - File path
   * @param {Array} patches - Array of hybrid diff patches
   * @param {Object} io - Socket.io instance (optional)
   */
  broadcastHybridPatchesLoaded(filePath, patches, io = null) {
    const eventData = {
      file: { path: filePath },
      patches: patches
    };

    // Emit to WebSocket clients if available
    if (io) {
      io.emit('hybridPatchesLoaded', eventData);
    }

    // Emit to Node.js event emitter if available
    if (this.eventEmitter) {
      this.eventEmitter.emit('hybridPatchesLoaded', eventData);
    }

    console.log(`📡 Broadcasted ${patches.length} hybrid patches for file: ${filePath}`);
  }

  /**
   * Get hybrid customization patches and broadcast them
   * @param {string} filePath - File path to get diffs for
   * @param {string} userId - User ID for filtering
   * @param {Object} io - Socket.io instance (optional)
   */
  async loadAndBroadcastHybridPatches(filePath, userId, io = null) {
    try {
      const patches = await this.getDiffPatchesForFile(filePath, userId);
      this.broadcastHybridPatchesLoaded(filePath, patches, io);
      return patches;
    } catch (error) {
      console.error('Error loading and broadcasting hybrid patches:', error);
      this.broadcastHybridPatchesLoaded(filePath, [], io);
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
      console.log(`📸 New hybrid snapshot created for ${customization.file_path}`);
      
      // Reload and broadcast patches for this file
      await this.loadAndBroadcastHybridPatches(
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
      console.log(`↩️ Hybrid rollback completed for ${customization.file_path}`);
      
      // Reload and broadcast patches for this file
      await this.loadAndBroadcastHybridPatches(
        customization.file_path,
        customization.user_id,
        io
      );
    } catch (error) {
      console.error('Error handling rollback completed:', error);
    }
  }

  /**
   * Get modified code with all patches applied for a file
   * This is what BrowserPreview needs to display the patched content
   * @param {string} filePath - File path to get modified code for
   * @param {string} storeId - Store ID for filtering patches
   * @returns {string|null} Modified code with patches applied, or null if no patches
   */
  async getModifiedCode(filePath, storeId) {
    try {
      console.log(`📄 Getting modified code for: ${filePath} (store: ${storeId})`);
      
      // Find all active customizations for this file path (store-scoped)
      const customizations = await HybridCustomization.findAll({
        where: {
          file_path: filePath,
          store_id: storeId,
          status: 'active'
        },
        include: [{
          association: 'snapshots',
          separate: true,
          order: [['snapshot_number', 'DESC']],
          limit: 1 // Get latest snapshot only
        }],
        order: [['updated_at', 'DESC']]
      });

      if (customizations.length === 0) {
        console.log(`   📄 No customizations found for ${filePath}`);
        return null;
      }

      // Get the most recent customization with snapshots
      for (const customization of customizations) {
        if (customization.snapshots && customization.snapshots.length > 0) {
          const latestSnapshot = customization.snapshots[0];
          console.log(`   ✅ Found latest snapshot (${latestSnapshot.snapshot_number})`);
          console.log(`   📋 Change: ${latestSnapshot.change_summary}`);
          
          // Check for unified diff format first (new format)
          if (latestSnapshot.patch_operations && latestSnapshot.patch_operations.type === 'unified_diff') {
            const { applyUnifiedDiff } = require('../utils/unified-diff');
            const modifiedCode = applyUnifiedDiff(customization.baseline_code || '', latestSnapshot.patch_operations.patch);
            console.log(`   🔧 Reconstructed code from unified diff patch`);
            return modifiedCode;
          }
          
          // Fallback to line diff format (legacy format)
          if (latestSnapshot.ast_diff && latestSnapshot.ast_diff.type === 'line_diff') {
            const { applyLineDiff } = require('../utils/line-diff');
            const modifiedCode = applyLineDiff(customization.baseline_code || '', latestSnapshot.ast_diff);
            console.log(`   🔧 Reconstructed code from line diff (${latestSnapshot.ast_diff.changes?.length || 0} changes)`);
            return modifiedCode;
          }
          
          // Final fallback to baseline if no diff data available
          console.log(`   ⚠️ No diff data found in snapshot, returning baseline code`);
          return customization.baseline_code;
        }
      }

      console.log(`   📄 No snapshots found, returning baseline code`);
      return customizations[0].baseline_code;
    } catch (error) {
      console.error('Error getting modified code:', error);
      return null;
    }
  }
}

// Export singleton instance
const diffIntegrationService = new DiffIntegrationService();

module.exports = {
  DiffIntegrationService,
  diffIntegrationService
};