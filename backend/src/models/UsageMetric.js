const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const UsageMetric = sequelize.define('UsageMetric', {
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
  metric_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  metric_hour: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 23
    }
  },
  // Product metrics
  products_created: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  products_updated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  products_deleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_products: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Category metrics
  categories_created: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  categories_updated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Order metrics
  orders_created: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  orders_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  orders_cancelled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  orders_total_value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  orders_avg_value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  // Customer metrics
  customers_new: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  customers_returning: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Storage metrics
  storage_uploaded_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  storage_deleted_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  storage_total_bytes: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  storage_files_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // API metrics
  api_calls: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  api_errors: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  api_avg_response_time_ms: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Page views
  page_views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unique_visitors: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'usage_metrics',
  indexes: [
    { fields: ['store_id'] },
    { fields: ['metric_date'] },
    { unique: true, fields: ['store_id', 'metric_date', 'metric_hour'] }
  ]
});

// Static methods
UsageMetric.track = async function(storeId, metricType, value = 1) {
  const today = new Date().toISOString().split('T')[0];

  const [metric, created] = await this.findOrCreate({
    where: {
      store_id: storeId,
      metric_date: today,
      metric_hour: null
    },
    defaults: {
      store_id: storeId,
      metric_date: today
    }
  });

  // Increment the appropriate metric
  const fieldMap = {
    'product_created': 'products_created',
    'product_updated': 'products_updated',
    'product_deleted': 'products_deleted',
    'order_created': 'orders_created',
    'order_completed': 'orders_completed',
    'api_call': 'api_calls',
    'api_error': 'api_errors',
    'page_view': 'page_views'
  };

  const field = fieldMap[metricType];
  if (field) {
    metric[field] = (metric[field] || 0) + value;
    await metric.save();
  }

  return metric;
};

UsageMetric.getDailySummary = async function(storeId, startDate, endDate) {
  return await this.findAll({
    where: {
      store_id: storeId,
      metric_date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      },
      metric_hour: null
    },
    order: [['metric_date', 'DESC']]
  });
};

module.exports = UsageMetric;
