const redis = require('redis');

/**
 * Redis Configuration with Abstraction Layer
 * Supports easy switching between:
 * - Render.com managed Redis (REDIS_URL)
 * - Self-hosted Redis (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
 * - External providers (Upstash, Redis Cloud, etc.)
 */

const redisConfig = {
  // Render.com Managed Redis (or any Redis URL)
  url: process.env.REDIS_URL,

  // Alternative: Self-hosted or external Redis
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,

  // Database number (0-15)
  database: parseInt(process.env.REDIS_DB || '0', 10),

  // Connection options
  socket: {
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Too many reconnection attempts, giving up');
        return new Error('Too many Redis reconnection attempts');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, ...
      const delay = Math.min(retries * 50, 3000);
      console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },

  // Performance options
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
};

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 * @returns {Promise<RedisClient|null>}
 */
async function initRedis() {
  try {
    // If Redis is disabled, return null
    if (process.env.REDIS_ENABLED === 'false') {
      console.log('Redis: Disabled via REDIS_ENABLED=false');
      return null;
    }

    // Create client based on available configuration
    if (redisConfig.url) {
      console.log('Redis: Connecting using REDIS_URL (managed service)');
      redisClient = redis.createClient({
        url: redisConfig.url,
        socket: redisConfig.socket,
        database: redisConfig.database,
      });
    } else if (redisConfig.host) {
      console.log(`Redis: Connecting to ${redisConfig.host}:${redisConfig.port} (self-hosted)`);
      redisClient = redis.createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          ...redisConfig.socket,
        },
        password: redisConfig.password,
        database: redisConfig.database,
      });
    } else {
      console.warn('Redis: No configuration found, caching disabled');
      return null;
    }

    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis: Connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      console.log('Redis: Ready to accept commands');
      isRedisAvailable = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
      isRedisAvailable = false;
    });

    redisClient.on('end', () => {
      console.log('Redis: Connection closed');
      isRedisAvailable = false;
    });

    // Connect to Redis
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    console.log('Redis: Connection test successful');

    isRedisAvailable = true;
    return redisClient;

  } catch (error) {
    console.error('Redis: Failed to initialize:', error.message);
    console.warn('Redis: Application will continue without caching');
    isRedisAvailable = false;
    return null;
  }
}

/**
 * Get Redis client instance
 * @returns {RedisClient|null}
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Check if Redis is available and connected
 * @returns {boolean}
 */
function isRedisConnected() {
  return isRedisAvailable && redisClient && redisClient.isOpen;
}

/**
 * Gracefully close Redis connection
 * @returns {Promise<void>}
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis: Connection closed gracefully');
    } catch (error) {
      console.error('Redis: Error closing connection:', error);
      // Force disconnect if quit fails
      await redisClient.disconnect();
    }
    redisClient = null;
    isRedisAvailable = false;
  }
}

/**
 * Get Redis configuration info (for debugging)
 * @returns {object}
 */
function getRedisInfo() {
  return {
    enabled: process.env.REDIS_ENABLED !== 'false',
    connected: isRedisConnected(),
    type: redisConfig.url ? 'managed' : 'self-hosted',
    host: redisConfig.url ? 'managed-service' : redisConfig.host,
    port: redisConfig.port,
    database: redisConfig.database,
  };
}

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
  getRedisInfo,
};
