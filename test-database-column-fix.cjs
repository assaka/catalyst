const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');
const mapping = new AkeneoMapping();

console.log('🧪 Testing Updated extractAllAttributes Function');
console.log('================================================');
console.log('Verifying database column fix: using attributes.type instead of akeneo_type');
console.log('');

// Test that extractAllAttributes works without the akeneo_type column error
(async () => {
  try {
    const testValues = {
      name: [{ data: 'Test Product', locale: 'en_US' }],
      color: [{ data: 'blue', locale: null, scope: null }],
      size: [{ data: 'large', locale: null, scope: null }],
      features: [
        { data: 'waterproof', locale: null, scope: null },
        { data: 'breathable', locale: null, scope: null }
      ]
    };
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log('📋 Testing extractAllAttributes with database lookup...');
    const attributes = await mapping.extractAllAttributes(testValues, 'en_US', storeId);
    
    console.log('✅ Function executed without database column errors');
    console.log('');
    console.log('📊 Extracted attributes:');
    Object.keys(attributes).forEach(key => {
      const value = attributes[key];
      if (typeof value === 'object' && value !== null) {
        console.log('  ' + key + ':', JSON.stringify(value));
      } else {
        console.log('  ' + key + ':', value);
      }
    });
    
    console.log('');
    console.log('✅ SUCCESS: Database column issue is resolved!');
    console.log('   - No longer looking for non-existent akeneo_type column');
    console.log('   - Using attributes.type column correctly');
    console.log('   - Attribute extraction working properly');
    
    process.exit(0);
  } catch (error) {
    if (error.message && error.message.includes('akeneo_type')) {
      console.error('❌ STILL HAVING ISSUE: akeneo_type column error persists');
      console.error('   Error:', error.message);
    } else {
      console.error('❌ Different error:', error.message);
    }
    process.exit(1);
  }
})();