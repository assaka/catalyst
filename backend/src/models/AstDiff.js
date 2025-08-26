const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * AstDiff Model
 * Represents detailed AST (Abstract Syntax Tree) differences for code changes
 */
const AstDiff = sequelize.define('AstDiff', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  snapshot_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'customization_snapshots',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  diff_type: {
    type: DataTypes.ENUM('addition', 'deletion', 'modification', 'move', 'rename'),
    allowNull: false
  },
  node_path: {
    type: DataTypes.STRING(1024), // Path to the AST node (e.g., "Program.body[0].declarations[0]")
    allowNull: false
  },
  node_type: {
    type: DataTypes.STRING(128), // AST node type (e.g., "FunctionDeclaration", "VariableDeclarator")
    allowNull: false
  },
  old_value: {
    type: DataTypes.JSON, // Original AST node data
    allowNull: true
  },
  new_value: {
    type: DataTypes.JSON, // New AST node data
    allowNull: true
  },
  impact_level: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'breaking'),
    defaultValue: 'low'
  },
  line_start: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  line_end: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  column_start: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  column_end: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ast_diffs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // AST diffs are immutable once created
  indexes: [
    {
      fields: ['snapshot_id']
    },
    {
      fields: ['diff_type']
    },
    {
      fields: ['node_type']
    },
    {
      fields: ['impact_level']
    },
    {
      fields: ['snapshot_id', 'node_path'], // Compound index for efficient querying
      unique: false
    }
  ]
});

// Static methods
AstDiff.findBySnapshot = async function(snapshotId) {
  return await this.findAll({
    where: { snapshot_id: snapshotId },
    order: [['line_start', 'ASC'], ['column_start', 'ASC']]
  });
};

AstDiff.findByType = async function(snapshotId, diffType) {
  return await this.findAll({
    where: { 
      snapshot_id: snapshotId,
      diff_type: diffType 
    },
    order: [['line_start', 'ASC'], ['column_start', 'ASC']]
  });
};

AstDiff.findByNodeType = async function(snapshotId, nodeType) {
  return await this.findAll({
    where: { 
      snapshot_id: snapshotId,
      node_type: nodeType 
    },
    order: [['line_start', 'ASC'], ['column_start', 'ASC']]
  });
};

AstDiff.findHighImpactChanges = async function(snapshotId) {
  return await this.findAll({
    where: { 
      snapshot_id: snapshotId,
      impact_level: ['high', 'breaking']
    },
    order: [['impact_level', 'DESC'], ['line_start', 'ASC']]
  });
};

AstDiff.getImpactSummary = async function(snapshotId) {
  const diffs = await this.findAll({
    where: { snapshot_id: snapshotId },
    attributes: ['diff_type', 'impact_level', 'node_type']
  });

  const summary = {
    total: diffs.length,
    by_type: {},
    by_impact: {},
    by_node_type: {}
  };

  diffs.forEach(diff => {
    // Count by diff type
    summary.by_type[diff.diff_type] = (summary.by_type[diff.diff_type] || 0) + 1;
    
    // Count by impact level
    summary.by_impact[diff.impact_level] = (summary.by_impact[diff.impact_level] || 0) + 1;
    
    // Count by node type
    summary.by_node_type[diff.node_type] = (summary.by_node_type[diff.node_type] || 0) + 1;
  });

  return summary;
};

// Bulk create AST diffs for a snapshot
AstDiff.createForSnapshot = async function(snapshotId, astChanges) {
  const diffs = astChanges.map(change => ({
    snapshot_id: snapshotId,
    diff_type: change.type,
    node_path: change.path?.join('.') || '',
    node_type: change.oldNode?.type || change.newNode?.type || 'Unknown',
    old_value: change.oldNode || null,
    new_value: change.newNode || null,
    impact_level: change.impactLevel || 'low',
    line_start: change.range?.start?.line || null,
    line_end: change.range?.end?.line || null,
    column_start: change.range?.start?.column || null,
    column_end: change.range?.end?.column || null,
    description: change.description || null,
    metadata: change.metadata || {}
  }));

  return await this.bulkCreate(diffs);
};

module.exports = AstDiff;