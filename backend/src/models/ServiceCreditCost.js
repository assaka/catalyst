const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ServiceCreditCost = sequelize.define('ServiceCreditCost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  service_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    },
    comment: 'Unique identifier for the service, used in code'
  },
  service_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  service_category: {
    type: DataTypes.ENUM(
      'store_operations',
      'plugin_management',
      'ai_services',
      'data_migration',
      'storage',
      'akeneo_integration',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cost_per_unit: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: false,
    defaultValue: 0.0000,
    validate: {
      min: 0
    }
  },
  billing_type: {
    type: DataTypes.ENUM(
      'per_day',
      'per_use',
      'per_month',
      'per_hour',
      'per_item',
      'per_mb',
      'flat_rate'
    ),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_visible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Show in pricing pages'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Flexible config: limits, tiers, notes, etc.'
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
  tableName: 'service_credit_costs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['service_category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['service_key']
    },
    {
      fields: ['display_order']
    }
  ]
});

// Class methods for managing service credit costs

/**
 * Get cost for a specific service by key
 */
ServiceCreditCost.getCostByKey = async function(serviceKey) {
  const service = await this.findOne({
    where: {
      service_key: serviceKey,
      is_active: true
    }
  });

  if (!service) {
    throw new Error(`Service cost not found for key: ${serviceKey}`);
  }

  // Convert DECIMAL to number (Sequelize returns DECIMAL as string)
  return parseFloat(service.cost_per_unit);
};

/**
 * Get all active services grouped by category
 */
ServiceCreditCost.getActiveServicesByCategory = async function() {
  const services = await this.findAll({
    where: {
      is_active: true
    },
    order: [
      ['service_category', 'ASC'],
      ['display_order', 'ASC']
    ]
  });

  // Group by category
  const grouped = {};
  services.forEach(service => {
    const category = service.service_category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(service);
  });

  return grouped;
};

/**
 * Get all visible services for pricing page
 */
ServiceCreditCost.getVisibleServices = async function() {
  return await this.findAll({
    where: {
      is_active: true,
      is_visible: true
    },
    order: [
      ['service_category', 'ASC'],
      ['display_order', 'ASC']
    ]
  });
};

/**
 * Update cost for a service
 */
ServiceCreditCost.updateCost = async function(serviceKey, newCost, updatedBy = null) {
  const service = await this.findOne({
    where: { service_key: serviceKey }
  });

  if (!service) {
    throw new Error(`Service not found: ${serviceKey}`);
  }

  const updateData = {
    cost_per_unit: newCost
  };

  if (updatedBy) {
    updateData.updated_by = updatedBy;
  }

  await service.update(updateData);
  return service;
};

/**
 * Create a new service cost entry
 */
ServiceCreditCost.createService = async function(serviceData, createdBy = null) {
  const data = { ...serviceData };
  if (createdBy) {
    data.created_by = createdBy;
    data.updated_by = createdBy;
  }

  return await this.create(data);
};

/**
 * Calculate cost for a specific service usage
 * @param {string} serviceKey - The service key
 * @param {number} units - Number of units (days, uses, items, etc.)
 * @returns {Promise<{cost: number, service: ServiceCreditCost}>}
 */
ServiceCreditCost.calculateCost = async function(serviceKey, units = 1) {
  const service = await this.findOne({
    where: {
      service_key: serviceKey,
      is_active: true
    }
  });

  if (!service) {
    throw new Error(`Service cost not found for key: ${serviceKey}`);
  }

  const cost = parseFloat(service.cost_per_unit) * units;

  return {
    cost: parseFloat(cost.toFixed(4)),
    service: service.toJSON()
  };
};

/**
 * Get services by category
 */
ServiceCreditCost.getByCategory = async function(category, activeOnly = true) {
  const where = { service_category: category };
  if (activeOnly) {
    where.is_active = true;
  }

  return await this.findAll({
    where,
    order: [['display_order', 'ASC']]
  });
};

/**
 * Toggle service active status
 */
ServiceCreditCost.toggleActive = async function(serviceKey, updatedBy = null) {
  const service = await this.findOne({
    where: { service_key: serviceKey }
  });

  if (!service) {
    throw new Error(`Service not found: ${serviceKey}`);
  }

  const updateData = {
    is_active: !service.is_active
  };

  if (updatedBy) {
    updateData.updated_by = updatedBy;
  }

  await service.update(updateData);
  return service;
};

module.exports = ServiceCreditCost;
