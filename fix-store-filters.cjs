#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Store.filter() calls in frontend...');

// Get all files with Store.filter calls
const grepOutput = execSync('cd src && grep -r "Store\\.filter" --include="*.jsx" --include="*.js" -l .', { encoding: 'utf8' });
const files = grepOutput.trim().split('\n').filter(f => f.trim() !== '');

console.log(`Found ${files.length} files with Store.filter() calls:`);

files.forEach(file => {
  const fullPath = path.join('src', file);
  console.log(`\n🔄 Processing: ${file}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Pattern 1: Store.filter({ owner_email: ... })
  const ownerEmailPattern = /Store\.filter\(\{\s*owner_email:\s*[^}]+\}\)/g;
  if (ownerEmailPattern.test(content)) {
    content = content.replace(ownerEmailPattern, 'Store.findAll()');
    modified = true;
    console.log('  ✅ Fixed owner_email filter');
  }
  
  // Pattern 2: Store.filter({ owner_id: ... })
  const ownerIdPattern = /Store\.filter\(\{\s*owner_id:\s*[^}]+\}\)/g;
  if (ownerIdPattern.test(content)) {
    content = content.replace(ownerIdPattern, 'Store.findAll()');
    modified = true;
    console.log('  ✅ Fixed owner_id filter');
  }
  
  // Don't modify slug-based filters (they're for public storefront)
  const slugPattern = /Store\.filter\(\{\s*slug:/;
  if (slugPattern.test(content)) {
    console.log('  ℹ️  Skipped slug-based filter (storefront use)');
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`  💾 Updated: ${file}`);
  } else {
    console.log('  ℹ️  No changes needed');
  }
});

console.log('\n🎉 Store.filter() fix completed!');