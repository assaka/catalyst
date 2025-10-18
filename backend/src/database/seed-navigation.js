#!/usr/bin/env node

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

const allNavItems = [
  // Main
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', route: '/admin/dashboard', order: 1, category: 'main' },

  // Catalog
  { key: 'categories', label: 'Categories', icon: 'Tag', route: '/admin/categories', order: 10, category: 'catalog' },
  { key: 'products', label: 'Products', icon: 'Package', route: '/admin/products', order: 11, category: 'catalog' },
  { key: 'attributes', label: 'Attributes', icon: 'Box', route: '/admin/attributes', order: 12, category: 'catalog' },
  { key: 'custom_option_rules', label: 'Custom Options', icon: 'Settings', route: '/admin/custom-option-rules', order: 13, category: 'catalog' },
  { key: 'product_tabs', label: 'Product Tabs', icon: 'FileText', route: '/admin/product-tabs', order: 14, category: 'catalog' },
  { key: 'product_labels', label: 'Product Labels', icon: 'Tag', route: '/admin/product-labels', order: 15, category: 'catalog' },
  { key: 'stock_settings', label: 'Stock Settings', icon: 'Package', route: '/admin/stock-settings', order: 16, category: 'catalog' },

  // Sales
  { key: 'orders', label: 'Orders', icon: 'Receipt', route: '/admin/orders', order: 20, category: 'sales' },
  { key: 'customers', label: 'Customers', icon: 'Users', route: '/admin/customers', order: 21, category: 'sales' },
  { key: 'tax', label: 'Tax', icon: 'DollarSign', route: '/admin/tax', order: 22, category: 'sales' },
  { key: 'shipping_methods', label: 'Shipping Methods', icon: 'Truck', route: '/admin/shipping-methods', order: 23, category: 'sales' },
  { key: 'payment_methods', label: 'Payment Methods', icon: 'CreditCard', route: '/admin/payment-methods', order: 24, category: 'sales' },
  { key: 'coupons', label: 'Coupons', icon: 'Ticket', route: '/admin/coupons', order: 25, category: 'sales' },
  { key: 'delivery_settings', label: 'Delivery Settings', icon: 'Calendar', route: '/admin/delivery-settings', order: 26, category: 'sales' },

  // Content
  { key: 'cms_blocks', label: 'CMS Blocks', icon: 'FileText', route: '/admin/cms-blocks', order: 30, category: 'content' },
  { key: 'cms_pages', label: 'CMS Pages', icon: 'FileText', route: '/admin/cms-pages', order: 31, category: 'content' },
  { key: 'file_library', label: 'File Library', icon: 'Upload', route: '/admin/file-library', order: 32, category: 'content' },
  { key: 'cookie_consent', label: 'Cookie Consent', icon: 'Shield', route: '/admin/cookie-consent', order: 33, category: 'content' },

  // Marketing
  { key: 'analytics', label: 'Analytics', icon: 'BarChart3', route: '/admin/analytics', order: 40, category: 'marketing' },
  { key: 'heatmaps', label: 'Heatmaps', icon: 'Activity', route: '/admin/heatmaps', order: 41, category: 'marketing' },
  { key: 'ab_testing', label: 'A/B Testing', icon: 'FlaskConical', route: '/admin/ab-testing', order: 42, category: 'marketing' },
  { key: 'customer_activity', label: 'Customer Activity', icon: 'Users', route: '/admin/customer-activity', order: 43, category: 'marketing' },

  // SEO
  { key: 'seo_settings', label: 'SEO Settings', icon: 'Search', route: '/admin/seo-tools/settings', order: 50, category: 'seo' },
  { key: 'seo_templates', label: 'SEO Templates', icon: 'FileText', route: '/admin/seo-tools/templates', order: 51, category: 'seo' },
  { key: 'seo_redirects', label: 'Redirects', icon: 'RefreshCw', route: '/admin/seo-tools/redirects', order: 52, category: 'seo' },
  { key: 'seo_canonical', label: 'Canonical URLs', icon: 'Link', route: '/admin/seo-tools/canonical', order: 53, category: 'seo' },
  { key: 'seo_hreflang', label: 'Hreflang', icon: 'Globe', route: '/admin/seo-tools/hreflang', order: 54, category: 'seo' },
  { key: 'seo_robots', label: 'Robots.txt', icon: 'Bot', route: '/admin/seo-tools/robots', order: 55, category: 'seo' },
  { key: 'seo_social', label: 'Social Media', icon: 'Share2', route: '/admin/seo-tools/social', order: 56, category: 'seo' },
  { key: 'seo_report', label: 'SEO Report', icon: 'FileText', route: '/admin/seo-tools/report', order: 57, category: 'seo' },
  { key: 'xml_sitemap', label: 'XML Sitemap', icon: 'FileCode', route: '/admin/xml-sitemap', order: 58, category: 'seo' },
  { key: 'html_sitemap', label: 'HTML Sitemap', icon: 'FileText', route: '/admin/html-sitemap', order: 59, category: 'seo' },

  // Import/Export
  { key: 'google_tag_manager', label: 'Google Tag Manager', icon: 'Code', route: '/admin/google-tag-manager', order: 60, category: 'import_export' },
  { key: 'akeneo_integration', label: 'Akeneo', icon: 'Database', route: '/admin/akeneo-integration', order: 61, category: 'import_export' },
  { key: 'marketplace_export', label: 'Marketplace Export', icon: 'Upload', route: '/admin/marketplace-export', order: 62, category: 'import_export' },
  { key: 'ecommerce_integrations', label: 'E-commerce', icon: 'ShoppingBag', route: '/admin/ecommerce-integrations', order: 63, category: 'import_export' },
  { key: 'crm_integrations', label: 'CRM', icon: 'Users', route: '/admin/crm-integrations', order: 64, category: 'import_export' },
  { key: 'shopify_integration', label: 'Shopify', icon: 'ShoppingBag', route: '/admin/shopify-integration', order: 65, category: 'import_export' },

  // Store Settings
  { key: 'settings', label: 'General Settings', icon: 'Settings', route: '/admin/settings', order: 70, category: 'store' },
  { key: 'theme_layout', label: 'Theme & Layout', icon: 'Palette', route: '/admin/theme-layout', order: 71, category: 'store' },
  { key: 'media_storage', label: 'Media Storage', icon: 'Image', route: '/admin/media-storage', order: 72, category: 'store' },
  { key: 'database_integrations', label: 'Database', icon: 'Database', route: '/admin/database-integrations', order: 73, category: 'store' },
  { key: 'render_integration', label: 'Render', icon: 'Cloud', route: '/admin/render-integration', order: 74, category: 'store' },
  { key: 'stores', label: 'Stores', icon: 'Store', route: '/admin/stores', order: 75, category: 'store' },
  { key: 'supabase', label: 'Supabase', icon: 'Database', route: '/admin/supabase', order: 76, category: 'store' },
  { key: 'integrations', label: 'Integrations', icon: 'Link', route: '/admin/integrations', order: 77, category: 'store' },

  // Advanced
  { key: 'monitoring_dashboard', label: 'Monitoring', icon: 'Activity', route: '/admin/monitoring-dashboard', order: 80, category: 'advanced' },
  { key: 'scheduled_jobs', label: 'Scheduled Jobs', icon: 'Calendar', route: '/admin/scheduled-jobs', order: 81, category: 'advanced' },
  { key: 'billing', label: 'Billing', icon: 'Wallet', route: '/admin/billing', order: 82, category: 'advanced' },
  { key: 'team', label: 'Team', icon: 'Users', route: '/admin/team', order: 83, category: 'advanced' },
  { key: 'onboarding', label: 'Onboarding', icon: 'BookOpen', route: '/admin/onboarding', order: 84, category: 'advanced' },
  { key: 'ai_context_window', label: 'AI Context', icon: 'Bot', route: '/admin/ai-context-window', order: 85, category: 'advanced' },
  { key: 'translations', label: 'Translations', icon: 'Globe', route: '/admin/translations', order: 86, category: 'advanced' },
  { key: 'ai_studio', label: 'AI Studio', icon: 'Bot', route: '/admin/ai-studio', order: 87, category: 'advanced' }
];

async function seedNavigation() {
  try {
    console.log(`🌱 Seeding ${allNavItems.length} navigation items...\n`);

    let count = 0;
    for (const item of allNavItems) {
      await sequelize.query(`
        INSERT INTO admin_navigation_registry
        (key, label, icon, route, order_position, is_core, is_visible, category)
        VALUES ($1, $2, $3, $4, $5, true, true, $6)
        ON CONFLICT (key) DO UPDATE SET
          label = EXCLUDED.label,
          icon = EXCLUDED.icon,
          route = EXCLUDED.route,
          order_position = EXCLUDED.order_position,
          category = EXCLUDED.category
      `, {
        bind: [item.key, item.label, item.icon, item.route, item.order, item.category]
      });
      count++;
      if (count % 10 === 0) {
        console.log(`  ✅ Seeded ${count} items...`);
      }
    }

    console.log(`\n✅ All ${allNavItems.length} navigation items seeded successfully!`);

    // Show count by category
    const [counts] = await sequelize.query(`
      SELECT category, COUNT(*) as count
      FROM admin_navigation_registry
      WHERE is_core = true
      GROUP BY category
      ORDER BY category
    `);

    console.log('\n📊 Navigation items by category:');
    counts.forEach(c => console.log(`  ${c.category}: ${c.count} items`));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

seedNavigation();
