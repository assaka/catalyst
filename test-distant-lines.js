/**
 * Test changes on line 3 and line 48 (45 lines apart)
 */
import UnifiedDiffFrontendService from './src/services/unified-diff-frontend-service.js';
import fs from 'fs';

console.log('🔍 DEBUG: Testing changes on line 3 and line 48 (45 lines apart)');

// Read the actual Cart.jsx file
const originalContent = fs.readFileSync('./src/pages/Cart.jsx', 'utf8');

// Make changes on line 3 and line 48
const modifiedContent = originalContent
  .replace('import { Link, useNavigate } from \'react-router-dom\';', 'import { aLink, useNavigate } from \'react-router-dom\';')
  .replace('let globalRequestQueue = Promise.resolve();', 'let gglobalRequestQueue = Promise.resolve();');

const diffService = new UnifiedDiffFrontendService();
const result = diffService.createDiff(originalContent, modifiedContent, {
  filename: 'Cart.jsx'
});

console.log('\n📋 Generated unified diff:');
console.log('='.repeat(60));
console.log(result.unifiedDiff);
console.log('='.repeat(60));
console.log(`Number of hunks: ${result.parsedDiff.length}`);

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

if (result.parsedDiff.length === 1 && changeLines.length === 2) {
  const separation = Math.abs(changeLines[1] - changeLines[0]);
  if (separation > 6) {
    console.log('\n❌ BUG: 2 changes, >6 lines apart, but only 1 hunk created!');
  } else {
    console.log('\n✅ Correct: 2 changes within 6 lines, correctly grouped into 1 hunk');
  }
} else if (result.parsedDiff.length > 1) {
  console.log('\n✅ Working correctly: Multiple hunks created for distant changes');
}