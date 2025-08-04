const { sequelize } = require('./src/database/connection.js');
const { Category } = require('./src/models');
const AkeneoIntegration = require('./src/services/akeneo-integration');

async function testCategoryMapping() {
  console.log('🧪 Testing Product-to-Category Mapping');
  console.log('=====================================');
  
  const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
  const integration = new AkeneoIntegration({
    baseUrl: 'https://demo.akeneo.com',
    clientId: 'test',
    clientSecret: 'test',
    username: 'test',
    password: 'test'
  });

  try {
    // Step 1: Show existing categories
    console.log('\n📁 Step 1: Current Categories in Database');
    console.log('------------------------------------------');
    
    const categories = await Category.findAll({
      where: { store_id: storeId },
      attributes: ['id', 'name', 'slug'],
      limit: 10,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Found ${categories.length} categories in database:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}) [Slug: ${cat.slug}]`);
    });

    // Step 2: Build category mapping
    console.log('\n🗺️ Step 2: Building Category Mapping');
    console.log('------------------------------------');
    
    const categoryMapping = await integration.buildCategoryMapping(storeId);
    
    console.log(`\nCategory mapping contains ${Object.keys(categoryMapping).length} entries:`);
    const mappingEntries = Object.entries(categoryMapping).slice(0, 10);
    mappingEntries.forEach(([akeneoCode, catalystId]) => {
      const category = categories.find(c => c.id === catalystId);
      console.log(`  - "${akeneoCode}" → ${catalystId} (${category?.name || 'Unknown'})`);
    });

    // Step 3: Simulate product category mapping
    console.log('\n📦 Step 3: Simulating Product Category Mapping');
    console.log('----------------------------------------------');
    
    // Simulate some Akeneo product category codes
    const sampleAkeneoCategories = [
      'master',
      'print',
      'clothes',
      'accessories',
      'non-existent-category'
    ];
    
    console.log(`Simulating product with Akeneo categories: ${sampleAkeneoCategories.join(', ')}`);
    
    const mappedCategoryIds = integration.mapping.mapCategoryIds(sampleAkeneoCategories, categoryMapping);
    
    console.log(`\nMapping results:`);
    sampleAkeneoCategories.forEach(akeneoCode => {
      const mappedId = categoryMapping[akeneoCode];
      if (mappedId) {
        const category = categories.find(c => c.id === mappedId);
        console.log(`  ✅ "${akeneoCode}" → ${mappedId} (${category?.name || 'Unknown'})`);
      } else {
        console.log(`  ❌ "${akeneoCode}" → No mapping found`);
      }
    });
    
    console.log(`\nFinal product category_ids: [${mappedCategoryIds.join(', ')}]`);

    // Step 4: Show recommendations
    console.log('\n💡 Recommendations for Better Category Mapping');
    console.log('----------------------------------------------');
    
    // Note: akeneo_code field doesn't exist in current Category model
    console.log('⚠️ The Category model does not have an akeneo_code field.');
    console.log('   Current mapping relies on name-based matching, which can be unreliable.');
    console.log('\nCurrent limitations:');
    console.log('1. Categories map by converting names to codes (name → slug-like-format)');
    console.log('2. This can break if category names change or have special characters');
    console.log('3. No direct Akeneo code → Catalyst ID relationship');
    
    console.log('\nRecommendations:');
    console.log('1. Add akeneo_code field to Category model');
    console.log('2. Store Akeneo codes during category import');
    console.log('3. Use akeneo_code as primary mapping method with name fallback');

    console.log('\n🎯 Summary:');
    console.log(`- ${categories.length} categories available for mapping`);
    console.log(`- ${Object.keys(categoryMapping).length} mapping entries created`);
    console.log(`- ${mappedCategoryIds.length}/${sampleAkeneoCategories.length} sample categories mapped successfully`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testCategoryMapping();