const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../database/masterConnection');

// Job model is in MASTER DB (platform-level job queue)
const Job = masterSequelize.define('Job', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Job type identifier (e.g., akeneo:import:products, plugin:install)'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  payload: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Job-specific data and parameters'
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Job execution result data'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the job should be executed'
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the job execution started'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the job execution completed successfully'
  },
  failed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the job execution failed permanently'
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the job was cancelled'
  },
  max_retries: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false,
    comment: 'Maximum number of retry attempts'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Current retry attempt count'
  },
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Last error message'
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    },
    comment: 'Associated store ID'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who initiated the job'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional metadata for tracking and monitoring'
  },
  progress: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: true,
    comment: 'Job progress percentage (0-100)'
  },
  progress_message: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Current progress description'
  }
}, {
  tableName: 'jobs',
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['scheduled_at']
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    },
    {
      // Compound index for job processing queue
      fields: ['status', 'priority', 'scheduled_at']
    }
  ]
});

// Instance methods
Job.prototype.updateProgress = async function(progress, message = null) {
  const updateData = { progress };
  if (message) updateData.progress_message = message;
  
  await this.update(updateData);
};

Job.prototype.markAsStarted = async function() {
  await this.update({
    status: 'running',
    started_at: new Date()
  });
};

Job.prototype.markAsCompleted = async function(result = null) {
  const updateData = {
    status: 'completed',
    completed_at: new Date(),
    progress: 100
  };
  
  if (result) updateData.result = result;
  
  await this.update(updateData);
};

Job.prototype.markAsFailed = async function(error, canRetry = false) {
  const updateData = {
    last_error: error.message || error
  };

  if (canRetry && this.retry_count < this.max_retries) {
    updateData.status = 'pending';
    updateData.retry_count = this.retry_count + 1;
    // Schedule retry with exponential backoff
    const retryDelays = [5000, 30000, 300000, 1800000]; // 5s, 30s, 5m, 30m
    const delayIndex = Math.min(this.retry_count, retryDelays.length - 1);
    updateData.scheduled_at = new Date(Date.now() + retryDelays[delayIndex]);
  } else {
    updateData.status = 'failed';
    updateData.failed_at = new Date();
  }

  await this.update(updateData);
};

Job.prototype.cancel = async function() {
  if (this.status === 'running') {
    throw new Error('Cannot cancel a running job');
  }

  await this.update({
    status: 'cancelled',
    cancelled_at: new Date()
  });
};

// Static methods
Job.getQueue = function(limit = 10) {
  return Job.findAll({
    where: {
      status: 'pending',
      scheduled_at: { [sequelize.Sequelize.Op.lte]: new Date() }
    },
    order: [
      ['priority', 'DESC'],
      ['scheduled_at', 'ASC'],
      ['created_at', 'ASC']
    ],
    limit
  });
};

Job.getRunningJobs = function() {
  return Job.findAll({
    where: { status: 'running' },
    order: [['started_at', 'ASC']]
  });
};

Job.getJobsByType = function(type, limit = 50) {
  return Job.findAll({
    where: { type },
    order: [['created_at', 'DESC']],
    limit
  });
};

Job.getJobsByStore = function(storeId, limit = 50) {
  return Job.findAll({
    where: { store_id: storeId },
    order: [['created_at', 'DESC']],
    limit
  });
};

Job.cleanupOldJobs = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await Job.destroy({
    where: {
      status: ['completed', 'failed', 'cancelled'],
      [sequelize.Sequelize.Op.or]: [
        { completed_at: { [sequelize.Sequelize.Op.lt]: cutoffDate } },
        { failed_at: { [sequelize.Sequelize.Op.lt]: cutoffDate } },
        { cancelled_at: { [sequelize.Sequelize.Op.lt]: cutoffDate } }
      ]
    }
  });
  
  return result;
};

module.exports = Job;