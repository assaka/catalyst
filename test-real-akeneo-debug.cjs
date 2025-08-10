const AkeneoMapping = require('./backend/src/services/akeneo-mapping.js');

console.log('🧪 Simulating real Akeneo import with problematic data...');

const mapping = new AkeneoMapping();

// Create a realistic Akeneo product that would cause the error
const problematicAkeneoProduct = {
  identifier: 'samsung-galaxy-test',
  enabled: true,
  values: {
    name: [{ data: 'Samsung Galaxy Test', locale: 'en_US' }],
    // This complex price structure might cause the issue
    price: [{ 
      data: [
        { amount: '29.99', currency: 'USD' },
        { amount: '25.99', currency: 'EUR' }
      ], 
      locale: null, 
      scope: null 
    }],
    // Complex object that might bypass our fix
    weight: [{ 
      data: {
        packaging: { weight: '1.5', unit: 'kg' },
        product: { weight: '1.2', unit: 'kg' }
      }, 
      locale: null, 
      scope: null 
    }],
    // Maybe dimensions causing issues
    dimensions: [{
      data: {
        length: { value: '10', unit: 'cm' },
        width: { value: '20', unit: 'cm' },
        height: { value: '5', unit: 'cm' }
      },
      locale: null,
      scope: null
    }]
  }
};

(async () => {
  try {
    console.log('\n🔄 Transforming Akeneo product...');
    
    const transformedProduct = await mapping.transformProduct(
      problematicAkeneoProduct,
      '157d4590-49bf-4b0b-bd77-abe131909528',
      'en_US',
      null,
      { attributes: [] }, // No custom mappings
      { downloadImages: false }
    );
    
    console.log('✅ Product transformation completed');
    console.log('');
    console.log('📊 Checking for problematic values:');
    
    // Check each field that could be numeric
    const numericFields = ['price', 'compare_price', 'weight', 'cost_price', 'stock_quantity'];
    
    numericFields.forEach(field => {
      const value = transformedProduct[field];
      console.log('  ' + field + ': ' + value + ' (type: ' + typeof value + ')');
      
      if (typeof value === 'string' && value.includes('[object Object]')) {
        console.log('  ❌ FOUND PROBLEMATIC VALUE in ' + field + '!');
      }
    });
    
    // Also check custom attributes
    if (transformedProduct.attributes) {
      console.log('\n📋 Checking custom attributes:');
      Object.keys(transformedProduct.attributes).forEach(attr => {
        const value = transformedProduct.attributes[attr];
        console.log('  ' + attr + ': ' + JSON.stringify(value) + ' (type: ' + typeof value + ')');
        
        if (typeof value === 'string' && value.includes('[object Object]')) {
          console.log('  ❌ FOUND PROBLEMATIC VALUE in attribute ' + attr + '!');
        }
      });
    }
    
    console.log('\n🧪 Testing if this product would cause database error...');
    
    // Simulate what would happen during actual product creation
    const productData = {
      name: transformedProduct.name,
      sku: transformedProduct.sku,
      slug: transformedProduct.slug,
      price: transformedProduct.price,
      compare_price: transformedProduct.compare_price,
      weight: transformedProduct.weight,
      stock_quantity: transformedProduct.stock_quantity
    };
    
    console.log('🔍 Product data that would be sent to database:');
    Object.keys(productData).forEach(key => {
      console.log('  ' + key + ': ' + JSON.stringify(productData[key]));
    });
    
  } catch (error) {
    console.log('❌ Product transformation failed:', error.message);
    console.log('📍 Stack:', error.stack);
  }
})();