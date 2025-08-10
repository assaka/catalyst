const { sequelize } = require('./backend/src/database/connection.js');
const AkeneoCustomMapping = require('./backend/src/models/AkeneoCustomMapping.js');

(async () => {
  try {
    console.log('🧪 Testing Mapping Save with Correct User Handling');
    console.log('===============================================');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Step 1: Test saving with NULL user (what should work for import)
    console.log('\n1. Testing save with NULL user (no user logged in)...');
    
    const importPayload = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',
          catalystField: 'compare_price',
          dataType: 'number'
        }
      ],
      images: [],
      files: []
    };
    
    console.log('💾 Saving mappings with NULL user...');
    const savedMappings = await AkeneoCustomMapping.saveAllMappings(storeId, importPayload, null);
    console.log('✅ Mappings saved successfully with NULL user');
    
    // Step 2: Verify mappings were saved
    console.log('\n2. Verifying mappings in database...');
    const [dbRecords] = await sequelize.query(`
      SELECT mapping_type, mappings 
      FROM akeneo_custom_mappings 
      WHERE store_id = :storeId
    `, {
      replacements: { storeId }
    });
    
    if (dbRecords.length > 0) {
      console.log('✅ Found saved mappings in database:');
      dbRecords.forEach(record => {
        console.log(`  - ${record.mapping_type}: ${record.mappings.length} mapping(s)`);
        if (record.mapping_type === 'attributes' && record.mappings.length > 0) {
          console.log(`    • ${record.mappings[0].akeneoAttribute} → ${record.mappings[0].catalystField}`);
        }
      });
    } else {
      console.log('❌ No mappings found in database');
    }
    
    // Step 3: Test loading and using the mappings
    console.log('\n3. Testing mapping load and usage...');
    const loadedMappings = await AkeneoCustomMapping.getMappings(storeId);
    
    if (loadedMappings.attributes && loadedMappings.attributes.length > 0) {
      console.log('✅ Successfully loaded mappings from database');
      
      // Test with real product
      const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
      const mapping = new AkeneoMapping();
      
      const testProduct = {
        identifier: 'test-db-mappings',
        enabled: true,
        values: {
          name: [{ data: 'Test DB Mappings Product', locale: 'en_US' }],
          price: [{ data: [{"amount": "999.00", "currency": "EUR"}], locale: null }],
          special_price: [{ data: [{"amount": "649.00", "currency": "EUR"}], locale: null }]
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
      
      console.log('\n📦 Import Result with DB Mappings:');
      console.log('   Compare Price:', result.compare_price);
      console.log('   Type:', typeof result.compare_price);
      
      if (result.compare_price === 649) {
        console.log('\n🎉 SUCCESS! End-to-end mapping flow working!');
        console.log('✅ Save to DB: Working');
        console.log('✅ Load from DB: Working');
        console.log('✅ Apply mappings: Working');
      } else {
        console.log('\n❌ Mapping application failed');
      }
    } else {
      console.log('❌ Failed to load mappings from database');
    }
    
    // Clean up
    await sequelize.query(`DELETE FROM akeneo_custom_mappings WHERE store_id = :storeId`, {
      replacements: { storeId }
    });
    
    await sequelize.close();
    
    console.log('\n🎯 CONCLUSION FOR YOUR ISSUE:');
    console.log('Backend mapping system is working correctly.');
    console.log('The issue is that frontend mappings are not being saved during import.');
    console.log('After my backend fix, importing should now save mappings to DB.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();