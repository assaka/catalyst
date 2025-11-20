/**
 * A/B Testing API Routes
 * Endpoints for managing experiments and getting variant assignments
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkStoreOwnership } = require('../middleware/storeAuth');
const { injectABTestContext } = require('../middleware/abTestingMiddleware');
const abTestingService = require('../services/analytics/ABTestingServiceSupabase');
const slotConfigABTesting = require('../services/analytics/SlotConfigABTesting');
const ConnectionManager = require('../services/database/ConnectionManager');

// Apply A/B test context to all routes
router.use(injectABTestContext);

// ========== PUBLIC ENDPOINTS (for frontend) ==========

/**
 * Get variant assignment for a test
 * GET /api/ab-testing/variant/:testId?storeId=xxx
 */
router.get('/variant/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'storeId query parameter is required'
      });
    }

    const variant = await abTestingService.getVariant(
      testId,
      req.sessionId,
      {
        storeId,
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

    let tests;
    if (pageType) {
      tests = await slotConfigABTesting.getActiveTestsForPage(pageType, storeId);
    } else {
      const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

      const { data, error } = await supabaseClient
        .from('ab_tests')
        .select('id, name, description, primary_metric, metadata')
        .eq('store_id', storeId)
        .eq('status', 'running');

      if (error) throw error;
      tests = data || [];
    }

    // Get variant assignments for each test
    const testsWithVariants = await Promise.all(
      tests.map(async (test) => {
        const variant = await abTestingService.getVariant(
          test.id,
          req.sessionId,
          {
            storeId,
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
 * Body: { storeId, value, metrics }
 */
router.post('/conversion/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { storeId, value, metrics } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'storeId is required in request body'
      });
    }

    const result = await abTestingService.trackConversion(
      testId,
      req.sessionId,
      storeId,
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
 * Body: { storeId, metricName, metricValue }
 */
router.post('/metric/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const { storeId, metricName, metricValue } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        error: 'storeId is required in request body'
      });
    }

    const result = await abTestingService.trackMetric(
      testId,
      req.sessionId,
      storeId,
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

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

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

    console.log('[AB TESTING API] Getting tests for store:', storeId, 'with status filter:', status);

    // Get store connection
    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    if (!supabaseClient) {
      throw new Error('Failed to get database connection for store');
    }

    console.log('[AB TESTING API] Successfully got store connection');

    // Build query
    let query = supabaseClient
      .from('ab_tests')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    console.log('[AB TESTING API] Executing query...');
    const { data: tests, error } = await query;

    if (error) {
      console.error('[AB TESTING API] Database query error:', error);
      throw error;
    }

    console.log('[AB TESTING API] Successfully fetched', (tests || []).length, 'tests');

    res.json({
      success: true,
      data: tests || []
    });
  } catch (error) {
    console.error('[AB TESTING API] Error getting tests:', error);
    console.error('[AB TESTING API] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get test by ID
 * GET /api/ab-testing/:storeId/test/:testId
 */
router.get('/:storeId/test/:testId', authMiddleware, checkStoreOwnership, async (req, res) => {
  try {
    const { storeId, testId } = req.params;

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .eq('store_id', storeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }
      throw error;
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
    const { storeId, testId } = req.params;

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    // Check if test exists
    const { data: existingTest, error: fetchError } = await supabaseClient
      .from('ab_tests')
      .select('id')
      .eq('id', testId)
      .eq('store_id', storeId)
      .single();

    if (fetchError || !existingTest) {
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

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .update(updates)
      .eq('id', testId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;

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
    const { storeId, testId } = req.params;

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    // Check current status
    const { data: existingTest, error: fetchError } = await supabaseClient
      .from('ab_tests')
      .select('status')
      .eq('id', testId)
      .eq('store_id', storeId)
      .single();

    if (fetchError || !existingTest) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    if (existingTest.status === 'running') {
      return res.status(400).json({
        success: false,
        error: 'Test is already running'
      });
    }

    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .update({
        status: 'running',
        start_date: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) throw error;

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
    const { storeId, testId } = req.params;

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .update({ status: 'paused' })
      .eq('id', testId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }
      throw error;
    }

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
    const { storeId, testId } = req.params;
    const { winner_variant_id } = req.body;

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    const updates = {
      status: 'completed',
      end_date: new Date().toISOString()
    };

    if (winner_variant_id) {
      updates.winner_variant_id = winner_variant_id;
    }

    const { data: test, error } = await supabaseClient
      .from('ab_tests')
      .update(updates)
      .eq('id', testId)
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Test not found'
        });
      }
      throw error;
    }

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
    const { storeId, testId } = req.params;

    const results = await abTestingService.getTestResults(testId, storeId);

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
    const { storeId, testId } = req.params;

    const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

    // Check if test has assignments
    const { count, error: countError } = await supabaseClient
      .from('ab_test_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId);

    if (countError) throw countError;

    if (count > 0) {
      // Archive instead of delete if test has data
      const { data: test, error } = await supabaseClient
        .from('ab_tests')
        .update({ status: 'archived' })
        .eq('id', testId)
        .eq('store_id', storeId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Test archived'
      });
    }

    // Delete test
    const { error: deleteError } = await supabaseClient
      .from('ab_tests')
      .delete()
      .eq('id', testId)
      .eq('store_id', storeId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Test deleted'
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
