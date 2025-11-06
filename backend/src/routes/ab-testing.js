/**
 * A/B Testing API Routes
 * Endpoints for managing experiments and getting variant assignments
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const { injectABTestContext } = require('../middleware/abTestingMiddleware');
const abTestingService = require('../services/analytics/ABTestingService');
const slotConfigABTesting = require('../services/analytics/SlotConfigABTesting');
const ABTest = require('../models/ABTest');
const ABTestAssignment = require('../models/ABTestAssignment');

// Apply A/B test context to all routes
router.use(injectABTestContext);

// ========== PUBLIC ENDPOINTS (for frontend) ==========

/**
 * Get variant assignment for a test
 * GET /api/ab-testing/variant/:testId
 */
router.get('/variant/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const variant = await abTestingService.getVariant(
      testId,
      req.sessionId,
      {
        userId: req.abTestContext.userId,
        context: req.abTestContext
      }
    );

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting variant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all active tests for store
 * GET /api/ab-testing/active/:storeId
 */
router.get('/active/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { pageType } = req.query;

    const tests = pageType
      ? await slotConfigABTesting.getActiveTestsForPage(pageType, storeId)
      : await ABTest.findAll({
          where: {
            store_id: storeId,
            status: 'running'
          },
          attributes: ['id', 'name', 'description', 'primary_metric', 'metadata']
        });

    // Get variant assignments for each test
    const testsWithVariants = await Promise.all(
      tests.map(async (test) => {
        const variant = await abTestingService.getVariant(
          test.id,
          req.sessionId,
          {
            userId: req.abTestContext.userId,
            context: req.abTestContext
          }
        );

        return {
          test_id: test.id,
          test_name: test.name,
          variant_id: variant.variant_id,
          variant_name: variant.variant_name,
          config: variant.config,
          is_control: variant.is_control
        };
      })
    );

    res.json({
      success: true,
      data: testsWithVariants
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting active tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Track conversion for a test
 * POST /api/ab-testing/conversion/:testId
 */
router.post('/conversion/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { value, metrics } = req.body;

    const result = await abTestingService.trackConversion(
      testId,
      req.sessionId,
      value,
      metrics
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[AB TESTING API] Error tracking conversion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Track custom metric for a test
 * POST /api/ab-testing/metric/:testId
 */
router.post('/metric/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { metricName, metricValue } = req.body;

    const result = await abTestingService.trackMetric(
      testId,
      req.sessionId,
      metricName,
      metricValue
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[AB TESTING API] Error tracking metric:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== ADMIN ENDPOINTS (require authentication) ==========

/**
 * Create new A/B test
 * POST /api/ab-testing/:storeId
 */
router.post('/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      name,
      description,
      hypothesis,
      variants,
      traffic_allocation,
      targeting_rules,
      primary_metric,
      secondary_metrics,
      start_date,
      end_date,
      min_sample_size,
      confidence_level,
      metadata
    } = req.body;

    // Validate variants
    if (!variants || variants.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 variants required (including control)'
      });
    }

    const test = await ABTest.create({
      store_id: storeId,
      name,
      description,
      hypothesis,
      status: 'draft',
      variants,
      traffic_allocation: traffic_allocation || 1.0,
      targeting_rules,
      primary_metric,
      secondary_metrics: secondary_metrics || [],
      start_date,
      end_date,
      min_sample_size: min_sample_size || 100,
      confidence_level: confidence_level || 0.95,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('[AB TESTING API] Error creating test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all tests for store
 * GET /api/ab-testing/:storeId
 */
router.get('/:storeId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status } = req.query;

    const where = { store_id: storeId };
    if (status) {
      where.status = status;
    }

    const tests = await ABTest.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting tests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get test by ID
 * GET /api/ab-testing/:storeId/test/:testId
 */
router.get('/:storeId/test/:testId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await ABTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update test
 * PUT /api/ab-testing/:storeId/test/:testId
 */
router.put('/:storeId/test/:testId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await ABTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Update fields
    const allowedFields = [
      'name', 'description', 'hypothesis', 'variants', 'traffic_allocation',
      'targeting_rules', 'primary_metric', 'secondary_metrics',
      'start_date', 'end_date', 'min_sample_size', 'confidence_level',
      'metadata'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        test[field] = req.body[field];
      }
    });

    await test.save();

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('[AB TESTING API] Error updating test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Start test
 * POST /api/ab-testing/:storeId/test/:testId/start
 */
router.post('/:storeId/test/:testId/start', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await ABTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    if (test.status === 'running') {
      return res.status(400).json({
        success: false,
        error: 'Test is already running'
      });
    }

    test.status = 'running';
    test.start_date = new Date();
    await test.save();

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('[AB TESTING API] Error starting test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Pause test
 * POST /api/ab-testing/:storeId/test/:testId/pause
 */
router.post('/:storeId/test/:testId/pause', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await ABTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    test.status = 'paused';
    await test.save();

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('[AB TESTING API] Error pausing test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Complete test
 * POST /api/ab-testing/:storeId/test/:testId/complete
 */
router.post('/:storeId/test/:testId/complete', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;
    const { winner_variant_id } = req.body;

    const test = await ABTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    test.status = 'completed';
    test.end_date = new Date();
    if (winner_variant_id) {
      test.winner_variant_id = winner_variant_id;
    }
    await test.save();

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('[AB TESTING API] Error completing test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get test results and analytics
 * GET /api/ab-testing/:storeId/test/:testId/results
 */
router.get('/:storeId/test/:testId/results', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;

    const results = await abTestingService.getTestResults(testId);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting test results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete test
 * DELETE /api/ab-testing/:storeId/test/:testId
 */
router.delete('/:storeId/test/:testId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await ABTest.findByPk(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    // Archive instead of delete if test has data
    const assignmentCount = await ABTestAssignment.count({
      where: { test_id: testId }
    });

    if (assignmentCount > 0) {
      test.status = 'archived';
      await test.save();
    } else {
      await test.destroy();
    }

    res.json({
      success: true,
      message: assignmentCount > 0 ? 'Test archived' : 'Test deleted'
    });
  } catch (error) {
    console.error('[AB TESTING API] Error deleting test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get example test configurations
 * GET /api/ab-testing/examples
 */
router.get('/examples', async (req, res) => {
  try {
    const examples = slotConfigABTesting.getExampleTests();

    res.json({
      success: true,
      data: examples
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting examples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
