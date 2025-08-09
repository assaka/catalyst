const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const { Attribute } = require('./backend/src/models');

// Test the attribute option processing with real database data
(async () => {
  try {
    console.log('🧪 Testing Real Attribute Processing with Database Data');
    console.log('===================================================');
    
    const mapping = new AkeneoMapping();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Get real multiselect attribute from database
    const multiselectAttr = await Attribute.findOne({
      where: { 
        store_id: storeId,
        type: 'multiselect',
        code: 'aansluitingen'
      }
    });
    
    console.log('\n1. Real multiselect attribute from database:');
    if (multiselectAttr) {
      console.log('   Name:', multiselectAttr.name);
      console.log('   Code:', multiselectAttr.code);
      console.log('   Type:', multiselectAttr.type);
      console.log('   Options count:', multiselectAttr.options?.length || 0);
      
      if (multiselectAttr.options && multiselectAttr.options.length > 0) {
        console.log('   First few options:');
        multiselectAttr.options.slice(0, 3).forEach(opt => {
          console.log('     - Label:', opt.label, 'Value:', opt.value);
        });
      }
    }
    
    // Get real select attribute from database
    const selectAttr = await Attribute.findOne({
      where: { 
        store_id: storeId,
        type: 'select',
        code: 'aantal_compressoren'
      }
    });
    
    console.log('\n2. Real select attribute from database:');
    if (selectAttr) {
      console.log('   Name:', selectAttr.name);
      console.log('   Code:', selectAttr.code);
      console.log('   Type:', selectAttr.type);
      console.log('   Options count:', selectAttr.options?.length || 0);
      
      if (selectAttr.options && selectAttr.options.length > 0) {
        console.log('   Options:');
        selectAttr.options.forEach(opt => {
          console.log('     - Label:', opt.label, 'Value:', opt.value);
        });
      }
    }
    
    // Test 3: Test the actual processing logic
    console.log('\n3. Testing formatAttributeWithDefinition with real data...');
    
    if (multiselectAttr) {
      console.log('   Testing multiselect formatting...');
      const testMultiValues = ['HDMI-aansluiting', 'DisplayPort-aansluiting'];
      const formattedMulti = mapping.formatAttributeWithDefinition(testMultiValues, {
        type: multiselectAttr.type,
        options: multiselectAttr.options
      });
      console.log('   Input:', JSON.stringify(testMultiValues));
      console.log('   Formatted result:', JSON.stringify(formattedMulti, null, 2));
      console.log('   Is array:', Array.isArray(formattedMulti));
    }
    
    if (selectAttr) {
      console.log('   Testing select formatting...');
      const testSelectValue = '2 compressors';
      const formattedSelect = mapping.formatAttributeWithDefinition(testSelectValue, {
        type: selectAttr.type,
        options: selectAttr.options
      });
      console.log('   Input:', JSON.stringify(testSelectValue));
      console.log('   Formatted result:', JSON.stringify(formattedSelect, null, 2));
      console.log('   Has label:', !!formattedSelect?.label);
      console.log('   Has value:', !!formattedSelect?.value);
    }
    
    console.log('\n🎯 This should show us exactly where the formatting is failing!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();