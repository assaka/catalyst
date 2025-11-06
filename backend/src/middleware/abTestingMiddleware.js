/**
 * A/B Testing Middleware
 * Automatically injects A/B test variant configurations into requests
 */

const slotConfigABTesting = require('../services/analytics/SlotConfigABTesting');

/**
 * Middleware to inject A/B test context into request
 * Adds req.abTests with variant assignments and configurations
 */
async function injectABTestContext(req, res, next) {
  try {
    // Extract session ID (from cookie, header, or generate)
    const sessionId = req.session?.id ||
                     req.cookies?.session_id ||
                     req.headers['x-session-id'] ||
                     `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store session ID for tracking
    req.sessionId = sessionId;

    // Extract context
    const context = {
      storeId: req.storeId || req.params.storeId || req.query.storeId,
      userId: req.user?.id || null,
      deviceType: getDeviceType(req.get('User-Agent')),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    // Attach context to request
    req.abTestContext = context;

    next();
  } catch (error) {
    console.error('[AB TEST MIDDLEWARE] Error injecting context:', error);
    // Continue without A/B testing on error
    next();
  }
}

/**
 * Middleware to apply A/B test variants to slot configurations
 * Use this for page rendering endpoints
 *
 * Usage:
 * router.get('/page-config/:pageType', applyABTestVariants, async (req, res) => {
 *   // req.slotConfig will have A/B test variants applied
 *   res.json({ config: req.slotConfig });
 * });
 */
async function applyABTestVariants(req, res, next) {
  try {
    // Get page type from request
    const pageType = req.params.pageType || req.query.pageType || 'unknown';

    // Get base configuration (should be loaded by previous middleware or from DB)
    const baseConfig = req.baseSlotConfig || req.slotConfig || {};

    // Apply A/B test variants
    const result = await slotConfigABTesting.getConfigWithVariants(
      pageType,
      baseConfig,
      req.sessionId,
      req.abTestContext
    );

    // Attach to request
    req.slotConfig = result.config;
    req.abTests = {
      activeTests: result.activeTests,
      appliedVariants: result.appliedVariants
    };

    // Add helper method to track conversions
    req.trackABTestConversion = async (testId, value = null, metrics = {}) => {
      const abTestingService = require('../services/analytics/ABTestingService');
      return await abTestingService.trackConversion(
        testId,
        req.sessionId,
        value,
        metrics
      );
    };

    next();
  } catch (error) {
    console.error('[AB TEST MIDDLEWARE] Error applying variants:', error);
    // Continue with base config on error
    next();
  }
}

/**
 * Get device type from user agent
 */
function getDeviceType(userAgent) {
  if (!userAgent) return 'desktop';

  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

module.exports = {
  injectABTestContext,
  applyABTestVariants
};
