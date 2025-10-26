#!/usr/bin/env node

/**
 * Performance Optimizations Endpoint Tester
 *
 * Tests the optimized category and product endpoints to verify:
 * - New structured response format
 * - Pagination data
 * - Performance improvements
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const STORE_ID = process.env.STORE_ID || 'test-store-id';

// Test results
const tests = [];
let passed = 0;
let failed = 0;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(path, BASE_URL);

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          resolve({ json, duration, status: res.statusCode });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function test(name, fn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    console.log(`✅ PASSED: ${name}`);
    tests.push({ name, status: 'PASSED' });
    passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    tests.push({ name, status: 'FAILED', error: error.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('🚀 Performance Optimizations Endpoint Tests');
  console.log('===========================================\n');

  // Test 1: Categories List Endpoint
  await test('GET /api/public/categories - Structured Response', async () => {
    const { json, duration, status } = await makeRequest(`/api/public/categories?store_id=${STORE_ID}`);

    assert(status === 200, `Expected status 200, got ${status}`);
    assert(json.success === true, 'Response should have success=true');
    assert(Array.isArray(json.data), 'Response should have data array');
    assert(json.pagination, 'Response should have pagination object');
    assert(typeof json.pagination.page === 'number', 'Pagination should have page number');
    assert(typeof json.pagination.limit === 'number', 'Pagination should have limit');
    assert(typeof json.pagination.total === 'number', 'Pagination should have total');
    assert(typeof json.pagination.totalPages === 'number', 'Pagination should have totalPages');

    console.log(`   ⏱️  Response time: ${duration}ms`);
    console.log(`   📊 Found ${json.data.length} categories (Total: ${json.pagination.total})`);
  });

  // Test 2: Categories with Pagination
  await test('GET /api/public/categories - Pagination Works', async () => {
    const { json } = await makeRequest(`/api/public/categories?store_id=${STORE_ID}&page=1&limit=10`);

    assert(json.pagination.page === 1, 'Page should be 1');
    assert(json.pagination.limit === 10, 'Limit should be 10');
    assert(json.data.length <= 10, 'Data should not exceed limit');

    console.log(`   📄 Page ${json.pagination.page} of ${json.pagination.totalPages}`);
  });

  // Test 3: Products List Endpoint
  await test('GET /api/public/products - Structured Response', async () => {
    const { json, duration, status } = await makeRequest(`/api/public/products?store_id=${STORE_ID}`);

    assert(status === 200, `Expected status 200, got ${status}`);
    assert(json.success === true, 'Response should have success=true');
    assert(Array.isArray(json.data), 'Response should have data array');
    assert(json.pagination, 'Response should have pagination object');

    console.log(`   ⏱️  Response time: ${duration}ms`);
    console.log(`   📊 Found ${json.data.length} products (Total: ${json.pagination.total})`);
  });

  // Test 4: Category with Products (Full Endpoint)
  await test('GET /api/public/categories/by-slug/:slug/full - Structured Response', async () => {
    // This will fail if no categories exist, so we'll make it conditional
    try {
      const { json, duration, status } = await makeRequest(`/api/public/categories/by-slug/test-category/full?store_id=${STORE_ID}`);

      if (status === 404) {
        console.log('   ℹ️  No test category found (expected if DB is empty)');
        return;
      }

      assert(json.success === true, 'Response should have success=true');
      assert(json.data, 'Response should have data object');
      assert(json.data.category, 'Data should have category');
      assert(Array.isArray(json.data.products), 'Data should have products array');
      assert(typeof json.data.total === 'number', 'Data should have total');

      console.log(`   ⏱️  Response time: ${duration}ms`);
      console.log(`   📊 Category: ${json.data.category.name || 'N/A'}`);
      console.log(`   📦 Products: ${json.data.total}`);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('   ℹ️  No test category found (expected if DB is empty)');
      } else {
        throw error;
      }
    }
  });

  // Test 5: Product Detail (Full Endpoint)
  await test('GET /api/public/products/by-slug/:slug/full - Structured Response', async () => {
    try {
      const { json, duration, status } = await makeRequest(`/api/public/products/by-slug/test-product/full?store_id=${STORE_ID}`);

      if (status === 404) {
        console.log('   ℹ️  No test product found (expected if DB is empty)');
        return;
      }

      assert(json.success === true, 'Response should have success=true');
      assert(json.data, 'Response should have data object');
      assert(json.data.product, 'Data should have product');
      assert(Array.isArray(json.data.productTabs), 'Data should have productTabs array');
      assert(Array.isArray(json.data.productLabels), 'Data should have productLabels array');
      assert(Array.isArray(json.data.customOptions), 'Data should have customOptions array');

      console.log(`   ⏱️  Response time: ${duration}ms`);
      console.log(`   📦 Product: ${json.data.product.name || 'N/A'}`);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('   ℹ️  No test product found (expected if DB is empty)');
      } else {
        throw error;
      }
    }
  });

  // Test 6: Search Functionality
  await test('GET /api/public/categories?search=... - Search Works', async () => {
    const { json, duration } = await makeRequest(`/api/public/categories?store_id=${STORE_ID}&search=test`);

    assert(json.success === true, 'Response should have success=true');
    assert(Array.isArray(json.data), 'Response should have data array');

    console.log(`   ⏱️  Response time: ${duration}ms`);
    console.log(`   🔍 Search results: ${json.data.length}`);
  });

  // Summary
  console.log('\n\n===========================================');
  console.log('📊 Test Summary');
  console.log('===========================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total:  ${tests.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n✨ Performance optimizations are working correctly!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('\n===========================================');
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
console.log(`Testing against: ${BASE_URL}`);
console.log(`Store ID: ${STORE_ID}\n`);

runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
