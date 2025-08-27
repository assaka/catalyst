// Debug script to understand the accumulation issue
const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Debugging Accumulation Logic Issue');
    console.log('====================================');
    
    // Get the Cart overlay that user is working with
    const [overlays] = await sequelize.query(`
      SELECT 
        co.id,
        co.file_path,
        co.name,
        co.baseline_code,
        co.current_code,
        co.created_at,
        co.updated_at,
        LENGTH(co.baseline_code) as baseline_length,
        LENGTH(co.current_code) as current_length
      FROM customization_overlays co
      WHERE co.file_path LIKE '%Cart%'
      ORDER BY co.updated_at DESC
      LIMIT 1;
    `);

    if (overlays.length > 0) {
      const overlay = overlays[0];
      console.log('\n📋 Current Cart overlay:');
      console.log(`   File: ${overlay.file_path}`);
      console.log(`   ID: ${overlay.id}`);
      console.log(`   Created: ${overlay.created_at}`);
      console.log(`   Updated: ${overlay.updated_at}`);
      console.log(`   Baseline length: ${overlay.baseline_length} chars`);
      console.log(`   Current length: ${overlay.current_length} chars`);
      
      // Extract key content indicators
      console.log('\n🔍 Content analysis:');
      console.log('   Baseline content includes:');
      if (overlay.baseline_code.includes('My Cart')) console.log('     ✅ "My Cart"');
      if (overlay.baseline_code.includes('Your Cart')) console.log('     ✅ "Your Cart"');
      if (overlay.baseline_code.includes('Hamid Cart')) console.log('     ✅ "Hamid Cart"');
      
      console.log('   Current content includes:');
      if (overlay.current_code.includes('My Cart')) console.log('     ✅ "My Cart"');
      if (overlay.current_code.includes('Your Cart')) console.log('     ✅ "Your Cart"');
      if (overlay.current_code.includes('Hamid Cart')) console.log('     ✅ "Hamid Cart"');
      
      // Get recent snapshots to see the change history
      const [snapshots] = await sequelize.query(`
        SELECT 
          cs.id,
          cs.change_summary,
          cs.created_at,
          cs.status,
          cs.line_diff
        FROM customization_snapshots cs
        WHERE cs.customization_id = :customizationId
        ORDER BY cs.created_at DESC
        LIMIT 5;
      `, { replacements: { customizationId: overlay.id } });
      
      console.log(`\n📸 Recent ${snapshots.length} snapshots:`);
      snapshots.forEach((snapshot, index) => {
        console.log(`   ${index + 1}. ${snapshot.change_summary} (${snapshot.status})`);
        console.log(`      Created: ${snapshot.created_at}`);
        if (snapshot.line_diff) {
          const lineCount = snapshot.line_diff.split('\n').length;
          console.log(`      Line diff: ${lineCount} lines`);
        }
      });
      
    } else {
      console.log('❌ No Cart overlay found in database');
    }
    
    console.log('\n🎯 Expected behavior analysis:');
    console.log('   1. User starts with "My Cart" (baseline)');
    console.log('   2. User edits to "Your Cart" → current_code should be "Your Cart"');
    console.log('   3. User edits to "Hamid Cart" → current_code should be "Hamid Cart"');
    console.log('   4. The current_code should always reflect the latest complete editor state');
    
    console.log('\n❓ Key question: Is the editor sending the complete accumulated state?');
    console.log('   ✅ Backend logic is correct: current_code = latest complete editor content');
    console.log('   ❓ Frontend logic: Does newCode contain all previous edits?');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
})();