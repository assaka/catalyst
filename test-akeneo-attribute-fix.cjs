const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const { Attribute } = require('./backend/src/models');
const { sequelize } = require('./backend/src/database/connection');

(async () => {
  try {
    console.log('🧪 Testing Akeneo Attribute Import Fix');
    console.log('====================================');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const mapping = new AkeneoMapping();
    
    console.log('\n1. Checking existing select/multiselect attributes...');
    
    // Find existing select/multiselect attributes
    const selectAttributes = await Attribute.findAll({
      where: {
        store_id: storeId,
        type: ['select', 'multiselect']
      },
      limit: 5
    });
    
    console.log(`   Found ${selectAttributes.length} select/multiselect attributes`);
    
    selectAttributes.forEach(attr => {
      console.log(`   - ${attr.name} (${attr.code}) - Type: ${attr.type}`);
      if (attr.options && attr.options.length > 0) {
        console.log(`     Options: ${attr.options.slice(0, 3).map(opt => opt.label).join(', ')}...`);
      }
    });
    
    // Create test attributes if needed
    let testSelectAttr, testMultiselectAttr;
    
    if (!selectAttributes.find(attr => attr.type === 'select')) {
      console.log('\n2a. Creating test select attribute...');
      testSelectAttr = await Attribute.create({
        name: 'Test Color',
        code: 'test_color',
        type: 'select',
        store_id: storeId,
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Blue', value: 'blue' },
          { label: 'Green', value: 'green' }
        ]
      });
      console.log('   Created test select attribute:', testSelectAttr.code);
    } else {
      testSelectAttr = selectAttributes.find(attr => attr.type === 'select');
      console.log('\n2a. Using existing select attribute:', testSelectAttr.code);
    }
    
    if (!selectAttributes.find(attr => attr.type === 'multiselect')) {
      console.log('\n2b. Creating test multiselect attribute...');
      testMultiselectAttr = await Attribute.create({
        name: 'Test Features',
        code: 'test_features',
        type: 'multiselect',
        store_id: storeId,
        options: [
          { label: 'Waterproof', value: 'waterproof' },
          { label: 'Bluetooth', value: 'bluetooth' },
          { label: 'Wireless', value: 'wireless' }
        ]
      });
      console.log('   Created test multiselect attribute:', testMultiselectAttr.code);
    } else {
      testMultiselectAttr = selectAttributes.find(attr => attr.type === 'multiselect');
      console.log('\n2b. Using existing multiselect attribute:', testMultiselectAttr.code);
    }
    
    console.log('\n3. Testing product transformation with attribute values...');
    
    // Test product with select and multiselect attribute values
    const testProduct = {
      identifier: 'test-product-attributes',
      enabled: true,
      values: {
        name: [{ data: 'Test Product with Attributes', locale: 'en_US', scope: null }]
      }
    };
    
    // Add select attribute value
    if (testSelectAttr.options && testSelectAttr.options.length > 0) {
      testProduct.values[testSelectAttr.code] = [{ 
        data: testSelectAttr.options[0].value, // Use the value from options
        locale: null, 
        scope: null 
      }];
    }
    
    // Add multiselect attribute value
    if (testMultiselectAttr.options && testMultiselectAttr.options.length > 1) {
      testProduct.values[testMultiselectAttr.code] = [{ 
        data: [testMultiselectAttr.options[0].value, testMultiselectAttr.options[1].value], 
        locale: null, 
        scope: null 
      }];
    }
    
    console.log('   Test product values structure:');
    console.log('   ', JSON.stringify(testProduct.values, null, 4));
    
    console.log('\n4. Transforming product using fixed extractAllAttributes...');
    
    // Transform the product using the fixed method
    const transformedProduct = await mapping.transformProduct(
      testProduct,
      storeId,
      'en_US',
      null,
      {},
      { downloadImages: false }
    );
    
    console.log('\n5. Checking transformed attribute values...');
    
    if (transformedProduct.attributes) {
      console.log(`   Found ${Object.keys(transformedProduct.attributes).length} attributes in transformed product`);
      
      // Check select attribute
      const selectAttrValue = transformedProduct.attributes[testSelectAttr.code];
      if (selectAttrValue) {
        console.log(`   Select attribute (${testSelectAttr.code}):`);
        console.log('   ', JSON.stringify(selectAttrValue, null, 4));
        
        if (selectAttrValue.label && selectAttrValue.value) {
          console.log('   ✅ Select attribute has both label and value properties');
        } else {
          console.log('   ❌ Select attribute missing label or value property');
        }
      }
      
      // Check multiselect attribute
      const multiselectAttrValue = transformedProduct.attributes[testMultiselectAttr.code];
      if (multiselectAttrValue) {
        console.log(`   Multiselect attribute (${testMultiselectAttr.code}):`);
        console.log('   ', JSON.stringify(multiselectAttrValue, null, 4));
        
        if (Array.isArray(multiselectAttrValue) && 
            multiselectAttrValue.length > 0 &&
            multiselectAttrValue[0].label && 
            multiselectAttrValue[0].value) {
          console.log('   ✅ Multiselect attribute values have both label and value properties');
        } else {
          console.log('   ❌ Multiselect attribute values missing label or value properties');
        }
      }
    } else {
      console.log('   ❌ No attributes found in transformed product');
    }
    
    console.log('\n6. Summary of fix verification:');
    
    const selectAttrValue = transformedProduct.attributes?.[testSelectAttr.code];
    const multiselectAttrValue = transformedProduct.attributes?.[testMultiselectAttr.code];
    
    const selectFixed = selectAttrValue && selectAttrValue.label && selectAttrValue.value;
    const multiselectFixed = multiselectAttrValue && Array.isArray(multiselectAttrValue) && 
                            multiselectAttrValue.length > 0 &&
                            multiselectAttrValue[0].label && multiselectAttrValue[0].value;
    
    console.log(`   Select attribute fix: ${selectFixed ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Multiselect attribute fix: ${multiselectFixed ? '✅ WORKING' : '❌ FAILED'}`);
    
    if (selectFixed && multiselectFixed) {
      console.log('\n🎉 SUCCESS: Akeneo attribute import fix is working correctly!');
      console.log('   Product attribute options now have both label and value properties.');
    } else {
      console.log('\n❌ ISSUE: Fix verification failed. Check the implementation.');
    }
    
    // Clean up test attributes if we created them
    if (testSelectAttr && testSelectAttr.code === 'test_color') {
      await testSelectAttr.destroy();
      console.log('\n🧹 Cleaned up test select attribute');
    }
    
    if (testMultiselectAttr && testMultiselectAttr.code === 'test_features') {
      await testMultiselectAttr.destroy();
      console.log('🧹 Cleaned up test multiselect attribute');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError.message);
    }
    process.exit(1);
  }
});