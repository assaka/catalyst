#!/usr/bin/env node

/**
 * Dedicated Background Job Worker
 * Alternative to running jobs within the main server process
 */

require('dotenv').config();
const jobManager = require('./src/core/BackgroundJobManager');
const akeneoSchedulerIntegration = require('./src/services/akeneo-scheduler-integration');

console.log('🔧 Starting Background Job Worker...');

process.on('SIGTERM', async () => {
  console.log('📝 Received SIGTERM, shutting down gracefully...');
  await jobManager.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📝 Received SIGINT, shutting down gracefully...');
  await jobManager.stop();
  process.exit(0);
});

(async () => {
  try {
    // Initialize job processing systems
    await jobManager.initialize();
    await akeneoSchedulerIntegration.initialize();
    
    console.log('✅ Background Job Worker is running...');
    console.log('📊 Processing jobs every 5 seconds');
    console.log('🔧 Max concurrent jobs: 5');
    console.log('📝 Press Ctrl+C to stop');
    
    // Keep the worker alive
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      // Don't exit - log and continue
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit - log and continue
    });
    
  } catch (error) {
    console.error('❌ Worker startup failed:', error);
    process.exit(1);
  }
})();