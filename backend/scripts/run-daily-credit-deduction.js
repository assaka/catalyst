#!/usr/bin/env node
/**
 * Run Daily Credit Deduction
 *
 * This script can be executed:
 * 1. As a Render Cron Job (scheduled daily)
 * 2. Manually from command line
 * 3. Via API endpoint
 */

require('dotenv').config();
const DailyCreditDeductionJob = require('../src/core/jobs/DailyCreditDeductionJob');

async function runDailyDeduction() {
  console.log('\n💰 Running Daily Credit Deduction...');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Create a mock job object (required by DailyCreditDeductionJob)
    const mockJob = {
      id: `manual-${Date.now()}`,
      type: 'system:daily_credit_deduction',
      payload: {},
      priority: 'high',
      status: 'running',
      scheduled_at: new Date(),
      created_at: new Date()
    };

    // Execute the job
    const job = new DailyCreditDeductionJob(mockJob);
    const result = await job.execute();

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Daily Credit Deduction Completed Successfully\n');
    console.log('Results:');
    console.log(`  Stores processed: ${result.processed}`);
    console.log(`  Successful: ${result.successful}`);
    console.log(`  Failed: ${result.failed}`);

    if (result.stores && result.stores.length > 0) {
      console.log('\nStores charged:');
      result.stores.forEach(store => {
        console.log(`  - ${store.store_name}: ${store.credits_deducted} credit(s) deducted (Balance: ${store.remaining_balance})`);
      });
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(error => {
        console.log(`  - ${error.store_name}: ${error.error}`);
      });
    }

    console.log(`\nCompleted at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Daily Credit Deduction Failed\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runDailyDeduction();
}

module.exports = runDailyDeduction;
