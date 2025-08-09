const AkeneoIntegration = require('./src/services/akeneo-integration.js');

(async () => {
  try {
    console.log('🧪 Testing Akeneo product import with image download enabled...');
    
    const integration = new AkeneoIntegration();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Initialize the integration
    await integration.initialize(storeId);
    
    // Import just one product with downloadImages explicitly enabled
    const result = await integration.importProducts(storeId, {
      locale: 'en_US',
      dryRun: false,
      batchSize: 1,
      filters: {
        families: [],
        completeness: 100,
        updatedSince: 0,
        limit: 1 // Only import 1 product for testing
      },
      settings: {
        mode: 'standard',
        status: 'enabled',
        includeImages: true,
        includeFiles: true,
        includeStock: true,
        downloadImages: true // Explicitly enable image download
      }
    });
    
    console.log('\n📊 Import Result:', result);
    
    if (result.success) {
      console.log('✅ Import successful!');
      console.log('📊 Stats:', result.stats);
      
      // Check if images were uploaded
      const { sequelize } = require('./src/database/connection.js');
      const [products] = await sequelize.query(
        'SELECT name, sku, images FROM products WHERE store_id = :storeId ORDER BY updated_at DESC LIMIT 1',
        { replacements: { storeId } }
      );
      
      if (products.length > 0) {
        const product = products[0];
        console.log('\n📦 Latest product:');
        console.log('  Name:', product.name);
        console.log('  SKU:', product.sku);
        if (product.images && Array.isArray(product.images)) {
          console.log('  Images:', product.images.length);
          product.images.forEach((img, idx) => {
            const url = img.url || img;
            console.log(`    ${idx + 1}. ${url}`);
            console.log(`       Is Supabase URL: ${url.includes('supabase.co')}`);
          });
        }
      }
      
      await sequelize.close();
    } else {
      console.log('❌ Import failed:', result.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();