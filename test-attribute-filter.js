const { Attribute } = require('./backend/src/models');

(async () => {
  try {
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Get all non-image attributes for the store to simulate the filtering
    const allAttributes = await Attribute.findAll({
      where: { store_id: storeId },
      order: [['name', 'ASC']]
    });
    
    console.log('🔍 Testing Attribute Filtering Logic');
    console.log('=====================================');
    console.log('All attributes count:', allAttributes.length);
    
    // Test the same filtering logic used in Products.jsx
    const filteredAttributes = allAttributes.filter(attr => attr.type !== 'image');
    console.log('Filtered attributes (not image) count:', filteredAttributes.length);
    
    // Check if we have any image attributes at all
    const imageAttributes = allAttributes.filter(attr => attr.type === 'image');
    console.log('Image attributes count:', imageAttributes.length);
    
    // Show attribute types breakdown
    const typeBreakdown = {};
    allAttributes.forEach(attr => {
      typeBreakdown[attr.type] = (typeBreakdown[attr.type] || 0) + 1;
    });
    
    console.log('\n📊 Attribute types breakdown:');
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log('  -', type + ':', count);
    });
    
    // Show first few filtered attributes to confirm they have proper structure
    console.log('\n📋 First 5 filtered attributes:');
    filteredAttributes.slice(0, 5).forEach((attr, index) => {
      console.log('  ' + (index + 1) + '. Name:', attr.name, 'Type:', attr.type, 'Code:', attr.code);
      console.log('       Options count:', attr.options ? attr.options.length : 0);
    });
    
    // Check select and multiselect attributes specifically
    const selectAttrs = filteredAttributes.filter(attr => attr.type === 'select');
    const multiselectAttrs = filteredAttributes.filter(attr => attr.type === 'multiselect');
    
    console.log('\n🎯 Key attribute types for forms:');
    console.log('- Select attributes:', selectAttrs.length);
    console.log('- Multiselect attributes:', multiselectAttrs.length);
    
    if (selectAttrs.length > 0) {
      console.log('\n📋 Select attributes:');
      selectAttrs.slice(0, 3).forEach(attr => {
        console.log('  - Name:', attr.name, 'Code:', attr.code);
        console.log('    Options:', attr.options ? attr.options.length : 0);
        if (attr.options && attr.options.length > 0) {
          console.log('    First option:', JSON.stringify(attr.options[0]));
        }
      });
    }
    
    if (multiselectAttrs.length > 0) {
      console.log('\n📋 Multiselect attributes:');
      multiselectAttrs.slice(0, 3).forEach(attr => {
        console.log('  - Name:', attr.name, 'Code:', attr.code);
        console.log('    Options:', attr.options ? attr.options.length : 0);
        if (attr.options && attr.options.length > 0) {
          console.log('    First option:', JSON.stringify(attr.options[0]));
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
})();