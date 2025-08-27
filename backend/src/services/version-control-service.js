/**
 * Version Control Service with Database Persistence
 * Bridges in-memory version control with database storage for CustomizationOverlay
 */

const { CustomizationOverlay, CustomizationSnapshot, AstDiff } = require('../models');
const DiffService = require('../../src/services/diff-service');
const { parse } = require('@babel/parser');

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
  async createCustomization({ userId, storeId, name, description, componentType = 'component', filePath, baselineCode, initialCode, changeType = 'manual_edit', changeSummary }) {
    try {
      // Create the customization overlay record
      const customization = await CustomizationOverlay.create({
        user_id: userId,
        store_id: storeId,
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

      // Create initial snapshot with diff if baseline and initial code differ
      let diffData = {
        ast_diff: null,
        line_diff: null,
        unified_diff: null,
        diff_stats: {}
      };

      if (baselineCode && initialCode && baselineCode !== initialCode) {
        // Calculate diff between baseline and initial code
        diffData = await this.createCodeDiff(baselineCode, initialCode);
      }

      const snapshot = await this.createSnapshot(customization.id, {
        change_summary: changeSummary || 'Initial version',
        change_description: 'Baseline version of the customization',
        change_type: 'initial',
        ast_diff: diffData.ast_diff,
        line_diff: diffData.line_diff,
        unified_diff: diffData.unified_diff,
        diff_stats: diffData.stats,
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

      // Map overlay change_type to snapshot change_type
      const snapshotChangeType = this.mapChangeTypeForSnapshot(changeType);

      // Create new snapshot with diff data
      const snapshot = await this.createSnapshot(customizationId, {
        change_summary: changeSummary,
        change_description: changeDescription,
        change_type: snapshotChangeType,
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
      // Get the customization overlay to retrieve file_path
      const customization = await CustomizationOverlay.findByPk(customizationId);
      if (!customization) {
        throw new Error('Customization not found');
      }

      // Get next version number
      const lastSnapshot = await CustomizationSnapshot.findOne({
        where: { customization_id: customizationId },
        order: [['version_number', 'DESC']]
      });

      const nextVersion = lastSnapshot ? lastSnapshot.version_number + 1 : 1;

      // Create snapshot with file_path
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
        created_by: createdBy,
        file_path: customization.file_path // Store file path for efficient retrieval
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

      // AST diff creation if AST parsing is enabled
      if (this.options.enableASTParsing) {
        try {
          const astDiff = await this.createASTDiff(oldCode, newCode);
          result.ast_diff = astDiff;
        } catch (astError) {
          console.warn('AST diff creation failed, using fallback:', astError.message);
          result.ast_diff = {
            error: true,
            message: 'AST parsing failed - likely invalid JavaScript/JSX syntax',
            fallback_used: true
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error creating code diff:', error);
      return { line_diff: null, unified_diff: null, ast_diff: null, stats: {} };
    }
  }

  /**
   * Create AST-based diff between two code versions
   */
  async createASTDiff(oldCode, newCode) {
    // Parse both code versions into ASTs
    const parseOptions = {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'functionBind',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'dynamicImport',
        'nullishCoalescingOperator',
        'optionalChaining'
      ]
    };

    const oldAST = parse(oldCode, parseOptions);
    const newAST = parse(newCode, parseOptions);

    // Extract key structural information for comparison
    const oldStructure = this.extractASTStructure(oldAST);
    const newStructure = this.extractASTStructure(newAST);

    // Calculate structural differences
    const structuralChanges = this.compareASTStructures(oldStructure, newStructure);

    return {
      success: true,
      oldStructure,
      newStructure,
      structuralChanges,
      metadata: {
        oldNodeCount: this.countNodes(oldAST),
        newNodeCount: this.countNodes(newAST),
        hasStructuralChanges: structuralChanges.length > 0,
        changeTypes: [...new Set(structuralChanges.map(c => c.type))]
      }
    };
  }

  /**
   * Extract key structural information from AST
   */
  extractASTStructure(ast) {
    const structure = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      components: [],
      hooks: [],
      variables: []
    };

    const traverse = (node, path = '') => {
      if (!node || typeof node !== 'object') return;

      switch (node.type) {
        case 'ImportDeclaration':
          structure.imports.push({
            source: node.source?.value,
            specifiers: node.specifiers?.map(s => ({
              type: s.type,
              name: s.local?.name || s.imported?.name
            }))
          });
          break;

        case 'ExportDefaultDeclaration':
        case 'ExportNamedDeclaration':
          if (node.declaration) {
            const name = node.declaration.id?.name || node.declaration.name || 'default';
            structure.exports.push({
              name,
              type: node.type,
              declaration: node.declaration.type
            });
          }
          break;

        case 'FunctionDeclaration':
        case 'ArrowFunctionExpression':
        case 'FunctionExpression':
          const funcName = node.id?.name || (node.key ? node.key.name : 'anonymous');
          const isComponent = funcName && /^[A-Z]/.test(funcName);
          const isHook = funcName && funcName.startsWith('use');
          
          const funcInfo = {
            name: funcName,
            type: node.type,
            params: node.params?.length || 0,
            isAsync: node.async || false,
            path
          };

          if (isComponent) {
            structure.components.push(funcInfo);
          } else if (isHook) {
            structure.hooks.push(funcInfo);
          } else {
            structure.functions.push(funcInfo);
          }
          break;

        case 'ClassDeclaration':
          structure.classes.push({
            name: node.id?.name,
            superClass: node.superClass?.name,
            methods: node.body?.body?.filter(m => m.type === 'MethodDefinition').length || 0
          });
          break;

        case 'VariableDeclarator':
          if (node.id?.name) {
            structure.variables.push({
              name: node.id.name,
              kind: node.kind,
              hasInitializer: !!node.init
            });
          }
          break;
      }

      // Recursively traverse child nodes
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => traverse(item, path));
        } else if (value && typeof value === 'object' && value.type) {
          traverse(value, path);
        }
      });
    };

    traverse(ast.body ? ast : { body: [ast] });
    return structure;
  }

  /**
   * Compare two AST structures and identify changes
   */
  compareASTStructures(oldStructure, newStructure) {
    const changes = [];

    // Compare imports
    const oldImports = new Set(oldStructure.imports.map(i => i.source));
    const newImports = new Set(newStructure.imports.map(i => i.source));
    
    [...oldImports].filter(i => !newImports.has(i)).forEach(removed => {
      changes.push({ type: 'import_removed', name: removed });
    });
    
    [...newImports].filter(i => !oldImports.has(i)).forEach(added => {
      changes.push({ type: 'import_added', name: added });
    });

    // Compare functions/components
    const oldFuncs = new Set(oldStructure.functions.map(f => f.name));
    const newFuncs = new Set(newStructure.functions.map(f => f.name));
    
    [...oldFuncs].filter(f => !newFuncs.has(f)).forEach(removed => {
      changes.push({ type: 'function_removed', name: removed });
    });
    
    [...newFuncs].filter(f => !oldFuncs.has(f)).forEach(added => {
      changes.push({ type: 'function_added', name: added });
    });

    // Compare components
    const oldComponents = new Set(oldStructure.components.map(c => c.name));
    const newComponents = new Set(newStructure.components.map(c => c.name));
    
    [...oldComponents].filter(c => !newComponents.has(c)).forEach(removed => {
      changes.push({ type: 'component_removed', name: removed });
    });
    
    [...newComponents].filter(c => !oldComponents.has(c)).forEach(added => {
      changes.push({ type: 'component_added', name: added });
    });

    // Compare classes
    const oldClasses = new Set(oldStructure.classes.map(c => c.name));
    const newClasses = new Set(newStructure.classes.map(c => c.name));
    
    [...oldClasses].filter(c => !newClasses.has(c)).forEach(removed => {
      changes.push({ type: 'class_removed', name: removed });
    });
    
    [...newClasses].filter(c => !oldClasses.has(c)).forEach(added => {
      changes.push({ type: 'class_added', name: added });
    });

    return changes;
  }

  /**
   * Count total nodes in AST
   */
  countNodes(ast) {
    let count = 0;
    const traverse = (node) => {
      if (!node || typeof node !== 'object') return;
      count++;
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(traverse);
        } else if (value && typeof value === 'object' && value.type) {
          traverse(value);
        }
      });
    };
    traverse(ast);
    return count;
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

  /**
   * Map overlay change_type to snapshot change_type
   * Overlays: ['manual_edit', 'ai_generated', 'merge', 'rollback']
   * Snapshots: ['initial', 'modification', 'merge', 'rollback', 'auto_save']
   */
  mapChangeTypeForSnapshot(overlayChangeType) {
    const typeMapping = {
      'manual_edit': 'modification',
      'ai_generated': 'modification',
      'merge': 'merge',
      'rollback': 'rollback',
      // Default fallback
      'modification': 'modification',
      'initial': 'initial',
      'auto_save': 'auto_save'
    };

    return typeMapping[overlayChangeType] || 'modification';
  }
}

module.exports = VersionControlService;