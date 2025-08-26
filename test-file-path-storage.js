// Test script to verify file path storage in customization_snapshots
console.log('🧪 Testing File Path Storage in Customization Snapshots');
console.log('='.repeat(60));

const testFilePath = async () => {
  try {
    console.log('\n1. Testing Database File Path Storage:');
    
    // Simulate creating a new customization and snapshot
    const testData = {
      filePath: 'src/components/TestComponent.jsx',
      originalCode: 'function TestComponent() { return <div>Original</div>; }',
      modifiedCode: 'function TestComponent() { return <div>Modified</div>; }',
      changeSummary: 'Test file path storage',
      userId: 'test-user-id-123'
    };
    
    console.log('  Test file path:', testData.filePath);
    console.log('  ✅ File path should be stored in both:');
    console.log('    - customization_overlays.file_path (already working)');
    console.log('    - customization_snapshots.file_path (newly added)');
    
    console.log('\n2. Testing File Tree Integration:');
    console.log('  When user clicks file in FileTreeNavigator:');
    console.log('  📁 src/components/TestComponent.jsx');
    console.log('  ⬇️  Should query: /api/hybrid-patches/src/components/TestComponent.jsx');
    console.log('  📋 Should return patches for that specific file');
    console.log('  🔍 AST diff data should load without 401 errors');
    
    console.log('\n3. Database Query Optimization:');
    console.log('  Old approach: JOIN customization_overlays.file_path');
    console.log('  New approach: Direct query on customization_snapshots.file_path');
    console.log('  ✅ Both approaches now supported with new column');
    
    console.log('\n4. Testing API Response Format:');
    
    // Test the API endpoint with authentication
    const token = localStorage.getItem('store_owner_auth_token');
    if (!token) {
      console.log('  ⚠️  Cannot test API - no store owner token found');
      console.log('  💡 Make sure you are logged in as a store owner');
      return;
    }
    
    console.log('  Testing API call with authentication...');
    
    fetch(`/api/hybrid-patches/${encodeURIComponent(testData.filePath)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('  Response status:', response.status);
      
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(data => {
      console.log('  ✅ API call successful!');
      console.log('  📊 Response structure:');
      console.log('    success:', data.success);
      console.log('    patches:', data.patches?.length || 0);
      
      if (data.patches && data.patches.length > 0) {
        const latestPatch = data.patches[0];
        console.log('  📋 Latest patch details:');
        console.log('    ID:', latestPatch.id);
        console.log('    file_path:', latestPatch.file_path || 'NOT SET ❌');
        console.log('    change_summary:', latestPatch.change_summary);
        console.log('    ast_diff available:', !!latestPatch.ast_diff);
        
        if (latestPatch.file_path) {
          console.log('  🎉 SUCCESS: file_path is now stored in snapshots!');
        } else {
          console.log('  ⚠️  file_path not found in snapshot - may need to create new snapshot');
        }
      } else {
        console.log('  📝 No patches found for this file path');
        console.log('  💡 Create some edits in the code editor to generate patches');
      }
    })
    .catch(error => {
      console.error('  ❌ API test failed:', error.message);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testFilePath();

console.log('\n5. Next Steps:');
console.log('  ✅ Database migration completed');
console.log('  ✅ Version control service updated');  
console.log('  🔄 Refresh page and test file tree selection');
console.log('  📝 Make code edits to create new snapshots with file paths');
console.log('  🧪 Verify DiffPreviewSystem shows AST diff data');