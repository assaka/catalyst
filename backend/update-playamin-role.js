require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function updatePlayaminRole() {
  try {
    console.log('🔄 Updating playamin user role...');
    
    // Find all users to debug
    const allUsers = await User.findAll();
    console.log('📊 All users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.email}: role=${user.role}, account_type=${user.account_type}`);
    });

    // Find user by email containing 'playamin'
    const users = await User.findAll({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('email')), 
        'LIKE', 
        '%playamin%'
      )
    });
    
    if (users.length === 0) {
      console.log('❌ No user found with "playamin" in email');
      return;
    }

    for (const user of users) {
      console.log(`\n📧 Found user: ${user.email}`);
      console.log('📊 Current data:', {
        id: user.id,
        email: user.email,
        role: user.role,
        account_type: user.account_type
      });

      // Update to store_owner
      await user.update({
        role: 'store_owner',
        account_type: 'agency'
      });

      console.log('✅ Updated to:', {
        role: user.role,
        account_type: user.account_type
      });
    }

    console.log('\n✅ All matching users updated successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
updatePlayaminRole();