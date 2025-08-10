const { sequelize } = require('./backend/src/database/connection.js');
const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

(async () => {
  try {
    console.log('🔍 DEBUGGING AKENEO NUMERIC TYPE ERROR');
    console.log('===================================');
    
    // Test numeric conversion with various data types
    const mapping = new AkeneoMapping();
    
    console.log('\n1. Testing extractNumericValue with different data types...');
    
    // Test data that might cause "[object Object]" error
    const testCases = [
      {
        name: 'String number',
        data: [{ data: "29.99", locale: "en_US", scope: null }]
      },
      {
        name: 'Number',
        data: [{ data: 29.99, locale: "en_US", scope: null }]
      },
      {
        name: 'Price collection (array)',
        data: [{ data: [{ amount: "29.99", currency: "USD" }], locale: null, scope: null }]
      },
      {
        name: 'Price object',
        data: [{ data: { amount: "29.99", currency: "USD" }, locale: null, scope: null }]
      },
      {
        name: 'Complex object (this could cause the error)',
        data: [{ data: { amount: { value: "29.99", currency: "USD" }, locale: "en_US" }, locale: null, scope: null }]
      },
      {
        name: 'Array with multiple objects',
        data: [
          { data: { name: "Price 1", value: "29.99" }, locale: "en_US", scope: null },
          { data: { name: "Price 2", value: "39.99" }, locale: "en_US", scope: null }
        ]
      },
      {
        name: 'Nested complex structure',
        data: [{ 
          data: {
            prices: [
              { amount: "29.99", currency: "USD" },
              { amount: "25.99", currency: "EUR" }
            ]
          }, 
          locale: "en_US", 
          scope: null 
        }]
      }
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`\n📊 Test ${index + 1}: ${testCase.name}`);
      console.log('Input data:', JSON.stringify(testCase.data, null, 2));
      
      try {
        // Test extractNumericValue
        const result = mapping.extractNumericValue({ test_attr: testCase.data }, 'test_attr', 'en_US');
        console.log('✅ Result:', result, '(type:', typeof result, ')');
      } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('📍 This might be the source of "[object Object]" error');
      }
    });
    
    console.log('\n2. Testing missing convertValueToNumeric method...');
    
    // Check if convertValueToNumeric method exists
    if (typeof mapping.convertValueToNumeric === 'function') {
      console.log('✅ convertValueToNumeric method exists');
    } else {
      console.log('❌ convertValueToNumeric method is MISSING - this is the root cause!');
      console.log('   The method is called in applyCustomAttributeMappings but doesn\'t exist');
    }
    
    console.log('\n3. Checking database constraints for numeric fields...');
    
    // Check what numeric fields exist in products table
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND data_type IN ('numeric', 'integer', 'decimal', 'real', 'double precision')
      ORDER BY column_name;
    `);
    
    if (columns.length > 0) {
      console.log('📊 Numeric columns in products table:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    console.log('\n4. Testing what happens when objects are converted to string...');
    
    const objectsThatCauseError = [
      { amount: "29.99", currency: "USD" },
      [{ amount: "29.99", currency: "USD" }],
      { value: { nested: "29.99" } }
    ];
    
    objectsThatCauseError.forEach((obj, index) => {
      console.log(`\nObject ${index + 1}:`, JSON.stringify(obj));
      console.log('String conversion:', String(obj));
      console.log('ToString method:', obj.toString());
      console.log('JSON stringify:', JSON.stringify(obj));
    });
    
    await sequelize.close();
    
    console.log('\n🎯 CONCLUSION:');
    console.log('The error is likely caused by:');
    console.log('1. Missing convertValueToNumeric method (called but not defined)');
    console.log('2. Complex objects being passed to numeric fields without proper conversion');
    console.log('3. Akeneo sending complex price/numeric structures that need better parsing');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();