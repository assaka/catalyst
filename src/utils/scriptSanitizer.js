/**
 * Script Sanitization Utilities
 * Prevents XSS attacks in dynamically injected scripts
 */

/**
 * Sanitize GTM custom script
 * Allows only safe GTM patterns and removes potentially malicious code
 *
 * @param {string} script - Custom GTM script
 * @returns {string} Sanitized script or null if unsafe
 */
export function sanitizeGTMScript(script) {
  if (!script || typeof script !== 'string') {
    return null;
  }

  // Remove script tags if they exist (shouldn't be in custom script)
  const withoutScriptTags = script.replace(/<script[^>]*>|<\/script>/gi, '');

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<[^>]*>/g, // HTML tags
    /javascript:/gi, // javascript: protocol
    /on\w+\s*=/gi, // Event handlers (onclick=, onerror=, etc.)
    /eval\s*\(/gi, // eval()
    /Function\s*\(/gi, // Function constructor
    /setTimeout\s*\(/gi, // setTimeout with string
    /setInterval\s*\(/gi, // setInterval with string
    /document\.cookie/gi, // Cookie access (GTM should use dataLayer)
    /document\.write/gi, // document.write
    /\.innerHTML/gi, // innerHTML manipulation
    /\.outerHTML/gi, // outerHTML manipulation
  ];

  // Check if script contains dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(withoutScriptTags)) {
      console.error('[SANITIZER] Dangerous pattern detected in GTM script:', pattern);
      return null;
    }
  }

  // Validate that it looks like a GTM script
  // GTM scripts typically contain dataLayer.push or gtag() calls
  const isLikelyGTMScript =
    /dataLayer\.push/i.test(withoutScriptTags) ||
    /gtag\s*\(/i.test(withoutScriptTags) ||
    /window\.dataLayer/i.test(withoutScriptTags) ||
    /googletagmanager\.com/i.test(withoutScriptTags);

  if (!isLikelyGTMScript) {
    console.warn('[SANITIZER] Script does not appear to be a valid GTM script');
    return null;
  }

  // Limit script length (prevent DoS via huge scripts)
  const maxLength = 10000; // 10KB
  if (withoutScriptTags.length > maxLength) {
    console.error('[SANITIZER] Script exceeds maximum length');
    return null;
  }

  return withoutScriptTags.trim();
}

/**
 * Validate GTM Container ID format
 * @param {string} id - GTM ID to validate
 * @returns {boolean}
 */
export function isValidGTMId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // GTM IDs follow the pattern GTM-XXXXXXX
  return /^GTM-[A-Z0-9]{6,}$/i.test(id);
}

/**
 * Validate Google Ads ID format
 * @param {string} id - Google Ads ID to validate
 * @returns {boolean}
 */
export function isValidGoogleAdsId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Google Ads IDs can be AW-XXXXXXXXX or G-XXXXXXXXXX
  return /^(AW|G)-[A-Z0-9]+$/i.test(id);
}

/**
 * Sanitize URL (for privacy policy URLs, etc.)
 * @param {string} url - URL to sanitize
 * @returns {string|null}
 */
export function sanitizeURL(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url, window.location.origin);

    // Only allow http: and https: protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.error('[SANITIZER] Invalid URL protocol:', parsed.protocol);
      return null;
    }

    return parsed.href;
  } catch (error) {
    console.error('[SANITIZER] Invalid URL:', error);
    return null;
  }
}

/**
 * Create a safe script element with sanitization
 * @param {object} options - Script options
 * @returns {HTMLScriptElement|null}
 */
export function createSafeScript({ content, src, async = true, defer = false, attributes = {} }) {
  const script = document.createElement('script');

  // Set source if provided
  if (src) {
    const sanitizedSrc = sanitizeURL(src);
    if (!sanitizedSrc) {
      console.error('[SANITIZER] Script src failed sanitization');
      return null;
    }
    script.src = sanitizedSrc;
  }

  // Set content if provided (and no src)
  if (content && !src) {
    const sanitizedContent = sanitizeGTMScript(content);
    if (!sanitizedContent) {
      console.error('[SANITIZER] Script content failed sanitization');
      return null;
    }
    script.textContent = sanitizedContent; // Use textContent instead of innerHTML
  }

  // Set async/defer
  script.async = async;
  script.defer = defer;

  // Set custom attributes
  Object.entries(attributes).forEach(([key, value]) => {
    // Only allow safe attribute names (alphanumeric + hyphens)
    if (/^[a-z0-9-]+$/i.test(key)) {
      script.setAttribute(key, String(value));
    }
  });

  return script;
}

/**
 * Example usage:
 *
 * // Sanitize custom GTM script
 * const sanitized = sanitizeGTMScript(userProvidedScript);
 * if (sanitized) {
 *   const script = document.createElement('script');
 *   script.textContent = sanitized; // Safe!
 *   document.head.appendChild(script);
 * }
 *
 * // Or use the helper
 * const script = createSafeScript({
 *   content: userProvidedScript,
 *   attributes: { 'data-gtm': 'custom' }
 * });
 * if (script) {
 *   document.head.appendChild(script);
 * }
 */
