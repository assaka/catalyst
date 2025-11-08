/**
 * Request Timing Middleware
 * Logs slow requests and tracks query count per request
 */

let currentQueryCount = 0;

/**
 * Reset query counter (called at start of each request)
 */
function resetQueryCount() {
  currentQueryCount = 0;
}

/**
 * Increment query counter (called by database logging)
 */
function incrementQueryCount() {
  currentQueryCount++;
}

/**
 * Get current query count
 */
function getQueryCount() {
  return currentQueryCount;
}

/**
 * Timing middleware
 */
function timingMiddleware(req, res, next) {
  const start = Date.now();
  resetQueryCount();

  // Track when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.path;
    const method = req.method;
    const queryCount = getQueryCount();

    // Log slow requests (>500ms)
    if (duration > 500) {
      console.log(`⚠️  SLOW REQUEST (${duration}ms, ${queryCount} queries): ${method} ${path}`);
    }

    // Log high query count (potential N+1)
    if (queryCount > 20) {
      console.log(`⚠️  HIGH QUERY COUNT (${queryCount} queries): ${method} ${path} (${duration}ms)`);
    }

    // Log all requests if timing logging enabled
    if (process.env.LOG_REQUEST_TIMING === 'true') {
      console.log(`[${method}] ${path} - ${duration}ms (${queryCount} queries)`);
    }
  });

  next();
}

module.exports = {
  timingMiddleware,
  incrementQueryCount,
  resetQueryCount,
  getQueryCount,
};
