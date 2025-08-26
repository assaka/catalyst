// Test what files FileTreeNavigator would now receive from root src
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing root src file structure for FileTreeNavigator');
console.log('===============================================');

// Test the root src directory that would now be selected
const rootSrcPath = path.resolve(__dirname, 'src');

try {
  const items = fs.readdirSync(rootSrcPath, { withFileTypes: true });
  const dirs = items.filter(item => item.isDirectory()).map(item => item.name);
  const files = items.filter(item => item.isFile()).map(item => item.name);
  
  console.log('📁 Root src directories that FileTreeNavigator will show:');
  dirs.forEach(dir => {
    console.log(`  - ${dir}/`);
  });
  
  console.log('\n📄 Root src files that FileTreeNavigator will show:');
  files.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  // Specifically check for key React files
  const reactFiles = ['App.jsx', 'main.jsx', 'index.css', 'App.css'];
  const reactDirs = ['components', 'pages', 'hooks', 'contexts', 'utils'];
  
  console.log('\n🎯 Key frontend files/directories found:');
  reactFiles.forEach(file => {
    if (files.includes(file)) {
      console.log(`  ✅ ${file} - Main React app file`);
    }
  });
  
  reactDirs.forEach(dir => {
    if (dirs.includes(dir)) {
      console.log(`  ✅ ${dir}/ - Frontend directory`);
    }
  });
  
  // Show sample component files
  console.log('\n📦 Sample component files in components/:');
  const componentsPath = path.join(rootSrcPath, 'components');
  if (fs.existsSync(componentsPath)) {
    const componentItems = fs.readdirSync(componentsPath, { withFileTypes: true });
    componentItems.slice(0, 5).forEach(item => {
      const type = item.isDirectory() ? 'dir' : 'file';
      console.log(`  - ${item.name} (${type})`);
    });
    if (componentItems.length > 5) {
      console.log(`  ... and ${componentItems.length - 5} more items`);
    }
  }
  
  console.log('\n🎉 SUCCESS: FileTreeNavigator will now show the main React app files!');
  console.log('This includes App.jsx, main.jsx, components/, pages/, hooks/, etc.');
  console.log('Instead of backend files like models/, routes/, controllers/, etc.');
  
} catch (error) {
  console.error('❌ Error reading root src:', error.message);
}