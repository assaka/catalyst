// Precise content analysis to understand what's happening
const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Precise Content Analysis');
    console.log('===========================');
    
    // Get the Cart overlay
    const [overlays] = await sequelize.query(`
      SELECT 
        co.id,
        co.file_path,
        co.baseline_code,
        co.current_code
      FROM customization_overlays co
      WHERE co.file_path = 'src/pages/Cart.jsx'
      ORDER BY co.updated_at DESC
      LIMIT 1;
    `);

    if (overlays.length > 0) {
      const overlay = overlays[0];
      
      // Extract first 1000 chars of each to find the cart references
      const baselineSnippet = overlay.baseline_code.substring(0, 2000);
      const currentSnippet = overlay.current_code.substring(0, 2000);
      
      console.log('\n📋 Baseline code snippet (first 2000 chars):');
      console.log('='.repeat(50));
      console.log(baselineSnippet);
      console.log('='.repeat(50));
      
      console.log('\n📋 Current code snippet (first 2000 chars):');
      console.log('='.repeat(50));
      console.log(currentSnippet);
      console.log('='.repeat(50));
      
      // Find all instances of cart-related text
      console.log('\n🔍 Text pattern analysis:');
      
      const findCartReferences = (code, label) => {
        const cartMatches = [
          ...code.matchAll(/My Cart/g),
          ...code.matchAll(/Your Cart/g),
          ...code.matchAll(/Hamid Cart/g)
        ];
        
        console.log(`\n   ${label}:`);
        console.log(`     Total "Cart" references: ${(code.match(/Cart/g) || []).length}`);
        console.log(`     "My Cart" count: ${(code.match(/My Cart/g) || []).length}`);
        console.log(`     "Your Cart" count: ${(code.match(/Your Cart/g) || []).length}`);
        console.log(`     "Hamid Cart" count: ${(code.match(/Hamid Cart/g) || []).length}`);
      };
      
      findCartReferences(overlay.baseline_code, 'BASELINE');
      findCartReferences(overlay.current_code, 'CURRENT');
      
      // Check if they're identical
      console.log('\n🔍 Comparison:');
      console.log(`   Codes are identical: ${overlay.baseline_code === overlay.current_code}`);
      console.log(`   Length difference: ${overlay.current_code.length - overlay.baseline_code.length} chars`);
      
    } else {
      console.log('❌ No Cart overlay found');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
})();