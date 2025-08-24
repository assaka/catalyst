const { sequelize } = require('./backend/src/database/connection.js');
const { HybridCustomization } = require('./backend/src/models');

(async () => {
  try {
    console.log('🔍 Debugging hybrid patch API issue...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    const filePath = 'src/pages/Cart.jsx';
    
    // 1. Check all customizations for this file path
    console.log('\n1. Direct database query for file path:', filePath);
    const directQuery = await sequelize.query(
      'SELECT id, file_path, user_id, status, created_at FROM hybrid_customizations WHERE file_path = :filePath ORDER BY created_at DESC LIMIT 5',
      { 
        replacements: { filePath },
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    if (directQuery && directQuery.length > 0) {
      console.log('✅ Found customizations in database:');
      directQuery.forEach(cust => {
        console.log(`  - ID: ${cust.id}`);
        console.log(`    File: ${cust.file_path}`);
        console.log(`    User: ${cust.user_id}`);
        console.log(`    Status: ${cust.status}`);
        console.log(`    Created: ${cust.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No customizations found for exact file path');
    }
    
    // 2. Check all users in the system to see who might be the owner
    console.log('\n2. Checking available users:');
    const users = await sequelize.query(
      'SELECT id, email, role FROM users WHERE role = \'store_owner\' LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Available store owners:');
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    });
    
    // 3. Check what file paths exist in the database
    console.log('\n3. All unique file paths in customizations:');
    const filePaths = await sequelize.query(
      'SELECT DISTINCT file_path, COUNT(*) as count FROM hybrid_customizations GROUP BY file_path ORDER BY count DESC LIMIT 10',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    filePaths.forEach(fp => {
      console.log(`  - ${fp.file_path} (${fp.count} customization(s))`);
    });
    
    // 4. Test the API service directly with different user IDs
    console.log('\n4. Testing diff-integration-service directly:');
    
    try {
      const diffIntegrationService = require('./backend/src/services/diff-integration-service');
      const service = new diffIntegrationService();
      
      // Try with each store owner user ID
      for (const user of users) {
        console.log(`\n  Testing with user ${user.email} (${user.id}):`);
        try {
          const patches = await service.getDiffPatchesForFile(filePath, user.id);
          console.log(`    Found ${patches.length} patches`);
          if (patches.length > 0) {
            console.log(`    First patch ID: ${patches[0].id}`);
            console.log(`    Patch has snapshots: ${patches[0].snapshots ? patches[0].snapshots.length : 0}`);
          }
        } catch (error) {
          console.log(`    Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`    Service loading error: ${error.message}`);
      console.log('    Checking service file exists...');
      const fs = require('fs');
      const servicePath = './backend/src/services/diff-integration-service.js';
      const serviceExists = fs.existsSync(servicePath);
      console.log(`    Service file exists: ${serviceExists}`);
    }
    
    // 5. Test the actual API endpoint logic
    console.log('\n5. Testing API endpoint logic:');
    const { HybridCustomization } = require('./backend/src/models');
    
    // Test with the user that has the patches
    const targetUserId = '96dc49e7-bf45-4608-b506-8b5107cb4ad0';
    console.log(`\n  Testing API logic with user ${targetUserId}:`);
    
    try {
      const customizations = await HybridCustomization.findAll({
        where: {
          file_path: filePath,
          user_id: targetUserId,
          status: 'active'
        },
        include: [{
          association: 'snapshots',
          separate: true,
          order: [['snapshot_number', 'DESC']],
          limit: 10
        }]
      });
      
      console.log(`    Found ${customizations.length} customizations`);
      if (customizations.length > 0) {
        const customization = customizations[0];
        console.log(`    Customization ID: ${customization.id}`);
        console.log(`    Snapshots: ${customization.snapshots ? customization.snapshots.length : 'No snapshots loaded'}`);
        
        if (customization.snapshots && customization.snapshots.length > 0) {
          const snapshot = customization.snapshots[0];
          console.log(`    Latest snapshot: ${snapshot.id}`);
          console.log(`    Snapshot has operations: ${snapshot.patch_operations ? 'Yes' : 'No'}`);
        }
      }
    } catch (error) {
      console.log(`    API logic test error: ${error.message}`);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await sequelize.close();
  }
})();