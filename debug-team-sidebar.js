/**
 * Debug team members not showing and sidebar still empty
 * Run this in browser console as info@itomoti.com
 */

async function debugTeamAndSidebar() {
    console.log('🔍 DEBUGGING TEAM & SIDEBAR ISSUES');
    console.log('='.repeat(60));
    
    const token = localStorage.getItem('store_owner_auth_token');
    const userData = localStorage.getItem('store_owner_user_data');
    
    console.log('\n1. AUTHENTICATION CHECK:');
    console.log(`   Token exists: ${!!token}`);
    console.log(`   User data exists: ${!!userData}`);
    
    if (!token) {
        console.log('❌ Please login as info@itomoti.com first');
        return;
    }
    
    try {
        // Get current user
        const userResp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = await userResp.json();
        console.log(`   Current user: ${user.email} (ID: ${user.id})`);
        
        if (user.email !== 'info@itomoti.com') {
            console.log('❌ Please login as info@itomoti.com');
            return;
        }
        
        // Test store dropdown
        console.log('\n2. STORE DROPDOWN TEST:');
        const storesResp = await fetch('/api/stores/dropdown', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (storesResp.ok) {
            const storesData = await storesResp.json();
            console.log(`   ✅ Stores API works: ${storesData.data.length} stores`);
            
            // Test team members for Hamid store (should have playamin)
            const hamidStore = storesData.data.find(s => s.name === 'Hamid');
            if (hamidStore) {
                console.log(`   Found Hamid store: ${hamidStore.id}`);
                
                console.log('\n3. TEAM MEMBERS TEST:');
                const teamResp = await fetch(`/api/store-teams/${hamidStore.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                console.log(`   Team API status: ${teamResp.status}`);
                
                if (teamResp.ok) {
                    const teamData = await teamResp.json();
                    console.log('   ✅ Team API response:', teamData);
                    
                    if (teamData.success && teamData.data) {
                        console.log(`   Team members: ${teamData.data.team_members?.length || 0}`);
                        teamData.data.team_members?.forEach(member => {
                            console.log(`     - ${member.User?.email} (${member.role})`);
                        });
                    }
                } else {
                    const errorText = await teamResp.text();
                    console.log('   ❌ Team API error:', errorText.substring(0, 300));
                }
            } else {
                console.log('   ❌ Hamid store not found in dropdown');
            }
        } else {
            console.log('   ❌ Stores API failed:', storesResp.status);
        }
        
        // Test sidebar loading
        console.log('\n4. SIDEBAR DEBUG:');
        console.log('   Check if StoreSelectionContext has data:');
        
        // Check localStorage for selected store
        const selectedStoreId = localStorage.getItem('selectedStoreId');
        console.log(`   Selected store ID: ${selectedStoreId}`);
        
        // Check if DOM has the store selector
        const storeSelector = document.querySelector('[data-testid="store-selector"]') || 
                             document.querySelector('.store-selector') ||
                             document.querySelectorAll('*').find(el => el.textContent?.includes('Select store'));
        console.log(`   Store selector in DOM: ${!!storeSelector}`);
        
        if (storeSelector) {
            console.log(`   Selector content: ${storeSelector.textContent?.substring(0, 100)}`);
        }
        
        console.log('\n📋 ISSUES TO CHECK:');
        console.log('1. Team API permissions - check store ownership middleware');
        console.log('2. Store team entries exist in database for playamin + Hamid');
        console.log('3. Sidebar component rendering after StoreSelectionContext loads');
        console.log('4. Check if userDataReady event is firing properly');
        
    } catch (error) {
        console.log('❌ Debug failed:', error.message);
    }
}

debugTeamAndSidebar();