/**
 * Browser-based Team Management Interface
 * Copy this code and run it in your browser console on the admin panel
 */

window.TeamManager = {
  baseUrl: 'https://catalyst-backend-fzhu.onrender.com/api',
  
  // Get auth token
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
  
  // Get all accessible stores
  async getStores() {
    const response = await fetch(`${this.baseUrl}/stores/dropdown`, {
      headers: this.getHeaders()
    });
    const data = await response.json();
    console.log('📊 Your accessible stores:', data.data);
    return data.data;
  },
  
  // Get team members for a store
  async getTeamMembers(storeId) {
    const response = await fetch(`${this.baseUrl}/store-teams/${storeId}`, {
      headers: this.getHeaders()
    });
    const data = await response.json();
    console.log(`👥 Team members for store ${storeId}:`, data.data);
    return data.data;
  },
  
  // Invite a new team member
  async inviteMember(storeId, email, role = 'editor', message = '') {
    const response = await fetch(`${this.baseUrl}/store-teams/${storeId}/invite`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        role,
        message,
        permissions: {
          canManageContent: role === 'admin',
          canManageProducts: ['admin', 'editor'].includes(role),
          canManageOrders: ['admin', 'editor'].includes(role),
          canViewReports: true
        }
      })
    });
    const data = await response.json();
    console.log(`📧 Invitation result:`, data);
    return data;
  },
  
  // Update team member role
  async updateMember(storeId, memberId, role, permissions = null) {
    const defaultPermissions = {
      admin: { canManageContent: true, canManageProducts: true, canManageOrders: true, canViewReports: true },
      editor: { canManageProducts: true, canManageOrders: true, canViewReports: true },
      viewer: { canViewReports: true }
    };
    
    const response = await fetch(`${this.baseUrl}/store-teams/${storeId}/members/${memberId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        role,
        permissions: permissions || defaultPermissions[role] || {}
      })
    });
    const data = await response.json();
    console.log(`✏️ Member update result:`, data);
    return data;
  },
  
  // Remove team member
  async removeMember(storeId, memberId) {
    const response = await fetch(`${this.baseUrl}/store-teams/${storeId}/members/${memberId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    const data = await response.json();
    console.log(`🗑️ Member removal result:`, data);
    return data;
  },
  
  // Quick setup: Add playamin998@gmail.com to Hamid store as EDITOR
  async addPlayaminToHamid() {
    console.log('🔄 Finding Hamid store...');
    const stores = await this.getStores();
    const hamidStore = stores.find(s => s.name === 'Hamid');
    
    if (!hamidStore) {
      console.log('❌ Hamid store not found');
      return;
    }
    
    console.log('✅ Found Hamid store:', hamidStore.id);
    console.log('📧 Inviting playamin998@gmail.com as EDITOR (view/edit only)...');
    
    const result = await this.inviteMember(
      hamidStore.id,
      'playamin998@gmail.com',
      'editor',  // EDITOR role - view/edit but not admin
      'Welcome to the Hamid store team! You have editor access to view and edit store content.'
    );
    
    if (result.success) {
      console.log('🎉 SUCCESS: playamin998@gmail.com added as EDITOR to Hamid store!');
      console.log('✅ Can: View, edit products, manage orders, manage categories');
      console.log('❌ Cannot: Manage team, change store settings, delete store');
    } else {
      console.log('❌ Failed to add member:', result.message);
    }
    
    return result;
  },
  
  // Show team management dashboard
  async showDashboard() {
    console.log('='.repeat(50));
    console.log('🏪 TEAM MANAGEMENT DASHBOARD');
    console.log('='.repeat(50));
    
    const stores = await this.getStores();
    
    for (const store of stores) {
      console.log(`\n🏪 Store: ${store.name} (${store.access_role})`);
      console.log(`   ID: ${store.id}`);
      
      try {
        const teamData = await this.getTeamMembers(store.id);
        const members = teamData.team_members || [];
        
        if (members.length > 0) {
          console.log('   👥 Team Members:');
          members.forEach(member => {
            const user = member.User;
            console.log(`      • ${user.email} (${member.role}) - ${member.status}`);
          });
        } else {
          console.log('   👤 No team members (owner only)');
        }
      } catch (error) {
        console.log('   ⚠️ Could not load team members');
      }
    }
    
    console.log('\n📋 Available Commands:');
    console.log('   TeamManager.addPlayaminToHamid() - Add playamin998@gmail.com to Hamid');
    console.log('   TeamManager.inviteMember(storeId, email, role, message)');
    console.log('   TeamManager.getTeamMembers(storeId)');
    console.log('   TeamManager.updateMember(storeId, memberId, role)');
    console.log('   TeamManager.removeMember(storeId, memberId)');
    console.log('='.repeat(50));
  }
};

// Auto-run dashboard
console.log('🚀 Team Manager loaded! Running dashboard...');
TeamManager.showDashboard().catch(console.error);

// Show quick help
console.log(`
🎯 QUICK START:
1. TeamManager.addPlayaminToHamid() - Add playamin998@gmail.com as EDITOR to Hamid store
2. TeamManager.showDashboard() - View all teams
3. TeamManager.getStores() - List your stores

📋 EDITOR PERMISSIONS (playamin998@gmail.com will have):
✅ CAN: View all store data, edit products, manage orders, manage categories
❌ CANNOT: Manage team members, change store settings, delete store, access other stores
`);