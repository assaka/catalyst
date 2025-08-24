const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AIGenerationLog = sequelize.define('AIGenerationLog', {
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
  customization_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'hybrid_customizations',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // AI request details
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  element_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  context_data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // AI response
  generated_code: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Usage tracking
  tokens_used: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  processing_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  model_version: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  // Timestamps
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ai_generation_logs',
  timestamps: false, // We only use created_at
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['customization_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['success']
    },
    {
      fields: ['element_type']
    }
  ]
});

// Define associations
AIGenerationLog.associate = (models) => {
  AIGenerationLog.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  AIGenerationLog.belongsTo(models.HybridCustomization, {
    foreignKey: 'customization_id',
    as: 'customization'
  });
};

// Static methods
AIGenerationLog.logGeneration = async function({
  userId,
  customizationId = null,
  prompt,
  elementType = null,
  contextData = {},
  generatedCode = null,
  explanation = null,
  success = true,
  errorMessage = null,
  tokensUsed = null,
  processingTimeMs = null,
  modelVersion = 'claude-3'
}) {
  return this.create({
    user_id: userId,
    customization_id: customizationId,
    prompt,
    element_type: elementType,
    context_data: contextData,
    generated_code: generatedCode,
    explanation,
    success,
    error_message: errorMessage,
    tokens_used: tokensUsed,
    processing_time_ms: processingTimeMs,
    model_version: modelVersion
  });
};

AIGenerationLog.getUsageStats = async function(userId, timeframe = '30d') {
  const timeframeDays = parseInt(timeframe.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframeDays);
  
  const whereClause = {
    user_id: userId,
    created_at: {
      [sequelize.Op.gte]: startDate
    }
  };
  
  const [
    totalGenerations,
    successfulGenerations,
    totalTokens,
    averageProcessingTime
  ] = await Promise.all([
    this.count({ where: whereClause }),
    this.count({ where: { ...whereClause, success: true } }),
    this.sum('tokens_used', { where: { ...whereClause, tokens_used: { [sequelize.Op.ne]: null } } }),
    this.findAll({
      where: { ...whereClause, processing_time_ms: { [sequelize.Op.ne]: null } },
      attributes: [[sequelize.fn('AVG', sequelize.col('processing_time_ms')), 'avg_time']]
    })
  ]);
  
  const successRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 0;
  const avgProcessingTime = averageProcessingTime[0]?.dataValues?.avg_time || 0;
  
  return {
    totalGenerations,
    successfulGenerations,
    successRate: Math.round(successRate * 100) / 100,
    totalTokens: totalTokens || 0,
    averageProcessingTime: Math.round(avgProcessingTime),
    timeframe
  };
};

AIGenerationLog.getPopularElements = async function(userId = null, limit = 10) {
  const whereClause = userId ? { user_id: userId, success: true } : { success: true };
  
  return this.findAll({
    where: {
      ...whereClause,
      element_type: { [sequelize.Op.ne]: null }
    },
    attributes: [
      'element_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['element_type'],
    order: [[sequelize.literal('count'), 'DESC']],
    limit,
    raw: true
  });
};

AIGenerationLog.getRecentGenerations = function(userId, limit = 20) {
  return this.findAll({
    where: { user_id: userId },
    include: [
      {
        model: this.sequelize.models.HybridCustomization,
        as: 'customization',
        attributes: ['id', 'name', 'component_type'],
        required: false
      }
    ],
    order: [['created_at', 'DESC']],
    limit
  });
};

AIGenerationLog.getFailedGenerations = function(userId, limit = 10) {
  return this.findAll({
    where: {
      user_id: userId,
      success: false
    },
    order: [['created_at', 'DESC']],
    limit
  });
};

// Get generation activity by day for charts
AIGenerationLog.getActivityByDay = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.findAll({
    where: {
      user_id: userId,
      created_at: {
        [sequelize.Op.gte]: startDate
      }
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN success THEN 1 ELSE 0 END')), 'successful']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    raw: true
  });
};

module.exports = AIGenerationLog;