const { sequelize } = require('./backend/src/database/connection.js');

(async () => {
  try {
    console.log('🔍 Checking recent products and their image status...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // Check recent products with their image data
    const [products] = await sequelize.query(`
      SELECT 
        id, 
        name, 
        sku, 
        images,
        updated_at
      FROM products 
      WHERE store_id = :storeId 
      ORDER BY updated_at DESC 
      LIMIT 5
    `, {
      replacements: { storeId }
    });
    
    console.log(`📊 Found ${products.length} recent products:`);
    
    products.forEach((product, index) => {
      console.log(`\nProduct ${index + 1}: ${product.name} (${product.sku})`);
      console.log(`  Updated: ${product.updated_at}`);
      console.log(`  Images field: ${product.images ? JSON.stringify(product.images) : 'null'}`);
      
      // Count actual images
      let imageCount = 0;
      if (product.images && Array.isArray(product.images)) {
        imageCount = product.images.length;
      }
      console.log(`  Total images: ${imageCount}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error checking products:', error.message);
    await sequelize.close();
  }
})();