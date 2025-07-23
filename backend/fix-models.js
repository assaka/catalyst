#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const modelsDir = './src/models';

// Models that still need fixing (excluding the ones we already fixed)
const modelsToFix = [
  'Attribute.js',
  'AttributeSet.js', 
  'Coupon.js',
  'DeliverySettings.js',
  'OrderItem.js',
  'ShippingMethod.js',
  'Tax.js'
];

console.log('🔧 Fixing remaining model table name configurations...');

modelsToFix.forEach(modelFile => {
  const filePath = path.join(modelsDir, modelFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${modelFile}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern to find split options blocks: }, {\n...}, {\n  tableName:
  const splitPattern = /^}, \{$/gm;
  const matches = content.match(splitPattern);
  
  if (matches && matches.length === 2) {
    console.log(`🔄 Fixing ${modelFile}...`);
    
    // Find the positions of the split
    const firstSplitIndex = content.indexOf('}, {');
    const secondSplitIndex = content.indexOf('}, {', firstSplitIndex + 1);
    const tableNameIndex = content.indexOf('tableName:', secondSplitIndex);
    
    if (firstSplitIndex !== -1 && secondSplitIndex !== -1 && tableNameIndex !== -1) {
      // Extract the parts
      const beforeFirstSplit = content.substring(0, firstSplitIndex);
      const middlePart = content.substring(firstSplitIndex + 4, secondSplitIndex);
      const afterSecondSplit = content.substring(secondSplitIndex + 4);
      
      // Combine into single options object
      const fixed = beforeFirstSplit + '}, {' + afterSecondSplit.substring(0, afterSecondSplit.indexOf('}') + 1) + ',' + middlePart + afterSecondSplit.substring(afterSecondSplit.indexOf('}') + 1);
      
      // Write back
      fs.writeFileSync(filePath, fixed);
      console.log(`✅ Fixed ${modelFile}`);
    } else {
      console.log(`⚠️  Could not find pattern in ${modelFile}`);
    }
  } else {
    console.log(`ℹ️  ${modelFile} doesn't need fixing or has different pattern`);
  }
});

console.log('🎉 Model fixing completed!');