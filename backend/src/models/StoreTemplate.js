const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const StoreTemplate = sequelize.define('StoreTemplate', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('category', 'product', 'checkout', 'homepage', 'custom'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  elements: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  styles: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0.0'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'store_templates',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'type']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
StoreTemplate.prototype.activate = function() {
  return this.update({ is_active: true });
};

StoreTemplate.prototype.deactivate = function() {
  return this.update({ is_active: false });
};

StoreTemplate.prototype.updateVersion = function() {
  const [major, minor, patch] = this.version.split('.').map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}`;
  return this.update({ version: newVersion });
};

// Static methods
StoreTemplate.findByStore = function(storeId) {
  return this.findAll({
    where: { store_id: storeId },
    order: [['updated_at', 'DESC']]
  });
};

StoreTemplate.findByType = function(storeId, type) {
  return this.findOne({
    where: { 
      store_id: storeId,
      type: type
    }
  });
};

StoreTemplate.findActiveByType = function(storeId, type) {
  return this.findOne({
    where: { 
      store_id: storeId,
      type: type,
      is_active: true
    }
  });
};

StoreTemplate.createOrUpdate = async function(storeId, templateData) {
  const { type, name, elements, styles, settings } = templateData;
  
  const existing = await this.findOne({
    where: {
      store_id: storeId,
      type: type
    }
  });

  if (existing) {
    return existing.update({
      name,
      elements,
      styles,
      settings,
      updated_at: new Date()
    });
  } else {
    return this.create({
      store_id: storeId,
      type,
      name,
      elements,
      styles,
      settings
    });
  }
};

StoreTemplate.duplicate = async function(templateId, newName) {
  const original = await this.findByPk(templateId);
  if (!original) {
    throw new Error('Template not found');
  }

  const duplicated = await this.create({
    store_id: original.store_id,
    type: original.type,
    name: newName || `${original.name} (Copy)`,
    elements: original.elements,
    styles: original.styles,
    settings: original.settings,
    is_active: false
  });

  return duplicated;
};

StoreTemplate.getTemplateStats = async function(storeId) {
  const templates = await this.findAll({
    where: { store_id: storeId },
    attributes: ['type', 'is_active', 'updated_at']
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    byType: {}
  };

  templates.forEach(template => {
    if (!stats.byType[template.type]) {
      stats.byType[template.type] = {
        count: 0,
        active: 0,
        lastUpdated: null
      };
    }
    
    stats.byType[template.type].count++;
    if (template.is_active) {
      stats.byType[template.type].active++;
    }
    
    if (!stats.byType[template.type].lastUpdated || 
        template.updated_at > stats.byType[template.type].lastUpdated) {
      stats.byType[template.type].lastUpdated = template.updated_at;
    }
  });

  return stats;
};

// Hook to update timestamp on save
StoreTemplate.beforeUpdate((template) => {
  template.updated_at = new Date();
});

module.exports = StoreTemplate;