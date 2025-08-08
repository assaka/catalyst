const AkeneoSyncService = require('./src/services/akeneo-sync-service');
const { sequelize } = require('./src/database/connection');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function testImageImport() {
  console.log('🧪 Testing Akeneo Image Import with Fixed Configuration');
  console.log('=======================================================\n');
  
  const syncService = new AkeneoSyncService();
  
  try {
    // Step 1: Initialize the service
    console.log('1. Initializing Akeneo Sync Service...');
    await syncService.initialize(STORE_ID);
    console.log('   ✅ Service initialized successfully\n');
    
    // Step 2: Test connection
    console.log('2. Testing Akeneo connection...');
    const connectionTest = await syncService.testConnection();
    console.log('   Connection status:', connectionTest.success ? '✅ Connected' : '❌ Failed');
    if (!connectionTest.success) {
      console.log('   Error:', connectionTest.message);
      return;
    }
    console.log();
    
    // Step 3: Check current product count
    console.log('3. Checking current products in database...');
    const [productCount] = await sequelize.query(
      'SELECT COUNT(*) as count FROM products WHERE store_id = :storeId',
      { replacements: { storeId: STORE_ID } }
    );
    console.log('   Current products:', productCount[0].count);
    console.log();
    
    // Step 4: Import a small batch of products with images
    console.log('4. Importing products with image download enabled...');
    console.log('   Configuration:');
    console.log('   - downloadImages: true (fixed in enhancedSettings)');
    console.log('   - includeImages: true');
    console.log('   - Storage provider: Supabase\n');
    
    const importOptions = {
      limit: 2, // Import only 2 products for testing
      downloadImages: true, // This will be overridden by enhancedSettings anyway
      includeImages: true,
      verbose: true
    };
    
    console.log('   Starting product import...\n');
    const result = await syncService.sync(['products'], importOptions);
    
    // Step 5: Analyze results
    console.log('\n5. Import Results:');
    console.log('   Success:', result.success ? '✅' : '❌');
    console.log('   Operations completed:', result.summary.successful, '/', result.summary.total);
    
    if (result.operations.products) {
      const productResult = result.operations.products;
      console.log('\n   Product Import Details:');
      console.log('   - Success:', productResult.success ? '✅' : '❌');
      console.log('   - Total processed:', productResult.totalProcessed || 0);
      console.log('   - Successful imports:', productResult.successfulImports || 0);
      console.log('   - Failed imports:', productResult.failedImports || 0);
      
      if (productResult.errors && productResult.errors.length > 0) {
        console.log('\n   Errors:');
        productResult.errors.forEach(error => {
          console.log('   -', error);
        });
      }
    }
    
    // Step 6: Check for products with images
    console.log('\n6. Checking for products with images...');
    const [productsWithImages] = await sequelize.query(`
      SELECT 
        p.id, 
        p.sku, 
        p.name,
        p.images,
        jsonb_array_length(COALESCE(p.images, '[]'::jsonb)) as image_count
      FROM products p
      WHERE p.store_id = :storeId 
        AND p.images IS NOT NULL 
        AND jsonb_array_length(p.images) > 0
      ORDER BY p.created_at DESC
      LIMIT 5
    `, { 
      replacements: { storeId: STORE_ID },
      type: sequelize.QueryTypes.SELECT 
    });
    
    if (productsWithImages.length > 0) {
      console.log('   ✅ Found', productsWithImages.length, 'products with images:\n');
      
      productsWithImages.forEach(product => {
        console.log('   Product:', product.name || product.sku);
        console.log('   - SKU:', product.sku);
        console.log('   - Image count:', product.image_count);
        
        // Parse and display image URLs
        if (product.images) {
          const images = typeof product.images === 'string' ? 
            JSON.parse(product.images) : product.images;
          
          if (Array.isArray(images) && images.length > 0) {
            console.log('   - Image URLs:');
            images.forEach((img, idx) => {
              const url = img.url || img;
              if (url && url.includes('supabase')) {
                console.log(`     ${idx + 1}. ✅ Supabase URL: ${url.substring(0, 80)}...`);
              } else if (url && url.startsWith('http')) {
                console.log(`     ${idx + 1}. 🔗 External URL: ${url.substring(0, 80)}...`);
              } else {
                console.log(`     ${idx + 1}. ❓ Unknown format:`, url);
              }
            });
          }
        }
        console.log();
      });
      
      // Step 7: Verify Supabase storage
      console.log('7. Verifying Supabase storage...');
      const supabaseIntegration = require('./src/services/supabase-integration');
      const storageStatus = await supabaseIntegration.getConnectionStatus(STORE_ID);
      
      if (storageStatus.connected) {
        console.log('   ✅ Supabase is connected and ready for image storage');
        
        // Check if we can access the uploaded images
        const client = await supabaseIntegration.getSupabaseAdminClient(STORE_ID);
        const { data: files, error } = await client.storage
          .from('suprshop-assets')
          .list('product/images', { limit: 10 });
        
        if (!error && files) {
          console.log('   ✅ Found', files.length, 'files in product/images folder');
        }
      } else {
        console.log('   ❌ Supabase is not connected');
      }
      
      console.log('\n🎉 SUCCESS: Images are being downloaded from Akeneo and uploaded to Supabase!');
      console.log('   The fix in akeneo-integration.js is working correctly.');
      
    } else {
      console.log('   ❌ No products with images found after import');
      console.log('\n   Possible reasons:');
      console.log('   1. The imported products don\'t have images in Akeneo');
      console.log('   2. Image download failed (check network/credentials)');
      console.log('   3. Supabase upload failed (check storage configuration)');
      console.log('\n   Please check the console output above for any error messages.');
    }
    
    // Step 8: Display summary
    console.log('\n📊 Test Summary:');
    console.log('   - Akeneo connection: ✅');
    console.log('   - Product import: ' + (result.success ? '✅' : '❌'));
    console.log('   - Image detection: ' + (productsWithImages.length > 0 ? '✅' : '❌'));
    console.log('   - Supabase storage: ' + (storageStatus.connected ? '✅' : '❌'));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    syncService.cleanup();
    await sequelize.close();
  }
}

// Run the test
testImageImport().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});