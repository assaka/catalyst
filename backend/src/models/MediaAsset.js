const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const MediaAsset = sequelize.define('MediaAsset', {
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
    },
    onDelete: 'CASCADE'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Full path in bucket (e.g., library/uuid.pdf)'
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Public URL'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Size in bytes'
  },
  folder: {
    type: DataTypes.STRING(100),
    defaultValue: 'library',
    comment: 'Folder within bucket'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    comment: 'Array of tags for organization'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata'
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Track how many times file is used'
  },
  last_accessed: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'media_assets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['folder']
    },
    {
      fields: ['created_at']
    },
    {
      unique: true,
      fields: ['store_id', 'file_path']
    }
  ]
});

// Class methods
MediaAsset.createFromUpload = async function(storeId, uploadResult, userId = null) {
  try {
    const asset = await this.create({
      store_id: storeId,
      file_name: uploadResult.filename || uploadResult.name,
      original_name: uploadResult.originalname || uploadResult.filename,
      file_path: uploadResult.path || uploadResult.fullPath,
      file_url: uploadResult.url || uploadResult.publicUrl,
      mime_type: uploadResult.mimetype || uploadResult.mimeType,
      file_size: uploadResult.size,
      folder: uploadResult.folder || 'library',
      uploaded_by: userId,
      metadata: {
        bucket: uploadResult.bucket,
        provider: uploadResult.provider,
        ...uploadResult.metadata
      }
    });
    
    return asset;
  } catch (error) {
    console.error('Error creating media asset:', error);
    throw error;
  }
};

MediaAsset.findByStore = async function(storeId, options = {}) {
  const where = { store_id: storeId };
  
  if (options.folder) {
    where.folder = options.folder;
  }
  
  if (options.tags && options.tags.length > 0) {
    where.tags = {
      [Op.contains]: options.tags
    };
  }
  
  return this.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: options.limit || 100,
    offset: options.offset || 0
  });
};

MediaAsset.incrementUsage = async function(id) {
  const asset = await this.findByPk(id);
  if (asset) {
    asset.usage_count += 1;
    asset.last_accessed = new Date();
    await asset.save();
  }
  return asset;
};

MediaAsset.findUnusedAssets = async function(storeId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.findAll({
    where: {
      store_id: storeId,
      usage_count: 0,
      created_at: {
        [Op.lt]: cutoffDate
      }
    },
    order: [['created_at', 'ASC']]
  });
};

module.exports = MediaAsset;