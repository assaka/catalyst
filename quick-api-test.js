/**
 * Quick API test - run this in browser console
 */

async function quickTest() {
    const token = localStorage.getItem('store_owner_auth_token');
    
    // Test dropdown API
    console.log('Testing /api/stores/dropdown...');
    const resp = await fetch('/api/stores/dropdown', {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await resp.json();
    
    console.log('API Response:', data);
    console.log('Number of stores returned:', data.data?.length || 0);
    
    if (data.data) {
        data.data.forEach(store => {
            console.log(`- ${store.name} (${store.access_role})`);
        });
    }
    
    // Quick diagnosis
    if (data.data?.length > 2) {
        console.log('🚨 PROBLEM: API returning too many stores!');
        console.log('Backend filtering is NOT working');
    } else {
        console.log('✅ API filtering correctly');
    }
}

quickTest();