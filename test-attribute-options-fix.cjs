const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Akeneo Attribute Options Extraction');
console.log('============================================');

// Test 1: Product with select/multiselect attributes
console.log('\n1. Testing attribute options extraction...');

const testProductWithAttributes = {
  identifier: 'test-product-attributes',
  enabled: true,
  values: {
    name: [{ data: 'Test Product With Attributes', locale: 'en_US' }],
    color: [{ data: 'blue', locale: null, scope: null }],
    size: [{ data: 'large', locale: null, scope: null }],
    material: [{ data: 'cotton', locale: null, scope: null }],
    style: [
      { data: 'casual', locale: null, scope: null },
      { data: 'comfortable', locale: null, scope: null }
    ],
    brand: [{ data: 'TestBrand', locale: 'en_US' }]
  }
};

// Mock the Attribute model to simulate database lookup
const mockAttributeDefinitions = {
  color: {
    type: 'select',
    options: [
      { code: 'blue', label: 'Blue', value: 'blue' },
      { code: 'red', label: 'Red', value: 'red' },
      { code: 'green', label: 'Green', value: 'green' }
    ]
  },
  size: {
    type: 'select',
    options: [
      { code: 'small', label: 'Small', value: 'small' },
      { code: 'medium', label: 'Medium', value: 'medium' },
      { code: 'large', label: 'Large', value: 'large' }
    ]
  },
  material: {
    type: 'select',
    options: [
      { code: 'cotton', label: 'Cotton', value: 'cotton' },
      { code: 'polyester', label: 'Polyester', value: 'polyester' }
    ]
  },
  style: {
    type: 'multiselect',
    options: [
      { code: 'casual', label: 'Casual', value: 'casual' },
      { code: 'formal', label: 'Formal', value: 'formal' },
      { code: 'comfortable', label: 'Comfortable', value: 'comfortable' }
    ]
  }
};

(async () => {
  try {
    // Test the current extractAllAttributes method (this will likely show the issue)
    console.log('Testing current extractAllAttributes method...');
    
    // Since we can't easily mock the database in this simple test, 
    // let's test the core logic by examining what the method does
    
    const attributes = {};
    const values = testProductWithAttributes.values;
    const locale = 'en_US';
    
    // Simulate what extractAllAttributes currently does
    Object.keys(values).forEach(attributeCode => {
      const rawValue = mapping.extractProductValue(values, attributeCode, locale);
      if (rawValue !== null && rawValue !== undefined) {
        // The issue is here: attributeDefinitions will be empty because
        // we're only looking for attributes that exist in the database
        const attrDef = mockAttributeDefinitions[attributeCode];
        
        if (attrDef && (attrDef.type === 'select' || attrDef.type === 'multiselect')) {
          console.log(`📋 Processing ${attrDef.type} attribute: ${attributeCode} = ${JSON.stringify(rawValue)}`);
          
          if (attrDef.type === 'select') {
            if (typeof rawValue === 'string') {
              const matchingOption = attrDef.options.find(opt => 
                opt.value === rawValue || opt.label === rawValue || opt.code === rawValue
              );
              
              if (matchingOption) {
                attributes[attributeCode] = {
                  label: matchingOption.label || rawValue,
                  value: matchingOption.value || rawValue
                };
                console.log(`  ✅ Found matching option: ${JSON.stringify(attributes[attributeCode])}`);
              } else {
                attributes[attributeCode] = {
                  label: rawValue,
                  value: rawValue
                };
                console.log(`  ⚠️ No matching option, using raw value: ${JSON.stringify(attributes[attributeCode])}`);
              }
            }
          } else if (attrDef.type === 'multiselect') {
            if (Array.isArray(rawValue)) {
              attributes[attributeCode] = rawValue.map(val => {
                if (typeof val === 'string') {
                  const matchingOption = attrDef.options.find(opt => 
                    opt.value === val || opt.label === val || opt.code === val
                  );
                  
                  if (matchingOption) {
                    return {
                      label: matchingOption.label || val,
                      value: matchingOption.value || val
                    };
                  } else {
                    return {
                      label: val,
                      value: val
                    };
                  }
                }
                return val;
              });
              console.log(`  ✅ Processed multiselect: ${JSON.stringify(attributes[attributeCode])}`);
            }
          }
        } else {
          attributes[attributeCode] = rawValue;
          console.log(`  📝 Regular attribute: ${attributeCode} = ${JSON.stringify(rawValue)}`);
        }
      }
    });
    
    console.log('\n📊 Final attributes object:');
    console.log(JSON.stringify(attributes, null, 2));
    
    console.log('\n🔍 Analysis of the issue:');
    console.log('1. The extractAllAttributes method only processes select/multiselect attributes that exist in the Catalyst database');
    console.log('2. During Akeneo import, these attributes might not exist yet in the database');
    console.log('3. Even if they exist, the attribute codes might not match between Akeneo and Catalyst');
    console.log('4. Raw Akeneo attribute values are stored as-is without proper option formatting');
    
    console.log('\n💡 Solution:');
    console.log('1. We need to detect select/multiselect attributes from Akeneo data structure');
    console.log('2. For unknown attributes, we should format them properly based on data patterns');
    console.log('3. We should create attribute options on-the-fly if they don\'t exist');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();