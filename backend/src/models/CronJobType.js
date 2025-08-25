const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CronJobType = sequelize.define('CronJobType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[a-z_]+$/ // Only lowercase letters and underscores
    }
  },
  display_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  configuration_schema: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidJSONSchema(value) {
        if (!value || typeof value !== 'object') {
          throw new Error('Configuration schema must be a valid JSON object');
        }
        if (!value.type || !value.properties) {
          throw new Error('Configuration schema must have type and properties');
        }
      }
    }
  },
  default_configuration: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  is_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'general',
    validate: {
      isIn: [['general', 'integration', 'notification', 'database', 'maintenance', 'reporting']]
    }
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'cron_job_types',
  updatedAt: false // Job types don't typically change after creation
});

// Static methods
CronJobType.getEnabledTypes = function() {
  return this.findAll({
    where: { is_enabled: true },
    order: [['category', 'ASC'], ['display_name', 'ASC']]
  });
};

CronJobType.getByCategory = function(category) {
  return this.findAll({
    where: { 
      category,
      is_enabled: true 
    },
    order: [['display_name', 'ASC']]
  });
};

CronJobType.validateConfiguration = function(typeName, configuration) {
  return this.findOne({ where: { type_name: typeName } })
    .then(jobType => {
      if (!jobType) {
        throw new Error(`Unknown job type: ${typeName}`);
      }
      
      // Here you would implement JSON Schema validation
      // For now, we'll do basic validation
      const schema = jobType.configuration_schema;
      const required = schema.required || [];
      
      for (const field of required) {
        if (!configuration[field]) {
          throw new Error(`Required field missing: ${field}`);
        }
      }
      
      return { valid: true, jobType };
    });
};

module.exports = CronJobType;