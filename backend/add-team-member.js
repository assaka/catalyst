/**
 * Add a team member to a store for testing purposes
 * This script will add info@itomoti.com as an admin to the Hamid store
 */

const { StoreTeam, Store, User } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function addTeamMember() {
  try {
    console.log('🔄 Adding team member...');
    
    // Wait for database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Find the Hamid store
    const hamidStore = await Store.findOne({
      where: { name: 'Hamid' }
    });
    
    if (!hamidStore) {
      console.log('❌ Hamid store not found');
      return;
    }
    
    console.log('✅ Found Hamid store:', hamidStore.id);
    
    // Find your user
    const user = await User.findOne({
      where: { email: 'info@itomoti.com' }
    });
    
    if (!user) {
      console.log('❌ User info@itomoti.com not found');
      return;
    }
    
    console.log('✅ Found user:', user.id);
    
    // Check if already a team member
    const existingMember = await StoreTeam.findOne({
      where: {
        store_id: hamidStore.id,
        user_id: user.id
      }
    });
    
    if (existingMember) {
      console.log('⚠️ User is already a team member with role:', existingMember.role);
      
      // Update to admin if not already
      if (existingMember.role !== 'admin') {
        await existingMember.update({
          role: 'admin',
          status: 'active',
          accepted_at: new Date()
        });
        console.log('✅ Updated user role to admin');
      }
      
      return;
    }
    
    // Add as team member
    const teamMember = await StoreTeam.create({
      store_id: hamidStore.id,
      user_id: user.id,
      role: 'admin',
      status: 'active',
      accepted_at: new Date(),
      permissions: {
        canManageContent: true,
        canManageProducts: true,
        canManageOrders: true,
        canManageCategories: true,
        canViewReports: true
      }
    });
    
    console.log('✅ Successfully added team member:', {
      id: teamMember.id,
      store_id: hamidStore.id,
      user_id: user.id,
      role: teamMember.role,
      status: teamMember.status
    });
    
    console.log('🎉 You can now access the Hamid store!');
    
  } catch (error) {
    console.error('❌ Error adding team member:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
addTeamMember();