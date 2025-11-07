/**
 * Server-side Script Validation
 * Validates GTM custom scripts before saving to database
 */

/**
 * Validate GTM custom script on server side
 * @param {string} script - Custom GTM script
 * @returns {object} { valid: boolean, errors: array, sanitized: string }
 */
function validateGTMScript(script) {
  const errors = [];

  if (!script || typeof script !== 'string') {
    return { valid: false, errors: ['Script must be a non-empty string'], sanitized: null };
  }

  // Remove script tags if they exist
  const withoutScriptTags = script.replace(/<script[^>]*>|<\/script>/gi, '');

  // Check for dangerous patterns
  const dangerousPatterns = [
    { pattern: /<[^>]*>/g, message: 'HTML tags are not allowed in GTM scripts' },
    { pattern: /javascript:/gi, message: 'javascript: protocol is not allowed' },
    { pattern: /on\w+\s*=/gi, message: 'Event handlers (onclick, onerror, etc.) are not allowed' },
    { pattern: /eval\s*\(/gi, message: 'eval() is not allowed' },
    { pattern: /Function\s*\(/gi, message: 'Function constructor is not allowed' },
    { pattern: /document\.cookie/gi, message: 'Direct cookie access is not allowed (use dataLayer)' },
    { pattern: /document\.write/gi, message: 'document.write is not allowed' },
    { pattern: /\.innerHTML/gi, message: 'innerHTML manipulation is not allowed' },
    { pattern: /\.outerHTML/gi, message: 'outerHTML manipulation is not allowed' },
    { pattern: /import\s+/gi, message: 'Dynamic imports are not allowed' },
    { pattern: /require\s*\(/gi, message: 'require() is not allowed' },
  ];

  // Check for dangerous patterns
  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(withoutScriptTags)) {
      errors.push(message);
    }
  }

  // Validate that it looks like a GTM script
  const isLikelyGTMScript =
    /dataLayer\.push/i.test(withoutScriptTags) ||
    /gtag\s*\(/i.test(withoutScriptTags) ||
    /window\.dataLayer/i.test(withoutScriptTags) ||
    /googletagmanager\.com/i.test(withoutScriptTags);

  if (!isLikelyGTMScript) {
    errors.push('Script does not appear to be a valid GTM script (should contain dataLayer.push or gtag calls)');
  }

  // Limit script length
  const maxLength = 10000; // 10KB
  if (withoutScriptTags.length > maxLength) {
    errors.push(`Script exceeds maximum length of ${maxLength} characters`);
  }

  // Check for minimum length
  if (withoutScriptTags.length < 10) {
    errors.push('Script is too short to be a valid GTM script');
  }

  const valid = errors.length === 0;
  const sanitized = valid ? withoutScriptTags.trim() : null;

  return {
    valid,
    errors,
    sanitized,
    warnings: generateWarnings(withoutScriptTags)
  };
}

/**
 * Generate warnings for potentially problematic code
 */
function generateWarnings(script) {
  const warnings = [];

  if (/setTimeout|setInterval/gi.test(script)) {
    warnings.push('Script uses setTimeout/setInterval - ensure this is intentional');
  }

  if (/fetch|XMLHttpRequest|axios/gi.test(script)) {
    warnings.push('Script makes HTTP requests - ensure endpoints are trusted');
  }

  if (/localStorage|sessionStorage/gi.test(script)) {
    warnings.push('Script accesses browser storage - ensure no sensitive data is stored');
  }

  return warnings;
}

/**
 * Validate GTM Container ID
 */
function validateGTMId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'GTM ID must be a non-empty string' };
  }

  if (!/^GTM-[A-Z0-9]{6,}$/i.test(id)) {
    return { valid: false, error: 'Invalid GTM ID format. Expected: GTM-XXXXXX' };
  }

  return { valid: true };
}

/**
 * Validate Google Ads ID
 */
function validateGoogleAdsId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Google Ads ID must be a non-empty string' };
  }

  if (!/^(AW|G)-[A-Z0-9]+$/i.test(id)) {
    return { valid: false, error: 'Invalid Google Ads ID format. Expected: AW-XXXXXX or G-XXXXXX' };
  }

  return { valid: true };
}

module.exports = {
  validateGTMScript,
  validateGTMId,
  validateGoogleAdsId
};
