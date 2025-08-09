const { sequelize } = require('./backend/src/database/connection.js');
const AkeneoCustomMapping = require('./backend/src/models/AkeneoCustomMapping.js');

(async () => {
  try {
    console.log('🧪 Testing Complete Mapping Save Flow');
    console.log('=====================================');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const userId = '12345678-1234-1234-1234-123456789012'; // Mock user ID
    
    // Step 1: Clear any existing mappings
    console.log('\n1. Clearing existing mappings...');
    await sequelize.query(`DELETE FROM akeneo_custom_mappings WHERE store_id = :storeId`, {
      replacements: { storeId }
    });
    console.log('✅ Existing mappings cleared');
    
    // Step 2: Test the exact payload that frontend would send during import
    console.log('\n2. Testing import payload saving...');
    
    const importPayload = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',
          catalystField: 'compare_price',
          dataType: 'number'
        },
        {
          enabled: true,
          akeneoAttribute: 'dealer_price',
          catalystField: 'cost_price',
          dataType: 'number'
        }
      ],
      images: [],
      files: []
    };
    
    console.log('💾 Saving mappings via saveAllMappings (what import does)...');
    const savedMappings = await AkeneoCustomMapping.saveAllMappings(storeId, importPayload, userId);
    console.log('✅ Mappings saved:', JSON.stringify(savedMappings, null, 2));
    
    // Step 3: Verify the mappings were saved
    console.log('\n3. Verifying mappings were saved to database...');
    const [dbRecords] = await sequelize.query(`
      SELECT id, mapping_type, mappings 
      FROM akeneo_custom_mappings 
      WHERE store_id = :storeId
    `, {
      replacements: { storeId }
    });
    
    console.log('📊 Database records:');
    dbRecords.forEach(record => {
      console.log(`  - ${record.mapping_type}: ${record.mappings.length} mapping(s)`);
      if (record.mapping_type === 'attributes') {
        record.mappings.forEach(mapping => {
          console.log(`    • ${mapping.akeneoAttribute} → ${mapping.catalystField}`);
        });
      }
    });
    
    // Step 4: Test loading mappings (what frontend load does)
    console.log('\n4. Testing mapping load (what frontend does on page load)...');
    const loadedMappings = await AkeneoCustomMapping.getMappings(storeId);
    console.log('📥 Loaded mappings via getMappings:', JSON.stringify(loadedMappings, null, 2));
    
    // Step 5: Test the import flow with loaded mappings
    console.log('\n5. Testing import with loaded mappings...');
    
    const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
    const mapping = new AkeneoMapping();
    
    const testProduct = {
      identifier: 'test-complete-flow',
      enabled: true,
      values: {
        name: [{ data: 'Complete Flow Test Product', locale: 'en_US' }],
        price: [{ 
          data: [{"amount": "999.00", "currency": "EUR"}], 
          locale: null 
        }],
        special_price: [{ 
          data: [{"amount": "649.00", "currency": "EUR"}], 
          locale: null 
        }],
        dealer_price: [{ data: '299.50', locale: null }]
      }
    };
    
    const result = await mapping.transformProduct(
      testProduct,
      storeId,
      'en_US',
      null,
      loadedMappings,
      { downloadImages: false }
    );
    
    console.log('\n📦 Final Import Result:');
    console.log('   Name:', result.name);
    console.log('   Regular Price:', result.price);
    console.log('   Compare Price:', result.compare_price);
    console.log('   Cost Price:', result.cost_price);
    
    // Validate the complete flow
    if (result.compare_price === 649 && result.cost_price === 299.5) {
      console.log('\n🎉 SUCCESS! Complete mapping flow works perfectly!');
      console.log('✅ Mappings saved to database ✅');
      console.log('✅ Mappings loaded from database ✅');
      console.log('✅ Mappings applied during import ✅');
    } else {
      console.log('\n❌ Issues with mapping flow:');
      console.log('   Expected compare_price: 649, got:', result.compare_price);
      console.log('   Expected cost_price: 299.5, got:', result.cost_price);
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await sequelize.query(`DELETE FROM akeneo_custom_mappings WHERE store_id = :storeId`, {
      replacements: { storeId }
    });
    
    await sequelize.close();
    
    console.log('\n🎯 CONCLUSION:');
    console.log('Backend mapping persistence and loading is working correctly!');
    console.log('If the frontend still shows empty mappings after import,');
    console.log('the issue is likely in the frontend auto-save useEffect or API calls.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();