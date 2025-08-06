#!/usr/bin/env node

/**
 * Test script to verify production build behavior
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔨 Building production bundle...');

// Build the production bundle
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    console.error(stderr);
    process.exit(1);
  }

  console.log('✅ Build completed successfully');
  console.log(stdout);

  // Check if source maps were generated
  const distPath = path.join(process.cwd(), 'dist');
  const mapFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.map'));
  
  console.log(`📍 Found ${mapFiles.length} source map files`);
  
  // Look for the main JS file
  const jsFiles = fs.readdirSync(path.join(distPath, 'assets')).filter(file => file.endsWith('.js'));
  console.log(`📦 Found ${jsFiles.length} JavaScript bundles`);

  // Check bundle sizes
  jsFiles.forEach(file => {
    const filePath = path.join(distPath, 'assets', file);
    const stats = fs.statSync(filePath);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file}: ${sizeInKB} KB`);
  });

  console.log('\n🚀 To test the production build locally:');
  console.log('   npm run preview');
  console.log('\n📝 Then check the console for error messages when clicking Import');
});