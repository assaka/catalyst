const { HybridCustomization, CustomizationSnapshot, CustomizationRollback } = require('../models/HybridCustomization');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

/**
 * Version Control Service
 * Provides comprehensive version control and rollback capabilities
 * with AST-level precision tracking for hybrid customizations
 */
class VersionControlService {
  constructor() {
    this.astAnalyzer = null;
    this.initializeASTAnalyzer();
  }

  /**
   * Initialize AST analyzer if available
   * @private
   */
  async initializeASTAnalyzer() {
    try {
      const ASTAnalyzer = require('./ast-analyzer');
      this.astAnalyzer = new ASTAnalyzer();
    } catch (error) {
      console.warn('AST analyzer not available, using fallback analysis');
    }
  }

  /**
   * Create a new customization with version control
   * @param {Object} params - Customization parameters
   * @returns {Object} Created customization with version info
   */
  async createCustomization(params) {
    const {
      userId,
      storeId,
      name,
      description,
      componentType,
      filePath,
      baselineCode,
      initialCode,
      aiPrompt = null,
      aiExplanation = null
    } = params;

    try {
      const customization = await HybridCustomization.createWithSnapshot({
        userId,
        storeId,
        name,
        description,
        componentType,
        filePath,
        baselineCode,
        initialCode,
        aiPrompt,
        aiExplanation,
        changeDescription: 'Initial customization creation'
      });

      return {
        success: true,
        customization,
        version: 1,
        snapshotCount: 1,
        message: 'Customization created successfully with version tracking'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Apply changes to a customization with snapshot tracking
   * @param {string} customizationId - Customization ID
   * @param {Object} changes - Changes to apply
   * @returns {Object} Result of applying changes
   */
  async applyChanges(customizationId, changes) {
    const {
      modifiedCode,
      changeSummary,
      changeDescription,
      changeType = 'manual_edit',
      aiPrompt = null,
      aiExplanation = null,
      createdBy
    } = changes;

    const transaction = await sequelize.transaction();

    try {
      const customization = await HybridCustomization.findByPk(customizationId, { transaction });
      if (!customization) {
        throw new Error('Customization not found');
      }

      const codeBefore = customization.current_code;

      // Analyze changes with AST if available
      let analysisResult = null;
      if (this.astAnalyzer) {
        analysisResult = await this.analyzeCodeChanges(codeBefore, modifiedCode);
      }

      // Update customization
      await customization.update({
        current_code: modifiedCode
      }, { transaction });

      // Create snapshot with enhanced analysis
      const snapshot = await HybridCustomization.createSnapshot({
        customizationId,
        changeType,
        changeSummary: changeSummary || this.generateChangeSummary(analysisResult),
        changeDescription,
        codeBefore,
        codeAfter: modifiedCode,
        aiPrompt,
        aiExplanation,
        createdBy,
        aiMetadata: analysisResult?.metadata
      }, transaction);

      await transaction.commit();

      return {
        success: true,
        snapshot,
        analysis: analysisResult,
        changesSummary: this.summarizeChanges(analysisResult),
        message: 'Changes applied successfully with snapshot tracking'
      };
    } catch (error) {
      await transaction.rollback();
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rollback customization to a specific snapshot
   * @param {string} customizationId - Customization ID
   * @param {number} targetSnapshotNumber - Target snapshot number
   * @param {Object} rollbackOptions - Rollback options
   * @returns {Object} Rollback result
   */
  async rollbackToSnapshot(customizationId, targetSnapshotNumber, rollbackOptions = {}) {
    const {
      rollbackType = 'full_rollback',
      rollbackReason = '',
      performedBy,
      createNewVersion = false
    } = rollbackOptions;

    try {
      const customization = await HybridCustomization.findByPk(customizationId);
      if (!customization) {
        throw new Error('Customization not found');
      }

      // Validate snapshot exists
      const targetSnapshot = await CustomizationSnapshot.findOne({
        where: {
          customization_id: customizationId,
          snapshot_number: targetSnapshotNumber
        }
      });

      if (!targetSnapshot) {
        throw new Error(`Snapshot ${targetSnapshotNumber} not found`);
      }

      // Get rollback impact analysis
      const impactAnalysis = await this.analyzeRollbackImpact(customizationId, targetSnapshotNumber);

      let rollbackResult;
      
      if (createNewVersion) {
        // Create new version with rolled back code
        rollbackResult = await this.createRollbackVersion(
          customization,
          targetSnapshot,
          rollbackReason,
          performedBy
        );
      } else {
        // Direct rollback on current customization
        rollbackResult = await customization.rollbackToSnapshot(targetSnapshotNumber, {
          rollbackType,
          rollbackReason,
          performedBy
        });
      }

      return {
        success: true,
        rollbackResult,
        impactAnalysis,
        targetSnapshot: {
          number: targetSnapshotNumber,
          changeSummary: targetSnapshot.change_summary,
          createdAt: targetSnapshot.created_at
        },
        message: `Successfully rolled back to snapshot ${targetSnapshotNumber}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new version as a rollback (preserves history)
   * @param {Object} customization - Current customization
   * @param {Object} targetSnapshot - Target snapshot to rollback to
   * @param {string} rollbackReason - Reason for rollback
   * @param {string} performedBy - User performing rollback
   * @returns {Object} New version result
   * @private
   */
  async createRollbackVersion(customization, targetSnapshot, rollbackReason, performedBy) {
    const rollbackVersion = await customization.createVersion({
      name: `${customization.name} (Rolled Back)`,
      description: `Rolled back to snapshot ${targetSnapshot.snapshot_number}: ${rollbackReason}`,
      modifiedCode: targetSnapshot.code_after,
      changeSummary: `Rollback to snapshot ${targetSnapshot.snapshot_number}`,
      createdBy: performedBy
    });

    return {
      success: true,
      newVersion: rollbackVersion,
      rollbackType: 'version_rollback',
      message: 'New version created with rolled back code'
    };
  }

  /**
   * Analyze rollback impact
   * @param {string} customizationId - Customization ID
   * @param {number} targetSnapshotNumber - Target snapshot number
   * @returns {Object} Impact analysis
   * @private
   */
  async analyzeRollbackImpact(customizationId, targetSnapshotNumber) {
    const snapshotsToRevert = await CustomizationSnapshot.findAll({
      where: {
        customization_id: customizationId,
        snapshot_number: {
          [sequelize.Op.gt]: targetSnapshotNumber
        }
      },
      order: [['snapshot_number', 'DESC']]
    });

    const impactSummary = {
      snapshotsAffected: snapshotsToRevert.length,
      changesLost: [],
      aiChangesLost: 0,
      symbolsAffected: new Set(),
      deploymentImpact: false
    };

    snapshotsToRevert.forEach(snapshot => {
      if (snapshot.change_type === 'ai_modification') {
        impactSummary.aiChangesLost++;
      }
      
      impactSummary.changesLost.push({
        snapshotNumber: snapshot.snapshot_number,
        changeType: snapshot.change_type,
        changeSummary: snapshot.change_summary,
        createdAt: snapshot.created_at
      });

      if (snapshot.affected_symbols) {
        snapshot.affected_symbols.forEach(symbol => {
          impactSummary.symbolsAffected.add(symbol);
        });
      }
    });

    impactSummary.symbolsAffected = Array.from(impactSummary.symbolsAffected);

    return impactSummary;
  }

  /**
   * Get comprehensive version history
   * @param {string} customizationId - Customization ID
   * @param {Object} options - Query options
   * @returns {Object} Version history
   */
  async getVersionHistory(customizationId, options = {}) {
    const { includeSnapshots = false, includeRollbacks = false } = options;

    try {
      const customization = await HybridCustomization.findByPk(customizationId);
      if (!customization) {
        throw new Error('Customization not found');
      }

      const versionHistory = await customization.getVersionHistory();
      const snapshotHistory = includeSnapshots ? await customization.getSnapshotHistory() : [];
      
      let rollbackHistory = [];
      if (includeRollbacks) {
        rollbackHistory = await CustomizationRollback.findAll({
          where: { customization_id: customizationId },
          order: [['performed_at', 'DESC']],
          include: [
            {
              model: sequelize.models.User,
              as: 'performer',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        });
      }

      return {
        success: true,
        versions: versionHistory,
        snapshots: snapshotHistory,
        rollbacks: rollbackHistory,
        summary: {
          totalVersions: versionHistory.length,
          totalSnapshots: snapshotHistory.length,
          totalRollbacks: rollbackHistory.length,
          currentVersion: customization.version_number
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compare two snapshots
   * @param {string} customizationId - Customization ID
   * @param {number} snapshot1Number - First snapshot number
   * @param {number} snapshot2Number - Second snapshot number
   * @returns {Object} Comparison result
   */
  async compareSnapshots(customizationId, snapshot1Number, snapshot2Number) {
    try {
      const [snapshot1, snapshot2] = await Promise.all([
        CustomizationSnapshot.findOne({
          where: { customization_id: customizationId, snapshot_number: snapshot1Number }
        }),
        CustomizationSnapshot.findOne({
          where: { customization_id: customizationId, snapshot_number: snapshot2Number }
        })
      ]);

      if (!snapshot1 || !snapshot2) {
        throw new Error('One or both snapshots not found');
      }

      // Analyze differences
      let comparison = null;
      if (this.astAnalyzer) {
        comparison = await this.astAnalyzer.compareCode(
          snapshot1.code_after,
          snapshot2.code_after
        );
      }

      return {
        success: true,
        comparison: comparison || this.generateBasicComparison(snapshot1, snapshot2),
        snapshot1: {
          number: snapshot1.snapshot_number,
          changeSummary: snapshot1.change_summary,
          createdAt: snapshot1.created_at
        },
        snapshot2: {
          number: snapshot2.snapshot_number,
          changeSummary: snapshot2.change_summary,
          createdAt: snapshot2.created_at
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cherry pick changes from specific snapshots
   * @param {string} customizationId - Customization ID
   * @param {Array} snapshotNumbers - Snapshot numbers to cherry pick
   * @param {Object} options - Cherry pick options
   * @returns {Object} Cherry pick result
   */
  async cherryPickChanges(customizationId, snapshotNumbers, options = {}) {
    const {
      createNewVersion = true,
      changeSummary = 'Cherry picked changes',
      performedBy
    } = options;

    const transaction = await sequelize.transaction();

    try {
      const customization = await HybridCustomization.findByPk(customizationId, { transaction });
      if (!customization) {
        throw new Error('Customization not found');
      }

      // Get snapshots to cherry pick
      const snapshots = await CustomizationSnapshot.findAll({
        where: {
          customization_id: customizationId,
          snapshot_number: snapshotNumbers
        },
        order: [['snapshot_number', 'ASC']],
        transaction
      });

      if (snapshots.length !== snapshotNumbers.length) {
        throw new Error('Some snapshots not found');
      }

      // Apply cherry picked changes
      let resultCode = customization.current_code;
      const appliedOperations = [];

      for (const snapshot of snapshots) {
        // Apply patch operations from this snapshot
        if (snapshot.patch_operations && snapshot.patch_operations.length > 0) {
          // Here you would apply JSON Patch operations
          // For now, we'll use a simplified approach
          resultCode = snapshot.code_after; // Simplified
          appliedOperations.push(...snapshot.patch_operations);
        }
      }

      if (createNewVersion) {
        // Create new version with cherry picked changes
        const newVersion = await customization.createVersion({
          name: `${customization.name} (Cherry Picked)`,
          description: `Cherry picked changes from snapshots: ${snapshotNumbers.join(', ')}`,
          modifiedCode: resultCode,
          changeSummary,
          createdBy: performedBy
        }, transaction);

        await transaction.commit();

        return {
          success: true,
          newVersion,
          cherryPickedSnapshots: snapshotNumbers,
          appliedOperations: appliedOperations.length,
          message: 'Cherry pick completed successfully'
        };
      } else {
        // Apply directly to current customization
        await customization.update({
          current_code: resultCode
        }, { transaction });

        await HybridCustomization.createSnapshot({
          customizationId,
          changeType: 'cherry_pick',
          changeSummary,
          changeDescription: `Cherry picked from snapshots: ${snapshotNumbers.join(', ')}`,
          codeBefore: customization.current_code,
          codeAfter: resultCode,
          createdBy: performedBy
        }, transaction);

        await transaction.commit();

        return {
          success: true,
          cherryPickedSnapshots: snapshotNumbers,
          appliedOperations: appliedOperations.length,
          message: 'Cherry pick applied to current version'
        };
      }
    } catch (error) {
      await transaction.rollback();
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze code changes with AST if available
   * @param {string} codeBefore - Code before changes
   * @param {string} codeAfter - Code after changes
   * @returns {Object} Analysis result
   * @private
   */
  async analyzeCodeChanges(codeBefore, codeAfter) {
    if (!this.astAnalyzer) {
      return this.generateBasicAnalysis(codeBefore, codeAfter);
    }

    try {
      const beforeAnalysis = await this.astAnalyzer.analyzeCode(codeBefore);
      const afterAnalysis = await this.astAnalyzer.analyzeCode(codeAfter);

      if (beforeAnalysis.success && afterAnalysis.success) {
        const diff = this.astAnalyzer.calculateDiff(beforeAnalysis, afterAnalysis);
        const affectedSymbols = this.astAnalyzer.extractAffectedSymbols(diff);

        return {
          success: true,
          astDiff: diff,
          affectedSymbols,
          beforeAnalysis,
          afterAnalysis,
          metadata: {
            linesChanged: this.countLineChanges(codeBefore, codeAfter),
            complexityChange: this.calculateComplexityChange(beforeAnalysis, afterAnalysis)
          }
        };
      }
    } catch (error) {
      console.warn('AST analysis failed:', error.message);
    }

    return this.generateBasicAnalysis(codeBefore, codeAfter);
  }

  /**
   * Generate basic analysis without AST
   * @param {string} codeBefore - Code before changes
   * @param {string} codeAfter - Code after changes
   * @returns {Object} Basic analysis
   * @private
   */
  generateBasicAnalysis(codeBefore, codeAfter) {
    const beforeLines = codeBefore.split('\n');
    const afterLines = codeAfter.split('\n');

    return {
      success: false,
      reason: 'AST analyzer not available',
      basicAnalysis: {
        linesBefore: beforeLines.length,
        linesAfter: afterLines.length,
        linesAdded: Math.max(0, afterLines.length - beforeLines.length),
        linesRemoved: Math.max(0, beforeLines.length - afterLines.length),
        estimatedChanges: this.estimateChanges(beforeLines, afterLines)
      }
    };
  }

  /**
   * Generate basic comparison between snapshots
   * @param {Object} snapshot1 - First snapshot
   * @param {Object} snapshot2 - Second snapshot
   * @returns {Object} Basic comparison
   * @private
   */
  generateBasicComparison(snapshot1, snapshot2) {
    const lines1 = snapshot1.code_after.split('\n');
    const lines2 = snapshot2.code_after.split('\n');

    return {
      type: 'basic',
      summary: {
        linesDifference: lines2.length - lines1.length,
        hashDifference: snapshot1.modified_hash !== snapshot2.modified_hash,
        changesSummary: `${snapshot1.change_summary} vs ${snapshot2.change_summary}`
      }
    };
  }

  /**
   * Generate change summary from analysis
   * @param {Object} analysisResult - Analysis result
   * @returns {string} Change summary
   * @private
   */
  generateChangeSummary(analysisResult) {
    if (!analysisResult || !analysisResult.success) {
      return 'Code modifications applied';
    }

    const summary = [];
    const diff = analysisResult.astDiff;

    if (diff.summary.functions.added > 0) {
      summary.push(`Added ${diff.summary.functions.added} function(s)`);
    }
    if (diff.summary.functions.modified > 0) {
      summary.push(`Modified ${diff.summary.functions.modified} function(s)`);
    }
    if (diff.summary.functions.deleted > 0) {
      summary.push(`Removed ${diff.summary.functions.deleted} function(s)`);
    }

    return summary.join(', ') || 'Code structure updated';
  }

  /**
   * Summarize changes for user display
   * @param {Object} analysisResult - Analysis result
   * @returns {Object} Changes summary
   * @private
   */
  summarizeChanges(analysisResult) {
    if (!analysisResult) {
      return { type: 'basic', message: 'Changes applied successfully' };
    }

    if (analysisResult.success && analysisResult.astDiff) {
      return {
        type: 'ast',
        functionsChanged: analysisResult.astDiff.summary.functions,
        variablesChanged: analysisResult.astDiff.summary.variables,
        affectedSymbols: analysisResult.affectedSymbols || [],
        complexity: analysisResult.metadata?.complexityChange || 0
      };
    }

    return {
      type: 'basic',
      linesChanged: analysisResult.basicAnalysis?.estimatedChanges || 0,
      message: 'Basic changes tracking available'
    };
  }

  /**
   * Count line changes between code versions
   * @param {string} codeBefore - Code before
   * @param {string} codeAfter - Code after
   * @returns {number} Number of changed lines
   * @private
   */
  countLineChanges(codeBefore, codeAfter) {
    const beforeLines = codeBefore.split('\n');
    const afterLines = codeAfter.split('\n');
    let changes = 0;

    const maxLines = Math.max(beforeLines.length, afterLines.length);
    for (let i = 0; i < maxLines; i++) {
      if ((beforeLines[i] || '') !== (afterLines[i] || '')) {
        changes++;
      }
    }

    return changes;
  }

  /**
   * Estimate changes without AST
   * @param {Array} beforeLines - Lines before changes
   * @param {Array} afterLines - Lines after changes
   * @returns {number} Estimated number of changes
   * @private
   */
  estimateChanges(beforeLines, afterLines) {
    let changes = 0;
    const maxLines = Math.max(beforeLines.length, afterLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      if ((beforeLines[i] || '') !== (afterLines[i] || '')) {
        changes++;
      }
    }
    
    return changes;
  }

  /**
   * Calculate complexity change between analyses
   * @param {Object} beforeAnalysis - Before analysis
   * @param {Object} afterAnalysis - After analysis
   * @returns {number} Complexity change
   * @private
   */
  calculateComplexityChange(beforeAnalysis, afterAnalysis) {
    // Simple complexity metric based on function count and nesting
    const beforeComplexity = (beforeAnalysis.functions?.length || 0) * 1.5 + 
                           (beforeAnalysis.variables?.length || 0) * 0.5;
    const afterComplexity = (afterAnalysis.functions?.length || 0) * 1.5 + 
                          (afterAnalysis.variables?.length || 0) * 0.5;
    
    return Math.round((afterComplexity - beforeComplexity) * 100) / 100;
  }
}

module.exports = VersionControlService;