#!/usr/bin/env node

/**
 * Test API Access for AI Context Window
 * Debug file loading and authentication issues
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

// Simulate browser environment localStorage
const localStorage = {
  store_owner_auth_token: 'test-token-placeholder'
};

async function testFileAPI() {
  console.log('🧪 Testing AI Context Window API Access...\n');

  // Test 1: List files endpoint
  console.log('1. Testing /api/source-files/list endpoint...');
  try {
    const response = await fetch(`${API_BASE}/api/source-files/list?path=src`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.store_owner_auth_token}`
      }
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    if (!data.success) {
      console.log(`   Error: ${data.message}`);
    } else {
      console.log(`   Files found: ${data.files?.length || 0}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Get file content endpoint
  console.log('2. Testing /api/source-files/content endpoint...');
  try {
    const testPath = 'src/components/ai-context/FileTreeNavigator.jsx';
    const response = await fetch(`${API_BASE}/api/source-files/content?path=${encodeURIComponent(testPath)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.store_owner_auth_token}`
      }
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${data.success}`);
    if (!data.success) {
      console.log(`   Error: ${data.message}`);
    } else {
      console.log(`   Content length: ${data.content?.length || 0} characters`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Test 3: Check if server is running
  console.log('3. Testing server connectivity...');
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      method: 'GET'
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Server is running: ${response.ok ? 'Yes' : 'No'}`);
  } catch (error) {
    console.log(`   Server connection failed: ${error.message}`);
    console.log('   💡 Make sure the backend server is running on port 3000');
  }
}

testFileAPI().catch(console.error);