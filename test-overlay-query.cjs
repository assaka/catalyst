const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Testing overlay query in production environment...');
    
    // Test the exact query that should be running in the API endpoint
    const filePath = 'src/pages/Cart.jsx';
    
    // Check total overlays for this file
    const [totalResult] = await sequelize.query('SELECT COUNT(*) as count FROM customization_overlays WHERE file_path = $1', {
      bind: [filePath]
    });
    console.log('📊 Total overlays for ' + filePath + ': ' + totalResult[0].count);
    
    // Check active overlays
    const [activeResult] = await sequelize.query('SELECT COUNT(*) as count FROM customization_overlays WHERE file_path = $1 AND status = $2', {
      bind: [filePath, 'active']
    });
    console.log('📊 Active overlays for ' + filePath + ': ' + activeResult[0].count);
    
    // Check overlays with current_code
    const [codeResult] = await sequelize.query('SELECT COUNT(*) as count FROM customization_overlays WHERE file_path = $1 AND status = $2 AND current_code IS NOT NULL', {
      bind: [filePath, 'active']
    });
    console.log('📊 Active overlays with code for ' + filePath + ': ' + codeResult[0].count);
    
    // Get the actual overlay
    const [overlayResult] = await sequelize.query('SELECT id, file_path, status, LENGTH(current_code) as code_length, updated_at FROM customization_overlays WHERE file_path = $1 AND status = $2 AND current_code IS NOT NULL ORDER BY updated_at DESC LIMIT 1', {
      bind: [filePath, 'active']
    });
    
    if (overlayResult.length > 0) {
      const overlay = overlayResult[0];
      console.log('✅ Found overlay:');
      console.log('   ID: ' + overlay.id);
      console.log('   File Path: ' + overlay.file_path);
      console.log('   Status: ' + overlay.status);
      console.log('   Code Length: ' + overlay.code_length);
      console.log('   Updated: ' + overlay.updated_at);
      
      // Check if it contains 'Your Cart'
      const [contentCheck] = await sequelize.query('SELECT (current_code LIKE $1) as contains_your_cart FROM customization_overlays WHERE id = $2', {
        bind: ['%Your Cart%', overlay.id]
      });
      console.log('   Contains Your Cart: ' + contentCheck[0].contains_your_cart);
    } else {
      console.log('❌ No overlay found matching criteria');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
})();