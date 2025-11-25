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
  try {
    const mockJob = {
      id: `manual-${Date.now()}`,
      type: 'system:daily_credit_deduction',
      payload: {},
      priority: 'high',
      status: 'running',
      scheduled_at: new Date(),
      created_at: new Date()
    };

    const job = new DailyCreditDeductionJob(mockJob);
    const result = await job.execute();

    console.log(`Daily Credit Deduction: ${result.stores?.successful || 0}/${result.stores?.processed || 0} stores, ${result.custom_domains?.successful || 0}/${result.custom_domains?.processed || 0} domains`);
    process.exit(0);

  } catch (error) {
    console.error('Daily Credit Deduction Failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runDailyDeduction();
}

module.exports = runDailyDeduction;
