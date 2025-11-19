require('dotenv').config();
const { Sequelize, QueryTypes } = require('sequelize');

// Use the Supabase connection string
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkCategoryAccess() {
  try {
    console.log('🔍 Checking category creation access...\n');

    // Get current user info (assuming you're logged in)
    console.log('📋 First, please provide:');
    console.log('1. Your user email or ID');
    console.log('2. The store ID or name you\'re trying to create a category for\n');

    // Get all users
    const users = await sequelize.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10',
      { type: QueryTypes.SELECT }
    );

    console.log('👥 Recent users:');
    users.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id}, Role: ${u.role})`);
    });
    console.log();

    // Get all stores
    const stores = await sequelize.query(
      'SELECT id, name, slug, user_id, is_active FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 10',
      { type: QueryTypes.SELECT }
    );

    console.log('🏪 Active stores:');
    stores.forEach(s => {
      console.log(`  - ${s.name} (ID: ${s.id}, Slug: ${s.slug}, Owner: ${s.user_id}, Active: ${s.is_active})`);
    });
    console.log();

    // Check store teams
    const teams = await sequelize.query(
      'SELECT st.*, u.email FROM store_teams st LEFT JOIN users u ON st.user_id = u.id WHERE st.is_active = true AND st.status = \'active\' LIMIT 20',
      { type: QueryTypes.SELECT }
    );

    console.log('👥 Store team memberships:');
    if (teams.length === 0) {
      console.log('  - No team memberships found');
    } else {
      teams.forEach(t => {
        console.log(`  - ${t.email} → Store ${t.store_id} (Role: ${t.role}, Status: ${t.status})`);
      });
    }
    console.log();

    console.log('✅ To test access for a specific user/store combination, run:');
    console.log('   UPDATE THIS SCRIPT with specific userId and storeId values');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCategoryAccess();
