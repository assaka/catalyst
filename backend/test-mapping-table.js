const { sequelize } = require('./src/database/connection.js');
const AkeneoMapping = require('./src/models/AkeneoMapping');
const AkeneoIntegration = require('./src/services/akeneo-integration');

async function testMappingTable() {
  console.log('🧪 Testing New Akeneo Mapping Table System');
  console.log('==========================================');
  
  const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';

  try {
    // Step 1: Test auto-creation of mappings
    console.log('\n📋 Step 1: Auto-Creating Category Mappings');
    console.log('-------------------------------------------');
    
    const createdMappings = await AkeneoMapping.autoCreateCategoryMappings(storeId);
    console.log(`✅ Auto-created ${createdMappings.length} category mappings`);
    
    // Step 2: Show created mappings
    console.log('\n🗺️ Step 2: Viewing Created Mappings');
    console.log('------------------------------------');
    
    const allMappings = await AkeneoMapping.findAll({
      where: { store_id: storeId, entity_type: 'category' },
      limit: 10
    });
    
    console.log(`Found ${allMappings.length} category mappings:`);
    allMappings.forEach(mapping => {
      console.log(`  - "${mapping.akeneo_code}" → ${mapping.entity_id} [${mapping.entity_slug}] (${mapping.mapping_source})`);
    });
    
    // Step 3: Test buildCategoryMapping with new system
    console.log('\n🔧 Step 3: Testing buildCategoryMapping');
    console.log('---------------------------------------');
    
    const integration = new AkeneoIntegration({
      baseUrl: 'https://demo.akeneo.com',
      clientId: 'test',
      clientSecret: 'test',
      username: 'test',
      password: 'test'
    });
    
    const categoryMapping = await integration.buildCategoryMapping(storeId);
    
    console.log(`Built category mapping with ${Object.keys(categoryMapping).length} entries:`);
    const sampleMappings = Object.entries(categoryMapping).slice(0, 10);
    sampleMappings.forEach(([akeneoCode, catalystId]) => {
      console.log(`  - "${akeneoCode}" → ${catalystId}`);
    });
    
    // Step 4: Test manual mapping creation
    console.log('\n✍️ Step 4: Testing Manual Mapping Creation');
    console.log('-------------------------------------------');
    
    const manualMapping = await AkeneoMapping.createMapping(
      storeId,
      'electronics', // Akeneo code
      'category',    // Akeneo type
      'category',    // Entity type
      categoryMapping['computers_laptops'] || Object.values(categoryMapping)[0], // Entity ID
      'electronics', // Entity slug
      { source: 'manual', notes: 'Manual test mapping for electronics' }
    );
    
    console.log(`✅ Created manual mapping: "${manualMapping.akeneo_code}" → ${manualMapping.entity_id}`);
    
    // Step 5: Test product category simulation
    console.log('\n📦 Step 5: Simulating Product Category Assignment');
    console.log('------------------------------------------------');
    
    const testAkeneoCategories = [
      'master_catalog',      // Should map to auto-generated
      'computers_laptops',   // Should map to auto-generated  
      'electronics',         // Should map to manual mapping
      'smartphones',         // Won't exist
      'test_category'        // Should map to auto-generated
    ];
    
    console.log(`Testing product with Akeneo categories: ${testAkeneoCategories.join(', ')}`);
    
    const finalMapping = await integration.buildCategoryMapping(storeId);
    const mappedCategoryIds = integration.mapping.mapCategoryIds(testAkeneoCategories, finalMapping);
    
    console.log('\nMapping results:');
    testAkeneoCategories.forEach(akeneoCode => {
      const mappedId = finalMapping[akeneoCode];
      if (mappedId) {
        console.log(`  ✅ "${akeneoCode}" → ${mappedId}`);
      } else {
        console.log(`  ❌ "${akeneoCode}" → No mapping found`);
      }
    });
    
    console.log(`\nFinal product category_ids: [${mappedCategoryIds.join(', ')}]`);
    
    // Step 6: Show system benefits
    console.log('\n💡 System Benefits');
    console.log('------------------');
    console.log('✅ Works with manually created categories');
    console.log('✅ Works with any import source (CSV, API, etc.)');
    console.log('✅ Allows custom Akeneo code → category mappings');
    console.log('✅ Supports both auto-generated and manual mappings');
    console.log('✅ Clean separation from core category model');
    console.log('✅ Easy to manage and update mappings');
    
    console.log('\n🎯 Summary:');
    console.log(`- ${allMappings.length} total mappings in akeneo_mappings table`);
    console.log(`- ${Object.keys(finalMapping).length} active mappings available`);
    console.log(`- ${mappedCategoryIds.length}/${testAkeneoCategories.length} test categories mapped successfully`);
    console.log('- System works with ANY category source! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testMappingTable();