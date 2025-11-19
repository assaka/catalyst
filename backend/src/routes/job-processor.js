const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Import all job handlers
const UILabelsBulkTranslationJob = require('../core/jobs/UILabelsBulkTranslationJob');
const ShopifyImportCollectionsJob = require('../core/jobs/ShopifyImportCollectionsJob');
const ShopifyImportProductsJob = require('../core/jobs/ShopifyImportProductsJob');
const ShopifyImportAllJob = require('../core/jobs/ShopifyImportAllJob');
const AmazonExportProductsJob = require('../core/jobs/AmazonExportProductsJob');
const AmazonSyncInventoryJob = require('../core/jobs/AmazonSyncInventoryJob');
const EbayExportProductsJob = require('../core/jobs/EbayExportProductsJob');
const AkeneoImportCategoriesJob = require('../core/jobs/AkeneoImportCategoriesJob');
const AkeneoImportProductsJob = require('../core/jobs/AkeneoImportProductsJob');
const AkeneoImportAttributesJob = require('../core/jobs/AkeneoImportAttributesJob');
const AkeneoImportFamiliesJob = require('../core/jobs/AkeneoImportFamiliesJob');
const AkeneoImportAllJob = require('../core/jobs/AkeneoImportAllJob');
const PluginInstallJob = require('../core/jobs/PluginInstallJob');
const PluginUninstallJob = require('../core/jobs/PluginUninstallJob');
const PluginUpdateJob = require('../core/jobs/PluginUpdateJob');

// Map job types to their handler classes
const JOB_HANDLERS = {
  'translation:ui-labels:bulk': UILabelsBulkTranslationJob,
  'shopify:import:collections': ShopifyImportCollectionsJob,
  'shopify:import:products': ShopifyImportProductsJob,
  'shopify:import:all': ShopifyImportAllJob,
  'amazon:export:products': AmazonExportProductsJob,
  'amazon:sync:inventory': AmazonSyncInventoryJob,
  'ebay:export:products': EbayExportProductsJob,
  'akeneo:import:categories': AkeneoImportCategoriesJob,
  'akeneo:import:products': AkeneoImportProductsJob,
  'akeneo:import:attributes': AkeneoImportAttributesJob,
  'akeneo:import:families': AkeneoImportFamiliesJob,
  'akeneo:import:all': AkeneoImportAllJob,
  'plugin:install': PluginInstallJob,
  'plugin:uninstall': PluginUninstallJob,
  'plugin:update': PluginUpdateJob,
};

// Middleware to verify cron secret
const verifyCronSecret = (req, res, next) => {
  const cronSecret = req.headers['x-cron-secret'];
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn('⚠️ CRON_SECRET not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (cronSecret !== expectedSecret) {
    console.warn('⚠️ Invalid cron secret provided');
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
};

/**
 * POST /api/jobs/process-pending
 *
 * Processes pending jobs from the queue.
 * Called by cron every minute.
 *
 * Security: Requires X-Cron-Secret header
 */
router.post('/process-pending', verifyCronSecret, async (req, res) => {
  const startTime = Date.now();
  const MAX_RUNTIME = 50000; // 50 seconds max
  const MAX_JOBS = 10; // Process up to 10 jobs per run

  try {
    console.log('🔍 Processing pending jobs...');

    // Get all pending jobs, prioritized
    const pendingJobs = await Job.findAll({
      where: {
        status: 'pending',
        type: Object.keys(JOB_HANDLERS) // Only job types we have handlers for
      },
      order: [
        ['priority', 'ASC'], // High priority first (urgent=1, high=2, normal=5, low=10)
        ['created_at', 'ASC'] // Then oldest first (FIFO)
      ],
      limit: MAX_JOBS
    });

    if (pendingJobs.length === 0) {
      console.log('ℹ️ No pending jobs to process');
      return res.json({
        processed: 0,
        message: 'No pending jobs'
      });
    }

    console.log(`📋 Found ${pendingJobs.length} pending job(s)`);

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    // Process jobs one at a time
    for (const job of pendingJobs) {
      // Check if we're running out of time
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_RUNTIME) {
        console.log(`⏰ Timeout approaching (${elapsed}ms), stopping for this run`);
        skipped = pendingJobs.length - processed - failed;
        break;
      }

      try {
        console.log(`🚀 Processing job ${job.id}: ${job.type}`);

        const HandlerClass = JOB_HANDLERS[job.type];
        if (!HandlerClass) {
          console.error(`❌ No handler for job type: ${job.type}`);
          skipped++;
          continue;
        }

        // Update to running
        await job.update({
          status: 'running',
          started_at: new Date()
        });

        // Execute job
        const handler = new HandlerClass(job);
        const result = await handler.execute();

        // Mark as completed
        await job.update({
          status: 'completed',
          completed_at: new Date(),
          result: result,
          progress: 100
        });

        console.log(`✅ Job ${job.id} completed`);
        processed++;

      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error.message);

        const retryCount = (job.retry_count || 0) + 1;
        const maxRetries = job.max_retries || 3;

        if (retryCount < maxRetries) {
          // Retry later
          await job.update({
            status: 'pending',
            retry_count: retryCount,
            error_message: error.message
          });
          console.log(`   ↻ Will retry (${retryCount}/${maxRetries})`);
          skipped++; // Will be retried, not failed yet
        } else {
          // Failed permanently
          await job.update({
            status: 'failed',
            completed_at: new Date(),
            error_message: error.message,
            retry_count: retryCount
          });
          console.log(`   ✗ Failed permanently`);
          failed++;
        }
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      processed,
      failed,
      skipped,
      duration,
      message: `Processed ${processed} job(s) in ${(duration / 1000).toFixed(2)}s`
    };

    console.log('📊 Summary:', summary);

    res.json(summary);

  } catch (error) {
    console.error('❌ Error processing jobs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/jobs/status
 *
 * Get current job queue status
 * Public endpoint (useful for monitoring)
 */
router.get('/status', async (req, res) => {
  try {
    const [pending, running, completed, failed] = await Promise.all([
      Job.count({ where: { status: 'pending' } }),
      Job.count({ where: { status: 'running' } }),
      Job.count({
        where: {
          status: 'completed',
          completed_at: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      Job.count({
        where: {
          status: 'failed',
          updated_at: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
    ]);

    res.json({
      queue: {
        pending,
        running,
        completed_24h: completed,
        failed_24h: failed
      },
      healthy: pending < 100 && running < 10 // Simple health check
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
