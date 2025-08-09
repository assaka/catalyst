const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Debugging special_price → compare_price mapping issue');
    console.log('======================================================');
    
    // Check if any products have compare_price set
    console.log('\n1. Checking current compare_price values in products...');
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
        compare_price IS NOT NULL 
        OR attributes->>'special_price' IS NOT NULL
      )
      LIMIT 5
    `, {
      replacements: { storeId: '157d4590-49bf-4b0b-bd77-abe131909528' }
    });
    
    if (products.length > 0) {
      products.forEach(p => {
        console.log(`  - SKU: ${p.sku}`);
        console.log(`    Name: ${p.name}`);
        console.log(`    Price: ${p.price}`);
        console.log(`    Compare Price: ${p.compare_price || 'NULL'}`);
        console.log(`    special_price in attributes: ${p.special_price_attr || 'not found'}`);
        console.log(`    Has special_price attribute: ${p.has_special_price}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No products found with compare_price or special_price data');
    }
    
    // Check if you have any custom mappings configured
    console.log('\n2. Checking for custom mappings in database...');
    const [mappings] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%mapping%' 
      AND table_schema = 'public'
    `);
    
    if (mappings.length > 0) {
      console.log('  📋 Found mapping-related tables:');
      mappings.forEach(t => console.log('    -', t.table_name));
    } else {
      console.log('  ℹ️  No mapping tables found - mappings might be configured elsewhere');
    }
    
    // Test with sample data to see what happens
    console.log('\n3. Testing mapping logic with sample data...');
    console.log('   Simulating: special_price: "89.99" → compare_price field');
    
    const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
    const mapping = new AkeneoMapping();
    
    const testProduct = {
      identifier: 'debug-special-price',
      enabled: true,
      values: {
        name: [{ data: 'Debug Special Price Product', locale: 'en_US' }],
        price: [{ data: '99.99', locale: 'en_US' }],
        special_price: [{ data: '89.99', locale: 'en_US' }]
      }
    };
    
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
    
    const result = await mapping.transformProduct(
      testProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      customMappings,
      { downloadImages: false }
    );
    
    console.log('\n📊 Test Results:');
    console.log('  Price:', result.price);
    console.log('  Compare Price:', result.compare_price);
    console.log('  special_price in attributes:', result.attributes.special_price || 'not found');
    
    if (result.compare_price === 89.99) {
      console.log('  ✅ SUCCESS: Mapping logic works in isolation');
      console.log('  💡 Issue might be in your admin configuration or Akeneo data');
    } else {
      console.log('  ❌ FAILED: Mapping logic has an issue');
      console.log('  🐛 Let me investigate further...');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();