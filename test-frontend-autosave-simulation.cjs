const { sequelize } = require('./backend/src/database/connection');

console.log('🔍 Testing Frontend Auto-Save Simulation');
console.log('=====================================');

// Simulate what the frontend SHOULD be doing when auto-save is triggered
(async () => {
  try {
    // Get a real user and simulate their auth token
    const [users] = await sequelize.query("SELECT id, email FROM users WHERE role = 'store_owner' LIMIT 1;");
    if (users.length === 0) {
      throw new Error('No store_owner user found');
    }
    const userId = users[0].id;
    const userEmail = users[0].email;
    
    console.log('🔧 Test setup:');
    console.log(`   User ID: ${userId}`);
    console.log(`   User Email: ${userEmail}`);
    
    // Create a mock JWT token for testing (using the backend's jwt)
    const jwt = require('./backend/node_modules/jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'catalyst-jwt-secret-key';
    const mockToken = jwt.sign(
      { 
        id: userId,
        email: userEmail,
        role: 'store_owner',
        store_id: '157d4590-49bf-4b0b-bd77-abe131909528'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('📱 Created mock auth token for testing');
    
    // Simulate the exact auto-save payload the frontend should send
    const autoSavePayload = {
      filePath: 'src/pages/Products.jsx',
      originalCode: `import React from 'react';
export default function Products() {
  return <div>Original Products Page</div>;
}`,
      modifiedCode: `import React from 'react';
export default function Products() {
  return <div>Modified Products Page with new features</div>;
}`,
      changeSummary: 'Updated Products page with new features',
      changeType: 'manual_edit'
    };
    
    console.log('');
    console.log('🚀 Simulating frontend auto-save API call...');
    console.log(`   Target: https://catalyst-backend-fzhu.onrender.com/api/hybrid-patches/create`);
    console.log(`   Method: POST`);
    console.log(`   Auth: Bearer ${mockToken.substring(0, 20)}...`);
    console.log(`   Payload: filePath=${autoSavePayload.filePath}, originalLength=${autoSavePayload.originalCode.length}, modifiedLength=${autoSavePayload.modifiedCode.length}`);
    
    const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(autoSavePayload)
    });
    
    console.log('');
    console.log('📡 Backend Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    const responseData = await response.json();
    console.log(`   Body: ${JSON.stringify(responseData, null, 2)}`);
    
    if (response.ok) {
      console.log('');
      console.log('🎉 SUCCESS: Auto-save API call worked!');
      console.log('✅ Our enhanced logging should now be visible in Render.com logs');
      console.log('🔍 Check Render logs for:');
      console.log('   - "AUTO-SAVE REQUEST START"');
      console.log('   - "ULTRA DETAILED PAYLOAD ANALYSIS"');
      console.log('   - "HASH COMPARISON"');
      console.log('   - "CRITICAL COMPARISON CHECK"');
    } else {
      console.log('');
      console.log('❌ AUTO-SAVE API CALL FAILED');
      console.log('🔍 This explains why no patches are being created');
      console.log(`   Error: ${responseData.error || responseData.message}`);
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    console.error('Stack:', error.stack);
    await sequelize.close();
  }
})();