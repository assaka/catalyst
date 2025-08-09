const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Debugging Frontend vs Backend Mapping Format');
    console.log('=============================================');
    
    // Step 1: Show what frontend sends
    console.log('\n1. Frontend payload format (what AkeneoIntegration.jsx sends):');
    const frontendPayload = {
      customMappings: {
        attributes: [
          {
            enabled: true,
            akeneoField: 'special_price',    // ← Frontend uses 'akeneoField'
            catalystField: 'compare_price'
          }
        ],
        images: [],
        files: []
      }
    };
    console.log(JSON.stringify(frontendPayload, null, 2));
    
    // Step 2: Show what backend expects
    console.log('\n2. Backend expected format (what akeneo-mapping.js expects):');
    const backendExpected = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',  // ← Backend expects 'akeneoAttribute'
          catalystField: 'compare_price',
          dataType: 'number'
        }
      ]
    };
    console.log(JSON.stringify(backendExpected, null, 2));
    
    // Step 3: Test the mismatch
    console.log('\n3. Testing the format mismatch...');
    
    const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
    const mapping = new AkeneoMapping();
    
    const testProduct = {
      identifier: 'test-format-mismatch',
      enabled: true,
      values: {
        name: [{ data: 'Test Product Format Mismatch', locale: 'en_US' }],
        price: [{ data: '99.99', locale: 'en_US' }],
        special_price: [{ data: '79.99', locale: 'en_US' }]
      }
    };
    
    console.log('\n   A. Testing with FRONTEND format (akeneoField):');
    const frontendMappings = {
      attributes: [
        {
          enabled: true,
          akeneoField: 'special_price',      // ← Wrong field name
          catalystField: 'compare_price'
        }
      ]
    };
    
    const frontendResult = await mapping.transformProduct(
      testProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      frontendMappings,
      { downloadImages: false }
    );
    
    console.log('     ❌ Frontend format result:', frontendResult.compare_price);
    
    console.log('\n   B. Testing with BACKEND format (akeneoAttribute):');
    const backendMappings = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',  // ← Correct field name
          catalystField: 'compare_price',
          dataType: 'number'
        }
      ]
    };
    
    const backendResult = await mapping.transformProduct(
      testProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      backendMappings,
      { downloadImages: false }
    );
    
    console.log('     ✅ Backend format result:', backendResult.compare_price);
    
    // Step 4: Check what's in the frontend code
    console.log('\n4. Checking frontend mapping UI...');
    console.log('   Looking at AkeneoIntegration.jsx around line 3485...');
    console.log('   The input field should use "akeneoAttribute" not "akeneoField"');
    
    console.log('\n🎯 SOLUTION NEEDED:');
    console.log('   Fix the frontend to use "akeneoAttribute" instead of "akeneoField"');
    console.log('   OR fix the backend to accept "akeneoField"');
    console.log('   OR add a transformation layer to convert between formats');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();