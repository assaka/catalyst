/**
 * Specific diagnosis for info@itomoti.com loading issue
 * Run this in browser console while logged in as info@itomoti.com
 */

console.log('🔍 DIAGNOSING info@itomoti.com LOADING ISSUE');
console.log('You should have 6 stores available');
console.log('='.repeat(50));

// Quick state check
console.log('\n1. Current State:');
console.log('   Token exists:', !!localStorage.getItem('store_owner_auth_token'));
console.log('   Selected store ID:', localStorage.getItem('selectedStoreId'));
console.log('   Current URL:', window.location.pathname);

// Test the dropdown API specifically
async function diagnoseStoreAccess() {
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ Not logged in!');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    console.log('\n2. Testing /api/stores/dropdown:');
    try {
        const response = await fetch('/api/stores/dropdown', { headers });
        console.log('   Response status:', response.status);
        
        const text = await response.text();
        console.log('   Raw response (first 200 chars):', text.substring(0, 200));
        
        // Try to parse
        try {
            const data = JSON.parse(text);
            console.log('   Parsed successfully:', data);
            
            if (data.success === false) {
                console.log('   ❌ API returned error:', data.message);
            } else if (data.data) {
                console.log('   ✅ Stores found:', data.data.length);
                data.data.forEach((s, i) => {
                    console.log(`      ${i+1}. ${s.name} (ID: ${s.id}) - ${s.access_role}`);
                });
            }
        } catch (e) {
            console.log('   ❌ JSON parse error:', e.message);
        }
    } catch (error) {
        console.log('   ❌ Network error:', error);
    }

    console.log('\n3. Testing Store.findAll():');
    if (window.Store) {
        try {
            const stores = await window.Store.findAll();
            console.log('   Store.findAll() returned:', stores);
            console.log('   Is array?', Array.isArray(stores));
            console.log('   Length:', stores?.length);
        } catch (e) {
            console.log('   ❌ Store.findAll() error:', e);
        }
    }

    console.log('\n4. Check React Context:');
    // Try to access React DevTools if available
    const reactFiber = document.querySelector('#root')?._reactRootContainer?._internalRoot?.current;
    if (reactFiber) {
        console.log('   React root found');
    } else {
        console.log('   Cannot access React internals');
    }

    console.log('\n5. Network Tab Instructions:');
    console.log('   1. Open Network tab (F12 → Network)');
    console.log('   2. Look for /api/stores/dropdown request');
    console.log('   3. Check if it\'s stuck in "Pending" state');
    console.log('   4. Check for any red (failed) requests');
    
    console.log('\n6. QUICK FIX - Force Clear & Reload:');
    console.log('   Run this to force clear everything:');
    console.log('   localStorage.clear(); sessionStorage.clear(); location.reload();');
}

// Run diagnosis
diagnoseStoreAccess();

// Also expose a force reload function
window.forceReload = () => {
    console.log('🔄 Forcing complete reload...');
    localStorage.clear();
    sessionStorage.clear();
    // Clear service workers if any
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => reg.unregister());
        });
    }
    setTimeout(() => location.reload(true), 500);
}

console.log('\n💡 Type forceReload() to completely reset and reload');