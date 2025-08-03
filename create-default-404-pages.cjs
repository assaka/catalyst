// Set environment for production database
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

const { sequelize } = require('./backend/src/database/connection.js');
const { default404Content, default404Metadata } = require('./backend/src/utils/default404Content.js');

const createDefault404Pages = async () => {
  try {
    console.log('🔧 Creating default 404 pages for all stores...');

    // Get all stores that don't have a 404 page yet
    const [stores] = await sequelize.query(`
      SELECT DISTINCT s.id, s.name, s.slug
      FROM stores s
      LEFT JOIN cms_pages cp ON s.id = cp.store_id AND cp.slug = '404' AND cp.store_id = s.id
      WHERE cp.id IS NULL
      ORDER BY s.name
    `);

    if (stores.length === 0) {
      console.log('✅ All stores already have 404 pages');
      return;
    }

    console.log(`📝 Found ${stores.length} stores without 404 pages:`);
    stores.forEach(store => console.log(`  - ${store.name} (${store.slug})`));

    // Create 404 pages for each store
    for (const store of stores) {
      console.log(`📄 Creating 404 page for "${store.name}"...`);
      
      const pageData = {
        title: '404 - Page Not Found',
        slug: `404-${store.slug}`, // Make slug unique per store
        content: default404Content,
        is_active: true,
        store_id: store.id,
        related_product_ids: [],
        ...default404Metadata,
        created_at: new Date(),
        updated_at: new Date()
      };

      await sequelize.query(`
        INSERT INTO cms_pages (
          title, slug, content, is_active, store_id, 
          related_product_ids, meta_title, meta_description, 
          meta_keywords, meta_robots_tag, created_at, updated_at
        ) VALUES (
          :title, :slug, :content, :is_active, :store_id,
          :related_product_ids, :meta_title, :meta_description,
          :meta_keywords, :meta_robots_tag, :created_at, :updated_at
        )
      `, {
        replacements: {
          ...pageData,
          related_product_ids: JSON.stringify(pageData.related_product_ids)
        }
      });

      console.log(`  ✅ Created 404 page for "${store.name}"`);
    }

    console.log(`🎉 Successfully created ${stores.length} default 404 pages!`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Store owners can now customize their 404 pages via Admin → CMS Pages');
    console.log('  2. Edit the page with slug "404" to customize the content');
    console.log('  3. The 404 page will automatically be shown when content is not found');

  } catch (error) {
    console.error('❌ Error creating default 404 pages:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the script
createDefault404Pages();