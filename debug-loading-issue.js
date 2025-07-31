/**
 * Debug infinite loading issue
 * Run this in browser console to identify the problem
 */

console.log('🔍 DEBUGGING INFINITE LOADING ISSUE');
console.log('='.repeat(50));

// Check authentication
const token = localStorage.getItem('store_owner_auth_token');
console.log('1. Auth token exists:', !!token);
console.log('   Token preview:', token ? token.substring(0, 20) + '...' : 'none');

// Check selected store
const selectedStoreId = localStorage.getItem('selectedStoreId');
console.log('2. Selected store ID:', selectedStoreId);

// Test API endpoints
async function testAPIs() {
    if (!token) {
        console.log('❌ No auth token - please log in');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test 1: Auth check
    console.log('\n3. Testing /api/auth/me');
    try {
        const authResponse = await fetch('/api/auth/me', { headers });
        console.log('   Status:', authResponse.status);
        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('   User:', authData.email, '(ID:', authData.id, ')');
        } else {
            console.log('   ❌ Auth failed:', await authResponse.text());
        }
    } catch (err) {
        console.log('   ❌ Network error:', err.message);
    }

    // Test 2: Stores dropdown
    console.log('\n4. Testing /api/stores/dropdown');
    try {
        const storesResponse = await fetch('/api/stores/dropdown', { headers });
        console.log('   Status:', storesResponse.status);
        console.log('   Headers:', Object.fromEntries(storesResponse.headers.entries()));
        
        const responseText = await storesResponse.text();
        console.log('   Raw response:', responseText.substring(0, 200));
        
        try {
            const storesData = JSON.parse(responseText);
            console.log('   Parsed data:', storesData);
            
            if (storesData.success && storesData.data) {
                console.log('   ✅ Got', storesData.data.length, 'stores');
                storesData.data.forEach(s => console.log(`     - ${s.name} (${s.access_role})`));
            } else if (Array.isArray(storesData)) {
                console.log('   ✅ Got', storesData.length, 'stores (direct array)');
            } else {
                console.log('   ⚠️ Unexpected response format');
            }
        } catch (parseErr) {
            console.log('   ❌ JSON parse error:', parseErr.message);
        }
    } catch (err) {
        console.log('   ❌ Network error:', err.message);
    }

    // Test 3: Check if specific store loads
    if (selectedStoreId) {
        console.log('\n5. Testing /api/stores/' + selectedStoreId);
        try {
            const storeResponse = await fetch(`/api/stores/${selectedStoreId}`, { headers });
            console.log('   Status:', storeResponse.status);
            if (!storeResponse.ok) {
                console.log('   ❌ Store load failed:', await storeResponse.text());
            } else {
                console.log('   ✅ Store loaded successfully');
            }
        } catch (err) {
            console.log('   ❌ Network error:', err.message);
        }
    }

    // Test 4: Check React errors
    console.log('\n6. Checking for React errors');
    const errorElement = document.querySelector('.error-boundary') || document.querySelector('[data-error]');
    if (errorElement) {
        console.log('   ❌ React error found:', errorElement.textContent);
    } else {
        console.log('   ✅ No React errors visible');
    }

    // Test 5: Check console errors
    console.log('\n7. Recent console errors:');
    // This will show any errors that occurred before running this script
    
    // Test 6: Check network tab
    console.log('\n8. Check Network tab for:');
    console.log('   - Failed requests (red status)');
    console.log('   - 401/403 authentication errors');
    console.log('   - Requests that never complete');
    console.log('   - CORS errors');
}

// Run tests
testAPIs().then(() => {
    console.log('\n' + '='.repeat(50));
    console.log('DIAGNOSIS COMPLETE');
    console.log('\nCommon causes of infinite loading:');
    console.log('1. Authentication token expired (401 errors)');
    console.log('2. No stores accessible (empty stores array)');
    console.log('3. Selected store no longer accessible');
    console.log('4. API response format changed');
    console.log('5. React component error (check console)');
});

// Also check if Store entity is available
if (window.Store) {
    console.log('\n9. Testing Store.findAll() directly');
    window.Store.findAll().then(stores => {
        console.log('   Store.findAll() returned:', stores);
    }).catch(err => {
        console.log('   Store.findAll() error:', err);
    });
}