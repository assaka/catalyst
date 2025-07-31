/**
 * Debug backend SQL query for playamin
 * Run this while logged in as playamin998@gmail.com
 */

async function debugBackendQuery() {
    console.log('🔍 DEBUGGING BACKEND SQL QUERY');
    console.log('='.repeat(50));
    
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ No token - please login as playamin998@gmail.com');
        return;
    }
    
    try {
        // 1. Verify current user
        console.log('\n1. Current User Check:');
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await userResp.json();
        console.log(`   Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Role: ${user.role}`);
        
        if (user.email !== 'playamin998@gmail.com') {
            console.log('❌ Wrong user - please login as playamin998@gmail.com');
            return;
        }
        
        // 2. Get dropdown results
        console.log('\n2. Dropdown API Results:');
        const dropdownResp = await fetch('/api/stores/dropdown', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dropdownData = await dropdownResp.json();
        
        console.log(`   Total stores returned: ${dropdownData.data.length}`);
        
        // 3. Analyze each store
        console.log('\n3. Store Analysis:');
        const ownedStores = [];
        const teamStores = [];
        const suspiciousStores = [];
        
        dropdownData.data.forEach(store => {
            console.log(`\n   📋 ${store.name}`);
            console.log(`      ID: ${store.id}`);
            console.log(`      Role: ${store.access_role}`);
            console.log(`      Is Owner: ${store.is_direct_owner}`);
            
            if (store.is_direct_owner) {
                ownedStores.push(store);
            } else if (store.access_role === 'editor' || store.access_role === 'admin') {
                teamStores.push(store);
            } else {
                suspiciousStores.push(store);
                console.log(`      🚨 SUSPICIOUS: Not owner and not editor/admin`);
            }
        });
        
        // 4. Summary
        console.log('\n4. SUMMARY:');
        console.log(`   Owned stores: ${ownedStores.length}`);
        console.log(`   Team stores (editor/admin): ${teamStores.length}`);
        console.log(`   Suspicious stores: ${suspiciousStores.length}`);
        
        if (suspiciousStores.length > 0) {
            console.log('\n🚨 PROBLEM IDENTIFIED:');
            console.log('   Playamin is seeing stores they should NOT have access to');
            console.log('   This means the SQL query is wrong or fallback is being used');
        }
        
        // 5. Expected result
        console.log('\n5. EXPECTED RESULT:');
        console.log('   Playamin should only see:');
        console.log('   - Stores where stores.user_id = playamin_user_id (owned)');
        console.log('   - Stores where store_teams.user_id = playamin_user_id AND role IN (editor, admin)');
        
        if (dropdownData.data.length > 2) {
            console.log('\n❌ BACKEND ISSUE: SQL query is not filtering correctly');
            console.log('   Check Render logs for the actual SQL query being executed');
            console.log('   The query might be using fallback logic or user_id mismatch');
        }
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
    }
}

debugBackendQuery();