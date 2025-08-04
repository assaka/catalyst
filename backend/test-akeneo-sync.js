const AkeneoSyncService = require('./src/services/akeneo-sync-service');

(async () => {
  try {
    console.log('🔍 Testing Akeneo Sync Service...\n');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const syncService = new AkeneoSyncService();
    
    console.log('📋 Step 1: Initializing sync service...');
    await syncService.initialize(storeId);
    console.log('✅ Service initialized');
    
    console.log('\n📋 Step 2: Testing connection...');
    const connectionResult = await syncService.testConnection();
    console.log('Connection result:', connectionResult);
    
    if (connectionResult.success) {
      console.log('\n📋 Step 3: Testing product sync...');
      const syncResult = await syncService.sync(['products'], {
        locale: 'en_US',
        dryRun: false
      });
      
      console.log('\nSync result:', syncResult);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();