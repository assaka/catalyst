const { sequelize } = require('./src/database/connection');
const { Product, Store } = require('./src/models');

async function debugProductSlug() {
  try {
    console.log('🔍 Debugging product with slug="asdf"...');
    
    // First, let's see if the product exists at all
    console.log('\n📊 Step 1: Check if product exists with slug="asdf"');
    const product = await Product.findOne({
      where: { slug: 'asdf' },
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }]
    });
    
    if (product) {
      console.log('✅ Product found:');
      console.log(JSON.stringify({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        status: product.status,
        store_id: product.store_id,
        store_name: product.Store?.name,
        store_owner: product.Store?.owner_email,
        created_at: product.created_at
      }, null, 2));
    } else {
      console.log('❌ No product found with slug="asdf"');
    }
    
    // Now let's check all products with similar names or containing "asdf"
    console.log('\n📊 Step 2: Check products with name/sku/slug containing "asdf"');
    const similarProducts = await Product.findAll({
      where: {
        [sequelize.Op.or]: [
          { name: { [sequelize.Op.iLike]: '%asdf%' } },
          { slug: { [sequelize.Op.iLike]: '%asdf%' } },
          { sku: { [sequelize.Op.iLike]: '%asdf%' } }
        ]
      },
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }],
      limit: 10
    });
    
    console.log(`Found ${similarProducts.length} products with "asdf" in name/sku/slug:`);
    similarProducts.forEach((p, index) => {
      console.log(`${index + 1}. Name: "${p.name}", Slug: "${p.slug}", SKU: "${p.sku}", Status: "${p.status}", Store: "${p.Store?.name}"`);
    });
    
    // Check all products to see what's available
    console.log('\n📊 Step 3: List all products to see what exists');
    const allProducts = await Product.findAll({
      include: [{
        model: Store,
        attributes: ['id', 'name', 'owner_email']
      }],
      limit: 10,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`Total products in database: ${await Product.count()}`);
    console.log('Recent products:');
    allProducts.forEach((p, index) => {
      console.log(`${index + 1}. Name: "${p.name}", Slug: "${p.slug}", SKU: "${p.sku}", Status: "${p.status}"`);
    });
    
    // Check stores
    console.log('\n📊 Step 4: List all stores to understand store ownership');
    const stores = await Store.findAll({
      attributes: ['id', 'name', 'slug', 'owner_email'],
      limit: 10
    });
    
    console.log(`Total stores: ${stores.length}`);
    stores.forEach((store, index) => {
      console.log(`${index + 1}. "${store.name}" (${store.slug}) - Owner: ${store.owner_email}`);
    });
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await sequelize.close();
  }
}

debugProductSlug();