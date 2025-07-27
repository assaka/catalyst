const { Store } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function checkStores() {
  try {
    console.log('🔍 Checking stores in database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get all stores
    const allStores = await Store.findAll();
    console.log(`📊 Total stores found: ${allStores.length}`);
    
    if (allStores.length === 0) {
      console.log('❌ No stores found in database!');
      return;
    }
    
    console.log('\n📋 All stores:');
    allStores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name}`);
      console.log(`   - Slug: ${store.slug}`);
      console.log(`   - ID: ${store.id}`);
      console.log(`   - Active: ${store.is_active}`);
      console.log(`   - Owner: ${store.owner_email}`);
      console.log('');
    });
    
    // Check specifically for hamid2
    const hamid2Store = await Store.findOne({ where: { slug: 'hamid2' } });
    if (hamid2Store) {
      console.log('✅ Found hamid2 store:');
      console.log(JSON.stringify(hamid2Store.toJSON(), null, 2));
    } else {
      console.log('❌ hamid2 store NOT found!');
      
      // Let's create it
      console.log('🔨 Creating hamid2 store...');
      const newStore = await Store.create({
        name: 'Hamid2 Store',
        slug: 'hamid2',
        description: 'Test store for hamid2',
        owner_email: 'hamid2@example.com',
        logo_url: null,
        banner_url: null,
        theme_color: '#3B82F6',
        currency: 'USD',
        timezone: 'UTC',
        is_active: true,
        settings: {
          enable_inventory: true,
          enable_reviews: true,
          allow_guest_checkout: true,
          require_shipping_address: true,
          allowed_countries: ['US', 'GB', 'CA'],
          currency_code: 'USD',
          show_stock_label: true
        }
      });
      
      console.log('✅ Created hamid2 store:');
      console.log(JSON.stringify(newStore.toJSON(), null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkStores();