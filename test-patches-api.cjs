const { sequelize } = require('./backend/src/database/connection');

(async () => {
  try {
    console.log('🔍 Testing patches/baselines endpoint response structure...');
    
    const files = await sequelize.query(`
      SELECT DISTINCT file_path, baseline_code, code_hash, version, file_type, file_size, last_modified
      FROM file_baselines ORDER BY file_path ASC LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });
    
    // Simulate the exact response structure from the API
    const apiResponse = {
      success: true,
      data: {
        files: files || [],
        totalFiles: (files || []).length
      }
    };
    
    console.log('📡 API Response Structure:');
    console.log('  success:', apiResponse.success);
    console.log('  data exists:', !!apiResponse.data);
    console.log('  data.files exists:', !!apiResponse.data.files);
    console.log('  data.files length:', apiResponse.data.files?.length);
    console.log('  data.files type:', typeof apiResponse.data.files);
    if (Array.isArray(apiResponse.data.files) && apiResponse.data.files.length > 0) {
      console.log('  Sample files:', apiResponse.data.files.slice(0, 3).map(f => f.file_path));
    } else {
      console.log('  Files data:', apiResponse.data.files);
    }
    
    // Test what the API client condition check would see
    console.log('\n📋 API Client condition checks:');
    const data = apiResponse;
    console.log('  - data exists:', !!data);
    console.log('  - data.success:', data && data.success);
    console.log('  - data.data exists:', data && data.data);
    console.log('  - data.data.files exists:', data && data.data && data.data.files);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();