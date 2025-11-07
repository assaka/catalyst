/**
 * Cookie Consent Middleware
 * Validates that user has consented to analytics tracking before processing events
 */

/**
 * Check if user has consented to analytics tracking
 * @param {object} req - Express request
 * @returns {boolean} True if consent given or not required
 */
function hasAnalyticsConsent(req) {
  // Check for consent in headers (sent from frontend)
  const consentHeader = req.headers['x-cookie-consent'];

  if (consentHeader) {
    try {
      const consent = JSON.parse(consentHeader);
      // Check if analytics category is consented
      return consent.includes('analytics') || consent.includes('analytics_cookies');
    } catch (error) {
      console.warn('[CONSENT] Invalid consent header:', error);
    }
  }

  // Check for consent in cookie (fallback)
  const consentCookie = req.cookies?.cookie_consent;

  if (consentCookie) {
    try {
      const consent = JSON.parse(consentCookie);
      return consent.includes('analytics') || consent.includes('analytics_cookies');
    } catch (error) {
      console.warn('[CONSENT] Invalid consent cookie:', error);
    }
  }

  // If no consent info found, allow tracking (non-GDPR default)
  // You can change this to false for stricter default
  return true;
}

/**
 * Middleware to check analytics consent before tracking
 * Returns 403 if consent not given
 */
function requireAnalyticsConsent(req, res, next) {
  if (!hasAnalyticsConsent(req)) {
    return res.status(403).json({
      success: false,
      error: 'Analytics tracking requires user consent',
      consent_required: true
    });
  }

  next();
}

/**
 * Middleware to attach consent info to request
 * Non-blocking - allows request to proceed but marks consent status
 */
function attachConsentInfo(req, res, next) {
  req.analyticsConsent = hasAnalyticsConsent(req);
  req.marketingConsent = hasMarketingConsent(req);
  req.functionalConsent = hasFunctionalConsent(req);

  next();
}

/**
 * Check marketing consent
 */
function hasMarketingConsent(req) {
  const consentHeader = req.headers['x-cookie-consent'];

  if (consentHeader) {
    try {
      const consent = JSON.parse(consentHeader);
      return consent.includes('marketing') || consent.includes('marketing_cookies');
    } catch (error) {
      return false;
    }
  }

  const consentCookie = req.cookies?.cookie_consent;

  if (consentCookie) {
    try {
      const consent = JSON.parse(consentCookie);
      return consent.includes('marketing') || consent.includes('marketing_cookies');
    } catch (error) {
      return false;
    }
  }

  return false;
}

/**
 * Check functional consent
 */
function hasFunctionalConsent(req) {
  const consentHeader = req.headers['x-cookie-consent'];

  if (consentHeader) {
    try {
      const consent = JSON.parse(consentHeader);
      return consent.includes('functional') || consent.includes('functional_cookies');
    } catch (error) {
      return false;
    }
  }

  const consentCookie = req.cookies?.cookie_consent;

  if (consentCookie) {
    try {
      const consent = JSON.parse(consentCookie);
      return consent.includes('functional') || consent.includes('functional_cookies');
    } catch (error) {
      return false;
    }
  }

  return false;
}

/**
 * Middleware to filter event data based on consent
 * Removes PII if consent not given
 */
function sanitizeEventData(req, res, next) {
  if (!req.analyticsConsent) {
    // Remove PII from event data if no consent
    if (req.body) {
      // Remove IP address
      delete req.body.ip_address;

      // Remove or anonymize user agent
      if (req.body.user_agent) {
        req.body.user_agent = 'redacted';
      }

      // Remove user ID
      delete req.body.user_id;

      // Keep only essential tracking (anonymous)
      console.log('[CONSENT] Event data sanitized - no analytics consent');
    }
  }

  next();
}

module.exports = {
  hasAnalyticsConsent,
  hasMarketingConsent,
  hasFunctionalConsent,
  requireAnalyticsConsent,
  attachConsentInfo,
  sanitizeEventData
};
