const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking snapshot table structure and content...');
    
    // First, check table structure
    console.log('\n1. 📋 Table structure:');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customization_snapshots'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log('   - ' + col.column_name + ': ' + col.data_type + ' (' + (col.is_nullable === 'YES' ? 'nullable' : 'not null') + ')');
    });
    
    // Now check the snapshot content
    console.log('\n2. 📊 Snapshot content:');
    const snapshotId = '127c2722-a114-4a8b-9075-c4b3a8421085';
    
    const [snapshot] = await sequelize.query(`
      SELECT * FROM customization_snapshots WHERE id = :id
    `, { replacements: { id: snapshotId } });
    
    if (snapshot.length > 0) {
      const s = snapshot[0];
      console.log('✅ Snapshot details:');
      console.log('   ID: ' + s.id);
      console.log('   Customization ID: ' + s.customization_id);
      console.log('   Snapshot Number: ' + s.snapshot_number);
      console.log('   Change Summary: ' + (s.change_summary || 'None'));
      console.log('   Created: ' + s.created_at);
      console.log('');
      
      // Check each possible content field
      Object.keys(s).forEach(key => {
        if (typeof s[key] === 'string' && s[key].length > 100) {
          const hasHamidCart = s[key].includes('Hamid Cart');
          const hasMyCart = s[key].includes('My Cart');
          console.log('   ' + key + ':');
          console.log('     Length: ' + s[key].length + ' chars');
          console.log('     Contains "Hamid Cart": ' + hasHamidCart);
          console.log('     Contains "My Cart": ' + hasMyCart);
          console.log('');
        }
      });
      
      // Test the diff integration service with this specific customization
      console.log('3. 🧪 Testing what diff service returns:');
      const { diffIntegrationService } = require('./backend/src/services/diff-integration-service.js');
      const patches = await diffIntegrationService.getDiffPatchesForFile(
        'src/pages/Cart.jsx', 
        'any-user', 
        '157d4590-49bf-4b0b-bd77-abe131909528'
      );
      
      if (patches.length > 0) {
        const patch = patches[0];
        console.log('   Patch returned by service:');
        console.log('     ID: ' + patch.id);
        console.log('     Change Summary: ' + patch.change_summary);
        console.log('     Has diffHunks: ' + !!patch.diffHunks);
        console.log('     DiffHunks count: ' + (patch.diffHunks ? patch.diffHunks.length : 0));
        
        if (patch.diffHunks && patch.diffHunks.length > 0) {
          console.log('     First hunk changes: ' + (patch.diffHunks[0].changes ? patch.diffHunks[0].changes.length : 0));
          
          // Check if any change contains Hamid Cart
          let foundHamidCart = false;
          patch.diffHunks.forEach(hunk => {
            if (hunk.changes) {
              hunk.changes.forEach(change => {
                if (change.content && change.content.includes('Hamid Cart')) {
                  foundHamidCart = true;
                  console.log('     ✅ Found Hamid Cart in change: ' + change.type + ' - "' + change.content.substring(0, 50) + '..."');
                }
              });
            }
          });
          
          if (!foundHamidCart) {
            console.log('     ❌ No Hamid Cart found in any diff hunk changes');
            console.log('     This means the snapshot is outdated and needs to be regenerated');
          }
        } else {
          console.log('     ❌ No diff hunks generated - something is wrong with the transformation');
        }
      } else {
        console.log('   ❌ No patches returned by service');
      }
      
    } else {
      console.log('❌ Snapshot not found');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();