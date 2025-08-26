/**
 * Debug authenticated auto-save functionality
 * This script tests the entire flow from authentication to database storage
 */

console.log('🔍 Debugging Authenticated Auto-Save Functionality');
console.log('='.repeat(55));

const testAuthenticatedAutoSave = async () => {
  try {
    console.log('\n📋 Step 1: Test Authentication & User Lookup...');
    
    // First, let's get a valid user from the database to test with
    const NODE_ENV = 'production';
    const DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';
    
    // Load the JWT library and models
    const jwt = require('jsonwebtoken');
    const { User } = require('./backend/src/models');
    
    // Get a valid user (store_owner or admin)
    const user = await User.findOne({
      where: {
        role: ['store_owner', 'admin'],
        is_active: true
      }
    });
    
    if (!user) {
      console.log('❌ No valid users found to test with');
      return;
    }
    
    console.log('✅ Found test user:', user.email, '(Role:', user.role + ')');
    
    console.log('\n📋 Step 2: Generate Valid JWT Token...');
    
    // Generate a valid JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Generated JWT token (first 30 chars):', token.substring(0, 30) + '...');
    
    console.log('\n📋 Step 3: Test Auto-Save API Call...');
    
    // Test the exact auto-save request
    const testPayload = {
      filePath: 'src/components/TestComponent.jsx',
      originalCode: 'function TestComponent() { return <div>Original</div>; }',
      modifiedCode: 'function TestComponent() { return <div>Modified Content</div>; }',
      changeSummary: 'Test auto-save changes',
      changeType: 'manual_edit',
      metadata: {
        source: 'debug_script',
        fileName: 'TestComponent.jsx',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('📤 Making authenticated request to production API...');
    
    const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log('   ' + key + ':', value);
    }
    
    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ AUTO-SAVE REQUEST SUCCESSFUL!');
      console.log('   The API endpoint is working correctly.');
      
      // Verify the data was actually saved
      console.log('\n📋 Step 4: Verify Database Storage...');
      
      const { CustomizationOverlay, CustomizationSnapshot } = require('./backend/src/models');
      
      const overlay = await CustomizationOverlay.findOne({
        where: {
          file_path: testPayload.filePath,
          user_id: user.id
        }
      });
      
      if (overlay) {
        console.log('✅ CustomizationOverlay created in database:');
        console.log('   ID:', overlay.id);
        console.log('   File Path:', overlay.file_path);
        console.log('   Status:', overlay.status);
        console.log('   Current Code Length:', overlay.current_code?.length || 0, 'chars');
        
        const snapshots = await CustomizationSnapshot.findAll({
          where: { customization_id: overlay.id }
        });
        console.log('✅ Associated snapshots:', snapshots.length);
        
        if (snapshots.length > 0) {
          console.log('   Latest snapshot:', snapshots[0].change_summary);
        }
      } else {
        console.log('❌ No overlay found in database - API might have failed silently');
      }
    } else {
      console.log('❌ AUTO-SAVE REQUEST FAILED');
      console.log('   This explains why auto-save is not working for users.');
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }
      
      console.log('📋 Failure Analysis:');
      console.log('   Error:', responseData.error || 'Unknown error');
      console.log('   Message:', responseData.message || 'No error message');
      
      if (response.status === 401) {
        console.log('\n🔍 Authentication Analysis:');
        console.log('   - Token was generated successfully');
        console.log('   - User exists in database');
        console.log('   - JWT_SECRET might be different on production server');
        console.log('   - Check server logs for authentication middleware details');
      } else if (response.status === 500) {
        console.log('\n🔍 Server Error Analysis:');
        console.log('   - Authentication might be working');
        console.log('   - Issue might be in the route handler or models');
        console.log('   - Check server logs for detailed error traces');
      }
    }
    
  } catch (error) {
    console.error('❌ Test script failed:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Main execution
const runTest = async () => {
  // Set environment for production testing
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';
  
  await testAuthenticatedAutoSave();
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. Check the production server logs during this test');
  console.log('2. Verify JWT_SECRET environment variable on production');
  console.log('3. Test with actual frontend tokens if available');
  console.log('4. Check authentication middleware logs on production server');
};

if (require.main === module) {
  runTest().catch(console.error);
}

module.exports = { testAuthenticatedAutoSave };