/**
 * Test the fixed backend UnifiedDiffService
 */
const UnifiedDiffService = require('./backend/src/services/unified-diff-service');
const fs = require('fs');

console.log('🔍 Testing backend UnifiedDiffService with changes on lines 3 and 48');

// Read the actual Cart.jsx file
const originalContent = fs.readFileSync('./src/pages/Cart.jsx', 'utf8');

// Make changes on line 3 and line 48 (45 lines apart)
const modifiedContent = originalContent
  .replace('import { Link, useNavigate } from \'react-router-dom\';', 'import { aLink, useNavigate } from \'react-router-dom\';')
  .replace('let globalRequestQueue = Promise.resolve();', 'let gglobalRequestQueue = Promise.resolve();');

async function testBackendDiff() {
  console.log('\n📋 Testing backend unified diff generation:');
  console.log('='.repeat(60));

  const result = await UnifiedDiffService.createUnifiedDiff(originalContent, modifiedContent, 'Cart.jsx');
  
  console.log('\n📋 Generated unified diff:');
  console.log('='.repeat(60));
  console.log(result);
  console.log('='.repeat(60));

  // Count hunks
  const hunkMatches = result.match(/@@ -\d+,\d+ \+\d+,\d+ @@/g);
  const hunkCount = hunkMatches ? hunkMatches.length : 0;
  console.log(`\nNumber of hunks: ${hunkCount}`);

  // Analyze the changes
  const originalLines = originalContent.split('\n');
  const modifiedLines = modifiedContent.split('\n');
  const maxLines = Math.max(originalLines.length, modifiedLines.length);

  console.log('\n🔍 Line-by-line analysis:');
  let changeLines = [];
  for (let i = 0; i < maxLines; i++) {
    if (originalLines[i] !== modifiedLines[i]) {
      changeLines.push(i + 1);
      console.log(`Line ${i + 1}: CHANGED`);
      console.log(`  Original: "${originalLines[i] || 'undefined'}"`);
      console.log(`  Modified: "${modifiedLines[i] || 'undefined'}"`);
    }
  }

  console.log(`\nChanges detected on lines: [${changeLines.join(', ')}]`);
  console.log(`Number of changes: ${changeLines.length}`);

  if (changeLines.length >= 2) {
    const separation = Math.abs(changeLines[1] - changeLines[0]);
    console.log(`Separation between changes: ${separation} lines`);
    console.log(`Minimum required separation: 6 lines`);
    console.log(`Should create separate hunks: ${separation > 6 ? 'YES' : 'NO'}`);
  }

  if (hunkCount === 1 && changeLines.length === 2) {
    const separation = Math.abs(changeLines[1] - changeLines[0]);
    if (separation > 6) {
      console.log('\n❌ BUG STILL EXISTS: 2 changes, >6 lines apart, but only 1 hunk created!');
    } else {
      console.log('\n✅ Correct: 2 changes within 6 lines, correctly grouped into 1 hunk');
    }
  } else if (hunkCount > 1) {
    console.log('\n✅ FIXED: Multiple hunks created for distant changes');
  }
}

testBackendDiff().catch(console.error);