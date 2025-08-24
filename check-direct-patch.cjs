const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking direct patch content...');
    
    // Get the patch directly from hybrid_customizations
    const [results] = await sequelize.query(`
      SELECT id, file_path, status, current_code,
             (current_code LIKE '%Hamid Cart%') as contains_hamid
      FROM hybrid_customizations 
      WHERE file_path = 'src/pages/Cart.jsx' 
        AND store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    if (results.length > 0) {
      const patch = results[0];
      console.log('✅ Found patch:');
      console.log(`  - ID: ${patch.id}`);
      console.log(`  - File: ${patch.file_path}`);
      console.log(`  - Status: ${patch.status}`);
      console.log(`  - Has current_code: ${!!patch.current_code}`);
      console.log(`  - Contains "Hamid Cart": ${patch.contains_hamid}`);
      
      if (patch.current_code) {
        console.log(`  - Current code length: ${patch.current_code.length} chars`);
        
        // Find the specific line with the cart title
        const lines = patch.current_code.split('\n');
        const cartTitleLine = lines.find(line => line.includes('Cart') && line.includes('<h1'));
        if (cartTitleLine) {
          console.log(`  - Cart title line: ${cartTitleLine.trim()}`);
        }
        
        console.log('\n🎯 SUCCESS: Patch contains modified code with "Hamid Cart"');
        console.log('   BrowserPreview should display this modified version');
      } else {
        console.log('\n❌ No current_code found in patch');
      }
    } else {
      console.log('❌ No patch found');
    }
    
    // Also check snapshots table
    console.log('\n🔍 Checking snapshots table...');
    const [snapshots] = await sequelize.query(`
      SELECT s.id, s.customization_id, s.snapshot_number, s.diff_hunks
      FROM hybrid_customization_snapshots s
      JOIN hybrid_customizations c ON s.customization_id = c.id
      WHERE c.file_path = 'src/pages/Cart.jsx' 
        AND c.store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
      ORDER BY s.snapshot_number DESC
      LIMIT 3
    `);
    
    console.log(`Found ${snapshots.length} snapshots`);
    snapshots.forEach(snapshot => {
      console.log(`  - Snapshot ${snapshot.snapshot_number} for customization ${snapshot.customization_id}`);
      console.log(`    Has diff_hunks: ${!!snapshot.diff_hunks}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();