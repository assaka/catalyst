const jobManager = require('./backend/src/core/BackgroundJobManager');

(async () => {
  try {
    console.log('🔍 Background Job Manager Status Check');
    console.log('=====================================');
    
    // Check if already initialized
    if (!jobManager.initialized) {
      await jobManager.initialize();
    }
    
    const stats = await jobManager.getStatistics('24h');
    
    console.log('📊 Status:');
    console.log('  Running:', jobManager.isRunning ? '✅ YES' : '❌ NO');
    console.log('  Initialized:', jobManager.initialized ? '✅ YES' : '❌ NO');
    console.log('  Currently Processing:', jobManager.processing.size, 'jobs');
    console.log('  Max Concurrent:', jobManager.maxConcurrentJobs);
    
    console.log('\n📈 24h Statistics:');
    console.log('  Total Jobs:', stats.total);
    console.log('  Completed:', stats.completed);
    console.log('  Failed:', stats.failed);
    console.log('  Pending:', stats.pending);
    console.log('  Running:', stats.running);
    console.log('  Success Rate:', stats.success_rate);
    
    if (jobManager.isRunning) {
      console.log('\n✅ Background Job Manager is ACTIVE and processing jobs!');
    } else {
      console.log('\n❌ Background Job Manager is NOT running');
      console.log('💡 Start it with: npm start (or node worker.js for dedicated worker)');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    process.exit(1);
  }
})();