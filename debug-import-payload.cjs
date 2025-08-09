const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Debugging Import Payload and Mapping Processing');
    console.log('===============================================');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Step 1: Check what products have special_price in Akeneo format
    console.log('\n1. Checking products with special_price data...');
    const [products] = await sequelize.query(`
      SELECT 
        sku, 
        name,
        price,
        compare_price,
        attributes->>'special_price' as special_price_attr,
        attributes ? 'special_price' as has_special_price
      FROM products 
      WHERE store_id = :storeId 
      AND (
        attributes->>'special_price' IS NOT NULL 
        OR compare_price IS NOT NULL
      )
      LIMIT 10
    `, {
      replacements: { storeId }
    });
    
    console.log('📋 Products with special_price or compare_price:');
    if (products.length === 0) {
      console.log('❌ No products found with special_price data');
      console.log('💡 This suggests the Akeneo data doesn\'t have special_price field');
    } else {
      products.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.sku} - "${p.name}"`);
        console.log(`     Price: ${p.price}`);
        console.log(`     Compare Price: ${p.compare_price || 'NULL'}`);
        console.log(`     special_price in attributes: ${p.special_price_attr || 'not found'}`);
        console.log('');
      });
    }
    
    // Step 2: Test what the mapping logic expects vs what we have
    console.log('\n2. Testing mapping logic with real data format...');
    
    const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
    const mapping = new AkeneoMapping();
    
    // Test different data formats that might be coming from Akeneo
    const testScenarios = [
      {
        name: 'Simple string format',
        product: {
          identifier: 'test-simple',
          values: {
            special_price: [{ data: '79.99', locale: 'en_US' }]
          }
        }
      },
      {
        name: 'Price collection format',
        product: {
          identifier: 'test-collection',
          values: {
            special_price: [{ 
              data: [{"amount": "79.99", "currency": "EUR"}], 
              locale: null 
            }]
          }
        }
      },
      {
        name: 'Direct value format',
        product: {
          identifier: 'test-direct',
          values: {
            special_price: [{ data: 79.99 }]
          }
        }
      }
    ];
    
    const customMappings = {
      attributes: [
        {
          enabled: true,
          akeneoAttribute: 'special_price',
          catalystField: 'compare_price',
          dataType: 'number'
        }
      ]
    };
    
    for (const scenario of testScenarios) {
      console.log(`\n   Testing: ${scenario.name}`);
      console.log(`   Data: ${JSON.stringify(scenario.product.values.special_price)}`);
      
      try {
        const result = await mapping.transformProduct(
          scenario.product,
          storeId,
          'en_US',
          null,
          customMappings,
          { downloadImages: false }
        );
        
        console.log(`   ✅ Result: compare_price = ${result.compare_price}`);
        console.log(`   ✅ Type: ${typeof result.compare_price}`);
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Step 3: Check actual Akeneo data format from a real product
    console.log('\n3. Checking real Akeneo product data format...');
    const [sampleProduct] = await sequelize.query(`
      SELECT sku, attributes 
      FROM products 
      WHERE store_id = :storeId 
      AND attributes IS NOT NULL
      LIMIT 1
    `, {
      replacements: { storeId }
    });
    
    if (sampleProduct.length > 0) {
      const attrs = sampleProduct[0].attributes;
      console.log('📋 Sample product attributes keys:', Object.keys(attrs));
      
      // Look for any price-related attributes
      const priceAttrs = Object.keys(attrs).filter(key => 
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('cost') ||
        key.toLowerCase().includes('special')
      );
      
      if (priceAttrs.length > 0) {
        console.log('💰 Found price-related attributes:', priceAttrs);
        priceAttrs.forEach(attr => {
          console.log(`   ${attr}: ${JSON.stringify(attrs[attr])}`);
        });
      } else {
        console.log('❌ No price-related attributes found in sample product');
      }
    } else {
      console.log('❌ No products with attributes found');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();