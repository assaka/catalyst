/**
 * Language Utilities
 *
 * Helper functions for determining the request language
 */

/**
 * Get language from request (query param, header, or default)
 *
 * @param {Object} req - Express request object
 * @returns {string} Language code (e.g., 'en', 'nl')
 */
function getLanguageFromRequest(req) {
  // 1. Check query parameter (?lang=nl)
  if (req.query.lang) {
    return req.query.lang;
  }

  // 2. Check Accept-Language header
  if (req.headers['accept-language']) {
    const lang = req.headers['accept-language'].split(',')[0].split('-')[0];
    if (lang) return lang;
  }

  // 3. Check custom X-Language header
  if (req.headers['x-language']) {
    return req.headers['x-language'];
  }

  // 4. Default to English
  return 'en';
}

module.exports = {
  getLanguageFromRequest
};
