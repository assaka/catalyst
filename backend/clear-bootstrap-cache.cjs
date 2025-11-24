const Redis = require('ioredis');
require('dotenv').config();

async function clearBootstrapCache() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // Clear bootstrap cache for 'eet' store
    const patterns = [
      'bootstrap:eet:*',
      'cache:bootstrap:eet:*'
    ];

    console.log('🔍 Searching for cache keys...');

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      console.log(`Found ${keys.length} keys matching "${pattern}"`);

      if (keys.length > 0) {
        console.log('Keys:', keys);
        const deleted = await redis.del(...keys);
        console.log(`✅ Deleted ${deleted} keys`);
      }
    }

    console.log('✅ Cache cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  } finally {
    await redis.quit();
  }
}

clearBootstrapCache();
