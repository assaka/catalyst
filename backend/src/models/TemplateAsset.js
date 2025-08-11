const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const TemplateAsset = sequelize.define('TemplateAsset', {
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
  template_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'store_templates',
      key: 'id'
    }
  },
  asset_type: {
    type: DataTypes.ENUM('javascript', 'css', 'image', 'font', 'other'),
    allowNull: false
  },
  asset_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  asset_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  asset_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  checksum: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'template_assets',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'template_id', 'asset_name']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['template_id']
    },
    {
      fields: ['asset_type']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
TemplateAsset.prototype.activate = function() {
  return this.update({ is_active: true });
};

TemplateAsset.prototype.deactivate = function() {
  return this.update({ is_active: false });
};

TemplateAsset.prototype.updateChecksum = function(newChecksum) {
  return this.update({ checksum: newChecksum, updated_at: new Date() });
};

// Static methods
TemplateAsset.findByStore = function(storeId, assetType = null) {
  const where = { store_id: storeId, is_active: true };
  if (assetType) {
    where.asset_type = assetType;
  }
  
  return this.findAll({
    where,
    order: [['created_at', 'DESC']]
  });
};

TemplateAsset.findByTemplate = function(templateId, assetType = null) {
  const where = { template_id: templateId, is_active: true };
  if (assetType) {
    where.asset_type = assetType;
  }
  
  return this.findAll({
    where,
    order: [['asset_type', 'ASC'], ['created_at', 'ASC']]
  });
};

TemplateAsset.findJavaScriptAssets = function(storeId, templateId = null) {
  const where = { store_id: storeId, asset_type: 'javascript', is_active: true };
  if (templateId) {
    where.template_id = templateId;
  }
  
  return this.findAll({
    where,
    order: [['created_at', 'ASC']]
  });
};

TemplateAsset.findCSSAssets = function(storeId, templateId = null) {
  const where = { store_id: storeId, asset_type: 'css', is_active: true };
  if (templateId) {
    where.template_id = templateId;
  }
  
  return this.findAll({
    where,
    order: [['created_at', 'ASC']]
  });
};

TemplateAsset.createOrUpdate = async function(storeId, templateId, assetData) {
  const { asset_name, asset_type, asset_path, asset_url, file_size, mime_type, checksum } = assetData;
  
  const existing = await this.findOne({
    where: {
      store_id: storeId,
      template_id: templateId,
      asset_name: asset_name
    }
  });

  if (existing) {
    return existing.update({
      asset_path,
      asset_url,
      file_size,
      mime_type,
      checksum,
      updated_at: new Date()
    });
  } else {
    return this.create({
      store_id: storeId,
      template_id: templateId,
      asset_name,
      asset_type,
      asset_path,
      asset_url,
      file_size,
      mime_type,
      checksum
    });
  }
};

TemplateAsset.getAssetStats = async function(storeId) {
  const assets = await this.findAll({
    where: { store_id: storeId, is_active: true },
    attributes: ['asset_type', 'file_size']
  });

  const stats = {
    total: assets.length,
    totalSize: assets.reduce((sum, asset) => sum + (asset.file_size || 0), 0),
    byType: {}
  };

  assets.forEach(asset => {
    if (!stats.byType[asset.asset_type]) {
      stats.byType[asset.asset_type] = {
        count: 0,
        totalSize: 0
      };
    }
    
    stats.byType[asset.asset_type].count++;
    stats.byType[asset.asset_type].totalSize += asset.file_size || 0;
  });

  return stats;
};

// Hook to update timestamp on save
TemplateAsset.beforeUpdate((asset) => {
  asset.updated_at = new Date();
});

module.exports = TemplateAsset;