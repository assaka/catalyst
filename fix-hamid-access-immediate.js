/**
 * IMMEDIATE FIX for Hamid store access
 * Run this in browser console as info@itomoti.com
 */

console.log('🔧 FIXING HAMID STORE ACCESS');

// 1. Clear ALL cached data
console.log('1. Clearing all cached data...');
localStorage.clear();
sessionStorage.clear();

// 2. Force clear React state
console.log('2. Dispatching storage clear event...');
window.dispatchEvent(new Event('storage'));

// 3. Clear any service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister());
        console.log('3. Cleared service workers');
    });
}

// 4. Hard reload with cache bypass
console.log('4. Reloading with cache bypass in 2 seconds...');
console.log('   The page will reload completely fresh');
console.log('   You will need to log in again');

setTimeout(() => {
    // Force reload bypassing cache
    window.location.href = window.location.href.split('#')[0] + '?t=' + Date.now();
}, 2000);

console.log('\n✅ Fix applied. Page will reload in 2 seconds...');
console.log('After reload:');
console.log('1. Log in as info@itomoti.com');
console.log('2. Select Hamid store - it should work now');