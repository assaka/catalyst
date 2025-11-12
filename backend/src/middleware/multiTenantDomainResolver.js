const { Sequelize } = require('sequelize');

/**
 * Multi-Tenant Domain Resolver with Separate Databases Per Tenant
 *
 * Architecture:
 * - Master database: Stores domain → tenant database URL mappings
 * - Tenant databases: Each tenant has their own isolated database
 *
 * Flow:
 * 1. Request comes in with custom domain (e.g., www.sprshop.nl)
 * 2. Query master database to find which tenant database to use
 * 3. Connect to that tenant's database
 * 4. Attach tenant DB connection to request object
 */

// Master database connection (stores domain → tenant mappings)
const masterDb = new Sequelize(process.env.MASTER_DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Cache for tenant database connections
const tenantDbCache = new Map();
const domainToTenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get or create tenant database connection
 */
async function getTenantDbConnection(databaseUrl) {
  if (tenantDbCache.has(databaseUrl)) {
    return tenantDbCache.get(databaseUrl);
  }

  const connection = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  // Test connection
  await connection.authenticate();

  tenantDbCache.set(databaseUrl, connection);
  return connection;
}

/**
 * Multi-tenant domain resolver middleware
 */
async function multiTenantDomainResolver(req, res, next) {
  try {
    // Check all possible forwarded host headers
    const host = req.get('x-forwarded-host') ||
                 req.get('x-original-host') ||
                 req.get('x-host') ||
                 req.get('forwarded-host') ||
                 req.get('host');

    // Skip resolution for platform domains
    if (
      req.path.startsWith('/api/admin') || // Skip admin endpoints
      !host ||
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      host.includes('vercel.app') ||
      host.includes('onrender.com')
    ) {
      return next();
    }

    const hostname = host.split(':')[0];

    // Check cache first
    const cached = domainToTenantCache.get(hostname);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      req.tenantDb = cached.connection;
      req.tenantId = cached.tenantId;
      req.storeSlug = cached.storeSlug;
      req.customDomain = true;
      return next();
    }

    // Query master database for domain mapping
    const [results] = await masterDb.query(`
      SELECT
        td.id as tenant_id,
        td.database_url,
        cd.store_slug,
        cd.domain
      FROM tenant_domains td
      INNER JOIN custom_domains cd ON cd.tenant_id = td.id
      WHERE cd.domain = :hostname
        AND cd.is_active = true
        AND cd.verification_status = 'verified'
      LIMIT 1
    `, {
      replacements: { hostname },
      type: Sequelize.QueryTypes.SELECT
    });

    if (results && results.length > 0) {
      const mapping = results[0];

      // Get tenant database connection
      const tenantConnection = await getTenantDbConnection(mapping.database_url);

      // Cache the mapping
      domainToTenantCache.set(hostname, {
        connection: tenantConnection,
        tenantId: mapping.tenant_id,
        storeSlug: mapping.store_slug,
        timestamp: Date.now()
      });

      // Attach to request
      req.tenantDb = tenantConnection;
      req.tenantId = mapping.tenant_id;
      req.storeSlug = mapping.store_slug;
      req.customDomain = true;

      console.log(`[MultiTenantResolver] Resolved domain "${hostname}" → Tenant: ${mapping.tenant_id}, Store: ${mapping.store_slug}`);
    }

    next();
  } catch (error) {
    console.error('[MultiTenantResolver] Error:', error);
    // Don't block the request on errors
    next();
  }
}

/**
 * Clear cache for a specific domain or all domains
 */
function clearCache(hostname = null) {
  if (hostname) {
    domainToTenantCache.delete(hostname);
    console.log(`🗑️ Cleared cache for domain: ${hostname}`);
  } else {
    domainToTenantCache.clear();
    console.log('🗑️ Cleared entire domain cache');
  }
}

/**
 * Close all tenant database connections
 */
async function closeAllConnections() {
  const closePromises = Array.from(tenantDbCache.values()).map(conn => conn.close());
  await Promise.all(closePromises);
  tenantDbCache.clear();
  console.log('Closed all tenant database connections');
}

module.exports = multiTenantDomainResolver;
module.exports.clearCache = clearCache;
module.exports.closeAllConnections = closeAllConnections;
module.exports.getTenantDbConnection = getTenantDbConnection;
