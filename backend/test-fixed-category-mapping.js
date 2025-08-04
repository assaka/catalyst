const { sequelize } = require('./src/database/connection.js');
const { Category } = require('./src/models');
const AkeneoIntegration = require('./src/services/akeneo-integration');

async function testFixedCategoryMapping() {
  console.log('🧪 Testing FIXED Product-to-Category Mapping');
  console.log('=============================================');
  
  const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';

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

    // Step 2: Build FIXED category mapping (without akeneo_code)
    console.log('\n🗺️ Step 2: Building FIXED Category Mapping');
    console.log('--------------------------------------------');
    
    // Create a working version of buildCategoryMapping that doesn't use akeneo_code
    const mapping = {};
    categories.forEach(category => {
      // Create mapping based on category name converted to Akeneo-style code
      const nameBasedCode = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      mapping[nameBasedCode] = category.id;
      
      // Also try some common Akeneo naming patterns
      const simpleCode = category.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (simpleCode !== nameBasedCode) {
        mapping[simpleCode] = category.id;
      }
      
      // Handle "master" category specifically (common in Akeneo)
      if (category.name.toLowerCase().includes('master')) {
        mapping['master'] = category.id;
      }
    });
    
    console.log(`\nFixed category mapping contains ${Object.keys(mapping).length} entries:`);
    const mappingEntries = Object.entries(mapping).slice(0, 15);
    mappingEntries.forEach(([akeneoCode, catalystId]) => {
      const category = categories.find(c => c.id === catalystId);
      console.log(`  - "${akeneoCode}" → ${catalystId} (${category?.name || 'Unknown'})`);
    });

    // Step 3: Simulate product category mapping
    console.log('\n📦 Step 3: Simulating Product Category Mapping');
    console.log('----------------------------------------------');
    
    // Simulate realistic Akeneo product category codes
    const sampleAkeneoCategories = [
      'master',                    // Common root category
      'master-catalog',           // Exact match
      'computers-laptops',        // Exact slug match
      'electronics',              // Might not exist
      'friteuses-gourmetstellen', // Dutch category
      'non-existent-category'     // Definitely won't exist
    ];
    
    console.log(`Simulating product with Akeneo categories: ${sampleAkeneoCategories.join(', ')}`);
    
    // Manual mapping simulation (since AkeneoMapping.mapCategoryIds requires the fixed mapping)
    const mappedCategoryIds = [];
    
    console.log(`\nMapping results:`);
    sampleAkeneoCategories.forEach(akeneoCode => {
      const mappedId = mapping[akeneoCode];
      if (mappedId) {
        const category = categories.find(c => c.id === mappedId);
        console.log(`  ✅ "${akeneoCode}" → ${mappedId} (${category?.name || 'Unknown'})`);
        mappedCategoryIds.push(mappedId);
      } else {
        console.log(`  ❌ "${akeneoCode}" → No mapping found`);
      }
    });
    
    console.log(`\nFinal product category_ids: [${mappedCategoryIds.join(', ')}]`);

    // Step 4: Show the problem and solution
    console.log('\n💡 Analysis: Current System Problems & Solutions');
    console.log('----------------------------------------------');
    
    console.log('❌ CURRENT PROBLEMS:');
    console.log('1. akeneo_code field missing from Category model');
    console.log('2. buildCategoryMapping() fails completely');
    console.log('3. Name-based mapping is unreliable and fragile');
    console.log('4. No direct Akeneo code → Catalyst ID relationship');
    
    console.log('\n✅ SOLUTIONS:');
    console.log('1. Add akeneo_code VARCHAR(255) column to categories table');
    console.log('2. Store Akeneo codes during category import process');
    console.log('3. Update buildCategoryMapping to handle missing akeneo_code gracefully');
    console.log('4. Use akeneo_code as primary mapping with name-based fallback');

    console.log('\n📋 RECOMMENDED IMPLEMENTATION:');
    console.log('```sql');
    console.log('ALTER TABLE categories ADD COLUMN akeneo_code VARCHAR(255);');
    console.log('CREATE INDEX idx_categories_akeneo_code ON categories(akeneo_code);');
    console.log('```');

    console.log('\n🎯 Summary:');
    console.log(`- ${categories.length} categories available for mapping`);
    console.log(`- ${Object.keys(mapping).length} fallback mapping entries created`);
    console.log(`- ${mappedCategoryIds.length}/${sampleAkeneoCategories.length} sample categories mapped successfully`);
    console.log('- System needs akeneo_code field to work reliably');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testFixedCategoryMapping();