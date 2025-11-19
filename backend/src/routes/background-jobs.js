const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const jobManager = require('../core/BackgroundJobManager');
const Job = require('../models/Job');
const JobHistory = require('../models/JobHistory');

// Apply authentication to all job routes
router.use(authMiddleware);

/**
 * Get job queue status and statistics
 * GET /api/background-jobs/status
 */
router.get('/status', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const [stats, runningJobs, pendingCount] = await Promise.all([
      jobManager.getStatistics(timeRange),
      Job.getRunningJobs(),
      Job.count({ where: { status: 'pending' } })
    ]);

    res.json({
      success: true,
      status: {
        is_running: jobManager.isRunning,
        is_initialized: jobManager.initialized,
        currently_processing: jobManager.processing.size,
        max_concurrent_jobs: jobManager.maxConcurrentJobs,
        poll_interval: jobManager.pollInterval
      },
      statistics: stats,
      queue: {
        pending: pendingCount,
        running: runningJobs.length
      },
      running_jobs: runningJobs.map(job => ({
        id: job.id,
        type: job.type,
        progress: job.progress,
        started_at: job.started_at,
        store_id: job.store_id
      }))
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

/**
 * Schedule a new background job
 * POST /api/background-jobs/schedule
 */
router.post('/schedule', async (req, res) => {
  try {
    const {
      type,
      payload = {},
      priority = 'normal',
      delay = 0,
      maxRetries = 3,
      storeId,
      metadata = {}
    } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Job type is required'
      });
    }

    // Verify store access if storeId is provided
    if (storeId) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, storeId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this store'
        });
      }
    }

    const job = await jobManager.scheduleJob({
      type,
      payload,
      priority,
      delay,
      maxRetries,
      storeId,
      userId: req.user.id,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Job scheduled successfully',
      job: {
        id: job.id,
        type: job.type,
        priority: job.priority,
        status: job.status,
        scheduled_at: job.scheduled_at,
        store_id: job.store_id
      }
    });
  } catch (error) {
    console.error('Error scheduling job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule job',
      error: error.message
    });
  }
});

/**
 * Get job status (lightweight for polling)
 * GET /api/background-jobs/:jobId/status
 */
router.get('/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobStatus = await jobManager.getJobStatus(jobId);

    if (!jobStatus) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check store access if job has a store_id
    if (jobStatus.store_id) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, jobStatus.store_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this job'
        });
      }
    }

    res.json({
      success: true,
      job: jobStatus
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

/**
 * Get job details with history
 * GET /api/background-jobs/:jobId
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check store access if job has a store_id
    if (job.store_id) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, job.store_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this job'
        });
      }
    }

    const jobDetails = await jobManager.getJobDetails(jobId);

    res.json({
      success: true,
      job: jobDetails
    });
  } catch (error) {
    console.error('Error getting job details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job details',
      error: error.message
    });
  }
});

/**
 * Cancel a job
 * POST /api/background-jobs/:jobId/cancel
 */
router.post('/:jobId/cancel', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check store access if job has a store_id
    if (job.store_id) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, job.store_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this job'
        });
      }
    }

    const cancelledJob = await jobManager.cancelJob(jobId);
    
    res.json({
      success: true,
      message: 'Job cancelled successfully',
      job: {
        id: cancelledJob.id,
        status: cancelledJob.status,
        cancelled_at: cancelledJob.cancelled_at
      }
    });
  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: error.message
    });
  }
});

/**
 * Get jobs for a specific store
 * GET /api/background-jobs/store/:storeId
 */
router.get('/store/:storeId', checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 50, status, type } = req.query;

    const whereClause = { store_id: storeId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const jobs = await Job.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      attributes: [
        'id', 'type', 'priority', 'status', 'progress', 'progress_message',
        'scheduled_at', 'started_at', 'completed_at', 'failed_at', 'cancelled_at',
        'retry_count', 'max_retries', 'last_error', 'created_at', 'updated_at'
      ]
    });

    res.json({
      success: true,
      jobs: jobs,
      count: jobs.length
    });
  } catch (error) {
    console.error('Error getting store jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get store jobs',
      error: error.message
    });
  }
});

/**
 * Get job history timeline
 * GET /api/background-jobs/:jobId/history
 */
router.get('/:jobId/history', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check store access if job has a store_id
    if (job.store_id) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, job.store_id);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this job'
        });
      }
    }

    const history = await JobHistory.getJobTimeline(jobId);
    
    res.json({
      success: true,
      job_id: jobId,
      history: history
    });
  } catch (error) {
    console.error('Error getting job history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job history',
      error: error.message
    });
  }
});

/**
 * Get recent job activity
 * GET /api/background-jobs/activity/recent
 */
router.get('/activity/recent', async (req, res) => {
  try {
    const { limit = 100, storeId } = req.query;

    // If storeId provided, check access
    if (storeId) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, storeId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this store'
        });
      }
    }

    const activity = await JobHistory.getRecentActivity(parseInt(limit), storeId);
    
    res.json({
      success: true,
      activity: activity,
      count: activity.length
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent activity',
      error: error.message
    });
  }
});

/**
 * Get job statistics
 * GET /api/background-jobs/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = '24h', storeId } = req.query;

    // If storeId provided, check access
    if (storeId) {
      const hasAccess = await checkStoreOwnership(req, res, () => {}, storeId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this store'
        });
      }
    }

    const stats = await JobHistory.getStatistics(timeRange, storeId);
    
    res.json({
      success: true,
      statistics: stats,
      time_range: timeRange,
      store_id: storeId || null
    });
  } catch (error) {
    console.error('Error getting job statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job statistics',
      error: error.message
    });
  }
});

module.exports = router;