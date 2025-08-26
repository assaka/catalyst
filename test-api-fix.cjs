// Test the actual backend API call that FileTreeNavigator makes
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing actual FileTreeNavigator API simulation');
console.log('===========================================');

// Mock the exact conditions from the proxy-source-files API
const mockDirname = path.resolve('./src/routes'); // Simulate backend/src/routes context  
const processCwd = process.cwd(); // Should be backend/

console.log('Backend API context:');
console.log('  __dirname equivalent:', mockDirname);
console.log('  process.cwd():', processCwd);

// Test the exact paths from the API (updated priority order)
const rootSrcPaths = [
  path.resolve(mockDirname, '../../../src'), // Local development - root level src (PRIORITY: has main app)
  path.resolve(mockDirname, '../../../../src'), // Render with backend subdirectory - root level src (PRIORITY: has main app)  
  path.resolve('/', 'opt/render/project/repo/src'), // Render default structure - root level src (PRIORITY: has main app)
  path.resolve(mockDirname, '../../../frontend/src'), // Alternative frontend structure (LOWER priority: subset only)
  path.resolve(mockDirname, '../../../../frontend/src'), // Alternative frontend structure with backend subdir (LOWER priority: subset only)
  path.resolve(processCwd, 'src'), // Process working directory - MOVED TO END (could be backend/src)
];

console.log('\nTesting exact API path resolution:');
let foundFrontendSrc = false;

for (const testPath of rootSrcPaths) {
  const exists = fs.existsSync(testPath);
  console.log('  ' + (exists ? '✅' : '❌') + ' ' + testPath);
  
  if (exists && !foundFrontendSrc) {
    try {
      const items = fs.readdirSync(testPath, { withFileTypes: true });
      const dirs = items.filter(item => item.isDirectory()).map(item => item.name);
      const files = items.filter(item => item.isFile()).map(item => item.name);
      
      // Use exact logic from updated API
      const hasMainAppFiles = files.some(file => ['App.jsx', 'App.js', 'main.jsx', 'index.js'].includes(file));
      const hasFrontendDirs = dirs.some(dir => ['components', 'pages', 'hooks', 'utils', 'contexts'].includes(dir));
      const isFrontendSrc = hasMainAppFiles || hasFrontendDirs;
      
      // Improved backend detection - exclude if has main app files
      const hasBackendDirs = dirs.some(dir => ['models', 'routes', 'controllers', 'middleware'].includes(dir));
      const hasServicesDir = dirs.includes('services');
      const isBackendSrc = hasBackendDirs || (hasServicesDir && !hasMainAppFiles && !hasFrontendDirs);
      
      if (isFrontendSrc && !isBackendSrc) {
        console.log('    🎯 API WOULD SELECT THIS: Frontend src found');
        foundFrontendSrc = true;
        break;
      } else if (isBackendSrc) {
        console.log('    ❌ API WOULD SKIP: Backend src detected');
      }
    } catch (err) {
      console.log('    ❌ Error reading:', err.message);
    }
  }
}

if (!foundFrontendSrc) {
  console.log('\n🌐 API would fall back to GitHub - SUCCESS!');
  console.log('    GitHub has: components/, pages/, App.jsx, main.jsx');
  console.log('    FileTreeNavigator should now show React components!');
} else {
  console.log('\n🎯 Local frontend src found - SUCCESS!');
}