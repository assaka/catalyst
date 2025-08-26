const fs = require('fs');
const path = require('path');

console.log('🔍 Testing deployment architecture for FileTreeNavigator issue');
console.log('===========================================================');

// Simulate the backend path resolution logic from proxy-source-files.js
function testPathResolution() {
  console.log('\n📍 Current environment details:');
  console.log('  Backend __dirname equivalent:', path.resolve(__dirname));
  console.log('  process.cwd():', process.cwd());
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
  
  // Test the path resolution logic from the API
  console.log('\n📂 Testing path resolution for "src" directory...');
  
  // This simulates the exact path resolution from fetchAllFilesLocallyRecursive()
  const rootSrcPaths = [
    path.resolve(__dirname, '../../../src'), // Local development - root level src
    path.resolve(__dirname, '../../../../src'), // Render with backend subdirectory - root level src  
    path.resolve(process.cwd(), 'src'), // Process working directory - root level src
    path.resolve('/', 'opt/render/project/repo/src'), // Render default structure - root level src
    path.resolve(__dirname, '../../../frontend/src'), // Alternative frontend structure
    path.resolve(__dirname, '../../../../frontend/src'), // Alternative frontend structure with backend subdir
  ];
  
  console.log('  Testing prioritized root src paths:');
  let foundRootSrc = false;
  for (const testPath of rootSrcPaths) {
    const exists = fs.existsSync(testPath);
    console.log('    ' + (exists ? '✅' : '❌') + ' ' + testPath);
    
    if (exists && !foundRootSrc) {
      try {
        const items = fs.readdirSync(testPath, { withFileTypes: true });
        const files = items.filter(item => item.isFile()).map(item => item.name);
        const dirs = items.filter(item => item.isDirectory()).map(item => item.name);
        console.log('      📁 Directories found:', dirs.slice(0, 5).join(', ') + (dirs.length > 5 ? '...' : ''));
        console.log('      📄 Files found:', files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
        
        // Check if this looks like frontend src (has components, pages, etc)
        const isFrontendSrc = dirs.some(dir => ['components', 'pages', 'hooks', 'utils', 'contexts'].includes(dir)) ||
                             files.some(file => ['App.jsx', 'App.js', 'index.js', 'main.jsx'].includes(file));
                             
        // Check if this looks like backend src (has models, routes, etc)
        const isBackendSrc = dirs.some(dir => ['models', 'routes', 'controllers', 'middleware', 'services'].includes(dir));
        
        if (isFrontendSrc && !isBackendSrc) {
          console.log('      🎨 This appears to be FRONTEND src (has components/pages/App.jsx)');
          console.log('      🎯 This would be the SELECTED path for FileTreeNavigator');
          foundRootSrc = true;
        } else if (isBackendSrc) {
          console.log('      🏗️ This appears to be BACKEND src (has models/routes/etc) - SKIPPING');
        } else {
          console.log('      🤔 This path exists but does not look like frontend src');
        }
      } catch (err) {
        console.log('      ❌ Error reading directory:', err.message);
      }
    }
  }
  
  if (!foundRootSrc) {
    console.log('\n⚠️  No frontend root src found, checking fallback paths...');
    
    // Test fallback paths (including backend/src)
    const fallbackPaths = [
      path.resolve(__dirname, '../../../', 'src'), // General fallback
      path.resolve(__dirname, '../../../../', 'src'), // Render fallback
      path.resolve(__dirname, '../', 'src'), // backend/src as final fallback
      path.resolve(__dirname, '../../', 'src') // Another backend/src fallback
    ];
    
    for (const testPath of fallbackPaths) {
      const exists = fs.existsSync(testPath);
      console.log('    ' + (exists ? '⚠️' : '❌') + ' ' + testPath);
      
      if (exists) {
        try {
          const items = fs.readdirSync(testPath, { withFileTypes: true });
          const files = items.filter(item => item.isFile()).map(item => item.name);
          const dirs = items.filter(item => item.isDirectory()).map(item => item.name);
          console.log('      📁 Directories:', dirs.slice(0, 5).join(', '));
          console.log('      📄 Files:', files.slice(0, 5).join(', '));
          
          // Check if this looks like backend src (has models, routes, etc)
          const isBackendSrc = dirs.some(dir => ['models', 'routes', 'controllers', 'middleware', 'services'].includes(dir));
          if (isBackendSrc) {
            console.log('      🏗️ This appears to be BACKEND src (has models/routes/etc)');
            console.log('      💥 PROBLEM: FileTreeNavigator would show THIS instead of frontend files!');
            break;
          } else {
            console.log('      🎨 This appears to be FRONTEND src');
          }
        } catch (err) {
          console.log('      ❌ Error reading directory:', err.message);
        }
      }
    }
  }
}

testPathResolution();

console.log('\n🔧 Testing GitHub fallback (what API should do if local fails)...');
console.log('GitHub raw URL would be: https://raw.githubusercontent.com/assaka/catalyst/main/src');
console.log('This should contain the frontend React files.');

// Test the actual GitHub fallback
console.log('\n🌐 Testing GitHub API fallback...');
async function testGitHubFallback() {
  try {
    const response = await fetch('https://api.github.com/repos/assaka/catalyst/contents/src?ref=main', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Catalyst-Test'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GitHub API accessible, found', data.length, 'items in /src');
      
      const dirs = data.filter(item => item.type === 'dir').map(item => item.name);
      const files = data.filter(item => item.type === 'file').map(item => item.name);
      
      console.log('  📁 GitHub /src directories:', dirs.slice(0, 5).join(', '));
      console.log('  📄 GitHub /src files:', files.slice(0, 5).join(', '));
      
      const isFrontendSrc = dirs.some(dir => ['components', 'pages', 'hooks', 'utils', 'contexts'].includes(dir)) ||
                           files.some(file => ['App.jsx', 'App.js', 'index.js', 'main.jsx'].includes(file));
      
      if (isFrontendSrc) {
        console.log('  🎨 GitHub /src appears to be FRONTEND src - this is what FileTreeNavigator should show!');
      } else {
        console.log('  🏗️ GitHub /src appears to be backend src');
      }
    } else {
      console.log('❌ GitHub API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ GitHub API error:', error.message);
  }
}

testGitHubFallback();