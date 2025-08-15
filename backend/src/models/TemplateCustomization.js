const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const TemplateCustomization = sequelize.define('TemplateCustomization', {
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
  template_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Template name like ProductDetail, Cart, Checkout'
  },
  component_path: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Component path like pages/ProductDetail, components/Header'
  },
  customizations: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'JSONB object containing all customizations (styles, content, behavior, layout)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'template_customizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_template_customizations_store_template',
      fields: ['store_id', 'template_name']
    },
    {
      name: 'idx_template_customizations_active',
      fields: ['store_id', 'is_active'],
      where: {
        is_active: true
      }
    }
  ]
});

// Static methods for template customization operations
TemplateCustomization.findByStoreAndTemplate = async function(storeId, templateName, componentPath = null) {
  const whereClause = {
    store_id: storeId,
    template_name: templateName,
    is_active: true
  };
  
  if (componentPath) {
    whereClause.component_path = componentPath;
  }

  return await this.findOne({
    where: whereClause,
    order: [['version', 'DESC']]
  });
};

TemplateCustomization.getTemplateCustomizations = async function(storeId, templateName) {
  return await this.findAll({
    where: {
      store_id: storeId,
      template_name: templateName,
      is_active: true
    },
    order: [['component_path', 'ASC'], ['version', 'DESC']]
  });
};

TemplateCustomization.createOrUpdateCustomization = async function(storeId, templateName, componentPath, customizations, userId) {
  // Check if customization exists
  const existing = await this.findByStoreAndTemplate(storeId, templateName, componentPath);
  
  if (existing) {
    // Update existing customization
    existing.customizations = customizations;
    existing.version = existing.version + 1;
    existing.created_by = userId;
    return await existing.save();
  } else {
    // Create new customization
    return await this.create({
      store_id: storeId,
      template_name: templateName,
      component_path: componentPath,
      customizations: customizations,
      created_by: userId
    });
  }
};

TemplateCustomization.getCustomizationsByTemplate = async function(storeId, templateName) {
  return await this.findAll({
    where: {
      store_id: storeId,
      template_name: templateName,
      is_active: true
    },
    include: [
      {
        association: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ],
    order: [['updated_at', 'DESC']]
  });
};

TemplateCustomization.deactivateCustomization = async function(storeId, templateName, componentPath) {
  return await this.update(
    { is_active: false },
    {
      where: {
        store_id: storeId,
        template_name: templateName,
        component_path: componentPath,
        is_active: true
      }
    }
  );
};

// Instance methods
TemplateCustomization.prototype.duplicate = async function(newVersion = null) {
  const newCustomization = await TemplateCustomization.create({
    store_id: this.store_id,
    template_name: this.template_name,
    component_path: this.component_path,
    customizations: this.customizations,
    version: newVersion || (this.version + 1),
    created_by: this.created_by
  });
  
  return newCustomization;
};

TemplateCustomization.prototype.mergeCustomizations = function(newCustomizations) {
  this.customizations = {
    ...this.customizations,
    ...newCustomizations
  };
  return this.save();
};

TemplateCustomization.prototype.updateStyles = function(styles) {
  const updated = {
    ...this.customizations,
    styles: {
      ...this.customizations.styles,
      ...styles
    }
  };
  
  this.customizations = updated;
  return this.save();
};

TemplateCustomization.prototype.updateContent = function(content) {
  const updated = {
    ...this.customizations,
    content: {
      ...this.customizations.content,
      ...content
    }
  };
  
  this.customizations = updated;
  return this.save();
};

TemplateCustomization.prototype.updateBehavior = function(behavior) {
  const updated = {
    ...this.customizations,
    behavior: {
      ...this.customizations.behavior,
      ...behavior
    }
  };
  
  this.customizations = updated;
  return this.save();
};

module.exports = TemplateCustomization;