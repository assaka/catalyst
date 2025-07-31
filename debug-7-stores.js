/**
 * Debug why playamin sees 7 stores
 * Run this while logged in as playamin998@gmail.com
 */

async function debug7Stores() {
    console.log('🔍 DEBUGGING 7 STORES FOR PLAYAMIN');
    console.log('='.repeat(50));
    
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
        console.log('❌ No token - please login as playamin998@gmail.com');
        return;
    }
    
    try {
        // Get current user
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await userResp.json();
        
        console.log(`🔍 Current User: ${user.email} (ID: ${user.id})`);
        
        if (user.email !== 'playamin998@gmail.com') {
            console.log('❌ Wrong user - please login as playamin998@gmail.com');
            return;
        }
        
        // Get dropdown stores
        const dropdownResp = await fetch('/api/stores/dropdown', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const dropdownData = await dropdownResp.json();
        
        console.log(`📊 Playamin sees ${dropdownData.data.length} stores:`);
        console.log('='.repeat(50));
        
        dropdownData.data.forEach((store, index) => {
            console.log(`${index + 1}. 📋 ${store.name}`);
            console.log(`   ID: ${store.id}`);
            console.log(`   Role: ${store.access_role}`);
            console.log(`   Owner: ${store.is_direct_owner}`);
            console.log('   ---');
        });
        
        // Count by access role
        const roleCount = {};
        dropdownData.data.forEach(store => {
            roleCount[store.access_role] = (roleCount[store.access_role] || 0) + 1;
        });
        
        console.log('\n📊 BREAKDOWN BY ROLE:');
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`   ${role}: ${count} stores`);
        });
        
        // Identify unexpected stores
        const ownedStores = dropdownData.data.filter(s => s.is_direct_owner);
        const teamStores = dropdownData.data.filter(s => !s.is_direct_owner);
        
        console.log(`\n🔍 ANALYSIS:`);
        console.log(`   Owned stores: ${ownedStores.length}`);
        console.log(`   Team stores: ${teamStores.length}`);
        
        if (teamStores.length > 0) {
            console.log('\n👥 TEAM STORES (playamin is editor/admin):');
            teamStores.forEach(store => {
                console.log(`   - ${store.name} (role: ${store.access_role})`);
            });
        }
        
        // Check if any of these should be restricted
        console.log('\n🚨 EXPECTED RESULT:');
        console.log('   Playamin should only see:');
        console.log('   1. Stores they own (user_id = playamin_id)');
        console.log('   2. Stores where they are editor/admin in store_teams');
        
        if (dropdownData.data.length > 2) {
            console.log('\n❌ POTENTIAL ISSUE: Too many stores visible');
            console.log('   Check backend logs for SQL query results');
            console.log('   Verify store_teams table has correct data');
        }
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
    }
}

debug7Stores();