const { sequelize } = require('./backend/src/database/connection.js');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    console.log('🎨 Creating hero CMS block...');
    
    // Get the first store to add the hero block to
    const [stores] = await sequelize.query('SELECT id, name FROM stores ORDER BY created_at LIMIT 1;');
    
    if (stores.length === 0) {
      console.error('❌ No stores found. Please create a store first.');
      process.exit(1);
    }
    
    const store = stores[0];
    console.log(`📋 Using store: ${store.name} (${store.id})`);
    
    // Create the hero CMS block with blue gradient background
    const heroBlock = {
      id: uuidv4(),
      store_id: store.id,
      title: 'Homepage Hero Banner',
      identifier: 'homepage-hero-banner',
      content: `
<section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 mb-12 rounded-lg">
  <div class="text-center">
    <h1 class="text-4xl md:text-6xl font-bold mb-4">Welcome to Our Store</h1>
    <p class="text-xl mb-8">Discover amazing products and exceptional quality</p>
    <div class="space-y-4 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
      <a href="#" class="inline-block bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
        Shop Now
      </a>
      <a href="#" class="inline-block border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg font-semibold transition-colors">
        Learn More
      </a>
    </div>
  </div>
</section>
      `.trim(),
      placement: ['homepage_hero'],
      is_active: true,
      sort_order: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert the hero block
    await sequelize.query(`
      INSERT INTO cms_blocks (id, store_id, title, identifier, content, placement, is_active, sort_order, created_at, updated_at)
      VALUES (:id, :store_id, :title, :identifier, :content, :placement, :is_active, :sort_order, :created_at, :updated_at)
    `, {
      replacements: {
        ...heroBlock,
        placement: JSON.stringify(heroBlock.placement)
      }
    });
    
    console.log('✅ Hero CMS block created successfully!');
    console.log(`📋 Block ID: ${heroBlock.id}`);
    console.log(`📋 Title: ${heroBlock.title}`);
    console.log(`📋 Identifier: ${heroBlock.identifier}`);
    console.log(`📋 Position: homepage_hero`);
    
    // Let's also create an alternative modern hero block
    const modernHeroBlock = {
      id: uuidv4(),
      store_id: store.id,
      title: 'Modern Hero Section',
      identifier: 'modern-hero-section', 
      content: `
<div class="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl">
  <div class="absolute inset-0 bg-black opacity-20"></div>
  <div class="relative px-8 py-24 sm:px-16 sm:py-32">
    <div class="mx-auto max-w-4xl text-center">
      <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
        Next Level
        <span class="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Shopping
        </span>
      </h1>
      <p class="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed">
        Experience the future of e-commerce with our curated collection of premium products
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button class="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg">
          Explore Collection
        </button>
        <button class="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 rounded-full font-bold text-lg transition-all">
          Watch Demo
        </button>
      </div>
    </div>
  </div>
  <div class="absolute -bottom-16 -right-16 w-64 h-64 bg-white opacity-10 rounded-full"></div>
  <div class="absolute -top-16 -left-16 w-32 h-32 bg-yellow-400 opacity-20 rounded-full"></div>
</div>
      `.trim(),
      placement: ['homepage_hero'],
      is_active: false, // Not active by default so it doesn't conflict
      sort_order: 1,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Insert the modern hero block
    await sequelize.query(`
      INSERT INTO cms_blocks (id, store_id, title, identifier, content, placement, is_active, sort_order, created_at, updated_at)
      VALUES (:id, :store_id, :title, :identifier, :content, :placement, :is_active, :sort_order, :created_at, :updated_at)
    `, {
      replacements: {
        ...modernHeroBlock,
        placement: JSON.stringify(modernHeroBlock.placement)
      }
    });
    
    console.log('✅ Modern hero CMS block also created!');
    console.log(`📋 Block ID: ${modernHeroBlock.id}`);
    console.log(`📋 Title: ${modernHeroBlock.title}`);
    console.log(`📋 Status: Inactive (you can enable it in admin)`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Visit your homepage to see the hero block');
    console.log('2. Go to CMS Blocks in admin to edit or activate the modern version');
    console.log('3. Customize the content, colors, and links as needed');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error creating hero CMS block:', error.message);
    process.exit(1);
  }
})();