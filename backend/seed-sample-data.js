#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');
const { Store, Product, Category, User } = require('./src/models');

async function seedSampleData() {
  try {
    console.log('🌱 Starting sample data seeding...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if we have the hamid2 store
    console.log('\n🏪 Checking for existing store...');
    let store = await Store.findOne({ where: { slug: 'hamid2' } });

    if (!store) {
      console.log('❌ Store "hamid2" not found, creating it...');

      // Find or create user for store ownership
      let user = await User.findOne({ where: { email: 'playamin998@gmail.com' } });
      if (!user) {
        console.log('⚠️ User not found, creating sample user...');
        user = await User.create({
          email: 'playamin998@gmail.com',
          password: 'hashed_password_placeholder',
          first_name: 'Hamid',
          last_name: 'Sample',
          role: 'store_owner',
          is_active: true
        });
      }

      store = await Store.create({
        name: 'Hamid',
        slug: 'hamid2',
        description: 'Sample store for testing',
        user_id: user.id,
        currency: 'USD',
        status: 'active'
      });
    }

    console.log(`✅ Store found/created: ${store.name} (${store.id})`);

    // Check existing products
    const existingProducts = await Product.findAll({ where: { store_id: store.id } });
    console.log(`📦 Found ${existingProducts.length} existing products`);

    if (existingProducts.length === 0) {
      console.log('\n🛍️ Creating sample products...');
      
      const sampleProducts = [
        {
          name: 'Sample Product 1',
          slug: 'sample-product-1',
          description: 'This is a sample product for testing the storefront',
          short_description: 'Sample product for testing',
          sku: 'SAMPLE-001',
          price: 29.99,
          compare_price: 39.99,
          stock_quantity: 100,
          status: 'active',
          is_featured: true,
          store_id: store.id
        },
        {
          name: 'Featured Product 2',
          slug: 'featured-product-2',
          description: 'Another great sample product',
          short_description: 'Another sample product',
          sku: 'SAMPLE-002',
          price: 49.99,
          stock_quantity: 50,
          status: 'active',
          is_featured: true,
          store_id: store.id
        },
        {
          name: 'Regular Product 3',
          slug: 'regular-product-3',
          description: 'A regular sample product',
          short_description: 'Regular sample product',
          sku: 'SAMPLE-003',
          price: 19.99,
          stock_quantity: 75,
          status: 'active',
          is_featured: false,
          store_id: store.id
        },
        {
          name: 'Premium Product 4',
          slug: 'premium-product-4',
          description: 'Premium sample product with great features',
          short_description: 'Premium sample product',
          sku: 'SAMPLE-004',
          price: 99.99,
          compare_price: 129.99,
          stock_quantity: 25,
          status: 'active',
          is_featured: true,
          store_id: store.id
        }
      ];

      for (const productData of sampleProducts) {
        try {
          const product = await Product.create(productData);
          console.log(`✅ Created product: ${product.name}`);
        } catch (error) {
          console.error(`❌ Failed to create product ${productData.name}:`, error.message);
        }
      }
    } else {
      console.log('✅ Products already exist, skipping product creation');
    }

    // Check existing categories
    const existingCategories = await Category.findAll({ where: { store_id: store.id } });
    console.log(`📂 Found ${existingCategories.length} existing categories`);

    if (existingCategories.length === 0) {
      console.log('\n📂 Creating sample categories...');
      
      const sampleCategories = [
        {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products and gadgets',
          status: 'active',
          store_id: store.id
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Fashion and clothing items',
          status: 'active',
          store_id: store.id
        },
        {
          name: 'Home & Garden',
          slug: 'home-garden',
          description: 'Home and garden products',
          status: 'active',
          store_id: store.id
        }
      ];

      for (const categoryData of sampleCategories) {
        try {
          const category = await Category.create(categoryData);
          console.log(`✅ Created category: ${category.name}`);
        } catch (error) {
          console.error(`❌ Failed to create category ${categoryData.name}:`, error.message);
        }
      }
    } else {
      console.log('✅ Categories already exist, skipping category creation');
    }

    // Verify the seeding worked
    console.log('\n🔍 Verifying seeded data...');
    const finalProductCount = await Product.count({ where: { store_id: store.id } });
    const finalCategoryCount = await Category.count({ where: { store_id: store.id } });
    const featuredProductCount = await Product.count({ 
      where: { 
        store_id: store.id, 
        is_featured: true, 
        status: 'active' 
      } 
    });

    console.log(`📊 Final counts:`);
    console.log(`   - Products: ${finalProductCount}`);
    console.log(`   - Categories: ${finalCategoryCount}`);
    console.log(`   - Featured Products: ${featuredProductCount}`);

    console.log('\n✅ Sample data seeding completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Test the products API: GET /api/public/products');
    console.log('   2. Test featured products: GET /api/public/products?featured=true');
    console.log('   3. Visit the storefront to see the products');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('Full error:', error.message);
    if (error.original) {
      console.error('Database error:', error.original.message);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the seeding
seedSampleData();