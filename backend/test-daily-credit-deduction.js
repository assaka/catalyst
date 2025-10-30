#!/usr/bin/env node
/**
 * Test script for daily credit deduction
 * This script:
 * 1. Checks for published stores
 * 2. Checks if the daily job is scheduled
 * 3. Manually triggers the daily credit deduction
 * 4. Displays results
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');
const Store = require('./src/models/Store');
const Job = require('./src/models/Job');
const creditService = require('./src/services/credit-service');

async function testDailyCreditDeduction() {
  try {
    console.log('\n🔍 Testing Daily Credit Deduction System\n');
    console.log('='.repeat(60));

    // 1. Check for published stores
    console.log('\n📊 Step 1: Checking for published stores...');
    const publishedStores = await Store.findAll({
      where: { published: true }
    });

    console.log(`   Found ${publishedStores.length} published store(s):`);
    for (const store of publishedStores) {
      console.log(`   - ${store.name} (ID: ${store.id}, Owner: ${store.user_id})`);
    }

    if (publishedStores.length === 0) {
      console.log('\n⚠️  No published stores found. No credits will be deducted.');
      console.log('   To publish a store, go to Admin > Stores > [Your Store] > Publish');
      process.exit(0);
    }

    // 2. Check if daily job is scheduled
    console.log('\n📅 Step 2: Checking scheduled jobs...');
    const scheduledJob = await Job.findOne({
      where: {
        type: 'system:daily_credit_deduction',
        status: 'pending'
      },
      order: [['scheduled_at', 'DESC']]
    });

    if (scheduledJob) {
      console.log(`   ✅ Daily job is scheduled`);
      console.log(`      Next run: ${scheduledJob.scheduled_at}`);
      console.log(`      Status: ${scheduledJob.status}`);
    } else {
      console.log('   ⚠️  No pending daily job found');
      console.log('      The job should be auto-scheduled on server startup');
    }

    // 3. Check recent job history
    console.log('\n📋 Step 3: Checking recent job executions...');
    const recentJobs = await Job.findAll({
      where: { type: 'system:daily_credit_deduction' },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    if (recentJobs.length > 0) {
      console.log(`   Found ${recentJobs.length} recent job(s):`);
      for (const job of recentJobs) {
        console.log(`   - ${job.status} (Created: ${job.created_at}, Scheduled: ${job.scheduled_at})`);
      }
    } else {
      console.log('   ⚠️  No job history found');
    }

    // 4. Test credit deduction manually
    console.log('\n💰 Step 4: Testing manual credit deduction...');
    console.log('   Processing each published store...\n');

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const store of publishedStores) {
      try {
        // Get owner's current balance
        const [userBefore] = await sequelize.query(`
          SELECT email, credits FROM users WHERE id = $1
        `, {
          bind: [store.user_id],
          type: sequelize.QueryTypes.SELECT
        });

        if (!userBefore) {
          console.log(`   ❌ Store owner not found for ${store.name}`);
          results.failed++;
          results.errors.push({
            store: store.name,
            error: 'Owner not found'
          });
          continue;
        }

        console.log(`   Testing: ${store.name}`);
        console.log(`      Owner: ${userBefore.email}`);
        console.log(`      Current balance: ${userBefore.credits || 0} credits`);

        // Check if user has enough credits
        if ((userBefore.credits || 0) < 1) {
          console.log(`      ⚠️  Insufficient credits (need 1, have ${userBefore.credits || 0})`);
          results.failed++;
          results.errors.push({
            store: store.name,
            error: 'Insufficient credits'
          });
          continue;
        }

        // Deduct 1 credit
        const chargeResult = await creditService.chargeDailyPublishingFee(
          store.user_id,
          store.id
        );

        if (chargeResult.success) {
          console.log(`      ✅ Successfully deducted 1 credit`);
          console.log(`      New balance: ${chargeResult.remaining_balance} credits`);
          results.successful++;
        } else {
          console.log(`      ❌ Failed: ${chargeResult.message || 'Unknown error'}`);
          results.failed++;
          results.errors.push({
            store: store.name,
            error: chargeResult.message
          });
        }

      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          store: store.name,
          error: error.message
        });
      }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Summary:');
    console.log(`   Total stores: ${publishedStores.length}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => {
        console.log(`   - ${err.store}: ${err.error}`);
      });
    }

    console.log('\n✅ Test completed');
    console.log('\n💡 Note: This was a manual test. The actual daily job runs automatically');
    console.log('   every 24 hours via the BackgroundJobManager.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDailyCreditDeduction();
