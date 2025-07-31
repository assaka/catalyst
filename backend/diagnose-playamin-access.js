/**
 * Diagnose playamin998@gmail.com access to Hamid store
 */

console.log('🔍 DIAGNOSING PLAYAMIN ACCESS ISSUE');
console.log('=' .repeat(50));

// Mock browser environment - copy this to browser console
const TeamManager = {
  baseUrl: 'https://catalyst-backend-fzhu.onrender.com/api',
  
  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('store_owner_auth_token');
  },
  
  // Get headers for API calls
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    };
  },
  
  // Diagnose the issue
  async diagnose() {
    console.log('🔍 Starting diagnosis...');
    
    // Check if user is logged in
    const token = this.getToken();
    if (!token) {
      console.log('❌ No auth token found - user not logged in');
      console.log('💡 Please log in as playamin998@gmail.com first');
      return;
    }
    
    console.log('✅ Auth token found:', token.substring(0, 20) + '...');
    
    // Test API connectivity
    try {
      console.log('🌐 Testing API connectivity...');
      const response = await fetch(`${this.baseUrl}/stores/dropdown`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API request failed:', response.status, errorText);
        
        if (response.status === 401) {
          console.log('💡 Token might be expired - try logging in again');
        }
        return;
      }
      
      const stores = await response.json();
      console.log('📊 Available stores:', stores);
      
      if (stores.length === 0) {
        console.log('⚠️ No stores found - checking team membership...');
        
        // Try to get team info for Hamid store
        // First need to find Hamid store ID
        console.log('🔍 Searching for Hamid store in all stores...');
        
        const allStoresResponse = await fetch(`${this.baseUrl}/stores`, {
          headers: this.getHeaders()
        });
        
        if (allStoresResponse.ok) {
          const allStores = await allStoresResponse.json();
          console.log('📋 All stores:', allStores);
          
          const hamidStore = allStores.find(s => s.name === 'Hamid');
          if (hamidStore) {
            console.log('✅ Found Hamid store:', hamidStore);
            
            // Check team membership
            const teamResponse = await fetch(`${this.baseUrl}/store-teams/${hamidStore.id}`, {
              headers: this.getHeaders()
            });
            
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              console.log('👥 Team data:', teamData);
            } else {
              console.log('❌ Cannot access team data:', teamResponse.status);
            }
          } else {
            console.log('❌ Hamid store not found in all stores');
          }
        }
      } else {
        console.log('✅ User has access to stores');
        const hamidStore = stores.find(s => s.name === 'Hamid');
        if (hamidStore) {
          console.log('✅ Hamid store is accessible:', hamidStore);
        } else {
          console.log('⚠️ Hamid store not in dropdown - may not have Editor+ permissions');
        }
      }
      
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
  TeamManager.diagnose();
} else {
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Open browser and go to your admin panel');
  console.log('2. Log in as playamin998@gmail.com');
  console.log('3. Open browser console (F12)');
  console.log('4. Copy and paste this entire script');
  console.log('5. It will automatically diagnose the issue');
}