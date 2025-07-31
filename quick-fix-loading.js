/**
 * Quick fix for infinite loading
 * Run this in browser console
 */

console.log('🚀 APPLYING QUICK FIX FOR LOADING ISSUE');

// 1. Clear potentially corrupted localStorage
console.log('1. Clearing localStorage...');
localStorage.removeItem('selectedStoreId');
console.log('   ✅ Cleared selectedStoreId');

// 2. Force reload of stores
console.log('2. Forcing page reload...');
console.log('   This will:');
console.log('   - Clear any stuck loading states');
console.log('   - Re-authenticate with server');
console.log('   - Load fresh store list');

// 3. Reload page
setTimeout(() => {
    console.log('3. Reloading page NOW...');
    window.location.reload();
}, 1000);

console.log('\nIf loading persists after reload:');
console.log('1. Open Network tab (F12)');
console.log('2. Look for failed API calls');
console.log('3. Run debug-loading-issue.js for detailed diagnosis');