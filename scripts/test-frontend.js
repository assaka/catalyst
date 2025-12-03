#!/usr/bin/env node

// Enhanced frontend testing with simulated browser behavior
// Use built-in fetch (Node.js 18+) or fallback

const FRONTEND_URL = 'https://daino-six-ashy.vercel.app';
const BACKEND_URL = 'https://daino.onrender.com';

// Test if JavaScript APIs are working by simulating browser behavior
async function testStorefrontAPIs() {
  console.log('🧪 Testing Storefront APIs (simulating frontend calls)...');
  
  const results = {
    stores: { success: false, data: [] },
    products: { success: false, data: [] },
    categories: { success: false, data: [] },
    taxes: { success: false, data: [] },
    attributes: { success: false, data: [] }
  };
  
  try {
    // Test stores first to get a store ID
    console.log('📍 Testing stores API...');
    const storesResponse = await fetch(`${BACKEND_URL}/api/public/stores`);
    const storesData = await storesResponse.json();
    
    if (storesResponse.ok && Array.isArray(storesData) && storesData.length > 0) {
      results.stores = { success: true, data: storesData };
      console.log(`✅ Stores: Found ${storesData.length} stores`);
      
      const testStore = storesData.find(s => s.slug === 'hamid2') || storesData[0];
      const storeId = testStore.id;
      console.log(`🎯 Using store: ${testStore.name} (${testStore.slug})`);
      
      // Test other APIs with the store ID
      const apiTests = [
        {
          name: 'products',
          url: `${BACKEND_URL}/api/public/products?store_id=${storeId}&limit=5`,
          key: 'products'
        },
        {
          name: 'categories', 
          url: `${BACKEND_URL}/api/public/categories?store_id=${storeId}&limit=5`,
          key: 'categories'
        },
        {
          name: 'taxes',
          url: `${BACKEND_URL}/api/public/tax?store_id=${storeId}`,
          key: 'taxes'
        },
        {
          name: 'attributes',
          url: `${BACKEND_URL}/api/public/attributes?store_id=${storeId}`,
          key: 'attributes'
        }
      ];
      
      for (const test of apiTests) {
        try {
          console.log(`📍 Testing ${test.name} API...`);
          const response = await fetch(test.url);
          const data = await response.json();
          
          if (response.ok) {
            results[test.key] = { success: true, data: Array.isArray(data) ? data : [data] };
            console.log(`✅ ${test.name}: ${results[test.key].data.length} items`);
          } else {
            results[test.key] = { success: false, error: data.message || `HTTP ${response.status}`, data: [] };
            console.log(`❌ ${test.name}: ${results[test.key].error}`);
          }
        } catch (error) {
          results[test.key] = { success: false, error: error.message, data: [] };
          console.log(`❌ ${test.name}: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ No stores found or stores API failed');
    }
    
  } catch (error) {
    console.log('❌ Failed to test storefront APIs:', error.message);
  }
  
  return results;
}

// Test frontend page accessibility and basic structure
async function testFrontendPage() {
  console.log('🌐 Testing Frontend Page Structure...');
  
  const testUrls = [
    `${FRONTEND_URL}`,
    `${FRONTEND_URL}/hamid2/storefront`,
    `${FRONTEND_URL}/hamid2/storefront/category/test`
  ];
  
  const results = {};
  
  for (const url of testUrls) {
    try {
      console.log(`📍 Testing: ${url}`);
      const response = await fetch(url);
      const html = await response.text();
      
      const analysis = {
        status: response.status,
        hasRoot: html.includes('id="root"'),
        hasReact: html.includes('React') || html.includes('react'),
        hasVite: html.includes('vite') || html.includes('Vite'),
        hasError: html.includes('error') || html.includes('Error'),
        contentLength: html.length,
        title: html.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found'
      };
      
      results[url] = {
        success: response.ok,
        analysis
      };
      
      if (response.ok) {
        console.log(`✅ ${url.split('/').pop() || 'root'}: ${analysis.status} - ${analysis.title}`);
        if (analysis.hasError) {
          console.log(`⚠️  May contain errors in HTML`);
        }
      } else {
        console.log(`❌ ${url.split('/').pop() || 'root'}: ${analysis.status}`);
      }
      
    } catch (error) {
      results[url] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${url.split('/').pop() || 'root'}: ${error.message}`);
    }
  }
  
  return results;
}

// Test if the new API architecture is being used
async function testAPIArchitecture() {
  console.log('🏗️ Testing API Architecture...');
  
  // Try to detect if the new API clients are being used by checking specific patterns
  try {
    const storefrontResponse = await fetch(`${FRONTEND_URL}/hamid2/storefront`);
    const html = await storefrontResponse.text();
    
    // Look for signs that the new API is being used
    const analysis = {
      hasStorefrontAPI: html.includes('StorefrontProduct') || html.includes('storefront-entities'),
      hasAdminAPI: html.includes('AdminProduct') || html.includes('admin-entities'),  
      hasOldAPI: html.includes('entities.js'),
      hasPublicRequests: html.includes('PublicRequest') || html.includes('public/'),
      bundleSize: html.length
    };
    
    console.log('📊 Frontend Architecture Analysis:');
    console.log(`  Bundle size: ${(analysis.bundleSize / 1024).toFixed(1)}KB`);
    console.log(`  Uses new Storefront API: ${analysis.hasStorefrontAPI ? '✅' : '⚠️'}`);
    console.log(`  Contains old API references: ${analysis.hasOldAPI ? '⚠️' : '✅'}`);
    console.log(`  Has public request patterns: ${analysis.hasPublicRequests ? '✅' : '⚠️'}`);
    
    return {
      success: storefrontResponse.ok,
      analysis
    };
    
  } catch (error) {
    console.log('❌ Failed to analyze API architecture:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main test runner
async function runFrontendTests() {
  console.log('🚀 Starting Enhanced Frontend Tests...\n');
  
  const results = {
    storefrontAPIs: {},
    frontendPages: {},
    apiArchitecture: {}
  };
  
  // Test storefront APIs
  results.storefrontAPIs = await testStorefrontAPIs();
  console.log('');
  
  // Test frontend pages
  results.frontendPages = await testFrontendPage();
  console.log('');
  
  // Test API architecture
  results.apiArchitecture = await testAPIArchitecture();
  console.log('');
  
  // Summary
  console.log('📊 Enhanced Test Summary:');
  
  const storeResults = results.storefrontAPIs;
  console.log(`Stores API: ${storeResults.stores.success ? '✅' : '❌'} (${storeResults.stores.data.length} stores)`);
  console.log(`Products API: ${storeResults.products.success ? '✅' : '❌'} (${storeResults.products.data.length} products)`);
  console.log(`Categories API: ${storeResults.categories.success ? '✅' : '❌'} (${storeResults.categories.data.length} categories)`);
  console.log(`Taxes API: ${storeResults.taxes.success ? '✅' : '❌'} (${storeResults.taxes.data.length} items)`);
  console.log(`Attributes API: ${storeResults.attributes.success ? '✅' : '❌'} (${storeResults.attributes.data.length} items)`);
  
  const pageResults = results.frontendPages;
  const pageCount = Object.keys(pageResults).length;
  const successfulPages = Object.values(pageResults).filter(r => r.success).length;
  console.log(`Frontend Pages: ${successfulPages}/${pageCount} accessible`);
  
  console.log(`API Architecture: ${results.apiArchitecture.success ? '✅' : '❌'}`);
  
  // Identify critical issues
  const criticalIssues = [];
  
  if (!storeResults.stores.success) {
    criticalIssues.push('Stores API not working');
  }
  
  if (!storeResults.products.success && !storeResults.categories.success) {
    criticalIssues.push('Both Products and Categories APIs failing');
  }
  
  if (successfulPages === 0) {
    criticalIssues.push('No frontend pages accessible');
  }
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 Critical Issues Found:');
    criticalIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!storeResults.products.success) {
    console.log('  - Check backend public products endpoint implementation');
  }
  
  if (!storeResults.categories.success) {
    console.log('  - Check backend public categories endpoint implementation');  
  }
  
  if (results.apiArchitecture.analysis?.hasOldAPI) {
    console.log('  - Some components still using old API - need to migrate');
  }
  
  if (successfulPages < pageCount) {
    console.log('  - Some frontend routes returning 404 - check routing configuration');
  }
  
  const overallSuccess = criticalIssues.length === 0;
  
  if (overallSuccess) {
    console.log('\n🎉 Enhanced tests completed successfully!');
  } else {
    console.log('\n⚠️ Enhanced tests completed with issues to address.');
  }
  
  return {
    success: overallSuccess,
    results,
    criticalIssues
  };
}

// Handle uncaught errors  
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run enhanced tests
runFrontendTests()
  .then(({ success, results, criticalIssues }) => {
    console.log('\n✅ Enhanced testing completed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Enhanced testing failed:', error);
    process.exit(1);
  });

export { runFrontendTests };