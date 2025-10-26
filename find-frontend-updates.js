#!/usr/bin/env node

/**
 * Frontend API Call Finder
 *
 * This script scans your frontend code to find API calls that need
 * to be updated for the new structured response format.
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'src');
const API_PATTERNS = [
  '/api/public/categories',
  '/api/public/products'
];

const findings = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for API calls
    API_PATTERNS.forEach(pattern => {
      if (line.includes(pattern)) {
        findings.push({
          file: filePath.replace(__dirname, '.'),
          line: index + 1,
          code: line.trim(),
          type: 'API_CALL',
          pattern
        });
      }
    });

    // Check for direct json() usage
    if (line.match(/\.json\(\)\.then.*\.(map|forEach|filter|find)/)) {
      findings.push({
        file: filePath.replace(__dirname, '.'),
        line: index + 1,
        code: line.trim(),
        type: 'ARRAY_OPERATION',
        suggestion: 'Add .data accessor'
      });
    }

    // Check for response assignment
    if (line.match(/const \w+ = .*\.json\(\)/)) {
      findings.push({
        file: filePath.replace(__dirname, '.'),
        line: index + 1,
        code: line.trim(),
        type: 'DIRECT_ASSIGNMENT',
        suggestion: 'Destructure { data } from response'
      });
    }
  });
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    console.log('Skipping frontend scan (run this from project root)');
    return;
  }

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'build' && file !== 'dist') {
        scanDirectory(fullPath);
      }
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      scanFile(fullPath);
    }
  });
}

console.log('🔍 Scanning frontend code for API calls that need updates...\n');

if (fs.existsSync(FRONTEND_DIR)) {
  scanDirectory(FRONTEND_DIR);

  if (findings.length === 0) {
    console.log('✅ No API calls found (or frontend already updated)');
  } else {
    console.log(`📋 Found ${findings.length} potential updates needed:\n`);

    // Group by file
    const byFile = {};
    findings.forEach(f => {
      if (!byFile[f.file]) byFile[f.file] = [];
      byFile[f.file].push(f);
    });

    Object.entries(byFile).forEach(([file, items]) => {
      console.log(`\n📄 ${file}`);
      items.forEach(item => {
        console.log(`  Line ${item.line}: [${item.type}]`);
        console.log(`    ${item.code}`);
        if (item.suggestion) {
          console.log(`    💡 ${item.suggestion}`);
        }
      });
    });

    console.log('\n📖 See frontend-migration-guide.md for update instructions');
  }
} else {
  console.log('ℹ️  Frontend directory not found at:', FRONTEND_DIR);
  console.log('Run this script from the project root directory');
}

console.log('\n✨ Scan complete!');
