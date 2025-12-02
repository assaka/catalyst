#!/usr/bin/env node
/**
 * Run Daily Credit Deduction
 *
 * This script can be executed:
 * 1. As a Render Cron Job (scheduled daily)
 * 2. Manually from command line
 * 3. Via API endpoint
 */

console.log('=== DAILY CREDIT DEDUCTION SCRIPT STARTED ===');
console.log('Timestamp:', new Date().toISOString());

// Log env vars (masked)
console.log('ENV CHECK:');
console.log('  MASTER_DB_URL:', process.env.MASTER_DB_URL ? 'SET (' + process.env.MASTER_DB_URL.substring(0, 30) + '...)' : '❌ NOT SET');
console.log('  MASTER_SUPABASE_URL:', process.env.MASTER_SUPABASE_URL ? 'SET' : '❌ NOT SET');
console.log('  MASTER_SUPABASE_SERVICE_KEY:', process.env.MASTER_SUPABASE_SERVICE_KEY ? 'SET (length: ' + process.env.MASTER_SUPABASE_SERVICE_KEY.length + ')' : '❌ NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

require('dotenv').config();

console.log('Loading DailyCreditDeductionJob...');
const DailyCreditDeductionJob = require('../src/core/jobs/DailyCreditDeductionJob');
console.log('DailyCreditDeductionJob loaded successfully');

async function runDailyDeduction() {
  console.log('runDailyDeduction() called');
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

    console.log('Creating DailyCreditDeductionJob instance...');
    const job = new DailyCreditDeductionJob(mockJob);
    console.log('Calling job.execute()...');
    const result = await job.execute();
    console.log('Job execution completed');
    console.log('Full result:', JSON.stringify(result, null, 2));

    console.log(`Daily Credit Deduction: ${result.stores?.successful || 0}/${result.stores?.processed || 0} stores, ${result.custom_domains?.successful || 0}/${result.custom_domains?.processed || 0} domains`);
    console.log('=== DAILY CREDIT DEDUCTION SCRIPT FINISHED ===');
    process.exit(0);

  } catch (error) {
    console.error('=== DAILY CREDIT DEDUCTION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runDailyDeduction();
}

module.exports = runDailyDeduction;
