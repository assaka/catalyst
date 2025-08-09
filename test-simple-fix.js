const path = require('path');
const { sequelize } = require('./backend/src/database/connection');

// Override environment variables for this test
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

async function testAttributeFix() {
  try {
    console.log('🧪 Testing Akeneo Attribute Import Fix - Simple Version');
    console.log('======================================================');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Import required models
    const { Attribute } = require('./backend/src/models');
    const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const mapping = new AkeneoMapping();
    
    console.log('\n1. Looking for existing select/multiselect attributes...');
    
    // Find existing select/multiselect attributes
    const selectAttributes = await Attribute.findAll({
      where: {
        store_id: storeId,
        type: ['select', 'multiselect']
      },
      limit: 3
    });
    
    console.log(`   Found ${selectAttributes.length} select/multiselect attributes`);
    
    if (selectAttributes.length === 0) {
      console.log('   No existing attributes found, creating test attributes...');
      
      // Create a test select attribute
      const testSelectAttr = await Attribute.create({
        name: 'Test Color',
        code: 'test_color_simple',
        type: 'select',
        store_id: storeId,
        options: [
          { label: 'Red', value: 'red' },
          { label: 'Blue', value: 'blue' },
          { label: 'Green', value: 'green' }
        ]
      });
      console.log('   Created test select attribute:', testSelectAttr.code);
      selectAttributes.push(testSelectAttr);
    }
    
    const testAttribute = selectAttributes[0];
    console.log(`   Using attribute: ${testAttribute.name} (${testAttribute.code})`);
    console.log(`   Attribute options:`, JSON.stringify(testAttribute.options, null, 2));
    
    console.log('\n2. Creating test product with select attribute value...');
    
    // Create a test product with the select attribute
    const testProduct = {
      identifier: 'test-product-simple',
      enabled: true,
      values: {
        name: [{ data: 'Test Product Simple', locale: 'en_US', scope: null }]
      }
    };
    
    // Add the select attribute value (use the first option's value)
    if (testAttribute.options && testAttribute.options.length > 0) {
      testProduct.values[testAttribute.code] = [{ 
        data: testAttribute.options[0].value, // Use 'red' for example
        locale: null, 
        scope: null 
      }];
    }
    
    console.log('   Test product values:', JSON.stringify(testProduct.values, null, 2));
    
    console.log('\n3. Transforming product using fixed extractAllAttributes method...');
    
    // Transform the product
    const transformedProduct = await mapping.transformProduct(
      testProduct,
      storeId,
      'en_US',
      null,
      {},
      { downloadImages: false }
    );
    
    console.log('\n4. Verifying transformed attribute values...');
    
    if (transformedProduct.attributes && transformedProduct.attributes[testAttribute.code]) {
      const attributeValue = transformedProduct.attributes[testAttribute.code];
      console.log('   Transformed attribute value:', JSON.stringify(attributeValue, null, 2));
      
      // Check if the fix is working
      if (attributeValue.label && attributeValue.value) {
        console.log('\n✅ SUCCESS: Attribute value has both label and value properties!');
        console.log(`   Label: "${attributeValue.label}"`);
        console.log(`   Value: "${attributeValue.value}"`);
      } else {
        console.log('\n❌ FAILURE: Attribute value is missing label or value property');
        console.log('   Current structure:', attributeValue);
      }
    } else {
      console.log('\n❌ FAILURE: No transformed attribute found');
      console.log('   Available attributes:', Object.keys(transformedProduct.attributes || {}));
    }
    
    // Clean up test attribute if we created it
    if (testAttribute.code === 'test_color_simple') {
      await testAttribute.destroy();
      console.log('\n🧹 Cleaned up test attribute');
    }
    
    await sequelize.close();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError.message);
    }
    
    process.exit(1);
  }
}

testAttributeFix();