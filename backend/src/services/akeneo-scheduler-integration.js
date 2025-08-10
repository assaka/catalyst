const jobManager = require('../core/BackgroundJobManager');
const AkeneoSchedule = require('../models/AkeneoSchedule');
const Job = require('../models/Job');

/**
 * Integration service to migrate Akeneo scheduler to use the unified background job system
 */
class AkeneoSchedulerIntegration {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the scheduler integration
   */
  async initialize() {
    if (this.initialized) return;

    // Initialize the job manager
    await jobManager.initialize();

    // Set up periodic check for scheduled Akeneo imports
    this.startScheduleMonitoring();

    this.initialized = true;
    console.log('✅ Akeneo Scheduler Integration initialized');
  }

  /**
   * Convert an AkeneoSchedule to a background job
   */
  async scheduleAkeneoImport(akeneoSchedule) {
    console.log(`🔄 Scheduling Akeneo import: ${akeneoSchedule.import_type} for store ${akeneoSchedule.store_id}`);

    try {
      // Determine job type based on import type
      const jobType = this.getJobTypeFromImportType(akeneoSchedule.import_type);
      
      // Prepare job payload
      const jobPayload = {
        storeId: akeneoSchedule.store_id,
        locale: akeneoSchedule.options?.locale || 'en_US',
        dryRun: akeneoSchedule.options?.dryRun || false,
        filters: akeneoSchedule.filters || {},
        downloadImages: akeneoSchedule.options?.downloadImages !== false,
        batchSize: akeneoSchedule.options?.batchSize || 50,
        customMappings: akeneoSchedule.options?.customMappings || {},
        // Add reference to the original schedule
        scheduleId: akeneoSchedule.id
      };

      // Calculate delay if needed
      const delay = akeneoSchedule.next_run ? 
        Math.max(0, new Date(akeneoSchedule.next_run).getTime() - Date.now()) : 0;

      // Schedule the background job
      const job = await jobManager.scheduleJob({
        type: jobType,
        payload: jobPayload,
        priority: 'normal',
        delay,
        maxRetries: 3,
        storeId: akeneoSchedule.store_id,
        userId: null, // System scheduled job
        metadata: {
          source: 'akeneo_schedule',
          schedule_id: akeneoSchedule.id,
          schedule_type: akeneoSchedule.schedule_type,
          import_type: akeneoSchedule.import_type
        }
      });

      // Update the schedule with the job reference
      await akeneoSchedule.update({
        status: 'scheduled',
        metadata: {
          ...akeneoSchedule.metadata,
          background_job_id: job.id,
          last_scheduled_at: new Date().toISOString()
        }
      });

      console.log(`✅ Scheduled background job ${job.id} for Akeneo schedule ${akeneoSchedule.id}`);
      return job;

    } catch (error) {
      console.error(`❌ Failed to schedule Akeneo import: ${error.message}`);
      
      // Update schedule status to reflect the error
      await akeneoSchedule.update({
        status: 'failed',
        last_result: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });

      throw error;
    }
  }

  /**
   * Monitor active schedules and create background jobs as needed
   */
  startScheduleMonitoring() {
    console.log('🔍 Starting Akeneo schedule monitoring...');

    // Check every 5 minutes for schedules that need to run
    setInterval(async () => {
      try {
        await this.processSchedules();
      } catch (error) {
        console.error('❌ Error in schedule monitoring:', error);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Process all active schedules that are due to run
   */
  async processSchedules() {
    try {
      // Find all active schedules that are due to run
      const dueSchedules = await AkeneoSchedule.findAll({
        where: {
          is_active: true,
          status: ['scheduled', 'completed'], // Include completed for recurring schedules
          next_run: {
            [AkeneoSchedule.sequelize.Sequelize.Op.lte]: new Date()
          }
        }
      });

      console.log(`📅 Found ${dueSchedules.length} schedules due for execution`);

      for (const schedule of dueSchedules) {
        try {
          // Check if there's already a running job for this schedule
          const existingJob = await Job.findOne({
            where: {
              'metadata.schedule_id': schedule.id,
              status: ['pending', 'running']
            }
          });

          if (existingJob) {
            console.log(`⏩ Skipping schedule ${schedule.id} - job ${existingJob.id} already running`);
            continue;
          }

          // Schedule the import job
          await this.scheduleAkeneoImport(schedule);

          // Update next run time for recurring schedules
          if (schedule.schedule_type !== 'once') {
            const nextRun = this.calculateNextRun(schedule);
            await schedule.update({ next_run: nextRun });
          }

        } catch (error) {
          console.error(`❌ Failed to process schedule ${schedule.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error processing schedules:', error);
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
   * Calculate next run time for recurring schedules
   */
  calculateNextRun(schedule) {
    const now = new Date();
    
    switch (schedule.schedule_type) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      
      default:
        return null; // 'once' schedules don't get rescheduled
    }
  }

  /**
   * Migrate existing schedules to use background jobs
   */
  async migrateExistingSchedules() {
    console.log('🔄 Migrating existing Akeneo schedules to background job system...');

    try {
      const activeSchedules = await AkeneoSchedule.findAll({
        where: { is_active: true }
      });

      console.log(`Found ${activeSchedules.length} active schedules to migrate`);

      let migratedCount = 0;
      let errorCount = 0;

      for (const schedule of activeSchedules) {
        try {
          // Check if schedule already has a background job
          if (schedule.metadata?.background_job_id) {
            console.log(`⏩ Schedule ${schedule.id} already has background job ${schedule.metadata.background_job_id}`);
            continue;
          }

          // Schedule the import job
          await this.scheduleAkeneoImport(schedule);
          migratedCount++;

        } catch (error) {
          console.error(`❌ Failed to migrate schedule ${schedule.id}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Migration completed: ${migratedCount} migrated, ${errorCount} errors`);

      return {
        success: true,
        migrated: migratedCount,
        errors: errorCount,
        total: activeSchedules.length
      };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
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