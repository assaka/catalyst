// Script to list users and their credits
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function listUsers() {
  try {
    const users = await sequelize.query(`
      SELECT id, email, credits, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      process.exit(1);
    }

    console.log('\n📋 Users and their credits:\n');
    console.log('ID'.padEnd(40) + 'Email'.padEnd(30) + 'Credits');
    console.log('-'.repeat(80));

    users.forEach(user => {
      console.log(
        String(user.id).padEnd(40) +
        String(user.email).padEnd(30) +
        String(user.credits || 0)
      );
    });

    console.log('\n💡 To add credits, run:');
    console.log('   node add-credits.js <user_id> <amount>');
    console.log('\nExample:');
    console.log(`   node add-credits.js ${users[0].id} 1000`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

listUsers();
