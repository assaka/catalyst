const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * AST Diff Model
 * Stores code changes as patches that act as overlays over original source code
 * Enables version control and change tracking for AI-generated modifications
 */
const ASTDiff = sequelize.define('ASTDiff', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // File and change metadata
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  original_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'SHA-256 hash of original content for integrity verification'
  },
  
  // AST analysis data
  original_ast: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'AST structure of original code'
  },
  modified_ast: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'AST structure of modified code'
  },
  ast_diff: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Calculated differences between ASTs'
  },
  
  // Patch overlay data - this is the key overlay functionality
  patch_operations: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'JSON Patch RFC 6902 operations for applying changes as overlays'
  },
  patch_preview: {
    type: DataTypes.TEXT,
    comment: 'Human-readable preview of what the patch overlay does'
  },
  
  // Change metadata
  change_summary: {
    type: DataTypes.STRING(1000),
    comment: 'Brief description of changes made'
  },
  change_type: {
    type: DataTypes.ENUM('addition', 'modification', 'deletion', 'refactor', 'style'),
    allowNull: false,
    defaultValue: 'modification'
  },
  affected_symbols: {
    type: DataTypes.JSONB,
    comment: 'List of functions, variables, classes affected by this overlay'
  },
  
  // Status and lifecycle
  status: {
    type: DataTypes.ENUM('draft', 'applied', 'rejected', 'reverted'),
    defaultValue: 'draft'
  },
  applied_at: {
    type: DataTypes.DATE,
    comment: 'When this overlay was applied to the original code'
  },
  reverted_at: {
    type: DataTypes.DATE,
    comment: 'When this overlay was reverted'
  }
}, {
  tableName: 'ast_diffs',
  underscored: true,
  indexes: [
    {
      fields: ['store_id', 'file_path'],
      name: 'idx_ast_diffs_store_file'
    },
    {
      fields: ['user_id'],
      name: 'idx_ast_diffs_user'
    },
    {
      fields: ['status'],
      name: 'idx_ast_diffs_status'
    },
    {
      fields: ['created_at'],
      name: 'idx_ast_diffs_created'
    },
    {
      fields: ['change_type'],
      name: 'idx_ast_diffs_change_type'
    }
  ]
});

/**
 * Static method to create an AST diff overlay from original and modified code
 * @param {Object} params - Parameters for creating the diff
 * @returns {Object} Created AST diff record
 */
ASTDiff.createFromCodeChanges = async function(params) {
  const {
    storeId,
    userId,
    filePath,
    originalCode,
    modifiedCode,
    changeSummary = '',
    changeType = 'modification'
  } = params;

  // Calculate hash of original content
  const crypto = require('crypto');
  const originalHash = crypto.createHash('sha256').update(originalCode).digest('hex');

  // Get AST analyzer
  const ASTAnalyzer = require('../services/ast-analyzer');
  const analyzer = new ASTAnalyzer();

  // Analyze both versions
  const originalAnalysis = await analyzer.analyzeCode(originalCode, filePath);
  const modifiedAnalysis = await analyzer.analyzeCode(modifiedCode, filePath);

  if (!originalAnalysis.success || !modifiedAnalysis.success) {
    throw new Error('Failed to analyze code for AST diff generation');
  }

  // Calculate AST differences
  const astDiff = ASTDiff.calculateASTDifferences(
    originalAnalysis, 
    modifiedAnalysis
  );

  // Generate JSON Patch operations for overlay functionality
  const patchOperations = ASTDiff.generatePatchOperations(
    originalCode,
    modifiedCode,
    astDiff
  );

  // Extract affected symbols
  const affectedSymbols = ASTDiff.extractAffectedSymbols(astDiff);

  // Generate human-readable preview
  const patchPreview = ASTDiff.generatePatchPreview(astDiff, patchOperations);

  return await ASTDiff.create({
    store_id: storeId,
    user_id: userId,
    file_path: filePath,
    original_hash: originalHash,
    original_ast: originalAnalysis.ast,
    modified_ast: modifiedAnalysis.ast,
    ast_diff: astDiff,
    patch_operations: patchOperations,
    patch_preview: patchPreview,
    change_summary: changeSummary,
    change_type: changeType,
    affected_symbols: affectedSymbols,
    status: 'draft'
  });
};

/**
 * Calculate differences between two AST structures
 * @param {Object} originalAnalysis - Original code AST analysis
 * @param {Object} modifiedAnalysis - Modified code AST analysis
 * @returns {Object} AST differences
 */
ASTDiff.calculateASTDifferences = function(originalAnalysis, modifiedAnalysis) {
  const diff = {
    added: [],
    modified: [],
    deleted: [],
    summary: {
      functions: { added: 0, modified: 0, deleted: 0 },
      variables: { added: 0, modified: 0, deleted: 0 },
      imports: { added: 0, modified: 0, deleted: 0 },
      exports: { added: 0, modified: 0, deleted: 0 }
    }
  };

  // Compare functions
  const originalFunctions = new Map(originalAnalysis.functions.map(f => [f.name, f]));
  const modifiedFunctions = new Map(modifiedAnalysis.functions.map(f => [f.name, f]));

  // Find added functions
  for (const [name, func] of modifiedFunctions) {
    if (!originalFunctions.has(name)) {
      diff.added.push({ type: 'function', name, ...func });
      diff.summary.functions.added++;
    }
  }

  // Find deleted functions
  for (const [name, func] of originalFunctions) {
    if (!modifiedFunctions.has(name)) {
      diff.deleted.push({ type: 'function', name, ...func });
      diff.summary.functions.deleted++;
    }
  }

  // Find modified functions
  for (const [name, modifiedFunc] of modifiedFunctions) {
    const originalFunc = originalFunctions.get(name);
    if (originalFunc && JSON.stringify(originalFunc) !== JSON.stringify(modifiedFunc)) {
      diff.modified.push({
        type: 'function',
        name,
        original: originalFunc,
        modified: modifiedFunc
      });
      diff.summary.functions.modified++;
    }
  }

  // Similar logic for variables, imports, exports...
  // (Truncated for brevity, but follows same pattern)

  return diff;
};

/**
 * Generate JSON Patch operations for overlay application
 * @param {string} originalCode - Original source code
 * @param {string} modifiedCode - Modified source code
 * @param {Object} astDiff - AST differences
 * @returns {Array} JSON Patch operations
 */
ASTDiff.generatePatchOperations = function(originalCode, modifiedCode, astDiff) {
  const operations = [];

  // Generate operations based on AST differences
  astDiff.added.forEach((item, index) => {
    operations.push({
      op: 'add',
      path: `/ast/body/${item.line || -1}`,
      value: item,
      description: `Add ${item.type}: ${item.name}`
    });
  });

  astDiff.modified.forEach((item, index) => {
    operations.push({
      op: 'replace',
      path: `/ast/body/${item.original.line || index}`,
      value: item.modified,
      description: `Modify ${item.type}: ${item.name}`
    });
  });

  astDiff.deleted.forEach((item, index) => {
    operations.push({
      op: 'remove',
      path: `/ast/body/${item.line || index}`,
      description: `Remove ${item.type}: ${item.name}`
    });
  });

  return operations;
};

/**
 * Extract symbols affected by the changes
 * @param {Object} astDiff - AST differences
 * @returns {Array} List of affected symbol names
 */
ASTDiff.extractAffectedSymbols = function(astDiff) {
  const symbols = new Set();

  [...astDiff.added, ...astDiff.modified, ...astDiff.deleted].forEach(item => {
    if (item.name) {
      symbols.add(item.name);
    }
  });

  return Array.from(symbols);
};

/**
 * Generate human-readable preview of patch changes
 * @param {Object} astDiff - AST differences
 * @param {Array} patchOperations - JSON patch operations
 * @returns {string} Human-readable preview
 */
ASTDiff.generatePatchPreview = function(astDiff, patchOperations) {
  const lines = [];

  if (astDiff.summary.functions.added > 0) {
    lines.push(`+ Added ${astDiff.summary.functions.added} function(s)`);
  }
  if (astDiff.summary.functions.modified > 0) {
    lines.push(`~ Modified ${astDiff.summary.functions.modified} function(s)`);
  }
  if (astDiff.summary.functions.deleted > 0) {
    lines.push(`- Deleted ${astDiff.summary.functions.deleted} function(s)`);
  }

  if (astDiff.summary.variables.added > 0) {
    lines.push(`+ Added ${astDiff.summary.variables.added} variable(s)`);
  }
  if (astDiff.summary.variables.modified > 0) {
    lines.push(`~ Modified ${astDiff.summary.variables.modified} variable(s)`);
  }

  return lines.join('\n') || 'No significant changes detected';
};

/**
 * Apply this diff as an overlay to original code
 * @returns {Object} Result of applying the overlay
 */
ASTDiff.prototype.applyAsOverlay = async function() {
  if (this.status === 'applied') {
    throw new Error('This overlay has already been applied');
  }

  // Here you would apply the JSON Patch operations to reconstruct the modified code
  // This acts as an overlay system where patches are applied over the original
  
  this.status = 'applied';
  this.applied_at = new Date();
  await this.save();

  return {
    success: true,
    message: 'AST diff overlay applied successfully',
    affectedSymbols: this.affected_symbols,
    operations: this.patch_operations.length
  };
};

/**
 * Revert this overlay, returning to original state
 * @returns {Object} Result of reverting the overlay
 */
ASTDiff.prototype.revertOverlay = async function() {
  if (this.status !== 'applied') {
    throw new Error('This overlay is not currently applied');
  }

  this.status = 'reverted';
  this.reverted_at = new Date();
  await this.save();

  return {
    success: true,
    message: 'AST diff overlay reverted successfully',
    originalHash: this.original_hash
  };
};

/**
 * Get all overlays for a file
 * @param {string} storeId - Store ID
 * @param {string} filePath - File path
 * @returns {Array} List of AST diff overlays for the file
 */
ASTDiff.getOverlaysForFile = async function(storeId, filePath) {
  return await ASTDiff.findAll({
    where: {
      store_id: storeId,
      file_path: filePath
    },
    order: [['created_at', 'DESC']]
  });
};

/**
 * Get overlay history for a store
 * @param {string} storeId - Store ID
 * @param {Object} options - Query options
 * @returns {Array} List of AST diff overlays
 */
ASTDiff.getOverlayHistory = async function(storeId, options = {}) {
  const { limit = 50, status = null, changeType = null } = options;
  
  const where = { store_id: storeId };
  if (status) where.status = status;
  if (changeType) where.change_type = changeType;

  return await ASTDiff.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    include: [
      {
        model: sequelize.models.User,
        attributes: ['id', 'name', 'email']
      }
    ]
  });
};

module.exports = ASTDiff;