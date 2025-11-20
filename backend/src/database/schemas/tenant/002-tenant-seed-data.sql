-- ============================================
-- TENANT DATABASE SEED DATA
-- Default data for new tenant databases
-- Auto-generated from existing database
-- ============================================

-- Tables with seed data:
--   - admin_navigation_registry
--   - cms_pages
--   - cms_page_translations
--   - cookie_consent_settings
--   - cookie_consent_settings_translations
--   - email_templates
--   - email_template_translations
--   - languages
--   - payment_methods
--   - payment_method_translations
--   - pdf_templates
--   - pdf_template_translations
--   - shipping_methods
--   - shipping_method_translations
--   - translations

-- ============================================
-- SEED DATA
-- ============================================

-- admin_navigation_registry (83 rows)
INSERT INTO admin_navigation_registry (id, key, label, icon, route, parent_key, order_position, is_core, is_visible, plugin_id, category, required_permission, description, badge_config, created_at, updated_at, type)
VALUES
  ('c7a5b648-8c9f-4d74-a347-b21d89cc25a6', 'test-dummy-page', 'Test Page', 'TestTube', '/admin/dummy-test', NULL, 999, false, true, NULL, NULL, NULL, 'Test page for navigation system debugging', NULL, '2025-10-21T15:09:17.618Z', '2025-10-21T15:09:17.618Z', 'standard'),
  ('0e599da5-acb3-42b9-95f3-40bec8114ecf', 'categories', 'Categories', 'Tag', '/admin/categories', 'catalog', 40, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:28:07.294Z', '2025-11-04T16:06:58.262Z', 'standard'),
  ('5bfea719-f62a-40e4-ba87-9259fb295e99', 'sales-settings', 'Settings', 'SettingsIcon', '/admin/sales-settings', 'sales', 120, true, true, NULL, 'main', NULL, NULL, NULL, '2025-11-04T14:32:28.871Z', '2025-11-04T16:06:58.459Z', 'standard'),
  ('572c97b0-a00e-4a65-8a5d-e87036325e68', 'seo_hreflang', 'Hreflang', 'Globe', '/admin/seo-tools/hreflang', 'seo', 410, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.088Z', '2025-11-04T16:06:59.268Z', 'standard'),
  ('c498373d-a513-4f78-b732-3c1933d181c9', 'seo_robots', 'Robots.txt', 'Bot', '/admin/seo-tools/robots', 'seo', 420, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.118Z', '2025-11-04T16:06:59.296Z', 'standard'),
  ('c724b28d-e3bc-48ae-8707-87d585a7fe74', 'seo_social', 'Social Media', 'Share2', '/admin/seo-tools/social', 'seo', 430, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.150Z', '2025-11-04T16:06:59.321Z', 'standard'),
  ('793535ce-1c1f-4c35-9cb0-24f05a52f047', 'xml_sitemap', 'XML Sitemap', 'FileCode', '/admin/xml-sitemap', 'seo', 440, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.209Z', '2025-11-04T16:06:59.346Z', 'standard'),
  ('7ecc37c8-13fe-45a2-bded-0172da9184de', 'html_sitemap', 'HTML Sitemap', 'FileText', '/admin/html-sitemap', 'seo', 450, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.238Z', '2025-11-04T16:06:59.373Z', 'standard'),
  ('86af5d49-7fb1-405e-a371-f627274772b5', 'seo_report', 'SEO Report', 'FileText', '/admin/seo-tools/report', 'seo', 460, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.180Z', '2025-11-04T16:06:59.398Z', 'standard'),
  ('ada124ce-e1a5-4d93-b071-0514350deda0', 'uptime-report', 'Uptime Report', 'Activity', '/admin/uptime-report', 'store', 580, true, true, NULL, 'store', NULL, 'Track daily charges and uptime for running stores', NULL, '2025-10-30T22:57:00.288Z', '2025-11-04T16:06:59.717Z', 'standard'),
  ('0a4ffc9f-283c-4aa0-874f-038a461bdbd0', 'plugins', 'Plugins', 'Puzzle', '/admin/plugins', 'advanced', 100, true, false, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:13:41.802Z', '2025-10-21T10:20:48.456Z', 'standard'),
  ('3305ab6e-5d31-4731-9af8-163daa2db9f6', 'billing', 'Billing', 'Wallet', '/admin/billing', 'advanced', 1, true, false, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.750Z', '2025-10-18T17:28:08.750Z', 'standard'),
  ('e92d88e9-5c06-4111-86ca-8eae762c8ba1', 'team', 'Team', 'Users', '/admin/team', 'advanced', 1, true, false, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.779Z', '2025-10-18T17:28:08.779Z', 'standard'),
  ('086a73b9-5323-4893-859f-612234ec807d', 'onboarding', 'Onboarding', 'BookOpen', '/admin/onboarding', 'advanced', 1, true, false, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.809Z', '2025-10-18T17:28:08.809Z', 'standard'),
  ('237cfcb8-0464-44ab-916a-d2425f7bad73', 'theme_layout', 'Theme & Layout', 'Palette', '/admin/theme-layout', 'layout', 480, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-18T17:28:08.486Z', '2025-11-04T16:06:59.454Z', 'standard'),
  ('250c4f0b-bcaf-45c6-b865-0967326f623d', 'emails', 'Emails', 'Mail', '/admin/emails', 'content', 500, true, true, NULL, 'content', NULL, NULL, NULL, '2025-10-31T20:20:51.264Z', '2025-11-04T16:06:59.508Z', 'standard'),
  ('ef7e14a8-7cde-4635-ad0a-9186b32a7361', 'heatmaps', 'Heatmaps', 'Activity', '/admin/heatmaps', 'marketing', 260, true, true, NULL, 'marketing', NULL, NULL, NULL, '2025-10-18T17:28:07.875Z', '2025-11-04T16:06:58.865Z', 'premium'),
  ('e413cc8c-ad78-48cc-af65-69985ac20507', 'plugin-902c67ba-dc39-4e6e-b218-cf606ccae19e', 'Plugin Item', 'Package', '/admin', NULL, 80, false, true, '902c67ba-dc39-4e6e-b218-cf606ccae19e', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:28.281Z', '2025-10-21T12:26:45.423Z', 'standard'),
  ('237f8e13-3063-4d7e-801a-efcb68c2d561', 'plugin-a233bd52-f7a9-4b1e-ba45-dc8cc734bc53', 'Plugin Item', 'Package', '/admin', NULL, 85, false, true, 'a233bd52-f7a9-4b1e-ba45-dc8cc734bc53', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:28.315Z', '2025-10-21T12:26:45.646Z', 'standard'),
  ('6889bdcd-9849-4c7b-b26a-da08e4a9da25', 'ab_testing', 'A/B Testing', 'FlaskConical', '/admin/ab-testing', 'marketing', 270, true, true, NULL, 'marketing', NULL, NULL, NULL, '2025-10-18T17:28:07.905Z', '2025-11-04T16:06:58.890Z', 'standard'),
  ('621a4cd9-84e9-420b-82f8-b3b837b45059', 'analytics', 'Analytics', 'BarChart3', '/admin/analytics', 'marketing', 290, true, true, NULL, 'marketing', NULL, NULL, NULL, '2025-10-18T17:13:41.770Z', '2025-11-04T16:06:58.939Z', 'standard'),
  ('6d782a02-a782-44dd-9721-552701e55571', 'customers', 'Customers', 'Users', '/admin/customers', 'sales', 140, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:13:41.733Z', '2025-11-04T16:06:58.509Z', 'standard'),
  ('458e07de-a8b2-401a-91bb-bcb4bab85456', 'seo', 'SEO', 'Search', NULL, NULL, 360, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.771Z', '2025-11-04T16:06:59.124Z', 'standard'),
  ('3d9cae05-b1bf-4f6d-8534-8a00a4673da8', 'plugin-aff4ce90-b77b-4fd8-aa10-827a0917d3e7', 'Plugin Item', 'Package', '/admin', NULL, 101, false, true, 'aff4ce90-b77b-4fd8-aa10-827a0917d3e7', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:28.252Z', '2025-10-21T09:09:09.267Z', 'standard'),
  ('d3a02b09-9bba-42fa-a004-fb260e8f148b', 'crm_integrations', 'CRM', 'Users', '/admin/crm-integrations', 'import_export', 340, true, true, NULL, 'import_export', NULL, NULL, NULL, '2025-10-18T17:28:08.393Z', '2025-11-04T16:06:59.073Z', 'standard'),
  ('c37be799-dc3a-419d-a1cd-689776333602', 'dashboard', 'Dashboard', 'LayoutDashboard', '/admin/dashboard', NULL, 10, true, true, NULL, 'main', NULL, NULL, NULL, '2025-10-18T17:13:41.616Z', '2025-11-04T16:06:58.206Z', 'standard'),
  ('8ed2a4ed-f089-4d31-907c-4890a0fe3f93', 'marketing', 'Marketing', 'Megaphone', NULL, NULL, 240, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.735Z', '2025-11-04T16:06:58.806Z', 'standard'),
  ('dd08ce7f-b4ae-40dc-ae0a-e0e8667a9a2e', 'seo_templates', 'SEO Templates', 'FileText', '/admin/seo-tools/templates', 'seo', 380, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:07.997Z', '2025-11-04T16:06:59.174Z', 'standard'),
  ('0a442ac7-a056-4da4-9f40-902c5a41bd00', 'stock_settings', 'Stock Settings', 'Package', '/admin/stock-settings', 'catalog', 100, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:28:07.482Z', '2025-11-04T16:06:58.410Z', 'standard'),
  ('e8f92e5e-0e96-4b4d-bf43-25fea085035a', 'blacklist', 'Blacklist', 'Shield', '/admin/blacklist', 'customers', 145, true, true, NULL, 'main', NULL, NULL, NULL, '2025-11-04T16:02:11.093Z', '2025-11-04T16:06:58.534Z', 'standard'),
  ('63e01829-d4b6-4e8e-a7f2-9578d4c7f394', 'content', 'Content', 'FileText', NULL, NULL, 200, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.702Z', '2025-11-04T16:06:58.698Z', 'standard'),
  ('e9eb150b-57aa-45a6-a38f-5d248c56d4b1', 'ai_studio', 'AI Studio', 'Bot', '/admin/ai-studio', 'advanced', 1, true, false, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.904Z', '2025-10-18T17:28:08.904Z', 'standard'),
  ('9deae6d2-8b79-4961-9aa7-af5c420b530a', 'cms_pages', 'CMS Pages', 'FileText', '/admin/cms-pages', 'content', 210, true, true, NULL, 'content', NULL, NULL, NULL, '2025-10-18T17:28:07.747Z', '2025-11-04T16:06:58.724Z', 'standard'),
  ('bd22f10c-8b2e-4948-b306-431f2a97e7fd', 'customer_activity', 'Customer Activity', 'Users', '/admin/customer-activity', 'marketing', 280, true, true, NULL, 'marketing', NULL, NULL, NULL, '2025-10-18T17:28:07.935Z', '2025-11-04T16:06:58.914Z', 'standard'),
  ('f00b2a6d-21c6-44bb-bead-2d773a097c42', 'shipping_methods', 'Shipping Methods', 'Truck', '/admin/shipping-methods', 'sales', 160, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:28:07.601Z', '2025-11-04T16:06:58.591Z', 'standard'),
  ('245a141f-f41b-4e1c-9030-639681b0ac7d', 'import_export', 'Import & Export', 'Upload', NULL, NULL, 300, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.808Z', '2025-11-04T16:06:58.964Z', 'standard'),
  ('f2237ccf-8449-42f3-ad6e-8ef6773e0010', 'payment_methods', 'Payment Methods', 'CreditCard', '/admin/payment-methods', 'sales', 170, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:28:07.631Z', '2025-11-04T16:06:58.616Z', 'standard'),
  ('77cbe1a5-81fc-42f8-bbdd-46d5ca199a79', 'marketplace_export', 'Marketplace Export', 'Upload', '/admin/marketplace-export', 'import_export', 310, true, true, NULL, 'import_export', NULL, NULL, NULL, '2025-10-18T17:28:08.330Z', '2025-11-04T16:06:58.993Z', 'standard'),
  ('4a706191-0c65-48c4-8efa-f355454fab8e', 'akeneo_integration', 'Akeneo', 'Database', '/admin/akeneo-integration', 'import_export', 350, true, true, NULL, 'import_export', NULL, NULL, NULL, '2025-10-18T17:28:08.300Z', '2025-11-04T16:06:59.097Z', 'beta'),
  ('c4c35189-2da3-4062-a490-cab76a4cd967', 'seo_redirects', 'Redirects', 'RefreshCw', '/admin/seo-tools/redirects', 'seo', 390, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.028Z', '2025-11-04T16:06:59.205Z', 'standard'),
  ('067d4c9b-7823-4f64-be28-8c75450d231e', 'seo_settings', 'Global', 'Search', '/admin/seo-tools/settings', 'seo', 370, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:07.966Z', '2025-11-04T16:06:59.149Z', 'standard'),
  ('6d54e5c6-d6d8-4ea0-aa72-8eacc29f0f72', 'seo_canonical', 'Canonical URLs', 'Link', '/admin/seo-tools/canonical', 'seo', 400, true, true, NULL, 'seo', NULL, NULL, NULL, '2025-10-18T17:28:08.058Z', '2025-11-04T16:06:59.241Z', 'standard'),
  ('c8478891-a228-42c7-bf48-df2543ac9536', 'layout', 'Layout', 'Megaphone', NULL, NULL, 470, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:40:00.424Z', '2025-11-04T16:06:59.427Z', 'standard'),
  ('2e0296a4-71fd-4e25-ae92-32b60fda62f2', 'ecommerce_integrations', 'E-commerce', 'ShoppingBag', '/admin/ecommerce-integrations', 'import_export', 320, true, true, NULL, 'import_export', NULL, NULL, NULL, '2025-10-18T17:28:08.359Z', '2025-11-04T16:06:59.019Z', 'standard'),
  ('0668a4f5-529c-4e15-b230-e3ae93f3aeb7', 'custom_option_rules', 'Custom Options', 'Settings', '/admin/custom-option-rules', 'catalog', 70, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:28:07.393Z', '2025-11-04T16:06:58.336Z', 'standard'),
  ('571400bd-6f57-48e4-b756-4c9e3401cdd3', 'ai_context_window', 'AI Context', 'Bot', '/admin/ai-context-window', 'advanced', 103, true, false, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.839Z', '2025-10-18T17:28:08.839Z', 'standard'),
  ('54c16031-0df4-4bac-85b5-857ba0972e69', 'plugin-196ba25c-da64-4e2a-ab53-3978462ae84c', 'Plugin Item', 'Package', '/admin', NULL, 106, false, true, '196ba25c-da64-4e2a-ab53-3978462ae84c', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:28.222Z', '2025-10-21T09:09:09.240Z', 'standard'),
  ('5025c86d-8955-4c4d-a67a-78212e0e7182', 'product_tabs', 'Product Tabs', 'FileText', '/admin/product-tabs', 'catalog', 80, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:28:07.422Z', '2025-11-04T16:06:58.360Z', 'standard'),
  ('6c05b36b-b525-4d55-81fe-b8857ed21572', 'sales', 'Sales', 'Receipt', NULL, NULL, 110, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.665Z', '2025-11-04T16:06:58.434Z', 'standard'),
  ('e07959cb-4083-428a-a68f-185f845f9e2d', 'catalog', 'Catalog', 'Package', NULL, NULL, 30, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.608Z', '2025-11-04T16:06:58.235Z', 'standard'),
  ('ba916985-a696-4fbd-998c-df7cffa7ed28', 'coupons', 'Coupons', 'Ticket', '/admin/coupons', 'sales', 180, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:28:07.660Z', '2025-11-04T16:06:58.645Z', 'standard'),
  ('3d5d200b-a385-4f40-8ab0-6c234295cddc', 'file_library', 'File Library', 'Upload', '/admin/file-library', 'content', 230, true, true, NULL, 'content', NULL, NULL, NULL, '2025-10-18T17:28:07.776Z', '2025-11-04T16:06:58.775Z', 'standard'),
  ('be829aa4-6a01-4db3-a73d-c7d105f838f1', 'products', 'Products', 'Package', '/admin/products', 'catalog', 50, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:13:41.667Z', '2025-11-04T16:06:58.286Z', 'standard'),
  ('29f2a22b-fa56-466b-80fe-5f970db59f39', 'attributes', 'Attributes', 'Box', '/admin/attributes', 'catalog', 60, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:28:07.363Z', '2025-11-04T16:06:58.311Z', 'standard'),
  ('2036d4dc-cbb7-4587-95bf-5dbfea2741dc', 'product_labels', 'Product Labels', 'Tag', '/admin/product-labels', 'catalog', 90, true, true, NULL, 'catalog', NULL, NULL, NULL, '2025-10-18T17:28:07.453Z', '2025-11-04T16:06:58.385Z', 'standard'),
  ('34efb882-144a-4177-90a4-0da9312baef7', 'orders', 'Orders', 'Receipt', '/admin/orders', 'sales', 130, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:13:41.699Z', '2025-11-04T16:06:58.484Z', 'standard'),
  ('9c18f251-f391-47aa-84ba-8c155f07e808', 'tax', 'Tax', 'DollarSign', '/admin/tax', 'sales', 150, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:28:07.572Z', '2025-11-04T16:06:58.562Z', 'standard'),
  ('9e88d83f-3820-47ac-9138-7c7bc381ee41', 'delivery_settings', 'Delivery Settings', 'Calendar', '/admin/delivery-settings', 'sales', 190, true, true, NULL, 'sales', NULL, NULL, NULL, '2025-10-18T17:28:07.689Z', '2025-11-04T16:06:58.673Z', 'standard'),
  ('19abe7de-a1d1-42ff-9da2-30ffb19c1e6b', 'cms_blocks', 'CMS Blocks', 'Square', '/admin/cms-blocks', 'content', 220, true, true, NULL, 'content', NULL, NULL, NULL, '2025-10-18T17:28:07.718Z', '2025-11-04T16:06:58.750Z', 'standard'),
  ('8971f94f-c30c-4029-8432-2696176ca16a', 'cookie_consent', 'Cookie Consent', 'Shield', '/admin/cookie-consent', 'marketing', 250, true, true, NULL, 'content', NULL, NULL, NULL, '2025-10-18T17:28:07.814Z', '2025-11-04T16:06:58.839Z', 'standard'),
  ('2e6e8b58-03e9-4ad2-9ecc-8051c343a269', 'custom_domains', 'Custom Domains', 'Globe', '/admin/custom-domains', 'store', 590, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-24T23:54:34.647Z', '2025-11-04T16:06:59.742Z', 'standard'),
  ('90e36469-b9e5-4a2b-8d7d-5fde01f066e9', 'translations', 'Translations', 'Globe', '/admin/translations', 'layout', 490, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-18T17:28:08.875Z', '2025-11-04T16:06:59.480Z', 'new'),
  ('740efd0a-7b46-40de-8397-89f1bec7735b', 'plugin-f9ef4770-4685-4d05-abd5-6b2c884057c3', 'Akeneo PIM', 'Database', '/admin/akeneo', 'products', 510, false, true, 'f9ef4770-4685-4d05-abd5-6b2c884057c3', 'plugins', NULL, NULL, NULL, '2025-11-04T16:06:59.534Z', '2025-11-04T16:06:59.534Z', 'standard'),
  ('ffb70e1a-6d90-46bd-a890-7837404ff1ab', 'store', 'Store', 'Store', NULL, NULL, 520, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.841Z', '2025-11-04T16:06:59.562Z', 'standard'),
  ('e4de6184-0894-409c-b819-58bd3a0539d5', 'settings', 'General Settings', 'Settings', '/admin/settings', 'store', 530, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-18T17:13:41.837Z', '2025-11-04T16:06:59.593Z', 'standard'),
  ('18727c04-a31b-4dc4-9b06-9d81a71beeee', 'database_integrations', 'Database', 'Database', '/admin/database-integrations', 'store', 540, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-18T17:28:08.544Z', '2025-11-04T16:06:59.618Z', 'standard'),
  ('93b2fb65-e369-4631-976a-35a764de7459', 'store_email', 'Email', 'Mail', '/admin/settings/email', 'store', 550, true, true, NULL, 'store', NULL, NULL, NULL, '2025-11-03T06:28:25.962Z', '2025-11-04T16:06:59.643Z', 'standard'),
  ('31085f55-2a25-40ed-83ba-be0c80998b81', 'media_storage', 'Media Storage', 'Image', '/admin/media-storage', 'store', 560, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-18T17:28:08.514Z', '2025-11-04T16:06:59.667Z', 'standard'),
  ('408ab7f7-2187-4afd-a788-5dd7b6039467', 'plugin-8cc221d2-0983-41b9-ae90-8b7d2a87e4aa', 'Marketplace Export', 'Upload', '/admin/marketplace-export', 'products', 570, false, true, '8cc221d2-0983-41b9-ae90-8b7d2a87e4aa', 'plugins', NULL, NULL, NULL, '2025-11-04T16:06:59.692Z', '2025-11-04T16:06:59.692Z', 'standard'),
  ('d15c2f9e-ce66-42a2-85fa-280f8f170f62', 'cache', 'Cache', 'Database', '/admin/cache', 'store', 600, true, true, NULL, 'store', NULL, NULL, NULL, '2025-10-26T14:52:40.961Z', '2025-11-04T16:06:59.767Z', 'standard'),
  ('3e48d805-d85b-45de-b7fb-b11e844ef581', 'advanced', 'Advanced', 'Settings', NULL, NULL, 610, true, true, NULL, NULL, NULL, NULL, NULL, '2025-10-18T20:16:55.877Z', '2025-11-04T16:06:59.791Z', 'standard'),
  ('e9574017-db4f-4ab1-b97e-21f19b43b99b', 'scheduled_jobs', 'Scheduled Jobs', 'Calendar', '/admin/scheduled-jobs', 'advanced', 620, true, true, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.721Z', '2025-11-04T16:06:59.818Z', 'standard'),
  ('0ac8ce40-e006-4267-8a68-a8d495299756', 'monitoring_dashboard', 'Monitoring', 'Activity', '/admin/monitoring-dashboard', 'advanced', 630, true, true, NULL, 'advanced', NULL, NULL, NULL, '2025-10-18T17:28:08.692Z', '2025-11-04T16:06:59.849Z', 'standard'),
  ('24dde7e9-518b-449b-919c-3e0c06c51d61', 'plugin-c80b7d37-b985-4ead-be17-b265938753ab', 'Plugin Item', 'Package', '/admin', 'sales', 640, false, true, 'c80b7d37-b985-4ead-be17-b265938753ab', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:30.135Z', '2025-11-04T16:06:59.874Z', 'standard'),
  ('e129c820-497f-4ea0-836c-27b39b3f8b44', 'plugin-4eb11832-5429-4146-af06-de86d319a0e5', 'Email Capture', 'Mail', '/admin/plugins/my-cart-alert/emails', 'store', 650, false, true, '4eb11832-5429-4146-af06-de86d319a0e5', 'plugins', NULL, NULL, NULL, '2025-11-04T16:06:59.899Z', '2025-11-04T16:06:59.899Z', 'standard'),
  ('4082e51c-8c44-4abb-ac1b-50184ebcd207', 'plugin-ef537565-3db0-466e-8b56-1694499f6a03', 'Newsletter Plugin', 'envelope', '/admin/plugins/newsletter-plugin', NULL, 660, false, true, 'ef537565-3db0-466e-8b56-1694499f6a03', 'plugins', NULL, NULL, NULL, '2025-11-04T16:06:59.926Z', '2025-11-04T16:06:59.926Z', 'standard'),
  ('1d2e3124-24f7-4b3c-ba15-19fc462ca2db', 'plugin-6da7eaa9-737a-4af7-ab4b-119c95deb5e7', 'Plugin Item', 'Package', '/admin', NULL, 106, false, true, '6da7eaa9-737a-4af7-ab4b-119c95deb5e7', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:30.079Z', '2025-10-21T09:09:09.156Z', 'standard'),
  ('f9f41d2c-5a44-4402-bc5d-42a704c956c4', 'plugin-b4fa6681-7371-463e-81b0-bc95dc72c88c', 'Plugin Item', 'Package', '/admin', NULL, 106, false, true, 'b4fa6681-7371-463e-81b0-bc95dc72c88c', 'plugins', NULL, NULL, NULL, '2025-10-21T07:29:30.108Z', '2025-10-21T09:09:09.025Z', 'standard'),
  ('0162fe04-d1b3-4871-a92a-be7d54afd002', 'shopify_integration', 'Shopify', 'ShoppingBag', '/admin/shopify-integration', 'import_export', 330, true, true, NULL, 'import_export', NULL, NULL, NULL, '2025-10-18T17:28:08.428Z', '2025-11-12T23:07:54.677Z', NULL),
  ('571cf04b-2b04-428a-ad55-9192a56f7976', 'marketplace_hub', 'Marketplace Hub', 'ShoppingCart', '/admin/marketplace-hub', 'import_export', 310, true, true, NULL, 'import_export', NULL, 'Unified marketplace management: Amazon, eBay, and more with AI optimization', '{"text":"New","color":"blue","variant":"default"}'::jsonb, '2025-11-12T23:07:54.677Z', '2025-11-13T06:13:20.486Z', 'new'),
  ('5415ee5a-1276-4883-ac01-33d3dfcb1c2b', 'import_export_jobs', 'Jobs & Analytics', 'BarChart3', '/admin/import-export-jobs', 'import_export', 350, true, true, NULL, 'import_export', NULL, 'Monitor import/export jobs and view performance analytics', NULL, '2025-11-13T06:13:20.486Z', '2025-11-13T06:13:20.486Z', NULL),
  ('b3f52d82-6591-4a20-9ed2-d2172c6fec54', 'background_jobs', 'Background Jobs', 'Activity', '/admin/background-jobs', 'store', 910, true, true, NULL, 'advanced', NULL, 'Monitor all background job processing and queue status', NULL, '2025-11-13T06:13:20.486Z', '2025-11-13T06:13:20.486Z', NULL),
  ('35b0b080-3257-4fd2-a2d2-477ac0c93abb', 'job_scheduler', 'Job Scheduler', 'Clock', '/admin/job-scheduler', 'store', 920, true, true, NULL, 'advanced', NULL, 'Schedule recurring tasks and cron jobs (plugin support)', '{"text":"New","color":"purple","variant":"outline"}'::jsonb, '2025-11-13T06:13:20.486Z', '2025-11-13T06:13:20.486Z', 'new')
ON CONFLICT DO NOTHING;


-- cms_pages (3 rows)
INSERT INTO cms_pages (id, slug, is_active, meta_title, meta_description, meta_keywords, meta_robots_tag, store_id, related_product_ids, published_at, sort_order, created_at, updated_at, is_system, seo)
VALUES
  ('f04fac32-51e5-4162-a35e-5d496dd2410a', 'yryryryr', true, '', '', '', 'index, follow', '157d4590-49bf-4b0b-bd77-abe131909528', '["4df411ea-a896-4a3c-9f83-53640886b9ea","01c89d04-b9e0-43c4-aa75-f1b743b5eaa3"]'::jsonb, NULL, 0, '2025-10-23T08:56:11.639Z', '2025-10-23T13:12:55.382Z', false, '{}'::jsonb),
  ('bbb26804-4ff2-4e8b-ba2b-e8c203704176', '404-page-not-foundd-wh', true, '404 - Page Not Found | {{store_name}}', 'Sorry, we couldn''t find the page you''re looking for. Browse our products or contact us for assistance.', '404, page not found, error, help', 'noindex, nofollow', '157d4590-49bf-4b0b-bd77-abe131909528', '[]'::jsonb, NULL, 0, '2025-08-03T13:25:59.349Z', '2025-10-23T14:32:28.325Z', true, '{}'::jsonb),
  ('b80190d0-653a-46e3-962c-1abb0078b8c9', 'privacy-policy', true, 'Privacy Policy | Hamid', 'Learn how Hamid collects, uses, and protects your personal information. Read our privacy policy for details on data protection and your rights.', 'privacy policy, data protection, personal information, privacy rights, GDPR', 'index, follow', '157d4590-49bf-4b0b-bd77-abe131909528', '[]'::jsonb, NULL, 9998, '2025-10-23T15:34:30.823Z', '2025-10-23T15:34:30.823Z', true, '{}'::jsonb)
ON CONFLICT DO NOTHING;


-- cms_page_translations (6 rows)
INSERT INTO cms_page_translations (cms_page_id, language_code, title, content, excerpt, created_at, updated_at)
VALUES
  ('bbb26804-4ff2-4e8b-ba2b-e8c203704176', 'en', '404 - Page Not Foundd, wh', '
<div style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
  <div style="font-size: 6rem; font-weight: bold; color: #9CA3AF; margin-bottom: 1rem;">404</div>
  
  <h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
    Oops! Page Not Found Hamid
  </h1>
  
  <p style="color: #6B7280; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
    We''re sorry, but the page you''re looking for seems to have wandered off. 
    Don''t worry though – we''ll help you find what you need!
  </p>
  
  <div style="margin-bottom: 2rem;">
    <p style="color: #374151; margin-bottom: 1rem;">Here are some helpful links:</p>
    <ul style="list-style: none; padding: 0; color: #2563EB;">
      <li style="margin-bottom: 0.5rem;">
        <a href="/" style="color: #2563EB; text-decoration: none;">🏠 Home Page</a>
      </li>
      <li style="margin-bottom: 0.5rem;">
        <a href="/category" style="color: #2563EB; text-decoration: none;">🛍️ Shop All Products</a>
      </li>
      <li style="margin-bottom: 0.5rem;">
        <a href="/contact" style="color: #2563EB; text-decoration: none;">📞 Contact Us</a>
      </li>
    </ul>
  </div>
  
  <div style="background-color: #F3F4F6; padding: 1.5rem; border-radius: 8px; margin-top: 2rem;">
    <p style="color: #374151; margin: 0; font-size: 0.9rem;">
      <strong>Need help?</strong> If you believe this is an error or you can''t find what you''re looking for, 
      please don''t hesitate to contact our support team. We''re here to help!
    </p>
  </div>
</div>
', NULL, '2025-10-24T16:42:17.998Z', '2025-10-24T16:42:17.998Z'),
  ('b80190d0-653a-46e3-962c-1abb0078b8c9', 'en', 'Privacy Policy', '<div style="max-width: 900px; margin: 0 auto; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <h1 style="font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 1.5rem; border-bottom: 3px solid #2563EB; padding-bottom: 0.5rem;">
    Privacy Policy
  </h1>

  <p style="color: #6B7280; margin-bottom: 2rem; font-size: 0.95rem;">
    <em>Last updated: 23/10/2025</em>
  </p>

  <div style="line-height: 1.8; color: #374151;">
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Introduction</h2>
      <p style="margin-bottom: 1rem;">
        Welcome to Hamid. We respect your privacy and are committed to protecting your personal data.
        This privacy policy will inform you about how we look after your personal data when you visit our website
        and tell you about your privacy rights and how the law protects you.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Information We Collect</h2>
      <p style="margin-bottom: 0.5rem;">We may collect, use, store and transfer different kinds of personal data about you:</p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
        <li style="margin-bottom: 0.5rem;"><strong>Identity Data:</strong> Name, username, or similar identifier</li>
        <li style="margin-bottom: 0.5rem;"><strong>Contact Data:</strong> Email address, telephone number, billing and delivery addresses</li>
        <li style="margin-bottom: 0.5rem;"><strong>Transaction Data:</strong> Details about payments and products you have purchased from us</li>
        <li style="margin-bottom: 0.5rem;"><strong>Technical Data:</strong> IP address, browser type, time zone setting, and location</li>
        <li style="margin-bottom: 0.5rem;"><strong>Usage Data:</strong> Information about how you use our website and services</li>
        <li style="margin-bottom: 0.5rem;"><strong>Marketing Data:</strong> Your preferences in receiving marketing from us</li>
      </ul>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">How We Use Your Information</h2>
      <p style="margin-bottom: 0.5rem;">We use your personal data for the following purposes:</p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
        <li style="margin-bottom: 0.5rem;">To process and deliver your orders</li>
        <li style="margin-bottom: 0.5rem;">To manage your account and provide customer support</li>
        <li style="margin-bottom: 0.5rem;">To improve our website, products, and services</li>
        <li style="margin-bottom: 0.5rem;">To send you marketing communications (with your consent)</li>
        <li style="margin-bottom: 0.5rem;">To comply with legal obligations</li>
      </ul>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Cookies</h2>
      <p style="margin-bottom: 1rem;">
        We use cookies and similar tracking technologies to track activity on our website and store certain information.
        You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        However, if you do not accept cookies, you may not be able to use some portions of our website.
      </p>
      <p style="margin-bottom: 1rem;">
        For more information about the cookies we use, please see our Cookie Consent banner when you first visit our website.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Data Security</h2>
      <p style="margin-bottom: 1rem;">
        We have put in place appropriate security measures to prevent your personal data from being accidentally lost,
        used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents,
        contractors, and other third parties who have a business need to know.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Your Rights</h2>
      <p style="margin-bottom: 0.5rem;">Under data protection laws, you have rights including:</p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
        <li style="margin-bottom: 0.5rem;"><strong>Right to access:</strong> Request access to your personal data</li>
        <li style="margin-bottom: 0.5rem;"><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
        <li style="margin-bottom: 0.5rem;"><strong>Right to erasure:</strong> Request deletion of your personal data</li>
        <li style="margin-bottom: 0.5rem;"><strong>Right to restrict processing:</strong> Request restriction on processing</li>
        <li style="margin-bottom: 0.5rem;"><strong>Right to data portability:</strong> Request transfer of your data</li>
        <li style="margin-bottom: 0.5rem;"><strong>Right to object:</strong> Object to processing of your personal data</li>
      </ul>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Third-Party Links</h2>
      <p style="margin-bottom: 1rem;">
        Our website may include links to third-party websites, plug-ins, and applications. Clicking on those links
        may allow third parties to collect or share data about you. We do not control these third-party websites
        and are not responsible for their privacy statements.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Changes to This Privacy Policy</h2>
      <p style="margin-bottom: 1rem;">
        We may update our privacy policy from time to time. We will notify you of any changes by posting the new
        privacy policy on this page and updating the "Last updated" date at the top of this privacy policy.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Contact Us</h2>
      <p style="margin-bottom: 1rem;">
        If you have any questions about this privacy policy or our privacy practices, please contact us at:
      </p>
      <div style="background-color: #F3F4F6; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
        <p style="margin: 0; color: #374151;">
          <strong>Email:</strong> <a href="mailto:privacy@Hamid.com" style="color: #2563EB; text-decoration: none;">privacy@Hamid.com</a>
        </p>
      </div>
    </section>
  </div>
</div>', NULL, '2025-10-24T16:42:18.032Z', '2025-10-26T01:20:11.289Z'),
  ('b80190d0-653a-46e3-962c-1abb0078b8c9', 'nl', 'Privacybeleid', '<div style="max-width: 900px; margin: 0 auto; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
  <h1 style="font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 1.5rem; border-bottom: 3px solid #2563EB; padding-bottom: 0.5rem;">
    Privacybeleid
  </h1>

  <p style="color: #6B7280; margin-bottom: 2rem; font-size: 0.95rem;">
    <em>Laatst bijgewerkt: 23-10-2025</em>
  </p>

  <div style="line-height: 1.8; color: #374151;">
    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Introductie</h2>
      <p style="margin-bottom: 1rem;">
        Welkom bij Hamid. Wij respecteren uw privacy en zijn toegewijd aan het beschermen van uw persoonlijke gegevens.
        Dit privacybeleid informeert u over hoe wij met uw persoonlijke gegevens omgaan wanneer u onze website bezoekt
        en vertelt u over uw privacyrechten en hoe de wet u beschermt.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Informatie die wij verzamelen</h2>
      <p style="margin-bottom: 0.5rem;">Wij kunnen verschillende soorten persoonlijke gegevens over u verzamelen, gebruiken, opslaan en overdragen:</p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
        <li style="margin-bottom: 0.5rem;"><strong>Identiteitsgegevens:</strong> Naam, gebruikersnaam of vergelijkbare identificatie</li>
        <li style="margin-bottom: 0.5rem;"><strong>Contactgegevens:</strong> E-mailadres, telefoonnummer, facturatie- en bezorgadressen</li>
        <li style="margin-bottom: 0.5rem;"><strong>Transactiegegevens:</strong> Details over betalingen en producten die u bij ons hebt gekocht</li>
        <li style="margin-bottom: 0.5rem;"><strong>Technische gegevens:</strong> IP-adres, browsertype, tijdzone-instelling en locatie</li>
        <li style="margin-bottom: 0.5rem;"><strong>Gebruiksgegevens:</strong> Informatie over hoe u onze website en diensten gebruikt</li>
        <li style="margin-bottom: 0.5rem;"><strong>Marketinggegevens:</strong> Uw voorkeuren voor het ontvangen van marketing van ons</li>
      </ul>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Hoe wij uw informatie gebruiken</h2>
      <p style="margin-bottom: 0.5rem;">Wij gebruiken uw persoonlijke gegevens voor de volgende doeleinden:</p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
        <li style="margin-bottom: 0.5rem;">Om uw bestellingen te verwerken en te leveren</li>
        <li style="margin-bottom: 0.5rem;">Om uw account te beheren en klantenondersteuning te bieden</li>
        <li style="margin-bottom: 0.5rem;">Om onze website, producten en diensten te verbeteren</li>
        <li style="margin-bottom: 0.5rem;">Om u marketingcommunicatie te sturen (met uw toestemming)</li>
        <li style="margin-bottom: 0.5rem;">Om te voldoen aan wettelijke verplichtingen</li>
      </ul>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Cookies</h2>
      <p style="margin-bottom: 1rem;">
        Wij gebruiken cookies en vergelijkbare trackingtechnologieën om activiteiten op onze website bij te houden en bepaalde informatie op te slaan.
        U kunt uw browser instrueren om alle cookies te weigeren of aan te geven wanneer een cookie wordt verzonden.
        Als u echter geen cookies accepteert, kunt u mogelijk niet alle delen van onze website gebruiken.
      </p>
      <p style="margin-bottom: 1rem;">
        Voor meer informatie over de cookies die wij gebruiken, zie onze Cookie-toestemmingsbanner wanneer u onze website voor het eerst bezoekt.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Gegevensbeveiliging</h2>
      <p style="margin-bottom: 1rem;">
        Wij hebben passende beveiligingsmaatregelen getroffen om te voorkomen dat uw persoonlijke gegevens per ongeluk verloren gaan,
        gebruikt worden of op ongeoorloofde wijze worden geopend. Wij beperken de toegang tot uw persoonlijke gegevens tot werknemers, agenten,
        aannemers en andere derden die een zakelijke noodzaak hebben om dit te weten.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Uw rechten</h2>
      <p style="margin-bottom: 0.5rem;">Onder de wetgeving op het gebied van gegevensbescherming heeft u rechten, waaronder:</p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
        <li style="margin-bottom: 0.5rem;"><strong>Recht op toegang:</strong> Vraag toegang tot uw persoonlijke gegevens</li>
        <li style="margin-bottom: 0.5rem;"><strong>Recht op rectificatie:</strong> Vraag correctie van onjuiste gegevens</li>
        <li style="margin-bottom: 0.5rem;"><strong>Recht op verwijdering:</strong> Vraag verwijdering van uw persoonlijke gegevens</li>
        <li style="margin-bottom: 0.5rem;"><strong>Recht op beperking van verwerking:</strong> Vraag beperking van de verwerking</li>
        <li style="margin-bottom: 0.5rem;"><strong>Recht op gegevensoverdraagbaarheid:</strong> Vraag overdracht van uw gegevens</li>
        <li style="margin-bottom: 0.5rem;"><strong>Recht van bezwaar:</strong> Bezwaar maken tegen de verwerking van uw persoonlijke gegevens</li>
      </ul>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Links naar derden</h2>
      <p style="margin-bottom: 1rem;">
        Onze website kan links naar websites van derden, plug-ins en applicaties bevatten. Door op die links te klikken
        kunnen derden gegevens over u verzamelen of delen. Wij hebben geen controle over deze websites van derden
        en zijn niet verantwoordelijk voor hun privacyverklaringen.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Wijzigingen in dit privacybeleid</h2>
      <p style="margin-bottom: 1rem;">
        Wij kunnen ons privacybeleid van tijd tot tijd bijwerken. Wij zullen u op de hoogte stellen van eventuele wijzigingen door het nieuwe
        privacybeleid op deze pagina te plaatsen en de datum "Laatst bijgewerkt" bovenaan dit privacybeleid bij te werken.
      </p>
    </section>

    <section style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1rem;">Contact opnemen</h2>
      <p style="margin-bottom: 1rem;">
        Als u vragen heeft over dit privacybeleid of onze privacypraktijken, neem dan contact met ons op via:
      </p>
      <div style="background-color: #F3F4F6; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
        <p style="margin: 0; color: #374151;">
          <strong>E-mail:</strong> <a href="mailto:privacy@Hamid.com" style="color: #2563EB; text-decoration: none;">privacy@Hamid.com</a>
        </p>
      </div>
    </section>
  </div>
</div>', NULL, '2025-10-24T16:42:18.072Z', '2025-10-26T01:20:11.320Z'),
  ('f04fac32-51e5-4162-a35e-5d496dd2410a', 'en', 'hamidr-en-new-latest', 'hello there in latest', NULL, '2025-10-24T16:42:17.918Z', '2025-10-26T06:25:02.007Z'),
  ('f04fac32-51e5-4162-a35e-5d496dd2410a', 'nl', 'hamid-nl-nl-allert', 'hallo daar laatst', NULL, '2025-10-24T16:42:17.961Z', '2025-10-26T06:25:02.041Z'),
  ('bbb26804-4ff2-4e8b-ba2b-e8c203704176', 'nl', '404 - Pagina niet gevonden', '<div style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
  <div style="font-size: 6rem; font-weight: bold; color: #9CA3AF; margin-bottom: 1rem;">404</div>
  
  <h1 style="font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
    Oeps! Pagina Niet Gevonden Hamid
  </h1>
  
  <p style="color: #6B7280; margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6;">
    Het spijt ons, maar de pagina die je zoekt lijkt verdwenen te zijn. 
    Maak je geen zorgen - we zullen je helpen om wat je nodig hebt te vinden!
  </p>
  
  <div style="margin-bottom: 2rem;">
    <p style="color: #374151; margin-bottom: 1rem;">Hier zijn enkele nuttige links:</p>
    <ul style="list-style: none; padding: 0; color: #2563EB;">
      <li style="margin-bottom: 0.5rem;">
        <a href="/" style="color: #2563EB; text-decoration: none;">🏠 Startpagina</a>
      </li>
      <li style="margin-bottom: 0.5rem;">
        <a href="/category" style="color: #2563EB; text-decoration: none;">🛍️ Bekijk Alle Producten</a>
      </li>
      <li style="margin-bottom: 0.5rem;">
        <a href="/contact" style="color: #2563EB; text-decoration: none;">📞 Neem Contact Op</a>
      </li>
    </ul>
  </div>
  
  <div style="background-color: #F3F4F6; padding: 1.5rem; border-radius: 8px; margin-top: 2rem;">
    <p style="color: #374151; margin: 0; font-size: 0.9rem;">
      <strong>Hulp nodig?</strong> Als je denkt dat dit een fout is of als je niet kunt vinden wat je zoekt, 
      aarzel dan niet om contact op te nemen met ons ondersteuningsteam. We zijn er om je te helpen!
    </p>
  </div>
</div>', NULL, '2025-10-31T19:21:58.804Z', '2025-10-31T19:21:58.804Z')
ON CONFLICT DO NOTHING;


-- cookie_consent_settings (1 rows)
INSERT INTO cookie_consent_settings (id, is_enabled, banner_position, banner_text, privacy_policy_url, accept_button_text, reject_button_text, settings_button_text, necessary_cookies, analytics_cookies, marketing_cookies, functional_cookies, theme, primary_color, background_color, text_color, gdpr_mode, auto_detect_country, audit_enabled, consent_expiry_days, show_close_button, privacy_policy_text, categories, gdpr_countries, google_analytics_id, google_tag_manager_id, custom_css, store_id, created_at, updated_at, translations, accept_button_bg_color, accept_button_text_color, reject_button_bg_color, reject_button_text_color, save_preferences_button_bg_color, save_preferences_button_text_color)
VALUES
  ('0f2cedc3-4af4-4a43-a4c6-3682faa95eab', true, 'bottom', 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking ''Accept All'', you consent to our use of cookies.', '/public/hamid2/cms-page/privacy-policy', 'Accept Alldddqqweqwe', 'Reject All', 'Cookie Settings', true, false, false, false, 'light', '#007bff', '#ffffff', '#333333', false, false, true, 365, true, 'Privacy Policy', '[{"id":"necessary","name":"Necessary Cookies","description":"These cookies are necessary for the website to function and cannot be switched off.","required":true,"default_enabled":true},{"id":"analytics","name":"Analytics Cookies","description":"These cookies help us understand how visitors interact with our website.","required":false,"default_enabled":false},{"id":"marketing","name":"Marketing Cookies","description":"These cookies are used to deliver personalized advertisements.","required":false,"default_enabled":false}]'::jsonb, '["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"]'::jsonb, NULL, NULL, '.cookie-hamid {}', '157d4590-49bf-4b0b-bd77-abe131909528', '2025-10-17T18:19:57.435Z', '2025-10-26T01:33:47.627Z', '{"en":{"banner_text":"We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking ''Accept All'', you consent to our use of cookies.","analytics_name":"Analytics Cookies","marketing_name":"Marketing Cookies","necessary_name":"Necessary Cookies","functional_name":"Functional Cookies","accept_button_text":"Accept Alldddqqweqwe","reject_button_text":"Reject All","privacy_policy_text":"Privacy Policy","settings_button_text":"Cookie Settings","analytics_description":"These cookies help us understand how visitors interact with our website.","marketing_description":"These cookies are used to deliver personalized advertisements.","necessary_description":"These cookies are necessary for the website to function and cannot be switched off.","functional_description":"These cookies enable enhanced functionality and personalization."},"nl":{"banner_text":"hamid-test-nl","necessary_name":"Noodzakelijk","accept_button_text":"","reject_button_text":"","privacy_policy_text":"","settings_button_text":""}}'::jsonb, '#800000', '#ffffff', '#ffffff', '#374151', '#ffff00', '#ffffff')
ON CONFLICT DO NOTHING;


-- cookie_consent_settings_translations (2 rows)
INSERT INTO cookie_consent_settings_translations (id, cookie_consent_settings_id, language_code, banner_text, accept_button_text, reject_button_text, settings_button_text, privacy_policy_text, created_at, updated_at, necessary_name, necessary_description, analytics_name, analytics_description, marketing_name, marketing_description, functional_name, functional_description, save_preferences_button_text)
VALUES
  ('e98e83e6-0c62-41b1-a207-6b9d556384d7', '0f2cedc3-4af4-4a43-a4c6-3682faa95eab', 'en', 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking ''Accept All'', you consent to our use of cookies.', 'Accept Alldddqqweqwe', 'Reject All', 'Cookie Settings', 'Privacy Policy', '2025-10-25T08:03:59.977Z', '2025-11-03T07:59:13.710Z', 'Necessary Cookies', 'These cookies are necessary for the website to function and cannot be switched off.', 'Analytics Cookies', 'These cookies help us understand how visitors interact with our website.', 'Marketing Cookies', 'These cookies are used to deliver personalized advertisements.', 'Functional Cookies', 'These cookies enable enhanced functionality and personalization.', 'Save now'),
  ('809d2653-c64e-4bab-a14f-808884b01809', '0f2cedc3-4af4-4a43-a4c6-3682faa95eab', 'nl', 'We gebruiken cookies om uw surfervaring te verbeteren, gepersonaliseerde inhoud te leveren en ons verkeer te analyseren. Door op ''Alles accepteren'' te klikken, stemt u in met ons gebruik van cookies.', 'Accepteer Alldddqqweqwe', 'weigeren', 'cookie', 'privary', '2025-10-25T08:04:00.024Z', '2025-11-03T07:59:13.710Z', 'Noodzakelijk', 'Noodzakelijke cookie', 'Analytische cookies', 'Deze cookies helpen ons te begrijpen hoe bezoekers met onze website omgaan.', 'Marketing cookies', 'Deze cookies worden gebruikt om gepersonaliseerde advertenties te leveren.', 'Functionele cookies', 'Deze cookies maken verbeterde functionaliteit en personalisatie mogelijk.', 'Opslaan')
ON CONFLICT DO NOTHING;


-- email_templates (72 rows)
INSERT INTO email_templates (id, store_id, identifier, content_type, variables, is_active, sort_order, attachment_enabled, attachment_config, created_at, updated_at, is_system, default_subject, default_template_content, default_html_content)
VALUES
  ('3bc325c1-b951-44c5-a73e-36308d8fbb6b', '157d4590-49bf-4b0b-bd77-abe131909528', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T20:05:55.501Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('8b9db3bd-8b38-4262-ac69-6dfc0d937a02', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('b4992ce4-c1f5-49f8-b650-c3ea3088aa88', '03845def-33f1-411c-aa07-94bcbc035e17', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('3f59fab7-b9f0-4447-8e4c-a0ca4992bec2', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('a90d6ed4-054e-42f2-b844-7f9c68b89215', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('3fad442e-47d4-409a-bc8f-3bf33ec759d2', 'd1136967-f856-4199-bd97-557cc9603ce4', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('caa52211-ddca-40d1-ac14-4b3d84ba256b', 'd1136967-f856-4199-bd97-557cc9603ce4', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('edf2c810-220c-40df-995d-645afe9e7939', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('144e5789-f8b3-4da4-8dc9-d3523cd96452', '157d4590-49bf-4b0b-bd77-abe131909528', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('60329b76-66de-45a8-993f-9eb61f284267', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('939b6afd-1cfb-4d05-81c8-bed2d2ceed29', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('463030c5-601d-4898-b156-95bd5a50acb4', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('026cc91d-7166-4530-beac-88c78ff67608', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'credit_purchase_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{credits_purchased}}"},{"key":"{{amount_usd}}"},{"key":"{{balance}}"},{"key":"{{store_name}}"},{"key":"{{current_year}}"}]'::jsonb, true, 2, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-10-31T21:21:14.762Z', false, NULL, NULL, NULL),
  ('ab215fd4-b763-4c02-963e-e44152553fd4', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('e63a1ea1-2d90-4aa3-871f-b82ec54e7098', '03845def-33f1-411c-aa07-94bcbc035e17', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('2d536e90-7c67-4127-9e22-940f2c287f2e', '03845def-33f1-411c-aa07-94bcbc035e17', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('2b744de0-92c3-41a9-aceb-57fb752a76c5', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('c69316ab-7e8c-4590-850b-0f720c505d02', 'd1136967-f856-4199-bd97-557cc9603ce4', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('50952444-182e-46f8-9173-8e7584241113', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('fdb78e53-e58a-499b-8890-624855216efb', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('f32b8171-8549-43e3-b2f9-daddbb9cb5df', '157d4590-49bf-4b0b-bd77-abe131909528', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('bd481a76-c412-4142-88d2-396c1a6dd8aa', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('18a04ac9-0246-4678-b132-82ef962fc26b', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('4029bf23-c768-4910-8457-c97ad7c1d8dd', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('45897545-5afa-4e8b-8bd2-cd4c940caa00', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('bb80a364-cea4-4ee1-b3a4-948b3382973b', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('57435069-2dda-482a-9958-caae1845fcd3', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('c69f6954-c039-4447-9fad-db65f6677df9', '03845def-33f1-411c-aa07-94bcbc035e17', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('412f96bc-89fa-459d-83c4-71921a0fabde', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('d6696302-9e73-4b27-a4bf-b2832803b3e3', 'd1136967-f856-4199-bd97-557cc9603ce4', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('8f11628b-cab3-410c-a8e1-16a4d1f0345b', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('e8749496-3ce5-40e9-b92b-51ee502ac4a9', '157d4590-49bf-4b0b-bd77-abe131909528', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('9f22fc59-1d4b-4fe3-baf5-2a2674b43d4c', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'signup_email', 'both', '[{"key":"{{customer_name}}"},{"key":"{{customer_first_name}}"},{"key":"{{store_name}}"},{"key":"{{store_url}}"},{"key":"{{login_url}}"},{"key":"{{current_year}}"}]'::jsonb, true, 1, false, '{}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('75f1cf5c-968d-415c-9e76-e4bff146e21d', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'email_verification', 'html', '["customer_name","customer_first_name","verification_code","store_name","store_url","current_year"]'::jsonb, true, 2, false, '{}'::jsonb, '2025-11-03T23:14:30.679Z', '2025-11-05T19:00:58.234Z', true, 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>'),
  ('f8fb433e-4ed5-447e-aa33-1ec12aa72c42', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('a58ab22a-7fdd-48a4-ab59-f7ff8b35493c', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('a5aa062c-0aa0-4b07-94ee-ef69b9918fb6', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('eb462c67-fd68-4356-afc0-dff2bc14e1ed', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'order_success_email', 'both', '["customer_name","customer_first_name","order_number","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","shipping_address","billing_address","store_name","store_url","current_year"]'::jsonb, true, 3, true, '{"generateInvoicePdf":true}'::jsonb, '2025-10-31T21:21:14.762Z', '2025-11-05T19:00:58.234Z', true, 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>'),
  ('67be93d0-512b-4f58-b55e-4d627dfc1035', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('365b5e11-7181-45e1-9426-3de098a6182d', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('cb434957-62bc-4909-b277-aba53cc97102', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('1483f2d4-afb4-49bb-aac8-3ee5e8411b03', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('2a015b7d-9b00-4f3e-b822-d971ac559496', '03845def-33f1-411c-aa07-94bcbc035e17', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('67d6e178-7d1f-4efe-a2f5-fce02235319a', '03845def-33f1-411c-aa07-94bcbc035e17', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('1fa1eede-b581-49f3-bd71-76f3ec71366b', '03845def-33f1-411c-aa07-94bcbc035e17', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('5babee25-adae-4469-80c6-47d2f58d0474', '03845def-33f1-411c-aa07-94bcbc035e17', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('b01e0e08-b50b-4521-8011-5fa67ccd2653', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('66fc99b7-d4c0-4dad-b9f7-319b946e4209', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('d3176294-44e3-4893-993d-9b5c60202aaa', 'd1136967-f856-4199-bd97-557cc9603ce4', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('155851a2-e285-4ae8-a4eb-04b6aa024fad', 'd1136967-f856-4199-bd97-557cc9603ce4', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('07958749-5770-4838-87e1-b860ee355fb7', 'd1136967-f856-4199-bd97-557cc9603ce4', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('f67ae526-c1ab-45ab-bbd5-5b7b353644d9', 'd1136967-f856-4199-bd97-557cc9603ce4', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('ee0057c0-ae18-4d5d-a131-a30ffca3eb18', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('46ea1453-55fb-4d4c-82a9-d727fb8d608d', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('6ae08f15-c9c3-4018-9fe6-26f7bb57a0f6', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('0f459fd2-d910-4497-8b1b-c66d4d33ef7b', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('0213a82a-7f63-48f0-b403-138a52ad0395', '157d4590-49bf-4b0b-bd77-abe131909528', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('3259ca97-9eb7-4c25-884b-13da93ba8f87', '157d4590-49bf-4b0b-bd77-abe131909528', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('1e67d9e6-5896-4291-b81d-0fa2ed51aad3', '157d4590-49bf-4b0b-bd77-abe131909528', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('61d781e6-ecb1-446d-8d97-432d432b0528', '157d4590-49bf-4b0b-bd77-abe131909528', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('3d30a971-2586-4c71-9d10-9805a68cbe54', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('97248c1c-9721-4c88-94b1-15afd226f901', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('292062a2-b046-47d8-82b6-a0c9a5b0442e', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('13bc52fc-65e0-4d9a-b3ea-aa50d3b8b38f', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('adb4cf1a-a26a-4ecb-bd49-f921162f0bfc', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('d1053732-f182-4581-9938-fdefee5bf75a', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('a98db81c-0684-4f98-8feb-a38440e74312', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('2dfca75f-057a-410d-9db7-9bd912b3562d', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>'),
  ('c38355b1-33b8-4018-85d4-6acf99c61e7d', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'invoice_email', 'html', '["invoice_number","invoice_date","order_number","customer_name","customer_first_name","customer_email","order_date","order_total","order_subtotal","order_tax","order_shipping","items_html","items_count","billing_address","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 10, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('dedd1e4f-1336-427c-9742-54d60b93fed5', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'shipment_email', 'html', '["order_number","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","customer_name","customer_first_name","customer_email","items_html","items_count","shipping_address","store_name","store_url","current_year","email_header","email_footer"]'::jsonb, true, 11, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}'),
  ('64516648-e867-490a-8fec-31ef0312db39', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'email_header', 'html', '["store_name","store_logo_url"]'::jsonb, true, 100, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>'),
  ('10c45dde-f15a-4bcd-ac1f-8e032f84f4d0', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'email_footer', 'html', '["store_name","store_url","contact_email","store_address","store_city","store_state","store_postal_code","current_year","unsubscribe_url"]'::jsonb, true, 101, false, '{}'::jsonb, '2025-11-05T17:45:19.314Z', '2025-11-05T19:01:56.141Z', true, 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>')
ON CONFLICT DO NOTHING;


-- email_template_translations (80 rows)
INSERT INTO email_template_translations (id, email_template_id, language_code, subject, template_content, html_content, created_at, updated_at)
VALUES
  ('6d1ebeb5-c836-4a89-8fe8-a08e4e0e4004', '3bc325c1-b951-44c5-a73e-36308d8fbb6b', 'nl', 'Bestelbevestiging #{{order_number}}', 'Hallo {{customer_first_name}},

Bedankt voor uw bestelling!

Bestelgegevens:
- Bestelnummer: {{order_number}}
- Besteldatum: {{order_date}}
- Totaalbedrag: {{order_total}}
- Status: {{order_status}}

Artikelen: {{items_count}} artikelen
Verzendadres: {{shipping_address}}

Volg uw bestelling: {{order_details_url}}

Met vriendelijke groet,
Het {{store_name}}-team', '{{email_header}}
<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Bedankt voor uw
  bestelling!</h2>
      <p>Hallo {{customer_first_name}},</p>
      <p>Uw bestelling is bevestigd en wordt
  verwerkt.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Bestelnummer:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Besteldatum:</strong> {{order_date}}</p>
      </div>
      <h3>Bestelde artikelen:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Besteloverzicht</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotaal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Verzending</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Belasting</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Totaal</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Met vriendelijke groet,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>
{{email_footer}}', '2025-11-06T06:02:55.346Z', '2025-11-06T06:02:55.346Z'),
  ('327f8eaf-dd4c-4843-b256-da377b863992', '144e5789-f8b3-4da4-8dc9-d3523cd96452', 'nl', 'Bevestiging van kredietaankoop - {{credits_purchased}} Kredieten', 'Hallo {{customer_first_name}},

Bedankt voor uw aankoop van credits!

Aankoopgegevens:
- Gekochte credits: {{credits_purchased}}
- Betaald bedrag: {{amount_usd}}
- Huidig saldo: {{balance}} credits

Uw credits zijn klaar voor gebruik!

Met vriendelijke groet,
Het team van {{store_name}}', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Aankoop bevestigd!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hallo <strong>{{customer_first_name}}</strong>,</p>
    <p>Uw creditaankoop is met succes verwerkt!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Aangekochte credits:</strong> {{credits_purchased}}</p>
      <p><strong>Betaald bedrag:</strong> {{amount_usd}}</p>
      <p><strong>Huidig saldo:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-11-06T06:03:00.622Z', '2025-11-06T06:03:00.622Z'),
  ('502ec31b-c58e-43f7-98e3-2dc37f18e5ea', 'e8749496-3ce5-40e9-b92b-51ee502ac4a9', 'nl', 'Controleer je e-mail - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verifieer je e-mailadres</h2>
              <p>Hallo {{customer_first_name}},</p>
              <p>Bedankt voor je registratie bij {{store_name}}! Gebruik de volgende verificatiecode om je registratie te voltooien:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>Deze code verloopt over <strong>15 minuten</strong>.</p>
              <p style="color: #666; font-size: 14px;">Als je geen account hebt aangemaakt bij {{store_name}}, negeer dan deze e-mail.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Met vriendelijke groet,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-06T06:03:10.161Z', '2025-11-06T06:03:10.161Z'),
  ('893d25f9-6383-4979-9377-e59a024ab626', '0213a82a-7f63-48f0-b403-138a52ad0395', 'nl', 'Factuur #{{invoice_number}} van {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Factuur #{{invoice_number}}</h2>
              <p>Hallo {{customer_first_name}},</p>
              <p>Bedankt voor uw bestelling! Hier vindt u de details van uw factuur.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Factuurnummer:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Factuurdatum:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Ordernummer:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Bestelde artikelen:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Factuuroverzicht</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotaal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Verzending</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Belasting</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Totaal</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Factuuradres:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-', '2025-11-06T06:03:19.204Z', '2025-11-06T06:03:19.204Z'),
  ('82a877e9-7470-46a6-acdd-7b583aeaef1d', '3259ca97-9eb7-4c25-884b-13da93ba8f87', 'nl', 'Uw bestelling #{{order_number}} is verzonden!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Uw bestelling is verzonden!</h2>
              <p>Hallo {{customer_first_name}},</p>
              <p>Goed nieuws! Uw bestelling is verzonden en onderweg naar u.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Bestelnummer:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Trackingnummer:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Verzendmethode:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Verwachte levering:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Volg uw pakket
                </a>
              </div>

              <h3 style="margin-top: 30px;">Verzonden artikelen:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Verzendadres:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Leveringsinstructies:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-06T06:03:26.133Z', '2025-11-06T06:03:26.133Z'),
  ('658b1ae1-cf5d-4a38-9b9c-29aa9a47a29a', '1e67d9e6-5896-4291-b81d-0fa2ed51aad3', 'nl', 'E-mail header sjabloon', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-06T06:03:29.163Z', '2025-11-06T06:03:29.163Z'),
  ('26d15633-b002-4415-9a6a-486f40f6fa79', '61d781e6-ecb1-446d-8d97-432d432b0528', 'nl', 'E-mail voettekst sjabloon', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Vragen? Neem contact met ons op via <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Bezoek de winkel</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Afmelden</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. Alle rechten voorbehouden.
                </p>
              </div>
            </div>', '2025-11-06T06:03:34.047Z', '2025-11-06T06:03:34.047Z'),
  ('fdac4587-abf7-49d1-9e9d-ff8750bb6aa6', '3bc325c1-b951-44c5-a73e-36308d8fbb6b', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '{{email_header}}
<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>
{{email_footer}}', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('5d090a84-d8cf-445b-ae40-edc1a7ca926b', '8b9db3bd-8b38-4262-ac69-6dfc0d937a02', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('0945d39a-ec19-4bef-af51-d5a5edec1dc6', 'b4992ce4-c1f5-49f8-b650-c3ea3088aa88', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('623af648-ff08-49a6-937d-56756d0306ab', '3f59fab7-b9f0-4447-8e4c-a0ca4992bec2', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('3a2418cb-7199-416f-be59-70b9ab0abe92', 'a90d6ed4-054e-42f2-b844-7f9c68b89215', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('e65150bb-3983-4d24-8d9a-66dedb52fd5f', '3fad442e-47d4-409a-bc8f-3bf33ec759d2', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('084a7e7d-9978-4214-9998-3859897e8fba', 'caa52211-ddca-40d1-ac14-4b3d84ba256b', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('eb07bfbd-289d-4ab6-982b-4715d3b85884', 'edf2c810-220c-40df-995d-645afe9e7939', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('abbf15a9-4faa-4c41-8c8b-2758b5986639', '144e5789-f8b3-4da4-8dc9-d3523cd96452', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('9d45225b-fa08-46d5-8ee9-8699afcc8775', '60329b76-66de-45a8-993f-9eb61f284267', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('6fc0894c-8075-43e2-97c1-5cb0983dec70', '939b6afd-1cfb-4d05-81c8-bed2d2ceed29', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('92601045-fce6-4039-a609-74d73edb3004', '463030c5-601d-4898-b156-95bd5a50acb4', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('53f0aa66-40d7-4c1f-a7b7-7bd4772f262e', '026cc91d-7166-4530-beac-88c78ff67608', 'en', 'Credit Purchase Confirmation - {{credits_purchased}} Credits', 'Hi {{customer_first_name}},

Thank you for your credit purchase!

Purchase Details:
- Credits Purchased: {{credits_purchased}}
- Amount Paid: {{amount_usd}}
- Current Balance: {{balance}} credits

Your credits are ready to use!

Best regards,
The {{store_name}} Team', '<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Purchase Confirmed!</h1>
    <p style="color: white; font-size: 18px;">+{{credits_purchased}} Credits</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px;">
    <p>Hi <strong>{{customer_first_name}}</strong>,</p>
    <p>Your credit purchase has been processed successfully!</p>
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Credits Purchased:</strong> {{credits_purchased}}</p>
      <p><strong>Amount Paid:</strong> {{amount_usd}}</p>
      <p><strong>Current Balance:</strong> {{balance}} credits</p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center;">© {{current_year}} {{store_name}}</p>
  </div>
</body>
</html>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('ec79261c-2efa-4272-bccd-bafd70867964', 'ab215fd4-b763-4c02-963e-e44152553fd4', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('2fe2a070-5e13-4110-9550-93faebd469da', 'e63a1ea1-2d90-4aa3-871f-b82ec54e7098', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('dfbf7a19-6263-4e91-ae05-7a4cc7c890ac', '2d536e90-7c67-4127-9e22-940f2c287f2e', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('d9b077ed-ebb2-4632-ad50-64d2c630f96e', '2b744de0-92c3-41a9-aceb-57fb752a76c5', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('3d5a4893-8cff-4dff-bf24-edd0df96544f', 'c69316ab-7e8c-4590-850b-0f720c505d02', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('6a218438-4eb4-4521-98b2-35dae29a7df9', '50952444-182e-46f8-9173-8e7584241113', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('877eee12-b433-48ac-b228-f045c2bf96cc', 'fdb78e53-e58a-499b-8890-624855216efb', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('617667e1-edf0-41ea-bda5-23667771023c', 'bd481a76-c412-4142-88d2-396c1a6dd8aa', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('593ad839-431f-4445-86ef-7a8625ef1974', '18a04ac9-0246-4678-b132-82ef962fc26b', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('6841835b-85ac-443e-b72a-3de2896f0269', '4029bf23-c768-4910-8457-c97ad7c1d8dd', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('0a714455-3cc0-4045-99fd-270ebad90e51', '45897545-5afa-4e8b-8bd2-cd4c940caa00', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('0d5be140-9def-4fd9-a77a-c03a01a1fc7a', 'bb80a364-cea4-4ee1-b3a4-948b3382973b', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('5f1503a7-f510-4e68-a4af-01967a2ac941', '75f1cf5c-968d-415c-9e76-e4bff146e21d', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('178533c7-6bb1-4c7a-8a25-06284bf30d46', '57435069-2dda-482a-9958-caae1845fcd3', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('b70206e1-1d28-43bd-8d68-5f2e9f8bced1', 'c69f6954-c039-4447-9fad-db65f6677df9', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('4afa8191-740e-404a-9d18-ad4961a5e836', '412f96bc-89fa-459d-83c4-71921a0fabde', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('55274949-a3d4-49f1-af40-df6f266e4602', 'd6696302-9e73-4b27-a4bf-b2832803b3e3', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('26046c49-a890-4026-bb29-b7ceddba3335', '8f11628b-cab3-410c-a8e1-16a4d1f0345b', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('140b39f7-c03f-42b7-bcc0-d529ff12f733', 'e8749496-3ce5-40e9-b92b-51ee502ac4a9', 'en', 'Verify your email - {{store_name}}', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Verify Your Email</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for registering at {{store_name}}! Please use the following verification code to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                <h1 style="font-size: 36px; letter-spacing: 8px; color: #4F46E5; font-family: monospace; margin: 0;">
                  {{verification_code}}
                </h1>
              </div>
              <p>This code will expire in <strong>15 minutes</strong>.</p>
              <p style="color: #666; font-size: 14px;">If you didn''t create an account at {{store_name}}, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-03T23:14:30.679Z', '2025-11-06T06:11:10.628Z'),
  ('afaf2ffe-4354-4397-84b3-3d8adaffe67e', '9f22fc59-1d4b-4fe3-baf5-2a2674b43d4c', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('7dd6e819-6adc-41dc-93ba-f01187bf6651', 'f8fb433e-4ed5-447e-aa33-1ec12aa72c42', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('a0a60ded-5b85-4ecf-bd96-71dc5474ae04', 'a58ab22a-7fdd-48a4-ab59-f7ff8b35493c', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('8a222880-7564-4cc8-9526-a06da5c68d7a', 'a5aa062c-0aa0-4b07-94ee-ef69b9918fb6', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('81413f60-ea27-4977-a99c-7c83c285b2bf', 'eb462c67-fd68-4356-afc0-dff2bc14e1ed', 'en', 'Order Confirmation #{{order_number}}', 'Hi {{customer_first_name}},

Thank you for your order!

Order Details:
- Order Number: {{order_number}}
- Order Date: {{order_date}}
- Total Amount: {{order_total}}
- Status: {{order_status}}

Items: {{items_count}} items
Shipping Address: {{shipping_address}}

Track your order: {{order_details_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial,
  sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Your
  Order!</h2>
      <p>Hi {{customer_first_name}},</p>
      <p>Your order has been confirmed and is being
  processed.</p>
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order
  Number:</strong> {{order_number}}</p>
        <p style="margin: 5px 0;"><strong>Order
  Date:</strong> {{order_date}}</p>
      </div>
      <h3>Order Items:</h3>
      {{items_html}}
      <div style="background-color: #f9fafb; padding:
  20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <table style="width: 100%; border-collapse:
  collapse;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Subtotal</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_subtotal}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Shipping</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align:
  right;">{{order_shipping}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb;">Tax</td>
            <td style="padding: 8px 0; border-bottom: 1px     
  solid #e5e7eb; text-align: right;">{{order_tax}}</td>       
          </tr>
          <tr>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold;">Total</td>
            <td style="padding: 12px 0 0 0; font-size:        
  18px; font-weight: bold; text-align:
  right;">{{order_total}}</td>
          </tr>
        </table>
      </div>
      <hr style="margin: 30px 0; border: none; border-top:    
   1px solid #e5e7eb;">
      <p style="color: #999; font-size: 12px;">
        Best regards,<br>
        {{store_name}} Team<br>
        <a href="{{store_url}}">{{store_url}}</a>
      </p>
    </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T06:11:10.628Z'),
  ('ba6dbb5e-4bde-45ca-8386-d4940e8faaf5', '67be93d0-512b-4f58-b55e-4d627dfc1035', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('20229878-978d-4d65-84c7-5f4fa1b8357c', '365b5e11-7181-45e1-9426-3de098a6182d', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('00a2b31c-0f9e-4f6f-a0e1-211077b54eae', 'cb434957-62bc-4909-b277-aba53cc97102', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('de637ddd-bcf9-4323-90fb-14b695d5cc81', '1483f2d4-afb4-49bb-aac8-3ee5e8411b03', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('944908d5-45fd-4a53-a2dd-882ee35e0669', '2a015b7d-9b00-4f3e-b822-d971ac559496', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('6294508a-6296-4c85-a604-20afa7df513f', '67d6e178-7d1f-4efe-a2f5-fce02235319a', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('de022dc7-16b6-4e11-a5ea-f5474c387a8e', '1fa1eede-b581-49f3-bd71-76f3ec71366b', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('78fcaa9d-d40b-4815-93d9-1ecca679c79e', '5babee25-adae-4469-80c6-47d2f58d0474', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('b8ba52b9-b0a9-42c5-bc17-502b0273b6f7', 'b01e0e08-b50b-4521-8011-5fa67ccd2653', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('0f0700a5-ee85-4bce-9579-5886447edca1', '66fc99b7-d4c0-4dad-b9f7-319b946e4209', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('610334e2-74dc-47af-8e48-6176fb1ba44d', 'd3176294-44e3-4893-993d-9b5c60202aaa', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('c65a8990-cdf4-48a8-bbfd-8ca0459c8001', '155851a2-e285-4ae8-a4eb-04b6aa024fad', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('7581b6c7-2e11-4f39-be33-85d4f7783755', '07958749-5770-4838-87e1-b860ee355fb7', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('5d4089a4-ed13-4482-a52f-a50500e77b88', 'f67ae526-c1ab-45ab-bbd5-5b7b353644d9', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('f099982e-5133-479f-a78e-645e5cd71260', 'ee0057c0-ae18-4d5d-a131-a30ffca3eb18', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('344c662a-3dfe-4b46-b4e4-9c27d6497168', '46ea1453-55fb-4d4c-82a9-d727fb8d608d', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('da86581d-73df-42a8-a594-962d13bbdfc6', '6ae08f15-c9c3-4018-9fe6-26f7bb57a0f6', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('c0445ae7-4d39-46dc-a9f6-0613b5408d02', '0f459fd2-d910-4497-8b1b-c66d4d33ef7b', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('0986519d-ddb8-4059-8c59-66980feb455c', '0213a82a-7f63-48f0-b403-138a52ad0395', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('90a0a5c8-cb4e-440d-9230-f930173be5a0', '3259ca97-9eb7-4c25-884b-13da93ba8f87', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('053bbe0e-8ed9-4b23-9f80-ec6b470793b3', '1e67d9e6-5896-4291-b81d-0fa2ed51aad3', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('de1617f4-9d9d-428f-92ba-ffc64df6c218', '61d781e6-ecb1-446d-8d97-432d432b0528', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('e353fea9-6810-4699-8d0d-259e926e7980', '3d30a971-2586-4c71-9d10-9805a68cbe54', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('927f3ca7-cb03-4080-a267-72753e0783c8', '97248c1c-9721-4c88-94b1-15afd226f901', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('b8a0a63f-fb20-4660-bcc1-ee80ce038405', '292062a2-b046-47d8-82b6-a0c9a5b0442e', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('ef3e8ee9-737b-4a98-85f7-a0d41212e87c', '13bc52fc-65e0-4d9a-b3ea-aa50d3b8b38f', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('4f472899-aca0-4608-b421-3d9584531918', 'adb4cf1a-a26a-4ecb-bd49-f921162f0bfc', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('209c04ef-62a2-4dd4-b6f2-7b6036a84c35', 'd1053732-f182-4581-9938-fdefee5bf75a', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('0c320815-c8c9-4a5f-ac1b-608748f9b2e4', 'a98db81c-0684-4f98-8feb-a38440e74312', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('8499dd3f-ebab-4c8d-8e6f-a97481db37b6', '2dfca75f-057a-410d-9db7-9bd912b3562d', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('abdc1bab-5915-4c07-ac69-c758e70bc05c', 'c38355b1-33b8-4018-85d4-6acf99c61e7d', 'en', 'Invoice #{{invoice_number}} from {{store_name}}', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Invoice #{{invoice_number}}</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for your order! Please find your invoice details below.</p>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Invoice Date:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{invoice_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                </table>
              </div>

              <h3 style="margin-top: 30px;">Order Items:</h3>
              {{items_html}}

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Invoice Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Subtotal</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_subtotal}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Shipping</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_shipping}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Tax</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">{{order_tax}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; text-align: right;">{{order_total}}</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Billing Address:</strong><br>
                  {{billing_address}}
                </p>
              </div>

              <div style="margin-top: 15px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('86215162-3a22-45af-a89a-d89e8973c6d7', 'dedd1e4f-1336-427c-9742-54d60b93fed5', 'en', 'Your order #{{order_number}} has been shipped!', NULL, '{{email_header}}
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333; margin-bottom: 10px;">Your Order Has Been Shipped!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>

              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0;"><strong>Order Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{order_number}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Tracking Number:</strong></td>
                    <td style="padding: 5px 0; text-align: right;"><strong>{{tracking_number}}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Shipping Method:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{shipping_method}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0;"><strong>Estimated Delivery:</strong></td>
                    <td style="padding: 5px 0; text-align: right;">{{estimated_delivery_date}}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{tracking_url}}" style="background-color: #10b981; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Track Your Package
                </a>
              </div>

              <h3 style="margin-top: 30px;">Shipped Items:</h3>
              {{items_html}}

              <div style="margin-top: 30px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  <strong>Shipping Address:</strong><br>
                  {{shipping_address}}
                </p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>📦 Delivery Instructions:</strong><br>
                  {{delivery_instructions}}
                </p>
              </div>
            </div>
            {{email_footer}}', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('b0b0f1bb-b328-4135-af05-fe2245a803ff', '64516648-e867-490a-8fec-31ef0312db39', 'en', 'Email Header Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <div style="background-color: white; width: 120px; height: 120px; margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 10px;">
                  <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 100px; max-height: 100px; object-fit: contain;">
                </div>
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">{{store_name}}</h1>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('f9009fce-0e6f-475e-ac85-b10470b0ba57', '10c45dde-f15a-4bcd-ac1f-8e032f84f4d0', 'en', 'Email Footer Template', NULL, '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                  Questions? Contact us at <a href="mailto:{{contact_email}}" style="color: #4f46e5; text-decoration: none;">{{contact_email}}</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0;">
                  {{store_address}}<br>
                  {{store_city}}, {{store_state}} {{store_postal_code}}
                </p>
                <div style="margin: 20px 0;">
                  <a href="{{store_url}}" style="color: #4f46e5; text-decoration: none; margin: 0 10px; font-size: 14px;">Visit Store</a>
                  <span style="color: #e5e7eb;">|</span>
                  <a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
                </div>
                <p style="color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                  © {{current_year}} {{store_name}}. All rights reserved.
                </p>
              </div>
            </div>', '2025-11-05T17:45:19.314Z', '2025-11-06T06:11:10.628Z'),
  ('825a6e64-e82a-4b00-8782-3e9a5d22e6a7', 'f32b8171-8549-43e3-b2f9-daddbb9cb5df', 'nl', 'Welkom bij {{store_name}}!', 'Hallo {{customer_first_name}},

Welkom bij {{store_name}}! We zijn blij dat je bij ons bent.

Je account is succesvol aangemaakt. Je kunt nu onze producten bekijken en je bestellingen volgen.

Log in op je account: {{login_url}}

Met vriendelijke groet,
Het team van {{store_name}}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welkom bij {{store_name}}!</h2>
              <p>Hallo {{customer_first_name}},</p>
              <p>Bedankt dat je een account bij ons hebt aangemaakt! We zijn blij dat je erbij bent.</p>
              <p>Je kunt nu:</p>
              <ul>
                <li>Je bestellingen volgen</li>
                <li>Adressen opslaan voor een snellere checkout</li>
                <li>Je bestelgeschiedenis bekijken</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Ga naar Mijn Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Met vriendelijke groet,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-11-06T06:03:05.941Z', '2025-11-06T11:48:31.864Z'),
  ('fd054b59-79aa-4b8d-a6c9-5d014606d132', 'f32b8171-8549-43e3-b2f9-daddbb9cb5df', 'en', 'Welcome to {{store_name}}!', 'Hi {{customer_first_name}},

Welcome to {{store_name}}! We''re thrilled to have you with us.

Your account has been successfully created. You can now browse our products and track your orders.

Login to your account: {{login_url}}

Best regards,
The {{store_name}} Team', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to {{store_name}}!</h2>
              <p>Hi {{customer_first_name}},</p>
              <p>Thank you for creating an account with us! We''re excited to have you on board.</p>
              <p>You can now:</p>
              <ul>
                <li>Track your orders</li>
                <li>Save addresses for faster checkout</li>
                <li>View your order history</li>
              </ul>
              <p style="margin-top: 30px;">
                <a href="{{login_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to My Account
                </a>
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                {{store_name}} Team<br>
                <a href="{{store_url}}">{{store_url}}</a>
              </p>
            </div>', '2025-10-31T21:21:14.762Z', '2025-11-06T11:48:31.800Z')
ON CONFLICT DO NOTHING;


-- languages (15 rows)
INSERT INTO languages (id, code, name, native_name, flag, is_rtl, is_active, is_default, translations, created_at, updated_at)
VALUES
  ('3e123615-9e25-45cd-b783-6f180ca7033f', 'en', 'English', 'English', NULL, false, true, false, '{}'::jsonb, '2025-10-13T07:44:03.236Z', '2025-10-13T07:44:03.236Z'),
  ('e108298a-4581-4426-a499-bdba334f3f68', 'es', 'Spanish', 'Español', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.277Z', '2025-10-13T07:44:03.277Z'),
  ('a65c0a66-5588-4094-ad7e-edee09daa190', 'fr', 'French', 'Français', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.312Z', '2025-10-13T07:44:03.312Z'),
  ('79acd1f1-6df2-4f76-a5ae-7e12fc3eae21', 'de', 'German', 'Deutsch', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.346Z', '2025-10-13T07:44:03.346Z'),
  ('1132bd28-6dbb-4445-804e-f50d100069dd', 'it', 'Italian', 'Italiano', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.388Z', '2025-10-13T07:44:03.388Z'),
  ('362f8976-0827-454c-b687-b73c00f08b29', 'pt', 'Portuguese', 'Português', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.422Z', '2025-10-13T07:44:03.422Z'),
  ('04355f7b-f905-4bce-842f-1dcf6bfee7a5', 'nl', 'Dutch', 'Nederlands', NULL, false, true, false, '{}'::jsonb, '2025-10-13T07:44:03.456Z', '2025-10-13T07:44:03.456Z'),
  ('6756a8a6-e559-4166-a1af-eddca94e30a6', 'ar', 'Arabic', 'العربية', NULL, true, false, false, '{}'::jsonb, '2025-10-13T07:44:03.489Z', '2025-10-13T07:44:03.489Z'),
  ('a8421477-cb04-4536-8656-3643eef3508f', 'he', 'Hebrew', 'עברית', NULL, true, false, false, '{}'::jsonb, '2025-10-13T07:44:03.522Z', '2025-10-13T07:44:03.522Z'),
  ('2073e041-2174-4ea3-b57f-b922ceda7b47', 'zh', 'Chinese', '中文', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.559Z', '2025-10-13T07:44:03.559Z'),
  ('ca2daa51-05ee-49c9-90f6-c9f5bb34ded3', 'ja', 'Japanese', '日本語', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.600Z', '2025-10-13T07:44:03.600Z'),
  ('50aba09b-17a4-4976-861b-bad87f166bd8', 'ko', 'Korean', '한국어', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.637Z', '2025-10-13T07:44:03.637Z'),
  ('02af2fc8-cced-4d3d-8351-9d11f95df26a', 'ru', 'Russian', 'Русский', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.671Z', '2025-10-13T07:44:03.671Z'),
  ('e7020578-5969-49cf-b738-2024e9d7f1e9', 'pl', 'Polish', 'Polski', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.709Z', '2025-10-13T07:44:03.709Z'),
  ('141627ed-f0f0-4707-b54c-94f8f54bb421', 'tr', 'Turkish', 'Türkçe', NULL, false, false, false, '{}'::jsonb, '2025-10-13T07:44:03.743Z', '2025-10-13T07:44:03.743Z')
ON CONFLICT DO NOTHING;


-- payment_methods (3 rows)
INSERT INTO payment_methods (id, name, code, type, is_active, sort_order, description, settings, fee_type, fee_amount, min_amount, max_amount, availability, countries, store_id, created_at, updated_at, conditions, payment_flow)
VALUES
  ('ca67027c-e0a1-4cca-a836-0a3583179ee7', 'Cash on Delivery', 'CASH', 'cash_on_delivery', true, 0, '', '{}'::jsonb, 'none', '0.00', NULL, NULL, 'all', '[]'::jsonb, '157d4590-49bf-4b0b-bd77-abe131909528', '2025-07-27T19:36:05.622Z', '2025-07-27T19:36:05.622Z', '{}'::jsonb, 'offline'),
  ('01b3d3ba-1b53-4115-8793-cca1372ef457', 'bank-en', 'bank_en', 'bank_transfer', true, 0, '', '{}'::jsonb, 'fixed', '8.00', NULL, NULL, 'all', '[]'::jsonb, '157d4590-49bf-4b0b-bd77-abe131909528', '2025-07-27T19:36:32.972Z', '2025-10-26T12:32:00.638Z', '{"skus":[],"categories":["edbfff44-11d7-4b41-9232-008b4b3873a7"],"attribute_sets":["8a76e7ad-1b4d-4377-9b82-cac062bb5559"],"attribute_conditions":[]}'::jsonb, 'offline'),
  ('a01439da-bc46-4031-a303-14d60b046298', 'Creditcard', 'creditcard', 'credit_card', true, 0, '', '{}'::jsonb, 'percentage', '2.00', NULL, NULL, 'all', '[]'::jsonb, '157d4590-49bf-4b0b-bd77-abe131909528', '2025-11-04T12:48:42.036Z', '2025-11-04T12:48:55.087Z', '{"skus":[],"categories":[],"attribute_sets":[],"attribute_conditions":[]}'::jsonb, 'online')
ON CONFLICT DO NOTHING;


-- payment_method_translations (3 rows)
INSERT INTO payment_method_translations (payment_method_id, language_code, name, description, created_at, updated_at)
VALUES
  ('ca67027c-e0a1-4cca-a836-0a3583179ee7', 'en', 'Cash on Delivery', '', '2025-10-24T16:42:27.922Z', '2025-10-24T16:42:27.922Z'),
  ('01b3d3ba-1b53-4115-8793-cca1372ef457', 'en', 'bank-en', '', '2025-10-24T16:42:27.972Z', '2025-10-24T16:42:27.972Z'),
  ('01b3d3ba-1b53-4115-8793-cca1372ef457', 'nl', 'bank-nl', '', '2025-10-24T16:42:28.016Z', '2025-10-24T16:42:28.016Z')
ON CONFLICT DO NOTHING;


-- pdf_templates (18 rows)
INSERT INTO pdf_templates (id, store_id, identifier, name, template_type, default_html_template, is_active, is_system, variables, settings, sort_order, created_at, updated_at)
VALUES
  ('4c9f2192-a564-4d9a-9aea-78960c321f4f', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('322c5ba1-87c3-402b-a213-09ab002dd4cb', '66a80282-7f9f-41ef-a1a4-e96330aec679', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('b7a648b5-d085-47cf-97a4-c81545bdb459', '03845def-33f1-411c-aa07-94bcbc035e17', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('95dd1f96-93e9-47d4-a659-410958bf8fed', '03845def-33f1-411c-aa07-94bcbc035e17', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('3ad3eaf1-96a9-455a-94de-6b32515d7a8d', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('e5827c66-9fc8-4953-b4e0-787cf58d4439', '8f300222-75b1-4396-bd53-8bce4685aa6f', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('f22c7a1c-a727-4c92-a0e1-911ab719750e', 'd1136967-f856-4199-bd97-557cc9603ce4', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('0e4dd1d6-5b96-48f6-8f5b-df3ad79a39c6', 'd1136967-f856-4199-bd97-557cc9603ce4', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('9846fc3c-d982-4ed8-8328-5ed8a2a20c02', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('60267e72-01d2-4be3-98a7-0c09eb4aaa09', '81b6dba6-3edd-477d-9432-061551fbfc5b', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('2b363059-ee15-4b06-b211-68c459333841', '157d4590-49bf-4b0b-bd77-abe131909528', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('7c6ffc7d-f0dc-4584-8a56-7eafbe72a882', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('5ed07780-5256-4be1-afbd-29d85caf4577', '03e6aec7-6dd0-4475-a1bc-c7dc2cc7bc98', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('219b5514-0428-409a-83af-ba80dcd34983', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('f819f2f7-0639-4896-8963-e5204cba2939', '970bdec6-9eeb-4fbf-925f-cb0f36cc6094', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('8954e90b-0e02-4b47-aef0-4d98857d205d', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('49857757-814a-493f-b446-a474b423e76a', '8cc01a01-3a78-4f20-beb8-a566a07834e5', 'shipment_pdf', 'Shipment/Packing Slip PDF', 'shipment', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["order_number","ship_date","tracking_number","tracking_url","shipping_method","estimated_delivery_date","delivery_instructions","shipping_address","items_table_rows","items_count","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 2, '2025-11-05T18:05:27.493Z', '2025-11-05T18:05:27.493Z'),
  ('44b94c9e-e9af-4996-8076-e0d7aee76b2e', '157d4590-49bf-4b0b-bd77-abe131909528', 'invoice_pdf', 'Invoice PDF', 'invoice', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', true, true, '["invoice_number","invoice_date","order_number","customer_name","billing_address","shipping_address","items_table_rows","order_subtotal","order_shipping","order_tax","order_discount","order_total","payment_method","payment_status","store_name","store_logo_url","store_address","store_city","store_state","store_postal_code","store_email","store_phone","store_website","current_year"]'::jsonb, '{"margins":{"top":"20px","left":"20px","right":"20px","bottom":"20px"},"page_size":"A4","orientation":"portrait"}'::jsonb, 1, '2025-11-05T18:05:27.493Z', '2025-11-05T19:20:24.726Z')
ON CONFLICT DO NOTHING;


-- pdf_template_translations (20 rows)
INSERT INTO pdf_template_translations (id, pdf_template_id, language_code, html_template, created_at, updated_at)
VALUES
  ('5ef2835d-389f-4cb9-8826-359d5036ea82', '2b363059-ee15-4b06-b211-68c459333841', 'nl', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">VERZENDMELDING</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Bestelling #:</strong> {{order_number}}<br>
        <strong>Verzendatum:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking-informatie</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Verzendmethode:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Verzendadres</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px;', '2025-11-06T05:04:17.817Z', '2025-11-06T05:04:17.817Z'),
  ('13bd2ee6-44c5-44b2-8ae5-866c52512f7f', '0e4dd1d6-5b96-48f6-8f5b-df3ad79a39c6', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('433f7c09-a679-4a91-b84a-9a4f2126e1ee', '8954e90b-0e02-4b47-aef0-4d98857d205d', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
benjamin
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T20:29:01.280Z'),
  ('9f2eca5f-36ff-4dcc-a029-18f9f919e940', '44b94c9e-e9af-4996-8076-e0d7aee76b2e', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
{{email_header}}
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T10:33:15.949Z'),
  ('44f58ffd-c98c-4bc2-9e88-047143d8fc93', '4c9f2192-a564-4d9a-9aea-78960c321f4f', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('8b9290af-fffa-4165-ac0c-f3c4409be8ef', '3ad3eaf1-96a9-455a-94de-6b32515d7a8d', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('abd3a50a-ce9b-4cd8-9fa9-711c93c7d2f9', 'b7a648b5-d085-47cf-97a4-c81545bdb459', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('7c194faa-c948-4d51-8d62-cc45769a498b', '5ed07780-5256-4be1-afbd-29d85caf4577', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('0f2fe19e-31af-4cf8-bbf9-894072f89f68', '322c5ba1-87c3-402b-a213-09ab002dd4cb', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('2922ba21-f52e-4f60-80f5-fec065b8f072', 'f22c7a1c-a727-4c92-a0e1-911ab719750e', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('358d1f51-bb67-4cc2-a613-c5e0fabdd2ae', '9846fc3c-d982-4ed8-8328-5ed8a2a20c02', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('38b90048-6505-4441-a2bc-0ea302f009a6', '95dd1f96-93e9-47d4-a659-410958bf8fed', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('0bffa33a-e3a8-48e5-97c5-66dcbee23cb5', '2b363059-ee15-4b06-b211-68c459333841', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('fc037c6f-d2af-4d58-8dd2-1f93de2dd624', 'f819f2f7-0639-4896-8963-e5204cba2939', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('4c4e75a3-cabc-4070-9cab-2ffa9eb8a53d', '60267e72-01d2-4be3-98a7-0c09eb4aaa09', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('ee62cb96-42fb-476e-80c0-3dc86484bcd1', 'e5827c66-9fc8-4953-b4e0-787cf58d4439', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('48024fc5-bf29-4b53-952f-0cb00de0d144', '49857757-814a-493f-b446-a474b423e76a', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #10b981;
      margin-bottom: 30px;
    }
    .tracking-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
      border: 2px solid #3b82f6;
    }
    .info-section {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Shipment Notice -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #10b981; margin: 0;">SHIPMENT NOTICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Order #:</strong> {{order_number}}<br>
        <strong>Ship Date:</strong> {{ship_date}}
      </p>
    </div>

    <!-- Tracking Info -->
    {{#if tracking_number}}
    <div class="tracking-section">
      <h3 style="color: #3b82f6; margin-top: 0;">Tracking Information</h3>
      <p style="font-size: 24px; font-weight: bold; margin: 15px 0; font-family: monospace; letter-spacing: 2px;">
        {{tracking_number}}
      </p>
      <p style="font-size: 14px; color: #666;">
        <strong>Shipping Method:</strong> {{shipping_method}}
      </p>
    </div>
    {{/if}}

    <!-- Shipping Address -->
    <div class="info-section">
      <h3 style="color: #10b981; margin-top: 0;">Shipping Address</h3>
      <p style="margin: 0; font-size: 16px;">{{shipping_address}}</p>
    </div>

    {{#if delivery_instructions}}
    <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #92400e;">Delivery Instructions</h4>
      <p style="margin: 0;">{{delivery_instructions}}</p>
    </div>
    {{/if}}

    <!-- Package Contents -->
    <h3 style="margin-top: 30px;">Package Contents</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="font-size: 16px; color: #065f46; margin: 0; font-weight: bold;">
        Total Items: {{items_count}}
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('1c88cfef-2254-4bad-9c38-5a594d012ff2', '7c6ffc7d-f0dc-4584-8a56-7eafbe72a882', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('9f01e8b9-7f2c-4f7d-b1ae-80b19f4954cf', '219b5514-0428-409a-83af-ba80dcd34983', 'en', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">INVOICE</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Invoice #:</strong> {{invoice_number}}<br>
        <strong>Date:</strong> {{invoice_date}}<br>
        <strong>Order #:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Bill To:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Ship To:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{items_table_rows}}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-section">
      <table>
        <tr>
          <td style="padding: 5px 0;">Subtotal:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_shipping}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Tax:</td>
          <td style="padding: 5px 0; text-align: right;">${{order_tax}}</td>
        </tr>
        {{#if order_discount}}
        <tr>
          <td style="padding: 5px 0; color: #10b981;">Discount:</td>
          <td style="padding: 5px 0; text-align: right; color: #10b981;">-${{order_discount}}</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #4f46e5;">
          <td style="padding: 10px 0 0 0; font-size: 18px; font-weight: bold;">Total:</td>
          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: bold; color: #4f46e5;">${{order_total}}</td>
        </tr>
      </table>
    </div>

    {{#if payment_method}}
    <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0;">
        <strong>Payment Method:</strong> {{payment_method}}<br>
        <strong>Payment Status:</strong> {{payment_status}}
      </p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;">Thank you for your business!</p>
      <p style="margin: 5px 0;">{{store_name}} | {{store_website}}</p>
      <p style="margin: 5px 0;">© {{current_year}} {{store_name}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>', '2025-11-05T18:05:27.493Z', '2025-11-06T05:11:10.750Z'),
  ('5df26d1d-2106-4d8c-81a3-85190cffa405', '44b94c9e-e9af-4996-8076-e0d7aee76b2e', 'nl', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: ''Helvetica'', ''Arial'', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .info-section {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
{{email_header}}
    <div class="header">
      {{#if store_logo_url}}
      <img src="{{store_logo_url}}" alt="{{store_name}}" style="max-width: 150px; max-height: 80px; margin-bottom: 10px;">
      {{/if}}
      <h1 style="color: #333; font-size: 28px; margin: 10px 0;">{{store_name}}</h1>
      <p style="color: #666; font-size: 14px; margin: 5px 0;">
        {{store_address}}<br>
        {{store_city}}, {{store_state}} {{store_postal_code}}<br>
        {{store_email}} | {{store_phone}}
      </p>
    </div>

    <!-- Invoice Details -->
    <div style="text-align: right; margin-bottom: 30px;">
      <h2 style="color: #4f46e5; margin: 0;">FACTUUR</h2>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        <strong>Factuurnr.:</strong> {{invoice_number}}<br>
        <strong>Datum:</strong> {{invoice_date}}<br>
        <strong>Bestelnr.:</strong> {{order_number}}
      </p>
    </div>

    <!-- Addresses -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #4f46e5; margin-top: 0;">Factuuradres:</h3>
        <p style="margin: 0; font-size: 14px;">{{billing_address}}</p>
      </div>
      <div style="width: 48%;" class="info-section">
        <h3 style="color: #10b981; margin-top: 0;">Verzendadres:</h3>
        <p style="margin: 0; font-size: 14px;">{{shipping_address}}</p>
      </div>
    </div>

    <!-- Items Table -->
    <h3 style="color: #333; margin-bottom: 15px;">Bestelde artikelen</h3>
    <table>
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">', '2025-11-06T10:24:59.119Z', '2025-11-06T10:33:15.978Z')
ON CONFLICT DO NOTHING;


-- shipping_methods (3 rows)
INSERT INTO shipping_methods (id, name, description, is_active, type, flat_rate_cost, free_shipping_min_order, weight_ranges, price_ranges, availability, countries, min_delivery_days, max_delivery_days, store_id, sort_order, created_at, updated_at, translations, conditions)
VALUES
  ('96ead2f0-d957-4c08-8685-4d0e41f4a4d4', 'Freeshipping', NULL, true, 'flat_rate', '0.00', '0.00', '[]'::jsonb, '[]'::jsonb, 'all', '[]'::jsonb, 1, 7, '157d4590-49bf-4b0b-bd77-abe131909528', 0, '2025-07-27T17:37:18.979Z', '2025-10-23T05:01:37.173Z', '{"en":{"name":"Freeshipping","description":""}}'::jsonb, '{}'::jsonb),
  ('710cb3d9-08aa-49ac-910f-38bdd51f5942', 'Aurareach', '', true, 'flat_rate', '0.00', '0.00', '[]'::jsonb, '[]'::jsonb, 'all', '[]'::jsonb, 1, 7, '81b6dba6-3edd-477d-9432-061551fbfc5b', 0, '2025-07-31T22:56:19.220Z', '2025-10-23T05:01:37.173Z', '{"en":{"name":"Aurareach","description":""}}'::jsonb, '{}'::jsonb),
  ('34dfa5d3-f709-4c54-bad8-0bd9a8ae3dc4', 'dhl-nl-new', '', true, 'flat_rate', '7.00', '0.00', '[]'::jsonb, '[]'::jsonb, 'all', '[]'::jsonb, 1, 7, '157d4590-49bf-4b0b-bd77-abe131909528', 0, '2025-07-27T17:36:59.081Z', '2025-10-25T21:31:17.657Z', '{"en":{"name":"DHL-en","description":"dddd"},"nl":{"name":"dhl-nl","description":""}}'::jsonb, '{"skus":[],"categories":["702e7f39-e6f0-43f3-9ed1-f704c2c656fb"],"attribute_sets":[],"attribute_conditions":[]}'::jsonb)
ON CONFLICT DO NOTHING;


-- shipping_method_translations (4 rows)
INSERT INTO shipping_method_translations (shipping_method_id, language_code, name, description, created_at, updated_at)
VALUES
  ('96ead2f0-d957-4c08-8685-4d0e41f4a4d4', 'en', 'Freeshipping', '', '2025-10-24T16:42:27.634Z', '2025-10-24T16:42:27.634Z'),
  ('710cb3d9-08aa-49ac-910f-38bdd51f5942', 'en', 'Aurareach', '', '2025-10-24T16:42:27.676Z', '2025-10-24T16:42:27.676Z'),
  ('34dfa5d3-f709-4c54-bad8-0bd9a8ae3dc4', 'nl', 'dhl-nl-new', '', '2025-10-24T16:42:27.777Z', '2025-10-24T16:42:27.777Z'),
  ('34dfa5d3-f709-4c54-bad8-0bd9a8ae3dc4', 'en', 'dhl-nl-new', '', '2025-10-24T16:42:27.715Z', '2025-10-25T23:31:17.657Z')
ON CONFLICT DO NOTHING;


-- translations (6284 rows)
INSERT INTO translations (id, key, language_code, value, category, created_at, updated_at, type, store_id)
VALUES
  ('a12568dd-1415-4fe7-808e-a300640683c7', 'customer_auth.error.store_not_available', 'en', 'Store information not available. Please refresh the page.', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4a32cd06-679a-4ede-932a-5b77cf79f663', 'customer_auth.success.registration', 'en', 'Registration successful! A welcome email has been sent to your email address.', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('95c37eae-d18d-495d-a841-1fd17a2d2ce7', 'customer_auth.error.registration_failed', 'en', 'Registration failed', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('346d7c42-3b84-471a-b548-d96ffc91cc36', 'customer_auth.title', 'en', 'Customer Authentication', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e70a8d10-d8da-4460-8e4d-c8074b14dd84', 'customer_auth.error.config_not_available', 'en', 'Authentication configuration not available. Please contact support.', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a041881f-b868-4b04-adc5-a7ef33a49415', 'customer_auth.error.store_not_available', 'nl', 'Winkelinformatie niet beschikbaar. Ververs de pagina.', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('21051877-a518-4d3b-9808-2ac17767039f', 'customer_auth.success.registration', 'nl', 'Registratie succesvol! Een welkomstmail is verzonden naar uw e-mailadres.', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a47e1ebd-29f2-4d7c-ba92-a7e814dd2dcf', 'common.already_registered_login', 'nl', 'Al geregistreerd? Log in!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-08T12:38:01.452Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e6f12f22-5759-40f3-ad4c-bf765dec2a53', 'order.delivery_time', 'nl', 'Delivery Time', 'order', '2025-11-07T18:34:17.198Z', '2025-11-08T12:54:01.034Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('77ee8733-a474-4035-b986-4c531a5ef3e0', 'error.blacklist.checkout', 'nl', 'This email address cannot be used for checkout. Please contact support for assistance.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-08T12:54:12.355Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2fca0b25-34a1-410d-b7af-b748f5757773', 'customer_auth.error.registration_failed', 'nl', 'Registratie mislukt', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e9a60bb7-768f-457a-b5f9-bde72b377361', 'customer_auth.title', 'nl', 'Klant Authenticatie', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4b0ed121-b5c2-4349-8df5-51ecacb9cd01', 'checkout.valid_email_required', 'en', 'Valid email required', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9b624c51-fe59-4c8d-a4c3-0029b05a950c', 'checkout.save_address_future', 'en', 'Save address for future use', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('40fecf3a-57c2-4942-bf78-d6284a42272e', 'checkout.add_new_billing_address', 'en', 'Add New Billing Address', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3655533b-cf6f-4812-9801-9b1421d44d6e', 'checkout.save_billing_future', 'en', 'Save billing address for future use', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8aed9601-ad04-49b0-87d7-b492aea310e4', 'common.create_account', 'nl', 'Maak een account', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T23:00:06.803Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a904e6b4-de21-4e8e-bf62-b1a6034dd3e9', 'error.blacklist.country', 'nl', 'Orders from your location cannot be processed at this time. Please contact support for assistance.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-08T12:54:12.428Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('165e1db6-e6e9-4c4c-bd7b-d323e367b8e7', 'common.required', 'en', 'Required', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T19:51:37.265Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('2da458e1-2f84-4bf0-b6d1-7f03dce0e1e3', 'common.back', 'en', 'Back', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T19:51:37.265Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3ec2c9ef-f3db-4c65-b24e-5b3f2e8cb248', 'common.required', 'nl', 'Verplicht', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T19:51:37.265Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7c9fef91-9cff-464e-a436-7f113f5edd33', 'cookie_consent.title.preferences', 'en', 'Cookie Preferences', 'cookie_consent', '2025-11-12T19:51:37.265Z', '2025-11-12T21:04:57.850Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5fd9bd23-7c1e-411c-a938-1910f029573d', 'cookie_consent.title.manage_preferences', 'en', 'Manage Cookie Preferences', 'cookie_consent', '2025-11-12T19:51:37.265Z', '2025-11-12T21:04:57.850Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a4aea2ec-a8ff-4ef6-aa0e-1d4ecea46ca6', 'cookie_consent.title.preferences', 'nl', 'Cookie Voorkeuren', 'cookie_consent', '2025-11-12T19:51:37.265Z', '2025-11-12T21:04:57.850Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9162281b-22ee-4c3a-a810-6a58d9bef910', 'cookie_consent.title.manage_preferences', 'nl', 'Cookie Voorkeuren Beheren', 'cookie_consent', '2025-11-12T19:51:37.265Z', '2025-11-12T21:04:57.850Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('814bd5ec-2845-4915-ba6e-ad42e5baa63a', 'checkout.select_delivery_date', 'en', 'Select delivery date', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6bd148d4-2ede-4176-aab3-503bc9ab19ef', 'checkout.select_time_slot', 'en', 'Select time slot', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('02c0ba86-c3bb-4578-b194-5bb623fc300a', 'checkout.special_delivery_instructions', 'en', 'Special Delivery Instructions', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3ab4ad98-1e50-4e31-925b-3a7e88f566ef', 'common.terms_agreement', 'nl', 'Door in te loggen, gaat u akkoord met onze Servicevoorwaarden en Privacybeleid.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-08T12:39:05.642Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('315945e3-ae1d-4f85-88b2-11b82c0f173a', 'message.required_field', 'nl', 'This field is required', 'message', '2025-11-07T18:34:17.198Z', '2025-11-08T12:54:14.977Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('58caa1f3-c9af-4bb0-be4e-6dfaa08d456f', 'auth.success.account_upgraded', 'en', 'Account upgraded successfully', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cd1b089a-7bd8-40f3-920f-e4d24f3ba5d1', 'auth.success.login', 'en', 'Login successful', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4dbb8ce2-1fc5-4e83-afc1-b2915f3dd28f', 'auth.success.logout', 'en', 'Logged out successfully', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2466761d-039f-4ff0-a734-7a3b876e89f7', 'auth.success.registration', 'en', 'Registration successful! Please check your email for a verification code.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a21b6288-e8eb-4dae-816b-37ec474e58ac', 'auth.success.email_verified', 'en', 'Email verified successfully!', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('51d93783-702a-4a52-9ccd-ed9d57954422', 'auth.success.verification_sent', 'en', 'Verification code sent! Please check your email.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('164b73a9-9269-4a54-9af0-ddf084370240', 'auth.error.server', 'en', 'Server error', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c8bdc23f-03e6-4adc-a128-4be6da1ff277', 'auth.error.user_exists', 'en', 'User with this email already exists in the {tableName} table', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2b23ceff-3df7-4b8f-a5e0-c21d359f11f4', 'common.sort', 'nl', 'Sorteer', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T20:49:09.675Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ecaea5de-720a-419b-9857-6a93dbd01eb8', 'common.on_hold', 'nl', 'In afwachting', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T22:57:27.606Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ce2fdf48-8e33-41cf-bfcb-1468d967bd5b', 'auth.error.account_inactive', 'nl', 'Account is inactief', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('798c7190-d2fb-4d59-befe-3cf9ccaf0668', 'auth.error.rate_limit', 'nl', 'Te veel inlogpogingen. Probeer het later opnieuw.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('54eb0984-5c59-4743-acb1-f274627577f5', 'auth.error.invalid_credentials', 'nl', 'Ongeldige inloggegevens', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3985c34e-5b1f-48a6-a1fe-9be1f58bdfc4', 'auth.error.invalid_credentials_store', 'nl', 'Ongeldige inloggegevens of u heeft geen account voor deze winkel', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0a5407a3-8d3a-48fd-973d-2d7e630027ac', 'auth.error.logout_failed', 'nl', 'Uitloggen mislukt', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0476c9c1-6afd-4c7c-aa24-2cbfe08c41c4', 'auth.error.customer_exists', 'nl', 'Klant met dit e-mailadres bestaat al', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1d66644a-cf2f-4cc8-b5a9-1e63cdd73069', 'checkout.login_for_faster_checkout', 'en', 'Already have an account? Login for faster checkout', 'checkout', '2025-11-12T18:32:09.157Z', '2025-11-12T18:32:09.157Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5da0a9fa-d622-47af-aa08-e015d02581c3', 'checkout.special_instructions_placeholder', 'en', 'Enter any special instructions', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b427de52-6824-4352-bf1f-a5cf42ebf889', 'checkout.fee', 'en', 'Fee', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('92fc597a-9571-43b2-ac51-526684e16a8f', 'common.category_description', 'nl', 'Ontdek onze verbluffende collectie producten in deze categorie. Blader door onze zorgvuldig samengestelde selectie en vind precies wat je nodig hebt.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-08T06:06:07.682Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7596cc3c-2b04-4e9c-8e12-d00cfe40f601', 'common.sign_in', 'nl', 'Aanmelden', 'common', '2025-11-07T18:34:17.198Z', '2025-11-08T12:37:02.128Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4400ba0a-2d99-4814-9526-f69c2e29caa5', 'common.enter_your_email', 'nl', 'Voer uw e-mailadres in', 'common', '2025-11-07T18:34:17.198Z', '2025-11-08T12:42:02.899Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f2bfc695-b37d-46d5-97d7-53a38509cd1a', 'auth.error.password.uppercase', 'en', 'Password must contain at least one uppercase letter', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('172772c6-4980-43c1-8f94-00eecb99def1', 'auth.error.password.lowercase', 'en', 'Password must contain at least one lowercase letter', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3f930084-5bc5-47df-8e77-2f43fd600ed7', 'auth.error.password.number', 'en', 'Password must contain at least one number', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('121ee497-409f-40c8-9f6e-2a678b0a59d8', 'auth.error.password.special_char', 'en', 'Password must contain at least one special character', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('43db44aa-e7ea-4907-aae5-d68255688589', 'auth.error.email.invalid', 'en', 'Please enter a valid email', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d6bb0436-c207-4e2c-926f-fa622da7f7d2', 'auth.error.first_name.required', 'en', 'First name is required', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1c1ff39b-0815-4f94-8d5b-126b58df2302', 'auth.error.last_name.required', 'en', 'Last name is required', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('424bb061-2eaf-4252-b67e-a47424ef38db', 'auth.error.password.required', 'en', 'Password is required', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d338ad3f-06b9-4ecf-b8fd-d0ce1c2ffb52', 'auth.error.role.invalid', 'en', 'Invalid role', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('107e3de8-7fb8-4d0c-875e-647331b19527', 'auth.error.store_id.required', 'en', 'Store ID is required', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7e1bcf53-07ab-4fc3-a02d-87c8a49bf2d8', 'auth.error.verification_code.required', 'en', 'Verification code is required', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9f01c49f-5097-4c91-85cb-1368ac5d3c79', 'checkout.login_to_continue', 'nl', 'Log in om sneller af te rekenen', 'checkout', '2025-11-12T19:00:37.908Z', '2025-11-12T19:00:37.908Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('264f9a06-7380-447f-b399-144345d08305', 'checkout.guest_checkout', 'nl', 'Als gast afrekenen', 'checkout', '2025-11-12T18:59:00.777Z', '2025-11-12T18:59:00.777Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7248ae73-99df-45a4-b4e1-f7180240b24d', 'checkout.qty', 'en', 'Qty', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e77cb1a7-8895-464a-97ec-6860c6b7926a', 'auth.error.password.min_length', 'en', 'Password must be at least 8 characters long', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T22:48:47.036Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('60582be6-10bd-4257-a511-f1debcce6007', 'common.failed_to_add', 'nl', 'Toevoegen mislukt', 'common', '2025-11-07T18:34:17.198Z', '2025-11-08T12:40:08.576Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f8b3deb6-d9fc-4a25-978d-1d1437e13fa9', 'auth.error.guest_not_found', 'en', 'No guest account found with this email, or account is already registered', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1d880540-c7dc-4369-8dd5-e4a811ff4727', 'auth.error.account_inactive', 'en', 'Account is inactive', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a4e23d0c-edbc-4d62-ab61-4ea07c3be31a', 'auth.error.rate_limit', 'en', 'Too many login attempts. Please try again later.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('03fd55e4-6a38-43cf-add0-3b22828d6989', 'auth.error.invalid_credentials', 'en', 'Invalid credentials', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('363ec630-09fe-4932-8a63-c3d1c64834fa', 'auth.error.logout_failed', 'en', 'Logout failed', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c6b44275-db05-43fa-ac02-fc72fb4f8236', 'auth.error.customer_exists', 'en', 'Customer with this email already exists', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('05aeb1c4-d6e9-49ee-b2a6-f19a38eb02e1', 'auth.error.customer_exists_alt', 'en', 'A customer with this email already exists', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7b7fbb00-23a0-4c6b-a9ce-a10478953a0d', 'auth.error.registration_failed', 'en', 'Server error during registration. Please try again.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1d8db3e3-c2ce-4424-9523-e5d263e4ab2b', 'auth.error.account_not_activated', 'en', 'This account has not been activated yet. Please create a password first.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c06887fd-6703-4322-8f93-764f9b0eccfa', 'auth.error.verification_failed', 'en', 'Server error during verification', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('83c22803-f679-4c43-868a-84fdfa411101', 'auth.error.password.uppercase', 'nl', 'Wachtwoord moet minimaal één hoofdletter bevatten', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('53b91759-5e64-4e65-9aec-3b9b6d2976f0', 'auth.error.password.min_length', 'nl', 'Wachtwoord moet minimaal 8 tekens lang zijn', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T22:48:27.937Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b9fd755d-2c2f-4c1f-b550-bf0c1b7c6a10', 'common.units', 'nl', 'eenheden', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T19:45:05.590Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1cbb4203-2122-40d0-a733-65b4e7aa48bb', 'checkout.billing', 'nl', 'Facturering', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-08T12:45:19.631Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('859cd842-021d-4754-b36f-2c007ed75353', 'customer_auth.error.config_not_available', 'nl', 'Authenticatieconfiguratie niet beschikbaar. Neem contact op met support.', 'customer_auth', '2025-11-12T19:47:07.088Z', '2025-11-12T19:47:07.088Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('87a5c7b4-6227-4a57-a42e-5f999f630230', 'auth.error.password.lowercase', 'nl', 'Wachtwoord moet minimaal één kleine letter bevatten', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('17795dfd-154e-4e1d-85c2-88460f83b1c7', 'auth.error.password.number', 'nl', 'Wachtwoord moet minimaal één cijfer bevatten', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6a10f7a2-b3c9-4e4c-9753-df271e7619b3', 'auth.error.password.special_char', 'nl', 'Wachtwoord moet minimaal één speciaal teken bevatten', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('daa1f278-2392-495d-8baf-359a20ca020f', 'auth.error.first_name.required', 'nl', 'Voornaam is verplicht', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('97c32456-8d15-4de0-a2bf-5a00e82a2b23', 'auth.error.last_name.required', 'nl', 'Achternaam is verplicht', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('76de635b-8c18-4b72-bb01-f997300cf2a4', 'auth.error.password.required', 'nl', 'Wachtwoord is verplicht', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aa9c25be-336b-44d7-bdd3-42480579fb32', 'auth.error.role.invalid', 'nl', 'Ongeldige rol', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0eba29d3-b5a4-4c73-be92-29ad0007c9c4', 'auth.error.store_id.required', 'nl', 'Winkel-ID is verplicht', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('23cf219c-9b1b-4d25-b2be-4bf9eaf637e0', 'auth.error.verification_code.required', 'nl', 'Verificatiecode is verplicht', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c76ae3fd-e8da-46a2-b8a2-68f849e32d0e', 'auth.success.user_created', 'nl', 'Gebruiker succesvol aangemaakt', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('89cb9ada-51cb-4481-9304-e1dd56acd4ef', 'auth.success.account_upgraded', 'nl', 'Account succesvol geüpgraded', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f771ac02-4a59-434d-80a4-ad0136a08027', 'auth.success.login', 'nl', 'Succesvol ingelogd', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aa58d3b9-d5af-432a-934f-c55459fcadec', 'auth.success.logout', 'nl', 'Succesvol uitgelogd', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ee140850-1569-4f4a-a2c5-29bf6e8678a5', 'auth.success.registration', 'nl', 'Registratie succesvol! Controleer uw e-mail voor een verificatiecode.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ce42f3bc-f648-4185-abb4-02ad12eeb349', 'auth.success.email_verified', 'nl', 'E-mail succesvol geverifieerd!', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3e0af108-369b-4388-b64d-dca3d0e03293', 'auth.success.verification_sent', 'nl', 'Verificatiecode verzonden! Controleer uw e-mail.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('753df765-1464-476f-a16b-b1afab6eb0ee', 'auth.error.server', 'nl', 'Serverfout', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7979c161-bc17-4d32-ab6d-8df64048fb47', 'auth.error.user_exists', 'nl', 'Gebruiker met dit e-mailadres bestaat al in de {tableName} tabel', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9b26ff92-39dd-454a-9032-e976f2488cc5', 'auth.error.guest_not_found', 'nl', 'Geen gastaccount gevonden met dit e-mailadres, of account is al geregistreerd', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7ce8c851-c10e-4774-828d-a25f43fa400e', 'checkout.same_as_shipping', 'nl', 'Hetzelfde als verzendadres', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-08T12:46:01.905Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('717ce7a7-7b0e-49be-aaa3-9d80541ac551', 'checkout.login_to_continue', 'en', 'Login to your account for faster checkout', 'checkout', '2025-11-12T19:00:37.916Z', '2025-11-12T19:00:37.916Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7328c89c-8e12-4413-a421-041a6849f435', 'auth.error.no_store_assigned', 'en', 'Customer account is not assigned to a store. Please contact support.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4b010cba-88c3-48bc-9fb0-0ec335280d90', 'auth.error.customer_not_found', 'en', 'Customer not found', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('14993a2b-41b8-4947-bb5b-9269be98f583', 'auth.error.email_already_verified', 'en', 'Email is already verified', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7a609dda-bfa1-4902-b0e3-8385972061e5', 'auth.error.verification_code_invalid', 'en', 'Invalid verification code', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('232a5617-2f9b-451a-bf3e-cae26994101d', 'auth.error.verification_code_expired', 'en', 'Verification code has expired. Please request a new one.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8f883747-e458-4bde-9d73-1ffa4bf6c999', 'auth.error.email.invalid', 'nl', 'Voer een geldig e-mailadres in', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bfd65484-82d8-41f9-b51c-57884d352388', 'checkout.guest_checkout', 'en', 'Guest Checkout', 'checkout', '2025-11-12T18:59:00.784Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3e48cfe4-53b2-44d2-a15c-c465cd662bc0', 'checkout.proceed_to_checkout', 'nl', 'Ga door naar Afrekenen', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-08T12:48:12.794Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8671840a-9ae5-44e2-86d8-b20dae04adc3', 'checkout.dont_have_account', 'nl', 'Heb je nog geen account?', 'checkout', '2025-11-12T19:11:07.797Z', '2025-11-12T19:11:07.797Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e139c66d-787f-4a22-ae1c-626607b8ae47', 'auth.error.oauth_failed', 'en', 'Google authentication failed. Please try again.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0f283b60-73b1-427b-a190-2ffdcd613cec', 'auth.error.token_generation_failed', 'en', 'Failed to generate authentication token. Please try again.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('57aee28f-4491-4fda-aeee-2bb941adb739', 'auth.error.database_connection_failed', 'en', 'Database connection issue. Please try again in a few moments.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6152f569-01da-4afd-9cd3-6b1b16474085', 'auth.error.general', 'en', 'An error occurred. Please try again.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('25d89325-b5e6-48cf-86c1-5cd7c3d99f3b', 'auth.error.google_not_available_customer', 'en', 'Google authentication is not available for customers.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('121a46fc-8a6e-4950-99c7-5df7c8c42280', 'auth.error.google_redirect_failed', 'en', 'Google authentication redirect failed. The service may not be configured properly.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ab2713fd-30ac-4a47-863f-f094a75dfc8f', 'auth.error.redirect_failed', 'en', 'Failed to redirect to Google authentication.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56d2a22e-9b07-431c-8eba-886020d418c9', 'auth.error.oauth_failed', 'nl', 'Google-authenticatie mislukt. Probeer het opnieuw.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e5a09b2f-4c0d-4937-b6b6-c49f4236e567', 'auth.error.token_generation_failed', 'nl', 'Kan authenticatietoken niet genereren. Probeer het opnieuw.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dee8dda0-e314-4185-87af-d7f97aa8c83e', 'auth.error.database_connection_failed', 'nl', 'Databaseverbindingsprobleem. Probeer het over enkele ogenblikken opnieuw.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7e22f1cd-75b8-4738-89f5-e63143613a85', 'auth.error.general', 'nl', 'Er is een fout opgetreden. Probeer het opnieuw.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e4b725fe-b326-47cf-a183-a9ad5807c46d', 'auth.error.google_not_available_customer', 'nl', 'Google-authenticatie is niet beschikbaar voor klanten.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a20e5e46-0b4e-458f-ac21-9c4758d2353c', 'auth.error.google_redirect_failed', 'nl', 'Google-authenticatie-omleiding mislukt. De service is mogelijk niet correct geconfigureerd.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('26a60354-d3bb-494a-b736-cbc963aab792', 'auth.error.redirect_failed', 'nl', 'Kan niet omleiden naar Google-authenticatie.', 'auth', '2025-11-12T21:59:25.474Z', '2025-11-12T21:59:25.474Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4d7cb15b-d81c-476d-b430-189f1f8f34b9', 'account.browsing_as_guest', 'nl', 'Je bekijkt de site als gast. Meld je aan om je bestellingen, adressen en verlanglijst te bekijken.', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T23:11:08.121Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a61d3b6b-1d30-448d-bbcb-61ed8798ad05', 'success.welcome_email_sent', 'nl', 'Een welkomstmail is naar uw inbox verzonden', 'success', '2025-11-07T18:34:17.198Z', '2025-11-08T12:52:01.517Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a0ab17ad-ab68-49fc-8c8d-ad76299d4e59', 'cart.coupon_removed', 'nl', 'Kortingscode verwijderd.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-08T12:52:03.390Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4996026c-4431-4a09-8575-5b9bbaae39e6', 'common.store_info_not_available', 'en', 'Store information not available. Please refresh.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7cb36c3a-2d74-4a63-b15e-e6f06d0ccaf9', 'common.login_failed', 'en', 'Login failed. Please check your credentials.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('da8ecbc1-1025-42b6-9d20-d8954cb02595', 'common.coupon_expired', 'en', 'This coupon has expired', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9c813da0-3ccb-4f43-945a-c989689a7a63', 'common.coupon_usage_limit', 'en', 'This coupon has reached its usage limit', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8cfb6bf0-d1cc-4eb4-afd8-190d21e5b4d7', 'common.minimum_order_required', 'en', 'Minimum order amount of {amount} required', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('16912f6c-ca7a-4d1f-9d05-2dcc28f3ceb2', 'common.invalid_coupon', 'en', 'Invalid or expired coupon code', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fd1dd53c-9bfe-4159-a7fd-9f9c6cedf0a7', 'common.email', 'en', 'Email', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('10fe9a9d-5c79-40ea-bff7-714d0d51f7af', 'common.full_name', 'en', 'Full Name', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('913ceccd-c5ba-4f4f-8a76-1203c98d5fd5', 'common.street_address', 'en', 'Street Address', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8ef2e3ad-cde1-42f1-a231-70a6687fa221', 'order.payment_information', 'nl', 'Betaalgegevens', 'order', '2025-11-07T18:34:17.198Z', '2025-11-08T12:53:08.350Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b62cc28e-68e3-4542-ac6e-952ad668faf9', 'auth.success.user_created', 'en', 'User created successfully', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9f86b7ef-3312-4e19-a6a8-aa28b540e82a', 'common.previous', 'en', 'Previous', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('585d5ba0-0d22-4eb0-997b-9b3917e964c0', 'order.total_orders', 'nl', 'Total Orders', 'order', '2025-11-07T18:34:17.198Z', '2025-11-08T12:54:07.466Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('62ebdb59-e740-420f-bee5-20903e117e16', 'common.city', 'en', 'City', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('df4b934d-dc5e-481a-8af3-b9485da679ab', 'common.state_province', 'en', 'State / Province', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7d54ece9-49fa-47f7-a350-cb8c1b809865', 'auth.error.customer_exists_alt', 'nl', 'Een klant met dit e-mailadres bestaat al', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('51c57774-9513-4921-9a9e-a5bee06e9a72', 'auth.error.registration_failed', 'nl', 'Serverfout tijdens registratie. Probeer het opnieuw.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3e3dd327-ecf8-4de2-9be1-84c3d8162649', 'auth.error.account_not_activated', 'nl', 'Dit account is nog niet geactiveerd. Maak eerst een wachtwoord aan.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b58febe8-ba87-401e-b6a3-418d40bf2047', 'auth.error.no_store_assigned', 'nl', 'Klantaccount is niet toegewezen aan een winkel. Neem contact op met support.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('658e86b8-2639-40e3-98ad-18553049e75f', 'auth.error.customer_not_found', 'nl', 'Klant niet gevonden', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('11a21428-e563-4a92-a098-964de1971fca', 'auth.error.email_already_verified', 'nl', 'E-mail is al geverifieerd', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('90c1455d-e86b-4c87-a921-2dd454899a72', 'auth.error.verification_code_invalid', 'nl', 'Ongeldige verificatiecode', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6bfd0b57-e60a-4cbe-b55b-cc2f89bfeeea', 'auth.error.verification_code_expired', 'nl', 'Verificatiecode is verlopen. Vraag een nieuwe aan.', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('87c2eafd-ef41-479e-96ed-4e8c0c3f20cc', 'auth.error.verification_failed', 'nl', 'Serverfout tijdens verificatie', 'auth', '2025-11-12T19:02:35.990Z', '2025-11-12T20:08:48.241Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e9375adf-456a-4ac8-a1e8-1ab0b4d9ee08', 'common.postal_code', 'en', 'Postal Code', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f616060f-6c92-4102-b1af-1af10eb0b348', 'checkout.add_new_shipping_address', 'en', 'Add New Shipping Address', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5395b855-c5b2-4c78-9b0a-31c964562f60', 'checkout.no_saved_addresses', 'en', 'No saved addresses', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('53f2c6d2-30ca-43a9-bca8-e05c7b330f08', 'common.search', 'en', 'Search', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('28f31ff2-9267-49f8-b449-267b28711d7c', 'common.filter', 'en', 'Filter', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('81128793-901f-4fde-a8be-a527f0950928', 'common.sort', 'en', 'Sort', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fff4429e-1b25-48ce-b4b3-be7620f3f922', 'common.loading', 'en', 'Loading...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e66fc361-a29b-4189-9bf7-ccb0b1af2c51', 'common.no', 'en', 'No', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('60387ed0-90da-479a-ac03-f8ef55a1f666', 'common.confirm', 'en', 'Confirm', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5f4f3b38-992c-477a-acd3-0b730276057b', 'common.view', 'en', 'View', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b1a523d3-cc74-4991-8258-8bccc5937a56', 'common.all', 'en', 'All', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('85f25b56-d786-41ba-80a9-5207e7ca3ad8', 'product.stock', 'en', 'Stock', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b491edbd-145f-4d19-9ead-749361e983b3', 'product.description', 'en', 'Description', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a7690b80-1163-4472-bf45-7a20ec7289ca', 'product.images', 'en', 'Images', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('14829cec-f2f4-40db-9294-17edaa3d24ed', 'product.category', 'en', 'Category', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1805534c-2a5b-4a2d-b831-cc6b70c32130', 'product.related', 'en', 'Related Products', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('087aa0f7-f153-464b-af69-ef6e5cd27142', 'checkout.payment', 'en', 'Payment', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dc29b259-8d7b-4c67-b7b4-927522fe6a4a', 'checkout.billing', 'en', 'Billing', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('844f8ae4-cd74-437c-9178-70b64c8bd387', 'account.email', 'en', 'Email', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('353963bf-2ace-4203-9d9a-c4b8e440dace', 'account.postal_code', 'en', 'Postal Code', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5fb20990-adfb-4820-bbf9-f9c2ad1755f5', 'common.processing', 'nl', 'Verwerken', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('34c8c404-7e07-47b5-acb1-2f3350f4f274', 'address.default_shipping_badge', 'nl', 'Standaard verzending', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f6ffe5d0-80e7-4482-b7f9-80474cb921e3', 'common.add', 'en', 'Add', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7bfb49d2-cfda-4341-a86c-ebef1a169908', 'common.cancel', 'en', 'Cancel', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fdde6344-5210-43f8-b7f4-d5869b1fe117', 'common.delivered', 'nl', 'Geleverd', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bce43a15-fe30-4e0f-b63a-6833d93ae918', 'address.add_first', 'nl', 'Voeg je eerste adres toe om de checkout sneller te maken.', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('59dc44d2-a211-4f44-bf50-e80f2b27b611', 'address.my', 'nl', 'Mijn adressen', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2301edbb-60fb-4086-b380-17e4a76c9abf', 'common.shipped', 'nl', 'Verzonden', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6d3e659a-0b1a-4d95-9916-0a4aff515275', 'common.pending', 'nl', 'In afwachting', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ca643806-740b-4f9a-bc65-a83e782109b8', 'address.saving_note', 'nl', 'Opmerking: Het opslaan van adressen voor klantaccounts is momenteel beperkt. Als u problemen ondervindt, neem dan contact op met de ondersteuning.', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0ad85cb9-2f0a-47ab-b898-ad23db1dcf2a', 'address.no_shipping', 'nl', 'Geen verzendadres', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4b894a8b-856c-46c5-8cc8-fa21a2380b0e', 'common.failed', 'nl', 'Mislukt', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fc38760b-e8e4-45fc-b3ec-155b05cb29c2', 'address.update', 'nl', 'Adres bijwerken', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('20ae98bb-0e30-454f-ad27-2897dbeb49db', 'address.default_billing_badge', 'nl', 'Standaard facturatie', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0c4821c1-7164-45de-bafd-cab5b1cbbed0', 'address.default_shipping_badge', 'en', 'Default Shipping', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('31cd4e19-1dca-454d-9218-cacd878bf95b', 'address.default_billing_badge', 'en', 'Default Billing', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b7f59fec-0953-4e61-bd1d-940e6417833b', 'address.none_saved', 'en', 'No addresses saved', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1891ee9b-1611-4c8a-81dd-c703aa1a84f9', 'address.none_saved', 'nl', 'Geen adressen opgeslagen', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4b73b1e9-e785-477f-a1c9-895c7b702d9d', 'address.add_first', 'en', 'Add your first address to make checkout faster.', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4ac44ee4-9480-4078-8471-549fbb6722de', 'success.thank_you', 'en', 'Thank You!', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ac18ceaf-6257-41c4-8a6d-88e5f0f39bbe', 'common.pending', 'en', 'Pending', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f0cf6ab4-277d-4e71-bd86-134ebbffc033', 'common.processing', 'en', 'Processing', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('43b4bf88-b3a7-4f46-8819-9d6468692c72', 'common.shipped', 'en', 'Shipped', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('04618412-4831-44f0-a60d-1f72d9d55721', 'common.delivered', 'en', 'Delivered', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f7861c17-9eed-44d0-a793-ae3af0ba7232', 'common.cancelled', 'en', 'Cancelled', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fdcac83f-a4e4-4f6f-96c4-c929dfac5f37', 'common.cancelled', 'nl', 'Geannuleerd', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ded248b0-42a8-4de1-8954-e5632f421931', 'common.refunded', 'en', 'Refunded', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c4594bd4-5d08-4de8-814c-6f48c52ac2e8', 'common.on_hold', 'en', 'On Hold', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d8956ddd-5d16-4e1f-a44d-0c0eecdaccc6', 'common.completed', 'en', 'Completed', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6ef83bf2-67be-4975-bd57-4ddd95594c28', 'common.completed', 'nl', 'Voltooid', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8574b952-ad6d-41ea-9c07-ab126f6c7121', 'common.failed', 'en', 'Failed', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('548fa556-5652-4e80-b69d-7bc7bd8faab2', 'common.paid', 'en', 'Paid', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1ade6718-220c-4ecf-8c50-5dd402fc96ef', 'common.paid', 'nl', 'Betaald', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cf0b1311-903e-423c-9adc-c546620261c7', 'address.saving_note', 'en', 'Notte: Address saving for customer accounts is currently limited. If you experience issues, please contact support.', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56d14faf-0316-47a4-bfdf-241b16538bea', 'address.no_shipping', 'en', 'No shipping address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('26b33d14-2a08-461e-b643-7761c9f2d3a4', 'address.default_shipping', 'en', 'Set as default shipping address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5f7e2fc3-f935-4ffc-a65c-436bebfdebff', 'address.default_billing', 'en', 'Set as default billing address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b842a284-49d3-4ef2-b1db-92b573c11ddf', 'address.default_shipping', 'nl', 'Stel in als standaard verzendadres', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('135a83df-24c1-4cf2-9c0a-551249b996ee', 'address.default_billing', 'nl', 'Stel in als standaard factuuradres', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('583e5ad6-20a0-4bc6-bc1b-a5ad6b161d1c', 'common.refunded', 'nl', 'Terugbetaald', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('893bf043-d245-47de-89ab-d9d843ed183a', 'common.test', 'en', 'test', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('938264bf-6e26-4596-aa51-1f835f99100b', 'common.added_to_cart_success', 'nl', 'toegevoegd aan winkelwagen!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('04a35a9f-3f5c-48bb-9884-1d1504a7c623', 'common.sort_by', 'nl', 'Sorteer op', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('47794d33-b0b0-4e54-97ff-c924c5f560ea', 'common.show_more', 'nl', 'Toon meer', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e29ed823-45f4-4f9e-8fe4-93d0e65829a1', 'common.sort_position', 'nl', 'Positie', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('777b2c96-c93e-4c40-9eb7-f1791b9d40c2', 'common.authorized', 'en', 'Authorized', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('99c0552d-8775-4a80-a8d5-c3d8c449db37', 'common.authorized', 'nl', 'Geautoriseerd', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('57b2b719-0b7f-42e0-b02a-8bf6f44310c3', 'common.sort_price_high', 'nl', 'Prijs: Hoog naar Laag', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('35b0f2ae-5070-46d6-bdde-b6f1ed1967c9', 'common.apply_filters', 'nl', 'Filter toepassen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fbb23103-712a-418c-a2f6-64d563ce7f84', 'common.hamidtest', 'nl', 'dit is mijn eerste ui-label', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4aef313f-0dfd-49a5-85c9-81a7d00996a8', 'cart.please_enter_coupon_code', 'en', 'Please enter a coupon code.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7aba0dbb-b0b6-4aad-8b5f-11dac071344f', 'cart.coupon_applied', 'en', 'Coupon "{coupon}" applied!', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0675da96-44bb-489e-b3e0-315f4f9beb9a', 'cart.coupon_removed', 'en', 'Coupon removed.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8b474753-7b80-4fc2-b7dd-ba8b97df44dc', 'cart.item_removed', 'en', 'Item removed from cart.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c062b9de-b61e-4847-a3c9-221271610bf1', 'common.products', 'nl', 'producten', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1b318de4-8b2f-43bc-bbbf-02bac19bd9bb', 'cart.coupon_applied', 'nl', 'Kortingscode "{coupon}" toegepast!', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a0176bfd-ff88-4ba9-9752-48be69c2bf10', 'message.info', 'nl', 'Info', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cfa1f1b5-7583-4c09-87ac-982ff3b8b627', 'discount.view_eligible_products', 'nl', 'In aanmerking komend voor', 'discount', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a73eeceb-1dff-4be3-b9d0-83a6e441b779', 'message.success', 'nl', 'Gelukt!', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('625c1008-448d-47d2-8166-d568f5fe51fc', 'message.error', 'nl', 'Fout!', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('57fdd6d4-2b92-4ab8-bb17-fa8928405539', 'message.warning', 'nl', 'Waarschuwing!', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a7b1b614-e37e-4d44-b821-1187f9be1e36', 'message.saved', 'nl', 'Succesvol opgeslagen', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7a8289e3-1b35-4e1c-b7ab-0efaa0c21d8e', 'message.deleted', 'nl', 'Succesvol verwijderd', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ef379cd2-b85a-4d22-b379-06dddf0a9cbb', 'checkout.special_delivery_instructions', 'nl', 'Speciale bezorgingsinstructies (optioneel)', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f95c78ce-c415-4ffe-a9e6-46b1485fabcc', 'navigation.storefront', 'nl', 'Winkel', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3afdd813-ec90-4441-afbe-7df387caa9f1', 'common.clear_all', 'nl', 'Alles wissen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ddb7dd9b-8f77-41fa-a2f9-d876f88145a4', 'common.of', 'nl', 'van', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cffd9f5e-7502-42bf-88c8-19694c4bda4a', 'cart.please_enter_coupon_code', 'nl', 'Voer alstublieft een kortingscode in.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8dff9c04-4984-44e1-abb9-ca619ed73905', 'common.sort_price_low', 'nl', 'Prijs: Laag naar Hoog', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9fca2816-2f46-4c04-8920-bb12e5e9fd21', 'navigation.admin', 'nl', 'Beheerder', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7071365c-ed80-4ff5-8adb-14088faf78dc', 'common.filter_by', 'nl', 'Filter op', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bb177451-6b9a-4810-8076-590c8c9ccfbc', 'common.active_filters', 'en', 'Active Filters', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3b57a0f9-580b-4a0d-b245-440daa271752', 'common.active_filters', 'nl', 'Actieve filters', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('873ae236-93ea-4fb2-a115-516e60f6b83b', 'common.added_to_cart_error', 'en', 'Failed to add to cart. Please try again.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('291ff185-a71b-4452-8ea0-eaad9764f4a0', 'common.added_to_cart_success', 'en', ' added to cart successfully!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cf4f606c-7e6b-4496-8fd4-e9fb1ddd64ed', 'common.apply_filters', 'en', 'Apply Filters', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b759f8d2-cb02-494c-b749-7a2b31c02fb9', 'common.clear_all', 'en', 'Clear All', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ac638df6-ea7d-46f3-86a1-4956a08cba9a', 'common.continue_shopping', 'en', 'Continue Shopping', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('812e6450-1245-41fd-8591-d181f2a1543e', 'common.filter_by', 'en', 'Filter By', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('faf6106a-cf98-4fa5-96ee-445f87c4db16', 'common.filters', 'en', 'Filters', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6e6cfd12-7d7f-46a8-b741-17b8b8f1613e', 'common.filters', 'nl', 'Filters', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('07eadd37-86c4-4a41-b4d8-2e1428eb6efb', 'common.my_cart', 'en', 'My Cart', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('82863fdf-9d3d-4f6b-b869-217cc793c009', 'common.of', 'en', 'of', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cfc6b9cd-783f-40a7-a374-2ca5c86823f7', 'common.price', 'en', 'Price', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('abe668dd-1320-4015-bde6-e09a38008968', 'common.price', 'nl', 'Prijs', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('64b47056-247d-4283-85fb-38e40fbec025', 'common.products', 'en', 'products', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dc84819f-95d8-4196-99c4-4df6eeb23dfc', 'common.show_more', 'en', 'Show More', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d2d35938-4bbd-4248-8d1b-729270db55f0', 'common.sign_in', 'en', 'Sign In', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f61032bc-fbd8-41ca-9120-d4e51b1ed2f9', 'common.sort_by', 'en', 'Sort Byss', 'sort_by', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e080005c-1d49-40fa-82e5-50925de4160a', 'common.sort_name_asc', 'en', 'Name (A-Z)', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('130cdf88-fe37-4df8-93a3-3bb3d20e6859', 'common.sort_name_asc', 'nl', 'Naam (A-Z)', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dc14290c-6535-4ec8-8ea5-63fb59449f42', 'discount.view_eligible_products', 'en', 'View eligible products', 'discount', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('648e3a44-e43b-44e1-a84e-0b54f3919c77', 'common.sort_name_desc', 'en', 'Name (Z-A)', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ac907994-48a5-4c45-bec5-e57e03c39880', 'common.sort_newest', 'en', 'Newest First', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5678be11-7124-4348-a7ee-4d7ce14246b2', 'common.sort_newest', 'nl', 'Nieuwste eerst', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7ba33328-c98e-46e1-af18-2a852fad99ec', 'common.sort_position', 'en', 'Position', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('75840ef0-b730-46f5-923b-0c05b3ca2900', 'common.sort_price_high', 'en', 'Price: High to Low', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('26875044-dba2-46c8-ad20-8fb451f4b432', 'common.sort_price_low', 'en', 'Price: Low to High', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bf3e49b3-27bb-4c87-900c-f42741198eda', 'common.apply', 'nl', 'Toepassen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('833c986a-e42a-43c0-a78b-a9908cd40138', 'common.my_cart', 'nl', 'Mijn winkelwagen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('17848a21-dbd8-444e-9f63-1801e68b8a7b', 'common.checkout', 'nl', 'Afrekenen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b56c3ba0-d00d-4e11-bf19-26115442b1ff', 'common.continue_shopping', 'nl', 'Doorgaan met winkelen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f0913507-dcda-472e-af87-65f507186272', 'messages.passwords_no_match', 'en', 'Passwords do not match.', 'validation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('29128e43-8422-42a9-a2dd-bae4f6bf0249', 'checkout.shipping_fee', 'nl', 'Shipping Fee', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('702823ad-23b8-4303-b2f8-909ae558f6ce', 'editor.empty_cart_button.1761490638565', 'en', 'Continue shopping', 'editor', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('7e9efd4b-ab0e-49b0-9e7b-d6756b152f7e', 'common.processing_order', 'nl', 'Uw bestelling wordt verwerkt...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1fa5a794-a7ec-4dc8-81c2-516fb435f41e', 'editor.empty_cart_button.1761490641549', 'en', 'Empty cart', 'editor', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('18f6c83f-3e7e-4c1a-9d81-7ae5b424e436', 'common.apply_coupon', 'nl', 'Coupon toepassen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ba2c0ca1-9501-4614-a534-505f73832c12', 'account.address', 'nl', 'Adres', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('30522252-52aa-4d0e-9cb2-35f2b67d3826', 'account.my_orders', 'nl', 'Mijn bestellingen', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2e05d15e-3f9f-4be2-9dcf-24a1fb2edc94', 'account.order_history', 'nl', 'Bestelgeschiedenis', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6b9805c7-a591-468d-82b4-0dd94306a252', 'account.reset_password', 'nl', 'Wachtwoord resetten', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8cb76f67-c580-401b-80e8-344395c8cb48', 'common.tax', 'nl', 'Belasting', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('03c9ddcd-4ec6-4067-ab59-1b02e94b6c52', 'editor.empty_cart_button.1761490641549', 'nl', 'Winkelwagen leegmaken', 'editor', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('07cf861f-fc50-4835-b54f-7900b1a209cd', 'account.register', 'nl', 'Registreren', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d3720d0b-5a7e-4df8-9e1b-aa31185e40b3', 'account.city', 'nl', 'Stad', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ffcca916-55e2-4d42-8968-4cb68db05f71', 'order.number', 'nl', 'Bestellen', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2beebd56-42ad-4f37-b3bb-119d6f001fb9', 'common.total', 'nl', 'Totaal', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4bb89553-bf55-4e90-adce-871090d1a727', 'common.proceed_now', 'nl', 'Ga nu verder', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bfdff653-34ba-41ef-b90b-5feb330a47d7', 'common.order_summary', 'nl', 'Besteloverzicht', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d1f3f02b-7907-43b5-864c-317ea77e1ed2', 'common.enter_coupon_code', 'nl', 'Voer de kortingscode in', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bec3c9dd-5aba-4385-bd0e-c797362c5e01', 'account.forgot_password', 'nl', 'Wachtwoord vergeten?', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('827b893b-2940-4ea4-aa57-e2c89023e92d', 'account.sign_up', 'nl', 'Aanmelden', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('743572ef-793b-4dfd-ac7d-d7925a31daf2', 'editor.empty_cart_button.1761490638565', 'nl', 'Doorgaan met winkelen', 'editor', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5562a5d6-e625-41c5-91e9-4c51bcfc98ff', 'common.add_products_checkout', 'nl', 'Voeg producten toe aan de kassa', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8a26e2d0-3798-4610-88af-f8cee98872d2', 'common.add', 'nl', 'Toevoegen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b5f67d19-5fbb-4e4c-a75d-2f48775bc5b2', 'common.cancel', 'nl', 'Annuleren', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6a3aa475-53f9-406d-b62e-e2d4957b0203', 'common.already_registered_login', 'en', 'Already Registered? Login!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('18ac8fac-e44a-4242-9c85-89650a6e4b80', 'common.apply', 'en', 'Apply', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('014d727a-0d71-42b0-abfc-363fe65a3b9c', 'common.apply_coupon', 'en', 'Apply Coupon', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ab14fb41-b158-4efe-ae57-1bbe3917ad1c', 'checkout.payment_method', 'nl', 'Payment Method', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3f3b9d60-eef3-47de-bdcb-cc7cc19c478f', 'common.category_description', 'en', 'Discover our amazing collection of products in this category. Browse through our curated selection and find exactly what you need.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c8a8700a-04e2-4734-a9a1-aa87aa03cf92', 'common.checkout', 'en', 'Checkout', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1e8d40b1-5367-4081-9cf4-ae4f8f4dbd86', 'common.discount', 'en', 'Discount', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('77df566c-628b-49db-889d-8b3b85d00e25', 'common.discount', 'nl', 'Korting', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3a0b41a4-c570-4c7c-8eeb-61d0af600590', 'common.back', 'nl', 'Terug', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T19:51:37.265Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('78c659ef-e04b-4a35-bdcc-3533be577905', 'common.create_account', 'en', 'Create My Account', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('33c8b1b9-cb26-4b9d-ad59-274774be3d8a', 'common.add_products_checkout', 'en', 'Add products before checkout', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cbf7d913-2824-4bd6-98c4-b127594ed8e7', 'common.order_summary', 'en', 'Order Summary', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('01c4e06f-3138-4825-b93e-e81adf896ebe', 'common.proceed_now', 'en', 'Proceed now', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f9857d04-f3ac-4481-8139-d4441888df5a', 'common.processing_order', 'en', 'Processing your order...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1ebc1cc9-87e0-4d3a-a198-25f40d67c9b4', 'common.remove', 'en', 'Remove', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('da304738-eb36-4a6c-a3b9-a2fd7c65807b', 'common.subtotal', 'en', 'Subtotal', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e6c16764-56e2-46f5-a03a-9cf3074d5f54', 'common.tax', 'en', 'Tax', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a0b7d960-4672-4179-bdd6-e3a621239a1d', 'common.terms_agreement', 'en', 'By signing in, you agree to our Terms of Service and Privacy Policy', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9dee1130-2bd0-4bb0-87c0-edc0c85e2af3', 'common.total', 'en', 'Total', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4a443dfe-0264-405f-9926-7673c68ba05e', 'common.welcome_back', 'en', 'Welcome Back', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c3a312b3-090e-4abe-aa21-5e03a216b047', 'common.welcome_back', 'nl', 'Welkom terug', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6e0521db-650e-4ea7-9c95-14c09c0d8144', 'common.search', 'nl', 'Zoeken', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b804d609-38fb-4e6e-b7d1-d5844e16eb05', 'common.edit', 'nl', 'Bewerken', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('770e4de3-d087-4551-9d3b-da5d8b3a80f1', 'common.submit', 'nl', 'Verzenden', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('15b94f2e-dcb9-4acf-854a-3e5a1924a8a7', 'common.no', 'nl', 'Nee', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('70f32b10-a77f-4d0e-afdc-5a61f9a7c620', 'stock.out_of_stock_label', 'en', 'Out of Stock', 'stock', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2619e3bf-df38-41a6-a96a-9b192d8c4889', 'messages.passwords_no_match', 'nl', 'Wachtwoorden komen niet overeen.', 'messages', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4284b2f4-5158-4a69-95bb-f4895b4ab507', 'common.filter', 'nl', 'Filter', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ebef8431-df94-4810-bfdb-cc635537c2f6', 'common.yes', 'nl', 'Ja', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ab095ca8-a70d-41d2-86ce-7b7790a3e32e', 'common.none', 'nl', 'Geen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cb197e9c-76ed-4dca-a296-de3bf435d136', 'common.next', 'nl', 'Volgende', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('45d9f4f4-162f-4f64-92f4-f1c21b7fc324', 'common.select', 'nl', 'Selecteer', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('19a69964-2539-4eb8-8130-0dcd64a876cb', 'common.download', 'nl', 'Downloaden', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8ccfc5c8-ff23-4d04-93ad-2773cec8de3f', 'order.placed', 'en', 'Placed', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('df709f1d-db49-425f-984e-de10680982e9', 'product.description', 'nl', 'Beschrijving', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dbbd2464-a8b1-41b0-baa9-674863dd4be8', 'order.store', 'en', 'Store', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1b1c1474-1899-42ba-888f-00dd7216be89', 'order.status_notes', 'nl', 'Statusnotities', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aff4199b-8705-40b3-9cfc-b7ec405cd932', 'order.store', 'nl', 'Winkel', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3c6d6c8f-40d2-4ae1-9084-b53c3a765c4b', 'product.category', 'nl', 'Categorie', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('84dee4d4-0a95-4efd-aab7-329e10ef89c6', 'order.payment_information', 'en', 'Payment Information', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6b08f74f-253d-46ee-abc7-6c4c225d0078', 'order.total_paid', 'en', 'Total Paid', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('71bc00f4-1f94-4530-be50-e25fb39f4d46', 'product.related', 'nl', 'Gerelateerde producten', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cd067881-2818-4a00-b0bd-ce381d4efa9d', 'common.all', 'nl', 'Alles', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a7f2c9b3-2040-44ef-b57c-524c5d38d9e8', 'order.items', 'en', 'Order Items', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6ebbce2d-bc9c-47a2-b321-8970c91ebecd', 'checkout.payment', 'nl', 'Betaling', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('83a11951-13b0-40c6-9aa7-25de6ae71d87', 'order.status_notes', 'en', 'Status Notes', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('354d2bae-25b8-4187-9934-ea05f1bae44f', 'order.cancel', 'en', 'Cancel Order', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2dfea449-4277-4216-8def-d30b882f661b', 'order.cancelling', 'en', 'Cancelling...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ffb6d90d-2b06-4a7c-9c25-7c70c8a3668f', 'order.cancelling', 'nl', 'Annuleren...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a8b9ee54-4557-4d61-968e-68935c2d2aa5', 'order.request_return', 'en', 'Request Return', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('19dc69d4-960c-4d90-a9df-c41be5d4c606', 'order.requesting', 'en', 'Requesting...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('448051ab-5b2b-4857-a4b5-4954dd93714f', 'account.email', 'nl', 'E-mail', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('786e1d0b-0a5a-4f5a-8b27-01dbd4c71f9a', 'order.date', 'en', 'Order Date', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d1c10d56-a420-4a9a-ade4-6f42f588ca2f', 'order.date', 'nl', 'Besteldatum', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f64ffb31-88cf-4ff1-897c-fcf9fe7fba6d', 'order.request_return', 'nl', 'Retourneren', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('16d4917d-35ee-4f6d-a006-fafea86c2c94', 'order.cancel', 'nl', 'Annuleer bestelling', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e33bf380-8081-4107-b3f5-72c6ae4e151d', 'order.items', 'nl', 'Bestel artikelen', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ccd855bd-5739-43c8-a20c-9513d0df53a6', 'common.previous', 'nl', 'Vorige', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4db71e27-7beb-4b34-9db3-012fc9dae9d0', 'common.could_not_apply_coupon', 'nl', 'Kortingscode kon niet worden toegepast', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ddebe053-0121-4d78-9d16-6c4c5c094f99', 'navigation.dashboard', 'nl', 'Dashboard', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('16663246-4546-41bd-ac25-bed22d2fe249', 'navigation.customers', 'nl', 'Klanten', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('040a8a3c-c4af-4166-bb93-b2fe02b3a965', 'navigation.settings', 'nl', 'Instellingen', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('59a934eb-21c7-430d-bcd8-165dc188aba1', 'navigation.login', 'nl', 'Inloggen', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4567b5e7-41e0-4e66-8403-7656ba3980ab', 'common.confirm', 'nl', 'Bevestigen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f4308ebc-6155-4785-a8a5-7621438c066e', 'common.delete', 'nl', 'Verwijderen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9886b648-c0d6-4999-8f8b-45c486ee8889', 'common.close', 'nl', 'Sluiten', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ea6daade-3916-4460-b501-1231375f809c', 'common.upload', 'nl', 'Uploaden', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('73ef79f2-2a50-4ed3-926f-831470ba4d67', 'product.stock', 'nl', 'Voorraad', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('eac41134-e306-4439-bbf3-0a0c1d806815', 'common.enter_coupon_code', 'en', 'Please enter a coupon code', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('45947597-d858-4d25-9337-8f9f0da551d6', 'cart.cart_empty_message', 'nl', 'Ziet eruit alsof je nog niets aan je winkelwagen hebt toegevoegd.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e0181662-6d63-4297-909a-ebcc325630cf', 'order.placed', 'nl', 'Geplaatst', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6bb8d864-e48a-441f-824c-123bd98a7ba4', 'order.total_paid', 'nl', 'Totaal betaald', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('553ff9e4-3af6-4313-9d21-ebd780d62b54', 'order.requesting', 'nl', 'Aanvragen...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c902f130-1e4c-4deb-ac7d-8e3fd2b7f6f4', 'common.view', 'nl', 'Bekijk', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7106fe19-0c83-4e8f-b0c5-faa3ebe130c3', 'common.loading', 'nl', 'Laden...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('59f4a2c9-db1e-4cf9-b04c-263b67deb72f', 'common.save', 'nl', 'Opslaan', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b8f525c9-33e5-48d1-b414-68113c23f9d8', 'product.images', 'nl', 'Afbeeldingen', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8c363149-d78a-4524-84ce-2d91637c6554', 'product.add_to_cart', 'nl', 'Voeg toe aan winkelwagen', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9fc5c595-b5ba-4c4c-81cc-c3a8737b8739', 'stock.low_stock_label', 'nl', 'Beperkte voorraad{, {nog maar {quantity} {item} over}}', 'stock', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c30bc933-8b44-407a-9024-77d92b284333', 'navigation.products', 'nl', 'Producten', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e16642d9-458d-4b18-9dc1-3ea39330e668', 'navigation.categories', 'nl', 'Categorieën', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('db0e8d13-a2ea-4953-af7c-bc7f71269db1', 'common.yes', 'en', 'Yes', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a9dda88c-dffe-43ef-9cf4-c22ccd86563f', 'account.postal_code', 'nl', 'Postcode', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ccdf4d9c-a4d2-49a1-997c-fb1b74177785', 'order.payment_status', 'en', 'Payment Status', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('03051f79-8c8f-4648-a1c4-2ae65dfcf25d', 'common.download', 'en', 'Download', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('04fdd913-67fc-4996-96f1-9904856b4f3b', 'common.upload', 'en', 'Upload', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a948cb7b-e4c4-4f42-9168-433aac5627f3', 'common.select', 'en', 'Select', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0c31eab2-7cef-471a-901b-ac13ca0327f4', 'common.none', 'en', 'None', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0a6104ec-ac31-4f21-ac8e-ced29d5619e4', 'common.search_products', 'en', 'Search products...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a3aa670a-3f51-49ec-81a1-54ea9d798058', 'navigation.profile', 'en', 'Profile', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('601fb9e6-71fb-4ef5-9997-9f981282fce1', 'navigation.admin', 'en', 'Admin', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8999d09a-9295-4bd6-8f11-144a29c2afe4', 'navigation.storefront', 'en', 'Storefront', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f3d94c32-b2bd-44bd-bd70-a341d7ac9b94', 'product.name', 'en', 'Product Name', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4af06df4-eda6-4091-b259-853a14f4f9a6', 'product.in_stock', 'en', 'In Stock', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('01ff44ee-27fa-4a78-9a37-cb5013090b60', 'common.confirm_password', 'en', 'Confirm Password', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e31519d3-a933-4456-af16-fa69117b8dfb', 'common.could_not_apply_coupon', 'en', 'Could not apply coupon', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a0ef31ad-6b27-4edb-a1c1-6a73abad0ef1', 'cart.cart_empty', 'en', 'Cart is empty', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fa5731ca-2345-4fc4-90c3-bd5938f22123', 'product.buy_now', 'en', 'Buy Now', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d756673a-3f1f-4601-915a-18557f5e44cf', 'cart.cart_is_empty', 'en', 'Your cart is empty', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('25cf5b20-7dfc-46e0-8731-255c1139ea2d', 'product.quick_view', 'en', 'Quick View', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ab951036-b98f-42dd-928a-22b68f0baa92', 'cart.cart_empty', 'nl', 'Winkelwagen is leeg', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bed23695-4d1d-4cb0-a551-c3b4e7fc0fbb', 'product.details', 'en', 'Product Details', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('02d1172b-1ae4-4fbf-b843-bc063eecde7b', 'product.reviews', 'en', 'Reviews', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('db40b061-e251-425f-b0c9-86afd842ed27', 'checkout.cart', 'en', 'Shopping Cart', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1ec53f24-90f1-4f59-9594-b54282b1e04e', 'error.blacklist.checkout', 'en', 'This email address cannot be used for checkout. Please contact support for assistance.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('87d5dee3-ac38-4cb4-a33e-0c623e8c58c2', 'cart.cart_is_empty', 'nl', 'Uw winkelwagentje is leeg', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dc3fac6e-ed5e-4ab3-a76a-139441e1cbd0', 'common.edit', 'en', 'Edit', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0195124c-35a3-44b5-959b-2aa35f857742', 'common.delete', 'en', 'Delete', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('30b4ff66-9ad8-4aed-be8e-d2b407849fa6', 'common.save', 'en', 'Save', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b5d13e5d-3c40-41c6-8380-aadc6e6d3871', 'common.submit', 'en', 'Submit', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('00b6ab21-f092-4ca2-89be-b773dfd63204', 'common.close', 'en', 'Close', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4843b2eb-6963-49d0-86e1-303dd2887df6', 'common.confirm_password', 'nl', 'Bevestig wachtwoord', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56084311-f0dc-4acf-8c1c-fd801093c0cc', 'common.error', 'nl', 'Fout', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b975eff7-908e-491a-af49-147fdd51ab02', 'success.track_orders', 'nl', 'Volg je bestellingen en sla je gegevens op voor een snellere checkout. We sturen je een welkomstmail om aan de slag te gaan.', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f50b296e-b666-48fe-8d9d-0af97a7b3cc2', 'success.thank_you', 'nl', 'Bedankt!', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5c621051-88e6-4212-b8c7-a8b10f86a311', 'common.search_products', 'nl', 'Zoek producten...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1f771633-af1f-43cf-a1eb-7a7e7b5053c2', 'common.free', 'nl', 'Gratis', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('eb4ec5c4-7797-4f8f-bcc4-11bf43669cb7', 'common.logout', 'nl', 'Uitloggen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6df0094e-6d26-41e8-b530-17e0207f670c', 'order.payment_status', 'nl', 'Betalingsstatus', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e393a518-20d4-4e13-9cd3-696575b6359f', 'common.error', 'en', 'Error', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('43340d75-8def-4fbd-865e-9b5dda16ef18', 'common.free', 'en', 'Free', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c454e61a-fe71-4e5f-9231-5b10d2da7a19', 'error.blacklist.login', 'nl', 'Uw account is uitgeschakeld. Neem contact op met de ondersteuning voor hulp.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1252283a-04c6-45fe-a13f-6915562f9457', 'common.logout', 'en', 'Logout', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7ba2b923-99d5-4b67-9802-c51eb34696cd', 'common.place_order', 'en', 'Place Order', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c78a7d7a-4157-46a3-ac6e-5ff102a9f809', 'common.place_order', 'nl', 'Bestelling plaatsen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f54022f1-9099-478c-b5a8-341d61f77556', 'common.shipping', 'en', 'Shipping', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0df6f486-d823-4c24-bb21-40a358858532', 'common.shipping', 'nl', 'Verzending', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('97cf455b-f571-4de4-82cf-88445da008ad', 'common.shipping_address', 'en', 'Shipping Address', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('316468f1-aba2-4322-b014-083c29aee420', 'common.shipping_address', 'nl', 'Verzendadres', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a8fbffea-e141-4585-84e0-fc1e602cd309', 'common.shipping_method', 'en', 'Shipping Method', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('11b588ef-2e90-4643-b0d7-205a343aeca5', 'common.view_all_results_for', 'nl', 'Bekijk alle resultaten voor', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9167c20e-c6f9-468d-b73b-5efe5179dc4e', 'common.wishlist', 'en', 'Wishlist', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('29507d71-64c1-4676-a8ba-8fc8028c5ea1', 'common.wishlist', 'nl', 'Verlanglijst', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c6cbc760-7617-4b71-8e4e-88ab55ac03f9', 'checkout.delivery_settings', 'nl', 'Bezorgingsinstellingen', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3d4e18a5-9ed5-4cc6-bbc8-43ffcbc1b94e', 'order.delivery_date', 'en', 'Delivery Date', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('da71d08e-c578-41c4-9bf1-1c4a168a47c5', 'common.test', 'nl', 'test', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7a592e27-a404-4425-ae6a-064fdae07fca', 'common.error_adding', 'nl', 'Fout bij toevoegen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6b81f049-60fc-468f-a863-a2a467dc8082', 'checkout.select_time_slot', 'nl', 'Selecteer een tijdslot', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c57d3de7-9252-45c2-902f-a084890aa34f', 'common.city', 'nl', 'Stad *', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f9335770-c29d-4a0d-b5ac-0cfe29d7bf6d', 'common.email', 'nl', 'E-mail *', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ed9b0339-6df2-4085-b6d6-5db5af319cc2', 'checkout.preferred_time_slot', 'nl', 'Voorkeurstijdslot', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f0d2e0b3-8c9b-4faf-b0b3-74ba5c6042f0', 'common.please_try_again', 'nl', 'Probeer het opnieuw', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fc971110-3da6-4df9-9cf1-d62059cd4acf', 'common.full_name', 'nl', 'Full Name *', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5ad259ac-1af8-4dad-9ec4-81c781d60257', 'common.state_province', 'nl', 'Provincie *', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f7c8472a-09bc-4f5e-8f10-eeeedb9eaa0b', 'product.price_breakdown', 'nl', 'Price Breakdown', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('710e3a91-32d2-4ac5-a33f-579d1637ec2f', 'common.adding', 'nl', 'Toevoegen...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('57424e67-4175-4c0a-9740-aa2ad98ad781', 'checkout.preferred_delivery_date', 'nl', 'Preferred Delivery Date', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('90ce65e5-ddd1-4189-a2e5-3e28778f34fd', 'checkout.delivery_settings', 'en', 'Delivery Settings', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('098c3011-80a1-41fa-a34b-6e04a4bfba0b', 'checkout.preferred_delivery_date', 'en', 'Preferred Delivery Date', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0b5a334f-b9b5-43f0-bf3f-139254a215e1', 'checkout.preferred_time_slot', 'en', 'Preferred Time Slot', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c3be408f-96bb-4ed4-966e-7d2f19d61bc9', 'checkout.same_as_shipping', 'en', 'Same as shipping address', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('800d1003-6822-413b-bd87-e0417f46ee59', 'checkout.select_delivery_date', 'nl', 'Selecteer een bezorgdatum', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('434395df-dbfa-4384-8628-261d82226e82', 'common.added_to_cart', 'en', 'added to cart successfully!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6f32906d-ffed-45c8-b24b-214063ec0bb6', 'common.adding', 'en', 'Adding...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('88cb27ee-82bd-42e4-9b53-1ba6c3bb4541', 'common.error_adding', 'en', 'Error adding', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9b106463-ba0e-44f8-ab34-5ee69d01b530', 'common.failed_to_add', 'en', 'Failed to add', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('74a62725-84f6-4ca5-9769-7e153a25db73', 'common.please_try_again', 'en', 'Please try again', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b1e68565-c69b-4fbb-b486-72ab8ce6efc6', 'common.postal_code', 'nl', 'Postcode *', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('621c4323-8b47-4316-a4fc-a3cda7992fdd', 'common.street_address', 'nl', 'Straat *', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c20d2180-02d0-4c7e-b619-ae4590e450ca', 'common.to_cart', 'en', 'to cart', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('663ca7c3-4e63-4896-9caf-a89015114a9b', 'product.price_breakdown', 'en', 'Price Breakdown', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0fe9b01a-6ba2-4aac-9048-87e135ccfd7e', 'product.selected_options', 'en', 'Selected Options', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('54be1289-bf78-415c-a22a-c20e378b9bae', 'product.selected_options', 'nl', 'Geselecteerde opties', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('502d15c4-170f-438f-9cf0-03b45725b028', 'product.total_price', 'en', 'Total Price', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bb5423b2-3912-4825-966d-694e1728ed5f', 'order.delivery_date', 'nl', 'Bezorgdatum', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8f80ce33-942f-494f-91f9-90f760b0575a', 'order.delivery_time', 'en', 'Delivery Time', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8dfb1f54-a6b2-4351-b65a-3b921fb8a26e', 'order.items_processing', 'en', 'Order items are being processed...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('34ac56c1-85d9-4be0-869a-99310a8889d3', 'order.successful', 'en', 'Your order was successful and will be fulfilled.', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('14258db9-2692-4ab5-a29e-2a7aedb3d847', 'order.details', 'en', 'Order Details', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ff793e66-1550-4dfe-aaa0-18c6eb9fd7a8', 'order.total_amount', 'en', 'Total Amount', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('712fbb03-4666-470b-a540-ba239f2b022a', 'order.unit_price', 'en', 'Unit Price', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4766dfbf-ccb6-47e6-a74d-b5caa52bbc79', 'order.total', 'en', 'Order Total', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('81b3b938-b73e-4d24-9c7b-0a7b0bbcc92e', 'order.not_found', 'en', 'Order Not Found', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7266f6f2-780c-4104-ae02-07dc12b2df48', 'order.not_found', 'nl', 'Bestelling niet gevonden', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7eb0c758-9c3e-4b2c-951a-9028adb0a96e', 'order.check_email', 'en', 'Please check your email for order confirmation or contact support.', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d8bf1806-04db-41d6-84f3-fe499af052de', 'message.warning', 'en', 'Warning!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9f225a72-b094-44e2-a238-26e2faa45e6c', 'checkout.add_new_shipping_address', 'nl', '+ Voeg een nieuw verzendadres toe', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6573943c-484f-4fc3-9500-aafe3e55e018', 'checkout.edit_info', 'nl', 'Informatie bewerken', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1e36ff4c-607d-40e0-9878-9ed0a49a7660', 'checkout.off', 'nl', 'uit', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fadab06f-0b42-4135-a89c-f047f4221d37', 'checkout.custom_options', 'nl', 'Aangepaste opties', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('02e2d658-781c-400f-8338-40f3c8083a05', 'order.successful', 'nl', 'Uw bestelling was succesvol en wordt uitgevoerd.', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('32983750-998b-422f-89b8-3246432c9377', 'order.total_amount', 'nl', 'Totaal bedrag', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f9eef6aa-2ab1-48ec-93d9-28bee4cb42d8', 'order.details', 'nl', 'Bestelgegevens', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b4812372-56b5-41d6-8bfb-caf0da3e38e9', 'order.unit_price', 'nl', 'Eenheidsprijs', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b7080051-f4c4-406a-94c0-00b3e0286c58', 'order.check_email', 'nl', 'Controleer uw e-mail voor de orderbevestiging of neem contact op met de klantenservice.', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('051a83e3-fab8-4028-a655-f96fe51f3356', 'checkout.special_instructions_placeholder', 'nl', 'Any special instructions for delivery...', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a257b218-b37e-42a3-931f-62b5f10ffb5d', 'checkout.fee', 'nl', 'Kosten:', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2144908d-9a2b-4b3c-ae32-e1fcea02ff80', 'checkout.valid_email_required', 'nl', 'Voer een geldig e-mailadres in', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3bbf2d53-6859-4631-8b04-7dff9edb25fe', 'checkout.items_in_cart', 'nl', 'Artikelen in winkelwagen', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('89f1ff3f-ba1d-4484-b49f-76136ead2a9a', 'checkout.applied', 'nl', 'Toegepast', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('54e89ec6-4f53-459d-a6bb-ec661e4d0c34', 'common.coupon_expired', 'nl', 'Kortingsbon verlopen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('52e11021-f0ff-4f37-9267-f3d58204141b', 'checkout.continue', 'nl', 'Doorgaan', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('245ef3df-9731-4b41-89ab-8daf04625cd8', 'checkout.qty', 'nl', 'Aantal:', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('017a0c8b-6e25-4553-b092-73a3a42ca0f1', 'order.items_processing', 'nl', 'Uw bestelling wordt verwerkt...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('65db21fa-6f50-4d16-ae2c-7e61a1d203bd', 'checkout.processing', 'nl', 'Verwerken...', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9475e021-ae71-4678-b0bb-5d50af9ff11f', 'order.total', 'nl', 'Totaal bestelling', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aae295e9-7ffa-4220-a764-3e53f49488b8', 'checkout.payment_fee', 'nl', 'Betaalkosten', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f98310fa-8a06-44bb-9e00-b7cf1cae2b02', 'checkout.applied', 'en', 'Applied:', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('544cbe3d-69ec-4159-ab0f-45b4c2191d31', 'checkout.continue', 'en', 'Continue', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f8ae2f79-93d6-49e0-aec9-9e312049e9fe', 'checkout.custom_options', 'en', 'Custom Options', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a1e21a48-c153-4731-bddc-a55a87b0c74d', 'checkout.default', 'en', 'Default', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d19eff29-4e38-4c75-8032-c7b590232df8', 'checkout.default', 'nl', 'Standaard', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9bf5a6a2-4f0b-414d-b6c8-d38a1907b0df', 'checkout.edit_info', 'en', 'Edit Info', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('374f4b17-13f2-47fe-af17-451f363a6ccd', 'checkout.items_in_cart', 'en', 'Items in Cart', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c4df70c2-6946-4ee8-a911-d57e9a8c5932', 'checkout.off', 'en', 'off', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7926f9d4-0cbc-482c-b992-c0fc44728b90', 'checkout.payment_fee', 'en', 'Payment Fee', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('07e3a6fd-939c-4731-a26e-0cdfbd80ee66', 'checkout.processing', 'en', 'Processing...', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('07e9b920-bad0-482d-8637-62727ab536d0', 'message.password_mismatch', 'en', 'Passwords do not match', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8ad2a988-5678-4277-bcac-31e85846b418', 'common.coupon_not_apply', 'en', 'Coupon does not apply', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b7941f5c-d900-49e2-8cde-ec53f123ed8d', 'admin.manage', 'en', 'Manage', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('42cdf4e1-33a5-4e13-a4e9-1f800b29e6f0', 'admin.create', 'en', 'Create', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('138342fd-6db0-4757-ac5f-dada4d847c77', 'order.loading', 'en', 'Loading your order details...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4188c71a-6778-4758-869a-4fa29bd7b2c2', 'wishlist.your', 'en', 'Your Wishlist', 'wishlist', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('24f1463b-be84-4472-8f6c-ad5d8b1e5a1f', 'wishlist.items', 'en', 'Wishlist Items', 'wishlist', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('11b331c3-821d-49e4-a98f-9b52fd9bcaa9', 'wishlist.saved_for_later', 'en', 'Saved for later', 'wishlist', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5cf03a36-22c1-4b0c-9425-b729d371007e', 'wishlist.saved_for_later', 'nl', 'Bewaard voor later', 'wishlist', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b69c7265-369e-4ba7-bcce-17a62e7e4137', 'error.blacklist.login', 'en', 'Your account has been disabled. Please contact support for assistance.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d19ccf69-babb-4b0c-ba98-a2116bdd1a4e', 'common.additional_products', 'nl', 'Aanvullende producten', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('17623541-85e8-4cea-8e8a-e04ae3ca6bec', 'common.added_to_cart_error', 'nl', 'Kon niet worden toegevoegd aan winkelwagen. Probeer het opnieuw.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ad754310-2cd0-4d61-a65d-3259927490bf', 'checkout.no_saved_addresses', 'nl', 'U heeft geen opgeslagen adressen. Voeg er hieronder één toe.', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4cd31afc-c706-424b-9396-d3888e0f867f', 'common.next', 'en', 'Next', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d8bb437e-5982-4263-9d5e-eb309a4795a6', 'common.home', 'en', 'Home', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6d7db734-8d71-41ba-9344-c2db76ed07f0', 'common.view_all', 'en', 'View All', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1e0e9d67-ed78-467e-a447-ce3ba773116c', 'common.search_country', 'en', 'Search country...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ce1e02c5-afe5-4d93-aba7-829cc4a3bf1e', 'product.add_to_cart', 'en', 'Add to Cart', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b52700a3-6d8c-4042-ad4e-652df6c8cb82', 'message.invalid_email', 'en', 'Invalid email address', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('59ebfaf4-e6be-40a0-920c-1b0842a65b65', 'common.added_to_cart', 'nl', 'toegevoegd aan winkelwagen!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5b529471-d694-4e2d-96b8-2b8748885060', 'common.coupon_not_active', 'nl', 'Coupon niet actief', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e92416de-a5e7-4950-8c84-a7134345a98f', 'common.home', 'nl', 'Thuis', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c6fa580e-8055-43f2-811d-551564e7b15c', 'common.view_all', 'nl', 'Alles bekijken', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('47701d95-b8ba-4a47-8d69-00f16bf53a74', 'navigation.profile', 'nl', 'Profile', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56a7166e-2d28-4955-9f7a-37fb1c728776', 'common.search_country', 'nl', 'Zoek land...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d0bf19f1-41e9-43f0-93c1-d028ad3ced1c', 'common.no_country_found', 'nl', 'Geen land gevonden.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dce06882-6e9b-40b3-8d24-840015d90a1f', 'stock.low_stock_label', 'en', 'Low stock{, {just {quantity} {item} left}}', 'stock', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2544ec1a-65e1-4622-b7fb-061fc8f7ee56', 'checkout.save_billing_future', 'nl', 'Sla dit factuuradres op voor toekomstige bestellingen', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5711497d-d4ed-4b19-9bad-25efcac478a8', 'order.loading', 'nl', 'Uw bestelling wordt geladen...', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ad0e1981-2e4e-478e-b6be-bd95c92a2000', 'checkout.add_new_billing_address', 'nl', 'Voeg een nieuw factuuradres toe', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dabacb43-9bdd-4f55-84f9-9486abbd635e', 'checkout.enter_shipping_address', 'nl', 'Voer uw verzendadres in', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('89b492da-765f-4e8e-b802-b959c19e2dce', 'stock.out_of_stock_label', 'nl', 'Niet op voorraad', 'stock', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0c1bff7b-0821-46da-945d-7178ba031041', 'common.no_products_found_for', 'nl', 'No products found for', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7ff979c7-e102-4c9a-a0f9-0b5c94bbb8a9', 'common.additional_products', 'en', 'Additional Products', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5aad4a0b-9786-47c4-824c-a7f73e44d60b', 'message.updated', 'nl', 'Succesvol bijgewerkt', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1239dfee-fb57-42c5-a239-078f661ad6aa', 'product.name', 'nl', 'Product Name', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1fb43d40-508a-40b8-871c-21042e6d966b', 'product.total_price', 'nl', 'Totale prijs', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('71cc44ed-b84b-4491-93cd-70108f3b3687', 'common.hamidtest', 'en', 'this my first ui label', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('ad79349e-1b83-4d72-9aaf-f98ef8aa897b', 'product.reviews', 'nl', 'Recensies', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c6d4299b-4cc6-4be0-8e23-57b6206bbc8b', 'checkout.save_address_future', 'nl', 'Sla dit adres op in mijn account voor toekomstige bestellingen', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('dc71dfde-3db2-4e8f-bc58-ce27932ed600', 'product.details', 'nl', 'Productdetails', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bd51b89c-ba18-4be3-8df4-4f25d330e663', 'wishlist.items', 'nl', 'Verlanglijst', 'wishlist', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5cf9dee2-7ccc-49c1-afe8-93448c63a0e5', 'message.created', 'nl', 'Succesvol aangemaakt', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56ef5723-50f7-43e6-a787-246cd646704c', 'message.confirm_delete', 'nl', 'Weet u zeker dat u dit wilt verwijderen?', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2aff44f6-1dad-4648-9abe-64c5a77a4a94', 'wishlist.your', 'nl', 'Uw verlanglijst', 'wishlist', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e88584e5-95fd-42b0-8622-8cadf2cbfd94', 'common.shipping_method', 'nl', 'Verzendmethode', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e423adac-5a0f-4880-a372-bdabf0a42098', 'common.coupon_not_active', 'en', 'This coupon is not yet active', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('133eadd2-e0ed-4e05-b1e4-a81011265987', 'checkout.step_2step_1', 'en', 'Information', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4f5f7d02-d7d0-43b9-9b27-253efcc4cde5', 'common.sort_name_desc', 'nl', 'Naam (Z-A)', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6301212b-22c0-40de-8435-6a65560934f1', 'common.your_wishlist_is_empty', 'en', 'Your wishlist is empty.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('26429a75-6258-48a9-bc7b-a0e53dc04d51', 'common.failed_apply_coupon', 'nl', 'Coupon kon niet worden toegepast', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aba37445-b42e-41b8-93e2-7a137d0dedce', 'category.no_products_found', 'nl', 'Geen producten gevonden', 'category', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c5aaea4e-0ca3-419c-bb03-8b22d180064e', 'common.signing_in', 'nl', 'Aanmelden...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4eb51227-d53f-4458-837f-e534889597db', 'common.coupon_usage_limit', 'nl', 'Kortingsbon limiet bereikt', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ba11b18e-e47f-413a-ad59-2d4ab31aeeda', 'common.invalid_coupon', 'nl', 'Ongeldige coupon', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('166cdca8-8ca3-4224-ad53-3ae5b9055ca4', 'common.email_address', 'en', 'Email Address', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('695b0c4c-4bf4-4ea4-b446-95f8753f2a81', 'common.enter_your_email', 'en', 'Enter your email', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7be90a35-6563-4126-942b-0c2f0d5ee4c3', 'address.delivery_locations', 'nl', 'Bezorglocaties', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('be5fa057-c356-4734-946a-7fbd0ae1bea2', 'common.enter_your_password', 'en', 'Enter your password', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f8143872-7f02-413e-aadd-a30e5027d38e', 'common.first_name', 'nl', 'Voornaam', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('192dbb86-6c0b-412d-847d-1be9b5fe199e', 'common.failed_apply_coupon', 'en', 'Failed to apply coupon', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7d862253-4733-4009-a2d3-01ba451e223c', 'common.first_name', 'en', 'First Name', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('583de6cc-e41e-418e-b977-cbda9d51bae4', 'common.remember_me', 'nl', 'Onthoud me', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aec86547-a9d5-4153-9c34-85f9b93a82a6', 'common.last_name', 'en', 'Last Name', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('448753e3-f442-4c78-8f6a-bb169fd61523', 'common.last_name', 'nl', 'Achternaam', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('20dd5de7-a3c6-4773-8490-c5c92b0a9604', 'common.no_items_yet', 'en', 'No items yet', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('325fa47b-1187-4391-9c6d-e8834c481c00', 'common.no_items_yet', 'nl', 'Nog geen items', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fd6f88f4-8c70-497d-bafa-a06e1f9b528b', 'common.password', 'en', 'Password', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ef3b5b30-351b-496d-92ab-de490ebcd95e', 'common.password', 'nl', 'Wachtwoord', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('04175c37-b71d-4e0d-8206-88f84dee96f6', 'common.remember_me', 'en', 'Remember me', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4d14b2b1-a530-42f6-b321-6b5bbe56e157', 'common.signing_in', 'en', 'Signing in...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8a8c1cdd-4cf5-494a-a9b6-b53cae562100', 'common.search_results_for', 'nl', 'Zoekresultaten voor', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('83f048bc-dbe9-4800-8d9e-e43b706f8027', 'stock.in_stock_label', 'nl', 'Op voorraad {({quantity} {item} beschikbaar)}', 'stock', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e7adae03-0287-46b3-868d-5e4883bab8c0', 'address.list', 'en', 'Addresses', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c46d96ce-8484-4090-917b-100f656d814a', 'common.remove', 'nl', 'Verwijderen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('60b6afe0-d4f7-465b-99f8-40b2af98b382', 'category.no_products_found', 'en', 'No Products Found', 'category', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ea2d1369-f051-4979-99a4-380f2441125e', 'category.no_products_in_category', 'en', 'No products found in the "{category}" category.', 'category', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('54ad3e72-4cea-458e-b168-adbadae8b422', 'category.no_products_match_filters', 'en', 'No products match your current filters.', 'category', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('58578f90-c39f-42b8-8d17-ceeac5b0a809', 'product.in_stock', 'nl', 'Op voorraad', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('45e0f151-216b-44d0-9ee4-082209f3ee07', 'address.add', 'nl', 'Adres toevoegen', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('681b075e-10fd-485d-8390-802990c8806b', 'category.no_products_match_filters', 'nl', 'Geen producten komen overeen met uw huidige filters.', 'category', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d495b879-196b-4eda-b458-95147c1b169a', 'address.list', 'nl', 'Adressen', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c2489727-9b25-447c-8d25-92e4ddad1662', 'address.my', 'en', 'My Addresses', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0fe9ed69-c382-4a8f-8599-b60dc7eea9a9', 'address.saved', 'en', 'Saved Addresses', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4e256802-b04b-41c9-986e-ca439c22a731', 'address.saved', 'nl', 'Opgeslagen adressen', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('442de4fa-37f7-404e-9f11-26cca1e90cb6', 'address.delivery_locations', 'en', 'Delivery locations', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('eec84e2e-4f37-4c61-b463-73903b676994', 'address.add', 'en', 'Add Address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cb58104a-33d1-4041-b2fe-da0a853519d8', 'address.edit', 'en', 'Edit Address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d9c9f576-49ae-4096-9ff4-5b8ba2017401', 'address.add_new', 'en', 'Add New Address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9a03da24-2808-49c2-bce3-db31dedb4324', 'address.add_new', 'nl', 'Nieuw adres toevoegen', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1315ca8e-67cc-485f-af90-24fce71e06a2', 'address.update', 'en', 'Update Address', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a6d4a587-1c2b-4629-aaf3-d0bcea912356', 'common.subtotal', 'nl', 'Subtotaal', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cc55fca5-1249-480c-9f2c-bda859319539', 'common.enter_your_password', 'nl', 'Voer uw wachtwoord in', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('186042cd-c3d1-46fe-930f-eac413d4259e', 'common.coupon_not_apply', 'nl', 'Kortingscode is niet geldig', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('632e03ab-91ad-4ecc-81d6-0fa836164a7e', 'common.login_failed', 'nl', 'Inloggen mislukt', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f43d3b63-7956-418b-871d-3ae86cd69e2f', 'common.email_address', 'nl', 'E-mailadres', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7954d6c0-e043-4418-b4fe-17cc990c1bba', 'common.to_cart', 'nl', 'naar winkelwagen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e29edaaf-daf6-4460-b8c4-a0434bdabab3', 'common.minimum_order_required', 'nl', 'Minimale bestelling vereist', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4fa31928-bdb2-475a-ac94-c454f5e51773', 'common.store_info_not_available', 'nl', 'Winkelinformatie niet beschikbaar', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7202e576-95fe-4909-88d7-7a08c6feeace', 'common.your_wishlist_is_empty', 'nl', 'Je verlanglijst is leeg.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2b5e3a2c-63af-4af6-b407-8e1b19831f9f', 'cart.item_removed', 'nl', 'Item removed from cart.', 'cart', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('54afe958-e6c3-402c-8f3e-7e7ab5f8835a', 'address.edit', 'nl', 'Adres bewerken', 'address', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3c727eb9-a1d0-458c-96f3-d14fe0bf8338', 'common.saving', 'en', 'Saving...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56020422-a209-41f7-8795-967ef8e6b808', 'common.details', 'en', 'Details', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3c36b186-918d-4498-ab4e-70017a43e809', 'common.less', 'en', 'Less', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2c0fbb56-349e-4efe-9771-a4a97f58c4c8', 'common.each', 'en', 'each', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d715f8c8-9da4-4d23-b135-3b25925002c5', 'common.method', 'en', 'Method', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('03dd7f7f-58a0-4ac9-b75e-d195c5ba07c4', 'common.method', 'nl', 'Methode', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d8582444-af32-4fab-ac02-c855c0f4fcb7', 'common.phone', 'en', 'Phone', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('caf58d73-adbb-43a9-961f-27f0d5b61b63', 'common.phone', 'nl', 'Telefoon', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('67d42866-cecc-4faa-b851-24dd2e7c01c7', 'common.country', 'nl', 'Land', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ef83411d-d20f-45e9-b27b-8f03463fc40f', 'common.creating', 'en', 'Creating...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('afd87d87-b96e-443c-9b40-6d2cb2b930fa', 'common.unknown_product', 'en', 'Unknown Product', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e3befcdd-4650-48f7-afb8-fd02fdb2b672', 'common.unknown_product', 'nl', 'Onbekend product', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6acdcdf4-94e9-4281-916d-ef5c2134b495', 'common.all_time', 'en', 'All time', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('893f171b-9193-4c97-b31f-350f409edd75', 'common.status', 'en', 'Status', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('299c4eee-e393-4028-b36e-7053ccb56d15', 'common.qty', 'en', 'Qty', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('97e1a5a2-86b1-4e09-a8d3-e032c11d1b28', 'product.buy_now', 'nl', 'Koop nu', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('51e787d8-868c-4620-970c-9f525d6a93e2', 'order.your_orders', 'en', 'Orders', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d8b90cef-caa4-4fca-9bd2-938bcf4b1ee0', 'common.qty', 'nl', 'Aantal', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0c34a76a-14a9-4986-98d2-101eebb68cd1', 'common.billing_address', 'en', 'Billing Address', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fb8528b7-aaa9-4b37-a925-4a1de4dcbfdc', 'common.billing_address', 'nl', 'Factuuradres', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('663899dc-c3cf-4ebb-b331-3715ab6bfc60', 'common.creating', 'nl', 'Bezig met maken...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('41530bad-4331-4496-9686-2dd58d895a84', 'common.sku', 'en', 'SKU', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d5c7407f-d633-4de4-8486-7ec732aa37ae', 'common.sku', 'nl', 'SKU', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('537278e8-db77-44a4-9ba9-3a934f56b776', 'checkout.payment_method', 'en', 'Payment Method', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('d73eee14-5d3a-4f03-aca5-b61e61c06261', 'common.product', 'en', 'Product', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e30b909b-57b1-4ae6-b084-20eb7b91c007', 'common.product', 'nl', 'Product', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6ccfbe9e-776f-4914-9f0a-b7d98b9f28c6', 'common.options', 'en', 'Options', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3b85af9f-2631-449a-86c7-bd67035f72ac', 'common.options', 'nl', 'Opties', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8e8e6a1b-8c66-48cf-9a33-2096afb71286', 'account.my_account', 'en', 'My Account', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('92903f0d-0f5b-44f6-9952-b5758cbb9484', 'account.manage', 'en', 'Manage your account, orders, and preferences', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('34298d33-2d72-48cb-b62e-669da73250d9', 'account.overview', 'en', 'Overview', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ce708c1c-a222-466c-b6b4-f24afcd9e47f', 'account.sign_out', 'en', 'Sign Out', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5f86c956-59d2-4f7e-8082-b6faf37f090f', 'account.welcome_to_store', 'en', 'Welcome to SprShop', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b6394edf-8da3-416f-a038-e7a9adc3ea84', 'account.welcome_to_store', 'nl', 'Welkom bij SprShop', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('833adb10-4d32-42fa-91e1-06c956258801', 'account.discover_products', 'en', 'Discover our premium products and services', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1951ecc2-8738-40fa-b523-82f5e299e502', 'account.discover_products', 'nl', 'Ontdek onze premium producten en diensten', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f8f2acda-0d96-406b-8d7a-5fb7c145f97b', 'account.welcome_guest', 'en', 'Welcome, Guest!', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1741aee2-3ee4-4061-a54d-1b42730713c3', 'product.quick_view', 'nl', 'Snel bekijken', 'product', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1467bef4-841c-4aa3-b5a3-acaae2650112', 'account.create_new', 'en', 'Create New Account', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('24669258-26e5-4ddc-bb8c-6d11fcbd5a49', 'order.total_orders', 'en', 'Total Orders', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b0326300-5a7e-4168-ae57-fe056eb00291', 'order.no_orders_yet', 'en', 'No orders yet', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('24edb17e-4e9f-42e2-a4cf-29068864adb7', 'order.no_orders_yet', 'nl', 'Nog geen bestellingen', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3edb7767-620b-45cd-b0cd-4041963ce3e7', 'order.order_history', 'en', 'Your order history will appear here once you make a purchase.', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3a7843bf-5c04-4568-bc18-b1a4107a06cb', 'order.number', 'en', 'Order', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f087f61d-a2cf-4ff1-a9da-ecc1caa881f5', 'account.welcome_guest', 'nl', 'Welkom, Gast!', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0015534f-bd0b-4bda-8eab-b1935a46e378', 'common.details', 'nl', 'Details', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7843d7b9-20cb-44e2-9d3f-d049ca482fbc', 'stock.in_stock_label', 'en', 'In Stock {({quantity} {item} available)}', 'stock', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('425283cd-5baf-4b43-a443-85edd2852658', 'common.saving', 'nl', 'Opslaan...', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ba6a343a-6300-472b-a193-c8ef46883d71', 'common.each', 'nl', 'elk', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1f63d68f-62f3-443e-be00-9751c121eb0f', 'common.all_time', 'nl', 'Alle tijd', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('fe732240-9d4c-41b7-b3c1-fd939e891fce', 'common.country', 'en', 'Select Country', 'common', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('207075c6-ba3c-4d17-a142-fb59b14e0e83', 'account.create_new', 'nl', 'Maak een nieuw account', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('008ba61b-69fa-4879-a393-474f1e47614a', 'account.manage', 'nl', 'Beheer uw account, bestellingen en voorkeuren', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('726e54af-17d3-4e7e-96a2-f98ed998e93a', 'account.overview', 'nl', 'Overzicht', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('888ea7da-4c47-4e56-a469-9d0daa5fe205', 'account.my_account', 'nl', 'Mijn account', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('3a017962-3075-40ad-941a-5af7dbc1609d', 'common.less', 'nl', 'Minder', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6f7bc492-0040-452c-ad9a-535adfb60363', 'account.sign_out', 'nl', 'Afmelden', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8933c922-37c3-40a0-8467-556836a2b49a', 'order.order_history', 'nl', 'Uw bestelgeschiedenis wordt hier weergegeven zodra u een aankoop heeft gedaan.', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b6ecef19-6879-4c95-80fc-db50128a6ce6', 'order.your_orders', 'nl', 'Orders', 'order', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6ee8db98-6c85-4ddd-8512-361f5bac7125', 'common.status', 'nl', 'Status', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c8e8e88c-1931-4cc0-9256-1be45ff30b9a', 'success.order_placed', 'en', 'Your order has been successfully placed', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a9043ecf-8fcc-41c4-bc36-25720b626101', 'success.confirmation_sent', 'nl', 'Een bevestigingse-mail is verzonden naar', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('658f7a13-afed-4fc0-a83c-6846b071b024', 'success.confirmation_sent', 'en', 'A confirmation email has been sent to', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('195c3ad0-9f87-4585-bba6-f9d41456dcc9', 'success.create_description', 'nl', 'Maak een account aan met je e-mail', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('56a0de09-6fa6-4436-81df-844a46c894a9', 'success.download_invoice', 'en', 'Download Invoice', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('99eaeb67-746f-4700-8e62-2caccbb5894f', 'common.item', 'nl', 'artikel', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('eb1394cf-d4eb-41d3-8acd-b4b724c2e860', 'success.welcome_message', 'nl', 'Welkom! Uw account is met succes aangemaakt met e-mail:', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5e5c8ded-f671-47f5-b337-5af8fb234326', 'success.create_description', 'en', 'Create an account using your email', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7dca135e-85eb-4df4-a0c1-441209b3318b', 'common.items', 'nl', 'artikelen', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7d47ff17-145a-423d-b2c6-8bbef47bbaf1', 'success.auto_logged_in', 'nl', 'Je bent automatisch ingelogd', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9e004179-b010-4112-aa59-a28555176258', 'success.account_created', 'en', 'Your Account is Now Created!', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('52b4d7cf-b842-4c77-88b6-c5d92cf7df7d', 'success.welcome_message', 'en', 'Welcome! Your account has been successfully created with email:', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2bc17730-5cff-4b10-9927-442c028f5049', 'success.addresses_saved', 'nl', 'Uw verzend- en factuuradres zijn opgeslagen', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('941169dc-8174-4950-bd0e-71984757c972', 'success.account_created', 'nl', 'Uw account is nu aangemaakt!', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('96498520-7f4c-43e7-bcf3-2f0f9c30b84f', 'success.welcome_email_sent', 'en', 'A welcome email has been sent to your inbox', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('aa50e8f7-2139-4cac-9518-cb73ac75f7ca', 'common.pieces', 'nl', 'stukken', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1a1744b1-53dc-4f80-9b35-d618b6701fcc', 'success.addresses_saved', 'en', 'Your shipping and billing addresses have been saved', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cd12f626-977b-4953-bda9-7b9593191946', 'success.order_placed', 'nl', 'Uw bestelling is succesvol geplaatst', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6b22f6fb-9f3c-4163-ab88-c49563c8472f', 'success.track_profile', 'en', 'You can now track your orders and manage your profile', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1eca9d23-5df7-4db4-a068-d1078c265426', 'common.piece', 'nl', 'stuk', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1f179af5-dcfc-4b30-a22f-b3fa3d5edc1e', 'success.view_orders', 'en', 'View My Orders', 'order_success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('264e055e-0a71-4f51-b2cb-e57a2cddba38', 'checkout.step_2step_1', 'nl', 'Informatie', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1abb9f06-a9ff-451d-bfac-e31706f847eb', 'common.item', 'en', 'item', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cb4ac080-d3c5-416c-8770-d7e10f98d082', 'common.items', 'en', 'items', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('989059e2-a388-4d5c-a796-e2a01832ce6d', 'common.unit', 'en', 'unit', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f19d8f35-43f6-41bf-a318-546ae6ebebf1', 'common.units', 'en', 'units', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0623841b-ec8b-428b-ba3d-f66588252e3b', 'common.piece', 'en', 'piece', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('86329823-5043-4d61-9cd1-7370891e0dc4', 'common.pieces', 'en', 'pieces', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1a49707f-1440-4e7f-ab0c-616653be9f38', 'common.item', 'de', 'Artikel', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e409d5e4-d3ce-41d2-aea6-c89605212543', 'common.items', 'de', 'Artikel', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bab10a10-c0b5-4e89-8620-413366472f8e', 'common.unit', 'de', 'Einheit', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('20056ac2-8309-4714-b4c1-02f89151058f', 'common.units', 'de', 'Einheiten', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6522016a-7440-4741-af5c-d879d3d7b56b', 'common.piece', 'de', 'Stück', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7b33b32a-e248-4cb5-b57c-a8ea2cb0e20c', 'common.pieces', 'de', 'Stücke', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bae96121-81b8-4dc5-a638-a14b83f19aa8', 'common.item', 'fr', 'article', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('53b914db-2e6d-4acf-8fc9-c721064a6180', 'common.items', 'fr', 'articles', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cf696e27-50ec-4c1e-b8a2-b37b70cc1eac', 'common.unit', 'fr', 'unité', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a3536ca0-b196-486b-865e-54ec33476a67', 'common.units', 'fr', 'unités', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d8fab0c9-86f3-4df5-8af2-a3d109b82def', 'common.piece', 'fr', 'pièce', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7a1e1e75-4981-42e9-9888-9faad2fa9d5a', 'common.pieces', 'fr', 'pièces', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('22fff1fc-8f8d-4bf7-8b05-179723d3c7ef', 'common.item', 'es', 'artículo', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d4452a0a-02ec-4cab-8cb5-37aff7499fa4', 'common.items', 'es', 'artículos', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4817fc99-277d-4f9d-ac57-b71c5664f45b', 'common.unit', 'es', 'unidad', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('287a02db-18d6-49d7-8239-ead24ec05e62', 'common.units', 'es', 'unidades', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d5bee18d-14e7-407a-a5e9-341f0fb4c5d0', 'common.piece', 'es', 'pieza', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0522a579-1b25-4a6e-b304-355a287d6a1b', 'common.pieces', 'es', 'piezas', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('947e9005-fd05-4e43-a320-af8f6eaa57e9', 'common.item', 'it', 'articolo', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0a416cdd-362b-4f6b-a970-f158925f5a4c', 'common.items', 'it', 'articoli', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6b7f1bc4-9072-48d6-a5c6-336f96b2691c', 'common.unit', 'it', 'unità', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ef868c3c-0f2d-4bc9-a7d8-73452d7c7bf7', 'common.units', 'it', 'unità', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9fd03484-f696-4c99-bab6-246e1732b5bd', 'common.piece', 'it', 'pezzo', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bcd438d6-7db0-41e2-adb0-c55c19e551cf', 'common.pieces', 'it', 'pezzi', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ae664ea0-ce3a-4ad1-ac94-d600f8aed74a', 'common.unit', 'nl', 'unit', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d6fd9ae3-d3e7-424f-856d-08ca9a9eb634', 'success.download_invoice', 'nl', 'Download Invoice', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('97500660-ed26-41e0-95f9-bf863f841207', 'success.view_orders', 'nl', 'Bekijk mijn bestellingen', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('db35f407-2f7c-4868-9f28-a8423af4e914', 'checkout.cart', 'nl', 'Winkelwagen', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f02cd58c-1b1f-4660-9d0c-d3bceabfbc79', 'message.no_results', 'nl', 'Geen resultaten gevonden', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8183935a-e6d6-40a1-a554-04bf09664c60', 'checkout.step_3step_1', 'nl', 'gggggg', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d08f7c23-5917-406a-b4e6-aca09a7dc9dc', 'success.track_profile', 'nl', 'U kunt nu uw bestellingen volgen en uw profiel beheren', 'success', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9b60244f-73ee-47bc-8cfa-8f62b57f50ab', 'message.invalid_email', 'nl', 'Ongeldig e-mailadres', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('71d6b55f-bc00-4a03-88af-856e4cc5c4c7', 'message.password_mismatch', 'nl', 'Wachtwoorden komen niet overeen', 'message', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c607e79c-678b-4552-bf56-9f6b3f6fe75c', 'admin.update', 'nl', 'Bijwerken', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6b462800-78b2-4286-933a-37ed1ec5d633', 'admin.list', 'nl', 'Lijst', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4e2428c8-ce2e-4ec0-ba4c-880b67a0cecc', 'admin.bulk_actions', 'nl', 'Bulkacties', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4746c2de-275b-4666-9d25-a19eada7917e', 'admin.import', 'nl', 'Importeren', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('1fe9b161-6909-4f92-8130-bd3788e86e5e', 'admin.translations', 'nl', 'Vertalingen', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('d05bb6d2-3765-402d-99b7-ec6b9a7b12fa', 'admin.languages', 'nl', 'Talen', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0dcb332b-7444-41f1-a80d-8b5d98cde4eb', 'common.payment_status', 'en', 'Payment status', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'custom', '00000000-0000-0000-0000-000000000000'),
  ('dc8fc6fe-3a42-4f2a-9884-bbb7c3b416a7', 'common.no_country_found', 'en', 'No country found.', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5be9a089-569f-4fea-bb8d-ad8ae5a2b686', 'common.view_all_results_for', 'en', 'View all results for', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8c7658e1-28c7-4ca8-aa22-6d9bce943e10', 'common.search_results_for', 'en', 'Search Results for', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8b99a508-735f-4c53-bd8b-18da69c450f5', 'common.no_products_found_for', 'en', 'No products found for', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ceca15f4-87ad-414b-9087-23c1a1abaa02', 'navigation.dashboard', 'en', 'Dashboard', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('81293cb6-cdc2-4599-a5b0-a16190dbeee0', 'navigation.products', 'en', 'Products', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5d9d2de9-125f-4b0e-8ea4-815ad7ba8d83', 'navigation.categories', 'en', 'Categories', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e2442618-b5da-468f-bdcb-158c951f0534', 'navigation.customers', 'en', 'Customers', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('2e9796e7-dcf9-4ce4-9552-8e37a83b6012', 'navigation.settings', 'en', 'Settings', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('25bea726-37d4-4e4b-b9e8-e63395c68811', 'navigation.login', 'en', 'Login', 'navigation', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4e1c29bf-965d-4b98-b2de-8d31c3ca10ff', 'checkout.shipping_fee', 'en', 'Shipping Fee', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b234b7df-092b-4a78-b8ce-6cbe3709169e', 'checkout.proceed_to_checkout', 'en', 'Proceed to Checkout', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4007d86a-f667-42a3-9046-97fdaef89d21', 'account.address', 'en', 'Address', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ff35696b-6755-4fc0-be27-361357170c3c', 'account.city', 'en', 'City', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('e7c7cb8c-0120-4dfd-9adc-b45e0f33ca35', 'account.register', 'en', 'Register', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7c4297e0-7722-4160-a8ce-9042a30529bf', 'account.sign_up', 'en', 'Sign Up', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8d887ad9-188f-4595-a529-3939d6d9027a', 'account.reset_password', 'en', 'Reset Password', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5db31261-f1b1-4f64-9222-4d786491ae4e', 'account.my_orders', 'en', 'My Orders', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('0bfc650a-bef5-4daf-adc8-eeb89788d64a', 'account.order_history', 'en', 'Order History', 'account', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8629a65e-53ab-4576-bc8c-47529951f0db', 'message.success', 'en', 'Success!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('20789e57-aece-4d67-984c-635b253698cc', 'message.error', 'en', 'Error!', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('9d30d9b4-c025-4d74-a162-be7be3144fbc', 'message.info', 'en', 'Info', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('8c67ef12-6e4a-45ed-a9ea-1174144bebf2', 'message.saved', 'en', 'Saved successfully', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('cb5edeee-a328-495a-b31d-12c471d467eb', 'message.deleted', 'en', 'Deleted successfully', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('4739c22f-fb70-4ea3-a2a3-33c1d778ba4e', 'message.updated', 'en', 'Updated successfully', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f9972d67-b0d2-4f5d-8d0c-acdb2a500208', 'message.created', 'en', 'Created successfully', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('5b885130-3bdd-4a8f-96ae-5a701bfe3ee4', 'message.confirm_delete', 'en', 'Are you sure you want to delete this?', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('f0b3204a-6ae5-4157-81c8-10812363a68b', 'message.no_results', 'en', 'No results found', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('83d0b547-052f-4b19-8641-7749d16482c7', 'message.required_field', 'en', 'This field is required', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('bc0a3d47-75f5-431d-ac0f-20da54573bba', 'admin.update', 'en', 'Update', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('a0a6ce56-910f-4e6b-8b5e-008bdcc79017', 'admin.list', 'en', 'List', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c01fd81d-5a4b-459b-97e6-7e79cfbe5390', 'admin.bulk_actions', 'en', 'Bulk Actions', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ca372c10-e75a-4435-b4b6-fdf0077da96a', 'admin.analytics', 'nl', 'Analyses', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b1440c03-995d-4b29-865a-717daee8f37c', 'common.payment_status', 'nl', 'Betaalstatus', 'common', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('10ef9af9-7f2c-44e7-ae0b-1c7132c7ef9a', 'admin.manage', 'nl', 'Beheren', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('92f7e0c6-909e-4416-8572-2e53aade91b6', 'admin.reports', 'nl', 'Rapporten', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('eaf60c20-e86d-411f-a99a-f0c4dfe06502', 'admin.create', 'nl', 'Maak', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c4ac4af5-4faa-4205-b673-7e1ac9bde473', 'admin.export', 'nl', 'Exporteren', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b408682a-0d8e-4c7d-9408-6c12289737c4', 'category.no_products_in_category', 'nl', 'Geen producten gevonden in de "{category}" categorie.', 'category', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6f22ef40-4f1d-478f-91a0-6cb8fc1778a9', 'admin.export', 'en', 'Export', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ab6ff58e-8909-424c-b614-0e3635fbc1d0', 'admin.import', 'en', 'Import', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ec3126e7-0c5e-401a-a81b-34463f06f098', 'admin.reports', 'en', 'Reports', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('ad6c96d9-38e2-4e66-a597-749b4fccc5e2', 'admin.analytics', 'en', 'Analytics', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('b69bb1a9-c29e-4adf-bd4d-6cda9e14d4b6', 'admin.translations', 'en', 'Translations', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('6a61c3e6-bbbb-42f7-85d9-79b421ebdf1d', 'admin.languages', 'en', 'Languages', 'admin', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('83995ee0-bfcd-44fd-8233-fae13353c9cc', 'error.blacklist.ip', 'en', 'Your request cannot be processed. Please contact support for assistance.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7faa03f6-5a18-43be-9a60-2a0250cd85a2', 'error.blacklist.country', 'en', 'Orders from your location cannot be processed at this time. Please contact support for assistance.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('c1c93867-5a86-4283-9705-b367ccd0d0d1', 'error.blacklist.ip', 'nl', 'Uw verzoek kan niet worden verwerkt. Neem contact op met de ondersteuning voor hulp.', 'error', '2025-11-07T18:34:17.198Z', '2025-11-07T18:34:17.198Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('074e7fa7-d66c-44d6-9fdd-a7afe1beed9a', 'checkout.step_3step_1', 'en', 'Information', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('92597919-c7fd-4907-9bbb-51d9997f373c', 'account.forgot_password', 'en', 'Forgot password?', 'account', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('42ab27b9-1a5b-419d-94bb-efb5a21d44b5', 'checkout.enter_shipping_address', 'en', 'Enter shipping address', 'checkout', '2025-11-07T18:34:17.198Z', '2025-11-12T22:28:53.341Z', 'system', '00000000-0000-0000-0000-000000000000'),
  ('7a0aaef5-a0ce-411e-878a-c71312f1399e', 'checkout.login_for_faster_checkout', 'nl', 'Heb je al een account? Login om sneller af te rekenen', 'checkout', '2025-11-12T19:31:07.848Z', '2025-11-12T19:31:07.848Z', 'system', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;
