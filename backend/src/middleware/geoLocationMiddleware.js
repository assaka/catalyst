/**
 * GeoLocation Middleware
 * Detects user's country, city, region from IP address
 */

const axios = require('axios');

// Cache for IP lookups (prevent repeated API calls for same IP)
const geoCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

/**
 * Get geographic data from IP address
 * Uses ipapi.co free tier (1000 requests/day, then 1500 req/day with signup)
 * Falls back to ip-api.com if needed
 */
async function getGeoFromIP(ipAddress) {
  if (!ipAddress || ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress.startsWith('::ffff:127.')) {
    return {
      country: null,
      country_name: null,
      city: null,
      region: null,
      timezone: null
    };
  }

  // Check cache
  const cached = geoCache.get(ipAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Try ipapi.co first (more reliable, has timezone)
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 2000,
      headers: {
        'User-Agent': 'Catalyst-Analytics/1.0'
      }
    });

    const data = {
      country: response.data.country_code || null,
      country_name: response.data.country_name || null,
      city: response.data.city || null,
      region: response.data.region || null,
      timezone: response.data.timezone || null
    };

    // Cache result
    geoCache.set(ipAddress, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    // Fallback to ip-api.com (free, no API key needed, 45 req/min limit)
    try {
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
        timeout: 2000
      });

      if (response.data.status === 'success') {
        const data = {
          country: response.data.countryCode || null,
          country_name: response.data.country || null,
          city: response.data.city || null,
          region: response.data.regionName || null,
          timezone: response.data.timezone || null
        };

        // Cache result
        geoCache.set(ipAddress, {
          data,
          timestamp: Date.now()
        });

        return data;
      }
    } catch (fallbackError) {
      console.warn('[GEO] Geolocation lookup failed for IP:', ipAddress);
    }

    // Return nulls if all attempts fail
    return {
      country: null,
      country_name: null,
      city: null,
      region: null,
      timezone: null
    };
  }
}

/**
 * Middleware to attach geographic data to request
 */
async function attachGeoLocation(req, res, next) {
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    const geoData = await getGeoFromIP(ipAddress);
    req.geoLocation = geoData;
  } catch (error) {
    console.error('[GEO] Error in geolocation middleware:', error);
    req.geoLocation = {
      country: null,
      country_name: null,
      city: null,
      region: null,
      timezone: null
    };
  }

  next();
}

/**
 * Clean up old cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, cached] of geoCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      geoCache.delete(ip);
    }
  }
}, 3600000); // Clean up every hour

module.exports = {
  attachGeoLocation,
  getGeoFromIP
};
