const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Testing authenticated overlay scenario...');
    
    // Test what happens when user authentication is involved
    const filePath = 'src/pages/Cart.jsx';
    
    // Get a user ID from the database to simulate authenticated request
    const [users] = await sequelize.query('SELECT id, email FROM users WHERE role = $1 LIMIT 1', {
      bind: ['store_owner']
    });
    
    if (users.length === 0) {
      console.log('❌ No store_owner users found for testing');
      return;
    }
    
    const testUserId = users[0].id;
    console.log('👤 Testing with user: ' + users[0].email + ' (ID: ' + testUserId + ')');
    
    // Test the query exactly as it runs in the API endpoint
    console.log('\n📊 Running the exact queries from the API endpoint:');
    
    // 1. Count total overlays for file
    const [totalResult] = await sequelize.query('SELECT COUNT(*) as count FROM customization_overlays WHERE file_path = $1', {
      bind: [filePath]
    });
    console.log('📊 DEBUG: Found ' + totalResult[0].count + ' total overlays for ' + filePath);
    
    // 2. Count active overlays
    const [activeResult] = await sequelize.query('SELECT COUNT(*) as count FROM customization_overlays WHERE file_path = $1 AND status = $2', {
      bind: [filePath, 'active']
    });
    console.log('📊 DEBUG: Found ' + activeResult[0].count + ' active overlays for ' + filePath);
    
    // 3. Test main query (exactly as in API endpoint)
    console.log('🔍 DEBUG: Executing main query with conditions: file_path=\'' + filePath + '\', status=\'active\', current_code IS NOT NULL');
    
    const [overlayResult] = await sequelize.query('SELECT id, file_path, status, LENGTH(current_code) as code_length, updated_at FROM customization_overlays WHERE file_path = $1 AND status = $2 AND current_code IS NOT NULL ORDER BY updated_at DESC LIMIT 1', {
      bind: [filePath, 'active']
    });
    
    const overlay = overlayResult.length > 0 ? overlayResult[0] : null;
    
    if (overlay) {
      console.log('✅ DEBUG: Overlay found! ID=' + overlay.id + ', status=' + overlay.status + ', current_code length=' + (overlay.current_code ? overlay.current_code.length : 'null'));
      console.log('✅ This means the API endpoint SHOULD find the overlay!');
      
      // Check if it contains "Your Cart"
      const containsYourCart = overlay.current_code && overlay.current_code.includes('Your Cart');
      console.log('🔍 Contains "Your Cart": ' + containsYourCart);
      
      if (containsYourCart) {
        console.log('✅ The overlay contains the expected "Your Cart" text');
        console.log('🎯 CONCLUSION: The database and query logic are correct');
        console.log('⚠️  The issue must be in:');
        console.log('   1. Authentication/token validation');
        console.log('   2. Request routing/middleware');
        console.log('   3. Frontend API client implementation');
        console.log('   4. Network/deployment issues');
      }
    } else {
      console.log('❌ DEBUG: No overlay found with full conditions. Testing without current_code condition...');
      
      const overlayWithoutCodeCheck = await CustomizationOverlay.findOne({
        where: {
          file_path: filePath,
          status: 'active'
        },
        order: [['updated_at', 'DESC']]
      });
      
      if (overlayWithoutCodeCheck) {
        const codeStatus = overlayWithoutCodeCheck.current_code === null ? 'NULL' : 
                          (overlayWithoutCodeCheck.current_code === '' ? 'EMPTY STRING' : 'HAS CONTENT');
        console.log('🔍 DEBUG: Found overlay without current_code check - current_code is: ' + codeStatus);
      } else {
        console.log('❌ DEBUG: No overlay found even without current_code condition');
      }
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();