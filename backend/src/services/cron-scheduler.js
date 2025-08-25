const CronJob = require('../models/CronJob');
const CronJobExecution = require('../models/CronJobExecution');
const jobManager = require('../core/BackgroundJobManager');
const cron = require('node-cron');

/**
 * Cron Scheduler Service
 * Manages database-driven cron jobs and schedules them with the BackgroundJobManager
 */
class CronScheduler {
  constructor() {
    this.scheduledJobs = new Map(); // Track scheduled jobs
    this.isRunning = false;
    this.checkInterval = 60000; // Check for due jobs every minute
    this.checkTimer = null;
  }

  /**
   * Start the cron scheduler
   */
  async start() {
    if (this.isRunning) {
      console.log('ℹ️ Cron scheduler is already running');
      return;
    }

    console.log('🕒 Starting cron scheduler...');
    this.isRunning = true;

    // Schedule the job checker to run every minute
    this.checkTimer = setInterval(async () => {
      await this.checkAndScheduleDueJobs();
    }, this.checkInterval);

    // Do an initial check
    await this.checkAndScheduleDueJobs();

    console.log('✅ Cron scheduler started');
  }

  /**
   * Stop the cron scheduler
   */
  stop() {
    if (!this.isRunning) return;

    console.log('⏹️ Stopping cron scheduler...');
    this.isRunning = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    console.log('✅ Cron scheduler stopped');
  }

  /**
   * Check for due jobs and schedule them
   */
  async checkAndScheduleDueJobs() {
    try {
      const dueJobs = await CronJob.findDueJobs();
      
      if (dueJobs.length > 0) {
        console.log(`📅 Found ${dueJobs.length} due cron jobs`);
        
        for (const cronJob of dueJobs) {
          await this.scheduleCronJob(cronJob);
        }
      }
    } catch (error) {
      console.error('❌ Error checking due jobs:', error.message);
    }
  }

  /**
   * Schedule a single cron job
   */
  async scheduleCronJob(cronJob) {
    try {
      console.log(`⏰ Scheduling cron job: ${cronJob.name} (${cronJob.job_type})`);

      // Schedule the job with the background job manager
      const job = await jobManager.scheduleJob({
        type: 'system:dynamic_cron',
        payload: {
          cronJobId: cronJob.id
        },
        priority: 'normal',
        delay: 0, // Execute immediately since it's due
        maxRetries: 1, // Don't retry dynamic jobs automatically
        storeId: cronJob.store_id,
        userId: cronJob.user_id,
        metadata: {
          cronJobName: cronJob.name,
          cronJobType: cronJob.job_type
        }
      });

      // Update the cron job's next run time
      await cronJob.update({
        next_run_at: this.calculateNextRun(cronJob.cron_expression, cronJob.timezone)
      });

      console.log(`✅ Scheduled cron job: ${cronJob.name} -> Job ID: ${job.id}`);

    } catch (error) {
      console.error(`❌ Failed to schedule cron job ${cronJob.name}:`, error.message);
      
      // Mark the job as failed
      await cronJob.recordExecution('failed', null, error);
    }
  }

  /**
   * Calculate the next run time for a cron expression
   */
  calculateNextRun(cronExpression, timezone = 'UTC') {
    try {
      // This is a simplified implementation
      // In production, use a library like 'cron-parser' for accurate calculations
      
      if (!cron.validate(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // For now, we'll use a basic approximation
      // Parse common patterns
      const parts = cronExpression.split(' ');
      if (parts.length !== 5) {
        throw new Error('Cron expression must have 5 parts');
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      const now = new Date();

      // Simple calculation for common patterns
      if (cronExpression === '0 0 * * *') {
        // Daily at midnight
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      } else if (cronExpression === '0 * * * *') {
        // Every hour
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        return nextHour;
      } else if (cronExpression === '*/5 * * * *') {
        // Every 5 minutes
        const nextRun = new Date(now);
        const currentMinute = nextRun.getMinutes();
        const nextMinute = Math.ceil(currentMinute / 5) * 5;
        nextRun.setMinutes(nextMinute, 0, 0);
        return nextRun;
      } else {
        // Default: add 1 hour for unknown patterns
        const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        return nextRun;
      }

    } catch (error) {
      console.error('Error calculating next run time:', error);
      // Fallback: 1 hour from now
      return new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  /**
   * Create a new cron job
   */
  async createCronJob(jobData) {
    const {
      name,
      description,
      cron_expression,
      timezone = 'UTC',
      job_type,
      configuration,
      user_id,
      store_id = null,
      tags = '',
      metadata = {},
      max_runs = null,
      max_failures = 5,
      timeout_seconds = 300
    } = jobData;

    // Validate cron expression
    if (!cron.validate(cron_expression)) {
      throw new Error('Invalid cron expression');
    }

    // Calculate initial next run time
    const next_run_at = this.calculateNextRun(cron_expression, timezone);

    const cronJob = await CronJob.create({
      name,
      description,
      cron_expression,
      timezone,
      job_type,
      configuration,
      user_id,
      store_id,
      tags,
      metadata,
      max_runs,
      max_failures,
      timeout_seconds,
      next_run_at,
      is_active: true,
      is_paused: false
    });

    console.log(`✅ Created cron job: ${name} (next run: ${next_run_at})`);
    return cronJob;
  }

  /**
   * Update a cron job
   */
  async updateCronJob(cronJobId, updates) {
    const cronJob = await CronJob.findByPk(cronJobId);
    if (!cronJob) {
      throw new Error('Cron job not found');
    }

    // If cron expression changed, recalculate next run time
    if (updates.cron_expression || updates.timezone) {
      updates.next_run_at = this.calculateNextRun(
        updates.cron_expression || cronJob.cron_expression,
        updates.timezone || cronJob.timezone
      );
    }

    await cronJob.update(updates);
    console.log(`✅ Updated cron job: ${cronJob.name}`);
    return cronJob;
  }

  /**
   * Delete a cron job
   */
  async deleteCronJob(cronJobId) {
    const cronJob = await CronJob.findByPk(cronJobId);
    if (!cronJob) {
      throw new Error('Cron job not found');
    }

    await cronJob.destroy();
    console.log(`✅ Deleted cron job: ${cronJob.name}`);
    return true;
  }

  /**
   * Pause a cron job
   */
  async pauseCronJob(cronJobId) {
    const cronJob = await CronJob.findByPk(cronJobId);
    if (!cronJob) {
      throw new Error('Cron job not found');
    }

    await cronJob.pause();
    console.log(`⏸️ Paused cron job: ${cronJob.name}`);
    return cronJob;
  }

  /**
   * Resume a cron job
   */
  async resumeCronJob(cronJobId) {
    const cronJob = await CronJob.findByPk(cronJobId);
    if (!cronJob) {
      throw new Error('Cron job not found');
    }

    await cronJob.resume();
    console.log(`▶️ Resumed cron job: ${cronJob.name}`);
    return cronJob;
  }

  /**
   * Execute a cron job manually
   */
  async executeCronJobManually(cronJobId, userId = null) {
    const cronJob = await CronJob.findByPk(cronJobId);
    if (!cronJob) {
      throw new Error('Cron job not found');
    }

    console.log(`🔄 Manually executing cron job: ${cronJob.name}`);

    const job = await jobManager.scheduleJob({
      type: 'system:dynamic_cron',
      payload: {
        cronJobId: cronJob.id
      },
      priority: 'high', // High priority for manual executions
      delay: 0,
      maxRetries: 0,
      storeId: cronJob.store_id,
      userId: cronJob.user_id,
      metadata: {
        cronJobName: cronJob.name,
        cronJobType: cronJob.job_type,
        triggeredBy: 'manual',
        triggeredByUser: userId
      }
    });

    console.log(`✅ Manually scheduled cron job: ${cronJob.name} -> Job ID: ${job.id}`);
    return job;
  }

  /**
   * Get cron job statistics
   */
  async getStats(userId = null, storeId = null) {
    const stats = await CronJob.getStats(userId, storeId);
    
    return {
      summary: stats[0] || {
        total_jobs: 0,
        active_jobs: 0,
        paused_jobs: 0,
        successful_jobs: 0,
        failed_jobs: 0,
        total_runs: 0,
        total_successes: 0,
        total_failures: 0
      },
      by_type: stats.filter(s => s.job_type)
    };
  }

  /**
   * Cleanup old execution records
   */
  async cleanupExecutions(olderThanDays = 90) {
    const deletedCount = await CronJobExecution.cleanup(olderThanDays);
    console.log(`🧹 Cleaned up ${deletedCount} old cron job executions`);
    return deletedCount;
  }
}

// Export singleton instance
const cronScheduler = new CronScheduler();
module.exports = cronScheduler;