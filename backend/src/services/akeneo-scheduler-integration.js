const jobManager = require('../core/BackgroundJobManager');
const AkeneoSchedule = require('../models/AkeneoSchedule');
const CronJob = require('../models/CronJob');
const Job = require('../models/Job');

/**
 * Akeneo Scheduler Integration
 *
 * This service bridges akeneo_schedules table to the unified cron_jobs system.
 * Instead of running its own scheduler, it syncs Akeneo schedules to cron_jobs
 * and lets the central CronScheduler handle all execution.
 *
 * Flow:
 * 1. User creates/updates an Akeneo schedule via UI
 * 2. This service syncs it to cron_jobs table with source_type='integration'
 * 3. CronScheduler picks it up and executes via DynamicCronJob
 * 4. DynamicCronJob detects job_type='akeneo_import' and runs the appropriate handler
 */
class AkeneoSchedulerIntegration {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the scheduler integration
   * NOTE: No longer starts its own scheduler - uses unified CronScheduler
   */
  async initialize() {
    if (this.initialized) return;

    // Initialize the job manager
    await jobManager.initialize();

    // Sync existing Akeneo schedules to cron_jobs table
    await this.syncAllSchedulesToCronJobs();

    this.initialized = true;
    console.log('✅ Akeneo Scheduler Integration initialized (using unified scheduler)');
  }

  /**
   * Sync all active Akeneo schedules to cron_jobs table
   * Called on initialization to ensure all schedules are in the unified system
   */
  async syncAllSchedulesToCronJobs() {
    try {
      const activeSchedules = await AkeneoSchedule.findAll({
        where: { is_active: true }
      });

      console.log(`🔄 Syncing ${activeSchedules.length} Akeneo schedules to cron_jobs...`);

      for (const schedule of activeSchedules) {
        try {
          await this.syncScheduleToCronJob(schedule);
        } catch (error) {
          console.error(`❌ Failed to sync Akeneo schedule ${schedule.id}:`, error.message);
        }
      }

      console.log('✅ Akeneo schedules synced to cron_jobs');
    } catch (error) {
      console.error('❌ Failed to sync Akeneo schedules:', error.message);
    }
  }

  /**
   * Sync a single Akeneo schedule to cron_jobs table
   * This is the main integration point with the unified scheduler
   */
  async syncScheduleToCronJob(akeneoSchedule) {
    const cronExpression = this.convertScheduleToCron(akeneoSchedule);

    if (!cronExpression) {
      console.warn(`⚠️ Could not convert Akeneo schedule ${akeneoSchedule.id} to cron expression`);
      return null;
    }

    const cronJob = await CronJob.syncFromIntegration({
      sourceType: 'integration',
      sourceId: akeneoSchedule.id,
      sourceName: 'akeneo',
      name: `Akeneo ${akeneoSchedule.import_type} Import`,
      description: `Scheduled ${akeneoSchedule.import_type} import from Akeneo PIM`,
      cronExpression,
      timezone: 'UTC',
      jobType: 'akeneo_import',
      configuration: {
        import_type: akeneoSchedule.import_type,
        akeneo_schedule_id: akeneoSchedule.id,
        store_id: akeneoSchedule.store_id,
        filters: akeneoSchedule.filters || {},
        options: akeneoSchedule.options || {}
      },
      handler: 'executeAkeneoImport',
      storeId: akeneoSchedule.store_id,
      userId: null, // System scheduled job
      isActive: akeneoSchedule.is_active && akeneoSchedule.status !== 'paused',
      metadata: {
        akeneo_schedule_id: akeneoSchedule.id,
        schedule_type: akeneoSchedule.schedule_type,
        credit_cost: akeneoSchedule.credit_cost
      }
    });

    // Update the akeneo_schedule with the cron_job reference
    await akeneoSchedule.update({
      metadata: {
        ...akeneoSchedule.metadata,
        cron_job_id: cronJob.id,
        synced_at: new Date().toISOString()
      }
    });

    return cronJob;
  }

  /**
   * Convert Akeneo schedule settings to a cron expression
   */
  convertScheduleToCron(schedule) {
    const { schedule_type, schedule_time } = schedule;

    // Parse time (format: "HH:MM")
    let hour = 0;
    let minute = 0;
    if (schedule_time) {
      const [h, m] = schedule_time.split(':').map(Number);
      hour = h || 0;
      minute = m || 0;
    }

    switch (schedule_type) {
      case 'once':
        // One-time schedules - set to run at specific time
        // The schedule will be deactivated after first run
        return `${minute} ${hour} * * *`;

      case 'daily':
        return `${minute} ${hour} * * *`;

      case 'weekly':
        // Default to Monday if no day specified
        return `${minute} ${hour} * * 1`;

      case 'monthly':
        // Default to 1st of month
        return `${minute} ${hour} 1 * *`;

      default:
        console.warn(`Unknown schedule_type: ${schedule_type}`);
        return null;
    }
  }

  /**
   * Called when an Akeneo schedule is created or updated
   * Syncs the changes to the cron_jobs table
   */
  async onScheduleCreatedOrUpdated(akeneoSchedule) {
    console.log(`🔄 Syncing Akeneo schedule ${akeneoSchedule.id} to cron_jobs...`);
    return await this.syncScheduleToCronJob(akeneoSchedule);
  }

  /**
   * Called when an Akeneo schedule is deleted
   * Removes the corresponding cron_job
   */
  async onScheduleDeleted(akeneoScheduleId) {
    console.log(`🗑️ Removing cron_job for deleted Akeneo schedule ${akeneoScheduleId}...`);
    return await CronJob.removeBySource('integration', akeneoScheduleId);
  }

  /**
   * Called when an Akeneo schedule is paused/resumed
   */
  async onSchedulePausedOrResumed(akeneoSchedule) {
    const cronJob = await CronJob.findOne({
      where: {
        source_type: 'integration',
        source_id: akeneoSchedule.id
      }
    });

    if (cronJob) {
      const isPaused = akeneoSchedule.status === 'paused' || !akeneoSchedule.is_active;
      await cronJob.update({ is_paused: isPaused });
      console.log(`${isPaused ? '⏸️' : '▶️'} Akeneo schedule ${akeneoSchedule.id} ${isPaused ? 'paused' : 'resumed'}`);
    }

    return cronJob;
  }

  /**
   * Trigger an immediate Akeneo import (manual execution)
   * This creates a background job directly without going through cron_jobs
   */
  async triggerImmediateImport(akeneoSchedule) {
    console.log(`🚀 Triggering immediate Akeneo import: ${akeneoSchedule.import_type} for store ${akeneoSchedule.store_id}`);

    try {
      const jobType = this.getJobTypeFromImportType(akeneoSchedule.import_type);

      const job = await jobManager.scheduleJob({
        type: jobType,
        payload: {
          storeId: akeneoSchedule.store_id,
          locale: akeneoSchedule.options?.locale || 'en_US',
          dryRun: akeneoSchedule.options?.dryRun || false,
          filters: akeneoSchedule.filters || {},
          downloadImages: akeneoSchedule.options?.downloadImages !== false,
          batchSize: akeneoSchedule.options?.batchSize || 50,
          customMappings: akeneoSchedule.options?.customMappings || {},
          scheduleId: akeneoSchedule.id
        },
        priority: 'high', // High priority for manual executions
        delay: 0,
        maxRetries: 3,
        storeId: akeneoSchedule.store_id,
        userId: null,
        metadata: {
          source: 'akeneo_schedule',
          schedule_id: akeneoSchedule.id,
          triggered_by: 'manual',
          import_type: akeneoSchedule.import_type
        }
      });

      console.log(`✅ Triggered immediate import job ${job.id}`);
      return job;

    } catch (error) {
      console.error(`❌ Failed to trigger immediate import: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert import type to background job type
   */
  getJobTypeFromImportType(importType) {
    const typeMapping = {
      'categories': 'akeneo:import:categories',
      'products': 'akeneo:import:products',
      'attributes': 'akeneo:import:attributes',
      'families': 'akeneo:import:families',
      'all': 'akeneo:import:all'
    };

    return typeMapping[importType] || 'akeneo:import:products';
  }

  /**
   * Migrate existing schedules to unified cron_jobs system
   * This is a one-time migration helper
   */
  async migrateExistingSchedules() {
    console.log('🔄 Migrating existing Akeneo schedules to unified cron_jobs system...');
    return await this.syncAllSchedulesToCronJobs();
  }

  /**
   * Get status of Akeneo schedule integration
   */
  async getIntegrationStatus() {
    try {
      const [totalSchedules, activeSchedules, jobCount] = await Promise.all([
        AkeneoSchedule.count(),
        AkeneoSchedule.count({ where: { is_active: true } }),
        Job.count({
          where: {
            type: {
              [Job.sequelize.Sequelize.Op.like]: 'akeneo:import:%'
            }
          }
        })
      ]);

      const runningJobs = await Job.count({
        where: {
          type: {
            [Job.sequelize.Sequelize.Op.like]: 'akeneo:import:%'
          },
          status: 'running'
        }
      });

      return {
        initialized: this.initialized,
        schedules: {
          total: totalSchedules,
          active: activeSchedules
        },
        background_jobs: {
          total: jobCount,
          running: runningJobs
        }
      };

    } catch (error) {
      console.error('❌ Error getting integration status:', error);
      throw error;
    }
  }
}

// Export singleton instance
const akeneoSchedulerIntegration = new AkeneoSchedulerIntegration();
module.exports = akeneoSchedulerIntegration;