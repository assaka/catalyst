/**
 * Diagnose why both users see ALL stores
 * Run this in browser console
 */

console.log('🔍 DIAGNOSING WHY ALL STORES ARE VISIBLE');
console.log('='.repeat(50));

async function diagnoseStoreAccess() {
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ Not logged in');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 1. Check current user
    console.log('\n1. Current User:');
    try {
        const userResponse = await fetch('/api/auth/me', { headers });
        const userData = await userResponse.json();
        console.log('   Logged in as:', userData.email);
        console.log('   User ID:', userData.id);
    } catch (e) {
        console.log('   ❌ Could not get user info');
    }

    // 2. Test dropdown endpoint
    console.log('\n2. Testing /api/stores/dropdown:');
    try {
        const dropdownResponse = await fetch('/api/stores/dropdown', { headers });
        const dropdownData = await dropdownResponse.json();
        
        console.log('   Response:', dropdownData);
        
        if (dropdownData.success && dropdownData.data) {
            console.log('   ✅ Stores from dropdown:', dropdownData.data.length);
            dropdownData.data.forEach(s => {
                console.log(`      - ${s.name} (${s.access_role || 'unknown role'})`);
            });
        }
    } catch (e) {
        console.log('   ❌ Dropdown error:', e);
    }

    // 3. Test regular stores endpoint
    console.log('\n3. Testing /api/stores (regular):');
    try {
        const storesResponse = await fetch('/api/stores', { headers });
        const storesData = await storesResponse.json();
        
        console.log('   Response type:', Array.isArray(storesData) ? 'array' : typeof storesData);
        
        const stores = Array.isArray(storesData) ? storesData : (storesData.data || []);
        console.log('   ✅ Stores from regular API:', stores.length);
        stores.forEach(s => {
            console.log(`      - ${s.name} (owner: ${s.user_id})`);
        });
    } catch (e) {
        console.log('   ❌ Stores error:', e);
    }

    // 4. Check frontend Store entity
    console.log('\n4. Testing Store.findAll():');
    if (window.Store) {
        try {
            const frontendStores = await window.Store.findAll();
            console.log('   Store.findAll() returned:', frontendStores.length, 'stores');
            console.log('   First few stores:', frontendStores.slice(0, 3));
        } catch (e) {
            console.log('   ❌ Store.findAll() error:', e);
        }
    }

    // 5. Check localStorage for cached data
    console.log('\n5. Checking localStorage:');
    console.log('   selectedStoreId:', localStorage.getItem('selectedStoreId'));
    
    // 6. Diagnosis
    console.log('\n📊 DIAGNOSIS:');
    console.log('If you see all stores, the issue is likely:');
    console.log('1. Backend not deployed yet (check Render dashboard)');
    console.log('2. Frontend using wrong endpoint (/api/stores instead of /api/stores/dropdown)');
    console.log('3. Admin users see all stores by design');
    console.log('4. Database team setup not working');
    
    console.log('\n🔧 QUICK FIXES TO TRY:');
    console.log('1. Check if backend is deployed: https://catalyst-backend-fzhu.onrender.com/api/test-connection');
    console.log('2. Force refresh: localStorage.clear(); location.reload();');
    console.log('3. Check Render logs for deployment status');
}

// Run diagnosis
diagnoseStoreAccess();

// Also test the backend directly
console.log('\n💡 To test backend directly, run:');
console.log('fetch("https://catalyst-backend-fzhu.onrender.com/api/stores/dropdown", {headers: {Authorization: `Bearer ${localStorage.getItem("store_owner_auth_token")}`}}).then(r => r.json()).then(console.log)');