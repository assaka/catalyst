// Set environment to production to use PostgreSQL
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";
process.env.NODE_ENV = "production";

const { sequelize } = require('./src/database/connection');
const { User } = require('./src/models');

async function debugUserRole() {
  try {
    console.log('🔍 Debugging user roles...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check the specific user
    const userEmail = 'playamin998@gmail.com';
    const user = await User.findOne({ where: { email: userEmail } });
    
    if (user) {
      console.log(`\n👤 User Details for ${userEmail}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   First Name: ${user.first_name}`);
      console.log(`   Last Name: ${user.last_name}`);
    } else {
      console.log(`❌ User not found: ${userEmail}`);
    }
    
    // Check all users and their roles
    console.log('\n📋 All users and their roles:');
    const allUsers = await User.findAll({
      attributes: ['id', 'email', 'role', 'is_active'],
      order: [['created_at', 'DESC']]
    });
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Role: ${user.role} - Active: ${user.is_active}`);
    });
    
    // Check stores endpoint authorization requirements
    console.log('\n🔒 Stores endpoint authorization:');
    console.log('   Required roles: admin, store_owner');
    console.log(`   Your user role: ${user?.role}`);
    console.log(`   Access granted: ${user && ['admin', 'store_owner'].includes(user.role) ? 'YES' : 'NO'}`);
    
    console.log('\n🎉 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugUserRole();