const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const crypto = require('crypto');

/**
 * Hybrid Customization Model
 * Combines user-friendly customizations with AST-level version control and rollback
 * Provides both high-level customization management and precise change tracking
 */
const HybridCustomization = sequelize.define('HybridCustomization', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  
  // User-friendly metadata
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  component_type: {
    type: DataTypes.STRING(100)
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  
  // Version control
  version_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  is_current_version: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  root_customization_id: {
    type: DataTypes.UUID
  },
  parent_version_id: {
    type: DataTypes.UUID,
    references: {
      model: 'hybrid_customizations',
      key: 'id'
    }
  },
  
  // Code content
  baseline_code: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Original unmodified code'
  },
  current_code: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Current state after all modifications'
  },
  
  // AI integration
  ai_prompts: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  ai_changes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  customization_history: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  
  // Deployment
  deployment_status: {
    type: DataTypes.ENUM('draft', 'deployed', 'failed', 'pending', 'rolled_back'),
    defaultValue: 'draft'
  },
  deployed_at: {
    type: DataTypes.DATE
  },
  deployment_url: {
    type: DataTypes.STRING(500)
  },
  render_service_id: {
    type: DataTypes.STRING(255)
  },
  
  // Status
  status: {
    type: DataTypes.ENUM('active', 'archived', 'rolled_back'),
    defaultValue: 'active'
  },
  
  // Metadata
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'hybrid_customizations',
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'store_id']
    },
    {
      fields: ['file_path']
    },
    {
      fields: ['is_current_version'],
      where: { is_current_version: true }
    },
    {
      fields: ['root_customization_id']
    },
    {
      unique: true,
      fields: ['name', 'user_id', 'version_number']
    }
  ]
});

/**
 * Customization Snapshot Model
 * Stores AST-level precise tracking for each change with rollback capabilities
 */
const CustomizationSnapshot = sequelize.define('CustomizationSnapshot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hybrid_customizations',
      key: 'id'
    }
  },
  snapshot_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  // Change metadata
  change_type: {
    type: DataTypes.ENUM('initial', 'ai_modification', 'manual_edit', 'rollback', 'merge'),
    allowNull: false
  },
  change_summary: {
    type: DataTypes.STRING(1000)
  },
  change_description: {
    type: DataTypes.TEXT
  },
  
  // AST analysis
  original_hash: {
    type: DataTypes.STRING(64)
  },
  modified_hash: {
    type: DataTypes.STRING(64)
  },
  original_ast: {
    type: DataTypes.JSONB
  },
  modified_ast: {
    type: DataTypes.JSONB
  },
  ast_diff: {
    type: DataTypes.JSONB
  },
  affected_symbols: {
    type: DataTypes.JSONB
  },
  
  // Patch operations
  patch_operations: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  reverse_patch_operations: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  patch_preview: {
    type: DataTypes.TEXT
  },
  
  // Code states
  code_before: {
    type: DataTypes.TEXT
  },
  code_after: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  // AI context
  ai_prompt: {
    type: DataTypes.TEXT
  },
  ai_explanation: {
    type: DataTypes.TEXT
  },
  ai_metadata: {
    type: DataTypes.JSONB
  },
  
  // User context
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Snapshot status for 'open' during editing vs 'finalized' after publish
  status: {
    type: DataTypes.ENUM('open', 'finalized'),
    defaultValue: 'open',
    comment: 'Status: open (allows undo during editing), finalized (locked for rollback after publish)'
  }
}, {
  tableName: 'customization_snapshots',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['customization_id', 'snapshot_number']
    },
    {
      unique: true,
      fields: ['customization_id', 'snapshot_number']
    }
  ]
});

/**
 * Customization Rollback Model
 * Tracks rollback operations for audit and recovery
 */
const CustomizationRollback = sequelize.define('CustomizationRollback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customization_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hybrid_customizations',
      key: 'id'
    }
  },
  rolled_back_from_snapshot: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rolled_back_to_snapshot: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rollback_type: {
    type: DataTypes.ENUM('full_rollback', 'selective_rollback', 'cherry_pick'),
    allowNull: false
  },
  reverted_snapshots: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  applied_operations: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  rollback_reason: {
    type: DataTypes.TEXT
  },
  rollback_summary: {
    type: DataTypes.STRING(500)
  },
  performed_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'customization_rollbacks',
  underscored: true,
  createdAt: 'performed_at',
  updatedAt: false
});

// Define associations
HybridCustomization.associate = (models) => {
  HybridCustomization.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  HybridCustomization.belongsTo(models.Store, {
    foreignKey: 'store_id',
    as: 'store'
  });
  
  // Version control relationships
  HybridCustomization.belongsTo(HybridCustomization, {
    foreignKey: 'parent_version_id',
    as: 'parentVersion'
  });
  
  HybridCustomization.hasMany(HybridCustomization, {
    foreignKey: 'parent_version_id',
    as: 'childVersions'
  });
  
  HybridCustomization.hasMany(HybridCustomization, {
    foreignKey: 'root_customization_id',
    as: 'versionChain'
  });
  
  // Snapshot relationships
  HybridCustomization.hasMany(CustomizationSnapshot, {
    foreignKey: 'customization_id',
    as: 'snapshots'
  });
  
  // Rollback relationships
  HybridCustomization.hasMany(CustomizationRollback, {
    foreignKey: 'customization_id',
    as: 'rollbacks'
  });
};

CustomizationSnapshot.associate = (models) => {
  CustomizationSnapshot.belongsTo(HybridCustomization, {
    foreignKey: 'customization_id',
    as: 'customization'
  });
  
  CustomizationSnapshot.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

CustomizationRollback.associate = (models) => {
  CustomizationRollback.belongsTo(HybridCustomization, {
    foreignKey: 'customization_id',
    as: 'customization'
  });
  
  CustomizationRollback.belongsTo(models.User, {
    foreignKey: 'performed_by',
    as: 'performer'
  });
};

/**
 * Create a new customization with initial snapshot
 * @param {Object} params - Customization parameters
 * @returns {Object} Created customization with initial snapshot
 */
HybridCustomization.createWithSnapshot = async function(params) {
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
    aiExplanation = null,
    changeDescription = 'Initial creation'
  } = params;

  const transaction = await sequelize.transaction();

  try {
    // Create the main customization record
    const customization = await HybridCustomization.create({
      user_id: userId,
      store_id: storeId,
      name,
      description,
      component_type: componentType,
      file_path: filePath,
      baseline_code: baselineCode,
      current_code: initialCode,
      ai_prompts: aiPrompt ? [{ prompt: aiPrompt, timestamp: new Date().toISOString() }] : [],
      status: 'active'
    }, { transaction });

    // Create initial snapshot
    await this.createSnapshot({
      customizationId: customization.id,
      changeType: 'initial',
      changeSummary: 'Initial customization created',
      changeDescription,
      codeBefore: baselineCode,
      codeAfter: initialCode,
      aiPrompt,
      aiExplanation,
      createdBy: userId
    }, transaction);

    await transaction.commit();
    return customization;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Create a snapshot for tracking changes
 * @param {Object} params - Snapshot parameters
 * @param {Object} transaction - Database transaction
 * @returns {Object} Created snapshot
 */
HybridCustomization.createSnapshot = async function(params, transaction = null) {
  const {
    customizationId,
    changeType,
    changeSummary,
    changeDescription,
    codeBefore,
    codeAfter,
    aiPrompt = null,
    aiExplanation = null,
    createdBy,
    aiMetadata = null,
    status = 'open' // Default to 'open' for undo capability during editing
  } = params;

  // Get next snapshot number
  const lastSnapshot = await CustomizationSnapshot.findOne({
    where: { customization_id: customizationId },
    order: [['snapshot_number', 'DESC']],
    transaction
  });
  
  const snapshotNumber = (lastSnapshot?.snapshot_number || 0) + 1;

  // Calculate hashes
  const beforeHash = codeBefore ? crypto.createHash('sha256').update(codeBefore).digest('hex') : null;
  const afterHash = crypto.createHash('sha256').update(codeAfter).digest('hex');

  // Get AST analyzer (if available)
  let originalAst = null, modifiedAst = null, astDiff = null, affectedSymbols = null;
  
  try {
    const ASTAnalyzer = require('../services/ast-analyzer');
    const analyzer = new ASTAnalyzer();
    
    if (codeBefore) {
      const beforeAnalysis = await analyzer.analyzeCode(codeBefore);
      const afterAnalysis = await analyzer.analyzeCode(codeAfter);
      
      if (beforeAnalysis.success && afterAnalysis.success) {
        originalAst = beforeAnalysis.ast;
        modifiedAst = afterAnalysis.ast;
        astDiff = analyzer.calculateDiff(beforeAnalysis, afterAnalysis);
        affectedSymbols = analyzer.extractAffectedSymbols(astDiff);
      }
    }
  } catch (error) {
    console.warn('AST analysis failed, continuing without:', error.message);
  }

  // Generate patch operations
  const patchOperations = this.generatePatchOperations(codeBefore, codeAfter, astDiff);
  const reversePatchOperations = this.generateReversePatchOperations(codeBefore, codeAfter, astDiff);
  const patchPreview = this.generatePatchPreview(astDiff, patchOperations);

  return await CustomizationSnapshot.create({
    customization_id: customizationId,
    snapshot_number: snapshotNumber,
    change_type: changeType,
    change_summary: changeSummary,
    change_description: changeDescription,
    original_hash: beforeHash,
    modified_hash: afterHash,
    original_ast: originalAst,
    modified_ast: modifiedAst,
    ast_diff: astDiff,
    affected_symbols: affectedSymbols,
    patch_operations: patchOperations,
    reverse_patch_operations: reversePatchOperations,
    patch_preview: patchPreview,
    code_before: codeBefore,
    code_after: codeAfter,
    ai_prompt: aiPrompt,
    ai_explanation: aiExplanation,
    ai_metadata: aiMetadata,
    created_by: createdBy,
    status: status // Add snapshot status for open/finalized state management
  }, { transaction });
};

/**
 * Apply AI-generated changes with snapshot tracking
 * @param {string} customizationId - Customization ID
 * @param {Object} aiChanges - AI changes object
 * @returns {Object} Updated customization
 */
HybridCustomization.prototype.applyAIChanges = async function(aiChanges) {
  const {
    modifiedCode,
    prompt,
    explanation,
    changeSummary = 'AI-generated modification',
    changeDescription,
    createdBy
  } = aiChanges;

  const transaction = await sequelize.transaction();

  try {
    const codeBefore = this.current_code;

    // Update the customization
    await this.update({
      current_code: modifiedCode,
      ai_prompts: [...(this.ai_prompts || []), {
        prompt,
        timestamp: new Date().toISOString()
      }],
      ai_changes: [...(this.ai_changes || []), {
        prompt,
        generated_code: modifiedCode,
        explanation,
        timestamp: new Date().toISOString()
      }]
    }, { transaction });

    // Create snapshot
    await HybridCustomization.createSnapshot({
      customizationId: this.id,
      changeType: 'ai_modification',
      changeSummary,
      changeDescription,
      codeBefore,
      codeAfter: modifiedCode,
      aiPrompt: prompt,
      aiExplanation: explanation,
      createdBy
    }, transaction);

    await transaction.commit();
    return this;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Rollback to a specific snapshot
 * @param {number} targetSnapshotNumber - Snapshot to rollback to
 * @param {Object} rollbackParams - Rollback parameters
 * @returns {Object} Rollback result
 */
HybridCustomization.prototype.rollbackToSnapshot = async function(targetSnapshotNumber, rollbackParams) {
  const {
    rollbackType = 'full_rollback',
    rollbackReason = '',
    performedBy
  } = rollbackParams;

  const transaction = await sequelize.transaction();

  try {
    // Get target snapshot
    const targetSnapshot = await CustomizationSnapshot.findOne({
      where: {
        customization_id: this.id,
        snapshot_number: targetSnapshotNumber
      },
      transaction
    });

    if (!targetSnapshot) {
      throw new Error(`Snapshot ${targetSnapshotNumber} not found`);
    }

    // Get current snapshot for rollback tracking
    const currentSnapshot = await CustomizationSnapshot.findOne({
      where: { customization_id: this.id },
      order: [['snapshot_number', 'DESC']],
      transaction
    });

    if (!currentSnapshot) {
      throw new Error('No current snapshot found');
    }

    // Get snapshots to be reverted
    const revertedSnapshots = await CustomizationSnapshot.findAll({
      where: {
        customization_id: this.id,
        snapshot_number: {
          [sequelize.Op.gt]: targetSnapshotNumber
        }
      },
      order: [['snapshot_number', 'DESC']],
      transaction
    });

    // Apply rollback by setting current code to target snapshot code
    const rollbackCode = targetSnapshot.code_after;
    await this.update({
      current_code: rollbackCode,
      status: 'active' // Reset from rolled_back if it was set
    }, { transaction });

    // Create rollback snapshot
    await HybridCustomization.createSnapshot({
      customizationId: this.id,
      changeType: 'rollback',
      changeSummary: `Rolled back to snapshot ${targetSnapshotNumber}`,
      changeDescription: rollbackReason,
      codeBefore: this.current_code,
      codeAfter: rollbackCode,
      createdBy: performedBy
    }, transaction);

    // Record rollback operation
    const appliedOperations = revertedSnapshots.map(s => s.reverse_patch_operations).flat();
    await CustomizationRollback.create({
      customization_id: this.id,
      rolled_back_from_snapshot: currentSnapshot.snapshot_number,
      rolled_back_to_snapshot: targetSnapshotNumber,
      rollback_type: rollbackType,
      reverted_snapshots: revertedSnapshots.map(s => s.id),
      applied_operations: appliedOperations,
      rollback_reason: rollbackReason,
      rollback_summary: `Rollback from snapshot ${currentSnapshot.snapshot_number} to ${targetSnapshotNumber}`,
      performed_by: performedBy
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      message: `Successfully rolled back to snapshot ${targetSnapshotNumber}`,
      revertedSnapshots: revertedSnapshots.length,
      targetCode: rollbackCode
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get version history for this customization
 * @returns {Array} Version history
 */
HybridCustomization.prototype.getVersionHistory = async function() {
  return await HybridCustomization.findAll({
    where: {
      root_customization_id: this.root_customization_id || this.id
    },
    order: [['version_number', 'ASC']],
    include: [
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });
};

/**
 * Get snapshot history
 * @param {Object} options - Query options
 * @returns {Array} Snapshot history
 */
HybridCustomization.prototype.getSnapshotHistory = async function(options = {}) {
  const { limit = 50, changeType = null } = options;
  
  const where = { customization_id: this.id };
  if (changeType) where.change_type = changeType;

  return await CustomizationSnapshot.findAll({
    where,
    order: [['snapshot_number', 'DESC']],
    limit,
    include: [
      {
        model: sequelize.models.User,
        as: 'creator',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ]
  });
};

/**
 * Create a new version from this customization
 * @param {Object} versionParams - Version parameters
 * @returns {Object} New version
 */
HybridCustomization.prototype.createVersion = async function(versionParams) {
  const {
    name,
    description,
    modifiedCode,
    changeSummary = 'New version created',
    createdBy
  } = versionParams;

  const transaction = await sequelize.transaction();

  try {
    // Create new version
    const newVersion = await HybridCustomization.create({
      user_id: this.user_id,
      store_id: this.store_id,
      name,
      description,
      component_type: this.component_type,
      file_path: this.file_path,
      version_number: this.version_number + 1,
      parent_version_id: this.id,
      root_customization_id: this.root_customization_id || this.id,
      baseline_code: this.baseline_code,
      current_code: modifiedCode || this.current_code,
      ai_prompts: [],
      ai_changes: [],
      tags: [...(this.tags || [])],
      settings: { ...this.settings }
    }, { transaction });

    // Create initial snapshot for new version
    await HybridCustomization.createSnapshot({
      customizationId: newVersion.id,
      changeType: 'initial',
      changeSummary,
      changeDescription: `Version ${newVersion.version_number} created from version ${this.version_number}`,
      codeBefore: this.current_code,
      codeAfter: modifiedCode || this.current_code,
      createdBy
    }, transaction);

    await transaction.commit();
    return newVersion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Generate patch operations for changes
 * @param {string} codeBefore - Code before changes
 * @param {string} codeAfter - Code after changes
 * @param {Object} astDiff - AST differences
 * @returns {Array} Patch operations
 */
HybridCustomization.generatePatchOperations = function(codeBefore, codeAfter, astDiff) {
  const operations = [];
  
  if (!codeBefore || !codeAfter) {
    return [{
      op: 'replace',
      path: '/code',
      value: codeAfter,
      description: 'Full code replacement'
    }];
  }

  // Simple line-based diff for now (can be enhanced with AST-level operations)
  const beforeLines = codeBefore.split('\n');
  const afterLines = codeAfter.split('\n');
  
  // Basic line diff operations
  afterLines.forEach((line, index) => {
    if (index >= beforeLines.length) {
      operations.push({
        op: 'add',
        path: `/lines/${index}`,
        value: line,
        description: `Add line ${index + 1}: ${line.substring(0, 50)}...`
      });
    } else if (beforeLines[index] !== line) {
      operations.push({
        op: 'replace',
        path: `/lines/${index}`,
        value: line,
        description: `Modify line ${index + 1}: ${line.substring(0, 50)}...`
      });
    }
  });

  return operations;
};

/**
 * Generate reverse patch operations for rollback
 * @param {string} codeBefore - Code before changes
 * @param {string} codeAfter - Code after changes
 * @param {Object} astDiff - AST differences
 * @returns {Array} Reverse patch operations
 */
HybridCustomization.generateReversePatchOperations = function(codeBefore, codeAfter, astDiff) {
  // Generate operations to revert codeAfter back to codeBefore
  return this.generatePatchOperations(codeAfter, codeBefore, null);
};

/**
 * Generate human-readable patch preview
 * @param {Object} astDiff - AST differences
 * @param {Array} patchOperations - Patch operations
 * @returns {string} Patch preview
 */
HybridCustomization.generatePatchPreview = function(astDiff, patchOperations) {
  if (!patchOperations || patchOperations.length === 0) {
    return 'No changes detected';
  }

  const summary = [];
  const addOps = patchOperations.filter(op => op.op === 'add').length;
  const replaceOps = patchOperations.filter(op => op.op === 'replace').length;
  const removeOps = patchOperations.filter(op => op.op === 'remove').length;

  if (addOps > 0) summary.push(`+ ${addOps} addition(s)`);
  if (replaceOps > 0) summary.push(`~ ${replaceOps} modification(s)`);
  if (removeOps > 0) summary.push(`- ${removeOps} deletion(s)`);

  return summary.join(', ') || 'Code modifications applied';
};

/**
 * Get the current open snapshot for a customization
 * @param {string} customizationId - Customization ID
 * @returns {Object|null} Current open snapshot or null
 */
HybridCustomization.getCurrentOpenSnapshot = async function(customizationId) {
  return await CustomizationSnapshot.findOne({
    where: {
      customization_id: customizationId,
      status: 'open'
    },
    order: [['snapshot_number', 'DESC']]
  });
};

/**
 * Update the current open snapshot with new code (for auto-save during editing)
 * @param {string} customizationId - Customization ID
 * @param {string} modifiedCode - Current code state
 * @param {string} userId - User making the change
 * @returns {Object} Result of the update
 */
HybridCustomization.updateOpenSnapshot = async function(customizationId, modifiedCode, userId) {
  const transaction = await sequelize.transaction();
  
  try {
    const openSnapshot = await this.getCurrentOpenSnapshot(customizationId);
    
    if (!openSnapshot) {
      throw new Error('No open snapshot found for this customization');
    }

    // Update the open snapshot with new code
    await openSnapshot.update({
      code_after: modifiedCode,
      modified_hash: require('crypto').createHash('sha256').update(modifiedCode).digest('hex'),
      change_description: `Auto-saved at ${new Date().toLocaleTimeString()}`
    }, { transaction });

    // Update the customization's current code
    const customization = await HybridCustomization.findByPk(customizationId, { transaction });
    if (customization) {
      await customization.update({
        current_code: modifiedCode
      }, { transaction });
    }

    await transaction.commit();
    
    return {
      success: true,
      snapshot: openSnapshot,
      message: 'Open snapshot updated with auto-save'
    };
  } catch (error) {
    await transaction.rollback();
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Finalize the current open snapshot (called on 'Publish')
 * @param {string} customizationId - Customization ID
 * @param {string} userId - User performing the finalization
 * @returns {Object} Result of the finalization
 */
HybridCustomization.finalizeOpenSnapshot = async function(customizationId, userId) {
  const transaction = await sequelize.transaction();
  
  try {
    const openSnapshot = await this.getCurrentOpenSnapshot(customizationId);
    
    if (!openSnapshot) {
      return {
        success: true,
        message: 'No open snapshot to finalize'
      };
    }

    // Change status from 'open' to 'finalized'
    await openSnapshot.update({
      status: 'finalized',
      change_description: `${openSnapshot.change_description || ''} - Finalized on publish at ${new Date().toLocaleTimeString()}`
    }, { transaction });

    await transaction.commit();
    
    return {
      success: true,
      snapshot: openSnapshot,
      message: 'Snapshot finalized successfully'
    };
  } catch (error) {
    await transaction.rollback();
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create or update open snapshot for continuous editing
 * @param {Object} params - Snapshot parameters
 * @returns {Object} Result of create/update operation
 */
HybridCustomization.createOrUpdateOpenSnapshot = async function(params) {
  const { customizationId, modifiedCode, changeSummary, createdBy } = params;
  
  const existingOpenSnapshot = await this.getCurrentOpenSnapshot(customizationId);
  
  if (existingOpenSnapshot) {
    // Update existing open snapshot
    return await this.updateOpenSnapshot(customizationId, modifiedCode, createdBy);
  } else {
    // Create new open snapshot
    const customization = await HybridCustomization.findByPk(customizationId);
    if (!customization) {
      return { success: false, error: 'Customization not found' };
    }

    const snapshot = await this.createSnapshot({
      customizationId,
      changeType: 'manual_edit',
      changeSummary: changeSummary || 'Auto-save during editing',
      changeDescription: 'Open snapshot for continuous editing',
      codeBefore: customization.current_code,
      codeAfter: modifiedCode,
      createdBy,
      status: 'open' // Create as open for undo capability
    });

    return {
      success: true,
      snapshot,
      message: 'New open snapshot created'
    };
  }
};

// Static methods for querying
HybridCustomization.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_current_version: true,
      status: 'active',
      ...options.where
    },
    include: options.include || [
      {
        model: this.sequelize.models.Store,
        as: 'store',
        attributes: ['id', 'name']
      }
    ],
    order: options.order || [['updated_at', 'DESC']],
    ...options
  });
};

HybridCustomization.findByStore = function(storeId, options = {}) {
  return this.findAll({
    where: {
      store_id: storeId,
      is_current_version: true,
      status: 'active',
      ...options.where
    },
    include: options.include || [
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ],
    order: options.order || [['updated_at', 'DESC']],
    ...options
  });
};

module.exports = {
  HybridCustomization,
  CustomizationSnapshot,
  CustomizationRollback
};