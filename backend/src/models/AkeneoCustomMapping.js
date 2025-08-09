const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AkeneoCustomMapping = sequelize.define('AkeneoCustomMapping', {
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
  mapping_type: {
    type: DataTypes.ENUM('attributes', 'images', 'files'),
    allowNull: false
  },
  mappings: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'akeneo_custom_mappings',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'mapping_type']
    }
  ]
});

// Static methods for easy access
AkeneoCustomMapping.getMappings = async function(storeId, mappingType = null) {
  const where = { store_id: storeId };
  if (mappingType) {
    where.mapping_type = mappingType;
  }
  
  const mappings = await this.findAll({ where });
  
  if (mappingType) {
    return mappings[0]?.mappings || [];
  }
  
  // Return object with all mapping types
  const result = {
    attributes: [],
    images: [],
    files: []
  };
  
  mappings.forEach(m => {
    result[m.mapping_type] = m.mappings || [];
  });
  
  return result;
};

AkeneoCustomMapping.saveMappings = async function(storeId, mappingType, mappings, userId = null) {
  const [mapping, created] = await this.findOrCreate({
    where: { 
      store_id: storeId,
      mapping_type: mappingType 
    },
    defaults: {
      mappings: mappings || [],
      created_by: userId,
      updated_by: userId
    }
  });
  
  if (!created) {
    mapping.mappings = mappings || [];
    mapping.updated_by = userId;
    await mapping.save();
  }
  
  return mapping;
};

AkeneoCustomMapping.saveAllMappings = async function(storeId, allMappings, userId = null) {
  const promises = [];
  
  if (allMappings.attributes) {
    promises.push(this.saveMappings(storeId, 'attributes', allMappings.attributes, userId));
  }
  if (allMappings.images) {
    promises.push(this.saveMappings(storeId, 'images', allMappings.images, userId));
  }
  if (allMappings.files) {
    promises.push(this.saveMappings(storeId, 'files', allMappings.files, userId));
  }
  
  await Promise.all(promises);
  
  return this.getMappings(storeId);
};

module.exports = AkeneoCustomMapping;