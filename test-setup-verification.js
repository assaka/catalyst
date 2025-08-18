#!/usr/bin/env node

/**
 * Pre-commit test setup verification
 * Checks for common API debugging and setup issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Running pre-commit API debugging checks...');

let hasIssues = false;

// Check for console.log statements in production code (excluding test files)
function checkConsoleLogsInProduction() {
  const srcDir = path.join(__dirname, 'src');
  const backendDir = path.join(__dirname, 'backend/src');
  
  function checkDirectory(dir, dirName) {
    if (!fs.existsSync(dir)) return;
    
    function checkFile(filePath) {
      if (filePath.includes('.test.') || filePath.includes('.spec.')) return;
      if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('console.log') && !line.trim().startsWith('//')) {
            console.log(`⚠️  Console.log found in ${dirName}/${path.relative(dir, filePath)}:${index + 1}`);
            hasIssues = true;
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    function walkDirectory(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDirectory(fullPath);
        } else if (stat.isFile()) {
          checkFile(fullPath);
        }
      }
    }
    
    walkDirectory(dir);
  }
  
  checkDirectory(srcDir, 'src');
  checkDirectory(backendDir, 'backend/src');
}

// Check for hardcoded URLs or API endpoints that might cause issues
function checkHardcodedUrls() {
  const files = [
    'src/api/client.js',
    'src/utils/urlUtils.js'
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for localhost hardcoding in production
      if (content.includes('localhost') && !content.includes('development')) {
        console.log(`⚠️  Hardcoded localhost found in ${file}`);
        hasIssues = true;
      }
      
      // Check for missing environment variable handling
      if (content.includes('process.env') && !content.includes('||')) {
        console.log(`ℹ️  Environment variables in ${file} - ensure fallbacks are in place`);
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
}

// Check AI Context Window specific setup
function checkAIContextWindowSetup() {
  const requiredFiles = [
    'src/components/ai-context/FileTreeNavigator.jsx',
    'src/components/ai-context/CodeEditor.jsx',
    'src/components/ai-context/AIContextWindow.jsx',
    'src/components/ai-context/PreviewSystem.jsx',
    'src/pages/AIContextWindow.jsx',
    'backend/src/routes/ai-context.js',
    'backend/src/services/ast-analyzer.js',
    'backend/src/services/json-patch-service.js',
    'backend/src/services/conflict-detector.js'
  ];
  
  let missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing AI Context Window files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    hasIssues = true;
  } else {
    console.log('✅ All AI Context Window files present');
  }
}

// Run all checks
checkConsoleLogsInProduction();
checkHardcodedUrls();
checkAIContextWindowSetup();

if (hasIssues) {
  console.log('\n❌ Pre-commit verification found issues. Please review and fix before committing.');
  process.exit(1);
} else {
  console.log('\n✅ Pre-commit verification passed!');
  process.exit(0);
}