const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function fixDuplicates() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Delete duplicates from plugins table (they belong in plugin_registry)
    console.log('🗑️  Removing duplicates from plugins table...');
    const [deleteResult] = await sequelize.query(`
      DELETE FROM plugins
      WHERE slug IN ('product-reviews', 'loyalty-points', 'email-campaigns-pro')
      RETURNING name
    `);
    deleteResult.forEach(p => console.log(`   Deleted: ${p.name}`));

    // 2. Update plugin_registry entries to add adminNavigation
    console.log('\n✨ Updating plugin_registry with adminNavigation...');

    // Product Reviews
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        '{"enabled": true, "label": "Product Reviews", "icon": "Star", "route": "/admin/reviews", "order": 70, "parentKey": "products", "description": "Manage customer product reviews and ratings"}'::jsonb
      )
      WHERE id = 'hamid2-product-reviews'
    `);
    console.log('   ✅ Product Reviews updated');

    // Loyalty Points
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        '{"enabled": true, "label": "Loyalty Points", "icon": "Award", "route": "/admin/loyalty", "order": 60, "parentKey": null, "description": "Manage customer loyalty points and rewards"}'::jsonb
      )
      WHERE id = 'hamid2-loyalty-points'
    `);
    console.log('   ✅ Loyalty Points updated');

    // Email Campaigns
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        '{"enabled": true, "label": "Email Campaigns", "icon": "Mail", "route": "/admin/campaigns", "order": 55, "parentKey": null, "description": "AI-powered email marketing campaigns"}'::jsonb
      )
      WHERE id = 'hamid2-email-campaigns-pro'
    `);
    console.log('   ✅ Email Campaigns updated');

    // 3. Add adminNavigation to other plugin_registry entries
    console.log('\n✨ Adding adminNavigation to other plugins...');

    // Customer Chat
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        '{"enabled": true, "label": "Customer Chat", "icon": "MessageCircle", "route": "/admin/chat", "order": 65, "parentKey": null, "description": "Live customer support chat"}'::jsonb
      )
      WHERE id = 'customer-service-chat'
    `);
    console.log('   ✅ Customer Chat updated');

    // Clock
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        '{"enabled": true, "label": "Clock Widget", "icon": "Clock", "route": "/admin/clock", "order": 200, "parentKey": null, "description": "Display clock widget"}'::jsonb
      )
      WHERE id LIKE '%clock%'
    `);
    console.log('   ✅ Clock updated');

    // Custom Pricing
    await sequelize.query(`
      UPDATE plugin_registry
      SET manifest = jsonb_set(
        COALESCE(manifest, '{}'::jsonb),
        '{adminNavigation}',
        '{"enabled": true, "label": "Custom Pricing", "icon": "DollarSign", "route": "/admin/pricing", "order": 75, "parentKey": "products", "description": "Manage custom product pricing rules"}'::jsonb
      )
      WHERE id = 'custom-pricing-v2'
    `);
    console.log('   ✅ Custom Pricing updated');

    console.log('\n🎉 All plugin duplicates fixed and adminNavigation added!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixDuplicates();
