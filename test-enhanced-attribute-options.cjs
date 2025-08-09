const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Enhanced Akeneo Attribute Options Extraction');
console.log('===================================================');

// Test 1: Product with various attribute types that should be auto-detected
console.log('\n1. Testing auto-detection of select/multiselect attributes...');

const testProductWithUnknownAttributes = {
  identifier: 'test-product-unknown-attributes',
  enabled: true,
  values: {
    name: [{ data: 'Test Product With Unknown Attributes', locale: 'en_US' }],
    // These should be detected as select attributes
    color: [{ data: 'blue', locale: null, scope: null }],
    size: [{ data: 'large', locale: null, scope: null }],
    material: [{ data: 'cotton', locale: null, scope: null }],
    brand: [{ data: 'test-brand', locale: null, scope: null }],
    condition: [{ data: 'new', locale: null, scope: null }],
    // These should be detected as multiselect attributes  
    tags: [
      { data: 'casual', locale: null, scope: null },
      { data: 'comfortable', locale: null, scope: null },
      { data: 'summer', locale: null, scope: null }
    ],
    features: [
      { data: 'waterproof', locale: null, scope: null },
      { data: 'breathable', locale: null, scope: null }
    ],
    // This should remain as text
    description: [{ data: 'A detailed product description with lots of text content', locale: 'en_US' }],
    product_code: [{ data: 'ABC123DEF', locale: null, scope: null }]
  }
};

(async () => {
  try {
    // Test the enhanced extractAllAttributes method
    console.log('Testing enhanced extractAllAttributes method...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const attributes = await mapping.extractAllAttributes(
      testProductWithUnknownAttributes.values, 
      'en_US', 
      storeId
    );
    
    console.log('\n📊 Extracted attributes:');
    console.log(JSON.stringify(attributes, null, 2));
    
    console.log('\n🔍 Analyzing the results:');
    
    // Check select attributes
    const selectAttributes = ['color', 'size', 'material', 'brand', 'condition'];
    selectAttributes.forEach(attr => {
      if (attributes[attr] && typeof attributes[attr] === 'object' && 
          attributes[attr].label && attributes[attr].value) {
        console.log(`✅ ${attr}: Correctly formatted as select option`);
        console.log(`   Label: "${attributes[attr].label}", Value: "${attributes[attr].value}"`);
      } else {
        console.log(`❌ ${attr}: Not formatted correctly as select option`);
        console.log(`   Got: ${JSON.stringify(attributes[attr])}`);
      }
    });
    
    // Check multiselect attributes
    const multiselectAttributes = ['tags', 'features'];
    multiselectAttributes.forEach(attr => {
      if (Array.isArray(attributes[attr]) && 
          attributes[attr].every(item => item.label && item.value)) {
        console.log(`✅ ${attr}: Correctly formatted as multiselect options`);
        console.log(`   Options: ${attributes[attr].map(opt => `"${opt.label}"`).join(', ')}`);
      } else {
        console.log(`❌ ${attr}: Not formatted correctly as multiselect options`);
        console.log(`   Got: ${JSON.stringify(attributes[attr])}`);
      }
    });
    
    // Check text attributes (should remain unchanged)
    const textAttributes = ['description', 'product_code'];
    textAttributes.forEach(attr => {
      if (typeof attributes[attr] === 'string') {
        console.log(`✅ ${attr}: Correctly kept as text attribute`);
      } else {
        console.log(`❌ ${attr}: Should be text but got: ${typeof attributes[attr]}`);
      }
    });
    
    console.log('\n2. Testing label formatting...');
    
    // Test label formatting function
    const testValues = ['test-value', 'snake_case_value', 'kebab-case-value', 'normalvalue'];
    testValues.forEach(value => {
      const formatted = mapping.formatLabelFromValue(value);
      console.log(`  "${value}" → "${formatted}"`);
    });
    
    console.log('\n3. Testing type detection...');
    
    // Test type detection for various attribute patterns
    const testCases = [
      { code: 'product_color', value: 'red', expected: 'select' },
      { code: 'item_size', value: 'medium', expected: 'select' },
      { code: 'product_tags', value: ['tag1', 'tag2'], expected: 'multiselect' },
      { code: 'description_text', value: 'This is a long description...', expected: 'text' },
      { code: 'custom_attribute', value: 'simple-value', expected: 'select' },
      { code: 'features_list', value: ['feature1', 'feature2', 'feature3'], expected: 'multiselect' }
    ];
    
    testCases.forEach(testCase => {
      const detected = mapping.detectAttributeTypeFromData(testCase.code, testCase.value, {});
      const result = detected === testCase.expected ? '✅' : '❌';
      console.log(`  ${result} ${testCase.code}: ${detected} (expected: ${testCase.expected})`);
    });
    
    console.log('\n✅ Enhanced attribute options extraction testing completed!');
    console.log('\n📋 Summary of improvements:');
    console.log('  - Auto-detects select/multiselect attributes from name patterns');
    console.log('  - Auto-detects select/multiselect attributes from data structure');
    console.log('  - Formats unknown attributes properly with {label, value} structure');
    console.log('  - Converts snake_case/kebab-case to Title Case labels');
    console.log('  - Maintains compatibility with existing database definitions');
    console.log('  - Handles both single values and arrays appropriately');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();