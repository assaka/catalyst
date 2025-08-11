const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking your current credit status...');
    
    // Find your user
    const [users] = await sequelize.query(`
      SELECT id, email, role, account_type, credits 
      FROM users 
      WHERE email LIKE '%assaka%' OR email LIKE '%info%'
      ORDER BY created_at DESC;
    `);
    
    console.log('👤 Your user accounts:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Credits: ${user.credits || 0}`);
      console.log(`     ID: ${user.id}`);
    });
    
    // Check credits table
    if (users.length > 0) {
      const userId = users[0].id;
      const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
      
      const [credits] = await sequelize.query(`
        SELECT * FROM credits 
        WHERE user_id = '${userId}' AND store_id = '${storeId}';
      `);
      
      console.log('\n💰 Credits table record:');
      if (credits.length > 0) {
        console.log(`   Balance: ${credits[0].balance}`);
        console.log(`   Total Purchased: ${credits[0].total_purchased}`);
        console.log(`   Total Used: ${credits[0].total_used}`);
      } else {
        console.log('   No credits record found for this user/store combination');
      }
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();