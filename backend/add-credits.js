// Script to add credits to a user account
require('dotenv').config();
const { sequelize } = require('./src/database/connection');

async function addCredits() {
  const userId = process.argv[2];
  const creditsToAdd = parseInt(process.argv[3]) || 1000;

  if (!userId) {
    console.error('Usage: node add-credits.js <user_id> [credits_amount]');
    console.error('Example: node add-credits.js 123 1000');
    process.exit(1);
  }

  try {
    // Check current balance
    const [user] = await sequelize.query(`
      SELECT id, email, credits FROM users WHERE id = $1
    `, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    if (!user) {
      console.error(`❌ User with ID ${userId} not found`);

      // Show available users
      const users = await sequelize.query(`
        SELECT id, email, credits FROM users LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      console.log('\n📋 Available users:');
      users.forEach(u => {
        console.log(`   ID: ${u.id}, Email: ${u.email}, Credits: ${u.credits || 0}`);
      });

      process.exit(1);
    }

    console.log(`\n👤 User: ${user.email}`);
    console.log(`💰 Current credits: ${user.credits || 0}`);
    console.log(`➕ Adding: ${creditsToAdd}`);

    // Add credits
    await sequelize.query(`
      UPDATE users
      SET credits = COALESCE(credits, 0) + $1,
          updated_at = NOW()
      WHERE id = $2
    `, {
      bind: [creditsToAdd, userId],
      type: sequelize.QueryTypes.UPDATE
    });

    // Get new balance
    const [updated] = await sequelize.query(`
      SELECT credits FROM users WHERE id = $1
    `, {
      bind: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`✅ New balance: ${updated.credits}`);
    console.log('\n📊 Operation Costs:');
    console.log('   - Plugin Generation: 50 credits');
    console.log('   - Plugin Modification: 30 credits');
    console.log('   - Translation: 20 credits');
    console.log('   - Layout Generation: 40 credits');
    console.log('   - Code Patch: 25 credits');
    console.log('   - General/Chat: 10 credits');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addCredits();
