/**
 * Test the frontend API call by simulating what the FileTreeNavigator does
 * This will show us what the apiClient.get() method is actually returning
 */

// Simulate the API client logic for hybrid-patches endpoint
const simulateApiClient = () => {
  // Mock response that the backend returns
  const mockBackendResponse = {
    success: true,
    data: {
      file: { path: 'src/pages/Cart.jsx' },
      patches: [
        {
          id: '127c2722-a114-4a8b-9075-c4b3a8421085',
          customization_id: '6233a191-ae58-483a-837c-7fa460e80a95',
          change_type: 'initial',
          change_summary: 'Initial customization created',
          created_at: new Date().toISOString(),
          diffHunks: [
            {
              oldStart: 1,
              oldLines: 1,
              newStart: 1,
              newLines: 1,
              changes: [
                {
                  type: 'del',
                  content: 'function Cart() { return <div>Original Cart</div>; }',
                  oldLine: 1
                },
                {
                  type: 'add', 
                  content: 'function Cart() { return <div>Modified Cart with new features</div>; }',
                  newLine: 1
                }
              ]
            }
          ],
          metadata: {
            customization_name: 'Auto-saved changes to Cart.jsx',
            version_number: 1,
            component_type: 'component'
          }
        }
      ],
      count: 1,
      type: 'hybrid_customization'
    },
    message: 'Loaded 1 hybrid customization patches for src/pages/Cart.jsx'
  };

  console.log('🎭 Simulating API Client Response Transformation');
  console.log('================================================');
  
  console.log('\n1. 📡 Mock Backend Response:');
  console.log('   Success:', mockBackendResponse.success);
  console.log('   Data keys:', Object.keys(mockBackendResponse.data));
  console.log('   Patches count:', mockBackendResponse.data.patches.length);
  console.log('   First patch has diffHunks:', !!mockBackendResponse.data.patches[0].diffHunks);
  
  // Simulate the API client transformation logic
  console.log('\n2. 🔄 API Client Transformation Analysis:');
  
  const endpoint = 'hybrid-patches/src%2Fpages%2FCart.jsx';
  
  // Check if this is a "list endpoint" (from api client logic)
  const isListEndpoint = endpoint.includes('/list') || 
                        endpoint.endsWith('s') && !endpoint.includes('/stats') && 
                        !endpoint.includes('/status') && 
                        !endpoint.includes('/config') &&
                        !endpoint.includes('/test') &&
                        !endpoint.includes('/save');
  
  console.log('   Endpoint:', endpoint);
  console.log('   Is list endpoint:', isListEndpoint);
  
  // Check for special handling
  const isStorageEndpoint = endpoint.includes('/storage/');
  const isCustomMappingsEndpoint = endpoint.includes('/custom-mappings');
  
  console.log('   Is storage endpoint:', isStorageEndpoint);
  console.log('   Is custom mappings endpoint:', isCustomMappingsEndpoint);
  
  let finalResponse;
  
  if (isStorageEndpoint || isCustomMappingsEndpoint) {
    console.log('   🎯 Special handling: Returning raw response');
    finalResponse = mockBackendResponse;
  } else if (isListEndpoint && mockBackendResponse.success && mockBackendResponse.data) {
    console.log('   🎯 List endpoint transformation: Extracting array from data');
    if (Array.isArray(mockBackendResponse.data)) {
      finalResponse = mockBackendResponse.data;
    } else {
      // Look for array properties in the data object
      const dataEntries = Object.entries(mockBackendResponse.data);
      let found = false;
      for (const [key, value] of dataEntries) {
        if (Array.isArray(value) && key !== 'gdpr_countries') {
          console.log(`   🎯 Found array property "${key}" with ${value.length} items`);
          finalResponse = value;
          found = true;
          break;
        }
      }
      if (!found) {
        console.log('   🎯 No array found, wrapping data in array');
        finalResponse = [mockBackendResponse.data];
      }
    }
  } else {
    console.log('   🎯 No transformation: Returning raw response');
    finalResponse = mockBackendResponse;
  }
  
  console.log('\n3. 📋 Final Response Analysis:');
  console.log('   Response type:', typeof finalResponse);
  console.log('   Is array:', Array.isArray(finalResponse));
  
  if (Array.isArray(finalResponse)) {
    console.log('   Array length:', finalResponse.length);
    if (finalResponse.length > 0) {
      console.log('   First element keys:', Object.keys(finalResponse[0]));
      console.log('   First element has patches:', !!finalResponse[0].patches);
    }
  } else if (typeof finalResponse === 'object') {
    console.log('   Object keys:', Object.keys(finalResponse));
    console.log('   Has success property:', !!finalResponse.success);
    console.log('   Has data property:', !!finalResponse.data);
    if (finalResponse.data) {
      console.log('   Data has patches:', !!finalResponse.data.patches);
      console.log('   Patches length:', finalResponse.data.patches?.length || 0);
    }
  }
  
  console.log('\n4. 🎯 FileTreeNavigator Expected Behavior:');
  console.log('   Code: const hybridPatchData = await apiClient.get(`hybrid-patches/${encodeURIComponent(file.path)}`);');
  console.log('   Code: if (hybridPatchData && hybridPatchData.success && hybridPatchData.data) {');
  console.log('   Code: const patches = hybridPatchData.data.patches || [];');
  
  if (finalResponse && finalResponse.success && finalResponse.data && finalResponse.data.patches) {
    console.log('   ✅ Expected path: SUCCESS - patches would be extracted');
    console.log(`   📋 Patches to dispatch: ${finalResponse.data.patches.length}`);
    
    // Check if diffHunks are present
    const patchesWithDiffs = finalResponse.data.patches.filter(p => p.diffHunks && p.diffHunks.length > 0);
    console.log(`   📋 Patches with diffHunks: ${patchesWithDiffs.length}`);
    
    if (patchesWithDiffs.length > 0) {
      console.log('   ✅ DiffPreviewSystem should display these patches');
    } else {
      console.log('   ❌ DiffPreviewSystem would show "No hybrid customizations detected"');
    }
  } else {
    console.log('   ❌ Expected path: FAILED - condition check would fail');
    console.log('   📋 This explains why DiffPreviewSystem shows "No hybrid customizations detected"');
    
    // Check what the actual condition values would be
    console.log('\n   🔍 Debug condition values:');
    console.log('   - hybridPatchData:', !!finalResponse);
    console.log('   - hybridPatchData.success:', !!finalResponse?.success);
    console.log('   - hybridPatchData.data:', !!finalResponse?.data);
    console.log('   - hybridPatchData.data.patches:', !!finalResponse?.data?.patches);
  }
  
  return finalResponse;
};

// Run the simulation
const result = simulateApiClient();

console.log('\n5. 🔧 Recommended Fix:');
if (result && result.success && result.data && result.data.patches) {
  console.log('   ✅ API client transformation is working correctly');
  console.log('   🎯 Issue might be elsewhere - check event dispatching or timing');
} else {
  console.log('   ❌ API client transformation is breaking the response format');
  console.log('   🎯 Fix: Add special handling for hybrid-patches endpoint in API client');
  console.log('   🎯 Or: Use skipTransform header in the FileTreeNavigator call');
}

console.log('\n6. 📋 Quick Test Fix:');
console.log('   In FileTreeNavigator.jsx line ~337, try:');
console.log('   const hybridPatchData = await apiClient.get(`hybrid-patches/${encodeURIComponent(file.path)}`, {');
console.log('     "x-skip-transform": "true"');
console.log('   });');