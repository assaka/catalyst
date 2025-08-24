const { sequelize } = require('./backend/src/database/connection.js');
const { HybridCustomization } = require('./backend/src/models');

(async () => {
  try {
    console.log('🔍 Debugging frontend authentication context...');
    
    const filePath = 'src/pages/Cart.jsx';
    const expectedUserId = '96dc49e7-bf45-4608-b506-8b5107cb4ad0'; // User who owns the patches
    
    // 1. Test the actual service call with correct user
    console.log('\n1. Testing service with correct user ID:');
    const { diffIntegrationService } = require('./backend/src/services/diff-integration-service');
    
    try {
      const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, expectedUserId);
      console.log(`✅ Service works: Found ${patches.length} patches`);
      if (patches.length > 0) {
        console.log(`   First patch: ${patches[0].id} with ${patches[0].diffHunks?.length || 0} diff hunks`);
      }
    } catch (error) {
      console.log(`❌ Service failed: ${error.message}`);
    }
    
    // 2. Check what other users exist and test with them
    console.log('\n2. Testing service with different user IDs:');
    const [users] = await sequelize.query(
      'SELECT id, email FROM users WHERE role = \'store_owner\' LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    for (const user of users) {
      try {
        const patches = await diffIntegrationService.getDiffPatchesForFile(filePath, user.id);
        console.log(`   ${user.email}: ${patches.length} patches`);
      } catch (error) {
        console.log(`   ${user.email}: Error - ${error.message}`);
      }
    }
    
    // 3. Check JWT token format (if any environment variables exist)
    console.log('\n3. Checking authentication setup:');
    console.log(`   JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    
    // 4. Check if there are any session tokens or cookies that might indicate current user
    console.log('\n4. Testing token validation:');
    if (process.env.JWT_SECRET) {
      // Create a test token for the correct user to see what it would look like
      const testToken = jwt.sign(
        { 
          id: expectedUserId, 
          email: 'playamin998@gmail.com',
          role: 'store_owner' 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );
      console.log(`   Test token for correct user: ${testToken.substring(0, 50)}...`);
      
      // Verify it can be decoded
      try {
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
        console.log(`   Token decodes to user ID: ${decoded.id}`);
      } catch (error) {
        console.log(`   Token verification failed: ${error.message}`);
      }
    }
    
    // 5. Simulate the exact API call
    console.log('\n5. Simulating exact API call logic:');
    
    // Mock request object like the API endpoint receives it
    const mockReq = {
      user: { id: expectedUserId }, // This would come from authMiddleware
      params: { filePath: filePath }
    };
    
    console.log(`   API would use user ID: ${mockReq.user.id}`);
    console.log(`   API would query file: ${mockReq.params.filePath}`);
    
    // Test the exact logic from the API endpoint
    const patches = await diffIntegrationService.getDiffPatchesForFile(
      mockReq.params.filePath, 
      mockReq.user.id
    );
    
    const apiResponse = {
      success: true,
      data: {
        file: { path: filePath },
        patches: patches,
        count: patches.length,
        type: 'hybrid_customization'
      },
      message: `Loaded ${patches.length} hybrid customization patches for ${filePath}`
    };
    
    console.log(`   API response: ${JSON.stringify(apiResponse, null, 2)}`);
    
    await sequelize.close();
    
    console.log('\n🎯 Summary:');
    console.log(`   - Patches exist in DB for user: ${expectedUserId}`);
    console.log(`   - Backend service works correctly when called with correct user ID`);  
    console.log(`   - Issue is likely: Frontend sends requests with different user ID than ${expectedUserId}`);
    console.log(`   - Need to check: What user ID does the frontend authentication actually provide?`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();