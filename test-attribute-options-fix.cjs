const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

// Test the attribute option processing logic
(async () => {
  try {
    console.log('🧪 Testing Akeneo Attribute Options Processing Fix');
    console.log('===============================================');
    
    const mapping = new AkeneoMapping();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Simulate a product with select and multiselect attributes from Akeneo
    const testProductValues = {
      // Single select attribute
      drive_mechanism_motor: [
        { data: 'Koolborstelloos', locale: 'en_US', scope: null }
      ],
      // Multiselect attribute
      aansluitingen: [
        { data: 'HDMI-aansluiting', locale: 'en_US', scope: null },
        { data: 'DisplayPort-aansluiting', locale: 'en_US', scope: null }
      ],
      // Another select attribute
      aantal_compressoren: [
        { data: '2 compressors', locale: 'en_US', scope: null }
      ]
    };
    
    console.log('\n1. Testing attribute extraction with database lookup...');
    console.log('Input values:', JSON.stringify(testProductValues, null, 2));
    
    // Test the extractAllAttributes method
    const extractedAttributes = await mapping.extractAllAttributes(
      testProductValues, 
      'en_US', 
      storeId, 
      null // No Akeneo client for this test
    );
    
    console.log('\n📊 Extracted attributes result:');
    console.log(JSON.stringify(extractedAttributes, null, 2));
    
    // Verify the structure is correct for select/multiselect
    console.log('\n✅ Validation:');
    
    if (extractedAttributes.drive_mechanism_motor) {
      console.log('  drive_mechanism_motor (select):');
      console.log('    Type:', typeof extractedAttributes.drive_mechanism_motor);
      console.log('    Has label:', !!extractedAttributes.drive_mechanism_motor.label);
      console.log('    Has value:', !!extractedAttributes.drive_mechanism_motor.value);
      console.log('    Structure valid:', 
        typeof extractedAttributes.drive_mechanism_motor === 'object' &&
        'label' in extractedAttributes.drive_mechanism_motor &&
        'value' in extractedAttributes.drive_mechanism_motor
      );
    }
    
    if (extractedAttributes.aansluitingen) {
      console.log('  aansluitingen (multiselect):');
      console.log('    Type:', typeof extractedAttributes.aansluitingen);
      console.log('    Is array:', Array.isArray(extractedAttributes.aansluitingen));
      console.log('    Length:', extractedAttributes.aansluitingen?.length || 0);
      if (Array.isArray(extractedAttributes.aansluitingen) && extractedAttributes.aansluitingen.length > 0) {
        console.log('    First item has label:', !!extractedAttributes.aansluitingen[0]?.label);
        console.log('    First item has value:', !!extractedAttributes.aansluitingen[0]?.value);
      }
    }
    
    if (extractedAttributes.aantal_compressoren) {
      console.log('  aantal_compressoren (select):');
      console.log('    Type:', typeof extractedAttributes.aantal_compressoren);
      console.log('    Has label:', !!extractedAttributes.aantal_compressoren.label);
      console.log('    Has value:', !!extractedAttributes.aantal_compressoren.value);
    }
    
    console.log('\n🎯 Summary:');
    console.log('If all attributes show proper {label, value} structure, the fix is working!');
    console.log('If not, we need to debug the formatAttributeWithDefinition method.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();