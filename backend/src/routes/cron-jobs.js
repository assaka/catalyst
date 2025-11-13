const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { sequelize } = require('../database/connection');
const CronJob = require('../models/CronJob');
const CronJobType = require('../models/CronJobType');
const CronJobExecution = require('../models/CronJobExecution');
const cronScheduler = require('../services/cron-scheduler');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/cron-jobs/types
 * Get available cron job types
 */
router.get('/types', async (req, res) => {
  try {
    const jobTypes = await CronJobType.getEnabledTypes();

    res.json({
      success: true,
      data: jobTypes
    });
  } catch (error) {
    console.error('Error fetching cron job types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job types'
    });
  }
});

/**
 * GET /api/cron-jobs/stats
 * Get cron job statistics for the user
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await cronScheduler.getStats(req.user.id, req.user.store_id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching cron job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * GET /api/cron-jobs
 * List user's cron jobs with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      job_type,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { user_id: req.user.id };

    // Add filters
    if (status) {
      if (status === 'active') {
        where.is_active = true;
        where.is_paused = false;
      } else if (status === 'paused') {
        where.is_paused = true;
      } else if (status === 'inactive') {
        where.is_active = false;
      }
    }

    if (job_type) {
      where.job_type = job_type;
    }

    if (search) {
      where[sequelize.Sequelize.Op.or] = [
        { name: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: cronJobs } = await CronJob.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort_by, sort_order.toUpperCase()]]
      // Note: Removed include with limit to avoid complex UNION queries
      // Frontend can fetch executions separately if needed
    });

    res.json({
      success: true,
      data: {
        cron_jobs: cronJobs,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cron jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cron jobs'
    });
  }
});

/**
 * POST /api/cron-jobs
 * Create a new cron job
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      cron_expression,
      timezone = 'UTC',
      job_type,
      configuration,
      tags,
      max_runs,
      max_failures,
      timeout_seconds
    } = req.body;

    // Validate required fields
    if (!name || !cron_expression || !job_type || !configuration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, cron_expression, job_type, configuration'
      });
    }

    // Validate job type and configuration
    const validation = await CronJobType.validateConfiguration(job_type, configuration);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration for job type'
      });
    }

    // Create the cron job
    const cronJob = await cronScheduler.createCronJob({
      name,
      description,
      cron_expression,
      timezone,
      job_type,
      configuration,
      user_id: req.user.id,
      store_id: req.user.store_id,
      tags: tags || '',
      max_runs,
      max_failures,
      timeout_seconds
    });

    res.status(201).json({
      success: true,
      data: cronJob
    });
  } catch (error) {
    console.error('Error creating cron job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create cron job'
    });
  }
});

/**
 * GET /api/cron-jobs/:id
 * Get specific cron job details
 */
router.get('/:id', async (req, res) => {
  try {
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      include: [
        {
          model: CronJobExecution,
          as: 'executions',
          limit: 10,
          order: [['started_at', 'DESC']]
        }
      ]
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    res.json({
      success: true,
      data: cronJob
    });
  } catch (error) {
    console.error('Error fetching cron job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cron job'
    });
  }
});

/**
 * PUT /api/cron-jobs/:id
 * Update cron job
 */
router.put('/:id', async (req, res) => {
  try {
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    const {
      name,
      description,
      cron_expression,
      timezone,
      job_type,
      configuration,
      tags,
      max_runs,
      max_failures,
      timeout_seconds
    } = req.body;

    // Validate job type and configuration if provided
    if (job_type && configuration) {
      const validation = await CronJobType.validateConfiguration(job_type, configuration);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration for job type'
        });
      }
    }

    const updates = {
      ...(name && { name }),
      ...(description && { description }),
      ...(cron_expression && { cron_expression }),
      ...(timezone && { timezone }),
      ...(job_type && { job_type }),
      ...(configuration && { configuration }),
      ...(tags !== undefined && { tags }),
      ...(max_runs !== undefined && { max_runs }),
      ...(max_failures !== undefined && { max_failures }),
      ...(timeout_seconds !== undefined && { timeout_seconds })
    };

    const updatedCronJob = await cronScheduler.updateCronJob(cronJob.id, updates);

    res.json({
      success: true,
      data: updatedCronJob
    });
  } catch (error) {
    console.error('Error updating cron job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update cron job'
    });
  }
});

/**
 * DELETE /api/cron-jobs/:id
 * Delete cron job
 */
router.delete('/:id', async (req, res) => {
  try {
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    await cronScheduler.deleteCronJob(cronJob.id);

    res.json({
      success: true,
      message: 'Cron job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cron job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete cron job'
    });
  }
});

/**
 * POST /api/cron-jobs/:id/pause
 * Pause a cron job
 */
router.post('/:id/pause', async (req, res) => {
  try {
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    const updatedCronJob = await cronScheduler.pauseCronJob(cronJob.id);

    res.json({
      success: true,
      data: updatedCronJob,
      message: 'Cron job paused successfully'
    });
  } catch (error) {
    console.error('Error pausing cron job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause cron job'
    });
  }
});

/**
 * POST /api/cron-jobs/:id/resume
 * Resume a cron job
 */
router.post('/:id/resume', async (req, res) => {
  try {
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    const updatedCronJob = await cronScheduler.resumeCronJob(cronJob.id);

    res.json({
      success: true,
      data: updatedCronJob,
      message: 'Cron job resumed successfully'
    });
  } catch (error) {
    console.error('Error resuming cron job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume cron job'
    });
  }
});

/**
 * POST /api/cron-jobs/:id/execute
 * Execute a cron job manually
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    const job = await cronScheduler.executeCronJobManually(cronJob.id, req.user.id);

    res.json({
      success: true,
      data: {
        job_id: job.id,
        cron_job_id: cronJob.id,
        scheduled_at: job.scheduled_at
      },
      message: 'Cron job scheduled for manual execution'
    });
  } catch (error) {
    console.error('Error executing cron job manually:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute cron job'
    });
  }
});

/**
 * GET /api/cron-jobs/:id/executions
 * Get execution history for a cron job
 */
router.get('/:id/executions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Verify cron job ownership
    const cronJob = await CronJob.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!cronJob) {
      return res.status(404).json({
        success: false,
        error: 'Cron job not found'
      });
    }

    const { count, rows: executions } = await CronJobExecution.findAndCountAll({
      where: { cron_job_id: req.params.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['started_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        executions,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch execution history'
    });
  }
});

module.exports = router;