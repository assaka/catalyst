const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SlotConfiguration = sequelize.define('SlotConfiguration', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Complete slot configuration JSON including slots, components, and metadata'
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Configuration schema version'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this configuration is currently active'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'reverted'),
    allowNull: false,
    defaultValue: 'published',
    comment: 'Status of the configuration version'
  },
  version_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Version number for tracking configuration history'
  },
  page_type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'cart',
    comment: 'Type of page this configuration applies to'
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when this version was published'
  },
  published_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who published this version'
  },
  parent_version_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'slot_configurations',
      key: 'id'
    },
    comment: 'Reference to the parent version this was based on'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'slot_configurations',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'store_id', 'status', 'page_type'],
      name: 'idx_user_store_status_page'
    },
    {
      fields: ['store_id', 'status', 'page_type', 'version_number'],
      name: 'idx_store_status_page_version'
    },
    {
      fields: ['parent_version_id'],
      name: 'idx_parent_version'
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
SlotConfiguration.prototype.getSlotConfig = function(slotId) {
  return this.configuration?.slots?.[slotId] || null;
};

SlotConfiguration.prototype.updateSlotConfig = function(slotId, config) {
  if (!this.configuration.slots) {
    this.configuration.slots = {};
  }
  this.configuration.slots[slotId] = config;
  this.changed('configuration', true); // Mark as changed for Sequelize
};

SlotConfiguration.prototype.removeSlot = function(slotId) {
  if (this.configuration?.slots?.[slotId]) {
    delete this.configuration.slots[slotId];
    this.changed('configuration', true);
  }
};

// Class methods
SlotConfiguration.findActiveByUserStore = async function(userId, storeId) {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      is_active: true
    }
  });
};

// Find the latest draft for editing
SlotConfiguration.findLatestDraft = async function(userId, storeId, pageType = 'cart') {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      status: 'draft',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Find the latest published version for display
SlotConfiguration.findLatestPublished = async function(storeId, pageType = 'cart') {
  return this.findOne({
    where: {
      store_id: storeId,
      status: 'published',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Create or update a draft - proper upsert logic
SlotConfiguration.upsertDraft = async function(userId, storeId, pageType = 'cart', configuration = null) {
  // Try to find existing draft
  const existingDraft = await this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      page_type: pageType,
      status: 'draft'
    }
  });

  if (existingDraft) {
    // Update existing draft
    if (configuration) {
      existingDraft.configuration = configuration;
      existingDraft.updated_at = new Date();
      await existingDraft.save();
    }
    return existingDraft;
  }

  // No existing draft, create new one
  const latestPublished = await this.findLatestPublished(storeId, pageType);
  
  // Determine version number
  const maxVersion = await this.max('version_number', {
    where: {
      store_id: storeId,
      page_type: pageType
    }
  });

  const baseConfig = configuration || (latestPublished ? latestPublished.configuration : {
    slots: {},
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  });

  const newDraft = await this.create({
    user_id: userId,
    store_id: storeId,
    configuration: baseConfig,
    version: latestPublished ? latestPublished.version : '1.0',
    is_active: true,
    status: 'draft',
    version_number: (maxVersion || 0) + 1,
    page_type: pageType,
    parent_version_id: latestPublished ? latestPublished.id : null
  });

  return newDraft;
};

// Create draft - uses upsert logic
SlotConfiguration.createDraft = async function(userId, storeId, pageType = 'cart') {
  return this.upsertDraft(userId, storeId, pageType);
};

// Publish a draft
SlotConfiguration.publishDraft = async function(draftId, publishedByUserId) {
  const draft = await this.findByPk(draftId);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Draft not found or already published');
  }
  
  // Update the draft to published
  draft.status = 'published';
  draft.published_at = new Date();
  draft.published_by = publishedByUserId;
  await draft.save();
  
  return draft;
};

// Get version history for a store and page
SlotConfiguration.getVersionHistory = async function(storeId, pageType = 'cart', limit = 20) {
  return this.findAll({
    where: {
      store_id: storeId,
      page_type: pageType,
      status: 'published'
    },
    order: [['version_number', 'DESC']],
    limit
  });
};

// Revert to a specific version
SlotConfiguration.revertToVersion = async function(versionId, userId, storeId) {
  const targetVersion = await this.findByPk(versionId);
  if (!targetVersion || targetVersion.status !== 'published') {
    throw new Error('Version not found or not published');
  }
  
  // Mark all versions after this one as reverted
  await this.update(
    { status: 'reverted' },
    {
      where: {
        store_id: storeId,
        page_type: targetVersion.page_type,
        status: 'published',
        version_number: {
          [require('sequelize').Op.gt]: targetVersion.version_number
        }
      }
    }
  );
  
  // Create a new published version based on the target version
  const maxVersion = await this.max('version_number', {
    where: {
      store_id: storeId,
      page_type: targetVersion.page_type
    }
  });
  
  const newVersion = await this.create({
    user_id: userId,
    store_id: storeId,
    configuration: targetVersion.configuration,
    version: targetVersion.version,
    is_active: true,
    status: 'published',
    version_number: (maxVersion || 0) + 1,
    page_type: targetVersion.page_type,
    parent_version_id: targetVersion.id,
    published_at: new Date(),
    published_by: userId
  });
  
  return newVersion;
};

SlotConfiguration.findByMigrationSource = async function(source, limit = 100) {
  return this.findAll({
    where: {
      migration_source: source
    },
    limit,
    order: [['created_at', 'DESC']]
  });
};

module.exports = SlotConfiguration;