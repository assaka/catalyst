const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const RenderDeployment = sequelize.define('RenderDeployment', {
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
    },
    onDelete: 'CASCADE'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Render.com integration
  render_service_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  render_deploy_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  deploy_hook_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Deployment details
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'building', 'live', 'failed', 'cancelled']]
    }
  },
  build_logs: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deploy_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  // Repository info
  repo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  branch_name: {
    type: DataTypes.STRING(100),
    defaultValue: 'main'
  },
  commit_hash: {
    type: DataTypes.STRING(40),
    allowNull: true
  },
  
  // Timestamps
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'render_deployments',
  timestamps: false, // We use custom timestamp fields
  indexes: [
    {
      fields: ['customization_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['started_at']
    },
    {
      fields: ['render_service_id']
    }
  ]
});

// Define associations
RenderDeployment.associate = (models) => {
  RenderDeployment.belongsTo(models.HybridCustomization, {
    foreignKey: 'customization_id',
    as: 'customization'
  });
  
  RenderDeployment.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Instance methods
RenderDeployment.prototype.updateStatus = function(status, metadata = {}) {
  this.status = status;
  this.metadata = { ...this.metadata, ...metadata };
  
  if (status === 'live' || status === 'failed') {
    this.completed_at = new Date();
  }
  
  return this.save();
};

RenderDeployment.prototype.addBuildLog = function(logEntry) {
  const currentLogs = this.build_logs || '';
  const timestamp = new Date().toISOString();
  const newLog = `[${timestamp}] ${logEntry}\n`;
  
  this.build_logs = currentLogs + newLog;
  return this.save();
};

RenderDeployment.prototype.getDuration = function() {
  if (!this.completed_at) {
    return Date.now() - new Date(this.started_at).getTime();
  }
  return new Date(this.completed_at).getTime() - new Date(this.started_at).getTime();
};

// Static methods
RenderDeployment.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      ...options.where
    },
    include: options.include || [
      {
        model: this.sequelize.models.HybridCustomization,
        as: 'customization',
        attributes: ['id', 'name', 'description', 'component_type']
      }
    ],
    order: options.order || [['started_at', 'DESC']],
    ...options
  });
};

RenderDeployment.findByCustomization = function(customizationId, options = {}) {
  return this.findAll({
    where: {
      customization_id: customizationId,
      ...options.where
    },
    order: options.order || [['started_at', 'DESC']],
    ...options
  });
};

RenderDeployment.findActiveDeployments = function(options = {}) {
  return this.findAll({
    where: {
      status: ['pending', 'building'],
      ...options.where
    },
    include: options.include || [
      {
        model: this.sequelize.models.HybridCustomization,
        as: 'customization',
        attributes: ['id', 'name']
      },
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }
    ],
    order: [['started_at', 'ASC']],
    ...options
  });
};

RenderDeployment.getDeploymentStats = async function(userId = null) {
  const whereClause = userId ? { user_id: userId } : {};
  
  const [totalDeployments, successfulDeployments, failedDeployments, pendingDeployments] = await Promise.all([
    this.count({ where: whereClause }),
    this.count({ where: { ...whereClause, status: 'live' } }),
    this.count({ where: { ...whereClause, status: 'failed' } }),
    this.count({ where: { ...whereClause, status: ['pending', 'building'] } })
  ]);
  
  const successRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;
  
  return {
    total: totalDeployments,
    successful: successfulDeployments,
    failed: failedDeployments,
    pending: pendingDeployments,
    successRate: Math.round(successRate * 100) / 100
  };
};

// Create deployment with initial status
RenderDeployment.createDeployment = async function(data) {
  const deployment = await this.create({
    ...data,
    status: 'pending',
    started_at: new Date()
  });
  
  // Add initial log entry
  await deployment.addBuildLog('Deployment initiated');
  
  return deployment;
};

module.exports = RenderDeployment;