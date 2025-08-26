const jwt = require('jsonwebtoken');
const { User, CustomizationOverlay, CustomizationSnapshot } = require('./src/models');

console.log('🔍 Debugging Authenticated Auto-Save Functionality');
console.log('=======================================================');

(async () => {
  try {
    console.log('\n📋 Step 1: Test User Lookup...');
    
    // Get a valid user (store_owner or admin)
    const user = await User.findOne({
      where: {
        role: ['store_owner', 'admin'],
        is_active: true
      }
    });
    
    if (!user) {
      console.log('❌ No valid users found');
      return;
    }
    
    console.log('✅ Found test user:', user.email, '(Role:', user.role + ')');
    
    console.log('\n📋 Step 2: Generate JWT Token...');
    
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
    console.log('🔑 JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('🔑 JWT_SECRET preview:', JWT_SECRET.substring(0, 10) + '...');
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ JWT token generated (length:', token.length + ')');
    
    console.log('\n📋 Step 3: Test Production API...');
    
    const testPayload = {
      filePath: 'src/components/TestComponent.jsx',
      originalCode: 'function Test() { return <div>Original</div>; }',
      modifiedCode: 'function Test() { return <div>Modified</div>; }',
      changeSummary: 'Debug test changes',
      changeType: 'manual_edit'
    };
    
    const response = await fetch('https://catalyst-backend-fzhu.onrender.com/api/hybrid-patches/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📊 Response Status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response Body:', responseText);
    
    if (response.status === 401) {
      console.log('\n🔍 AUTHENTICATION ISSUE IDENTIFIED:');
      console.log('   - Local JWT_SECRET differs from production');
      console.log('   - This explains why authenticated users get 401 errors');
      console.log('   - Frontend tokens work for other routes but fail for auto-save');
    } else if (response.ok) {
      console.log('✅ SUCCESS - Auto-save is working!');
      
      // Check database
      const overlay = await CustomizationOverlay.findOne({
        where: { file_path: testPayload.filePath, user_id: user.id }
      });
      console.log('📊 Database record created:', !!overlay);
    } else {
      console.log('❌ Other error - Status:', response.status);
    }
    
    console.log('\n💡 CONCLUSION:');
    if (response.status === 401) {
      console.log('   The issue is JWT_SECRET mismatch between local and production');
      console.log('   Frontend gets tokens from production login, but they fail validation');
      console.log('   Check production environment variables');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();