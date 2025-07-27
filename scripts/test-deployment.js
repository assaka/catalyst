#!/usr/bin/env node

// Automated deployment testing script
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const FRONTEND_URL = 'https://catalyst-six-ashy.vercel.app';
const BACKEND_URL = 'https://catalyst-backend-fzhu.onrender.com';

// Test functions
async function testBackendHealth() {
  console.log('🏥 Testing backend health...');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok) {
      console.log('✅ Backend health check passed');
      return true;
    } else {
      console.log('❌ Backend health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend health check error:', error.message);
    return false;
  }
}

async function testPublicStores() {
  console.log('🏪 Testing public stores endpoint...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/public/stores`);
    const data = await response.json();
    
    if (response.ok && Array.isArray(data) && data.length > 0) {
      console.log(`✅ Public stores endpoint returned ${data.length} stores`);
      console.log(`📍 Found store: ${data[0].name} (${data[0].slug})`);
      return { success: true, stores: data };
    } else {
      console.log('❌ Public stores endpoint failed or returned no data');
      return { success: false, stores: [] };
    }
  } catch (error) {
    console.log('❌ Public stores endpoint error:', error.message);
    return { success: false, stores: [] };
  }
}

async function testPublicProducts(storeId) {
  console.log('📦 Testing public products endpoint...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/public/products?store_id=${storeId}&limit=5`);
    const data = await response.json();
    
    if (response.ok) {
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Public products endpoint returned ${data.length} products`);
        console.log(`📍 Sample product: ${data[0].name}`);
        return { success: true, products: data };
      } else {
        console.log('⚠️ Public products endpoint returned empty array (no products in store)');
        return { success: true, products: [] };
      }
    } else {
      console.log('❌ Public products endpoint failed:', response.status);
      console.log('Error details:', data);
      return { success: false, products: [] };
    }
  } catch (error) {
    console.log('❌ Public products endpoint error:', error.message);
    return { success: false, products: [] };
  }
}

async function testPublicCategories(storeId) {
  console.log('📂 Testing public categories endpoint...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/public/categories?store_id=${storeId}&limit=5`);
    const data = await response.json();
    
    if (response.ok) {
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Public categories endpoint returned ${data.length} categories`);
        console.log(`📍 Sample category: ${data[0].name}`);
        return { success: true, categories: data };
      } else {
        console.log('⚠️ Public categories endpoint returned empty array (no categories in store)');
        return { success: true, categories: [] };
      }
    } else {
      console.log('❌ Public categories endpoint failed:', response.status);
      console.log('Error details:', data);
      return { success: false, categories: [] };
    }
  } catch (error) {
    console.log('❌ Public categories endpoint error:', error.message);
    return { success: false, categories: [] };
  }
}

async function testStorefrontPage() {
  console.log('🌐 Testing storefront page...');
  try {
    const response = await fetch(`${FRONTEND_URL}/hamid2/storefront`);
    
    if (response.ok) {
      const html = await response.text();
      
      // Check if the page contains expected elements
      const hasStoreProvider = html.includes('StoreProvider') || html.includes('storefront');
      const hasReactApp = html.includes('root') || html.includes('React');
      
      if (hasReactApp) {
        console.log('✅ Storefront page loaded successfully');
        console.log('📍 React app detected');
        return { success: true };
      } else {
        console.log('⚠️ Storefront page loaded but React app not detected');
        return { success: true, warning: 'React app not detected' };
      }
    } else {
      console.log('❌ Storefront page failed to load:', response.status);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Storefront page error:', error.message);
    return { success: false };
  }
}

async function testPublicEndpoints(storeId) {
  console.log('🔧 Testing other public endpoints...');
  
  const endpoints = [
    'tax',
    'attributes', 
    'product-labels',
    'attribute-sets',
    'seo-templates',
    'seo-settings',
    'cookie-consent-settings'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/public/${endpoint}?store_id=${storeId}&limit=3`);
      const data = await response.json();
      
      if (response.ok) {
        results[endpoint] = {
          success: true,
          count: Array.isArray(data) ? data.length : 1,
          status: response.status
        };
        console.log(`✅ ${endpoint}: ${results[endpoint].count} items`);
      } else {
        results[endpoint] = {
          success: false,
          status: response.status,
          error: data.message || 'Unknown error'
        };
        console.log(`❌ ${endpoint}: ${response.status} - ${results[endpoint].error}`);
      }
    } catch (error) {
      results[endpoint] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  return results;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting automated deployment tests...\n');
  
  const results = {
    backend_health: false,
    stores: { success: false, stores: [] },
    products: { success: false, products: [] },
    categories: { success: false, categories: [] },
    storefront: { success: false },
    public_endpoints: {}
  };
  
  // Test backend health
  results.backend_health = await testBackendHealth();
  
  if (!results.backend_health) {
    console.log('\n❌ Backend is not healthy, skipping remaining tests');
    return results;
  }
  
  console.log('');
  
  // Test public stores
  results.stores = await testPublicStores();
  
  if (!results.stores.success || results.stores.stores.length === 0) {
    console.log('\n❌ No stores available, skipping store-specific tests');
    return results;
  }
  
  console.log('');
  
  // Use the first store for testing
  const testStore = results.stores.stores[0];
  const storeId = testStore.id;
  
  // Test products and categories for the store
  results.products = await testPublicProducts(storeId);
  console.log('');
  
  results.categories = await testPublicCategories(storeId);
  console.log('');
  
  // Test other public endpoints
  results.public_endpoints = await testPublicEndpoints(storeId);
  console.log('');
  
  // Test storefront page
  results.storefront = await testStorefrontPage();
  console.log('');
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`Backend Health: ${results.backend_health ? '✅' : '❌'}`);
  console.log(`Public Stores: ${results.stores.success ? '✅' : '❌'} (${results.stores.stores.length} stores)`);
  console.log(`Public Products: ${results.products.success ? '✅' : '❌'} (${results.products.products.length} products)`);
  console.log(`Public Categories: ${results.categories.success ? '✅' : '❌'} (${results.categories.categories.length} categories)`);
  console.log(`Storefront Page: ${results.storefront.success ? '✅' : '❌'}`);
  
  const endpointCount = Object.keys(results.public_endpoints).length;
  const successfulEndpoints = Object.values(results.public_endpoints).filter(r => r.success).length;
  console.log(`Public Endpoints: ${successfulEndpoints}/${endpointCount} successful`);
  
  // Overall status
  const criticalTests = [
    results.backend_health,
    results.stores.success,
    results.storefront.success
  ];
  
  const allCriticalPassed = criticalTests.every(test => test);
  
  if (allCriticalPassed) {
    console.log('\n🎉 All critical tests passed! Deployment appears successful.');
  } else {
    console.log('\n⚠️ Some critical tests failed. Please check the deployment.');
  }
  
  return results;
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n✅ Testing completed');
      
      // Exit with appropriate code
      const hasFailures = !results.backend_health || !results.stores.success || !results.storefront.success;
      process.exit(hasFailures ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };