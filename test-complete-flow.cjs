const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

// Test the complete attribute extraction flow to find where it breaks
(async () => {
  try {
    console.log('🧪 Testing Complete Attribute Extraction Flow');
    console.log('============================================');
    
    const mapping = new AkeneoMapping();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Simulate exact Akeneo product data structure with select and multiselect attributes
    const testProductValues = {
      // Multiselect attribute that exists in database
      aansluitingen: [
        { data: 'HDMI-aansluiting', locale: 'en_US', scope: null },
        { data: 'DisplayPort-aansluiting', locale: 'en_US', scope: null }
      ],
      // Select attribute (let's try a different one that actually exists)
      drive_mechanism_motor: [
        { data: 'Koolborstelloos', locale: 'en_US', scope: null }
      ],
      // Regular text attribute for comparison
      description: [
        { data: 'This is a test product description', locale: 'en_US', scope: null }
      ]
    };
    
    console.log('\n1. Input test data:');
    console.log(JSON.stringify(testProductValues, null, 2));
    
    console.log('\n2. Running extractAllAttributes...');
    
    // Add debug logging to see what's happening step by step
    const originalLog = console.log;
    const debugLogs = [];
    console.log = (...args) => {
      const message = args.join(' ');
      debugLogs.push(message);
      originalLog(...args);
    };
    
    const result = await mapping.extractAllAttributes(
      testProductValues,
      'en_US',
      storeId,
      null
    );
    
    // Restore original console.log
    console.log = originalLog;
    
    console.log('\n📊 Final extraction result:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n✅ Analysis:');
    
    // Check aansluitingen (multiselect)
    if (result.aansluitingen) {
      console.log('  aansluitingen (multiselect):');
      console.log('    Type:', typeof result.aansluitingen);
      console.log('    Is array:', Array.isArray(result.aansluitingen));
      console.log('    Value:', JSON.stringify(result.aansluitingen));
      
      if (Array.isArray(result.aansluitingen) && result.aansluitingen.length > 0) {
        console.log('    First item structure:', typeof result.aansluitingen[0]);
        console.log('    First item has label:', !!result.aansluitingen[0]?.label);
        console.log('    First item has value:', !!result.aansluitingen[0]?.value);
        console.log('    ✅ CORRECT multiselect format!');
      } else {
        console.log('    ❌ INCORRECT multiselect format!');
      }
    } else {
      console.log('  aansluitingen: NOT FOUND in result');
    }
    
    // Check drive_mechanism_motor (select)
    if (result.drive_mechanism_motor) {
      console.log('  drive_mechanism_motor (select):');
      console.log('    Type:', typeof result.drive_mechanism_motor);
      console.log('    Value:', JSON.stringify(result.drive_mechanism_motor));
      console.log('    Has label:', !!result.drive_mechanism_motor?.label);
      console.log('    Has value:', !!result.drive_mechanism_motor?.value);
      
      if (result.drive_mechanism_motor?.label && result.drive_mechanism_motor?.value) {
        console.log('    ✅ CORRECT select format!');
      } else {
        console.log('    ❌ INCORRECT select format!');
      }
    } else {
      console.log('  drive_mechanism_motor: NOT FOUND in result');
    }
    
    // Check description (regular attribute)
    if (result.description) {
      console.log('  description (text):');
      console.log('    Type:', typeof result.description);
      console.log('    Value:', result.description);
      console.log('    ✅ Regular attribute preserved correctly');
    }
    
    console.log('\n🎯 If the select/multiselect attributes show INCORRECT format, that confirms the bug!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();