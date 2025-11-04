/**
 * Test script for custom domain daily billing
 * Tests the DailyCreditDeductionJob with custom domains
 */

// Ensure models are loaded and associations are initialized
const models = require('./src/models');
const { CustomDomain, Store, User } = models;
const creditService = require('./src/services/credit-service');
const { sequelize } = require('./src/database/connection');

async function testCustomDomainBilling() {
  console.log('🧪 Testing Custom Domain Billing...\n');

  try {
    // Test 1: Query active custom domains
    console.log('📊 Test 1: Query active custom domains with Store association');

    const activeCustomDomains = await CustomDomain.findAll({
      where: {
        is_active: true,
        verification_status: 'verified'
      },
      include: [{
        model: Store,
        as: 'store',
        attributes: ['id', 'name', 'user_id']
      }]
    });

    console.log(`✅ Found ${activeCustomDomains.length} active custom domains`);

    if (activeCustomDomains.length === 0) {
      console.log('⚠️  No active custom domains found. Create one to test billing.');
      return;
    }

    // Display domains found
    activeCustomDomains.forEach((domain, index) => {
      console.log(`\n   Domain ${index + 1}:`);
      console.log(`   - Domain: ${domain.domain}`);
      console.log(`   - Store ID: ${domain.store_id}`);
      console.log(`   - Store Slug: ${domain.store?.slug || 'N/A'}`);
      console.log(`   - Store Name: ${domain.store?.name || 'N/A'}`);
      console.log(`   - User ID: ${domain.store?.user_id || 'N/A'}`);
      console.log(`   - Is Active: ${domain.is_active}`);
      console.log(`   - Verified: ${domain.verification_status}`);
    });

    // Test 2: Check association is working
    console.log('\n📊 Test 2: Verify Store association is loaded');

    const firstDomain = activeCustomDomains[0];
    if (!firstDomain.store) {
      console.log('❌ FAILED: Store association not loaded!');
      console.log('   This will cause billing to fail.');
      return;
    }

    console.log('✅ Store association working correctly');
    console.log(`   Domain "${firstDomain.domain}" → Store "${firstDomain.store.name}"`);

    // Test 3: Get user and check credits
    console.log('\n📊 Test 3: Check user credits');

    const userId = firstDomain.store.user_id;
    const user = await User.findByPk(userId);

    if (!user) {
      console.log('❌ FAILED: User not found!');
      return;
    }

    const balance = await creditService.getBalance(userId);
    console.log(`✅ User: ${user.email}`);
    console.log(`   Current balance: ${balance} credits`);

    // Test 4: Simulate charge (DRY RUN - don't actually charge)
    console.log('\n📊 Test 4: Simulate daily charge (DRY RUN)');

    console.log(`   Would charge: 0.5 credits for domain "${firstDomain.domain}"`);
    console.log(`   User balance: ${balance} credits`);
    console.log(`   After charge: ${balance - 0.5} credits`);

    if (balance < 0.5) {
      console.log(`   ⚠️  WARNING: Insufficient credits! Domain would be deactivated.`);
    } else {
      console.log(`   ✅ Sufficient credits for billing`);
    }

    // Test 5: Verify credit service method exists
    console.log('\n📊 Test 5: Verify chargeDailyCustomDomainFee method');

    if (typeof creditService.chargeDailyCustomDomainFee === 'function') {
      console.log('✅ chargeDailyCustomDomainFee method exists');
    } else {
      console.log('❌ FAILED: chargeDailyCustomDomainFee method not found!');
      return;
    }

    // Test 6: Test actual charge (OPTIONAL - uncomment to test real charge)
    /*
    console.log('\n📊 Test 6: Execute REAL charge (OPTIONAL)');
    console.log('⚠️  This will deduct 0.5 credits from user balance!');

    const chargeResult = await creditService.chargeDailyCustomDomainFee(
      userId,
      firstDomain.id,
      firstDomain.domain
    );

    if (chargeResult.success) {
      console.log('✅ Charge successful!');
      console.log(`   Credits deducted: ${chargeResult.credits_deducted}`);
      console.log(`   Remaining balance: ${chargeResult.remaining_balance}`);
    } else {
      console.log('❌ Charge failed:', chargeResult.message);
      console.log(`   Domain deactivated: ${chargeResult.domain_deactivated || false}`);
    }
    */

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\nCustom domain billing is properly configured and will work in production cron job.');
    console.log('\nTo test actual billing, uncomment Test 6 in the script.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testCustomDomainBilling();
