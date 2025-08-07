const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE = 'http://localhost:5000/api';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Create a test image buffer (1x1 pixel PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

async function testFileManagerUpload() {
  console.log('🧪 Testing File Manager Upload with Magento Structure...\n');
  
  const tests = [
    {
      name: 'Category Image Upload',
      endpoint: '/file-manager/upload',
      filename: 'test-category.png',
      type: 'category'
    },
    {
      name: 'Product Image Upload',
      endpoint: '/file-manager/upload',
      filename: 'test-product.png',
      type: 'product'
    },
    {
      name: 'Asset Upload',
      endpoint: '/file-manager/upload',
      filename: 'test-asset.png',
      type: 'asset'
    }
  ];

  for (const test of tests) {
    console.log(`📤 Testing: ${test.name}`);
    console.log(`   Filename: ${test.filename}`);
    console.log(`   Expected path: ${getExpectedPath(test.filename, test.type)}`);
    
    try {
      const form = new FormData();
      form.append('file', testImageBuffer, test.filename);
      form.append('type', test.type);
      form.append('store_id', STORE_ID);

      const response = await axios.post(
        `${API_BASE}${test.endpoint}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'x-store-id': STORE_ID
          }
        }
      );

      if (response.data.success) {
        console.log(`   ✅ Upload successful!`);
        console.log(`   📍 Supabase Path: ${response.data.file.path}`);
        console.log(`   🔗 Public URL: ${response.data.file.url}`);
        console.log(`   📦 Bucket: ${response.data.file.bucket}`);
        console.log(`   🏪 Storage: Supabase`);
        
        // Verify URL is a Supabase URL
        if (response.data.file.url && response.data.file.url.includes('supabase')) {
          console.log(`   ✅ Confirmed: Using Supabase storage URL`);
        } else {
          console.log(`   ⚠️  Warning: URL may not be from Supabase storage`);
        }
      } else {
        console.log(`   ❌ Upload failed: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('');
  }
}

async function testMultipleUploads() {
  console.log('🧪 Testing Multiple File Upload...\n');
  
  const form = new FormData();
  
  // Add multiple test files
  const filenames = ['product1.png', 'product2.png', 'product3.png'];
  filenames.forEach(filename => {
    form.append('files', testImageBuffer, filename);
  });
  
  form.append('type', 'product');
  form.append('store_id', STORE_ID);

  try {
    const response = await axios.post(
      `${API_BASE}/file-manager/upload-multiple`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'x-store-id': STORE_ID
        }
      }
    );

    if (response.data.success) {
      console.log(`✅ Uploaded ${response.data.totalUploaded} files successfully`);
      console.log(`❌ Failed ${response.data.totalFailed} files`);
      
      response.data.uploaded.forEach(file => {
        console.log(`   📍 ${file.filename}: ${file.path}`);
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
  }
}

async function testStorageStats() {
  console.log('\n🧪 Testing Storage Statistics...\n');
  
  try {
    const response = await axios.get(
      `${API_BASE}/file-manager/stats`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'x-store-id': STORE_ID
        }
      }
    );

    if (response.data.success) {
      console.log('📊 Storage Statistics:');
      console.log(`   Total Files: ${response.data.stats.totalFiles}`);
      console.log(`   Total Size: ${response.data.stats.totalSizeMB} MB`);
      
      if (response.data.buckets) {
        console.log('\n📦 Buckets:');
        response.data.buckets.forEach(bucket => {
          console.log(`   - ${bucket.bucket}: ${bucket.fileCount} files (${bucket.totalSizeMB} MB)`);
        });
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
  }
}

function getExpectedPath(filename, type) {
  // Remove extension for path generation
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
  const cleanName = nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let magentoPath;
  if (cleanName.length >= 2) {
    magentoPath = `${cleanName[0]}/${cleanName[1]}/${filename}`;
  } else if (cleanName.length === 1) {
    magentoPath = `${cleanName[0]}/${cleanName[0]}/${filename}`;
  } else {
    magentoPath = `misc/${filename}`;
  }
  
  let baseFolder = '';
  if (type === 'category') {
    baseFolder = 'categories';
  } else if (type === 'product') {
    baseFolder = 'products';
  } else if (type === 'asset') {
    baseFolder = 'assets';
  }
  
  return `${baseFolder}/${magentoPath}`;
}

// Run tests
async function runAllTests() {
  console.log('======================================');
  console.log('🚀 Magento-Style Upload Test Suite');
  console.log('======================================\n');
  
  // Check if auth token is set
  if (AUTH_TOKEN === 'your-auth-token-here') {
    console.log('⚠️  Warning: Please set a valid AUTH_TOKEN in the script');
    console.log('   You can get one by logging into the admin panel\n');
  }
  
  await testFileManagerUpload();
  await testMultipleUploads();
  await testStorageStats();
  
  console.log('\n======================================');
  console.log('✅ Test Suite Complete');
  console.log('======================================');
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testFileManagerUpload, testMultipleUploads, testStorageStats };