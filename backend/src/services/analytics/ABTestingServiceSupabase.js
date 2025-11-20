/**
 * A/B Testing Service (Supabase Version)
 * Manages experiment assignments, tracking, and analytics using Supabase
 * This replaces the Sequelize-based ABTestingService
 */

const ConnectionManager = require('../database/ConnectionManager');
const eventBus = require('./EventBus');
const crypto = require('crypto');

class ABTestingServiceSupabase {
  constructor() {
    this.assignmentCache = new Map(); // Cache assignments to reduce DB calls
    this.registerEventHandlers();
  }

  /**
   * Register event handlers for A/B test tracking
   */
  registerEventHandlers() {
    eventBus.subscribe('customer_activity', this.trackActivityEvent.bind(this), {
      name: 'ABTestActivityTracker',
      priority: 5
    });

    eventBus.subscribe('ab_test_event', this.trackTestEvent.bind(this), {
      name: 'ABTestEventTracker',
      priority: 10
    });
  }

  /**
   * Find active tests for a specific page type
   * @param {string} storeId - Store ID
   * @param {string} pageType - Page type (cart, product, checkout, etc.)
   * @returns {Promise<Array>} Active tests for the page
   */
  async findActiveForPage(storeId, pageType) {
    try {
      const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

      const now = new Date().toISOString();

      // Get all running tests
      const { data: tests, error } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'running')
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`);

      if (error) {
        console.error('[AB TESTING SUPABASE] Error fetching active tests:', error);
        throw error;
      }

      if (!tests || tests.length === 0) {
        return [];
      }

      // Filter by page type
      const filtered = tests.filter(test => {
        const targetingRules = test.targeting_rules || {};
        const pages = targetingRules.pages || [];
        return pages.length === 0 || pages.includes(pageType);
      });

      console.log(`[AB TESTING SUPABASE] Found ${filtered.length} active tests for page ${pageType}`);
      return filtered;
    } catch (error) {
      console.error('[AB TESTING SUPABASE] Error in findActiveForPage:', error);
      return [];
    }
  }

  /**
   * Get or assign variant for a user/session
   * @param {string} testId - Test ID
   * @param {string} sessionId - Session ID
   * @param {object} options - Additional options (userId, context, storeId, etc.)
   * @returns {Promise<object>} Variant assignment
   */
  async getVariant(testId, sessionId, options = {}) {
    try {
      // Check cache first
      const cacheKey = `${testId}_${sessionId}`;
      if (this.assignmentCache.has(cacheKey)) {
        return this.assignmentCache.get(cacheKey);
      }

      // storeId is required for ConnectionManager
      if (!options.storeId) {
        throw new Error('storeId is required in options for getVariant');
      }

      const { supabaseClient } = await ConnectionManager.getStoreConnection(options.storeId);

      // Get test
      const { data: test, error: testError } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError || !test) {
        throw new Error(`Test ${testId} not found: ${testError?.message}`);
      }

      if (test.status !== 'running') {
        // Return control variant if test not running
        return this.getControlVariant(test);
      }

      // Check for existing assignment
      const { data: existingAssignment, error: assignmentError } = await supabaseClient
        .from('ab_test_assignments')
        .select('*')
        .eq('test_id', testId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existingAssignment && !assignmentError) {
        const variant = test.variants.find(v => v.id === existingAssignment.variant_id);
        const result = {
          test_id: testId,
          variant_id: existingAssignment.variant_id,
          variant_name: existingAssignment.variant_name,
          config: variant?.config || {},
          is_control: variant?.is_control || false
        };

        this.assignmentCache.set(cacheKey, result);
        return result;
      }

      // Check if user should be included in test
      if (!this.shouldIncludeUser(test, options.context)) {
        return this.getControlVariant(test);
      }

      // Assign to variant
      const variant = this.selectVariant(test, sessionId);

      // Create assignment
      const { data: newAssignment, error: createError } = await supabaseClient
        .from('ab_test_assignments')
        .insert({
          test_id: testId,
          store_id: test.store_id,
          session_id: sessionId,
          user_id: options.userId || null,
          variant_id: variant.id,
          variant_name: variant.name,
          device_type: options.context?.device_type || null,
          user_agent: options.context?.user_agent || null,
          ip_address: options.context?.ip_address || null,
          metadata: {
            assigned_by: 'ABTestingServiceSupabase',
            test_name: test.name
          }
        })
        .select()
        .single();

      if (createError) {
        console.error('[AB TESTING SUPABASE] Error creating assignment:', createError);
        throw createError;
      }

      const result = {
        test_id: testId,
        variant_id: variant.id,
        variant_name: variant.name,
        config: variant.config || {},
        is_control: variant.is_control || false
      };

      this.assignmentCache.set(cacheKey, result);

      // Publish assignment event
      await eventBus.publish('ab_test_event', {
        event_type: 'variant_assigned',
        test_id: testId,
        session_id: sessionId,
        variant_id: variant.id,
        variant_name: variant.name,
        store_id: test.store_id
      }, {
        source: 'ab_testing_service_supabase'
      });

      return result;
    } catch (error) {
      console.error('[AB TESTING SUPABASE] Error getting variant:', error);
      throw error;
    }
  }

  /**
   * Select variant for user based on weights
   * @param {object} test - Test object
   * @param {string} sessionId - Session ID for consistent hashing
   * @returns {object} Selected variant
   */
  selectVariant(test, sessionId) {
    const variants = test.variants;

    // Deterministic variant selection using hash
    const hash = crypto.createHash('md5').update(sessionId + test.id).digest('hex');
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    const hashPercent = (hashNumber % 10000) / 10000; // 0.0000 to 0.9999

    // Calculate cumulative weights
    let cumulative = 0;
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);

    for (const variant of variants) {
      const weight = (variant.weight || 1) / totalWeight;
      cumulative += weight;

      if (hashPercent < cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0];
  }

  /**
   * Check if user should be included in test based on targeting rules
   */
  shouldIncludeUser(test, context = {}) {
    // Check traffic allocation
    const hash = crypto.createHash('md5').update(test.id).digest('hex');
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    const hashPercent = (hashNumber % 10000) / 10000;

    if (hashPercent > test.traffic_allocation) {
      return false;
    }

    // Check targeting rules
    if (test.targeting_rules) {
      const rules = test.targeting_rules;

      // Device targeting
      if (rules.devices && rules.devices.length > 0) {
        if (!rules.devices.includes(context.device_type)) {
          return false;
        }
      }

      // Custom segments (extend as needed)
      if (rules.segments && rules.segments.length > 0) {
        // Check if user matches any required segment
        // This would need integration with your segmentation system
      }
    }

    return true;
  }

  /**
   * Get control variant (default, no changes)
   */
  getControlVariant(test) {
    const control = test.variants.find(v => v.is_control);
    return {
      test_id: test.id,
      variant_id: control?.id || 'control',
      variant_name: control?.name || 'Control',
      config: control?.config || {},
      is_control: true
    };
  }

  /**
   * Track conversion for an assignment
   */
  async trackConversion(testId, sessionId, storeId, value = null, metrics = {}) {
    try {
      const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

      // Find assignment
      const { data: assignment, error: findError } = await supabaseClient
        .from('ab_test_assignments')
        .select('*')
        .eq('test_id', testId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (findError || !assignment) {
        console.warn(`[AB TESTING SUPABASE] No assignment found for test ${testId}, session ${sessionId}`);
        return { success: false, error: 'Assignment not found' };
      }

      if (assignment.converted) {
        console.log(`[AB TESTING SUPABASE] Assignment already converted: ${assignment.id}`);
        return { success: true, already_converted: true };
      }

      // Update assignment
      const { error: updateError } = await supabaseClient
        .from('ab_test_assignments')
        .update({
          converted: true,
          conversion_value: value,
          converted_at: new Date().toISOString(),
          metrics: { ...assignment.metrics, ...metrics }
        })
        .eq('id', assignment.id);

      if (updateError) {
        throw updateError;
      }

      // Publish conversion event
      await eventBus.publish('ab_test_event', {
        event_type: 'conversion',
        test_id: testId,
        session_id: sessionId,
        variant_id: assignment.variant_id,
        conversion_value: value,
        metrics
      }, {
        source: 'ab_testing_service_supabase',
        priority: 'high'
      });

      console.log(`[AB TESTING SUPABASE] Conversion tracked for test ${testId}, variant ${assignment.variant_id}`);

      return { success: true, assignment_id: assignment.id };
    } catch (error) {
      console.error('[AB TESTING SUPABASE] Error tracking conversion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track custom event/metric for assignment
   */
  async trackMetric(testId, sessionId, storeId, metricName, metricValue) {
    try {
      const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

      const { data: assignment, error: findError } = await supabaseClient
        .from('ab_test_assignments')
        .select('*')
        .eq('test_id', testId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (findError || !assignment) {
        return { success: false, error: 'Assignment not found' };
      }

      const metrics = assignment.metrics || {};
      metrics[metricName] = metricValue;

      const { error: updateError } = await supabaseClient
        .from('ab_test_assignments')
        .update({ metrics })
        .eq('id', assignment.id);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('[AB TESTING SUPABASE] Error tracking metric:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get test results and analytics
   */
  async getTestResults(testId, storeId) {
    try {
      const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

      // Get test
      const { data: test, error: testError } = await supabaseClient
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError || !test) {
        throw new Error(`Test ${testId} not found`);
      }

      // Get all assignments with aggregated stats
      const { data: assignments, error: assignmentsError } = await supabaseClient
        .from('ab_test_assignments')
        .select('*')
        .eq('test_id', testId);

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Aggregate by variant
      const variantStats = {};
      assignments.forEach(assignment => {
        const variantId = assignment.variant_id;
        if (!variantStats[variantId]) {
          variantStats[variantId] = {
            variant_id: variantId,
            variant_name: assignment.variant_name,
            participants: 0,
            conversions: 0,
            total_conversion_value: 0
          };
        }

        variantStats[variantId].participants += 1;
        if (assignment.converted) {
          variantStats[variantId].conversions += 1;
          variantStats[variantId].total_conversion_value += assignment.conversion_value || 0;
        }
      });

      // Calculate metrics for each variant
      const results = Object.values(variantStats).map(variant => {
        const conversionRate = variant.participants > 0 ? (variant.conversions / variant.participants) * 100 : 0;
        const avgConversionValue = variant.conversions > 0 ? variant.total_conversion_value / variant.conversions : 0;

        return {
          ...variant,
          conversion_rate: conversionRate.toFixed(2),
          avg_conversion_value: avgConversionValue.toFixed(2),
          total_conversion_value: variant.total_conversion_value.toFixed(2)
        };
      });

      // Calculate statistical significance
      const hasEnoughData = results.every(r => r.participants >= test.min_sample_size);

      return {
        test_id: testId,
        test_name: test.name,
        status: test.status,
        variants: results,
        has_enough_data: hasEnoughData,
        confidence_level: test.confidence_level,
        winner: this.determineWinner(results, test)
      };
    } catch (error) {
      console.error('[AB TESTING SUPABASE] Error getting test results:', error);
      throw error;
    }
  }

  /**
   * Determine winning variant (simplified)
   */
  determineWinner(results, test) {
    if (results.length === 0) return null;

    // Sort by conversion rate
    const sorted = [...results].sort((a, b) => parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate));

    const winner = sorted[0];

    // Check if winner has enough participants
    if (winner.participants < test.min_sample_size) {
      return null;
    }

    return {
      variant_id: winner.variant_id,
      variant_name: winner.variant_name,
      conversion_rate: winner.conversion_rate,
      improvement: '...' // Would need proper statistical test here
    };
  }

  /**
   * Event handler for customer activity events
   */
  async trackActivityEvent(event) {
    // Track activity for active A/B tests
    if (event.data.activity_type === 'order_completed') {
      const sessionId = event.data.session_id;
      const storeId = event.data.store_id;

      try {
        const { supabaseClient } = await ConnectionManager.getStoreConnection(storeId);

        // Find active tests for this store
        const { data: activeTests, error } = await supabaseClient
          .from('ab_tests')
          .select('*')
          .eq('store_id', storeId)
          .eq('status', 'running')
          .eq('primary_metric', 'order_completed');

        if (error || !activeTests) {
          return;
        }

        // Track conversions for all active tests
        for (const test of activeTests) {
          const { data: assignment } = await supabaseClient
            .from('ab_test_assignments')
            .select('*')
            .eq('test_id', test.id)
            .eq('session_id', sessionId)
            .maybeSingle();

          if (assignment && !assignment.converted) {
            const orderValue = event.data.metadata?.order_total || null;
            await this.trackConversion(test.id, sessionId, storeId, orderValue);
          }
        }
      } catch (error) {
        console.error('[AB TESTING SUPABASE] Error in trackActivityEvent:', error);
      }
    }
  }

  /**
   * Event handler for A/B test events
   */
  async trackTestEvent(event) {
    // Log test events for debugging and analytics
    console.log('[AB TESTING SUPABASE] Event:', event.data.event_type, event.data);
  }
}

// Singleton instance
const abTestingServiceSupabase = new ABTestingServiceSupabase();

module.exports = abTestingServiceSupabase;
