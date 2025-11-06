/**
 * Rate Limiting Middleware Configuration
 * Protects analytics and tracking endpoints from abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * Standard rate limiter for analytics endpoints
 * Allows 100 requests per minute per IP
 */
const analyticsLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per windowMs
    message: {
        error: 'Too many tracking requests from this IP, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Skip successful requests from counting (optional, more lenient)
    skipSuccessfulRequests: false,
    // Skip failed requests from counting (optional)
    skipFailedRequests: false,
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded analytics rate limit`);
        res.status(429).json({
            error: 'Too many tracking requests',
            retryAfter: '1 minute',
            ip: req.ip
        });
    }
});

/**
 * Strict rate limiter for heatmap endpoints
 * Allows 200 requests per minute (batch tracking generates more events)
 */
const heatmapLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per windowMs
    message: {
        error: 'Too many heatmap tracking requests from this IP, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded heatmap rate limit`);
        res.status(429).json({
            error: 'Too many heatmap tracking requests',
            retryAfter: '1 minute',
            ip: req.ip
        });
    }
});

/**
 * Lenient rate limiter for public read endpoints
 * Allows 300 requests per minute
 */
const publicReadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300, // 300 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Very strict rate limiter for sensitive operations
 * Allows 20 requests per minute
 */
const strictLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded strict rate limit on ${req.path}`);
        res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: '1 minute'
        });
    }
});

module.exports = {
    analyticsLimiter,
    heatmapLimiter,
    publicReadLimiter,
    strictLimiter
};
