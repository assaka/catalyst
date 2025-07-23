const { User } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function fixUserRole() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Find user by email
    const email = 'playamin@example.com'; // Update this with the actual email
    console.log(`🔍 Looking for user with email: ${email}`);
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📊 Current user data:', {
      id: user.id,
      email: user.email,
      role: user.role,
      account_type: user.account_type
    });

    // Update user role and account_type
    await user.update({
      role: 'store_owner',
      account_type: 'agency'
    });

    console.log('✅ User updated successfully');
    console.log('📊 Updated user data:', {
      id: user.id,
      email: user.email,
      role: user.role,
      account_type: user.account_type
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
fixUserRole();