const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CodeCustomization = sequelize.define('CodeCustomization', {
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
    },
    onDelete: 'CASCADE'
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // Customization metadata
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  component_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  // Code content
  original_code: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  modified_code: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  diff_data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // AI metadata
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
  
  // Deployment info
  deployment_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'deployed', 'failed', 'pending']]
    }
  },
  deployed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deployment_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  render_service_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Version control
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  parent_version_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'code_customizations',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'code_customizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['component_type']
    },
    {
      fields: ['deployment_status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_active'],
      where: { is_active: true }
    },
    {
      unique: true,
      fields: ['name', 'user_id']
    }
  ]
});

// Define associations
CodeCustomization.associate = (models) => {
  CodeCustomization.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  CodeCustomization.belongsTo(models.Store, {
    foreignKey: 'store_id',
    as: 'store'
  });
  
  // Self-referencing association for version history
  CodeCustomization.belongsTo(CodeCustomization, {
    foreignKey: 'parent_version_id',
    as: 'parentVersion'
  });
  
  CodeCustomization.hasMany(CodeCustomization, {
    foreignKey: 'parent_version_id',
    as: 'childVersions'
  });
  
  // Association with render deployments
  CodeCustomization.hasMany(models.RenderDeployment, {
    foreignKey: 'customization_id',
    as: 'deployments'
  });
  
  // Association with AI generation logs
  CodeCustomization.hasMany(models.AIGenerationLog, {
    foreignKey: 'customization_id',
    as: 'aiLogs'
  });
};

// Instance methods
CodeCustomization.prototype.addAIPrompt = function(prompt, generatedCode, explanation) {
  const aiPrompts = [...(this.ai_prompts || [])];
  const aiChanges = [...(this.ai_changes || [])];
  
  aiPrompts.push({
    prompt,
    timestamp: new Date().toISOString()
  });
  
  if (generatedCode) {
    aiChanges.push({
      prompt,
      generated_code: generatedCode,
      explanation,
      timestamp: new Date().toISOString()
    });
  }
  
  this.ai_prompts = aiPrompts;
  this.ai_changes = aiChanges;
  
  return this.save();
};

CodeCustomization.prototype.createVersion = async function(changes = {}) {
  const newVersion = await CodeCustomization.create({
    ...this.dataValues,
    id: undefined, // Let Sequelize generate new ID
    parent_version_id: this.id,
    version: this.version + 1,
    created_at: undefined,
    updated_at: undefined,
    ...changes
  });
  
  return newVersion;
};

CodeCustomization.prototype.deploy = async function(renderServiceId, deployUrl) {
  this.deployment_status = 'deployed';
  this.deployed_at = new Date();
  this.render_service_id = renderServiceId;
  this.deployment_url = deployUrl;
  
  return this.save();
};

// Static methods
CodeCustomization.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
      ...options.where
    },
    include: options.include || [
      {
        model: this.sequelize.models.Store,
        as: 'store',
        attributes: ['id', 'name']
      }
    ],
    order: options.order || [['created_at', 'DESC']],
    ...options
  });
};

CodeCustomization.findByStore = function(storeId, options = {}) {
  return this.findAll({
    where: {
      store_id: storeId,
      is_active: true,
      ...options.where
    },
    include: options.include || [
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ],
    order: options.order || [['created_at', 'DESC']],
    ...options
  });
};

CodeCustomization.findActiveByComponent = function(componentType, options = {}) {
  return this.findAll({
    where: {
      component_type: componentType,
      is_active: true,
      deployment_status: 'deployed',
      ...options.where
    },
    order: options.order || [['deployed_at', 'DESC']],
    ...options
  });
};

CodeCustomization.getVersionHistory = function(customizationId) {
  return this.findAll({
    where: {
      $or: [
        { id: customizationId },
        { parent_version_id: customizationId }
      ]
    },
    order: [['version', 'ASC']],
    include: [
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });
};

module.exports = CodeCustomization;