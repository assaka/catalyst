const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SupabaseProjectKeys = sequelize.define('SupabaseProjectKeys', {
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
  project_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  project_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  anon_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  service_role_key: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'supabase_project_keys',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'project_id']
    }
  ]
});

// Class methods
SupabaseProjectKeys.findByStoreAndProject = async function(storeId, projectId) {
  return await this.findOne({
    where: {
      store_id: storeId,
      project_id: projectId
    }
  });
};

SupabaseProjectKeys.upsertKeys = async function(storeId, projectId, projectUrl, keys) {
  const existing = await this.findByStoreAndProject(storeId, projectId);
  
  if (existing) {
    // Update existing keys
    const updates = {};
    if (keys.anonKey !== undefined) updates.anon_key = keys.anonKey;
    if (keys.serviceRoleKey !== undefined) updates.service_role_key = keys.serviceRoleKey;
    if (projectUrl) updates.project_url = projectUrl;
    
    await existing.update(updates);
    return existing;
  } else {
    // Create new entry
    return await this.create({
      store_id: storeId,
      project_id: projectId,
      project_url: projectUrl,
      anon_key: keys.anonKey || null,
      service_role_key: keys.serviceRoleKey || null
    });
  }
};

SupabaseProjectKeys.getKeysForProject = async function(storeId, projectId) {
  const keys = await this.findByStoreAndProject(storeId, projectId);
  if (!keys) return null;
  
  return {
    anonKey: keys.anon_key,
    serviceRoleKey: keys.service_role_key,
    projectUrl: keys.project_url
  };
};

module.exports = SupabaseProjectKeys;