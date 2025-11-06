/**
 * A/B Testing Service
 * Manages experiment assignments, tracking, and analytics
 */

const ABTest = require('../../models/ABTest');
const ABTestAssignment = require('../../models/ABTestAssignment');
const eventBus = require('./EventBus');
const crypto = require('crypto');

class ABTestingService {
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
   * Get or assign variant for a user/session
   * @param {string} testId - Test ID
   * @param {string} sessionId - Session ID
   * @param {object} options - Additional options (userId, context, etc.)
   * @returns {Promise<object>} Variant assignment
   */
  async getVariant(testId, sessionId, options = {}) {
    try {
      // Check cache first
      const cacheKey = `${testId}_${sessionId}`;
      if (this.assignmentCache.has(cacheKey)) {
        return this.assignmentCache.get(cacheKey);
      }

      // Get test
      const test = await ABTest.findByPk(testId);

      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      if (test.status !== 'running') {
        // Return control variant if test not running
        return this.getControlVariant(test);
      }

      // Check for existing assignment
      let assignment = await ABTestAssignment.findOne({
        where: {
          test_id: testId,
          session_id: sessionId
        }
      });

      if (assignment) {
        const variant = test.variants.find(v => v.id === assignment.variant_id);
        const result = {
          test_id: testId,
          variant_id: assignment.variant_id,
          variant_name: assignment.variant_name,
          config: variant.config || {},
          is_control: variant.is_control || false
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

      assignment = await ABTestAssignment.create({
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
          assigned_by: 'ABTestingService',
          test_name: test.name
        }
      });

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
        source: 'ab_testing_service'
      });

      return result;
    } catch (error) {
      console.error('[AB TESTING] Error getting variant:', error);
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
  async trackConversion(testId, sessionId, value = null, metrics = {}) {
    try {
      const assignment = await ABTestAssignment.findOne({
        where: {
          test_id: testId,
          session_id: sessionId
        }
      });

      if (!assignment) {
        console.warn(`[AB TESTING] No assignment found for test ${testId}, session ${sessionId}`);
        return { success: false, error: 'Assignment not found' };
      }

      if (assignment.converted) {
        console.log(`[AB TESTING] Assignment already converted: ${assignment.id}`);
        return { success: true, already_converted: true };
      }

      await assignment.markConverted(value);

      if (Object.keys(metrics).length > 0) {
        await assignment.updateMetrics(metrics);
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
        source: 'ab_testing_service',
        priority: 'high'
      });

      console.log(`[AB TESTING] Conversion tracked for test ${testId}, variant ${assignment.variant_id}`);

      return { success: true, assignment_id: assignment.id };
    } catch (error) {
      console.error('[AB TESTING] Error tracking conversion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track custom event/metric for assignment
   */
  async trackMetric(testId, sessionId, metricName, metricValue) {
    try {
      const assignment = await ABTestAssignment.findOne({
        where: {
          test_id: testId,
          session_id: sessionId
        }
      });

      if (!assignment) {
        return { success: false, error: 'Assignment not found' };
      }

      const metrics = assignment.metrics || {};
      metrics[metricName] = metricValue;

      await assignment.updateMetrics(metrics);

      return { success: true };
    } catch (error) {
      console.error('[AB TESTING] Error tracking metric:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get test results and analytics
   */
  async getTestResults(testId) {
    try {
      const test = await ABTest.findByPk(testId);

      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      const assignments = await ABTestAssignment.findAll({
        where: { test_id: testId },
        attributes: [
          'variant_id',
          'variant_name',
          [ABTestAssignment.sequelize.fn('COUNT', '*'), 'total_participants'],
          [ABTestAssignment.sequelize.fn('SUM', ABTestAssignment.sequelize.literal('CASE WHEN converted = true THEN 1 ELSE 0 END')), 'conversions'],
          [ABTestAssignment.sequelize.fn('AVG', ABTestAssignment.sequelize.col('conversion_value')), 'avg_conversion_value'],
          [ABTestAssignment.sequelize.fn('SUM', ABTestAssignment.sequelize.col('conversion_value')), 'total_conversion_value']
        ],
        group: ['variant_id', 'variant_name'],
        raw: true
      });

      // Calculate metrics for each variant
      const results = assignments.map(variant => {
        const participants = parseInt(variant.total_participants);
        const conversions = parseInt(variant.conversions || 0);
        const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;

        return {
          variant_id: variant.variant_id,
          variant_name: variant.variant_name,
          participants,
          conversions,
          conversion_rate: conversionRate.toFixed(2),
          avg_conversion_value: parseFloat(variant.avg_conversion_value || 0).toFixed(2),
          total_conversion_value: parseFloat(variant.total_conversion_value || 0).toFixed(2)
        };
      });

      // Calculate statistical significance (simplified chi-square test)
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
      console.error('[AB TESTING] Error getting test results:', error);
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
    // This can be extended to automatically track specific activities
    // For example, track "order_completed" as conversions
    if (event.data.activity_type === 'order_completed') {
      const sessionId = event.data.session_id;
      const storeId = event.data.store_id;

      // Find active tests for this store
      const activeTests = await ABTest.findAll({
        where: {
          store_id: storeId,
          status: 'running',
          primary_metric: 'order_completed'
        }
      });

      // Track conversions for all active tests
      for (const test of activeTests) {
        const assignment = await ABTestAssignment.findOne({
          where: {
            test_id: test.id,
            session_id: sessionId
          }
        });

        if (assignment && !assignment.converted) {
          const orderValue = event.data.metadata?.order_total || null;
          await this.trackConversion(test.id, sessionId, orderValue);
        }
      }
    }
  }

  /**
   * Event handler for A/B test events
   */
  async trackTestEvent(event) {
    // Log test events for debugging and analytics
    console.log('[AB TESTING] Event:', event.data.event_type, event.data);
  }
}

// Singleton instance
const abTestingService = new ABTestingService();

module.exports = abTestingService;
