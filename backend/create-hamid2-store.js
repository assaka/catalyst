const { Store, User } = require('./src/models');
const { sequelize } = require('./src/database/connection');

async function createHamid2Store() {
  try {
    console.log('🔍 Checking existing stores...');
    
    // Check existing stores
    const stores = await Store.findAll();
    console.log(`📊 Found ${stores.length} existing stores:`);
    stores.forEach(store => {
      console.log(`  - ${store.name} (slug: ${store.slug})`);
    });
    
    // Check if hamid2 store already exists
    const existingStore = await Store.findOne({ where: { slug: 'hamid2' } });
    if (existingStore) {
      console.log('✅ Store with slug "hamid2" already exists!');
      console.log('Store details:', {
        id: existingStore.id,
        name: existingStore.name,
        slug: existingStore.slug,
        owner_email: existingStore.owner_email
      });
      return;
    }
    
    console.log('🔨 Creating hamid2 store...');
    
    // Create the hamid2 store
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
    
    console.log('✅ Successfully created hamid2 store!');
    console.log('Store details:', {
      id: newStore.id,
      name: newStore.name,
      slug: newStore.slug,
      owner_email: newStore.owner_email
    });
    
    // Also create a user for this store if needed
    try {
      const existingUser = await User.findOne({ where: { email: 'hamid2@example.com' } });
      if (!existingUser) {
        const newUser = await User.create({
          email: 'hamid2@example.com',
          password: 'Password123!',
          first_name: 'Hamid',
          last_name: 'Store Owner',
          role: 'store_owner',
          account_type: 'agency'
        });
        console.log('✅ Created store owner user for hamid2');
      } else {
        console.log('👤 User hamid2@example.com already exists');
      }
    } catch (userError) {
      console.log('⚠️  Could not create user (may already exist):', userError.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating hamid2 store:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createHamid2Store();