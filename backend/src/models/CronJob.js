const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const cron = require('node-cron');

const CronJob = sequelize.define('CronJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Scheduling
  cron_expression: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      isCronExpression(value) {
        if (!cron.validate(value)) {
          throw new Error('Invalid cron expression');
        }
      }
    }
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'UTC'
  },
  
  // Job configuration
  job_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['webhook', 'email', 'database_query', 'api_call', 'cleanup', 'akeneo_import', 'plugin_job', 'shopify_sync', 'system_job']]
    }
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },

  // Source tracking - enables unified scheduler
  source_type: {
    type: DataTypes.ENUM('user', 'plugin', 'integration', 'system'),
    defaultValue: 'user',
    allowNull: false,
    comment: 'Source of the cron job: user, plugin, integration, or system'
  },
  source_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Reference ID to the source (plugin_id, akeneo_schedule_id, etc.)'
  },
  source_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Human-readable source name (plugin name, integration name)'
  },
  handler: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Handler method name for plugin/integration jobs'
  },
  
  // Ownership and access
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  
  // Status and control
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_paused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'System jobs cannot be edited/deleted by users'
  },
  
  // Execution tracking
  last_run_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  next_run_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  run_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  failure_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  last_status: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['success', 'failed', 'running', 'skipped']]
    }
  },
  last_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_result: {
    type: DataTypes.JSON,
    allowNull: true
  },
  
  // Limits and controls
  max_runs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1 }
  },
  max_failures: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: { min: 0 }
  },
  consecutive_failures: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  timeout_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 300,
    validate: { min: 1 }
  },
  
  // Metadata
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'cron_jobs',
  hooks: {
    beforeSave: async (cronJob) => {
      // Calculate next run time when cron expression changes
      if (cronJob.changed('cron_expression') || cronJob.changed('timezone') || cronJob.isNewRecord) {
        cronJob.next_run_at = cronJob.calculateNextRun();
      }
    }
  }
});

// Instance methods
CronJob.prototype.calculateNextRun = function() {
  if (!this.is_active || this.is_paused) {
    return null;
  }

  try {
    // Use node-cron to parse the expression and calculate next run
    const now = new Date();
    const cronTime = cron.schedule(this.cron_expression, () => {}, {
      scheduled: false,
      timezone: this.timezone
    });
    
    // Get the next scheduled time
    // Note: node-cron doesn't have a built-in getNextDate method
    // This is a simplified calculation - in production, use a more robust cron library like 'cron-parser'
    const nextRun = new Date(now.getTime() + 60000); // Placeholder: 1 minute from now
    return nextRun;
  } catch (error) {
    console.error('Error calculating next run time:', error);
    return null;
  }
};

CronJob.prototype.canRun = function() {
  if (!this.is_active || this.is_paused) {
    return false;
  }
  
  // Check if max runs reached
  if (this.max_runs && this.run_count >= this.max_runs) {
    return false;
  }
  
  // Check if too many consecutive failures
  if (this.consecutive_failures >= this.max_failures) {
    return false;
  }
  
  return true;
};

CronJob.prototype.recordExecution = async function(status, result = null, error = null) {
  const execution = await this.createExecution({
    status,
    result,
    error_message: error?.message,
    error_stack: error?.stack,
    started_at: new Date(),
    completed_at: status !== 'running' ? new Date() : null
  });
  
  // Update cron job statistics
  const updates = {
    run_count: this.run_count + 1,
    last_run_at: new Date(),
    last_status: status,
    last_result: result,
    last_error: error?.message || null
  };
  
  if (status === 'success') {
    updates.success_count = this.success_count + 1;
    updates.consecutive_failures = 0;
  } else if (status === 'failed') {
    updates.failure_count = this.failure_count + 1;
    updates.consecutive_failures = this.consecutive_failures + 1;
    
    // Auto-pause if too many consecutive failures
    if (updates.consecutive_failures >= this.max_failures) {
      updates.is_paused = true;
    }
  }
  
  // Calculate next run time
  updates.next_run_at = this.calculateNextRun();
  
  await this.update(updates);
  
  return execution;
};

CronJob.prototype.pause = function() {
  return this.update({ 
    is_paused: true, 
    next_run_at: null 
  });
};

CronJob.prototype.resume = function() {
  return this.update({ 
    is_paused: false, 
    next_run_at: this.calculateNextRun(),
    consecutive_failures: 0 // Reset failures on manual resume
  });
};

CronJob.prototype.reset = function() {
  return this.update({
    run_count: 0,
    success_count: 0,
    failure_count: 0,
    consecutive_failures: 0,
    last_run_at: null,
    last_status: null,
    last_error: null,
    last_result: null,
    is_paused: false,
    next_run_at: this.calculateNextRun()
  });
};

// Static methods
CronJob.findDueJobs = function() {
  return this.findAll({
    where: {
      is_active: true,
      is_paused: false,
      next_run_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      }
    },
    order: [['next_run_at', 'ASC']]
  });
};

CronJob.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: {
      user_id: userId,
      ...options.where
    },
    include: options.include || [],
    order: options.order || [['created_at', 'DESC']],
    limit: options.limit
  });
};

CronJob.findByStore = function(storeId, options = {}) {
  return this.findAll({
    where: {
      store_id: storeId,
      ...options.where
    },
    include: options.include || [],
    order: options.order || [['created_at', 'DESC']],
    limit: options.limit
  });
};

/**
 * Find cron jobs by source (plugin, integration, etc.)
 */
CronJob.findBySource = function(sourceType, sourceId = null, options = {}) {
  const where = { source_type: sourceType };
  if (sourceId) {
    where.source_id = sourceId;
  }
  return this.findAll({
    where: {
      ...where,
      ...options.where
    },
    include: options.include || [],
    order: options.order || [['created_at', 'DESC']],
    limit: options.limit
  });
};

/**
 * Find cron job by source name (e.g., plugin slug)
 */
CronJob.findBySourceName = function(sourceName, options = {}) {
  return this.findAll({
    where: {
      source_name: sourceName,
      ...options.where
    },
    include: options.include || [],
    order: options.order || [['created_at', 'DESC']],
    limit: options.limit
  });
};

/**
 * Create or update a cron job from an integration source (Akeneo, Shopify, etc.)
 * This is the main method for unified scheduler integration
 */
CronJob.syncFromIntegration = async function(integrationData) {
  const {
    sourceType,
    sourceId,
    sourceName,
    name,
    description,
    cronExpression,
    timezone = 'UTC',
    jobType,
    configuration,
    handler,
    storeId,
    userId,
    isActive = true,
    metadata = {}
  } = integrationData;

  // Look for existing cron job with same source
  let cronJob = await this.findOne({
    where: {
      source_type: sourceType,
      source_id: sourceId
    }
  });

  const cronData = {
    name,
    description,
    cron_expression: cronExpression,
    timezone,
    job_type: jobType,
    configuration,
    source_type: sourceType,
    source_id: sourceId,
    source_name: sourceName,
    handler,
    store_id: storeId,
    user_id: userId,
    is_active: isActive,
    metadata
  };

  if (cronJob) {
    // Update existing
    await cronJob.update(cronData);
    console.log(`🔄 Updated cron job for ${sourceName}: ${name}`);
  } else {
    // Create new
    cronJob = await this.create(cronData);
    console.log(`✅ Created cron job for ${sourceName}: ${name}`);
  }

  return cronJob;
};

/**
 * Remove all cron jobs for a specific source
 * Used when disabling a plugin or disconnecting an integration
 */
CronJob.removeBySource = async function(sourceType, sourceId) {
  const deleted = await this.destroy({
    where: {
      source_type: sourceType,
      source_id: sourceId
    }
  });
  console.log(`🗑️ Removed ${deleted} cron jobs for ${sourceType}:${sourceId}`);
  return deleted;
};

/**
 * Remove all cron jobs for a source by name
 * Used when uninstalling a plugin by slug
 */
CronJob.removeBySourceName = async function(sourceName) {
  const deleted = await this.destroy({
    where: {
      source_name: sourceName
    }
  });
  console.log(`🗑️ Removed ${deleted} cron jobs for source: ${sourceName}`);
  return deleted;
};

CronJob.getStats = function(userId = null, storeId = null) {
  const where = {};
  if (userId) where.user_id = userId;
  if (storeId) where.store_id = storeId;
  
  return sequelize.query(`
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs,
      COUNT(CASE WHEN is_paused = true THEN 1 END) as paused_jobs,
      COUNT(CASE WHEN last_status = 'success' THEN 1 END) as successful_jobs,
      COUNT(CASE WHEN last_status = 'failed' THEN 1 END) as failed_jobs,
      SUM(run_count) as total_runs,
      SUM(success_count) as total_successes,
      SUM(failure_count) as total_failures,
      job_type,
      COUNT(*) as type_count
    FROM cron_jobs 
    WHERE ${userId ? 'user_id = :userId' : '1=1'} 
      ${storeId ? 'AND store_id = :storeId' : ''}
    GROUP BY job_type
  `, {
    replacements: { userId, storeId },
    type: sequelize.QueryTypes.SELECT
  });
};

// Associations
CronJob.associate = (models) => {
  CronJob.hasMany(models.CronJobExecution, {
    foreignKey: 'cron_job_id',
    as: 'executions',
    onDelete: 'CASCADE'
  });
};

module.exports = CronJob;