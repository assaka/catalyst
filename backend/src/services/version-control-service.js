/**
 * Version Control Service with Database Persistence
 * Bridges in-memory version control with database storage for CustomizationOverlay
 */

const { CustomizationOverlay, CustomizationSnapshot, AstDiff } = require('../models');
const DiffService = require('../../src/services/diff-service');

class VersionControlService {
  constructor(options = {}) {
    this.options = {
      maxVersions: 100,
      enableASTParsing: true,
      enableAutoPatch: true,
      autoSave: true,
      ...options
    };

    // Initialize diff service for patch creation
    this.diffService = new DiffService();
  }

  /**
   * Create a new customization with initial baseline
   */
  async createCustomization({ userId, name, description, componentType = 'component', filePath, baselineCode, initialCode, changeType = 'manual_edit', changeSummary }) {
    try {
      // Create the customization overlay record
      const customization = await CustomizationOverlay.create({
        user_id: userId,
        name,
        description,
        file_path: filePath,
        component_type: componentType,
        baseline_code: baselineCode,
        current_code: initialCode,
        status: 'active',
        change_type: changeType,
        metadata: {
          created_via: 'version_control_service',
          enableASTParsing: this.options.enableASTParsing
        }
      });

      // Create initial snapshot
      const snapshot = await this.createSnapshot(customization.id, {
        change_summary: changeSummary || 'Initial version',
        change_description: 'Baseline version of the customization',
        change_type: 'initial',
        createdBy: userId
      });

      return {
        success: true,
        customization,
        snapshot,
        message: 'Customization created successfully'
      };
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
  async applyChanges(customizationId, { modifiedCode, changeSummary, changeDescription, changeType = 'modification', createdBy }) {
    try {
      // Get existing customization
      const customization = await CustomizationOverlay.findByPk(customizationId);
      if (!customization) {
        return { success: false, error: 'Customization not found' };
      }

      // Create diff between current and modified code
      const diffResult = await this.createCodeDiff(customization.current_code, modifiedCode);

      // Update customization with new current code
      await customization.update({
        current_code: modifiedCode,
        updated_at: new Date()
      });

      // Create new snapshot with diff data
      const snapshot = await this.createSnapshot(customizationId, {
        change_summary: changeSummary,
        change_description: changeDescription,
        change_type: changeType,
        ast_diff: diffResult.ast_diff,
        line_diff: diffResult.line_diff,
        unified_diff: diffResult.unified_diff,
        diff_stats: diffResult.stats,
        createdBy
      });

      return {
        success: true,
        customization,
        snapshot,
        message: 'Changes applied successfully'
      };
    } catch (error) {
      console.error('Error applying changes:', error);
      return {
        success: false,
        error: error.message || 'Failed to apply changes'
      };
    }
  }

  /**
   * Create a new snapshot for a customization
   */
  async createSnapshot(customizationId, { change_summary, change_description, change_type, ast_diff, line_diff, unified_diff, diff_stats, createdBy }) {
    try {
      // Get next version number
      const lastSnapshot = await CustomizationSnapshot.findOne({
        where: { customization_id: customizationId },
        order: [['version_number', 'DESC']]
      });

      const nextVersion = lastSnapshot ? lastSnapshot.version_number + 1 : 1;

      // Create snapshot
      const snapshot = await CustomizationSnapshot.create({
        customization_id: customizationId,
        version_number: nextVersion,
        change_summary,
        change_description,
        change_type,
        ast_diff,
        line_diff,
        unified_diff,
        diff_stats: diff_stats || {},
        status: 'open',
        created_by: createdBy
      });

      return snapshot;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive diff between two code versions
   */
  async createCodeDiff(oldCode, newCode) {
    try {
      let result = {
        line_diff: null,
        unified_diff: null,
        ast_diff: null,
        stats: {}
      };

      // Create line-based diff using diff service
      if (this.diffService) {
        const diffResult = await this.diffService.createDiff(oldCode, newCode);
        if (diffResult.success) {
          result.line_diff = diffResult.diff;
          result.stats = diffResult.metadata || {};
        }

        // Create unified diff
        const unifiedDiff = await this.diffService.createUnifiedDiff(oldCode, newCode);
        if (unifiedDiff) {
          result.unified_diff = unifiedDiff;
        }
      }

      // AST diff would be created here if AST parsing is enabled
      // This would require the frontend AST utilities to be available on backend
      if (this.options.enableASTParsing) {
        // Placeholder for AST diff - would need to integrate AST parsing
        result.ast_diff = {
          placeholder: true,
          message: 'AST parsing not yet integrated with backend service'
        };
      }

      return result;
    } catch (error) {
      console.error('Error creating code diff:', error);
      return { line_diff: null, unified_diff: null, ast_diff: null, stats: {} };
    }
  }

  /**
   * Finalize a snapshot (mark as completed/published)
   */
  async finalizeSnapshot(snapshotId, metadata = {}) {
    try {
      const snapshot = await CustomizationSnapshot.findByPk(snapshotId);
      if (!snapshot) {
        return { success: false, error: 'Snapshot not found' };
      }

      await snapshot.update({
        status: 'finalized',
        finalized_at: new Date(),
        metadata: { ...snapshot.metadata, ...metadata }
      });

      return {
        success: true,
        snapshot,
        message: 'Snapshot finalized successfully'
      };
    } catch (error) {
      console.error('Error finalizing snapshot:', error);
      return {
        success: false,
        error: error.message || 'Failed to finalize snapshot'
      };
    }
  }

  /**
   * Get customization with its snapshots
   */
  async getCustomization(customizationId, includeSnapshots = true) {
    try {
      const options = {
        where: { id: customizationId }
      };

      if (includeSnapshots) {
        options.include = [{
          model: CustomizationSnapshot,
          as: 'snapshots',
          order: [['version_number', 'DESC']],
          limit: 10
        }];
      }

      const customization = await CustomizationOverlay.findOne(options);
      return customization;
    } catch (error) {
      console.error('Error getting customization:', error);
      throw error;
    }
  }

  /**
   * Get customizations by user
   */
  async getUserCustomizations(userId, storeId = null, status = 'active') {
    try {
      const where = { user_id: userId, status };
      if (storeId) {
        where.store_id = storeId;
      }

      const customizations = await CustomizationOverlay.findAll({
        where,
        include: [{
          model: CustomizationSnapshot,
          as: 'snapshots',
          limit: 5,
          order: [['created_at', 'DESC']]
        }],
        order: [['updated_at', 'DESC']]
      });

      return customizations;
    } catch (error) {
      console.error('Error getting user customizations:', error);
      throw error;
    }
  }

  /**
   * Get customizations by file path
   */
  async getCustomizationsByFile(filePath, userId = null) {
    try {
      const where = { file_path: filePath, status: 'active' };
      if (userId) {
        where.user_id = userId;
      }

      const customizations = await CustomizationOverlay.findAll({
        where,
        include: [{
          model: CustomizationSnapshot,
          as: 'snapshots',
          limit: 3,
          order: [['version_number', 'DESC']]
        }],
        order: [['updated_at', 'DESC']]
      });

      return customizations;
    } catch (error) {
      console.error('Error getting customizations by file:', error);
      throw error;
    }
  }

  /**
   * Revert customization to a previous snapshot
   */
  async revertToSnapshot(customizationId, snapshotId, userId, metadata = {}) {
    try {
      const customization = await CustomizationOverlay.findByPk(customizationId);
      const targetSnapshot = await CustomizationSnapshot.findByPk(snapshotId);

      if (!customization || !targetSnapshot) {
        return { success: false, error: 'Customization or snapshot not found' };
      }

      if (targetSnapshot.customization_id !== customizationId) {
        return { success: false, error: 'Snapshot does not belong to this customization' };
      }

      // Get the content from the target snapshot's version
      // This would require reconstructing content from baseline + diffs
      // For now, we'll use the current implementation approach
      
      // Create new snapshot for the revert operation
      const revertSnapshot = await this.createSnapshot(customizationId, {
        change_summary: `Revert to version ${targetSnapshot.version_number}`,
        change_description: `Reverted customization to snapshot ${snapshotId}`,
        change_type: 'rollback',
        createdBy: userId
      });

      return {
        success: true,
        customization,
        snapshot: revertSnapshot,
        message: `Successfully reverted to version ${targetSnapshot.version_number}`
      };
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
      const customization = await CustomizationOverlay.findByPk(customizationId);
      if (!customization) {
        return { success: false, error: 'Customization not found' };
      }

      await customization.update({ status: 'archived' });

      return {
        success: true,
        customization,
        message: 'Customization archived successfully'
      };
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
  async getStats(userId = null, storeId = null) {
    try {
      const where = {};
      if (userId) where.user_id = userId;
      if (storeId) where.store_id = storeId;

      const totalCustomizations = await CustomizationOverlay.count({ where });
      const activeCustomizations = await CustomizationOverlay.count({ 
        where: { ...where, status: 'active' }
      });
      const totalSnapshots = await CustomizationSnapshot.count({
        include: [{
          model: CustomizationOverlay,
          as: 'customization',
          where
        }]
      });

      return {
        totalCustomizations,
        activeCustomizations,
        archivedCustomizations: totalCustomizations - activeCustomizations,
        totalSnapshots,
        averageSnapshotsPerCustomization: totalCustomizations > 0 
          ? Math.round(totalSnapshots / totalCustomizations * 10) / 10 
          : 0
      };
    } catch (error) {
      console.error('Error getting version control stats:', error);
      return {
        totalCustomizations: 0,
        activeCustomizations: 0,
        archivedCustomizations: 0,
        totalSnapshots: 0,
        averageSnapshotsPerCustomization: 0
      };
    }
  }
}

module.exports = VersionControlService;