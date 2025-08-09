const AkeneoIntegration = require('./backend/src/services/akeneo-integration.js');

(async () => {
  try {
    console.log('🧪 Testing Akeneo attribute import with clean database...');
    console.log('Expected behavior: Only price, name, color, brand should be filterable');
    
    const integration = new AkeneoIntegration();
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Initialize the integration
    await integration.initialize(storeId);
    
    // Import attributes (limit to first few for testing)
    const result = await integration.importAttributes({ 
      storeId,
      limit: 20
    });
    
    console.log('📊 Import Result:', {
      success: result.success,
      message: result.message,
      totalProcessed: result.totalProcessed,
      successfulImports: result.successfulImports,
      failedImports: result.failedImports
    });
    
    // Check what attributes were created and which are filterable
    if (result.success) {
      const { sequelize } = require('./backend/src/database/connection.js');
      
      const [attributes] = await sequelize.query('SELECT code, name, is_filterable FROM attributes WHERE store_id = :storeId ORDER BY code;', {
        replacements: { storeId }
      });
      
      console.log('\n📋 Imported attributes:');
      attributes.forEach(attr => {
        const filterableStatus = attr.is_filterable ? '✅ FILTERABLE' : '❌ not filterable';
        console.log('  - ' + attr.code + ' (' + attr.name + ') - ' + filterableStatus);
      });
      
      // Count filterable vs non-filterable
      const filterable = attributes.filter(a => a.is_filterable);
      const nonFilterable = attributes.filter(a => !a.is_filterable);
      
      console.log('\n📊 Summary:');
      console.log('  Filterable attributes: ' + filterable.length);
      console.log('  Non-filterable attributes: ' + nonFilterable.length);
      
      if (filterable.length > 0) {
        console.log('\n✅ Filterable attributes (should only be price, name, color, brand):');
        filterable.forEach(attr => {
          const isExpected = ['price', 'name', 'color', 'colour', 'brand', 'manufacturer'].includes(attr.code.toLowerCase());
          const status = isExpected ? '✅ EXPECTED' : '❌ UNEXPECTED';
          console.log('  - ' + attr.code + ' ' + status);
        });
      }
      
      await sequelize.close();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
})();