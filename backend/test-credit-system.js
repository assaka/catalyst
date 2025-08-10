const creditService = require('./src/services/credit-service');

(async () => {
  try {
    console.log('🧪 Testing credit system...');
    
    const userId = '12345678-1234-1234-1234-123456789012'; // Mock user ID
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Test 1: Get initial balance
    console.log('1. Testing initial balance...');
    const balance = await creditService.getBalance(userId, storeId);
    console.log('   Initial balance:', balance);
    
    // Test 2: Check if has enough credits (should be false initially)
    console.log('2. Testing credit check...');
    const hasCredits = await creditService.hasEnoughCredits(userId, storeId, 0.1);
    console.log('   Has enough credits for Akeneo run:', hasCredits);
    
    // Test 3: Get credit pricing
    console.log('3. Testing credit pricing...');
    const pricing = creditService.getCreditPricing();
    console.log('   Pricing options:', pricing.length);
    pricing.forEach(p => {
      console.log('   - $' + p.amount_usd + ' = ' + p.credits + ' credits ($' + p.price_per_credit + ' per credit)');
    });
    
    // Test 4: Create a bonus transaction to add credits
    console.log('4. Testing bonus credits...');
    const CreditTransaction = require('./src/models/CreditTransaction');
    const bonusTransaction = await CreditTransaction.createBonus(userId, storeId, 10.0, 'Testing bonus');
    console.log('   Created bonus transaction:', bonusTransaction.id);
    
    // Test 5: Check balance after bonus
    console.log('5. Testing balance after bonus...');
    const newBalance = await creditService.getBalance(userId, storeId);
    console.log('   New balance:', newBalance);
    
    // Test 6: Test manual Akeneo usage
    console.log('6. Testing manual Akeneo usage...');
    if (newBalance >= 0.1) {
      const usageResult = await creditService.recordManualAkeneoUsage(
        userId,
        storeId,
        'products',
        { test: true }
      );
      console.log('   Usage recorded:', usageResult.usage_id);
      console.log('   Credits deducted:', usageResult.credits_deducted);
      console.log('   Remaining balance:', usageResult.remaining_balance);
    } else {
      console.log('   Skipped - insufficient balance');
    }
    
    console.log('✅ Credit system test completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Credit system test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();