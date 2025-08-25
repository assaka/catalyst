const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Locating Hamid Cart patch in database...');
    console.log('');
    
    // Find the exact patch with Hamid Cart
    const [results] = await sequelize.query(`
      SELECT 
        id,
        file_path,
        name,
        status,
        store_id,
        user_id,
        created_at,
        updated_at,
        LENGTH(current_code) as current_code_length,
        LENGTH(baseline_code) as baseline_code_length,
        (current_code LIKE '%Hamid Cart%') as has_hamid_cart,
        (baseline_code LIKE '%My Cart%') as has_my_cart
      FROM hybrid_customizations 
      WHERE current_code LIKE '%Hamid Cart%'
      ORDER BY updated_at DESC
    `);
    
    if (results.length > 0) {
      const patch = results[0];
      console.log('✅ Found Hamid Cart patch:');
      console.log('');
      console.log('📍 Database Location:');
      console.log('   Table: hybrid_customizations');
      console.log('   Primary Key (id): ' + patch.id);
      console.log('');
      console.log('📋 Patch Details:');
      console.log('   File Path: ' + patch.file_path);
      console.log('   Name: ' + (patch.name || 'Unnamed'));
      console.log('   Status: ' + patch.status);
      console.log('   Store ID: ' + patch.store_id);
      console.log('   User ID: ' + patch.user_id);
      console.log('');
      console.log('📅 Timestamps:');
      console.log('   Created: ' + patch.created_at);
      console.log('   Updated: ' + patch.updated_at);
      console.log('');
      console.log('📊 Content Info:');
      console.log('   Current Code Length: ' + patch.current_code_length + ' characters');
      console.log('   Baseline Code Length: ' + patch.baseline_code_length + ' characters');
      console.log('   Contains "Hamid Cart": ' + patch.has_hamid_cart);
      console.log('   Contains "My Cart" (baseline): ' + patch.has_my_cart);
      console.log('');
      console.log('🔍 SQL Query to access this patch:');
      console.log('   SELECT * FROM hybrid_customizations WHERE id = \'' + patch.id + '\';');
      console.log('');
      console.log('🎯 To see the actual modified code:');
      console.log('   SELECT current_code FROM hybrid_customizations WHERE id = \'' + patch.id + '\';');
      
      // Show the specific line with Hamid Cart
      console.log('');
      console.log('🔎 Finding the exact Hamid Cart line...');
      const [codeResult] = await sequelize.query(
        'SELECT current_code FROM hybrid_customizations WHERE id = :id',
        { replacements: { id: patch.id } }
      );
      
      if (codeResult.length > 0) {
        const code = codeResult[0].current_code;
        const lines = code.split('\n');
        const hamidCartLine = lines.findIndex(line => line.includes('Hamid Cart'));
        
        if (hamidCartLine !== -1) {
          console.log('   Line ' + (hamidCartLine + 1) + ': ' + lines[hamidCartLine].trim());
        }
      }
      
    } else {
      console.log('❌ No patch containing "Hamid Cart" found in database');
      
      // Check if there are any patches for Cart.jsx at all
      const [cartPatches] = await sequelize.query(`
        SELECT id, file_path, status, created_at
        FROM hybrid_customizations 
        WHERE file_path = 'src/pages/Cart.jsx'
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('');
      console.log('📋 All patches for Cart.jsx:');
      cartPatches.forEach(p => {
        console.log('   - ID: ' + p.id + ' | Status: ' + p.status + ' | Created: ' + p.created_at);
      });
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
})();