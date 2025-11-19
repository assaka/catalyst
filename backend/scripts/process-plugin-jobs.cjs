#!/usr/bin/env node

/**
 * Process Plugin Management Jobs (Cron Script)
 *
 * Processes pending plugin-related jobs:
 * - Plugin installations
 * - Plugin uninstalls
 * - Plugin updates
 *
 * Runs every 2 minutes via Render cron.
 * Users receive email notifications when jobs complete.
 *
 * Usage:
 * - Scheduled via Render cron: "*/2 * * * *" (every 2 minutes)
 */

require('dotenv').config();
const { sequelize } = require('../src/database/connection');
const Job = require('../src/models/Job');

// Import job handlers
const PluginInstallJob = require('../src/core/jobs/PluginInstallJob');
const PluginUninstallJob = require('../src/core/jobs/PluginUninstallJob');
const PluginUpdateJob = require('../src/core/jobs/PluginUpdateJob');

const MAX_RUNTIME = 110000; // 110 seconds (1m50s) - leave buffer for 2-minute cron
const MAX_JOBS_PER_RUN = 3; // Process up to 3 plugin jobs per run

// Map job types to their handler classes
const JOB_HANDLERS = {
  'plugin:install': PluginInstallJob,
  'plugin:uninstall': PluginUninstallJob,
  'plugin:update': PluginUpdateJob,
};

async function processPluginJobs() {
  console.log('🔍 Checking for pending plugin jobs...');
  const startTime = Date.now();

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get job types we can process
    const jobTypes = Object.keys(JOB_HANDLERS);

    // Find pending jobs
    const pendingJobs = await Job.findAll({
      where: {
        type: jobTypes,
        status: 'pending'
      },
      order: [
        ['priority', 'ASC'], // High priority first
        ['created_at', 'ASC'] // Then oldest first (FIFO)
      ],
      limit: MAX_JOBS_PER_RUN
    });

    if (pendingJobs.length === 0) {
      console.log('ℹ️ No pending plugin jobs found');
      return { processed: 0, message: 'No jobs to process' };
    }

    console.log(`📋 Found ${pendingJobs.length} pending plugin job(s)`);

    let processedCount = 0;

    for (const job of pendingJobs) {
      // Check if we're running out of time
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_RUNTIME) {
        console.log(`⏰ Approaching timeout (${elapsed}ms), stopping for this run`);
        console.log(`   ${pendingJobs.length - processedCount} job(s) remaining for next run`);
        break;
      }

      try {
        const pluginName = job.payload?.pluginName || 'unknown';
        console.log(`\n🔌 Processing job ${job.id}: ${job.type}`);
        console.log(`   Plugin: ${pluginName}, Store: ${job.store_id}`);

        // Get the handler class for this job type
        const HandlerClass = JOB_HANDLERS[job.type];

        // Update status to running
        await job.update({
          status: 'running',
          started_at: new Date()
        });

        // Create handler and execute
        const handler = new HandlerClass(job);
        const result = await handler.execute();

        // Update status to completed
        await job.update({
          status: 'completed',
          completed_at: new Date(),
          result: result,
          progress: 100
        });

        console.log(`✅ Job ${job.id} completed successfully`);
        if (result?.success) {
          console.log(`   Plugin ${pluginName} ${job.type.split(':')[1]}ed successfully`);
        }

        processedCount++;

      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);

        // Increment retry count
        const retryCount = (job.retry_count || 0) + 1;
        const maxRetries = job.max_retries || 2; // Less retries for plugins

        if (retryCount < maxRetries) {
          // Mark for retry
          await job.update({
            status: 'pending',
            retry_count: retryCount,
            error_message: error.message
          });
          console.log(`   ↻ Job ${job.id} will be retried (attempt ${retryCount}/${maxRetries})`);
        } else {
          // Max retries reached, mark as failed
          await job.update({
            status: 'failed',
            completed_at: new Date(),
            error_message: error.message,
            retry_count: retryCount
          });
          console.log(`   ✗ Job ${job.id} failed permanently after ${retryCount} attempts`);
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n📊 Summary:`);
    console.log(`   - Processed: ${processedCount} job(s)`);
    console.log(`   - Duration: ${(totalTime / 1000).toFixed(2)}s`);

    return {
      processed: processedCount,
      duration: totalTime,
      message: `Processed ${processedCount} plugin job(s)`
    };

  } catch (error) {
    console.error('❌ Error processing plugin jobs:', error);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
(async () => {
  try {
    const result = await processPluginJobs();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
})();
