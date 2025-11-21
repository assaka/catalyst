const { DataTypes } = require('sequelize');
const { masterSequelize } = require('../database/masterConnection');

// JobHistory model is in MASTER DB (platform-level job history)
const JobHistory = masterSequelize.define('JobHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  job_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('started', 'progress_update', 'completed', 'failed', 'retried', 'cancelled'),
    allowNull: false,
    comment: 'History event type'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Status message or progress description'
  },
  progress: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Progress percentage at this point (0-100)'
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Result data for completed jobs or error details for failed jobs'
  },
  error: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detailed error information including stack trace'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional context data for this history entry'
  },
  executed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this history event occurred'
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in milliseconds for completed operations'
  }
}, {
  tableName: 'job_history',
  timestamps: false, // We use executed_at instead
  indexes: [
    {
      fields: ['job_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['executed_at']
    },
    {
      // Compound index for job timeline queries
      fields: ['job_id', 'executed_at']
    }
  ]
});

// Define associations
JobHistory.associate = function(models) {
  JobHistory.belongsTo(models.Job, {
    foreignKey: 'job_id',
    as: 'job'
  });
};

// Static methods for creating common history entries
JobHistory.recordJobStart = async function(jobId, metadata = {}) {
  return JobHistory.create({
    job_id: jobId,
    status: 'started',
    message: 'Job execution started',
    executed_at: new Date(),
    metadata
  });
};

JobHistory.recordJobProgress = async function(jobId, progress, message, metadata = {}) {
  return JobHistory.create({
    job_id: jobId,
    status: 'progress_update',
    message,
    progress,
    executed_at: new Date(),
    metadata
  });
};

JobHistory.recordJobCompletion = async function(jobId, result, duration, metadata = {}) {
  return JobHistory.create({
    job_id: jobId,
    status: 'completed',
    message: 'Job completed successfully',
    result,
    duration_ms: duration,
    progress: 100,
    executed_at: new Date(),
    metadata
  });
};

JobHistory.recordJobFailure = async function(jobId, error, duration = null, metadata = {}) {
  return JobHistory.create({
    job_id: jobId,
    status: 'failed',
    message: 'Job execution failed',
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details || null
    },
    duration_ms: duration,
    executed_at: new Date(),
    metadata
  });
};

JobHistory.recordJobRetry = async function(jobId, retryCount, nextAttemptAt, metadata = {}) {
  return JobHistory.create({
    job_id: jobId,
    status: 'retried',
    message: `Job scheduled for retry (attempt ${retryCount})`,
    metadata: {
      ...metadata,
      retry_count: retryCount,
      next_attempt_at: nextAttemptAt
    },
    executed_at: new Date()
  });
};

JobHistory.recordJobCancellation = async function(jobId, reason = null, metadata = {}) {
  return JobHistory.create({
    job_id: jobId,
    status: 'cancelled',
    message: reason || 'Job was cancelled',
    executed_at: new Date(),
    metadata
  });
};

// Get timeline for a specific job
JobHistory.getJobTimeline = function(jobId) {
  return JobHistory.findAll({
    where: { job_id: jobId },
    order: [['executed_at', 'ASC']]
  });
};

// Get recent history across all jobs
JobHistory.getRecentActivity = function(limit = 100, storeId = null) {
  const options = {
    include: [{
      model: sequelize.models.Job,
      as: 'job',
      attributes: ['id', 'type', 'store_id', 'user_id']
    }],
    order: [['executed_at', 'DESC']],
    limit
  };

  if (storeId) {
    options.include[0].where = { store_id: storeId };
  }

  return JobHistory.findAll(options);
};

// Cleanup old history records
JobHistory.cleanupOldHistory = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await JobHistory.destroy({
    where: {
      executed_at: { [sequelize.Sequelize.Op.lt]: cutoffDate }
    }
  });
  
  return result;
};

// Get statistics for job history
JobHistory.getStatistics = async function(timeRange = '24h', storeId = null) {
  const since = new Date();
  switch (timeRange) {
    case '1h':
      since.setHours(since.getHours() - 1);
      break;
    case '24h':
      since.setHours(since.getHours() - 24);
      break;
    case '7d':
      since.setDate(since.getDate() - 7);
      break;
    case '30d':
      since.setDate(since.getDate() - 30);
      break;
  }

  const whereClause = { executed_at: { [sequelize.Sequelize.Op.gte]: since } };
  const includeClause = storeId ? [{
    model: sequelize.models.Job,
    as: 'job',
    where: { store_id: storeId },
    attributes: []
  }] : [];

  const [totalEvents, completedEvents, failedEvents, retryEvents] = await Promise.all([
    JobHistory.count({ where: whereClause, include: includeClause }),
    JobHistory.count({ where: { ...whereClause, status: 'completed' }, include: includeClause }),
    JobHistory.count({ where: { ...whereClause, status: 'failed' }, include: includeClause }),
    JobHistory.count({ where: { ...whereClause, status: 'retried' }, include: includeClause })
  ]);

  return {
    total_events: totalEvents,
    completed: completedEvents,
    failed: failedEvents,
    retries: retryEvents,
    time_range: timeRange
  };
};

module.exports = JobHistory;