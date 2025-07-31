/**
 * Debug missing store 81b6dba6-3edd-477d-9432-061551fbfc5b
 * Run this in browser console while logged in as playamin998@gmail.com
 */

async function debugMissingStore() {
    console.log('🔍 DEBUGGING MISSING STORE');
    console.log('='.repeat(50));
    
    const storeId = '81b6dba6-3edd-477d-9432-061551fbfc5b';
    const token = localStorage.getItem('store_owner_auth_token');
    
    if (!token) {
        console.log('❌ No auth token - please log in as playamin998@gmail.com');
        return;
    }
    
    // Step 1: Verify current user
    console.log('\n1. Current user check...');
    try {
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await userResp.json();
        console.log(`   User: ${user.email} (ID: ${user.id})`);
        
        if (user.email !== 'playamin998@gmail.com') {
            console.log('❌ Wrong user - please login as playamin998@gmail.com');
            return;
        }
        
        // Step 2: Try to get the specific store
        console.log(`\n2. Checking specific store ${storeId}...`);
        const storeResp = await fetch(`/api/stores/${storeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`   Store API status: ${storeResp.status}`);
        
        if (storeResp.ok) {
            const storeData = await storeResp.json();
            console.log('   ✅ Store exists and user has access:', storeData.data);
            console.log('   Store details:', {
                id: storeData.data.id,
                name: storeData.data.name,
                user_id: storeData.data.user_id,
                is_active: storeData.data.is_active
            });
        } else {
            const errorText = await storeResp.text();
            console.log('   ❌ Store access failed:', errorText);
        }
        
        // Step 3: Check dropdown again with debugging
        console.log('\n3. Checking dropdown results...');
        const dropdownResp = await fetch('/api/stores/dropdown', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (dropdownResp.ok) {
            const data = await dropdownResp.json();
            console.log(`   Dropdown returned ${data.data.length} stores:`);
            data.data.forEach(store => {
                console.log(`     - ${store.name} (ID: ${store.id})`);
            });
            
            const foundInDropdown = data.data.find(store => store.id === storeId);
            if (foundInDropdown) {
                console.log('   ✅ Store IS in dropdown');
            } else {
                console.log('   ❌ Store NOT in dropdown');
            }
        }
        
        // Step 4: Possible causes
        console.log('\n4. POSSIBLE CAUSES:');
        console.log('   • Store is marked as inactive (is_active = false)');
        console.log('   • Store user_id doesn\'t match playamin\'s user ID');
        console.log('   • Database query filtering issue');
        console.log('   • Caching issue');
        
        console.log('\n📋 SOLUTION:');
        console.log('Check the backend logs in Render dashboard for the SQL query results');
        console.log('The logs should show exactly which stores are returned for this user');
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
    }
}

debugMissingStore();