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
  let language;
  let source;

  // 1. Check query parameter (?lang=nl)
  if (req.query.lang) {
    language = req.query.lang;
    source = 'query parameter';
    console.log(`🌍 Language detected: "${language}" (from ${source})`);
    return language;
  }

  // 2. Check custom X-Language header (priority over Accept-Language)
  if (req.headers['x-language']) {
    language = req.headers['x-language'];
    source = 'X-Language header';
    console.log(`🌍 Language detected: "${language}" (from ${source})`);
    return language;
  }

  // 3. Check Accept-Language header
  if (req.headers['accept-language']) {
    const lang = req.headers['accept-language'].split(',')[0].split('-')[0];
    if (lang) {
      language = lang;
      source = 'Accept-Language header';
      console.log(`🌍 Language detected: "${language}" (from ${source})`);
      return language;
    }
  }

  // 4. Default to English
  language = 'en';
  source = 'default fallback';
  console.log(`🌍 Language detected: "${language}" (from ${source})`);
  console.log(`📋 Available headers:`, {
    'x-language': req.headers['x-language'] || 'not set',
    'accept-language': req.headers['accept-language'] || 'not set',
    'query.lang': req.query.lang || 'not set'
  });
  return language;
}

module.exports = {
  getLanguageFromRequest
};
