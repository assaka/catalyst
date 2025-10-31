const { CustomDomain, Store } = require('../models');

/**
 * Domain Resolution Middleware
 *
 * Intercepts incoming requests and maps custom domains to stores.
 * Attaches store information to the request object for downstream handlers.
 *
 * Flow:
 * 1. Check Host header for custom domain
 * 2. Skip platform domains (vercel.app, onrender.com, localhost)
 * 3. Query database for domain mapping
 * 4. Cache results for performance
 * 5. Attach store context to request
 */

// In-memory cache with 5-minute TTL
const domainCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [domain, entry] of domainCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      domainCache.delete(domain);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupCache, CACHE_TTL);

/**
 * Domain resolver middleware
 */
async function domainResolver(req, res, next) {
  try {
    const host = req.get('host'); // e.g., www.myshop.com or localhost:5000

    // Skip resolution for:
    // - API endpoints (handled separately)
    // - Platform domains (Vercel, Render)
    // - Localhost/development
    if (
      req.path.startsWith('/api') ||
      !host ||
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.includes('vercel.app') ||
      host.includes('onrender.com')
    ) {
      return next();
    }

    // Remove port from host if present (e.g., example.com:3000 -> example.com)
    const hostname = host.split(':')[0];

    // Check cache first
    const cached = domainCache.get(hostname);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      // Use cached mapping
      req.customDomain = true;
      req.storeId = cached.storeId;
      req.storeSlug = cached.storeSlug;
      req.storeName = cached.storeName;
      req.resolvedFromDomain = true;

      console.log(`🔍 [Domain Resolver] Using cached mapping: ${hostname} -> ${cached.storeSlug}`);
      return next();
    }

    // Query database for domain mapping
    const domainRecord = await CustomDomain.findOne({
      where: {
        domain: hostname,
        is_active: true,
        verification_status: 'verified'
      },
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'slug', 'name', 'is_active']
      }]
    });

    if (domainRecord && domainRecord.store && domainRecord.store.is_active) {
      const mapping = {
        storeId: domainRecord.store_id,
        storeSlug: domainRecord.store.slug,
        storeName: domainRecord.store.name,
        isPrimary: domainRecord.is_primary,
        timestamp: Date.now()
      };

      // Cache the mapping
      domainCache.set(hostname, mapping);

      // Attach to request
      req.customDomain = true;
      req.storeId = mapping.storeId;
      req.storeSlug = mapping.storeSlug;
      req.storeName = mapping.storeName;
      req.resolvedFromDomain = true;

      console.log(`✅ [Domain Resolver] Mapped: ${hostname} -> ${mapping.storeSlug} (${mapping.storeId})`);

      // Track domain access (non-blocking)
      setImmediate(async () => {
        try {
          await domainRecord.increment('access_count');
          await domainRecord.update({ last_accessed_at: new Date() });
        } catch (error) {
          console.error('Error tracking domain access:', error);
        }
      });
    } else {
      console.log(`⚠️ [Domain Resolver] No verified domain found for: ${hostname}`);
    }

    next();
  } catch (error) {
    console.error('❌ [Domain Resolver] Error:', error);
    // Don't block the request on errors - just continue
    next();
  }
}

/**
 * Clear domain cache (useful for testing or after domain updates)
 */
function clearDomainCache(hostname = null) {
  if (hostname) {
    domainCache.delete(hostname);
    console.log(`🗑️ Cleared cache for domain: ${hostname}`);
  } else {
    domainCache.clear();
    console.log('🗑️ Cleared entire domain cache');
  }
}

/**
 * Get cache statistics (for monitoring)
 */
function getCacheStats() {
  return {
    size: domainCache.size,
    entries: Array.from(domainCache.entries()).map(([domain, data]) => ({
      domain,
      storeSlug: data.storeSlug,
      age: Math.floor((Date.now() - data.timestamp) / 1000) + 's'
    }))
  };
}

module.exports = domainResolver;
module.exports.clearDomainCache = clearDomainCache;
module.exports.getCacheStats = getCacheStats;
