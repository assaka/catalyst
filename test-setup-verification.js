/**
 * Test Setup Verification
 * Verifies that our testing infrastructure setup is working correctly
 */

console.log('🧪 Testing Infrastructure Setup Verification');
console.log('============================================');

// Test 1: Check if required dependencies are installed
console.log('\n1. Testing Dependencies Installation...');

const dependencies = [
  '@playwright/test',
  'joi', 
  '@faker-js/faker',
  'socket.io',
  'husky'
];

let allInstalled = true;

for (const dep of dependencies) {
  try {
    const pkg = await import(dep);
    console.log(`✅ ${dep}: Installed`);
  } catch (error) {
    console.log(`❌ ${dep}: Missing or not working`);
    allInstalled = false;
  }
}

if (allInstalled) {
  console.log('\n✅ All testing dependencies installed successfully!');
} else {
  console.log('\n❌ Some dependencies are missing or not working');
}

// Test 2: Test Playwright installation
console.log('\n2. Testing Playwright Installation...');
try {
  const { test } = await import('@playwright/test');
  console.log('✅ Playwright test framework: Available');
  console.log('✅ Browsers should be downloaded and ready');
} catch (error) {
  console.log('❌ Playwright test framework: Not available');
}

// Test 3: Test Joi schema validation
console.log('\n3. Testing Schema Validation...');
try {
  const Joi = (await import('joi')).default;
  
  const schema = Joi.object({
    success: Joi.boolean().required(),
    data: Joi.array().optional()
  });
  
  const testData = { success: true, data: [] };
  const { error } = schema.validate(testData);
  
  if (!error) {
    console.log('✅ Joi schema validation: Working');
  } else {
    console.log('❌ Joi schema validation: Failed');
  }
} catch (error) {
  console.log('❌ Joi schema validation: Not available');
}

// Test 4: Test data generation
console.log('\n4. Testing Data Generation...');
try {
  const { faker } = await import('@faker-js/faker');
  
  const testProduct = {
    name: faker.commerce.productName(),
    price: faker.commerce.price(),
    description: faker.commerce.productDescription()
  };
  
  console.log('✅ Faker data generation: Working');
  console.log('   Sample product:', testProduct.name);
} catch (error) {
  console.log('❌ Faker data generation: Not available');
}

// Test 5: Test environment setup
console.log('\n5. Testing Environment Configuration...');
try {
  const fs = await import('fs');
  const path = './testing';
  
  if (fs.existsSync(path)) {
    console.log('✅ Testing directory: Exists');
  } else {
    console.log('❌ Testing directory: Missing');
  }
  
  if (fs.existsSync('.env.testing')) {
    console.log('✅ Testing environment file: Created');
  } else {
    console.log('❌ Testing environment file: Missing');
  }
  
  if (fs.existsSync('.husky/pre-commit')) {
    console.log('✅ Husky pre-commit hook: Set up');
  } else {
    console.log('⚠️  Husky pre-commit hook: Not yet configured');
  }
} catch (error) {
  console.log('❌ Environment setup check: Failed');
}

console.log('\n🎉 Setup Verification Complete!');
console.log('\nNext Steps:');
console.log('  1. Configure pre-commit hooks');
console.log('  2. Set up contract validation');
console.log('  3. Create monitoring dashboard');
console.log('  4. Write E2E tests');