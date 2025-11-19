#!/usr/bin/env node

/**
 * Process Pending Translation Jobs (Cron Script)
 *
 * This script runs every minute via Render cron to process pending UI label translation jobs.
 * Since we notify users via email when complete, no real-time progress updates are needed.
 *
 * Benefits:
 * - Much cheaper than 24/7 worker ($0.82/mo vs $7/mo)
 * - Processes jobs within 0-60 seconds (acceptable for batch operations)
 * - Simple, focused script
 *
 * Usage:
 * - Scheduled via Render cron: "* * * * *" (every minute)
 * - Exits after processing one batch
 */

require('dotenv').config();
const { sequelize } = require('../src/database/connection');
const Job = require('../src/models/Job');
const UILabelsBulkTranslationJob = require('../src/core/jobs/UILabelsBulkTranslationJob');

const MAX_RUNTIME = 50000; // 50 seconds (leave buffer before cron timeout)
const BATCH_SIZE = 1; // Process one translation job at a time

async function processTranslationJobs() {
  console.log('🔍 Checking for pending translation jobs...');
  const startTime = Date.now();

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Find pending translation jobs
    const pendingJobs = await Job.findAll({
      where: {
        type: 'translation:ui-labels:bulk',
        status: 'pending'
      },
      order: [['created_at', 'ASC']], // FIFO
      limit: BATCH_SIZE
    });

    if (pendingJobs.length === 0) {
      console.log('ℹ️ No pending translation jobs found');
      return { processed: 0, message: 'No jobs to process' };
    }

    console.log(`📋 Found ${pendingJobs.length} pending translation job(s)`);

    let processedCount = 0;

    for (const job of pendingJobs) {
      // Check if we're running out of time
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_RUNTIME) {
        console.log(`⏰ Approaching timeout (${elapsed}ms), stopping for this run`);
        break;
      }

      try {
        console.log(`🚀 Processing job ${job.id}: ${job.payload.fromLang} → ${job.payload.toLang}`);

        // Update status to running
        await job.update({
          status: 'running',
          started_at: new Date()
        });

        // Create handler and execute
        const handler = new UILabelsBulkTranslationJob(job);
        const result = await handler.execute();

        // Update status to completed
        await job.update({
          status: 'completed',
          completed_at: new Date(),
          result: result,
          progress: 100
        });

        console.log(`✅ Job ${job.id} completed successfully`);
        console.log(`   - Total: ${result.total}`);
        console.log(`   - Translated: ${result.translated}`);
        console.log(`   - Skipped: ${result.skipped}`);
        console.log(`   - Failed: ${result.failed}`);

        processedCount++;

      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);

        // Increment retry count
        const retryCount = (job.retry_count || 0) + 1;
        const maxRetries = job.max_retries || 3;

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
      message: `Processed ${processedCount} translation job(s)`
    };

  } catch (error) {
    console.error('❌ Error processing translation jobs:', error);
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
    const result = await processTranslationJobs();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
})();
