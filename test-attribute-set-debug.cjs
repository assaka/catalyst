const { Attribute, AttributeSet } = require('./backend/src/models');

(async () => {
  try {
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log('🔍 Debug Attribute Set Matching Issue');
    console.log('====================================');
    
    // Get first attribute set and its details
    const attributeSet = await AttributeSet.findOne({
      where: { store_id: storeId },
      order: [['name', 'ASC']]
    });
    
    if (!attributeSet) {
      console.log('❌ No attribute sets found');
      return;
    }
    
    console.log('📊 Attribute Set Details:');
    console.log('  Name:', attributeSet.name);
    console.log('  ID:', attributeSet.id);
    console.log('  Attribute IDs count:', attributeSet.attribute_ids ? attributeSet.attribute_ids.length : 0);
    
    if (attributeSet.attribute_ids && attributeSet.attribute_ids.length > 0) {
      console.log('  First few attribute IDs in set:', attributeSet.attribute_ids.slice(0, 5));
    }
    
    // Get actual attributes for this store
    const allAttributes = await Attribute.findAll({
      where: { store_id: storeId },
      order: [['name', 'ASC']],
      limit: 10
    });
    
    console.log('\n📊 Sample Attribute Details:');
    allAttributes.forEach((attr, index) => {
      console.log('  ' + (index + 1) + '. Name:', attr.name);
      console.log('     ID:', attr.id);
      console.log('     Code:', attr.code);
      console.log('     Type:', attr.type);
      
      // Check if this attribute ID is in the attribute set
      const isInSet = attributeSet.attribute_ids && attributeSet.attribute_ids.includes(attr.id);
      console.log('     In set:', isInSet);
      console.log('');
    });
    
    // Try to find matching attributes
    if (attributeSet.attribute_ids && attributeSet.attribute_ids.length > 0) {
      console.log('🔍 Looking for matching attributes...');
      const matchingAttributes = allAttributes.filter(attr => 
        attributeSet.attribute_ids.includes(attr.id)
      );
      console.log('  Matching attributes found:', matchingAttributes.length);
      
      if (matchingAttributes.length === 0) {
        console.log('❌ No attributes match the IDs in the attribute set!');
        console.log('   This suggests the attribute_ids in the set are outdated or incorrect');
        
        // Check if the IDs are the wrong format
        console.log('\n🔍 Checking ID formats:');
        console.log('  Attribute set attribute_ids type:', typeof attributeSet.attribute_ids[0]);
        console.log('  Actual attribute id type:', typeof allAttributes[0].id);
        console.log('  First set ID:', attributeSet.attribute_ids[0]);
        console.log('  First actual ID:', allAttributes[0].id);
      }
    }
    
    console.log('\n💡 Recommendations:');
    console.log('1. If attribute IDs in sets are outdated, they need to be updated');
    console.log('2. If ID types don\'t match (string vs UUID), conversion may be needed');
    console.log('3. The fix to show all attributes when no set is selected is still correct');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
})();