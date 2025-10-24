const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ApiUsageLog = sequelize.define('ApiUsageLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  query_params: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  response_size_bytes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  api_key_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  error_stack: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'api_usage_logs',
  timestamps: true,
  updatedAt: false, // Logs don't get updated
  indexes: [
    { fields: ['store_id'] },
    { fields: ['created_at'] },
    { fields: ['endpoint'] },
    { fields: ['status_code'] }
  ]
});

// Static methods
ApiUsageLog.logRequest = async function(req, res, responseTime) {
  try {
    await this.create({
      store_id: req.storeId || null,
      endpoint: req.route ? req.route.path : req.path,
      method: req.method,
      path: req.originalUrl || req.url,
      query_params: req.query,
      status_code: res.statusCode,
      response_time_ms: responseTime,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      user_id: req.user?.id || null
    });
  } catch (error) {
    // Don't throw - logging shouldn't break the app
    console.error('Failed to log API usage:', error);
  }
};

ApiUsageLog.logError = async function(req, error) {
  try {
    await this.create({
      store_id: req.storeId || null,
      endpoint: req.route ? req.route.path : req.path,
      method: req.method,
      path: req.originalUrl || req.url,
      query_params: req.query,
      status_code: error.statusCode || 500,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      user_id: req.user?.id || null,
      error_message: error.message,
      error_stack: error.stack
    });
  } catch (logError) {
    console.error('Failed to log API error:', logError);
  }
};

module.exports = ApiUsageLog;
