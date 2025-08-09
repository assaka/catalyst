const AkeneoIntegration = require('./backend/src/services/akeneo-integration.js');
const { IntegrationConfig } = require('./backend/src/models');

async function debugAkeneoOptions() {
  try {
    console.log('🔍 Debugging Akeneo attribute options import...');
    
    const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';
    
    // 1. Check if Akeneo integration is configured
    console.log('\n1. Checking Akeneo integration configuration...');
    const config = await IntegrationConfig.findByStoreAndType(storeId, 'akeneo');
    
    if (!config) {
      console.log('❌ No Akeneo integration config found for store');
      return;
    }
    
    console.log('✅ Akeneo integration config found');
    console.log('   Base URL:', config.config_data.baseUrl);
    console.log('   Username:', config.config_data.username);
    console.log('   Has credentials:', !!(config.config_data.clientId && config.config_data.clientSecret));
    
    // 2. Initialize Akeneo integration
    console.log('\n2. Initializing Akeneo integration...');
    const integration = new AkeneoIntegration(config.config_data);
    
    // 3. Test Akeneo connection
    console.log('\n3. Testing Akeneo connection...');
    const connectionTest = await integration.testConnection();
    if (!connectionTest.success) {
      console.log('❌ Akeneo connection failed:', connectionTest.message);
      return;
    }
    console.log('✅ Akeneo connection successful');
    
    // 4. Check current attributes in database
    console.log('\n4. Checking current attributes in database...');
    const { Attribute } = require('./backend/src/models');
    const existingAttrs = await Attribute.findAll({
      where: { store_id: storeId },
      attributes: ['code', 'type', 'options'],
      limit: 10
    });
    
    console.log(`📊 Found ${existingAttrs.length} existing attributes in database:`);
    existingAttrs.forEach(attr => {
      console.log(`   - ${attr.code} (${attr.type}): ${attr.options?.length || 0} options`);
      if (attr.options && attr.options.length > 0) {
        console.log(`     Options: ${attr.options.map(opt => opt.label || opt.value).join(', ')}`);
      }
    });
    
    // 5. Try importing a few attributes to test option handling
    console.log('\n5. Testing attribute import with options...');
    const attributeImportResult = await integration.importAttributes(storeId, {
      dryRun: false,
      settings: { includeAttributeOptions: true }
    });
    
    console.log('Attribute import result:', attributeImportResult.success ? '✅ Success' : '❌ Failed');
    if (attributeImportResult.stats) {
      console.log(`   Imported: ${attributeImportResult.stats.imported || 0} attributes`);
      console.log(`   Failed: ${attributeImportResult.stats.failed || 0} attributes`);
    }
    
    // 6. Re-check attributes after import
    console.log('\n6. Checking attributes after import...');
    const updatedAttrs = await Attribute.findAll({
      where: { 
        store_id: storeId,
        type: ['select', 'multiselect']
      },
      attributes: ['code', 'type', 'options'],
      limit: 5
    });
    
    console.log(`📊 Found ${updatedAttrs.length} select/multiselect attributes after import:`);
    updatedAttrs.forEach(attr => {
      console.log(`   - ${attr.code} (${attr.type}): ${attr.options?.length || 0} options`);
      if (attr.options && attr.options.length > 0) {
        attr.options.slice(0, 3).forEach(opt => {
          console.log(`     • ${opt.label || opt.value} (${opt.code || opt.value})`);
        });
        if (attr.options.length > 3) {
          console.log(`     ... and ${attr.options.length - 3} more`);
        }
      }
    });
    
    // 7. Test product import with one product
    console.log('\n7. Testing single product import...');
    const productImportResult = await integration.importProducts(storeId, {
      dryRun: false,
      filters: { limit: 1 }, // Just import one product
      settings: { downloadImages: false }
    });
    
    console.log('Product import result:', productImportResult.success ? '✅ Success' : '❌ Failed');
    if (productImportResult.stats) {
      console.log(`   Imported: ${productImportResult.stats.imported || 0} products`);
    }
    
    // 8. Check if the product has properly formatted attributes
    console.log('\n8. Checking imported product attributes...');
    const { Product } = require('./backend/src/models');
    const recentProduct = await Product.findOne({
      where: { store_id: storeId },
      order: [['updated_at', 'DESC']],
      attributes: ['name', 'sku', 'attributes']
    });
    
    if (recentProduct && recentProduct.attributes) {
      console.log(`📋 Recent product: ${recentProduct.name} (${recentProduct.sku})`);
      console.log('   Checking attribute formatting...');
      
      // Look for select/multiselect attributes
      let foundSelectAttrs = 0;
      let properlyFormattedAttrs = 0;
      
      Object.keys(recentProduct.attributes).forEach(attrCode => {
        const attrValue = recentProduct.attributes[attrCode];
        
        // Check if it's a select attribute (object with label/value)
        if (typeof attrValue === 'object' && attrValue !== null && !Array.isArray(attrValue) && 
            attrValue.hasOwnProperty('label') && attrValue.hasOwnProperty('value')) {
          foundSelectAttrs++;
          properlyFormattedAttrs++;
          console.log(`   ✅ Select: ${attrCode} = ${JSON.stringify(attrValue)}`);
        }
        // Check if it's a multiselect attribute (array of objects with label/value)
        else if (Array.isArray(attrValue) && attrValue.length > 0 && 
                 typeof attrValue[0] === 'object' && attrValue[0].hasOwnProperty('label')) {
          foundSelectAttrs++;
          properlyFormattedAttrs++;
          console.log(`   ✅ Multiselect: ${attrCode} = ${JSON.stringify(attrValue.slice(0, 2))}${attrValue.length > 2 ? '...' : ''}`);
        }
        // Regular attributes
        else if (typeof attrValue === 'string') {
          console.log(`   📝 Text: ${attrCode} = "${attrValue}"`);
        }
      });
      
      console.log(`\n📊 Attribute formatting summary:`);
      console.log(`   Select/multiselect attributes found: ${foundSelectAttrs}`);
      console.log(`   Properly formatted: ${properlyFormattedAttrs}`);
      
      if (foundSelectAttrs === 0) {
        console.log('   ⚠️ No select/multiselect attributes found in product');
      } else if (properlyFormattedAttrs === foundSelectAttrs) {
        console.log('   🎉 All select/multiselect attributes are properly formatted!');
      } else {
        console.log('   ❌ Some select/multiselect attributes are not properly formatted');
      }
    } else {
      console.log('   ❌ No recent product found or no attributes');
    }
    
    console.log('\n🎯 Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugAkeneoOptions();