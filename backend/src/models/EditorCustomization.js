const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const EditorCustomization = sequelize.define('EditorCustomization', {
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
  settings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  file_customizations: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  layout_preferences: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      file_tree_open: true,
      chat_open: true,
      file_tree_width: 256,
      chat_width: 320,
      editor_theme: 'dark',
      font_size: 14,
      word_wrap: true
    }
  },
  recent_files: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      auto_save: true,
      auto_save_delay: 3000,
      show_line_numbers: true,
      highlight_active_line: true,
      expanded_folders: {}
    }
  }
}, {
  tableName: 'editor_customizations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['user_id', 'store_id']
    }
  ]
});

// Instance methods
EditorCustomization.prototype.addRecentFile = function(filePath, fileName, fileType) {
  const recentFile = {
    path: filePath,
    name: fileName,
    type: fileType,
    opened_at: new Date().toISOString()
  };
  
  // Remove existing entry if it exists
  const filtered = this.recent_files.filter(f => f.path !== filePath);
  
  // Add to beginning and limit to 20 recent files
  const updated = [recentFile, ...filtered].slice(0, 20);
  
  return this.update({ recent_files: updated });
};

EditorCustomization.prototype.updateExpandedFolders = function(expandedFolders) {
  const updatedPrefs = {
    ...this.preferences,
    expanded_folders: expandedFolders
  };
  
  return this.update({ preferences: updatedPrefs });
};

EditorCustomization.prototype.updateLayoutPreference = function(key, value) {
  const updatedLayout = {
    ...this.layout_preferences,
    [key]: value
  };
  
  return this.update({ layout_preferences: updatedLayout });
};

EditorCustomization.prototype.updateFileCustomization = function(filePath, customization) {
  const updatedCustomizations = {
    ...this.file_customizations,
    [filePath]: {
      ...this.file_customizations[filePath],
      ...customization,
      updated_at: new Date().toISOString()
    }
  };
  
  return this.update({ file_customizations: updatedCustomizations });
};

// Static methods
EditorCustomization.findByUser = async function(userId, storeId = null) {
  const where = { user_id: userId };
  if (storeId) {
    where.store_id = storeId;
  }
  
  let customization = await this.findOne({ where });
  
  // Create default customization if none exists
  if (!customization) {
    customization = await this.create({
      user_id: userId,
      store_id: storeId
    });
  }
  
  return customization;
};

EditorCustomization.getRecentFiles = async function(userId, storeId = null, limit = 10) {
  const customization = await this.findByUser(userId, storeId);
  return customization.recent_files.slice(0, limit);
};

EditorCustomization.saveFileContent = async function(userId, storeId, filePath, content, metadata = {}) {
  const customization = await this.findByUser(userId, storeId);
  
  const fileCustomization = {
    content,
    saved_at: new Date().toISOString(),
    metadata,
    version: (customization.file_customizations[filePath]?.version || 0) + 1
  };
  
  await customization.updateFileCustomization(filePath, fileCustomization);
  await customization.addRecentFile(filePath, metadata.name || filePath, metadata.type || 'file');
  
  return customization;
};

EditorCustomization.getFileContent = async function(userId, storeId, filePath) {
  const customization = await this.findByUser(userId, storeId);
  return customization.file_customizations[filePath]?.content || null;
};

EditorCustomization.updateSettings = async function(userId, storeId, newSettings) {
  const customization = await this.findByUser(userId, storeId);
  
  const updatedSettings = {
    ...customization.settings,
    ...newSettings,
    updated_at: new Date().toISOString()
  };
  
  return customization.update({ settings: updatedSettings });
};

// Associations will be defined when models are loaded
EditorCustomization.associate = function(models) {
  EditorCustomization.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  EditorCustomization.belongsTo(models.Store, {
    foreignKey: 'store_id',
    as: 'store'
  });
};

module.exports = EditorCustomization;