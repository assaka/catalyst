const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AkeneoMapping = sequelize.define('AkeneoMapping', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Akeneo side
  akeneo_code: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The code/identifier used in Akeneo PIM'
  },
  akeneo_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type of Akeneo entity (category, product, attribute, etc.)'
  },
  // Catalyst side
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type of Catalyst entity being mapped to'
  },
  entity_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'UUID of the Catalyst entity'
  },
  entity_slug: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable slug for reference and fallback matching'
  },
  // Metadata
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  mapping_source: {
    type: DataTypes.STRING(50),
    defaultValue: 'auto',
    comment: 'How this mapping was created (auto, manual, import)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'akeneo_mappings',
  indexes: [
    {
      name: 'idx_akeneo_mappings_lookup',
      fields: ['store_id', 'akeneo_code', 'akeneo_type', 'is_active']
    },
    {
      name: 'idx_akeneo_mappings_entity', 
      fields: ['entity_type', 'entity_id']
    },
    {
      name: 'idx_akeneo_mappings_slug',
      fields: ['entity_slug']
    },
    {
      name: 'idx_akeneo_mappings_unique',
      fields: ['store_id', 'akeneo_code', 'akeneo_type', 'entity_type'],
      unique: true
    }
  ]
});

// Static methods for common operations
AkeneoMapping.findByAkeneoCode = function(storeId, akeneoCode, akeneoType = 'category') {
  return this.findOne({
    where: {
      store_id: storeId,
      akeneo_code: akeneoCode,
      akeneo_type: akeneoType,
      is_active: true
    }
  });
};

AkeneoMapping.findByEntity = function(storeId, entityType, entityId) {
  return this.findAll({
    where: {
      store_id: storeId,
      entity_type: entityType,
      entity_id: entityId,
      is_active: true
    }
  });
};

AkeneoMapping.createMapping = async function(storeId, akeneoCode, akeneoType, entityType, entityId, entitySlug, options = {}) {
  const { source = 'auto', notes = null, force = false } = options;
  
  try {
    // Check if mapping already exists
    const existing = await this.findOne({
      where: {
        store_id: storeId,
        akeneo_code: akeneoCode,
        akeneo_type: akeneoType,
        entity_type: entityType
      }
    });
    
    if (existing) {
      if (force) {
        // Update existing mapping
        return await existing.update({
          entity_id: entityId,
          entity_slug: entitySlug,
          mapping_source: source,
          notes: notes,
          is_active: true
        });
      } else {
        // Return existing mapping
        return existing;
      }
    }
    
    // Create new mapping
    return await this.create({
      akeneo_code: akeneoCode,
      akeneo_type: akeneoType,
      entity_type: entityType,
      entity_id: entityId,
      entity_slug: entitySlug,
      store_id: storeId,
      mapping_source: source,
      notes: notes,
      is_active: true
    });
  } catch (error) {
    console.error('Error creating Akeneo mapping:', error);
    throw error;
  }
};

AkeneoMapping.buildCategoryMapping = async function(storeId) {
  const mappings = await this.findAll({
    where: {
      store_id: storeId,
      akeneo_type: 'category',
      entity_type: 'category',
      is_active: true
    }
  });
  
  const mapping = {};
  mappings.forEach(m => {
    mapping[m.akeneo_code] = m.entity_id;
  });
  
  return mapping;
};

AkeneoMapping.autoCreateCategoryMappings = async function(storeId) {
  const Category = require('./Category');
  
  const categories = await Category.findAll({
    where: { store_id: storeId },
    attributes: ['id', 'name', 'slug']
  });
  
  const createdMappings = [];
  
  for (const category of categories) {
    // Check if mapping already exists
    const existing = await this.findOne({
      where: {
        store_id: storeId,
        entity_type: 'category',
        entity_id: category.id,
        is_active: true
      }
    });
    
    if (existing) continue; // Skip if mapping already exists
    
    // Create automatic mappings based on category slug and name
    const possibleCodes = [
      category.slug,
      category.slug.replace(/-/g, '_'),
      category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    ];
    
    // Use the most likely Akeneo code (slug with underscores)
    const primaryCode = category.slug.replace(/-/g, '_');
    
    try {
      const mapping = await this.createMapping(
        storeId,
        primaryCode,
        'category',
        'category', 
        category.id,
        category.slug,
        { source: 'auto', notes: `Auto-generated from category: ${category.name}` }
      );
      createdMappings.push(mapping);
    } catch (error) {
      console.warn(`Could not create auto-mapping for category ${category.name}:`, error.message);
    }
  }
  
  return createdMappings;
};

module.exports = AkeneoMapping;