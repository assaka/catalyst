const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CronJobExecution = sequelize.define('CronJobExecution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cron_job_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'cron_jobs',
      key: 'id'
    }
  },
  
  // Execution details
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['running', 'success', 'failed', 'timeout']]
    }
  },
  
  // Results and errors
  result: {
    type: DataTypes.JSON,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  error_stack: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Context
  triggered_by: {
    type: DataTypes.STRING(50),
    defaultValue: 'scheduler',
    validate: {
      isIn: [['scheduler', 'manual', 'api']]
    }
  },
  triggered_by_user: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  server_instance: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Performance metrics
  memory_usage_mb: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: { min: 0 }
  },
  cpu_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0 }
  },
  
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'cron_job_executions',
  updatedAt: false, // Only track creation time for executions
  hooks: {
    beforeUpdate: (execution) => {
      // Calculate duration when status changes to completed
      if (execution.changed('completed_at') && execution.completed_at && execution.started_at) {
        const duration = execution.completed_at.getTime() - execution.started_at.getTime();
        execution.duration_ms = duration;
      }
    }
  }
});

// Instance methods
CronJobExecution.prototype.complete = function(status, result = null, error = null) {
  const completed_at = new Date();
  const duration_ms = completed_at.getTime() - this.started_at.getTime();
  
  return this.update({
    status,
    completed_at,
    duration_ms,
    result,
    error_message: error?.message || null,
    error_stack: error?.stack || null
  });
};

// Static methods
CronJobExecution.getRecentExecutions = function(cronJobId, limit = 10) {
  return this.findAll({
    where: { cron_job_id: cronJobId },
    order: [['started_at', 'DESC']],
    limit
  });
};

CronJobExecution.cleanup = function(olderThanDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  return this.destroy({
    where: {
      started_at: {
        [sequelize.Sequelize.Op.lt]: cutoffDate
      },
      status: {
        [sequelize.Sequelize.Op.ne]: 'running'
      }
    }
  });
};

// Associations
CronJobExecution.associate = (models) => {
  CronJobExecution.belongsTo(models.CronJob, {
    foreignKey: 'cron_job_id',
    as: 'cronJob'
  });
};

module.exports = CronJobExecution;