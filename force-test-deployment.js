/**
 * Force test the exact API calls being made
 * Run this in browser console while logged in
 */

console.log('🧪 FORCE TESTING API CALLS');
console.log('='.repeat(50));

async function forceTestAPIs() {
    const token = localStorage.getItem('store_owner_auth_token');
    console.log('Token exists:', !!token);
    
    if (!token) {
        console.log('❌ Please log in first');
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test 1: Current user info
    console.log('\n1. WHO AM I?');
    try {
        const userResp = await fetch('/api/auth/me', { headers });
        const user = await userResp.json();
        console.log('   User:', user.email);
        console.log('   Role:', user.role);
        console.log('   ID:', user.id);
    } catch (e) {
        console.log('   ❌ Cannot get user info');
    }

    // Test 2: Force the exact dropdown call
    console.log('\n2. EXACT DROPDOWN API CALL:');
    const dropdownUrl = '/api/stores/dropdown';
    console.log('   URL:', dropdownUrl);
    
    try {
        const resp = await fetch(dropdownUrl, { headers });
        console.log('   Status:', resp.status);
        console.log('   Headers:', Object.fromEntries(resp.headers.entries()));
        
        const text = await resp.text();
        console.log('   Raw response:', text.substring(0, 500));
        
        const data = JSON.parse(text);
        if (data.success && data.data) {
            console.log('   ✅ Success! Stores:', data.data.length);
            data.data.forEach(s => console.log(`      - ${s.name} (${s.access_role})`));
        } else {
            console.log('   ❌ Unexpected format:', data);
        }
    } catch (e) {
        console.log('   ❌ Error:', e);
    }

    // Test 3: Regular stores endpoint (should be different)
    console.log('\n3. REGULAR STORES ENDPOINT:');
    try {
        const resp = await fetch('/api/stores', { headers });
        const data = await resp.json();
        const stores = Array.isArray(data) ? data : data.data || [];
        console.log('   Regular stores:', stores.length);
        console.log('   Should be different from dropdown!');
    } catch (e) {
        console.log('   ❌ Regular stores error:', e);
    }

    // Test 4: Check if backend is using correct parameters
    console.log('\n4. BACKEND PARAMETER TEST:');
    console.log('   If dropdown shows ALL stores, backend parameters are still wrong');
    console.log('   If dropdown shows filtered stores, frontend is the issue');
    
    // Test 5: Force bypass frontend and call API directly
    console.log('\n5. PRODUCTION BACKEND TEST:');
    try {
        const prodResp = await fetch('https://catalyst-backend-fzhu.onrender.com/api/stores/dropdown', { headers });
        const prodData = await prodResp.json();
        console.log('   Production backend stores:', prodData.data?.length || 0);
        console.log('   Production response:', prodData);
        
        if (prodData.data?.length > 2) {
            console.log('   🚨 PROBLEM: Production backend not filtering stores!');
            console.log('   This means the deployment is incomplete or failed');
        } else {
            console.log('   ✅ Production backend is filtering correctly');
        }
    } catch (e) {
        console.log('   ❌ Cannot reach production backend');
    }
}

forceTestAPIs();

// Quick fix to try
window.testStoreDropdown = async () => {
    const token = localStorage.getItem('store_owner_auth_token');
    const resp = await fetch('/api/stores/dropdown', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resp.json();
    console.log('Quick test result:', data);
    return data;
};

console.log('\n💡 Also try: testStoreDropdown()');