/**
 * A/B Testing Service
 * Handles variant assignment, conversion tracking, and statistical analysis
 */

const crypto = require('crypto');
const ConnectionManager = require('./database/ConnectionManager');
const ABTest = require('../models/ABTest');
const ABTestAssignment = require('../models/ABTestAssignment');

class ABTestService {
  /**
   * Get or create variant assignment for a session
   * Uses consistent hashing to ensure same session always gets same variant
   */
  async getVariantAssignment(testId, sessionId, context = {}) {
    const { storeId, userId, deviceType, userAgent, ipAddress } = context;

    // Check if assignment already exists
    let assignment = await ABTestAssignment.findOne({
      where: { test_id: testId, session_id: sessionId }
    });

    if (assignment) {
      return {
        variant_id: assignment.variant_id,
        variant_name: assignment.variant_name,
        assignment
      };
    }

    // Get test configuration
    const test = await ABTest.findByPk(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    if (!test.isActive()) {
      throw new Error(`Test ${testId} is not active`);
    }

    // Check traffic allocation
    if (!this.shouldIncludeInTest(sessionId, test.traffic_allocation)) {
      return {
        variant_id: null,
        variant_name: 'excluded',
        excluded: true
      };
    }

    // Check targeting rules
    if (!this.matchesTargetingRules(test.targeting_rules, context)) {
      return {
        variant_id: null,
        variant_name: 'excluded',
        excluded: true
      };
    }

    // Assign variant using weighted random selection with consistent hashing
    const variant = this.selectVariant(test.variants, sessionId);

    // Create assignment record
    assignment = await ABTestAssignment.create({
      test_id: testId,
      store_id: storeId || test.store_id,
      session_id: sessionId,
      user_id: userId || null,
      variant_id: variant.id,
      variant_name: variant.name,
      device_type: deviceType,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: {
        test_name: test.name,
        assigned_via: 'service'
      }
    });

    return {
      variant_id: variant.id,
      variant_name: variant.name,
      variant_config: variant.config || {},
      assignment
    };
  }

  /**
   * Get variant assignments for all active tests on a page
   */
  async getActiveTestsForSession(storeId, pageType, sessionId, context = {}) {
    const activeTests = await ABTest.findActiveForPage(storeId, pageType);

    const assignments = await Promise.all(
      activeTests.map(async (test) => {
        try {
          const result = await this.getVariantAssignment(test.id, sessionId, {
            ...context,
            storeId
          });

          if (result.excluded) {
            return null;
          }

          return {
            test_id: test.id,
            test_name: test.name,
            variant_id: result.variant_id,
            variant_name: result.variant_name,
            variant_config: result.variant_config
          };
        } catch (error) {
          console.error(`Error assigning variant for test ${test.id}:`, error);
          return null;
        }
      })
    );

    return assignments.filter(a => a !== null);
  }

  /**
   * Track a conversion for a session
   */
  async trackConversion(testId, sessionId, value = null, metrics = {}) {
    const assignment = await ABTestAssignment.findOne({
      where: { test_id: testId, session_id: sessionId }
    });

    if (!assignment) {
      throw new Error(`No assignment found for test ${testId}, session ${sessionId}`);
    }

    // Update assignment
    await assignment.markConverted(value);
    await assignment.updateMetrics(metrics);

    return assignment;
  }

  /**
   * Track custom metrics for an assignment
   */
  async trackMetrics(testId, sessionId, metrics) {
    const assignment = await ABTestAssignment.findOne({
      where: { test_id: testId, session_id: sessionId }
    });

    if (!assignment) {
      throw new Error(`No assignment found for test ${testId}, session ${sessionId}`);
    }

    await assignment.updateMetrics(metrics);
    return assignment;
  }

  /**
   * Get test results and statistical analysis
   */
  async getTestResults(testId, storeId) {
    const test = await ABTest.findByPk(testId);
    if (!test) {
      throw new Error(`Test ${testId} not found`);
    }

    const { Op } = require('sequelize');
    const connection = await ConnectionManager.getStoreConnection(storeId);

    // Get aggregated statistics for each variant
    const stats = await ABTestAssignment.findAll({
      where: { test_id: testId },
      attributes: [
        'variant_id',
        'variant_name',
        [connection.sequelize.fn('COUNT', connection.sequelize.col('id')), 'total_assignments'],
        [connection.sequelize.fn('SUM', connection.sequelize.cast(connection.sequelize.col('converted'), 'integer')), 'total_conversions'],
        [connection.sequelize.fn('AVG', connection.sequelize.col('conversion_value')), 'avg_conversion_value'],
        [connection.sequelize.fn('SUM', connection.sequelize.col('conversion_value')), 'total_conversion_value']
      ],
      group: ['variant_id', 'variant_name']
    });

    // Calculate conversion rates and statistical significance
    const results = stats.map(stat => {
      const data = stat.get({ plain: true });
      const conversionRate = data.total_assignments > 0
        ? (parseInt(data.total_conversions) / parseInt(data.total_assignments))
        : 0;

      return {
        variant_id: data.variant_id,
        variant_name: data.variant_name,
        total_assignments: parseInt(data.total_assignments),
        total_conversions: parseInt(data.total_conversions),
        conversion_rate: conversionRate,
        avg_conversion_value: parseFloat(data.avg_conversion_value) || 0,
        total_conversion_value: parseFloat(data.total_conversion_value) || 0
      };
    });

    // Get control variant
    const control = results.find(r => {
      const variant = test.getVariant(r.variant_id);
      return variant && variant.is_control;
    }) || results[0];

    // Calculate statistical significance for each variant vs control
    const resultsWithSignificance = results.map(variant => {
      if (variant.variant_id === control.variant_id) {
        return {
          ...variant,
          lift: 0,
          is_control: true,
          statistical_significance: null
        };
      }

      const lift = control.conversion_rate > 0
        ? ((variant.conversion_rate - control.conversion_rate) / control.conversion_rate) * 100
        : 0;

      const significance = this.calculateStatisticalSignificance(
        variant.total_conversions,
        variant.total_assignments,
        control.total_conversions,
        control.total_assignments,
        test.confidence_level
      );

      return {
        ...variant,
        lift,
        is_control: false,
        ...significance
      };
    });

    return {
      test_id: testId,
      test_name: test.name,
      status: test.status,
      start_date: test.start_date,
      end_date: test.end_date,
      variants: resultsWithSignificance,
      winner_variant_id: test.winner_variant_id,
      has_significant_winner: resultsWithSignificance.some(v => v.is_significant && v.lift > 0)
    };
  }

  /**
   * Determine if session should be included based on traffic allocation
   * Uses consistent hashing to ensure deterministic selection
   */
  shouldIncludeInTest(sessionId, trafficAllocation) {
    if (trafficAllocation >= 1.0) return true;
    if (trafficAllocation <= 0.0) return false;

    // Use hash of session ID to deterministically decide inclusion
    const hash = crypto.createHash('md5').update(sessionId).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const normalizedHash = hashInt / 0xFFFFFFFF;

    return normalizedHash <= trafficAllocation;
  }

  /**
   * Check if session matches targeting rules
   */
  matchesTargetingRules(targetingRules, context) {
    if (!targetingRules) return true;

    const {
      pages,
      devices,
      countries,
      new_visitors_only,
      custom_rules
    } = targetingRules;

    // Check device targeting
    if (devices && devices.length > 0) {
      if (!context.deviceType || !devices.includes(context.deviceType)) {
        return false;
      }
    }

    // Check country targeting
    if (countries && countries.length > 0) {
      if (!context.country || !countries.includes(context.country)) {
        return false;
      }
    }

    // Check new vs returning visitors
    if (new_visitors_only === true && context.isReturningVisitor === true) {
      return false;
    }

    // TODO: Implement custom rules evaluation
    // This would require a safe expression evaluator

    return true;
  }

  /**
   * Select a variant using weighted random selection with consistent hashing
   */
  selectVariant(variants, sessionId) {
    if (!variants || variants.length === 0) {
      throw new Error('No variants available');
    }

    // Calculate total weight
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);

    // Use consistent hashing to generate a deterministic random number
    const hash = crypto.createHash('md5').update(sessionId).digest('hex');
    const hashInt = parseInt(hash.substring(8, 16), 16); // Use different part of hash
    const normalizedHash = hashInt / 0xFFFFFFFF;
    const targetWeight = normalizedHash * totalWeight;

    // Select variant based on cumulative weights
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += (variant.weight || 1);
      if (targetWeight <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1];
  }

  /**
   * Calculate statistical significance using z-test for proportions
   */
  calculateStatisticalSignificance(
    variantConversions,
    variantTrials,
    controlConversions,
    controlTrials,
    confidenceLevel = 0.95
  ) {
    if (variantTrials === 0 || controlTrials === 0) {
      return {
        is_significant: false,
        p_value: null,
        z_score: null,
        confidence_interval: null
      };
    }

    const p1 = variantConversions / variantTrials;
    const p2 = controlConversions / controlTrials;
    const pooledP = (variantConversions + controlConversions) / (variantTrials + controlTrials);

    // Calculate standard error
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / variantTrials + 1 / controlTrials));

    if (se === 0) {
      return {
        is_significant: false,
        p_value: null,
        z_score: null,
        confidence_interval: null
      };
    }

    // Calculate z-score
    const zScore = (p1 - p2) / se;

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Determine significance
    const alpha = 1 - confidenceLevel;
    const isSignificant = pValue < alpha;

    // Calculate confidence interval for difference
    const zCritical = this.inverseNormalCDF(1 - alpha / 2);
    const seDiff = Math.sqrt((p1 * (1 - p1) / variantTrials) + (p2 * (1 - p2) / controlTrials));
    const ciLower = (p1 - p2) - zCritical * seDiff;
    const ciUpper = (p1 - p2) + zCritical * seDiff;

    return {
      is_significant: isSignificant,
      p_value: pValue,
      z_score: zScore,
      confidence_interval: {
        lower: ciLower,
        upper: ciUpper,
        level: confidenceLevel
      }
    };
  }

  /**
   * Cumulative distribution function for standard normal distribution
   */
  normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
  }

  /**
   * Inverse CDF for standard normal distribution (approximation)
   */
  inverseNormalCDF(p) {
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }

    // Rational approximation for central region
    if (p > 0.5) {
      return -this.inverseNormalCDF(1 - p);
    }

    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
      1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
      6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
      -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
      3.754408661907416e+00];

    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  /**
   * Merge variant configuration with base slot configuration
   */
  mergeVariantWithSlotConfig(baseConfig, variantConfig) {
    if (!variantConfig || !variantConfig.slot_overrides) {
      return baseConfig;
    }

    const mergedConfig = JSON.parse(JSON.stringify(baseConfig)); // Deep clone
    const slotOverrides = variantConfig.slot_overrides;

    // Apply slot overrides
    for (const [slotId, overrides] of Object.entries(slotOverrides)) {
      if (mergedConfig.slots && mergedConfig.slots[slotId]) {
        // Merge override properties
        Object.assign(mergedConfig.slots[slotId], overrides);
      } else if (overrides.enabled === true) {
        // Add new slot if enabled flag is true
        mergedConfig.slots = mergedConfig.slots || {};
        mergedConfig.slots[slotId] = overrides;
      }
    }

    return mergedConfig;
  }
}

module.exports = new ABTestService();
