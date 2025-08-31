/**
 * Demonstrate dynamic Cart.jsx changes by temporarily modifying the file
 * This shows what the patch system would achieve
 */

const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src', 'pages', 'Cart.jsx');
const BACKUP_PATH = path.join(__dirname, 'src', 'pages', 'Cart.jsx.backup');

function createBackup() {
  const originalCode = readFileSync(FILE_PATH, 'utf8');
  writeFileSync(BACKUP_PATH, originalCode, 'utf8');
  console.log('📦 Created backup of original Cart.jsx');
  return originalCode;
}

function restoreBackup() {
  if (require('fs').existsSync(BACKUP_PATH)) {
    const backupCode = readFileSync(BACKUP_PATH, 'utf8');
    writeFileSync(FILE_PATH, backupCode, 'utf8');
    require('fs').unlinkSync(BACKUP_PATH);
    console.log('🔄 Restored original Cart.jsx from backup');
    return true;
  }
  return false;
}

function applyDynamicChanges() {
  console.log('🎨 Applying dynamic changes to Cart.jsx...');
  
  const originalCode = createBackup();
  
  // Create the dynamic banner
  const dynamicBanner = `
                {/* Dynamic Welcome Banner - Added via Patch System Simulation */}
                <div className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 rounded-xl shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 flex items-center">
                                🛒 Welcome to Your Enhanced Cart! 
                                <span className="ml-2 text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full animate-pulse">DYNAMIC</span>
                            </h2>
                            <p className="text-sm opacity-90 mb-2">
                                This colorful banner was added dynamically via the patch system!
                            </p>
                            <div className="flex space-x-2">
                                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">✨ Enhanced</span>
                                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">🎨 Styled</span>
                                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">🚀 Dynamic</span>
                            </div>
                        </div>
                        <div className="text-4xl animate-bounce">✨</div>
                    </div>
                </div>`;
  
  // Find and replace the title with enhanced version
  const titlePattern = /<h1 className="text-3xl font-bold text-gray-900 mb-8">My Cart<\/h1>/;
  let modifiedCode = originalCode.replace(
    titlePattern,
    `<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">🎉 My Enhanced Cart</h1>${dynamicBanner}`
  );
  
  if (modifiedCode === originalCode) {
    console.log('⚠️ Title pattern not found, trying alternative insertion...');
    
    // Alternative: Insert after FlashMessage
    const flashPattern = /(<FlashMessage message=\{flashMessage\} onClose=\{[^}]+\} \/>)/;
    modifiedCode = originalCode.replace(flashPattern, `$1${dynamicBanner}`);
    
    if (modifiedCode === originalCode) {
      console.log('⚠️ FlashMessage pattern not found, inserting after container...');
      
      // Alternative: Insert after main container
      const containerPattern = /(<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">)/;
      modifiedCode = originalCode.replace(containerPattern, `$1${dynamicBanner}`);
    }
  }
  
  if (modifiedCode !== originalCode) {
    writeFileSync(FILE_PATH, modifiedCode, 'utf8');
    console.log(`✅ Applied dynamic changes (+${modifiedCode.length - originalCode.length} characters)`);
    console.log('\n🎯 Dynamic changes applied! You can now:');
    console.log('   1. Open the Simple Preview component');
    console.log('   2. See the enhanced cart with colorful banner');
    console.log('   3. Notice the gradient title and animated elements');
    console.log('\n⏰ Changes are temporary - run with --restore to revert');
    return true;
  } else {
    console.log('❌ Could not find suitable insertion point');
    restoreBackup();
    return false;
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--restore')) {
  if (restoreBackup()) {
    console.log('✅ Cart.jsx restored to original state');
  } else {
    console.log('ℹ️ No backup found - Cart.jsx may already be in original state');
  }
} else if (args.includes('--help')) {
  console.log('Demo Dynamic Cart Changes');
  console.log('========================');
  console.log('');
  console.log('Usage:');
  console.log('  node demo-dynamic-cart-changes.cjs          # Apply dynamic changes');
  console.log('  node demo-dynamic-cart-changes.cjs --restore # Restore original file');
  console.log('  node demo-dynamic-cart-changes.cjs --help    # Show this help');
  console.log('');
  console.log('This script demonstrates what the patch system would achieve by:');
  console.log('- Temporarily modifying Cart.jsx with colorful enhancements');
  console.log('- Adding a gradient welcome banner');
  console.log('- Enhancing the page title with gradient text');
  console.log('- Adding animated elements');
} else {
  console.log('🎨 Cart.jsx Dynamic Changes Demo');
  console.log('=================================');
  
  if (applyDynamicChanges()) {
    console.log('\n📝 Note: These changes are temporary and for demonstration.');
    console.log('   In production, this would be handled by the patch system.');
    console.log('   Run: node demo-dynamic-cart-changes.cjs --restore to undo');
  }
}

// Auto-restore after 2 minutes if not in CI environment
if (!args.includes('--restore') && !process.env.CI && !args.includes('--help')) {
  setTimeout(() => {
    console.log('\n⏰ Auto-restoring original Cart.jsx after 2 minutes...');
    restoreBackup();
    console.log('✅ Original Cart.jsx restored automatically');
  }, 2 * 60 * 1000); // 2 minutes
}