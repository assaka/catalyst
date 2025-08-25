const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Investigating missing customization_snapshot...');
    
    const customizationId = '6233a191-ae58-483a-837c-7fa460e80a95';
    
    // Check what snapshot tables exist
    console.log('\n1. 📊 Available snapshot tables:');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%snapshot%' AND table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Found tables:');
    tables.forEach(table => console.log('   - ' + table.table_name));
    
    // Check the customization record
    console.log('\n2. 📋 Customization record details:');
    const [customization] = await sequelize.query(`
      SELECT id, name, file_path, current_code, baseline_code, status
      FROM hybrid_customizations 
      WHERE id = :id
    `, { replacements: { id: customizationId } });
    
    if (customization.length > 0) {
      const c = customization[0];
      console.log('   ✅ Customization exists:');
      console.log('     ID: ' + c.id);
      console.log('     Name: ' + c.name);
      console.log('     File: ' + c.file_path);
      console.log('     Status: ' + c.status);
      console.log('     Has current_code: ' + !!c.current_code);
      console.log('     Has baseline_code: ' + !!c.baseline_code);
      
      // Check if we can find differences
      if (c.current_code && c.baseline_code) {
        const hasDifference = c.current_code !== c.baseline_code;
        console.log('     Code is different: ' + hasDifference);
        
        if (hasDifference) {
          console.log('     Current code includes "Hamid Cart": ' + c.current_code.includes('Hamid Cart'));
          console.log('     Baseline code includes "My Cart": ' + c.baseline_code.includes('My Cart'));
        }
      }
    }
    
    // Check for any existing snapshots
    console.log('\n3. 🔍 Checking for existing snapshots:');
    
    // Try different possible snapshot table names
    const possibleTables = [
      'customization_snapshots',
      'hybrid_customization_snapshots', 
      'customizations_snapshots'
    ];
    
    for (const tableName of possibleTables) {
      try {
        const [snapshots] = await sequelize.query(`
          SELECT * FROM ${tableName} 
          WHERE customization_id = :id
          ORDER BY created_at DESC
        `, { replacements: { id: customizationId } });
        
        console.log('   Table ' + tableName + ': ' + snapshots.length + ' snapshots found');
        if (snapshots.length > 0) {
          snapshots.forEach(s => {
            console.log('     - Snapshot ID: ' + s.id + ' | Number: ' + s.snapshot_number);
          });
        }
      } catch (error) {
        console.log('   Table ' + tableName + ': does not exist');
      }
    }
    
    // Check how the diff integration service works
    console.log('\n4. 🔧 Testing diff integration service:');
    try {
      const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');
      const patches = await diffIntegrationService.getDiffPatchesForFile(
        'src/pages/Cart.jsx', 
        'any-user-id', 
        '157d4590-49bf-4b0b-bd77-abe131909528'
      );
      
      console.log('   getDiffPatchesForFile returned: ' + patches.length + ' patches');
      if (patches.length === 0) {
        console.log('   ❌ This confirms: no snapshots = no patches returned');
      }
    } catch (error) {
      console.log('   ❌ Error testing service: ' + error.message);
    }
    
    console.log('\n5. 🚨 Root Cause Analysis:');
    console.log('   The Hamid Cart patch exists in hybrid_customizations table');
    console.log('   BUT no corresponding snapshot exists in any snapshot table');
    console.log('   This means:');
    console.log('     ❌ Diff tab cannot display changes (needs snapshots)');
    console.log('     ❌ BrowserPreview cannot get modified code (uses diff service)');
    console.log('     ❌ The diff-integration-service finds no patches to return');
    console.log('');
    console.log('💡 Solution: Create a corresponding snapshot record');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();