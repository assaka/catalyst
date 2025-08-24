const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Searching for patches containing "Mennnnny Cart"...');
    
    // Search in hybrid_customizations table
    console.log('\n📋 Searching hybrid_customizations table...');
    const [hybridResults] = await sequelize.query(`
      SELECT 
        id, 
        file_path, 
        name,
        current_code,
        baseline_code,
        description,
        created_at
      FROM hybrid_customizations 
      WHERE 
        current_code ILIKE '%Mennnnny Cart%' OR
        baseline_code ILIKE '%Mennnnny Cart%' OR
        name ILIKE '%Mennnnny Cart%' OR
        description ILIKE '%Mennnnny Cart%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${hybridResults.length} results in hybrid_customizations:`);
    hybridResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Customization ID: ${result.id}`);
      console.log(`   Name: ${result.name}`);
      console.log(`   File: ${result.file_path}`);
      console.log(`   Created: ${result.created_at}`);
      
      // Check which field contains the text
      if (result.current_code && result.current_code.includes('Mennnnny Cart')) {
        console.log(`   Found in current_code: ${result.current_code.substring(0, 100)}...`);
      }
      if (result.baseline_code && result.baseline_code.includes('Mennnnny Cart')) {
        console.log(`   Found in baseline_code: ${result.baseline_code.substring(0, 100)}...`);
      }
      if (result.name && result.name.includes('Mennnnny Cart')) {
        console.log(`   Found in name: ${result.name}`);
      }
      if (result.description && result.description.includes('Mennnnny Cart')) {
        console.log(`   Found in description: ${result.description.substring(0, 100)}...`);
      }
    });
    
    // Search in customization_snapshots table
    console.log('\n📋 Searching customization_snapshots table...');
    const [snapshotResults] = await sequelize.query(`
      SELECT 
        id,
        customization_id,
        code_before,
        code_after,
        change_summary,
        patch_operations,
        created_at
      FROM customization_snapshots 
      WHERE 
        code_before ILIKE '%Mennnnny Cart%' OR
        code_after ILIKE '%Mennnnny Cart%' OR
        change_summary ILIKE '%Mennnnny Cart%' OR
        patch_operations::text ILIKE '%Mennnnny Cart%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${snapshotResults.length} results in customization_snapshots:`);
    snapshotResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Snapshot ID: ${result.id}`);
      console.log(`   Customization ID: ${result.customization_id}`);
      console.log(`   Change Summary: ${result.change_summary}`);
      console.log(`   Created: ${result.created_at}`);
      
      // Check which field contains the text
      if (result.code_before && result.code_before.includes('Mennnnny Cart')) {
        console.log(`   Found in code_before: ${result.code_before.substring(0, 100)}...`);
      }
      if (result.code_after && result.code_after.includes('Mennnnny Cart')) {
        console.log(`   Found in code_after: ${result.code_after.substring(0, 100)}...`);
      }
      if (result.change_summary && result.change_summary.includes('Mennnnny Cart')) {
        console.log(`   Found in change_summary: ${result.change_summary}`);
      }
      if (result.patch_operations && JSON.stringify(result.patch_operations).includes('Mennnnny Cart')) {
        console.log(`   Found in patch_operations: ${JSON.stringify(result.patch_operations).substring(0, 100)}...`);
      }
    });
    
    // Summary
    const totalResults = hybridResults.length + snapshotResults.length;
    console.log(`\n📊 Total results found: ${totalResults}`);
    if (totalResults === 0) {
      console.log('❌ No patches found containing "Mennnnny Cart"');
    } else {
      console.log('✅ Search completed successfully!');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    await sequelize.close();
  }
})();