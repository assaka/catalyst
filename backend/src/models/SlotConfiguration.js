const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const path = require('path');

// Helper functions to load configuration files from the frontend config directory
async function loadPageConfig(pageType) {
  try {
    const configsDir = path.resolve(__dirname, '../../../src/components/editor/slot/configs');
    let configPath, configExport;

    switch (pageType) {
      case 'cart':
        configPath = path.join(configsDir, 'cart-config.js');
        configExport = 'cartConfig';
        break;
      case 'category':
        configPath = path.join(configsDir, 'category-config.js');
        configExport = 'categoryConfig';
        break;
      case 'product':
        configPath = path.join(configsDir, 'product-config.js');
        configExport = 'productConfig';
        break;
      case 'checkout':
        configPath = path.join(configsDir, 'checkout-config.js');
        configExport = 'checkoutConfig';
        break;
      case 'success':
        configPath = path.join(configsDir, 'success-config.js');
        configExport = 'successConfig';
        break;
      case null:
      case undefined:
        throw new Error('pageType is required but was not provided');
      default:
        throw new Error(`Unknown page type '${pageType}'. Supported types: cart, category, product, checkout, success`);
    }

    const configModule = await import(configPath);
    const config = configModule[configExport];

    if (!config) {
      throw new Error(`Config export '${configExport}' not found in ${configPath}`);
    }

    return config;
  } catch (error) {
    console.error(`Failed to load ${pageType}-config.js:`, error);
    // Fallback to minimal config if import fails
    return {
      page_name: pageType.charAt(0).toUpperCase() + pageType.slice(1),
      slot_type: `${pageType}_layout`,
      slots: {},
      metadata: {}
    };
  }
}

// Placeholder for cart config that will be loaded dynamically
let cartConfig = null;

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
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'init',
    validate: {
      isIn: [['init', 'draft', 'acceptance', 'published', 'reverted']]
    },
    comment: 'Status of the configuration version: init -> draft -> acceptance -> published'
  },
  version_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Version number for tracking configuration history'
  },
  page_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of page this configuration applies to (required: cart, category, product, checkout, success)'
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
  acceptance_published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when this version was published to acceptance'
  },
  acceptance_published_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who published this version to acceptance'
  },
  current_edit_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'slot_configurations',
      key: 'id'
    },
    comment: 'ID of the configuration currently being edited (for revert tracking)'
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
  has_unpublished_changes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this draft has unpublished changes compared to the latest published version'
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
      fields: ['current_edit_id'],
      name: 'idx_current_edit'
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['is_active']
    }
  ]
});


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

// Find the latest draft for editing (includes both init and draft status)
SlotConfiguration.findLatestDraft = async function(userId, storeId, pageType) {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      status: ['init', 'draft'],
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Find the latest published version for display
SlotConfiguration.findLatestPublished = async function(storeId, pageType) {
  return this.findOne({
    where: {
      store_id: storeId,
      status: 'published',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Find the latest acceptance version for preview
SlotConfiguration.findLatestAcceptance = async function(storeId, pageType) {
  return this.findOne({
    where: {
      store_id: storeId,
      status: 'acceptance',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Create or update a draft - proper upsert logic with init->draft flow
SlotConfiguration.upsertDraft = async function(userId, storeId, pageType, configuration = null, isNewChanges = true, isReset = false) {

  // Try to find existing draft or init record
  const existingRecord = await this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      page_type: pageType,
      status: ['init', 'draft']
    },
    order: [['version_number', 'DESC']]
  });

  if (existingRecord) {

    // Handle init->draft transition
    if (existingRecord.status === 'init' && configuration) {
      existingRecord.configuration = configuration;
      existingRecord.status = 'draft';
      existingRecord.updated_at = new Date();
      existingRecord.has_unpublished_changes = isReset ? false : isNewChanges;
      await existingRecord.save();
      return existingRecord;
    }

    // Update existing draft
    if (configuration) {
      existingRecord.configuration = configuration;
      existingRecord.updated_at = new Date();
      existingRecord.has_unpublished_changes = isReset ? false : isNewChanges;
      await existingRecord.save();
    }
    return existingRecord;
  }

  // Determine version number
  const maxVersion = await this.max('version_number', {
    where: {
      store_id: storeId,
      page_type: pageType
    }
  });

  // If configuration is provided, create a draft; otherwise create an init record
  if (configuration) {
    const newDraft = await this.create({
      user_id: userId,
      store_id: storeId,
      configuration: configuration,
      version: '1.0',
      is_active: true,
      status: 'draft',
      version_number: (maxVersion || 0) + 1,
      page_type: pageType,
      parent_version_id: null,
      has_unpublished_changes: isReset ? false : isNewChanges
    });
    return newDraft;
  } else {
    // Try to copy from latest published configuration instead of creating empty
    const latestPublished = await this.findLatestPublished(storeId, pageType);

    let configurationToUse;
    let statusToUse = 'init';
    if (latestPublished && latestPublished.configuration) {
      configurationToUse = latestPublished.configuration;
      statusToUse = 'draft'; // Set to draft since it's already populated from published
    } else {
      // Load configuration from the appropriate config file (cart-config.js, category-config.js, etc.)
      const pageConfig = await loadPageConfig(pageType);
      configurationToUse = {
        page_name: pageConfig.page_name || pageType.charAt(0).toUpperCase() + pageType.slice(1),
        slot_type: pageConfig.slot_type || `${pageType}_layout`,
        slots: pageConfig.slots || {},
        rootSlots: pageConfig.rootSlots || [],
        slotDefinitions: pageConfig.slotDefinitions || {},
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          source: `${pageType}-config.js`,
          status: 'init'
        }
      };
      statusToUse = 'draft'; // Set to draft since it's already populated from config.js
    }

    // Create init/draft record (draft if copied from published, init if empty)
    const newRecord = await this.create({
      user_id: userId,
      store_id: storeId,
      configuration: configurationToUse,
      version: '1.0',
      is_active: true,
      status: statusToUse, // 'draft' if copied from published, 'init' if empty
      version_number: (maxVersion || 0) + 1,
      page_type: pageType,
      parent_version_id: null,
      has_unpublished_changes: false
    });
    return newRecord;
  }
};

// Create draft - uses upsert logic (creates init record first)
SlotConfiguration.createDraft = async function(userId, storeId, pageType) {
  return this.upsertDraft(userId, storeId, pageType, null, false, false);
};

// Publish a draft to acceptance (preview environment)
SlotConfiguration.publishToAcceptance = async function(draftId, publishedByUserId) {
  const draft = await this.findByPk(draftId);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Draft not found or not in draft status');
  }
  
  // Update the draft to acceptance
  draft.status = 'acceptance';
  draft.acceptance_published_at = new Date();
  draft.acceptance_published_by = publishedByUserId;
  await draft.save();
  
  return draft;
};

// Publish acceptance to production
SlotConfiguration.publishToProduction = async function(acceptanceId, publishedByUserId) {
  const acceptance = await this.findByPk(acceptanceId);
  if (!acceptance || acceptance.status !== 'acceptance') {
    throw new Error('Configuration not found or not in acceptance status');
  }
  
  // Update to published status
  acceptance.status = 'published';
  acceptance.published_at = new Date();
  acceptance.published_by = publishedByUserId;
  await acceptance.save();
  
  return acceptance;
};

// Publish a draft directly to production (legacy method for backward compatibility)
SlotConfiguration.publishDraft = async function(draftId, publishedByUserId) {
  const draft = await this.findByPk(draftId);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Draft not found or already published');
  }
  
  // Update the draft to published
  draft.status = 'published';
  draft.published_at = new Date();
  draft.published_by = publishedByUserId;
  draft.has_unpublished_changes = false; // Clear unpublished changes flag
  await draft.save();
  
  return draft;
};

// Get version history for a store and page
SlotConfiguration.getVersionHistory = async function(storeId, pageType, limit = 20) {
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

// Create a draft from a specific version (for revert functionality)
SlotConfiguration.createRevertDraft = async function(versionId, userId, storeId) {
  const targetVersion = await this.findByPk(versionId);
  if (!targetVersion || !['published', 'acceptance'].includes(targetVersion.status)) {
    throw new Error('Version not found or not in a revertible status');
  }

  const transaction = await this.sequelize.transaction();

  try {
    // Check if there's an existing draft for this user/store/page
    const existingDraft = await this.findOne({
      where: {
        user_id: userId,
        store_id: storeId,
        page_type: targetVersion.page_type,
        status: 'draft'
      },
      transaction
    });

    let revertMetadata = null;

    if (existingDraft) {
      // Store metadata about what we're replacing (for potential undo)
      revertMetadata = {
        replacedDraftId: existingDraft.id,
        originalConfiguration: existingDraft.configuration,
        originalParentVersionId: existingDraft.parent_version_id,
        originalCurrentEditId: existingDraft.current_edit_id,
        originalHasUnpublishedChanges: existingDraft.has_unpublished_changes
      };

      // Update existing draft with the reverted configuration
      existingDraft.configuration = targetVersion.configuration;
      existingDraft.updated_at = new Date();
      existingDraft.has_unpublished_changes = true; // Mark as having unpublished changes
      existingDraft.parent_version_id = targetVersion.id; // Track source of revert
      existingDraft.current_edit_id = targetVersion.id; // Track that this is based on the reverted version

      // Store revert metadata for potential undo
      if (!existingDraft.metadata) existingDraft.metadata = {};
      existingDraft.metadata = {
        ...existingDraft.metadata,
        revertMetadata
      };

      await existingDraft.save({ transaction });

      await transaction.commit();
      return existingDraft;
    } else {
      // Create new draft with the reverted configuration
      const maxVersion = await this.max('version_number', {
        where: {
          store_id: storeId,
          page_type: targetVersion.page_type
        },
        transaction
      });

      const newDraft = await this.create({
        user_id: userId,
        store_id: storeId,
        configuration: targetVersion.configuration,
        version: targetVersion.version,
        is_active: true,
        status: 'draft',
        version_number: (maxVersion || 0) + 1,
        page_type: targetVersion.page_type,
        parent_version_id: targetVersion.id,
        current_edit_id: targetVersion.id, // Track that this is based on the reverted version
        has_unpublished_changes: true, // Mark as having unpublished changes (revert needs to be published)
        metadata: {
          revertMetadata: {
            noPreviousDraft: true // Indicates no draft existed before revert
          }
        }
      }, { transaction });

      await transaction.commit();
      return newDraft;
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Revert to a specific version with proper tracking (DEPRECATED - use createRevertDraft instead)
SlotConfiguration.revertToVersion = async function(versionId, userId, storeId) {
  const targetVersion = await this.findByPk(versionId);
  if (!targetVersion || !['published', 'acceptance'].includes(targetVersion.status)) {
    throw new Error('Version not found or not in a revertible status');
  }

  const transaction = await this.sequelize.transaction();

  try {
    // Mark all versions after this one as reverted
    await this.update(
      {
        status: 'reverted',
        current_edit_id: null // Clear current edit tracking for reverted versions
      },
      {
        where: {
          store_id: storeId,
          page_type: targetVersion.page_type,
          status: {
            [require('sequelize').Op.in]: ['published', 'acceptance']
          },
          version_number: {
            [require('sequelize').Op.gt]: targetVersion.version_number
          }
        },
        transaction
      }
    );

    // Get the next version number
    const maxVersion = await this.max('version_number', {
      where: {
        store_id: storeId,
        page_type: targetVersion.page_type
      },
      transaction
    });

    // Create a new published version based on the target version
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
      current_edit_id: targetVersion.id, // Track that this is based on the reverted version
      published_at: new Date(),
      published_by: userId
    }, { transaction });

    await transaction.commit();
    return newVersion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Undo revert by either deleting draft or restoring previous draft state
SlotConfiguration.undoRevert = async function(draftId, userId, storeId) {
  const revertDraft = await this.findByPk(draftId);
  if (!revertDraft || revertDraft.status !== 'draft' || !revertDraft.current_edit_id) {
    throw new Error('No revert draft found or draft is not a revert');
  }

  const transaction = await this.sequelize.transaction();

  try {
    const revertMetadata = revertDraft.metadata?.revertMetadata;

    if (revertMetadata?.noPreviousDraft) {
      // No draft existed before revert - just delete the revert draft
      await revertDraft.destroy({ transaction });
      await transaction.commit();
      return { restored: false, message: 'Revert draft deleted - no previous draft to restore' };
    } else if (revertMetadata) {
      // Restore the original draft state
      revertDraft.configuration = revertMetadata.originalConfiguration;
      revertDraft.parent_version_id = revertMetadata.originalParentVersionId;
      revertDraft.current_edit_id = revertMetadata.originalCurrentEditId;
      revertDraft.has_unpublished_changes = revertMetadata.originalHasUnpublishedChanges;
      revertDraft.updated_at = new Date();

      // Clear revert metadata
      if (revertDraft.metadata) {
        delete revertDraft.metadata.revertMetadata;
        if (Object.keys(revertDraft.metadata).length === 0) {
          revertDraft.metadata = null;
        }
      }

      await revertDraft.save({ transaction });
      await transaction.commit();
      return { restored: true, draft: revertDraft, message: 'Previous draft state restored' };
    } else {
      // No metadata available - just delete the revert draft (fallback)
      await revertDraft.destroy({ transaction });
      await transaction.commit();
      return { restored: false, message: 'Revert draft deleted - no restoration metadata available' };
    }
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Set current editing configuration
SlotConfiguration.setCurrentEdit = async function(configId, userId, storeId, pageType) {
  // Clear any existing current_edit_id for this user/store/page
  await this.update(
    { current_edit_id: null },
    {
      where: {
        user_id: userId,
        store_id: storeId,
        page_type: pageType
      }
    }
  );

  // Set the new current_edit_id
  const config = await this.findByPk(configId);
  if (config) {
    config.current_edit_id = configId;
    await config.save();
  }

  return config;
};

// Get current editing configuration
SlotConfiguration.getCurrentEdit = async function(userId, storeId, pageType) {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      page_type: pageType,
      current_edit_id: {
        [require('sequelize').Op.ne]: null
      }
    },
    order: [['updated_at', 'DESC']]
  });
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