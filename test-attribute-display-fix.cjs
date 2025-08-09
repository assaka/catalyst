const { Attribute, AttributeSet } = require('./backend/src/models');

(async () => {
  try {
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    console.log('🧪 Testing Attribute Display Fix');
    console.log('================================');
    
    // Get all attributes (simulating what Products.jsx does)
    const allAttributes = await Attribute.findAll({
      where: { store_id: storeId },
      order: [['name', 'ASC']]
    });
    
    console.log('📊 Total attributes found:', allAttributes.length);
    
    // Apply the same filtering logic as Products.jsx
    const filteredAttributes = allAttributes.filter(attr => attr.type !== 'image');
    console.log('📊 Filtered attributes (non-image):', filteredAttributes.length);
    
    // Get attribute sets
    const attributeSets = await AttributeSet.findAll({
      where: { store_id: storeId },
      order: [['name', 'ASC']]
    });
    
    console.log('📊 Attribute sets found:', attributeSets.length);
    
    // Test the original logic (before fix)
    console.log('\n🔍 Testing original logic:');
    console.log('When no attribute set is selected (attribute_set_id is empty):');
    const formDataEmpty = { attribute_set_id: "" };
    const selectedAttributeSetOriginal = attributeSets.find(set => set && set.id === formDataEmpty.attribute_set_id);
    const selectedAttributesOriginal = selectedAttributeSetOriginal && selectedAttributeSetOriginal.attribute_ids ?
      filteredAttributes.filter(attr => attr && selectedAttributeSetOriginal.attribute_ids.includes(attr.id)) : [];
    
    console.log('  Selected attribute set:', selectedAttributeSetOriginal ? selectedAttributeSetOriginal.name : 'None');
    console.log('  Selected attributes count (ORIGINAL LOGIC):', selectedAttributesOriginal.length);
    
    // Test the fixed logic
    console.log('\n✅ Testing fixed logic:');
    const selectedAttributesFixed = selectedAttributeSetOriginal && selectedAttributeSetOriginal.attribute_ids ?
      filteredAttributes.filter(attr => attr && selectedAttributeSetOriginal.attribute_ids.includes(attr.id)) :
      // If no attribute set is selected, show all available attributes
      filteredAttributes || [];
    
    console.log('  Selected attributes count (FIXED LOGIC):', selectedAttributesFixed.length);
    
    // Test with an actual attribute set
    if (attributeSets.length > 0) {
      console.log('\n🔍 Testing with first attribute set:');
      const firstAttributeSet = attributeSets[0];
      console.log('  Attribute set name:', firstAttributeSet.name);
      console.log('  Attribute set ID:', firstAttributeSet.id);
      console.log('  Attribute IDs in set:', firstAttributeSet.attribute_ids ? firstAttributeSet.attribute_ids.length : 0);
      
      const formDataWithSet = { attribute_set_id: firstAttributeSet.id };
      const selectedAttributeSetWithSet = attributeSets.find(set => set && set.id === formDataWithSet.attribute_set_id);
      const selectedAttributesWithSet = selectedAttributeSetWithSet && selectedAttributeSetWithSet.attribute_ids ?
        filteredAttributes.filter(attr => attr && selectedAttributeSetWithSet.attribute_ids.includes(attr.id)) :
        filteredAttributes || [];
      
      console.log('  Attributes shown with this set:', selectedAttributesWithSet.length);
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Original logic: When no attribute set is selected, 0 attributes are shown');
    console.log('- Fixed logic: When no attribute set is selected,', filteredAttributes.length, 'attributes are shown');
    console.log('\n✅ This fix should resolve the issue where attributes disappear when no attribute set is selected!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
})();