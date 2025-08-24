const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Debugging User Authentication Mismatch');
    console.log('=========================================');
    
    const filePath = 'src/pages/Cart.jsx';
    const expectedUserId = '96dc49e7-bf45-4608-b506-8b5107cb4ad0';
    const expectedEmail = 'playamin998@gmail.com';
    
    console.log('\n📋 Expected User (who owns the patches):');
    console.log(`   User ID: ${expectedUserId}`);
    console.log(`   Email: ${expectedEmail}`);
    
    // Check all users to see who might be authenticated instead
    console.log('\n👥 All store owners in the system:');
    const users = await sequelize.query(
      'SELECT id, email, role, created_at FROM users WHERE role = \'store_owner\' ORDER BY created_at DESC',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    users.forEach((user, index) => {
      const isExpected = user.id === expectedUserId;
      const marker = isExpected ? '✅ [HAS PATCHES]' : '❌ [NO PATCHES]';
      console.log(`   ${index + 1}. ${user.email} ${marker}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Created: ${user.created_at}`);
      console.log('');
    });
    
    // Check if any OTHER users have hybrid customizations
    console.log('\n🔍 Checking which users have ANY hybrid customizations:');
    const usersWithCustomizations = await sequelize.query(
      `SELECT u.email, u.id, COUNT(hc.id) as customization_count 
       FROM users u 
       LEFT JOIN hybrid_customizations hc ON u.id = hc.user_id 
       WHERE u.role = 'store_owner' 
       GROUP BY u.id, u.email 
       ORDER BY customization_count DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    usersWithCustomizations.forEach(user => {
      const count = parseInt(user.customization_count);
      if (count > 0) {
        console.log(`   ✅ ${user.email}: ${count} customizations`);
      } else {
        console.log(`   ❌ ${user.email}: ${count} customizations`);
      }
    });
    
    console.log('\n🎯 Summary:');
    console.log(`   - Only ${expectedEmail} has hybrid customizations`);
    console.log(`   - If frontend shows 0 patches, user is NOT authenticated as ${expectedEmail}`);
    console.log(`   - Solution: Either login as ${expectedEmail} OR create patches under current user`);
    
    console.log('\n💡 Quick Test:');
    console.log('   1. Check Render logs for the debug output showing actual user ID');
    console.log('   2. If different user ID, either:');
    console.log(`      a) Login to frontend as ${expectedEmail}`);
    console.log('      b) Make some code changes to create patches under current user');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await sequelize.close();
  }
})();