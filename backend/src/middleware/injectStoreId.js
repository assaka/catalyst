/**
 * Inject Store ID Middleware
 *
 * Automatically extracts store_id from request and adds it to req.storeId
 * for tenant DB queries. This allows routes to work like the old single-DB
 * architecture without explicitly handling store_id.
 *
 * Sources (in order of priority):
 * 1. X-Store-Id header (preferred)
 * 2. store_id query parameter
 * 3. store_id in request body
 * 4. URL parameter :store_id
 */

const injectStoreId = (req, res, next) => {
  // Extract store_id from various sources
  const storeId =
    req.headers['x-store-id'] ||
    req.query.store_id ||
    req.body?.store_id ||
    req.params.store_id;

  if (storeId) {
    req.storeId = storeId;
    req.query.store_id = storeId; // Also ensure it's in query for compatibility
  }

  next();
};

module.exports = { injectStoreId };
