const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

// Debug the specific issue with attribute processing
(async () => {
  try {
    console.log('🔍 Debugging Attribute Processing Issue');
    console.log('=====================================');
    
    const mapping = new AkeneoMapping();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Test 1: Check if extractProductValues works correctly for multiselect
    console.log('\n1. Testing extractProductValues for multiselect...');
    const multiselectValues = {
      aansluitingen: [
        { data: 'HDMI-aansluiting', locale: 'en_US', scope: null },
        { data: 'DisplayPort-aansluiting', locale: 'en_US', scope: null }
      ]
    };
    
    const extractedMultiValues = mapping.extractProductValues(multiselectValues, 'aansluitingen', 'en_US');
    console.log('   extractProductValues result:', JSON.stringify(extractedMultiValues, null, 2));
    console.log('   Is array:', Array.isArray(extractedMultiValues));
    console.log('   Length:', extractedMultiValues?.length);
    
    // Test 2: Check extractProductValue for single select  
    console.log('\n2. Testing extractProductValue for single select...');
    const selectValues = {
      aantal_compressoren: [
        { data: '2 compressors', locale: 'en_US', scope: null }
      ]
    };
    
    const extractedSingleValue = mapping.extractProductValue(selectValues, 'aantal_compressoren', 'en_US');
    console.log('   extractProductValue result:', JSON.stringify(extractedSingleValue, null, 2));
    console.log('   Type:', typeof extractedSingleValue);
    
    // Test 3: Check database attribute lookup
    console.log('\n3. Testing database attribute lookup...');
    const { Attribute } = require('./backend/src/models');
    
    const dbAttributes = await Attribute.findAll({
      where: { store_id: storeId },
      attributes: ['code', 'type', 'options']
    });
    
    console.log('   Database attributes found:', dbAttributes.length);
    
    // Find our test attributes
    const aansluiting = dbAttributes.find(attr => attr.code === 'aansluitingen');
    const compressors = dbAttributes.find(attr => attr.code === 'aantal_compressoren');
    
    if (aansluiting) {
      console.log('   aansluitingen attribute:');
      console.log('     Type:', aansluiting.type);
      console.log('     Options count:', aansluiting.options?.length || 0);
    }
    
    if (compressors) {
      console.log('   aantal_compressoren attribute:');
      console.log('     Type:', compressors.type);
      console.log('     Options count:', compressors.options?.length || 0);
    }
    
    // Test 4: Manually test formatAttributeWithDefinition
    console.log('\n4. Testing formatAttributeWithDefinition...');
    
    if (aansluiting && extractedMultiValues) {
      console.log('   Testing multiselect formatting...');
      const formattedMulti = mapping.formatAttributeWithDefinition(extractedMultiValues, {
        type: aansluiting.type,
        options: aansluiting.options
      });
      console.log('   Formatted multiselect result:', JSON.stringify(formattedMulti, null, 2));
    }
    
    if (compressors && extractedSingleValue) {
      console.log('   Testing select formatting...');
      const formattedSingle = mapping.formatAttributeWithDefinition(extractedSingleValue, {
        type: compressors.type,
        options: compressors.options
      });
      console.log('   Formatted select result:', JSON.stringify(formattedSingle, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();