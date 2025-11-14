-- ============================================
-- TENANT DATABASE COMPLETE SCHEMA
-- Auto-generated from existing database
-- ============================================

CREATE TYPE enum_ab_tests_status AS ENUM (
    'draft',
    'running',
    'paused',
    'completed',
    'archived'
);

CREATE TYPE enum_addresses_type AS ENUM (
    'billing',
    'shipping',
    'both'
);

CREATE TYPE enum_akeneo_custom_mappings_mapping_type AS ENUM (
    'attributes',
    'images',
    'files'
);

CREATE TYPE enum_akeneo_schedules_import_type AS ENUM (
    'attributes',
    'families',
    'categories',
    'products',
    'all'
);

CREATE TYPE enum_akeneo_schedules_schedule_type AS ENUM (
    'once',
    'hourly',
    'daily',
    'weekly',
    'monthly'
);

CREATE TYPE enum_akeneo_schedules_status AS ENUM (
    'scheduled',
    'running',
    'completed',
    'failed',
    'paused'
);

CREATE TYPE enum_ast_diffs_change_type AS ENUM (
    'addition',
    'modification',
    'deletion',
    'refactor',
    'style'
);

CREATE TYPE enum_ast_diffs_status AS ENUM (
    'draft',
    'applied',
    'rejected',
    'reverted'
);

CREATE TYPE enum_attributes_filter_type AS ENUM (
    'multiselect',
    'slider',
    'select'
);

CREATE TYPE enum_attributes_type AS ENUM (
    'text',
    'number',
    'select',
    'multiselect',
    'boolean',
    'date',
    'file',
    'image'
);

CREATE TYPE enum_consent_logs_consent_method AS ENUM (
    'accept_all',
    'reject_all',
    'custom'
);

CREATE TYPE enum_cookie_consent_settings_banner_position AS ENUM (
    'top',
    'bottom',
    'center'
);

CREATE TYPE enum_cookie_consent_settings_theme AS ENUM (
    'light',
    'dark',
    'custom'
);

CREATE TYPE enum_coupons_discount_type AS ENUM (
    'fixed',
    'percentage',
    'buy_x_get_y',
    'free_shipping'
);

CREATE TYPE enum_credit_transactions_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);

CREATE TYPE enum_credit_transactions_transaction_type AS ENUM (
    'purchase',
    'bonus',
    'refund'
);

CREATE TYPE enum_credit_usage_usage_type AS ENUM (
    'akeneo_schedule',
    'akeneo_manual',
    'other'
);

CREATE TYPE enum_custom_analytics_events_event_category AS ENUM (
    'ecommerce',
    'engagement',
    'conversion',
    'navigation',
    'custom'
);

CREATE TYPE enum_custom_analytics_events_trigger_type AS ENUM (
    'page_load',
    'click',
    'form_submit',
    'scroll',
    'timer',
    'custom',
    'automatic'
);

CREATE TYPE enum_custom_domains_ssl_status AS ENUM (
    'pending',
    'active',
    'failed',
    'expired',
    'renewing'
);

CREATE TYPE enum_custom_domains_verification_method AS ENUM (
    'txt',
    'cname',
    'http'
);

CREATE TYPE enum_custom_domains_verification_status AS ENUM (
    'pending',
    'verifying',
    'verified',
    'failed'
);


CREATE TYPE enum_customer_activities_activity_type AS ENUM (
    'page_view',
    'product_view',
    'add_to_cart',
    'remove_from_cart',
    'checkout_started',
    'order_completed',
    'search'
);

CREATE TYPE enum_customer_activities_device_type AS ENUM (
    'desktop',
    'tablet',
    'mobile'
);

CREATE TYPE enum_customer_addresses_type AS ENUM (
    'billing',
    'shipping',
    'both'
);

CREATE TYPE enum_customization_rollbacks_rollback_type AS ENUM (
    'full_rollback',
    'selective_rollback',
    'cherry_pick'
);

CREATE TYPE enum_customization_snapshots_change_type AS ENUM (
    'initial',
    'ai_modification',
    'manual_edit',
    'rollback',
    'merge'
);

CREATE TYPE enum_customization_snapshots_status AS ENUM (
    'open',
    'finalized'
);

CREATE TYPE enum_heatmap_interactions_device_type AS ENUM (
    'desktop',
    'tablet',
    'mobile'
);

CREATE TYPE enum_heatmap_interactions_interaction_type AS ENUM (
    'click',
    'hover',
    'scroll',
    'mouse_move',
    'touch',
    'focus',
    'key_press'
);

CREATE TYPE enum_heatmap_sessions_device_type AS ENUM (
    'desktop',
    'tablet',
    'mobile'
);

CREATE TYPE enum_hybrid_customizations_deployment_status AS ENUM (
    'draft',
    'deployed',
    'failed',
    'pending',
    'rolled_back'
);

CREATE TYPE enum_hybrid_customizations_status AS ENUM (
    'active',
    'archived',
    'rolled_back'
);

CREATE TYPE enum_integration_configs_connection_status AS ENUM (
    'untested',
    'success',
    'failed'
);

CREATE TYPE enum_integration_configs_sync_status AS ENUM (
    'idle',
    'syncing',
    'success',
    'error'
);

CREATE TYPE enum_job_history_status AS ENUM (
    'started',
    'progress_update',
    'completed',
    'failed',
    'retried',
    'cancelled'
);

CREATE TYPE enum_jobs_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);

CREATE TYPE enum_jobs_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE enum_marketplace_credentials_marketplace AS ENUM (
    'amazon',
    'ebay',
    'google_shopping',
    'facebook',
    'instagram'
);

CREATE TYPE enum_marketplace_credentials_status AS ENUM (
    'active',
    'inactive',
    'error',
    'testing'
);

CREATE TYPE enum_orders_fulfillment_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE enum_orders_payment_status AS ENUM (
    'pending',
    'paid',
    'partially_paid',
    'refunded',
    'failed'
);

CREATE TYPE enum_orders_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TYPE enum_payment_methods_availability AS ENUM (
    'all',
    'specific_countries'
);

CREATE TYPE enum_payment_methods_fee_type AS ENUM (
    'fixed',
    'percentage',
    'none'
);

CREATE TYPE enum_payment_methods_payment_flow AS ENUM (
    'online',
    'offline'
);

CREATE TYPE enum_payment_methods_type AS ENUM (
    'credit_card',
    'debit_card',
    'paypal',
    'stripe',
    'bank_transfer',
    'cash_on_delivery',
    'other'
);

CREATE TYPE enum_product_labels_position AS ENUM (
    'top-left',
    'top-right',
    'top-center',
    'center-left',
    'center-right',
    'bottom-left',
    'bottom-right',
    'center',
    'bottom-center'
);

CREATE TYPE enum_product_tabs_tab_type AS ENUM (
    'text',
    'description',
    'attributes',
    'attribute_sets'
);

CREATE TYPE enum_products_status AS ENUM (
    'draft',
    'active',
    'inactive'
);

CREATE TYPE enum_products_type AS ENUM (
    'simple',
    'configurable',
    'bundle',
    'grouped',
    'virtual',
    'downloadable'
);

CREATE TYPE enum_products_visibility AS ENUM (
    'visible',
    'hidden'
);

CREATE TYPE enum_redirects_entity_type AS ENUM (
    'category',
    'product',
    'cms_page'
);

CREATE TYPE enum_redirects_type AS ENUM (
    '301',
    '302',
    '307',
    '308'
);

CREATE TYPE enum_sales_invoices_email_status AS ENUM (
    'sent',
    'failed',
    'bounced',
    'delivered'
);

CREATE TYPE enum_sales_orders_fulfillment_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

CREATE TYPE enum_sales_orders_payment_status AS ENUM (
    'pending',
    'paid',
    'partially_paid',
    'refunded',
    'failed'
);

CREATE TYPE enum_sales_orders_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TYPE enum_sales_shipments_email_status AS ENUM (
    'sent',
    'failed',
    'bounced',
    'delivered'
);

CREATE TYPE enum_seo_templates_page_type AS ENUM (
    'home',
    'product',
    'category',
    'cms',
    'search',
    'cart',
    'checkout'
);

CREATE TYPE enum_seo_templates_type AS ENUM (
    'product',
    'category',
    'cms',
    'cms_page',
    'homepage',
    'brand',
    'blog_post'
);

CREATE TYPE enum_service_credit_costs_billing_type AS ENUM (
    'per_day',
    'per_use',
    'per_month',
    'per_hour',
    'per_item',
    'per_mb',
    'flat_rate'
);

CREATE TYPE enum_service_credit_costs_service_category AS ENUM (
    'store_operations',
    'plugin_management',
    'ai_services',
    'data_migration',
    'storage',
    'akeneo_integration',
    'other'
);

CREATE TYPE enum_shipping_methods_availability AS ENUM (
    'all',
    'specific_countries'
);

CREATE TYPE enum_shipping_methods_type AS ENUM (
    'flat_rate',
    'free_shipping',
    'weight_based',
    'price_based'
);

CREATE TYPE enum_slot_configurations_status AS ENUM (
    'draft',
    'acceptance',
    'published',
    'reverted'
);

CREATE TYPE enum_snapshot_status AS ENUM (
    'open',
    'finalized'
);

CREATE TYPE enum_store_data_migrations_migration_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'paused'
);

CREATE TYPE enum_store_invitations_role AS ENUM (
    'admin',
    'editor',
    'viewer'
);

CREATE TYPE enum_store_invitations_status AS ENUM (
    'pending',
    'accepted',
    'expired',
    'cancelled'
);

CREATE TYPE enum_store_routes_route_type AS ENUM (
    'core',
    'custom',
    'cms_page',
    'product_detail',
    'category'
);

CREATE TYPE enum_store_routes_target_type AS ENUM (
    'component',
    'cms_page',
    'external_url',
    'redirect'
);

CREATE TYPE enum_store_supabase_connections_connection_status AS ENUM (
    'active',
    'inactive',
    'error'
);

CREATE TYPE enum_store_teams_role AS ENUM (
    'owner',
    'admin',
    'editor',
    'viewer'
);

CREATE TYPE enum_store_teams_status AS ENUM (
    'pending',
    'active',
    'suspended',
    'removed'
);

CREATE TYPE enum_store_templates_type AS ENUM (
    'category',
    'product',
    'checkout',
    'homepage',
    'custom'
);

CREATE TYPE enum_stores_deployment_status AS ENUM (
    'draft',
    'deployed',
    'published',
    'failed'
);

CREATE TYPE enum_template_assets_asset_type AS ENUM (
    'javascript',
    'css',
    'image',
    'font',
    'other'
);

CREATE TYPE enum_users_account_type AS ENUM (
    'agency',
    'individual',
    'customer'
);

CREATE TYPE enum_users_role AS ENUM (
    'admin',
    'store_owner',
    'customer'
);

CREATE TYPE service_category AS ENUM (
    'store_operations',
    'plugin_management',
    'ai_services',
    'data_migration',
    'storage',
    'akeneo_integration',
    'other'
);

CREATE TABLE IF NOT EXISTS _migrations (
  name VARCHAR(255) PRIMARY KEY,
  run_at TIMESTAMP DEFAULT NOW(),
  filename VARCHAR(255),
  executed_at TIMESTAMP DEFAULT NOW(),
  checksum VARCHAR(64),
  execution_time_ms INTEGER
);

CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY,
  test_id UUID NOT NULL,
  store_id UUID NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID,
  variant_id VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value NUMERIC,
  metrics JSON DEFAULT '{}'::json,
  device_type VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(255),
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  patch_release_id UUID,
  traffic_percentage INTEGER DEFAULT 50 NOT NULL,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  conversion_goals JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,
  status enum_ab_tests_status DEFAULT 'draft'::enum_ab_tests_status,
  variants JSON DEFAULT '[]'::json NOT NULL,
  traffic_allocation DOUBLE PRECISION DEFAULT '1'::double precision,
  targeting_rules JSON,
  primary_metric VARCHAR(255) NOT NULL,
  secondary_metrics JSON DEFAULT '[]'::json,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  min_sample_size INTEGER DEFAULT 100,
  confidence_level DOUBLE PRECISION DEFAULT '0.95'::double precision,
  winner_variant_id VARCHAR(255),
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_navigation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nav_key VARCHAR(100) NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  custom_label VARCHAR(255),
  custom_icon VARCHAR(50),
  custom_order INTEGER,
  custom_badge JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_navigation_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  route VARCHAR(255),
  parent_key VARCHAR(100),
  order_position INTEGER DEFAULT 0,
  is_core BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  plugin_id UUID,
  category VARCHAR(50),
  required_permission VARCHAR(100),
  description TEXT,
  badge_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(50) DEFAULT 'standard'::character varying
);

CREATE TABLE IF NOT EXISTS ai_code_patterns (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pattern_type VARCHAR(100) NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language VARCHAR(50) DEFAULT 'javascript'::character varying,
  framework VARCHAR(100),
  parameters JSONB DEFAULT '[]'::jsonb,
  example_usage TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  embedding_vector TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_context_documents (
  id INTEGER PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0,
  mode VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  store_id INTEGER,
  embedding_vector TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_context_usage (
  id INTEGER PRIMARY KEY,
  document_id INTEGER,
  example_id INTEGER,
  pattern_id INTEGER,
  user_id INTEGER,
  session_id VARCHAR(255),
  query TEXT,
  was_helpful BOOLEAN,
  generated_plugin_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_plugin_examples (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  complexity VARCHAR(20) DEFAULT 'simple'::character varying,
  code TEXT NOT NULL,
  files JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  use_cases JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  rating NUMERIC,
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  embedding_vector TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  model_used VARCHAR(100),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  session_id VARCHAR(255),
  store_id INTEGER,
  preferred_mode VARCHAR(50),
  coding_style JSONB DEFAULT '{}'::jsonb,
  favorite_patterns JSONB DEFAULT '[]'::jsonb,
  recent_plugins JSONB DEFAULT '[]'::jsonb,
  categories_interest JSONB DEFAULT '[]'::jsonb,
  context_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS akeneo_custom_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  mapping_type VARCHAR(50) NOT NULL,
  mappings JSON DEFAULT '[]'::json NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS akeneo_import_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  import_type VARCHAR(50) NOT NULL,
  import_date TIMESTAMP DEFAULT NOW() NOT NULL,
  total_processed INTEGER DEFAULT 0 NOT NULL,
  successful_imports INTEGER DEFAULT 0 NOT NULL,
  failed_imports INTEGER DEFAULT 0 NOT NULL,
  skipped_imports INTEGER DEFAULT 0 NOT NULL,
  import_source VARCHAR(100) DEFAULT 'akeneo'::character varying,
  import_method VARCHAR(50) DEFAULT 'manual'::character varying,
  error_details TEXT,
  processing_time_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS akeneo_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  akeneo_code VARCHAR(255) NOT NULL,
  akeneo_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_slug VARCHAR(255),
  store_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  mapping_source VARCHAR(50) DEFAULT 'auto'::character varying,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS akeneo_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  import_type enum_akeneo_schedules_import_type NOT NULL,
  schedule_type enum_akeneo_schedules_schedule_type DEFAULT 'once'::enum_akeneo_schedules_schedule_type NOT NULL,
  schedule_time VARCHAR(50),
  schedule_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  filters JSONB DEFAULT '{}'::jsonb NOT NULL,
  options JSONB DEFAULT '{}'::jsonb NOT NULL,
  status enum_akeneo_schedules_status DEFAULT 'scheduled'::enum_akeneo_schedules_status NOT NULL,
  last_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  credit_cost NUMERIC DEFAULT 0.1 NOT NULL,
  last_credit_usage UUID
);

CREATE TABLE IF NOT EXISTS attribute_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  store_id UUID NOT NULL,
  attribute_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attribute_translations (
  attribute_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attribute_value_translations (
  attribute_value_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  value VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS attribute_values (
  id UUID PRIMARY KEY,
  attribute_id UUID NOT NULL,
  code VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'text'::character varying,
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT false,
  is_searchable BOOLEAN DEFAULT false,
  is_usable_in_conditions BOOLEAN DEFAULT false,
  filter_type VARCHAR(20),
  file_settings JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  store_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_configurable BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS blacklist_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(100),
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blacklist_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blacklist_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blacklist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  block_by_ip BOOLEAN DEFAULT false,
  block_by_email BOOLEAN DEFAULT true,
  block_by_country BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brevo_configurations (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS canonical_urls (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  page_url VARCHAR(255) NOT NULL,
  canonical_url VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255),
  store_id UUID NOT NULL,
  user_id UUID,
  items JSON DEFAULT '[]'::json,
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  coupon_code VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  slug VARCHAR(255) NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  hide_in_menu BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  meta_robots_tag VARCHAR(100) DEFAULT 'index, follow'::character varying,
  parent_id UUID,
  level INTEGER DEFAULT 0,
  path TEXT,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  akeneo_code VARCHAR(255),
  seo JSON DEFAULT '{}'::json
);

CREATE TABLE IF NOT EXISTS category_seo (
  category_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  meta_robots_tag VARCHAR(100) DEFAULT 'index, follow'::character varying,
  og_title VARCHAR(255),
  og_description TEXT,
  og_image_url VARCHAR(500),
  twitter_title VARCHAR(255),
  twitter_description TEXT,
  twitter_image_url VARCHAR(500),
  canonical_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS category_translations (
  category_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'offline'::character varying,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open'::character varying,
  assigned_agent_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  message_text TEXT NOT NULL,
  sender_type VARCHAR(50) NOT NULL,
  sender_id UUID,
  sender_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  user_type VARCHAR(50) NOT NULL,
  user_id UUID,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_block_translations (
  cms_block_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  title VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_blocks (
  id UUID PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(255),
  store_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  placement JSONB DEFAULT '["content"]'::jsonb
);

CREATE TABLE IF NOT EXISTS cms_page_seo (
  cms_page_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  meta_robots_tag VARCHAR(100) DEFAULT 'index, follow'::character varying,
  og_title VARCHAR(255),
  og_description TEXT,
  og_image_url VARCHAR(500),
  twitter_title VARCHAR(255),
  twitter_description TEXT,
  twitter_image_url VARCHAR(500),
  canonical_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_page_translations (
  cms_page_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  excerpt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(255),
  meta_robots_tag VARCHAR(50) DEFAULT 'index, follow'::character varying,
  store_id UUID NOT NULL,
  related_product_ids JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMP,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_system BOOLEAN DEFAULT false,
  seo JSON DEFAULT '{}'::json
);

CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID,
  store_id UUID NOT NULL,
  ip_address VARCHAR(255),
  user_agent TEXT,
  consent_given BOOLEAN NOT NULL,
  categories_accepted JSON DEFAULT '[]'::json NOT NULL,
  country_code VARCHAR(2),
  consent_method enum_consent_logs_consent_method NOT NULL,
  page_url TEXT,
  created_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS cookie_consent_settings (
  id UUID PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT true,
  banner_position enum_cookie_consent_settings_banner_position DEFAULT 'bottom'::enum_cookie_consent_settings_banner_position,
  banner_text TEXT,
  privacy_policy_url VARCHAR(255),
  accept_button_text VARCHAR(255) DEFAULT 'Accept All'::character varying,
  reject_button_text VARCHAR(255) DEFAULT 'Reject All'::character varying,
  settings_button_text VARCHAR(255) DEFAULT 'Cookie Settings'::character varying,
  necessary_cookies BOOLEAN DEFAULT true,
  analytics_cookies BOOLEAN DEFAULT false,
  marketing_cookies BOOLEAN DEFAULT false,
  functional_cookies BOOLEAN DEFAULT false,
  theme enum_cookie_consent_settings_theme DEFAULT 'light'::enum_cookie_consent_settings_theme,
  primary_color VARCHAR(255) DEFAULT '#007bff'::character varying,
  background_color VARCHAR(255) DEFAULT '#ffffff'::character varying,
  text_color VARCHAR(255) DEFAULT '#333333'::character varying,
  gdpr_mode BOOLEAN DEFAULT true,
  auto_detect_country BOOLEAN DEFAULT true,
  audit_enabled BOOLEAN DEFAULT true,
  consent_expiry_days INTEGER DEFAULT 365,
  show_close_button BOOLEAN DEFAULT true,
  privacy_policy_text VARCHAR(255) DEFAULT 'Privacy Policy'::character varying,
  categories JSON,
  gdpr_countries JSON,
  google_analytics_id VARCHAR(255),
  google_tag_manager_id VARCHAR(255),
  custom_css TEXT,
  store_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  translations JSONB DEFAULT '{}'::jsonb,
  accept_button_bg_color VARCHAR(255) DEFAULT '#2563eb'::character varying,
  accept_button_text_color VARCHAR(255) DEFAULT '#ffffff'::character varying,
  reject_button_bg_color VARCHAR(255) DEFAULT '#ffffff'::character varying,
  reject_button_text_color VARCHAR(255) DEFAULT '#374151'::character varying,
  save_preferences_button_bg_color VARCHAR(255) DEFAULT '#16a34a'::character varying,
  save_preferences_button_text_color VARCHAR(255) DEFAULT '#ffffff'::character varying
);

CREATE TABLE IF NOT EXISTS cookie_consent_settings_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cookie_consent_settings_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  banner_text TEXT,
  accept_button_text VARCHAR(255),
  reject_button_text VARCHAR(255),
  settings_button_text VARCHAR(255),
  privacy_policy_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  necessary_name VARCHAR(255),
  necessary_description TEXT,
  analytics_name VARCHAR(255),
  analytics_description TEXT,
  marketing_name VARCHAR(255),
  marketing_description TEXT,
  functional_name VARCHAR(255),
  functional_description TEXT,
  save_preferences_button_text VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS coupon_translations (
  coupon_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) DEFAULT 'fixed'::character varying NOT NULL,
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER DEFAULT 100,
  usage_count INTEGER DEFAULT 0,
  min_purchase_amount NUMERIC,
  max_discount_amount NUMERIC,
  start_date DATE,
  end_date DATE,
  buy_quantity INTEGER DEFAULT 1,
  get_quantity INTEGER DEFAULT 1,
  store_id UUID NOT NULL,
  applicable_products JSONB DEFAULT '[]'::jsonb,
  applicable_categories JSONB DEFAULT '[]'::jsonb,
  applicable_skus JSONB DEFAULT '[]'::jsonb,
  applicable_attribute_sets JSONB DEFAULT '[]'::jsonb,
  applicable_attributes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  translations JSON DEFAULT '{}'::json
);

CREATE TABLE IF NOT EXISTS credit_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd'::character varying NOT NULL,
  stripe_price_id VARCHAR(255),
  popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  amount_usd NUMERIC NOT NULL,
  credits_purchased NUMERIC NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending'::character varying NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  credits_used NUMERIC NOT NULL,
  usage_type VARCHAR(50) NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cron_job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_job_id UUID NOT NULL,
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL,
  result JSON,
  error_message TEXT,
  error_stack TEXT,
  triggered_by VARCHAR(50) DEFAULT 'scheduler'::character varying,
  triggered_by_user UUID,
  server_instance VARCHAR(100),
  memory_usage_mb NUMERIC,
  cpu_time_ms INTEGER,
  metadata JSON DEFAULT '{}'::json
);

CREATE TABLE IF NOT EXISTS cron_job_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  configuration_schema JSON NOT NULL,
  default_configuration JSON DEFAULT '{}'::json,
  is_enabled BOOLEAN DEFAULT true,
  category VARCHAR(100) DEFAULT 'general'::character varying,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC'::character varying,
  job_type VARCHAR(100) NOT NULL,
  configuration JSON NOT NULL,
  user_id UUID NOT NULL,
  store_id UUID,
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_status VARCHAR(20),
  last_error TEXT,
  last_result JSON,
  max_runs INTEGER,
  max_failures INTEGER DEFAULT 5,
  consecutive_failures INTEGER DEFAULT 0,
  timeout_seconds INTEGER DEFAULT 300,
  tags VARCHAR(500),
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_system BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS custom_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  event_category enum_custom_analytics_events_event_category DEFAULT 'custom'::enum_custom_analytics_events_event_category,
  trigger_type enum_custom_analytics_events_trigger_type NOT NULL,
  trigger_selector VARCHAR(255),
  trigger_condition JSON,
  event_parameters JSON DEFAULT '{}'::json NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  is_system BOOLEAN DEFAULT false,
  fire_once_per_session BOOLEAN DEFAULT false,
  send_to_backend BOOLEAN DEFAULT true,
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  domain VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  dns_configured BOOLEAN DEFAULT false,
  dns_provider VARCHAR(100),
  verification_status enum_custom_domains_verification_status DEFAULT 'pending'::enum_custom_domains_verification_status,
  verification_method enum_custom_domains_verification_method DEFAULT 'txt'::enum_custom_domains_verification_method,
  verification_token VARCHAR(255),
  verification_record_name VARCHAR(255),
  verification_record_value VARCHAR(500),
  verified_at TIMESTAMP WITH TIME ZONE,
  ssl_status enum_custom_domains_ssl_status DEFAULT 'pending'::enum_custom_domains_ssl_status,
  ssl_provider VARCHAR(50) DEFAULT 'letsencrypt'::character varying,
  ssl_certificate_id VARCHAR(255),
  ssl_issued_at TIMESTAMP WITH TIME ZONE,
  ssl_expires_at TIMESTAMP WITH TIME ZONE,
  ssl_auto_renew BOOLEAN DEFAULT true,
  dns_records JSONB DEFAULT '[]'::jsonb,
  cname_target VARCHAR(255),
  redirect_to_https BOOLEAN DEFAULT true,
  redirect_to_primary BOOLEAN DEFAULT false,
  custom_headers JSONB DEFAULT '{}'::jsonb,
  custom_rewrites JSONB DEFAULT '[]'::jsonb,
  cdn_enabled BOOLEAN DEFAULT false,
  cdn_provider VARCHAR(50),
  cdn_config JSONB DEFAULT '{}'::jsonb,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_option_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  display_label VARCHAR(255) DEFAULT 'Custom Options'::character varying,
  is_active BOOLEAN DEFAULT true,
  conditions JSONB DEFAULT '{}'::jsonb,
  optional_product_ids JSONB DEFAULT '[]'::jsonb,
  store_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  translations JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS custom_pricing_discounts (
  id INTEGER PRIMARY KEY,
  rule_id INTEGER,
  discount_type VARCHAR(50) NOT NULL,
  discount_value NUMERIC,
  minimum_amount NUMERIC,
  minimum_quantity INTEGER,
  applies_to VARCHAR(50) DEFAULT 'item'::character varying,
  conditions JSONB DEFAULT '{}'::jsonb,
  stackable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_pricing_logs (
  id INTEGER PRIMARY KEY,
  rule_id INTEGER,
  event_type VARCHAR(50),
  original_price NUMERIC,
  final_price NUMERIC,
  discount_amount NUMERIC DEFAULT 0,
  customer_id VARCHAR(255),
  product_id VARCHAR(255),
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_pricing_rules (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 10,
  conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '{}'::jsonb,
  store_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_activities (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  store_id UUID NOT NULL,
  user_id UUID,
  activity_type enum_customer_activities_activity_type NOT NULL,
  page_url VARCHAR(255),
  referrer VARCHAR(255),
  product_id UUID,
  search_query VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(255),
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  country VARCHAR(2),
  country_name VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  language VARCHAR(10),
  timezone VARCHAR(50),
  device_type VARCHAR(20),
  browser_name VARCHAR(100),
  operating_system VARCHAR(100),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY,
  type enum_customer_addresses_type DEFAULT 'both'::enum_customer_addresses_type NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  street VARCHAR(255) NOT NULL,
  street_2 VARCHAR(255),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  postal_code VARCHAR(255) NOT NULL,
  country VARCHAR(255) DEFAULT 'US'::character varying NOT NULL,
  phone VARCHAR(255),
  email VARCHAR(255),
  is_default BOOLEAN DEFAULT false NOT NULL,
  user_id UUID,
  customer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(10),
  notes TEXT,
  total_spent NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value NUMERIC DEFAULT 0,
  last_order_date TIMESTAMP,
  tags JSONB DEFAULT '[]'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  password VARCHAR(255),
  avatar_url VARCHAR(255),
  last_login TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  role VARCHAR(50) DEFAULT 'customer'::character varying,
  account_type VARCHAR(50) DEFAULT 'individual'::character varying,
  customer_type VARCHAR(20) DEFAULT 'guest'::character varying NOT NULL,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  blacklisted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enable_delivery_date BOOLEAN DEFAULT true,
  enable_comments BOOLEAN DEFAULT true,
  offset_days INTEGER DEFAULT 1,
  max_advance_days INTEGER DEFAULT 30,
  blocked_dates JSONB DEFAULT '[]'::jsonb,
  blocked_weekdays JSONB DEFAULT '[]'::jsonb,
  out_of_office_start DATE,
  out_of_office_end DATE,
  delivery_time_slots JSONB DEFAULT '[{"end_time": "12:00", "is_active": true, "start_time": "09:00"}, {"end_time": "17:00", "is_active": true, "start_time": "13:00"}]'::jsonb,
  store_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_send_logs (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  email_template_id UUID,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending'::character varying NOT NULL,
  brevo_message_id VARCHAR(255),
  error_message TEXT,
  metadata JSON DEFAULT '{}'::json,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS email_template_translations (
  id UUID PRIMARY KEY,
  email_template_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_content TEXT,
  html_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  identifier VARCHAR(100) NOT NULL,
  content_type VARCHAR(20) DEFAULT 'template'::character varying NOT NULL,
  variables JSON DEFAULT '[]'::json,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  attachment_enabled BOOLEAN DEFAULT false,
  attachment_config JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_system BOOLEAN DEFAULT false NOT NULL,
  default_subject VARCHAR(255),
  default_template_content TEXT,
  default_html_content TEXT
);

CREATE TABLE IF NOT EXISTS heatmap_aggregations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  page_url TEXT NOT NULL,
  aggregation_period VARCHAR(20) NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  interaction_type VARCHAR(50) NOT NULL,
  x_coordinate INTEGER NOT NULL,
  y_coordinate INTEGER NOT NULL,
  interaction_count INTEGER DEFAULT 1 NOT NULL,
  unique_sessions INTEGER DEFAULT 1 NOT NULL,
  avg_time_on_element NUMERIC,
  device_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heatmap_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  store_id UUID NOT NULL,
  user_id UUID,
  page_url TEXT NOT NULL,
  page_title VARCHAR(500),
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  interaction_type VARCHAR(50) NOT NULL,
  x_coordinate INTEGER,
  y_coordinate INTEGER,
  element_selector TEXT,
  element_tag VARCHAR(50),
  element_id VARCHAR(255),
  element_class VARCHAR(500),
  element_text TEXT,
  scroll_position INTEGER,
  scroll_depth_percent NUMERIC,
  time_on_element INTEGER,
  device_type VARCHAR(20),
  user_agent TEXT,
  ip_address INET,
  timestamp_utc TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heatmap_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  store_id UUID NOT NULL,
  user_id UUID,
  first_page_url TEXT,
  last_page_url TEXT,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER,
  page_count INTEGER DEFAULT 1,
  interaction_count INTEGER DEFAULT 0,
  bounce_session BOOLEAN DEFAULT false,
  conversion_session BOOLEAN DEFAULT false,
  device_type VARCHAR(20),
  browser_name VARCHAR(100),
  operating_system VARCHAR(100),
  referrer_url TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY,
  store_id UUID,
  integration_type VARCHAR(50),
  config_data JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  sync_status enum_integration_configs_sync_status DEFAULT 'idle'::enum_integration_configs_sync_status,
  sync_error TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connection_status VARCHAR(20) DEFAULT 'untested'::character varying,
  connection_tested_at TIMESTAMP,
  connection_error TEXT
);

CREATE TABLE IF NOT EXISTS job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL,
  message TEXT,
  progress NUMERIC,
  result JSON,
  error JSON,
  metadata JSON DEFAULT '{}'::json NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal'::character varying NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'::character varying NOT NULL,
  payload JSON DEFAULT '{}'::json NOT NULL,
  result JSON,
  scheduled_at TIMESTAMP DEFAULT NOW() NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  max_retries INTEGER DEFAULT 3 NOT NULL,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  last_error TEXT,
  store_id UUID,
  user_id UUID,
  metadata JSON DEFAULT '{}'::json NOT NULL,
  progress NUMERIC DEFAULT 0,
  progress_message VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  native_name VARCHAR(255),
  flag VARCHAR(255),
  is_rtl BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  translations JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  action VARCHAR(50) DEFAULT 'login'::character varying,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  folder VARCHAR(100) DEFAULT 'library'::character varying,
  tags JSON DEFAULT '{}'::json,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID,
  usage_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_method_translations (
  payment_method_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(255) NOT NULL,
  type enum_payment_methods_type DEFAULT 'credit_card'::enum_payment_methods_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  fee_type enum_payment_methods_fee_type DEFAULT 'none'::enum_payment_methods_fee_type,
  fee_amount NUMERIC DEFAULT 0,
  min_amount NUMERIC,
  max_amount NUMERIC,
  availability enum_payment_methods_availability DEFAULT 'all'::enum_payment_methods_availability,
  countries JSONB DEFAULT '[]'::jsonb,
  store_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  payment_flow VARCHAR(20) DEFAULT 'offline'::character varying
);

CREATE TABLE IF NOT EXISTS pdf_template_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_template_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  html_template TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdf_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  identifier VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  default_html_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  variables JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CREATE TABLE IF NOT EXISTS platform_admins (
--   id UUID PRIMARY KEY,
--   user_id UUID NOT NULL,
--   role VARCHAR(50) DEFAULT 'support'::character varying NOT NULL,
--   permissions JSONB DEFAULT '{}'::jsonb,
--   is_active BOOLEAN DEFAULT true,
--   last_login_at TIMESTAMP WITH TIME ZONE,
--   login_count INTEGER DEFAULT 0,
--   mfa_enabled BOOLEAN DEFAULT false,
--   mfa_secret VARCHAR(255),
--   notes TEXT,
--   metadata JSONB DEFAULT '{}'::jsonb,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL
-- );

CREATE TABLE IF NOT EXISTS plugin_admin_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  page_key VARCHAR(255) NOT NULL,
  page_name VARCHAR(255) NOT NULL,
  route VARCHAR(500) NOT NULL,
  component_code TEXT NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(100),
  order_position INTEGER DEFAULT 100,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_admin_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  script_name VARCHAR(255) NOT NULL,
  script_code TEXT NOT NULL,
  description TEXT,
  load_order INTEGER DEFAULT 100,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_configurations (
  id UUID PRIMARY KEY,
  plugin_id VARCHAR(255),
  store_id UUID,
  is_enabled BOOLEAN DEFAULT false,
  config_data JSONB DEFAULT '{}'::jsonb,
  last_configured_by UUID,
  last_configured_at TIMESTAMP WITH TIME ZONE,
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(50),
  error_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS plugin_controllers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  controller_name VARCHAR(255) NOT NULL,
  description TEXT,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  handler_code TEXT NOT NULL,
  request_schema JSONB,
  response_schema JSONB,
  requires_auth BOOLEAN DEFAULT false,
  allowed_roles JSONB,
  rate_limit INTEGER DEFAULT 100,
  is_enabled BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  data_key VARCHAR(255) NOT NULL,
  data_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_dependencies (
  id INTEGER PRIMARY KEY,
  plugin_id VARCHAR(255),
  package_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  bundled_code TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  doc_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  format VARCHAR(20) DEFAULT 'markdown'::character varying,
  description TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  description TEXT,
  schema_definition JSONB NOT NULL,
  migration_status VARCHAR(50) DEFAULT 'pending'::character varying,
  migration_version VARCHAR(50),
  migrated_at TIMESTAMP WITH TIME ZONE,
  create_table_sql TEXT,
  drop_table_sql TEXT,
  model_code TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  listener_function TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS plugin_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  hook_name VARCHAR(255) NOT NULL,
  hook_type VARCHAR(20) DEFAULT 'filter'::character varying NOT NULL,
  handler_function TEXT NOT NULL,
  priority INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  long_description TEXT,
  author_id UUID,
  author_name VARCHAR(255),
  category VARCHAR(100),
  pricing_model VARCHAR(50) DEFAULT 'free'::character varying NOT NULL,
  base_price NUMERIC DEFAULT 0.00,
  monthly_price NUMERIC,
  yearly_price NUMERIC,
  currency VARCHAR(3) DEFAULT 'USD'::character varying,
  license_type VARCHAR(50) DEFAULT 'per_store'::character varying,
  trial_days INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending'::character varying,
  downloads INTEGER DEFAULT 0,
  active_installations INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0.00,
  reviews_count INTEGER DEFAULT 0,
  icon_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  plugin_structure JSONB,
  dependencies JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS plugin_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  plugin_name VARCHAR(255) NOT NULL,
  migration_name VARCHAR(255) NOT NULL,
  migration_version VARCHAR(50) NOT NULL,
  migration_description TEXT,
  status VARCHAR(50) DEFAULT 'pending'::character varying,
  executed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  execution_time_ms INTEGER,
  error_message TEXT,
  checksum VARCHAR(64),
  up_sql TEXT,
  down_sql TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_registry (
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'custom'::character varying,
  category VARCHAR(50) DEFAULT 'utility'::character varying,
  author VARCHAR(255),
  status VARCHAR(50) DEFAULT 'inactive'::character varying,
  security_level VARCHAR(50) DEFAULT 'sandboxed'::character varying,
  framework VARCHAR(50) DEFAULT 'react'::character varying,
  manifest JSONB DEFAULT '{}'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  installed_at TIMESTAMP DEFAULT NOW(),
  last_activated TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  id UUID PRIMARY KEY,
  creator_id UUID,
  is_installed BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT false,
  slug VARCHAR(255),
  is_starter_template BOOLEAN DEFAULT false,
  starter_icon VARCHAR(10),
  starter_description TEXT,
  starter_prompt TEXT,
  starter_order INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  deprecated_at TIMESTAMP,
  deprecation_reason TEXT
);

CREATE TABLE IF NOT EXISTS plugin_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id VARCHAR(255) NOT NULL,
  script_type VARCHAR(20) NOT NULL,
  scope VARCHAR(20) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_content TEXT NOT NULL,
  load_priority INTEGER DEFAULT 10,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_version_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  from_version_id UUID NOT NULL,
  to_version_id UUID NOT NULL,
  files_changed INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  components_added INTEGER DEFAULT 0,
  components_modified INTEGER DEFAULT 0,
  components_deleted INTEGER DEFAULT 0,
  diff_summary JSONB,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cache_ttl INTEGER DEFAULT 3600
);

CREATE TABLE IF NOT EXISTS plugin_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  version_number VARCHAR(50) NOT NULL,
  version_type VARCHAR(20) DEFAULT 'patch'::character varying NOT NULL,
  parent_version_id UUID,
  commit_message TEXT,
  changelog TEXT,
  created_by UUID,
  created_by_name VARCHAR(255),
  is_current BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  snapshot_distance INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS plugin_version_patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL,
  plugin_id UUID NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  component_id UUID,
  component_name VARCHAR(255),
  patch_operations JSONB NOT NULL,
  change_type VARCHAR(20),
  reverse_patch JSONB,
  operations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_version_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL,
  plugin_id UUID NOT NULL,
  snapshot_data JSONB NOT NULL,
  hooks JSONB,
  events JSONB,
  scripts JSONB,
  widgets JSONB,
  controllers JSONB,
  entities JSONB,
  migrations JSONB,
  admin_pages JSONB,
  manifest JSONB,
  registry JSONB,
  is_compressed BOOLEAN DEFAULT false,
  compression_type VARCHAR(20),
  total_size_bytes INTEGER,
  compressed_size_bytes INTEGER,
  component_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_version_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL,
  plugin_id UUID NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  tag_type VARCHAR(50),
  description TEXT,
  created_by UUID,
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID NOT NULL,
  widget_id VARCHAR(255) NOT NULL,
  widget_name VARCHAR(255) NOT NULL,
  description TEXT,
  component_code TEXT NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  category VARCHAR(100),
  icon VARCHAR(50),
  preview_image TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugins (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  category VARCHAR(100),
  type VARCHAR(50) DEFAULT 'plugin'::character varying,
  source_type VARCHAR(50) DEFAULT 'local'::character varying,
  source_url TEXT,
  install_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'available'::character varying,
  is_installed BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT false,
  config_schema JSONB,
  config_data JSONB DEFAULT '{}'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '[]'::jsonb,
  manifest JSONB,
  installation_log TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status VARCHAR(50),
  installed_at TIMESTAMP WITH TIME ZONE,
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS product_attribute_values (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  attribute_id UUID NOT NULL,
  value_id UUID,
  text_value TEXT,
  number_value NUMERIC,
  date_value TIMESTAMP WITH TIME ZONE,
  boolean_value BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS product_label_translations (
  product_label_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255),
  text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS product_labels (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  text VARCHAR(255) NOT NULL,
  color VARCHAR(255) DEFAULT '#000000'::character varying,
  background_color VARCHAR(255) DEFAULT '#FFFFFF'::character varying,
  position enum_product_labels_position DEFAULT 'top-left'::enum_product_labels_position,
  is_active BOOLEAN DEFAULT true,
  conditions JSON DEFAULT '{}'::json,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS product_seo (
  product_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  meta_robots_tag VARCHAR(100) DEFAULT 'index, follow'::character varying,
  og_title VARCHAR(255),
  og_description TEXT,
  og_image_url VARCHAR(500),
  twitter_title VARCHAR(255),
  twitter_description TEXT,
  twitter_image_url VARCHAR(500),
  canonical_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS product_tab_translations (
  product_tab_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS product_tabs (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  tab_type VARCHAR(20) DEFAULT 'text'::character varying NOT NULL,
  attribute_ids JSONB DEFAULT '[]'::jsonb,
  attribute_set_ids JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS product_translations (
  product_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id UUID NOT NULL,
  variant_product_id UUID NOT NULL,
  attribute_values JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  barcode VARCHAR(255),
  short_description TEXT,
  price NUMERIC,
  compare_price NUMERIC,
  cost_price NUMERIC,
  weight NUMERIC,
  dimensions JSONB,
  images JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft'::character varying,
  visibility VARCHAR(20) DEFAULT 'visible'::character varying,
  manage_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  allow_backorders BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 5,
  infinite_stock BOOLEAN DEFAULT false,
  is_custom_option BOOLEAN DEFAULT false,
  is_coupon_eligible BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]'::jsonb,
  attributes JSONB DEFAULT '{}'::jsonb,
  seo JSONB DEFAULT '{}'::jsonb,
  store_id UUID NOT NULL,
  attribute_set_id UUID,
  category_ids JSONB DEFAULT '[]'::jsonb,
  related_product_ids JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  type VARCHAR(50) DEFAULT 'simple'::character varying,
  parent_id UUID,
  configurable_attributes JSONB DEFAULT '[]'::jsonb,
  external_id VARCHAR(255),
  external_source VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  from_url VARCHAR(500) NOT NULL,
  to_url VARCHAR(500) NOT NULL,
  type VARCHAR(3) DEFAULT '301'::character varying NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  entity_type VARCHAR(50),
  entity_id UUID,
  created_by UUID,
  notes TEXT,
  hit_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR(255) NOT NULL,
  order_id UUID NOT NULL,
  store_id UUID NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  pdf_generated BOOLEAN DEFAULT false,
  pdf_url TEXT,
  email_status enum_sales_invoices_email_status DEFAULT 'sent'::enum_sales_invoices_email_status,
  error_message TEXT,
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY,
  quantity INTEGER DEFAULT 1 NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(255) NOT NULL,
  product_image VARCHAR(255),
  product_attributes JSON DEFAULT '{}'::json,
  selected_options JSON DEFAULT '[]'::json,
  original_price NUMERIC,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(255) NOT NULL,
  status enum_sales_orders_status DEFAULT 'pending'::enum_sales_orders_status,
  payment_status enum_sales_orders_payment_status DEFAULT 'pending'::enum_sales_orders_payment_status,
  fulfillment_status enum_sales_orders_fulfillment_status DEFAULT 'pending'::enum_sales_orders_fulfillment_status,
  customer_id UUID,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(255),
  billing_address JSON NOT NULL,
  shipping_address JSON NOT NULL,
  subtotal NUMERIC DEFAULT 0 NOT NULL,
  tax_amount NUMERIC DEFAULT 0 NOT NULL,
  shipping_amount NUMERIC DEFAULT 0 NOT NULL,
  discount_amount NUMERIC DEFAULT 0 NOT NULL,
  payment_fee_amount NUMERIC DEFAULT 0 NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency VARCHAR(255) DEFAULT 'USD'::character varying NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE,
  delivery_time_slot VARCHAR(255),
  delivery_instructions TEXT,
  payment_method VARCHAR(255),
  payment_reference VARCHAR(255),
  shipping_method VARCHAR(255),
  tracking_number VARCHAR(255),
  coupon_code VARCHAR(255),
  notes TEXT,
  admin_notes TEXT,
  confirmation_email_sent_at TIMESTAMP WITH TIME ZONE,
  store_id UUID NOT NULL,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_shipments (
  id UUID PRIMARY KEY,
  shipment_number VARCHAR(255) NOT NULL,
  order_id UUID NOT NULL,
  store_id UUID NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  tracking_number VARCHAR(255),
  tracking_url TEXT,
  carrier VARCHAR(255),
  shipping_method VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  email_status enum_sales_shipments_email_status DEFAULT 'sent'::enum_sales_shipments_email_status,
  error_message TEXT,
  metadata JSON DEFAULT '{}'::json,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  robots_txt_content TEXT,
  hreflang_settings JSONB DEFAULT '[]'::jsonb,
  social_media_settings JSON DEFAULT '{"open_graph":{"enabled":true,"default_title":"","default_description":"","default_image_url":"","facebook_app_id":"","facebook_page_url":""},"twitter":{"enabled":true,"card_type":"summary_large_image","site_username":"","creator_username":""},"social_profiles":{"facebook":"","twitter":"","instagram":"","linkedin":"","youtube":"","pinterest":"","tiktok":"","other":[]},"schema":{"enable_product_schema":true,"enable_organization_schema":true,"enable_breadcrumb_schema":true,"organization_name":"","organization_logo_url":"","organization_description":"","contact_type":"customer service","contact_telephone":"","contact_email":"","price_range":"","founded_year":"","founder_name":""}}'::json,
  xml_sitemap_settings JSON DEFAULT '{"enabled":true,"include_products":true,"include_categories":true,"include_pages":true,"include_images":false,"include_videos":false,"enable_news":false,"enable_index":false,"max_urls":50000,"google_search_console_api_key":"","auto_submit":false}'::json,
  html_sitemap_settings JSON DEFAULT '{"enabled":true,"include_products":true,"include_categories":true,"include_pages":true,"max_products":20,"product_sort":"-updated_date"}'::json,
  default_meta_settings JSON DEFAULT '{"meta_title":"","meta_description":"","meta_keywords":"","meta_robots":"index, follow"}'::json,
  canonical_settings JSONB DEFAULT '{"base_url": "", "auto_canonical_filtered_pages": true}'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS seo_templates (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type enum_seo_templates_type NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  og_title VARCHAR(255),
  og_description TEXT,
  sort_order INTEGER DEFAULT 0,
  conditions JSON DEFAULT '{"categories":[],"attribute_sets":[]}'::json,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  template JSON DEFAULT '{}'::json
);

CREATE TABLE IF NOT EXISTS shipping_method_translations (
  shipping_method_id UUID PRIMARY KEY,
  language_code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  type VARCHAR(20) DEFAULT 'flat_rate'::character varying NOT NULL,
  flat_rate_cost NUMERIC DEFAULT 0,
  free_shipping_min_order NUMERIC DEFAULT 0,
  weight_ranges JSONB DEFAULT '[]'::jsonb,
  price_ranges JSONB DEFAULT '[]'::jsonb,
  availability VARCHAR(20) DEFAULT 'all'::character varying,
  countries JSONB DEFAULT '[]'::jsonb,
  min_delivery_days INTEGER DEFAULT 1,
  max_delivery_days INTEGER DEFAULT 7,
  store_id UUID NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  translations JSON DEFAULT '{}'::json,
  conditions JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS shopify_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  shop_domain VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  shop_id BIGINT,
  shop_name VARCHAR(255),
  shop_email VARCHAR(255),
  shop_country VARCHAR(2),
  shop_currency VARCHAR(3),
  shop_timezone VARCHAR(100),
  plan_name VARCHAR(100),
  webhook_endpoint_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  client_id VARCHAR(255),
  client_secret TEXT,
  redirect_uri TEXT
);

CREATE TABLE IF NOT EXISTS slot_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  configuration JSONB NOT NULL,
  version VARCHAR(255) DEFAULT '1.0'::character varying NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  status VARCHAR(20) DEFAULT 'init'::character varying NOT NULL,
  version_number INTEGER DEFAULT 1 NOT NULL,
  page_type VARCHAR(255) DEFAULT 'cart'::character varying,
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID,
  acceptance_published_at TIMESTAMP WITH TIME ZONE,
  acceptance_published_by UUID,
  current_edit_id UUID,
  parent_version_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  has_unpublished_changes BOOLEAN DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS store_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  invited_email VARCHAR(255) NOT NULL,
  invited_by UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer'::character varying NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  invitation_token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by UUID,
  status VARCHAR(20) DEFAULT 'pending'::character varying NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer'::character varying NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  invited_by UUID,
  invited_at TIMESTAMP,
  accepted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'::character varying NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_uptime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  user_id UUID NOT NULL,
  charged_date DATE DEFAULT CURRENT_DATE NOT NULL,
  credits_charged NUMERIC DEFAULT 1.00 NOT NULL,
  user_balance_before NUMERIC,
  user_balance_after NUMERIC,
  store_name VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  banner_url VARCHAR(255),
  theme_color VARCHAR(255) DEFAULT '#3B82F6'::character varying,
  currency VARCHAR(255) DEFAULT 'USD'::character varying,
  timezone VARCHAR(255) DEFAULT 'UTC'::character varying,
  is_active BOOLEAN DEFAULT true,
  settings JSON DEFAULT '{}'::json,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  postal_code VARCHAR(255),
  country VARCHAR(255),
  website_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_account_id VARCHAR(255),
  user_id UUID NOT NULL,
  deployment_status deployment_status_enum DEFAULT 'draft'::deployment_status_enum,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE
);

-- CREATE TABLE IF NOT EXISTS subscriptions (
--   id UUID PRIMARY KEY,
--   store_id UUID NOT NULL,
--   plan_name VARCHAR(50) NOT NULL,
--   status VARCHAR(50) DEFAULT 'trial'::character varying NOT NULL,
--   price_monthly NUMERIC,
--   price_annual NUMERIC,
--   billing_cycle VARCHAR(20) DEFAULT 'monthly'::character varying,
--   currency VARCHAR(3) DEFAULT 'USD'::character varying,
--   max_products INTEGER,
--   max_orders_per_month INTEGER,
--   max_storage_gb INTEGER,
--   max_api_calls_per_month INTEGER,
--   max_admin_users INTEGER DEFAULT 5,
--   started_at TIMESTAMP WITH TIME ZONE NOT NULL,
--   trial_ends_at TIMESTAMP WITH TIME ZONE,
--   current_period_start TIMESTAMP WITH TIME ZONE,
--   current_period_end TIMESTAMP WITH TIME ZONE,
--   cancelled_at TIMESTAMP WITH TIME ZONE,
--   cancellation_reason TEXT,
--   metadata JSONB DEFAULT '{}'::jsonb,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL
-- );

CREATE TABLE IF NOT EXISTS supabase_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  project_url TEXT NOT NULL,
  service_role_key TEXT,
  database_url TEXT,
  storage_url TEXT,
  auth_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supabase_project_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  project_id VARCHAR(255) NOT NULL,
  project_url TEXT NOT NULL,
  anon_key TEXT,
  service_role_key TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  country_rates JSONB DEFAULT '[]'::jsonb,
  store_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'common'::character varying,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(20) DEFAULT 'system'::character varying NOT NULL,
  store_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS translations_duplicate (
  id UUID PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'common'::character varying,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(20) DEFAULT 'system'::character varying NOT NULL,
  store_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  metric_hour INTEGER,
  products_created INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_deleted INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  categories_created INTEGER DEFAULT 0,
  categories_updated INTEGER DEFAULT 0,
  orders_created INTEGER DEFAULT 0,
  orders_completed INTEGER DEFAULT 0,
  orders_cancelled INTEGER DEFAULT 0,
  orders_total_value NUMERIC DEFAULT 0,
  orders_avg_value NUMERIC DEFAULT 0,
  customers_new INTEGER DEFAULT 0,
  customers_returning INTEGER DEFAULT 0,
  storage_uploaded_bytes BIGINT DEFAULT 0,
  storage_deleted_bytes BIGINT DEFAULT 0,
  storage_total_bytes BIGINT DEFAULT 0,
  storage_files_count INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  api_errors INTEGER DEFAULT 0,
  api_avg_response_time_ms INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  avatar_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  role VARCHAR(20) DEFAULT 'customer'::character varying,
  account_type VARCHAR(20) DEFAULT 'individual'::character varying,
--   credits NUMERIC DEFAULT 0.00,
  last_credit_deduction_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY,
  session_id VARCHAR(255),
  store_id UUID NOT NULL,
  user_id UUID,
  product_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ALTER TABLE ONLY _migrations
--     ADD CONSTRAINT _migrations_pkey PRIMARY KEY (name);
-- --
-- -- Name: ab_test_assignments ab_test_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_assignments
--     ADD CONSTRAINT ab_test_assignments_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ab_test_variants ab_test_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_variants
--     ADD CONSTRAINT ab_test_variants_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ab_test_variants ab_test_variants_store_id_test_name_variant_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_variants
--     ADD CONSTRAINT ab_test_variants_store_id_test_name_variant_name_key UNIQUE (store_id, test_name, variant_name);
--
--
-- --
-- -- Name: ab_tests ab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_tests
--     ADD CONSTRAINT ab_tests_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: admin_navigation_config admin_navigation_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY admin_navigation_config
--     ADD CONSTRAINT admin_navigation_config_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: admin_navigation_registry admin_navigation_registry_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY admin_navigation_registry
--     ADD CONSTRAINT admin_navigation_registry_key_key UNIQUE (key);
--
--
-- --
-- -- Name: admin_navigation_registry admin_navigation_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY admin_navigation_registry
--     ADD CONSTRAINT admin_navigation_registry_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ai_code_patterns ai_code_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_code_patterns
--     ADD CONSTRAINT ai_code_patterns_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ai_context_documents ai_context_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_context_documents
--     ADD CONSTRAINT ai_context_documents_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ai_context_usage ai_context_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_context_usage
--     ADD CONSTRAINT ai_context_usage_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ai_plugin_examples ai_plugin_examples_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_plugin_examples
--     ADD CONSTRAINT ai_plugin_examples_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ai_plugin_examples ai_plugin_examples_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_plugin_examples
--     ADD CONSTRAINT ai_plugin_examples_slug_key UNIQUE (slug);
--
--
-- --
-- -- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_usage_logs
--     ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: ai_user_preferences ai_user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_user_preferences
--     ADD CONSTRAINT ai_user_preferences_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: akeneo_custom_mappings akeneo_custom_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_custom_mappings
--     ADD CONSTRAINT akeneo_custom_mappings_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: akeneo_custom_mappings akeneo_custom_mappings_store_id_mapping_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_custom_mappings
--     ADD CONSTRAINT akeneo_custom_mappings_store_id_mapping_type_key UNIQUE (store_id, mapping_type);
--
--
-- --
-- -- Name: akeneo_import_statistics akeneo_import_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_import_statistics
--     ADD CONSTRAINT akeneo_import_statistics_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: akeneo_mappings akeneo_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_mappings
--     ADD CONSTRAINT akeneo_mappings_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: akeneo_schedules akeneo_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_schedules
--     ADD CONSTRAINT akeneo_schedules_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: attribute_sets attribute_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_sets
--     ADD CONSTRAINT attribute_sets_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: attribute_translations attribute_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_translations
--     ADD CONSTRAINT attribute_translations_pkey PRIMARY KEY (attribute_id, language_code);
--
--
-- --
-- -- Name: attribute_value_translations attribute_value_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_value_translations
--     ADD CONSTRAINT attribute_value_translations_pkey PRIMARY KEY (attribute_value_id, language_code);
--
--
-- --
-- -- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_values
--     ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: attributes attributes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attributes
--     ADD CONSTRAINT attributes_code_key UNIQUE (code);
--
--
-- --
-- -- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attributes
--     ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: blacklist_countries blacklist_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_countries
--     ADD CONSTRAINT blacklist_countries_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: blacklist_countries blacklist_countries_store_id_country_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_countries
--     ADD CONSTRAINT blacklist_countries_store_id_country_code_key UNIQUE (store_id, country_code);
--
--
-- --
-- -- Name: blacklist_emails blacklist_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_emails
--     ADD CONSTRAINT blacklist_emails_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: blacklist_emails blacklist_emails_store_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_emails
--     ADD CONSTRAINT blacklist_emails_store_id_email_key UNIQUE (store_id, email);
--
--
-- --
-- -- Name: blacklist_ips blacklist_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_ips
--     ADD CONSTRAINT blacklist_ips_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: blacklist_ips blacklist_ips_store_id_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_ips
--     ADD CONSTRAINT blacklist_ips_store_id_ip_address_key UNIQUE (store_id, ip_address);
--
--
-- --
-- -- Name: blacklist_settings blacklist_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_settings
--     ADD CONSTRAINT blacklist_settings_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: blacklist_settings blacklist_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_settings
--     ADD CONSTRAINT blacklist_settings_store_id_key UNIQUE (store_id);
--
--
-- --
-- -- Name: brevo_configurations brevo_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY brevo_configurations
--     ADD CONSTRAINT brevo_configurations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: brevo_configurations brevo_configurations_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY brevo_configurations
--     ADD CONSTRAINT brevo_configurations_store_id_key UNIQUE (store_id);
--
--
-- --
-- -- Name: canonical_urls canonical_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY canonical_urls
--     ADD CONSTRAINT canonical_urls_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cart_emails cart_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cart_emails
--     ADD CONSTRAINT cart_emails_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY carts
--     ADD CONSTRAINT carts_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY categories
--     ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: categories categories_store_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY categories
--     ADD CONSTRAINT categories_store_id_slug_key UNIQUE (store_id, slug);
--
--
-- --
-- -- Name: category_seo category_seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY category_seo
--     ADD CONSTRAINT category_seo_pkey PRIMARY KEY (category_id, language_code);
--
--
-- --
-- -- Name: category_translations category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY category_translations
--     ADD CONSTRAINT category_translations_pkey PRIMARY KEY (category_id, language_code);
--
--
-- --
-- -- Name: chat_agents chat_agents_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_agents
--     ADD CONSTRAINT chat_agents_email_key UNIQUE (email);
--
--
-- --
-- -- Name: chat_agents chat_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_agents
--     ADD CONSTRAINT chat_agents_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_conversations
--     ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_messages
--     ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: chat_typing_indicators chat_typing_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_typing_indicators
--     ADD CONSTRAINT chat_typing_indicators_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cms_block_translations cms_block_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_block_translations
--     ADD CONSTRAINT cms_block_translations_pkey PRIMARY KEY (cms_block_id, language_code);
--
--
-- --
-- -- Name: cms_blocks cms_blocks_identifier_store_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_blocks
--     ADD CONSTRAINT cms_blocks_identifier_store_id_unique UNIQUE (identifier, store_id);
--
--
-- --
-- -- Name: cms_blocks cms_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_blocks
--     ADD CONSTRAINT cms_blocks_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cms_page_seo cms_page_seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_page_seo
--     ADD CONSTRAINT cms_page_seo_pkey PRIMARY KEY (cms_page_id, language_code);
--
--
-- --
-- -- Name: cms_page_translations cms_page_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_page_translations
--     ADD CONSTRAINT cms_page_translations_pkey PRIMARY KEY (cms_page_id, language_code);
--
--
-- --
-- -- Name: cms_pages cms_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_pages
--     ADD CONSTRAINT cms_pages_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cms_pages cms_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_pages
--     ADD CONSTRAINT cms_pages_slug_key UNIQUE (slug);
--
--
-- --
-- -- Name: consent_logs consent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY consent_logs
--     ADD CONSTRAINT consent_logs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cookie_consent_settings cookie_consent_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cookie_consent_settings
--     ADD CONSTRAINT cookie_consent_settings_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cookie_consent_settings_translations cookie_consent_settings_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cookie_consent_settings_translations
--     ADD CONSTRAINT cookie_consent_settings_translations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cookie_consent_settings_translations cookie_consent_settings_translations_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cookie_consent_settings_translations
--     ADD CONSTRAINT cookie_consent_settings_translations_unique UNIQUE (cookie_consent_settings_id, language_code);
--
--
-- --
-- -- Name: coupon_translations coupon_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY coupon_translations
--     ADD CONSTRAINT coupon_translations_pkey PRIMARY KEY (coupon_id, language_code);
--
--
-- --
-- -- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY coupons
--     ADD CONSTRAINT coupons_code_key UNIQUE (code);
--
--
-- --
-- -- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY coupons
--     ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: credit_pricing credit_pricing_credits_currency_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_pricing
--     ADD CONSTRAINT credit_pricing_credits_currency_key UNIQUE (credits, currency);
--
--
-- --
-- -- Name: credit_pricing credit_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_pricing
--     ADD CONSTRAINT credit_pricing_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_transactions
--     ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: credit_usage credit_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_usage
--     ADD CONSTRAINT credit_usage_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: credits credits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credits
--     ADD CONSTRAINT credits_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cron_job_executions cron_job_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_job_executions
--     ADD CONSTRAINT cron_job_executions_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cron_job_types cron_job_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_job_types
--     ADD CONSTRAINT cron_job_types_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: cron_job_types cron_job_types_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_job_types
--     ADD CONSTRAINT cron_job_types_type_name_key UNIQUE (type_name);
--
--
-- --
-- -- Name: cron_jobs cron_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_jobs
--     ADD CONSTRAINT cron_jobs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: custom_analytics_events custom_analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_analytics_events
--     ADD CONSTRAINT custom_analytics_events_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: custom_domains custom_domains_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_domains
--     ADD CONSTRAINT custom_domains_domain_key UNIQUE (domain);
--
--
-- --
-- -- Name: custom_domains custom_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_domains
--     ADD CONSTRAINT custom_domains_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: custom_option_rules custom_option_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_option_rules
--     ADD CONSTRAINT custom_option_rules_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: custom_pricing_discounts custom_pricing_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_pricing_discounts
--     ADD CONSTRAINT custom_pricing_discounts_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: custom_pricing_logs custom_pricing_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_pricing_logs
--     ADD CONSTRAINT custom_pricing_logs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: custom_pricing_rules custom_pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_pricing_rules
--     ADD CONSTRAINT custom_pricing_rules_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: customer_activities customer_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_activities
--     ADD CONSTRAINT customer_activities_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_addresses
--     ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: customers customers_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customers
--     ADD CONSTRAINT customers_email_unique UNIQUE (email);
--
--
-- --
-- -- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customers
--     ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: delivery_settings delivery_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY delivery_settings
--     ADD CONSTRAINT delivery_settings_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: email_send_logs email_send_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_send_logs
--     ADD CONSTRAINT email_send_logs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: email_template_translations email_template_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_template_translations
--     ADD CONSTRAINT email_template_translations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_templates
--     ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: file_baselines file_baselines_file_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY file_baselines
--     ADD CONSTRAINT file_baselines_file_path_key UNIQUE (file_path);
--
--
-- --
-- -- Name: file_baselines file_baselines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY file_baselines
--     ADD CONSTRAINT file_baselines_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: hamid_cart hamid_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY hamid_cart
--     ADD CONSTRAINT hamid_cart_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: heatmap_aggregations heatmap_aggregations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_aggregations
--     ADD CONSTRAINT heatmap_aggregations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: heatmap_aggregations heatmap_aggregations_store_id_page_url_aggregation_period_p_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_aggregations
--     ADD CONSTRAINT heatmap_aggregations_store_id_page_url_aggregation_period_p_key UNIQUE (store_id, page_url, aggregation_period, period_start, viewport_width, viewport_height, interaction_type, x_coordinate, y_coordinate);
--
--
-- --
-- -- Name: heatmap_interactions heatmap_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_interactions
--     ADD CONSTRAINT heatmap_interactions_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: heatmap_sessions heatmap_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_sessions
--     ADD CONSTRAINT heatmap_sessions_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: heatmap_sessions heatmap_sessions_session_id_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_sessions
--     ADD CONSTRAINT heatmap_sessions_session_id_store_id_key UNIQUE (session_id, store_id);
--
--
-- --
-- -- Name: integration_configs integration_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY integration_configs
--     ADD CONSTRAINT integration_configs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: job_history job_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY job_history
--     ADD CONSTRAINT job_history_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY jobs
--     ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: languages languages_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY languages
--     ADD CONSTRAINT languages_code_key UNIQUE (code);
--
--
-- --
-- -- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY languages
--     ADD CONSTRAINT languages_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY login_attempts
--     ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY media_assets
--     ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: media_assets media_assets_store_id_file_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY media_assets
--     ADD CONSTRAINT media_assets_store_id_file_path_key UNIQUE (store_id, file_path);
--
--
-- --
-- -- Name: payment_method_translations payment_method_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY payment_method_translations
--     ADD CONSTRAINT payment_method_translations_pkey PRIMARY KEY (payment_method_id, language_code);
--
--
-- --
-- -- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY payment_methods
--     ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: pdf_template_translations pdf_template_translations_pdf_template_id_language_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY pdf_template_translations
--     ADD CONSTRAINT pdf_template_translations_pdf_template_id_language_code_key UNIQUE (pdf_template_id, language_code);
--
--
-- --
-- -- Name: pdf_template_translations pdf_template_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY pdf_template_translations
--     ADD CONSTRAINT pdf_template_translations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: pdf_templates pdf_templates_identifier_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY pdf_templates
--     ADD CONSTRAINT pdf_templates_identifier_store_id_key UNIQUE (identifier, store_id);
--
--
-- --
-- -- Name: pdf_templates pdf_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY pdf_templates
--     ADD CONSTRAINT pdf_templates_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY platform_admins
--     ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: platform_admins platform_admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY platform_admins
--     ADD CONSTRAINT platform_admins_user_id_key UNIQUE (user_id);
--
--
-- --
-- -- Name: plugin_admin_pages plugin_admin_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_admin_pages
--     ADD CONSTRAINT plugin_admin_pages_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_admin_pages plugin_admin_pages_plugin_id_page_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_admin_pages
--     ADD CONSTRAINT plugin_admin_pages_plugin_id_page_key_key UNIQUE (plugin_id, page_key);
--
--
-- --
-- -- Name: plugin_admin_pages plugin_admin_pages_route_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_admin_pages
--     ADD CONSTRAINT plugin_admin_pages_route_key UNIQUE (route);
--
--
-- --
-- -- Name: plugin_admin_scripts plugin_admin_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_admin_scripts
--     ADD CONSTRAINT plugin_admin_scripts_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_admin_scripts plugin_admin_scripts_plugin_id_script_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_admin_scripts
--     ADD CONSTRAINT plugin_admin_scripts_plugin_id_script_name_key UNIQUE (plugin_id, script_name);
--
--
-- --
-- -- Name: plugin_configurations plugin_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_configurations
--     ADD CONSTRAINT plugin_configurations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_controllers plugin_controllers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_controllers
--     ADD CONSTRAINT plugin_controllers_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_data plugin_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_data
--     ADD CONSTRAINT plugin_data_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_dependencies plugin_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_dependencies
--     ADD CONSTRAINT plugin_dependencies_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_dependencies plugin_dependencies_plugin_id_package_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_dependencies
--     ADD CONSTRAINT plugin_dependencies_plugin_id_package_name_key UNIQUE (plugin_id, package_name);
--
--
-- --
-- -- Name: plugin_docs plugin_docs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_docs
--     ADD CONSTRAINT plugin_docs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_entities plugin_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_entities
--     ADD CONSTRAINT plugin_entities_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_events plugin_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_events
--     ADD CONSTRAINT plugin_events_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_hooks plugin_hooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_hooks
--     ADD CONSTRAINT plugin_hooks_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_marketplace plugin_marketplace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_marketplace
--     ADD CONSTRAINT plugin_marketplace_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_marketplace plugin_marketplace_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_marketplace
--     ADD CONSTRAINT plugin_marketplace_slug_key UNIQUE (slug);
--
--
-- --
-- -- Name: plugin_migrations plugin_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_migrations
--     ADD CONSTRAINT plugin_migrations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_registry plugin_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_registry
--     ADD CONSTRAINT plugin_registry_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_scripts plugin_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_scripts
--     ADD CONSTRAINT plugin_scripts_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_version_comparisons plugin_version_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_comparisons
--     ADD CONSTRAINT plugin_version_comparisons_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_version_history plugin_version_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_history
--     ADD CONSTRAINT plugin_version_history_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_version_patches plugin_version_patches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_patches
--     ADD CONSTRAINT plugin_version_patches_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_version_snapshots plugin_version_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_snapshots
--     ADD CONSTRAINT plugin_version_snapshots_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_version_snapshots plugin_version_snapshots_version_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_snapshots
--     ADD CONSTRAINT plugin_version_snapshots_version_id_key UNIQUE (version_id);
--
--
-- --
-- -- Name: plugin_version_tags plugin_version_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_tags
--     ADD CONSTRAINT plugin_version_tags_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugin_widgets plugin_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_widgets
--     ADD CONSTRAINT plugin_widgets_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugins plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugins
--     ADD CONSTRAINT plugins_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: plugins plugins_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugins
--     ADD CONSTRAINT plugins_slug_key UNIQUE (slug);
--
--
-- --
-- -- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_attribute_values
--     ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: product_label_translations product_label_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_label_translations
--     ADD CONSTRAINT product_label_translations_pkey PRIMARY KEY (product_label_id, language_code);
--
--
-- --
-- -- Name: product_labels product_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_labels
--     ADD CONSTRAINT product_labels_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: product_seo product_seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_seo
--     ADD CONSTRAINT product_seo_pkey PRIMARY KEY (product_id, language_code);
--
--
-- --
-- -- Name: product_tab_translations product_tab_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_tab_translations
--     ADD CONSTRAINT product_tab_translations_pkey PRIMARY KEY (product_tab_id, language_code);
--
--
-- --
-- -- Name: product_tabs product_tabs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_tabs
--     ADD CONSTRAINT product_tabs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: product_translations product_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_translations
--     ADD CONSTRAINT product_translations_pkey PRIMARY KEY (product_id, language_code);
--
--
-- --
-- -- Name: product_variants product_variants_parent_product_id_variant_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_variants
--     ADD CONSTRAINT product_variants_parent_product_id_variant_product_id_key UNIQUE (parent_product_id, variant_product_id);
--
--
-- --
-- -- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_variants
--     ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY products
--     ADD CONSTRAINT products_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY products
--     ADD CONSTRAINT products_sku_key UNIQUE (sku);
--
--
-- --
-- -- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY products
--     ADD CONSTRAINT products_slug_key UNIQUE (slug);
--
--
-- --
-- -- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY redirects
--     ADD CONSTRAINT redirects_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: redirects redirects_store_id_from_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY redirects
--     ADD CONSTRAINT redirects_store_id_from_url_key UNIQUE (store_id, from_url);
--
--
-- --
-- -- Name: sales_invoices sales_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_invoices
--     ADD CONSTRAINT sales_invoices_invoice_number_key UNIQUE (invoice_number);
--
--
-- --
-- -- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_invoices
--     ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: sales_order_items sales_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_order_items
--     ADD CONSTRAINT sales_order_items_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: sales_orders sales_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_orders
--     ADD CONSTRAINT sales_orders_order_number_key UNIQUE (order_number);
--
--
-- --
-- -- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_orders
--     ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: sales_shipments sales_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_shipments
--     ADD CONSTRAINT sales_shipments_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: sales_shipments sales_shipments_shipment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_shipments
--     ADD CONSTRAINT sales_shipments_shipment_number_key UNIQUE (shipment_number);
--
--
-- --
-- -- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY seo_settings
--     ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: seo_settings seo_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY seo_settings
--     ADD CONSTRAINT seo_settings_store_id_key UNIQUE (store_id);
--
--
-- --
-- -- Name: seo_templates seo_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY seo_templates
--     ADD CONSTRAINT seo_templates_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: service_credit_costs service_credit_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY service_credit_costs
--     ADD CONSTRAINT service_credit_costs_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: service_credit_costs service_credit_costs_service_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY service_credit_costs
--     ADD CONSTRAINT service_credit_costs_service_key_key UNIQUE (service_key);
--
--
-- --
-- -- Name: shipping_method_translations shipping_method_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shipping_method_translations
--     ADD CONSTRAINT shipping_method_translations_pkey PRIMARY KEY (shipping_method_id, language_code);
--
--
-- --
-- -- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shipping_methods
--     ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: shopify_oauth_tokens shopify_oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shopify_oauth_tokens
--     ADD CONSTRAINT shopify_oauth_tokens_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: shopify_oauth_tokens shopify_oauth_tokens_shop_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shopify_oauth_tokens
--     ADD CONSTRAINT shopify_oauth_tokens_shop_domain_key UNIQUE (shop_domain);
--
--
-- --
-- -- Name: shopify_oauth_tokens shopify_oauth_tokens_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shopify_oauth_tokens
--     ADD CONSTRAINT shopify_oauth_tokens_store_id_key UNIQUE (store_id);
--
--
-- --
-- -- Name: slot_configurations slot_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: store_invitations store_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_invitations
--     ADD CONSTRAINT store_invitations_invitation_token_key UNIQUE (invitation_token);
--
--
-- --
-- -- Name: store_invitations store_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_invitations
--     ADD CONSTRAINT store_invitations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: store_teams store_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_teams
--     ADD CONSTRAINT store_teams_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: store_teams store_teams_store_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_teams
--     ADD CONSTRAINT store_teams_store_id_user_id_key UNIQUE (store_id, user_id);
--
--
-- --
-- -- Name: store_uptime store_uptime_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_uptime
--     ADD CONSTRAINT store_uptime_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: store_uptime store_uptime_store_id_charged_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_uptime
--     ADD CONSTRAINT store_uptime_store_id_charged_date_key UNIQUE (store_id, charged_date);
--
--
-- --
-- -- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY stores
--     ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
--
-- --
-- -- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY subscriptions
--     ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: supabase_oauth_tokens supabase_oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY supabase_oauth_tokens
--     ADD CONSTRAINT supabase_oauth_tokens_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: supabase_oauth_tokens supabase_oauth_tokens_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY supabase_oauth_tokens
--     ADD CONSTRAINT supabase_oauth_tokens_store_id_key UNIQUE (store_id);
--
--
-- --
-- -- Name: supabase_project_keys supabase_project_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY supabase_project_keys
--     ADD CONSTRAINT supabase_project_keys_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: supabase_project_keys supabase_project_keys_store_id_project_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY supabase_project_keys
--     ADD CONSTRAINT supabase_project_keys_store_id_project_id_key UNIQUE (store_id, project_id);
--
--
-- --
-- -- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY taxes
--     ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: translations_duplicate translations_duplicate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY translations_duplicate
--     ADD CONSTRAINT translations_duplicate_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY translations
--     ADD CONSTRAINT translations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: attribute_values unique_attribute_code; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_values
--     ADD CONSTRAINT unique_attribute_code UNIQUE (attribute_id, code);
--
--
-- --
-- -- Name: plugin_controllers unique_plugin_controller; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_controllers
--     ADD CONSTRAINT unique_plugin_controller UNIQUE (plugin_id, method, path);
--
--
-- --
-- -- Name: plugin_docs unique_plugin_doc; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_docs
--     ADD CONSTRAINT unique_plugin_doc UNIQUE (plugin_id, doc_type);
--
--
-- --
-- -- Name: plugin_entities unique_plugin_entity; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_entities
--     ADD CONSTRAINT unique_plugin_entity UNIQUE (plugin_id, entity_name);
--
--
-- --
-- -- Name: plugin_migrations unique_plugin_migration; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_migrations
--     ADD CONSTRAINT unique_plugin_migration UNIQUE (plugin_id, migration_version);
--
--
-- --
-- -- Name: plugin_entities unique_plugin_table; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_entities
--     ADD CONSTRAINT unique_plugin_table UNIQUE (plugin_id, table_name);
--
--
-- --
-- -- Name: plugin_version_tags unique_plugin_tag; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_tags
--     ADD CONSTRAINT unique_plugin_tag UNIQUE (plugin_id, tag_name);
--
--
-- --
-- -- Name: plugin_version_history unique_plugin_version; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_history
--     ADD CONSTRAINT unique_plugin_version UNIQUE (plugin_id, version_number);
--
--
-- --
-- -- Name: plugin_version_comparisons unique_version_comparison; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_comparisons
--     ADD CONSTRAINT unique_version_comparison UNIQUE (from_version_id, to_version_id);
--
--
-- --
-- -- Name: admin_navigation_config uq_navigation_config_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY admin_navigation_config
--     ADD CONSTRAINT uq_navigation_config_key UNIQUE (nav_key);
--
--
-- --
-- -- Name: plugin_data uq_plugin_data_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_data
--     ADD CONSTRAINT uq_plugin_data_key UNIQUE (plugin_id, data_key);
--
--
-- --
-- -- Name: plugin_widgets uq_plugin_widget_id; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_widgets
--     ADD CONSTRAINT uq_plugin_widget_id UNIQUE (plugin_id, widget_id);
--
--
-- --
-- -- Name: usage_metrics usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY usage_metrics
--     ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY users
--     ADD CONSTRAINT users_email_key UNIQUE (email);
--
--
-- --
-- -- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY users
--     ADD CONSTRAINT users_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY wishlists
--     ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
-- --
--
-- ALTER TABLE ONLY realtime.messages
--     ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);
--
--
-- --
-- -- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
-- --
--
-- ALTER TABLE ONLY realtime.subscription
--     ADD CONSTRAINT pk_subscription PRIMARY KEY (id);
--
--
-- --
-- -- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
-- --
--
-- ALTER TABLE ONLY realtime.schema_migrations
--     ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);
--
--
-- --
-- -- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.buckets_analytics
--     ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.buckets
--     ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.migrations
--     ADD CONSTRAINT migrations_name_key UNIQUE (name);
--
--
-- --
-- -- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.migrations
--     ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.objects
--     ADD CONSTRAINT objects_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.prefixes
--     ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);
--
--
-- --
-- -- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.s3_multipart_uploads_parts
--     ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);
--
--
-- --
-- -- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.s3_multipart_uploads
--     ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: ab_test_assignments_assigned_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_assigned_at ON ab_test_assignments USING btree (assigned_at);


--
-- Name: ab_test_assignments_converted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_converted ON ab_test_assignments USING btree (converted);


--
-- Name: ab_test_assignments_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_session_id ON ab_test_assignments USING btree (session_id);


--
-- Name: ab_test_assignments_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_store_id ON ab_test_assignments USING btree (store_id);


--
-- Name: ab_test_assignments_test_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_test_id ON ab_test_assignments USING btree (test_id);


--
-- Name: ab_test_assignments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_user_id ON ab_test_assignments USING btree (user_id);


--
-- Name: ab_test_assignments_variant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_test_assignments_variant_id ON ab_test_assignments USING btree (variant_id);


--
-- Name: ab_tests_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_tests_end_date ON ab_tests USING btree (end_date);


--
-- Name: ab_tests_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_tests_start_date ON ab_tests USING btree (start_date);


--
-- Name: ab_tests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_tests_status ON ab_tests USING btree (status);


--
-- Name: ab_tests_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ab_tests_store_id ON ab_tests USING btree (store_id);


--
-- Name: akeneo_custom_mappings_store_id_mapping_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX akeneo_custom_mappings_store_id_mapping_type ON akeneo_custom_mappings USING btree (store_id, mapping_type);


--
-- Name: akeneo_schedules_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX akeneo_schedules_is_active ON akeneo_schedules USING btree (is_active);


--
-- Name: akeneo_schedules_next_run; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX akeneo_schedules_next_run ON akeneo_schedules USING btree (next_run);


--
-- Name: akeneo_schedules_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX akeneo_schedules_store_id ON akeneo_schedules USING btree (store_id);


--
-- Name: attribute_values_attribute_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attribute_values_attribute_id ON attribute_values USING btree (attribute_id);


--
-- Name: attribute_values_attribute_id_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX attribute_values_attribute_id_code ON attribute_values USING btree (attribute_id, code);


--
-- Name: brevo_configurations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX brevo_configurations_is_active ON brevo_configurations USING btree (is_active);


--
-- Name: brevo_configurations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX brevo_configurations_store_id ON brevo_configurations USING btree (store_id);


--
-- Name: canonical_urls_store_id_page_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX canonical_urls_store_id_page_url ON canonical_urls USING btree (store_id, page_url);


--
-- Name: category_translations_name_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX category_translations_name_search_idx ON category_translations USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- Name: cms_blocks_identifier_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cms_blocks_identifier_store_id ON cms_blocks USING btree (identifier, store_id);


--
-- Name: cms_page_translations_title_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cms_page_translations_title_search_idx ON cms_page_translations USING gin (to_tsvector('english'::regconfig, (title)::text));


--
-- Name: credit_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_transactions_status ON credit_transactions USING btree (status);


--
-- Name: credit_transactions_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_transactions_stripe_payment_intent_id ON credit_transactions USING btree (stripe_payment_intent_id);


--
-- Name: credit_transactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_transactions_user_id ON credit_transactions USING btree (user_id);


--
-- Name: credit_usage_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_usage_created_at ON credit_usage USING btree (created_at);


--
-- Name: credit_usage_reference_id_reference_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_usage_reference_id_reference_type ON credit_usage USING btree (reference_id, reference_type);


--
-- Name: credit_usage_usage_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_usage_usage_type ON credit_usage USING btree (usage_type);


--
-- Name: credit_usage_user_id_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX credit_usage_user_id_store_id ON credit_usage USING btree (user_id, store_id);


--
-- Name: credits_user_id_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX credits_user_id_store_id ON credits USING btree (user_id, store_id);


--
-- Name: custom_analytics_events_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_analytics_events_enabled ON custom_analytics_events USING btree (enabled);


--
-- Name: custom_analytics_events_event_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_analytics_events_event_category ON custom_analytics_events USING btree (event_category);


--
-- Name: custom_analytics_events_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_analytics_events_priority ON custom_analytics_events USING btree (priority);


--
-- Name: custom_analytics_events_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_analytics_events_store_id ON custom_analytics_events USING btree (store_id);


--
-- Name: custom_analytics_events_trigger_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_analytics_events_trigger_type ON custom_analytics_events USING btree (trigger_type);


--
-- Name: custom_domains_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX custom_domains_domain ON custom_domains USING btree (domain);


--
-- Name: custom_domains_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_domains_is_active ON custom_domains USING btree (is_active);


--
-- Name: custom_domains_is_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_domains_is_primary ON custom_domains USING btree (is_primary);


--
-- Name: custom_domains_ssl_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_domains_ssl_status ON custom_domains USING btree (ssl_status);


--
-- Name: custom_domains_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_domains_store_id ON custom_domains USING btree (store_id);


--
-- Name: custom_domains_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_domains_verification_status ON custom_domains USING btree (verification_status);


--
-- Name: customer_activities_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_city ON customer_activities USING btree (city);


--
-- Name: customer_activities_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_country ON customer_activities USING btree (country);


--
-- Name: customer_activities_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_created_at ON customer_activities USING btree (created_at);


--
-- Name: customer_activities_device_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_device_type ON customer_activities USING btree (device_type);


--
-- Name: customer_activities_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_language ON customer_activities USING btree (language);


--
-- Name: customer_activities_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_session_id ON customer_activities USING btree (session_id);


--
-- Name: customer_activities_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_store_id ON customer_activities USING btree (store_id);


--
-- Name: customer_activities_utm_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customer_activities_utm_source ON customer_activities USING btree (utm_source);


--
-- Name: customers_store_id_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_store_id_email ON customers USING btree (store_id, email);


--
-- Name: email_send_logs_brevo_message_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_send_logs_brevo_message_id ON email_send_logs USING btree (brevo_message_id);


--
-- Name: email_send_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_send_logs_created_at ON email_send_logs USING btree (created_at);


--
-- Name: email_send_logs_email_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_send_logs_email_template_id ON email_send_logs USING btree (email_template_id);


--
-- Name: email_send_logs_recipient_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_send_logs_recipient_email ON email_send_logs USING btree (recipient_email);


--
-- Name: email_send_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_send_logs_status ON email_send_logs USING btree (status);


--
-- Name: email_send_logs_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_send_logs_store_id ON email_send_logs USING btree (store_id);


--
-- Name: email_template_translations_email_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_template_translations_email_template_id ON email_template_translations USING btree (email_template_id);


--
-- Name: email_template_translations_email_template_id_language_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX email_template_translations_email_template_id_language_code ON email_template_translations USING btree (email_template_id, language_code);


--
-- Name: email_template_translations_language_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_template_translations_language_code ON email_template_translations USING btree (language_code);


--
-- Name: email_templates_identifier_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX email_templates_identifier_store_id ON email_templates USING btree (identifier, store_id);


--
-- Name: email_templates_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_templates_is_active ON email_templates USING btree (is_active);


--
-- Name: email_templates_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_templates_store_id ON email_templates USING btree (store_id);


--
-- Name: idx_ai_code_patterns_framework; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_code_patterns_framework ON ai_code_patterns USING btree (framework);


--
-- Name: idx_ai_code_patterns_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_code_patterns_type ON ai_code_patterns USING btree (pattern_type, is_active);


--
-- Name: idx_ai_context_docs_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_docs_category ON ai_context_documents USING btree (category);


--
-- Name: idx_ai_context_docs_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_docs_mode ON ai_context_documents USING btree (mode);


--
-- Name: idx_ai_context_docs_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_docs_priority ON ai_context_documents USING btree (priority);


--
-- Name: idx_ai_context_docs_store; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_docs_store ON ai_context_documents USING btree (store_id);


--
-- Name: idx_ai_context_docs_type_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_docs_type_active ON ai_context_documents USING btree (type, is_active);


--
-- Name: idx_ai_context_usage_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_usage_created ON ai_context_usage USING btree (created_at);


--
-- Name: idx_ai_context_usage_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_usage_document ON ai_context_usage USING btree (document_id);


--
-- Name: idx_ai_context_usage_example; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_usage_example ON ai_context_usage USING btree (example_id);


--
-- Name: idx_ai_context_usage_pattern; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_context_usage_pattern ON ai_context_usage USING btree (pattern_id);


--
-- Name: idx_ai_plugin_examples_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_plugin_examples_category ON ai_plugin_examples USING btree (category, is_active);


--
-- Name: idx_ai_plugin_examples_complexity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_plugin_examples_complexity ON ai_plugin_examples USING btree (complexity);


--
-- Name: idx_ai_plugin_examples_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_plugin_examples_template ON ai_plugin_examples USING btree (is_template);


--
-- Name: idx_ai_plugin_examples_usage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_plugin_examples_usage ON ai_plugin_examples USING btree (usage_count);


--
-- Name: idx_ai_usage_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs USING btree (created_at DESC);


--
-- Name: idx_ai_usage_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs USING btree (user_id);


--
-- Name: idx_ai_user_prefs_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_user_prefs_session ON ai_user_preferences USING btree (session_id);


--
-- Name: idx_ai_user_prefs_store; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_user_prefs_store ON ai_user_preferences USING btree (store_id);


--
-- Name: idx_ai_user_prefs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_user_prefs_user ON ai_user_preferences USING btree (user_id);


--
-- Name: idx_akeneo_custom_mappings_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_custom_mappings_store_id ON akeneo_custom_mappings USING btree (store_id);


--
-- Name: idx_akeneo_import_statistics_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_import_statistics_date ON akeneo_import_statistics USING btree (import_date DESC);


--
-- Name: idx_akeneo_import_statistics_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_import_statistics_store_id ON akeneo_import_statistics USING btree (store_id);


--
-- Name: idx_akeneo_import_statistics_store_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_import_statistics_store_type ON akeneo_import_statistics USING btree (store_id, import_type);


--
-- Name: idx_akeneo_import_statistics_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_import_statistics_type ON akeneo_import_statistics USING btree (import_type);


--
-- Name: idx_akeneo_import_statistics_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_import_statistics_unique ON akeneo_import_statistics USING btree (store_id, import_type, import_date);


--
-- Name: idx_akeneo_mappings_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_mappings_entity ON akeneo_mappings USING btree (entity_type, entity_id);


--
-- Name: idx_akeneo_mappings_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_mappings_lookup ON akeneo_mappings USING btree (store_id, akeneo_code, akeneo_type, is_active);


--
-- Name: idx_akeneo_mappings_sort_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_mappings_sort_order ON akeneo_mappings USING btree (sort_order);


--
-- Name: idx_akeneo_mappings_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_akeneo_mappings_unique ON akeneo_mappings USING btree (store_id, akeneo_code, akeneo_type, entity_type);


--
-- Name: idx_akeneo_schedules_credit_cost; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_schedules_credit_cost ON akeneo_schedules USING btree (credit_cost);


--
-- Name: idx_akeneo_schedules_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_schedules_is_active ON akeneo_schedules USING btree (is_active);


--
-- Name: idx_akeneo_schedules_next_run; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_schedules_next_run ON akeneo_schedules USING btree (next_run);


--
-- Name: idx_akeneo_schedules_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_schedules_status ON akeneo_schedules USING btree (status);


--
-- Name: idx_akeneo_schedules_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_akeneo_schedules_store_id ON akeneo_schedules USING btree (store_id);


--
-- Name: idx_attribute_sets_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attribute_sets_store_id ON attribute_sets USING btree (store_id);


--
-- Name: idx_attributes_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attributes_code ON attributes USING btree (code);


--
-- Name: idx_attributes_is_configurable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attributes_is_configurable ON attributes USING btree (is_configurable) WHERE (is_configurable = true);


--
-- Name: idx_attributes_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attributes_store_id ON attributes USING btree (store_id);


--
-- Name: idx_blacklist_countries_store_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blacklist_countries_store_country ON blacklist_countries USING btree (store_id, country_code);


--
-- Name: idx_blacklist_emails_store_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blacklist_emails_store_email ON blacklist_emails USING btree (store_id, email);


--
-- Name: idx_blacklist_ips_store_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blacklist_ips_store_ip ON blacklist_ips USING btree (store_id, ip_address);


--
-- Name: idx_blacklist_settings_store; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blacklist_settings_store ON blacklist_settings USING btree (store_id);


--
-- Name: idx_brevo_configurations_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brevo_configurations_active ON brevo_configurations USING btree (is_active);


--
-- Name: idx_brevo_configurations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brevo_configurations_store_id ON brevo_configurations USING btree (store_id);


--
-- Name: idx_cart_emails_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_emails_created_at ON cart_emails USING btree (created_at DESC);


--
-- Name: idx_cart_emails_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_emails_email ON cart_emails USING btree (email);


--
-- Name: idx_categories_active_menu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_active_menu ON categories USING btree (store_id, is_active, hide_in_menu, sort_order) WHERE ((is_active = true) AND (hide_in_menu = false));


--
-- Name: idx_categories_akeneo_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_akeneo_code ON categories USING btree (akeneo_code);


--
-- Name: idx_categories_hide_in_menu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_hide_in_menu ON categories USING btree (hide_in_menu);


--
-- Name: idx_categories_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_is_active ON categories USING btree (is_active);


--
-- Name: idx_categories_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_level ON categories USING btree (level);


--
-- Name: idx_categories_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_parent_id ON categories USING btree (parent_id);


--
-- Name: idx_categories_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_slug ON categories USING btree (slug);


--
-- Name: idx_categories_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_store_id ON categories USING btree (store_id);


--
-- Name: idx_category_translations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_category_translations_name ON category_translations USING btree (name);


--
-- Name: idx_cms_blocks_store_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cms_blocks_store_active ON cms_blocks USING btree (store_id, is_active);


--
-- Name: idx_cms_pages_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cms_pages_is_active ON cms_pages USING btree (is_active);


--
-- Name: idx_cms_pages_is_system; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cms_pages_is_system ON cms_pages USING btree (is_system);


--
-- Name: idx_cms_pages_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cms_pages_slug ON cms_pages USING btree (slug);


--
-- Name: idx_cms_pages_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cms_pages_store_id ON cms_pages USING btree (store_id);


--
-- Name: idx_conversations_agent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_agent ON chat_conversations USING btree (assigned_agent_id);


--
-- Name: idx_conversations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_status ON chat_conversations USING btree (status);


--
-- Name: idx_cookie_consent_translations_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cookie_consent_translations_language ON cookie_consent_settings_translations USING btree (language_code);


--
-- Name: idx_cookie_consent_translations_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cookie_consent_translations_settings_id ON cookie_consent_settings_translations USING btree (cookie_consent_settings_id);


--
-- Name: idx_coupons_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_coupons_code ON coupons USING btree (code);


--
-- Name: idx_coupons_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_coupons_is_active ON coupons USING btree (is_active);


--
-- Name: idx_coupons_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_coupons_store_id ON coupons USING btree (store_id);


--
-- Name: idx_credit_pricing_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_pricing_active ON credit_pricing USING btree (active);


--
-- Name: idx_credit_pricing_currency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_pricing_currency ON credit_pricing USING btree (currency);


--
-- Name: idx_credit_pricing_stripe_price_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_pricing_stripe_price_id ON credit_pricing USING btree (stripe_price_id);


--
-- Name: idx_credit_transactions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_transactions_status ON credit_transactions USING btree (status);


--
-- Name: idx_credit_transactions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_transactions_user ON credit_transactions USING btree (user_id);


--
-- Name: idx_credit_usage_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_usage_created_at ON credit_usage USING btree (created_at);


--
-- Name: idx_credit_usage_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_usage_reference ON credit_usage USING btree (reference_id, reference_type);


--
-- Name: idx_credit_usage_user_store; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_credit_usage_user_store ON credit_usage USING btree (user_id, store_id);


--
-- Name: idx_cron_job_executions_cron_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_job_executions_cron_job_id ON cron_job_executions USING btree (cron_job_id);


--
-- Name: idx_cron_job_executions_started_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_job_executions_started_at ON cron_job_executions USING btree (started_at);


--
-- Name: idx_cron_job_executions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_job_executions_status ON cron_job_executions USING btree (status);


--
-- Name: idx_cron_jobs_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_jobs_active ON cron_jobs USING btree (is_active);


--
-- Name: idx_cron_jobs_job_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_jobs_job_type ON cron_jobs USING btree (job_type);


--
-- Name: idx_cron_jobs_next_run; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_jobs_next_run ON cron_jobs USING btree (next_run_at) WHERE ((is_active = true) AND (is_paused = false));


--
-- Name: idx_cron_jobs_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_jobs_store_id ON cron_jobs USING btree (store_id);


--
-- Name: idx_cron_jobs_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_jobs_tags ON cron_jobs USING gin (to_tsvector('english'::regconfig, (tags)::text));


--
-- Name: idx_cron_jobs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cron_jobs_user_id ON cron_jobs USING btree (user_id);


--
-- Name: idx_current_edit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_current_edit ON slot_configurations USING btree (current_edit_id);


--
-- Name: idx_custom_domains_active_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_domains_active_lookup ON custom_domains USING btree (domain, store_id) WHERE ((is_active = true) AND (verification_status = 'verified'::enum_custom_domains_verification_status));


--
-- Name: INDEX idx_custom_domains_active_lookup; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON INDEX idx_custom_domains_active_lookup IS 'Optimized partial index for fast custom domain lookups - only indexes active, verified domains';


--
-- Name: idx_custom_option_rules_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_option_rules_is_active ON custom_option_rules USING btree (is_active);


--
-- Name: idx_custom_option_rules_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_option_rules_store_id ON custom_option_rules USING btree (store_id);


--
-- Name: idx_custom_pricing_logs_event_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_pricing_logs_event_created ON custom_pricing_logs USING btree (event_type, created_at);


--
-- Name: idx_custom_pricing_logs_rule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_pricing_logs_rule_id ON custom_pricing_logs USING btree (rule_id);


--
-- Name: idx_custom_pricing_rules_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_pricing_rules_store_id ON custom_pricing_rules USING btree (store_id);


--
-- Name: idx_custom_pricing_rules_type_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_custom_pricing_rules_type_enabled ON custom_pricing_rules USING btree (type, enabled);


--
-- Name: idx_customer_activities_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_activities_city ON customer_activities USING btree (city);


--
-- Name: idx_customer_activities_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_activities_country ON customer_activities USING btree (country);


--
-- Name: idx_customer_activities_device_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_activities_device_type ON customer_activities USING btree (device_type);


--
-- Name: idx_customer_activities_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_activities_language ON customer_activities USING btree (language);


--
-- Name: idx_customer_activities_utm_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_activities_utm_source ON customer_activities USING btree (utm_source);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON customers USING btree (email);


--
-- Name: idx_customers_email_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email_active ON customers USING btree (email, is_active);


--
-- Name: idx_customers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_is_active ON customers USING btree (is_active);


--
-- Name: idx_customers_is_blacklisted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_is_blacklisted ON customers USING btree (is_blacklisted);


--
-- Name: idx_customers_store_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_store_email ON customers USING btree (store_id, email);


--
-- Name: idx_customers_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_store_id ON customers USING btree (store_id);


--
-- Name: idx_delivery_settings_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_delivery_settings_store_id ON delivery_settings USING btree (store_id);


--
-- Name: idx_email_send_logs_brevo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_send_logs_brevo_id ON email_send_logs USING btree (brevo_message_id);


--
-- Name: idx_email_send_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_send_logs_created_at ON email_send_logs USING btree (created_at);


--
-- Name: idx_email_send_logs_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_send_logs_recipient ON email_send_logs USING btree (recipient_email);


--
-- Name: idx_email_send_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_send_logs_status ON email_send_logs USING btree (status);


--
-- Name: idx_email_send_logs_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_send_logs_store_id ON email_send_logs USING btree (store_id);


--
-- Name: idx_email_send_logs_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_send_logs_template_id ON email_send_logs USING btree (email_template_id);


--
-- Name: idx_email_template_translations_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_template_translations_language ON email_template_translations USING btree (language_code);


--
-- Name: idx_email_template_translations_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_template_translations_template_id ON email_template_translations USING btree (email_template_id);


--
-- Name: idx_email_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_templates_active ON email_templates USING btree (is_active);


--
-- Name: idx_email_templates_identifier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_templates_identifier ON email_templates USING btree (identifier);


--
-- Name: idx_email_templates_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_templates_store_id ON email_templates USING btree (store_id);


--
-- Name: idx_file_baselines_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_file_baselines_path ON file_baselines USING btree (file_path);


--
-- Name: idx_file_baselines_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_file_baselines_version ON file_baselines USING btree (version);


--
-- Name: idx_hamid_cart_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hamid_cart_created_at ON hamid_cart USING btree (created_at DESC);


--
-- Name: idx_hamid_cart_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hamid_cart_session ON hamid_cart USING btree (session_id);


--
-- Name: idx_hamid_cart_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hamid_cart_user ON hamid_cart USING btree (user_id);


--
-- Name: idx_hamid_cart_visited_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hamid_cart_visited_at ON hamid_cart USING btree (visited_at DESC);


--
-- Name: idx_heatmap_aggregations_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_aggregations_lookup ON heatmap_aggregations USING btree (store_id, page_url, aggregation_period, period_start);


--
-- Name: idx_heatmap_coordinates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_coordinates ON heatmap_interactions USING btree (store_id, page_url, interaction_type, x_coordinate, y_coordinate);


--
-- Name: idx_heatmap_interactions_coordinates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_interactions_coordinates ON heatmap_interactions USING btree (store_id, page_url, interaction_type, x_coordinate, y_coordinate);


--
-- Name: idx_heatmap_interactions_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_interactions_session ON heatmap_interactions USING btree (session_id);


--
-- Name: idx_heatmap_interactions_store_page_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_interactions_store_page_time ON heatmap_interactions USING btree (store_id, page_url, timestamp_utc DESC);


--
-- Name: idx_heatmap_interactions_viewport; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_interactions_viewport ON heatmap_interactions USING btree (viewport_width, viewport_height);


--
-- Name: idx_heatmap_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_session ON heatmap_interactions USING btree (session_id);


--
-- Name: idx_heatmap_sessions_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_sessions_session_id ON heatmap_sessions USING btree (session_id);


--
-- Name: idx_heatmap_sessions_store_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_sessions_store_time ON heatmap_sessions USING btree (store_id, session_start DESC);


--
-- Name: idx_heatmap_store_page_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_store_page_time ON heatmap_interactions USING btree (store_id, page_url, timestamp_utc);


--
-- Name: idx_heatmap_viewport; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_heatmap_viewport ON heatmap_interactions USING btree (viewport_width, viewport_height);


--
-- Name: idx_integration_configs_connection_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_integration_configs_connection_status ON integration_configs USING btree (store_id, integration_type, connection_status);


--
-- Name: idx_job_history_executed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_history_executed_at ON job_history USING btree (executed_at);


--
-- Name: idx_job_history_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_history_job_id ON job_history USING btree (job_id);


--
-- Name: idx_job_history_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_history_status ON job_history USING btree (status);


--
-- Name: idx_job_history_timeline; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_history_timeline ON job_history USING btree (job_id, executed_at);


--
-- Name: idx_jobs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_created_at ON jobs USING btree (created_at);


--
-- Name: idx_jobs_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_priority ON jobs USING btree (priority);


--
-- Name: idx_jobs_queue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_queue ON jobs USING btree (status, priority, scheduled_at);


--
-- Name: idx_jobs_scheduled_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_scheduled_at ON jobs USING btree (scheduled_at);


--
-- Name: idx_jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_status ON jobs USING btree (status);


--
-- Name: idx_jobs_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_store_id ON jobs USING btree (store_id);


--
-- Name: idx_jobs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_type ON jobs USING btree (type);


--
-- Name: idx_jobs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_jobs_user_id ON jobs USING btree (user_id);


--
-- Name: idx_login_attempts_email_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_attempts_email_time ON login_attempts USING btree (email, attempted_at);


--
-- Name: idx_login_attempts_ip_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_login_attempts_ip_time ON login_attempts USING btree (ip_address, attempted_at);


--
-- Name: idx_media_assets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_assets_created_at ON media_assets USING btree (created_at DESC);


--
-- Name: idx_media_assets_folder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_assets_folder ON media_assets USING btree (folder);


--
-- Name: idx_media_assets_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_assets_store_id ON media_assets USING btree (store_id);


--
-- Name: idx_media_assets_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_media_assets_tags ON media_assets USING gin (tags);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON chat_messages USING btree (conversation_id);


--
-- Name: idx_migrations_executed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migrations_executed_at ON _migrations USING btree (executed_at);


--
-- Name: idx_migrations_filename; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migrations_filename ON _migrations USING btree (filename);


--
-- Name: idx_navigation_config_hidden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_navigation_config_hidden ON admin_navigation_config USING btree (is_hidden);


--
-- Name: idx_navigation_config_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_navigation_config_key ON admin_navigation_config USING btree (nav_key);


--
-- Name: idx_navigation_registry_core; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_navigation_registry_core ON admin_navigation_registry USING btree (is_core);


--
-- Name: idx_navigation_registry_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_navigation_registry_key ON admin_navigation_registry USING btree (key);


--
-- Name: idx_navigation_registry_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_navigation_registry_parent ON admin_navigation_registry USING btree (parent_key);


--
-- Name: idx_navigation_registry_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_navigation_registry_plugin ON admin_navigation_registry USING btree (plugin_id);


--
-- Name: idx_parent_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parent_version ON slot_configurations USING btree (parent_version_id);


--
-- Name: idx_payment_methods_conditions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_conditions ON payment_methods USING gin (conditions);


--
-- Name: idx_payment_methods_payment_flow; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_payment_flow ON payment_methods USING btree (payment_flow);


--
-- Name: idx_pdf_template_translations_language; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_template_translations_language ON pdf_template_translations USING btree (language_code);


--
-- Name: idx_pdf_template_translations_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_template_translations_template_id ON pdf_template_translations USING btree (pdf_template_id);


--
-- Name: idx_pdf_templates_identifier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_templates_identifier ON pdf_templates USING btree (identifier);


--
-- Name: idx_pdf_templates_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_templates_store_id ON pdf_templates USING btree (store_id);


--
-- Name: idx_pdf_templates_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pdf_templates_type ON pdf_templates USING btree (template_type);


--
-- Name: idx_plugin_admin_pages_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_admin_pages_enabled ON plugin_admin_pages USING btree (is_enabled);


--
-- Name: idx_plugin_admin_pages_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_admin_pages_plugin ON plugin_admin_pages USING btree (plugin_id);


--
-- Name: idx_plugin_admin_pages_route; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_admin_pages_route ON plugin_admin_pages USING btree (route);


--
-- Name: idx_plugin_admin_scripts_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_admin_scripts_enabled ON plugin_admin_scripts USING btree (is_enabled);


--
-- Name: idx_plugin_admin_scripts_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_admin_scripts_order ON plugin_admin_scripts USING btree (load_order);


--
-- Name: idx_plugin_admin_scripts_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_admin_scripts_plugin ON plugin_admin_scripts USING btree (plugin_id);


--
-- Name: idx_plugin_comparison_computed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_comparison_computed ON plugin_version_comparisons USING btree (computed_at DESC);


--
-- Name: idx_plugin_comparison_from; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_comparison_from ON plugin_version_comparisons USING btree (from_version_id);


--
-- Name: idx_plugin_comparison_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_comparison_plugin ON plugin_version_comparisons USING btree (plugin_id);


--
-- Name: idx_plugin_comparison_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_comparison_to ON plugin_version_comparisons USING btree (to_version_id);


--
-- Name: idx_plugin_controllers_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_controllers_enabled ON plugin_controllers USING btree (is_enabled);


--
-- Name: idx_plugin_controllers_method_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_controllers_method_path ON plugin_controllers USING btree (method, path);


--
-- Name: idx_plugin_controllers_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_controllers_plugin_id ON plugin_controllers USING btree (plugin_id);


--
-- Name: idx_plugin_data_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_data_key ON plugin_data USING btree (data_key);


--
-- Name: idx_plugin_data_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_data_plugin ON plugin_data USING btree (plugin_id);


--
-- Name: idx_plugin_data_plugin_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_data_plugin_key ON plugin_data USING btree (plugin_id, data_key);


--
-- Name: idx_plugin_dependencies_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_dependencies_plugin_id ON plugin_dependencies USING btree (plugin_id);


--
-- Name: idx_plugin_docs_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_docs_plugin_id ON plugin_docs USING btree (plugin_id);


--
-- Name: idx_plugin_docs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_docs_type ON plugin_docs USING btree (doc_type);


--
-- Name: idx_plugin_docs_visible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_docs_visible ON plugin_docs USING btree (is_visible);


--
-- Name: idx_plugin_entities_migration_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_entities_migration_status ON plugin_entities USING btree (migration_status);


--
-- Name: idx_plugin_entities_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_entities_plugin_id ON plugin_entities USING btree (plugin_id);


--
-- Name: idx_plugin_entities_table_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_entities_table_name ON plugin_entities USING btree (table_name);


--
-- Name: idx_plugin_events_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_events_enabled ON plugin_events USING btree (is_enabled) WHERE (is_enabled = true);


--
-- Name: idx_plugin_events_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_events_name ON plugin_events USING btree (event_name);


--
-- Name: idx_plugin_events_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_events_plugin ON plugin_events USING btree (plugin_id);


--
-- Name: idx_plugin_events_plugin_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_events_plugin_name ON plugin_events USING btree (plugin_id, event_name);


--
-- Name: idx_plugin_hooks_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_hooks_enabled ON plugin_hooks USING btree (is_enabled) WHERE (is_enabled = true);


--
-- Name: idx_plugin_hooks_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_hooks_name ON plugin_hooks USING btree (hook_name);


--
-- Name: idx_plugin_hooks_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_hooks_plugin ON plugin_hooks USING btree (plugin_id);


--
-- Name: idx_plugin_hooks_plugin_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_hooks_plugin_name ON plugin_hooks USING btree (plugin_id, hook_name);


--
-- Name: idx_plugin_marketplace_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_marketplace_slug ON plugin_marketplace USING btree (slug);


--
-- Name: idx_plugin_marketplace_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_marketplace_status ON plugin_marketplace USING btree (status);


--
-- Name: idx_plugin_migrations_executed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_migrations_executed_at ON plugin_migrations USING btree (executed_at DESC);


--
-- Name: idx_plugin_migrations_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_migrations_plugin_id ON plugin_migrations USING btree (plugin_id);


--
-- Name: idx_plugin_migrations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_migrations_status ON plugin_migrations USING btree (status);


--
-- Name: idx_plugin_migrations_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_migrations_version ON plugin_migrations USING btree (migration_version);


--
-- Name: idx_plugin_patch_change_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_patch_change_type ON plugin_version_patches USING btree (change_type);


--
-- Name: idx_plugin_patch_component; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_patch_component ON plugin_version_patches USING btree (component_type, component_id);


--
-- Name: idx_plugin_patch_operations; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_patch_operations ON plugin_version_patches USING gin (patch_operations);


--
-- Name: idx_plugin_patch_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_patch_plugin ON plugin_version_patches USING btree (plugin_id);


--
-- Name: idx_plugin_patch_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_patch_version ON plugin_version_patches USING btree (version_id);


--
-- Name: idx_plugin_registry_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_registry_category ON plugin_registry USING btree (category);


--
-- Name: idx_plugin_registry_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_registry_creator ON plugin_registry USING btree (creator_id);


--
-- Name: idx_plugin_registry_deprecated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_registry_deprecated ON plugin_registry USING btree (deprecated_at);


--
-- Name: idx_plugin_registry_is_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_registry_is_public ON plugin_registry USING btree (is_public);


--
-- Name: idx_plugin_registry_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_registry_status ON plugin_registry USING btree (status);


--
-- Name: idx_plugin_scripts_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_scripts_enabled ON plugin_scripts USING btree (is_enabled) WHERE (is_enabled = true);


--
-- Name: idx_plugin_scripts_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_scripts_plugin ON plugin_scripts USING btree (plugin_id);


--
-- Name: idx_plugin_scripts_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_scripts_plugin_id ON plugin_scripts USING btree (plugin_id);


--
-- Name: idx_plugin_scripts_type_scope; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_scripts_type_scope ON plugin_scripts USING btree (script_type, scope);


--
-- Name: idx_plugin_snapshot_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_snapshot_created_at ON plugin_version_snapshots USING btree (created_at DESC);


--
-- Name: idx_plugin_snapshot_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_snapshot_data ON plugin_version_snapshots USING gin (snapshot_data);


--
-- Name: idx_plugin_snapshot_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_snapshot_plugin ON plugin_version_snapshots USING btree (plugin_id);


--
-- Name: idx_plugin_snapshot_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_snapshot_version ON plugin_version_snapshots USING btree (version_id);


--
-- Name: idx_plugin_tag_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_tag_name ON plugin_version_tags USING btree (tag_name);


--
-- Name: idx_plugin_tag_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_tag_plugin ON plugin_version_tags USING btree (plugin_id);


--
-- Name: idx_plugin_tag_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_tag_type ON plugin_version_tags USING btree (tag_type);


--
-- Name: idx_plugin_tag_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_tag_version ON plugin_version_tags USING btree (version_id);


--
-- Name: idx_plugin_version_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_version_created_at ON plugin_version_history USING btree (created_at DESC);


--
-- Name: idx_plugin_version_is_current; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_version_is_current ON plugin_version_history USING btree (is_current) WHERE (is_current = true);


--
-- Name: idx_plugin_version_is_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_version_is_published ON plugin_version_history USING btree (is_published) WHERE (is_published = true);


--
-- Name: idx_plugin_version_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_version_parent ON plugin_version_history USING btree (parent_version_id);


--
-- Name: idx_plugin_version_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_version_plugin_id ON plugin_version_history USING btree (plugin_id);


--
-- Name: idx_plugin_version_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_version_type ON plugin_version_history USING btree (version_type);


--
-- Name: idx_plugin_widgets_plugin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_widgets_plugin ON plugin_widgets USING btree (plugin_id);


--
-- Name: idx_plugin_widgets_widget_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plugin_widgets_widget_id ON plugin_widgets USING btree (widget_id);


--
-- Name: idx_product_attribute_values_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_attribute_values_product ON product_attribute_values USING btree (product_id, attribute_id);


--
-- Name: idx_product_attribute_values_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_attribute_values_value ON product_attribute_values USING btree (attribute_id, value_id);


--
-- Name: idx_product_labels_sort_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_labels_sort_order ON product_labels USING btree (sort_order);


--
-- Name: idx_product_tabs_tab_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_tabs_tab_type ON product_tabs USING btree (tab_type);


--
-- Name: idx_product_translations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_translations_name ON product_translations USING btree (name);


--
-- Name: idx_product_translations_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_translations_search ON product_translations USING gin (to_tsvector('english'::regconfig, (((name)::text || ' '::text) || COALESCE(description, ''::text))));


--
-- Name: idx_product_variants_attribute_values; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_variants_attribute_values ON product_variants USING gin (attribute_values);


--
-- Name: idx_product_variants_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_variants_parent ON product_variants USING btree (parent_product_id);


--
-- Name: idx_product_variants_variant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_variants_variant ON product_variants USING btree (variant_product_id);


--
-- Name: idx_products_active_visible; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active_visible ON products USING btree (store_id, status, visibility) WHERE (((status)::text = 'active'::text) AND ((visibility)::text = 'visible'::text));


--
-- Name: idx_products_category_ids; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category_ids ON products USING gin (category_ids);


--
-- Name: idx_products_external_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_external_id ON products USING btree (external_id);


--
-- Name: idx_products_external_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_external_source ON products USING btree (external_source);


--
-- Name: idx_products_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_featured ON products USING btree (featured);


--
-- Name: idx_products_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_parent_id ON products USING btree (parent_id);


--
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_price ON products USING btree (price);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_sku ON products USING btree (sku);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_slug ON products USING btree (slug);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_status ON products USING btree (status);


--
-- Name: idx_products_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_stock ON products USING btree (manage_stock, stock_quantity, infinite_stock) WHERE (manage_stock = true);


--
-- Name: idx_products_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_store_id ON products USING btree (store_id);


--
-- Name: idx_products_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_type ON products USING btree (type);


--
-- Name: idx_redirects_from_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_redirects_from_url ON redirects USING btree (from_url);


--
-- Name: idx_redirects_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_redirects_is_active ON redirects USING btree (is_active);


--
-- Name: idx_redirects_store_from_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_redirects_store_from_unique ON redirects USING btree (store_id, from_url);


--
-- Name: idx_redirects_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_redirects_store_id ON redirects USING btree (store_id);


--
-- Name: idx_service_credit_costs_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_credit_costs_active ON service_credit_costs USING btree (is_active);


--
-- Name: idx_service_credit_costs_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_credit_costs_category ON service_credit_costs USING btree (service_category);


--
-- Name: idx_service_credit_costs_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_credit_costs_display_order ON service_credit_costs USING btree (display_order);


--
-- Name: idx_service_credit_costs_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_credit_costs_key ON service_credit_costs USING btree (service_key);


--
-- Name: idx_shipping_methods_conditions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shipping_methods_conditions ON shipping_methods USING gin (conditions);


--
-- Name: idx_shipping_methods_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shipping_methods_is_active ON shipping_methods USING btree (is_active);


--
-- Name: idx_shipping_methods_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shipping_methods_store_id ON shipping_methods USING btree (store_id);


--
-- Name: idx_shopify_oauth_tokens_client_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shopify_oauth_tokens_client_id ON shopify_oauth_tokens USING btree (client_id);


--
-- Name: idx_shopify_oauth_tokens_shop_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens USING btree (shop_domain);


--
-- Name: idx_shopify_oauth_tokens_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shopify_oauth_tokens_store_id ON shopify_oauth_tokens USING btree (store_id);


--
-- Name: idx_slot_configurations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_slot_configurations_is_active ON slot_configurations USING btree (is_active);


--
-- Name: idx_slot_configurations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_slot_configurations_store_id ON slot_configurations USING btree (store_id);


--
-- Name: idx_store_invitations_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_invitations_email ON store_invitations USING btree (invited_email);


--
-- Name: idx_store_invitations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_invitations_status ON store_invitations USING btree (status);


--
-- Name: idx_store_invitations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_invitations_store_id ON store_invitations USING btree (store_id);


--
-- Name: idx_store_invitations_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_invitations_token ON store_invitations USING btree (invitation_token);


--
-- Name: idx_store_status_page_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_status_page_version ON slot_configurations USING btree (store_id, status, page_type, version_number);


--
-- Name: idx_store_teams_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_teams_status ON store_teams USING btree (status);


--
-- Name: idx_store_teams_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_teams_store_id ON store_teams USING btree (store_id);


--
-- Name: idx_store_teams_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_teams_user_id ON store_teams USING btree (user_id);


--
-- Name: idx_store_uptime_charged_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_uptime_charged_date ON store_uptime USING btree (charged_date);


--
-- Name: idx_store_uptime_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_uptime_created_at ON store_uptime USING btree (created_at);


--
-- Name: idx_store_uptime_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_uptime_store_id ON store_uptime USING btree (store_id);


--
-- Name: idx_store_uptime_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_uptime_user_id ON store_uptime USING btree (user_id);


--
-- Name: idx_store_uptime_user_store; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_store_uptime_user_store ON store_uptime USING btree (user_id, store_id);


--
-- Name: idx_stores_deployment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stores_deployment_status ON stores USING btree (deployment_status);


--
-- Name: idx_stores_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stores_is_active ON stores USING btree (is_active);


--
-- Name: idx_stores_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stores_published ON stores USING btree (published);


--
-- Name: idx_stores_published_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stores_published_at ON stores USING btree (published_at);


--
-- Name: idx_stores_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stores_slug ON stores USING btree (slug);


--
-- Name: idx_supabase_oauth_tokens_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supabase_oauth_tokens_store_id ON supabase_oauth_tokens USING btree (store_id);


--
-- Name: idx_supabase_project_keys_store_project; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supabase_project_keys_store_project ON supabase_project_keys USING btree (store_id, project_id);


--
-- Name: idx_taxes_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_taxes_is_active ON taxes USING btree (is_active);


--
-- Name: idx_taxes_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_taxes_store_id ON taxes USING btree (store_id);


--
-- Name: idx_translations_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_translations_type ON translations USING btree (type);


--
-- Name: idx_typing_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_typing_conversation ON chat_typing_indicators USING btree (conversation_id);


--
-- Name: idx_user_store_status_page; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_store_status_page ON slot_configurations USING btree (user_id, store_id, status, page_type);


--
-- Name: idx_users_account_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_account_type ON users USING btree (account_type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON users USING btree (email);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON users USING btree (is_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON users USING btree (role);


--
-- Name: integration_configs_store_id_integration_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX integration_configs_store_id_integration_type ON integration_configs USING btree (store_id, integration_type);


--
-- Name: job_history_executed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_history_executed_at ON job_history USING btree (executed_at);


--
-- Name: job_history_job_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_history_job_id ON job_history USING btree (job_id);


--
-- Name: job_history_job_id_executed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_history_job_id_executed_at ON job_history USING btree (job_id, executed_at);


--
-- Name: job_history_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_history_status ON job_history USING btree (status);


--
-- Name: jobs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_created_at ON jobs USING btree (created_at);


--
-- Name: jobs_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_priority ON jobs USING btree (priority);


--
-- Name: jobs_scheduled_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_scheduled_at ON jobs USING btree (scheduled_at);


--
-- Name: jobs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_status ON jobs USING btree (status);


--
-- Name: jobs_status_priority_scheduled_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_status_priority_scheduled_at ON jobs USING btree (status, priority, scheduled_at);


--
-- Name: jobs_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_store_id ON jobs USING btree (store_id);


--
-- Name: jobs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_type ON jobs USING btree (type);


--
-- Name: jobs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_user_id ON jobs USING btree (user_id);


--
-- Name: login_attempts_email_attempted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX login_attempts_email_attempted_at ON login_attempts USING btree (email, attempted_at);


--
-- Name: login_attempts_ip_address_attempted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX login_attempts_ip_address_attempted_at ON login_attempts USING btree (ip_address, attempted_at);


--
-- Name: media_assets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_assets_created_at ON media_assets USING btree (created_at);


--
-- Name: media_assets_folder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_assets_folder ON media_assets USING btree (folder);


--
-- Name: media_assets_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX media_assets_store_id ON media_assets USING btree (store_id);


--
-- Name: media_assets_store_id_file_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX media_assets_store_id_file_path ON media_assets USING btree (store_id, file_path);


--
-- Name: pdf_template_translations_language_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdf_template_translations_language_code ON pdf_template_translations USING btree (language_code);


--
-- Name: pdf_template_translations_pdf_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdf_template_translations_pdf_template_id ON pdf_template_translations USING btree (pdf_template_id);


--
-- Name: pdf_template_translations_pdf_template_id_language_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pdf_template_translations_pdf_template_id_language_code ON pdf_template_translations USING btree (pdf_template_id, language_code);


--
-- Name: pdf_templates_identifier_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pdf_templates_identifier_store_id ON pdf_templates USING btree (identifier, store_id);


--
-- Name: pdf_templates_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdf_templates_store_id ON pdf_templates USING btree (store_id);


--
-- Name: pdf_templates_template_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdf_templates_template_type ON pdf_templates USING btree (template_type);


--
-- Name: platform_admins_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX platform_admins_is_active ON platform_admins USING btree (is_active);


--
-- Name: platform_admins_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX platform_admins_role ON platform_admins USING btree (role);


--
-- Name: platform_admins_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX platform_admins_user_id ON platform_admins USING btree (user_id);


--
-- Name: plugin_configurations_health_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugin_configurations_health_status ON plugin_configurations USING btree (health_status);


--
-- Name: plugin_configurations_is_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugin_configurations_is_enabled ON plugin_configurations USING btree (is_enabled);


--
-- Name: plugin_configurations_plugin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugin_configurations_plugin_id ON plugin_configurations USING btree (plugin_id);


--
-- Name: plugin_configurations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugin_configurations_store_id ON plugin_configurations USING btree (store_id);


--
-- Name: plugins_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugins_category ON plugins USING btree (category);


--
-- Name: plugins_is_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugins_is_enabled ON plugins USING btree (is_enabled);


--
-- Name: plugins_is_installed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugins_is_installed ON plugins USING btree (is_installed);


--
-- Name: plugins_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plugins_slug ON plugins USING btree (slug);


--
-- Name: plugins_source_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugins_source_type ON plugins USING btree (source_type);


--
-- Name: plugins_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plugins_status ON plugins USING btree (status);


--
-- Name: product_attribute_values_attribute_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_attribute_values_attribute_id ON product_attribute_values USING btree (attribute_id);


--
-- Name: product_attribute_values_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_attribute_values_product_id ON product_attribute_values USING btree (product_id);


--
-- Name: product_attribute_values_value_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_attribute_values_value_id ON product_attribute_values USING btree (value_id);


--
-- Name: product_labels_store_id_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_labels_store_id_slug ON product_labels USING btree (store_id, slug);


--
-- Name: product_tabs_store_id_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_tabs_store_id_slug ON product_tabs USING btree (store_id, slug);


--
-- Name: product_translations_name_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_translations_name_search_idx ON product_translations USING gin (to_tsvector('english'::regconfig, (name)::text));


--
-- Name: product_variants_parent_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_variants_parent_product_id ON product_variants USING btree (parent_product_id);


--
-- Name: product_variants_parent_product_id_variant_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX product_variants_parent_product_id_variant_product_id ON product_variants USING btree (parent_product_id, variant_product_id);


--
-- Name: product_variants_variant_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX product_variants_variant_product_id ON product_variants USING btree (variant_product_id);


--
-- Name: redirects_entity_type_entity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX redirects_entity_type_entity_id ON redirects USING btree (entity_type, entity_id);


--
-- Name: redirects_store_id_from_url; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX redirects_store_id_from_url ON redirects USING btree (store_id, from_url);


--
-- Name: seo_templates_store_id_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX seo_templates_store_id_name ON seo_templates USING btree (store_id, name);


--
-- Name: service_credit_costs_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_credit_costs_display_order ON service_credit_costs USING btree (display_order);


--
-- Name: service_credit_costs_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_credit_costs_is_active ON service_credit_costs USING btree (is_active);


--
-- Name: service_credit_costs_service_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_credit_costs_service_category ON service_credit_costs USING btree (service_category);


--
-- Name: service_credit_costs_service_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_credit_costs_service_key ON service_credit_costs USING btree (service_key);


--
-- Name: shopify_oauth_tokens_shop_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens USING btree (shop_domain);


--
-- Name: shopify_oauth_tokens_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shopify_oauth_tokens_store_id ON shopify_oauth_tokens USING btree (store_id);


--
-- Name: slot_configurations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX slot_configurations_is_active ON slot_configurations USING btree (is_active);


--
-- Name: slot_configurations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX slot_configurations_store_id ON slot_configurations USING btree (store_id);


--
-- Name: store_invitations_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_invitations_expires_at ON store_invitations USING btree (expires_at);


--
-- Name: store_invitations_invitation_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_invitations_invitation_token ON store_invitations USING btree (invitation_token);


--
-- Name: store_invitations_invited_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_invitations_invited_email ON store_invitations USING btree (invited_email);


--
-- Name: store_invitations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_invitations_status ON store_invitations USING btree (status);


--
-- Name: store_invitations_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_invitations_store_id ON store_invitations USING btree (store_id);


--
-- Name: store_teams_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_teams_status ON store_teams USING btree (status);


--
-- Name: store_teams_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_teams_store_id ON store_teams USING btree (store_id);


--
-- Name: store_teams_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX store_teams_user_id ON store_teams USING btree (user_id);


--
-- Name: subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_status ON subscriptions USING btree (status);


--
-- Name: subscriptions_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_store_id ON subscriptions USING btree (store_id);


--
-- Name: supabase_project_keys_store_id_project_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX supabase_project_keys_store_id_project_id ON supabase_project_keys USING btree (store_id, project_id);


--
-- Name: translations_category_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_category_index ON translations USING btree (category);


--
-- Name: translations_duplicate_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_duplicate_category_idx ON translations_duplicate USING btree (category);


--
-- Name: translations_duplicate_language_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_duplicate_language_code_idx ON translations_duplicate USING btree (language_code);


--
-- Name: translations_duplicate_store_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_duplicate_store_id_idx ON translations_duplicate USING btree (store_id);


--
-- Name: translations_duplicate_store_id_key_language_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX translations_duplicate_store_id_key_language_code_idx ON translations_duplicate USING btree (store_id, key, language_code);


--
-- Name: translations_duplicate_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_duplicate_type_idx ON translations_duplicate USING btree (type);


--
-- Name: translations_language_code_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_language_code_index ON translations USING btree (language_code);


--
-- Name: translations_store_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX translations_store_id_index ON translations USING btree (store_id);


--
-- Name: translations_store_key_language_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX translations_store_key_language_unique ON translations USING btree (store_id, key, language_code);


--
-- Name: unique_customer_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_customer_email ON customers USING btree (email);


--
-- Name: unique_email_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_email_role ON users USING btree (email, role);


--
-- Name: unique_plugin_store_config; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_plugin_store_config ON plugin_configurations USING btree (plugin_id, store_id);


--
-- Name: unique_session_store_cart; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_session_store_cart ON carts USING btree (session_id, store_id);


--
-- Name: unique_store_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_store_session ON heatmap_sessions USING btree (store_id, session_id);


--
-- Name: unique_store_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_store_user ON store_teams USING btree (store_id, user_id);


--
-- Name: unique_test_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_test_session ON ab_test_assignments USING btree (test_id, session_id);


--
-- Name: usage_metrics_metric_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX usage_metrics_metric_date ON usage_metrics USING btree (metric_date);


--
-- Name: usage_metrics_store_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX usage_metrics_store_id ON usage_metrics USING btree (store_id);


--
-- Name: usage_metrics_store_id_metric_date_metric_hour; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX usage_metrics_store_id_metric_date_metric_hour ON usage_metrics USING btree (store_id, metric_date, metric_hour);


--
-- Name: wishlists_session_id_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX wishlists_session_id_product_id ON wishlists USING btree (session_id, product_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: plugin_versions_with_tags _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW plugin_versions_with_tags AS
SELECT vh.id,
       vh.plugin_id,
       vh.version_number,
       vh.version_type,
       vh.commit_message,
       vh.is_current,
       vh.is_published,
       vh.files_changed,
       vh.lines_added,
       vh.lines_deleted,
       vh.created_at,
       vh.created_by_name,
       COALESCE(json_agg(json_build_object('name', vt.tag_name, 'type', vt.tag_type)) FILTER (WHERE (vt.id IS NOT NULL)), '[]'::json) AS tags
FROM (plugin_version_history vh
    LEFT JOIN plugin_version_tags vt ON ((vh.id = vt.version_id)))
GROUP BY vh.id;


--
-- Name: plugin_admin_pages plugin_admin_pages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER plugin_admin_pages_updated_at BEFORE UPDATE ON plugin_admin_pages FOR EACH ROW EXECUTE FUNCTION update_plugin_admin_pages_timestamp();


--
-- Name: plugin_admin_scripts plugin_admin_scripts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER plugin_admin_scripts_updated_at BEFORE UPDATE ON plugin_admin_scripts FOR EACH ROW EXECUTE FUNCTION update_plugin_admin_scripts_timestamp();


--
-- Name: plugin_version_history trigger_auto_increment_snapshot_distance; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_auto_increment_snapshot_distance BEFORE INSERT ON plugin_version_history FOR EACH ROW EXECUTE FUNCTION auto_increment_snapshot_distance();


--
-- Name: plugin_version_history trigger_ensure_single_current_version; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_ensure_single_current_version BEFORE INSERT OR UPDATE ON plugin_version_history FOR EACH ROW EXECUTE FUNCTION ensure_single_current_version();


--
-- Name: cms_blocks trigger_update_cms_blocks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_cms_blocks_updated_at BEFORE UPDATE ON cms_blocks FOR EACH ROW EXECUTE FUNCTION update_cms_blocks_updated_at();


--
-- Name: service_credit_costs trigger_update_service_credit_costs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_service_credit_costs_updated_at BEFORE UPDATE ON service_credit_costs FOR EACH ROW EXECUTE FUNCTION update_service_credit_costs_updated_at();


--
-- Name: ab_test_variants update_ab_test_variants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ab_test_variants_updated_at BEFORE UPDATE ON ab_test_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: attribute_sets update_attribute_sets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_attribute_sets_updated_at BEFORE UPDATE ON attribute_sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: attributes update_attributes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_attributes_updated_at BEFORE UPDATE ON attributes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: brevo_configurations update_brevo_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brevo_configurations_updated_at BEFORE UPDATE ON brevo_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: cms_pages update_cms_pages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON cms_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: coupons update_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: credit_pricing update_credit_pricing_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_credit_pricing_updated_at BEFORE UPDATE ON credit_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: credit_transactions update_credit_transactions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_credit_transactions_updated_at BEFORE UPDATE ON credit_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: cron_jobs update_cron_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cron_jobs_updated_at BEFORE UPDATE ON cron_jobs FOR EACH ROW EXECUTE FUNCTION update_cron_jobs_updated_at();


--
-- Name: custom_option_rules update_custom_option_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_custom_option_rules_updated_at BEFORE UPDATE ON custom_option_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: delivery_settings update_delivery_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_delivery_settings_updated_at BEFORE UPDATE ON delivery_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: email_send_logs update_email_send_logs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_email_send_logs_updated_at BEFORE UPDATE ON email_send_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: email_template_translations update_email_template_translations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_email_template_translations_updated_at BEFORE UPDATE ON email_template_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: email_templates update_email_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: heatmap_aggregations update_heatmap_aggregations_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_heatmap_aggregations_timestamp BEFORE UPDATE ON heatmap_aggregations FOR EACH ROW EXECUTE FUNCTION update_heatmap_timestamp();


--
-- Name: heatmap_interactions update_heatmap_interactions_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_heatmap_interactions_timestamp BEFORE UPDATE ON heatmap_interactions FOR EACH ROW EXECUTE FUNCTION update_heatmap_timestamp();


--
-- Name: heatmap_sessions update_heatmap_sessions_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_heatmap_sessions_timestamp BEFORE UPDATE ON heatmap_sessions FOR EACH ROW EXECUTE FUNCTION update_heatmap_timestamp();


--
-- Name: jobs update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: admin_navigation_config update_navigation_config_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_navigation_config_updated_at BEFORE UPDATE ON admin_navigation_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: pdf_template_translations update_pdf_template_translations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_pdf_template_translations_updated_at BEFORE UPDATE ON pdf_template_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: plugin_data update_plugin_data_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_plugin_data_updated_at BEFORE UPDATE ON plugin_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: plugin_events update_plugin_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_plugin_events_updated_at BEFORE UPDATE ON plugin_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: plugin_hooks update_plugin_hooks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_plugin_hooks_updated_at BEFORE UPDATE ON plugin_hooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: plugin_scripts update_plugin_scripts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_plugin_scripts_updated_at BEFORE UPDATE ON plugin_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: redirects update_redirects_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_redirects_updated_at BEFORE UPDATE ON redirects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: shipping_methods update_shipping_methods_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shipping_methods_updated_at BEFORE UPDATE ON shipping_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: shopify_oauth_tokens update_shopify_oauth_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_shopify_oauth_tokens_updated_at BEFORE UPDATE ON shopify_oauth_tokens FOR EACH ROW EXECUTE FUNCTION update_shopify_oauth_tokens_updated_at();


--
-- Name: stores update_stores_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: supabase_oauth_tokens update_supabase_oauth_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_supabase_oauth_tokens_updated_at BEFORE UPDATE ON supabase_oauth_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: taxes update_taxes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON taxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

-- ALTER TABLE ONLY auth.mfa_amr_claims
--     ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.mfa_challenges
--     ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.mfa_factors
--     ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.oauth_authorizations
--     ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.oauth_authorizations
--     ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.oauth_consents
--     ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.oauth_consents
--     ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.one_time_tokens
--     ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.refresh_tokens
--     ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.saml_providers
--     ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.saml_relay_states
--     ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.saml_relay_states
--     ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.sessions
--     ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.sessions
--     ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
-- --
--
-- ALTER TABLE ONLY auth.sso_domains
--     ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: ab_test_assignments ab_test_assignments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_assignments
--     ADD CONSTRAINT ab_test_assignments_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: ab_test_assignments ab_test_assignments_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_assignments
--     ADD CONSTRAINT ab_test_assignments_test_id_fkey FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: ab_test_assignments ab_test_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_assignments
--     ADD CONSTRAINT ab_test_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: ab_test_variants ab_test_variants_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_test_variants
--     ADD CONSTRAINT ab_test_variants_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: ab_tests ab_tests_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ab_tests
--     ADD CONSTRAINT ab_tests_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: ai_usage_logs ai_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY ai_usage_logs
--     ADD CONSTRAINT ai_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: akeneo_custom_mappings akeneo_custom_mappings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_custom_mappings
--     ADD CONSTRAINT akeneo_custom_mappings_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: akeneo_custom_mappings akeneo_custom_mappings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_custom_mappings
--     ADD CONSTRAINT akeneo_custom_mappings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: akeneo_custom_mappings akeneo_custom_mappings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_custom_mappings
--     ADD CONSTRAINT akeneo_custom_mappings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: akeneo_import_statistics akeneo_import_statistics_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_import_statistics
--     ADD CONSTRAINT akeneo_import_statistics_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: akeneo_mappings akeneo_mappings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_mappings
--     ADD CONSTRAINT akeneo_mappings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: akeneo_schedules akeneo_schedules_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY akeneo_schedules
--     ADD CONSTRAINT akeneo_schedules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: attribute_sets attribute_sets_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_sets
--     ADD CONSTRAINT attribute_sets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: attribute_translations attribute_translations_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_translations
--     ADD CONSTRAINT attribute_translations_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: attribute_translations attribute_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_translations
--     ADD CONSTRAINT attribute_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: attribute_value_translations attribute_value_translations_attribute_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_value_translations
--     ADD CONSTRAINT attribute_value_translations_attribute_value_id_fkey FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: attribute_value_translations attribute_value_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_value_translations
--     ADD CONSTRAINT attribute_value_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: attribute_values attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attribute_values
--     ADD CONSTRAINT attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: attributes attributes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY attributes
--     ADD CONSTRAINT attributes_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: blacklist_countries blacklist_countries_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_countries
--     ADD CONSTRAINT blacklist_countries_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: blacklist_emails blacklist_emails_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_emails
--     ADD CONSTRAINT blacklist_emails_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: blacklist_ips blacklist_ips_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_ips
--     ADD CONSTRAINT blacklist_ips_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: blacklist_settings blacklist_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY blacklist_settings
--     ADD CONSTRAINT blacklist_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: brevo_configurations brevo_configurations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY brevo_configurations
--     ADD CONSTRAINT brevo_configurations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: canonical_urls canonical_urls_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY canonical_urls
--     ADD CONSTRAINT canonical_urls_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: canonical_urls canonical_urls_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY canonical_urls
--     ADD CONSTRAINT canonical_urls_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: carts carts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY carts
--     ADD CONSTRAINT carts_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY carts
--     ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY categories
--     ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: categories categories_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY categories
--     ADD CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: category_seo category_seo_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY category_seo
--     ADD CONSTRAINT category_seo_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: category_seo category_seo_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY category_seo
--     ADD CONSTRAINT category_seo_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: category_translations category_translations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY category_translations
--     ADD CONSTRAINT category_translations_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: category_translations category_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY category_translations
--     ADD CONSTRAINT category_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_messages
--     ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: chat_typing_indicators chat_typing_indicators_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY chat_typing_indicators
--     ADD CONSTRAINT chat_typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_block_translations cms_block_translations_cms_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_block_translations
--     ADD CONSTRAINT cms_block_translations_cms_block_id_fkey FOREIGN KEY (cms_block_id) REFERENCES cms_blocks(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_block_translations cms_block_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_block_translations
--     ADD CONSTRAINT cms_block_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_blocks cms_blocks_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_blocks
--     ADD CONSTRAINT cms_blocks_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_page_seo cms_page_seo_cms_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_page_seo
--     ADD CONSTRAINT cms_page_seo_cms_page_id_fkey FOREIGN KEY (cms_page_id) REFERENCES cms_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_page_seo cms_page_seo_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_page_seo
--     ADD CONSTRAINT cms_page_seo_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_page_translations cms_page_translations_cms_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_page_translations
--     ADD CONSTRAINT cms_page_translations_cms_page_id_fkey FOREIGN KEY (cms_page_id) REFERENCES cms_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_page_translations cms_page_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_page_translations
--     ADD CONSTRAINT cms_page_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: cms_pages cms_pages_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cms_pages
--     ADD CONSTRAINT cms_pages_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: consent_logs consent_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY consent_logs
--     ADD CONSTRAINT consent_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: consent_logs consent_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY consent_logs
--     ADD CONSTRAINT consent_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: cookie_consent_settings cookie_consent_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cookie_consent_settings
--     ADD CONSTRAINT cookie_consent_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: coupon_translations coupon_translations_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY coupon_translations
--     ADD CONSTRAINT coupon_translations_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: coupon_translations coupon_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY coupon_translations
--     ADD CONSTRAINT coupon_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: coupons coupons_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY coupons
--     ADD CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: credit_transactions credit_transactions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_transactions
--     ADD CONSTRAINT credit_transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: credit_transactions credit_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_transactions
--     ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: credit_usage credit_usage_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_usage
--     ADD CONSTRAINT credit_usage_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: credit_usage credit_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credit_usage
--     ADD CONSTRAINT credit_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: credits credits_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credits
--     ADD CONSTRAINT credits_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: credits credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY credits
--     ADD CONSTRAINT credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: cron_job_executions cron_job_executions_cron_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_job_executions
--     ADD CONSTRAINT cron_job_executions_cron_job_id_fkey FOREIGN KEY (cron_job_id) REFERENCES cron_jobs(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: cron_job_executions cron_job_executions_triggered_by_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_job_executions
--     ADD CONSTRAINT cron_job_executions_triggered_by_user_fkey FOREIGN KEY (triggered_by_user) REFERENCES users(id);
--
--
-- --
-- -- Name: cron_jobs cron_jobs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_jobs
--     ADD CONSTRAINT cron_jobs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: cron_jobs cron_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cron_jobs
--     ADD CONSTRAINT cron_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: custom_analytics_events custom_analytics_events_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_analytics_events
--     ADD CONSTRAINT custom_analytics_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: custom_domains custom_domains_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_domains
--     ADD CONSTRAINT custom_domains_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: custom_option_rules custom_option_rules_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_option_rules
--     ADD CONSTRAINT custom_option_rules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: custom_pricing_discounts custom_pricing_discounts_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_pricing_discounts
--     ADD CONSTRAINT custom_pricing_discounts_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES custom_pricing_rules(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: custom_pricing_logs custom_pricing_logs_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY custom_pricing_logs
--     ADD CONSTRAINT custom_pricing_logs_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES custom_pricing_rules(id);
--
--
-- --
-- -- Name: customer_activities customer_activities_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_activities
--     ADD CONSTRAINT customer_activities_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: customer_activities customer_activities_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_activities
--     ADD CONSTRAINT customer_activities_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: customer_activities customer_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_activities
--     ADD CONSTRAINT customer_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_addresses
--     ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: customer_addresses customer_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customer_addresses
--     ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: customers customers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY customers
--     ADD CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: delivery_settings delivery_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY delivery_settings
--     ADD CONSTRAINT delivery_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: email_send_logs email_send_logs_email_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_send_logs
--     ADD CONSTRAINT email_send_logs_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: email_send_logs email_send_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_send_logs
--     ADD CONSTRAINT email_send_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: email_template_translations email_template_translations_email_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_template_translations
--     ADD CONSTRAINT email_template_translations_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: email_templates email_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY email_templates
--     ADD CONSTRAINT email_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: cookie_consent_settings_translations fk_cookie_consent_settings; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY cookie_consent_settings_translations
--     ADD CONSTRAINT fk_cookie_consent_settings FOREIGN KEY (cookie_consent_settings_id) REFERENCES cookie_consent_settings(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: admin_navigation_registry fk_navigation_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY admin_navigation_registry
--     ADD CONSTRAINT fk_navigation_parent FOREIGN KEY (parent_key) REFERENCES admin_navigation_registry(key) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_comparisons fk_plugin_comparison_from; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_comparisons
--     ADD CONSTRAINT fk_plugin_comparison_from FOREIGN KEY (from_version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_comparisons fk_plugin_comparison_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_comparisons
--     ADD CONSTRAINT fk_plugin_comparison_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_comparisons fk_plugin_comparison_to; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_comparisons
--     ADD CONSTRAINT fk_plugin_comparison_to FOREIGN KEY (to_version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_controllers fk_plugin_controllers_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_controllers
--     ADD CONSTRAINT fk_plugin_controllers_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_docs fk_plugin_docs_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_docs
--     ADD CONSTRAINT fk_plugin_docs_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_entities fk_plugin_entities_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_entities
--     ADD CONSTRAINT fk_plugin_entities_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_migrations fk_plugin_migrations_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_migrations
--     ADD CONSTRAINT fk_plugin_migrations_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_patches fk_plugin_patch_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_patches
--     ADD CONSTRAINT fk_plugin_patch_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_patches fk_plugin_patch_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_patches
--     ADD CONSTRAINT fk_plugin_patch_version FOREIGN KEY (version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_snapshots fk_plugin_snapshot_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_snapshots
--     ADD CONSTRAINT fk_plugin_snapshot_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_snapshots fk_plugin_snapshot_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_snapshots
--     ADD CONSTRAINT fk_plugin_snapshot_version FOREIGN KEY (version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_tags fk_plugin_tag_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_tags
--     ADD CONSTRAINT fk_plugin_tag_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_tags fk_plugin_tag_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_tags
--     ADD CONSTRAINT fk_plugin_tag_version FOREIGN KEY (version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: plugin_version_history fk_plugin_version_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_history
--     ADD CONSTRAINT fk_plugin_version_parent FOREIGN KEY (parent_version_id) REFERENCES plugin_version_history(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: plugin_version_history fk_plugin_version_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_version_history
--     ADD CONSTRAINT fk_plugin_version_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: heatmap_aggregations heatmap_aggregations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_aggregations
--     ADD CONSTRAINT heatmap_aggregations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: heatmap_interactions heatmap_interactions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_interactions
--     ADD CONSTRAINT heatmap_interactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: heatmap_interactions heatmap_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_interactions
--     ADD CONSTRAINT heatmap_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: heatmap_sessions heatmap_sessions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_sessions
--     ADD CONSTRAINT heatmap_sessions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: heatmap_sessions heatmap_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY heatmap_sessions
--     ADD CONSTRAINT heatmap_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: integration_configs integration_configs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY integration_configs
--     ADD CONSTRAINT integration_configs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
--
--
-- --
-- -- Name: job_history job_history_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY job_history
--     ADD CONSTRAINT job_history_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: jobs jobs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY jobs
--     ADD CONSTRAINT jobs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: jobs jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY jobs
--     ADD CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: media_assets media_assets_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY media_assets
--     ADD CONSTRAINT media_assets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: media_assets media_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY media_assets
--     ADD CONSTRAINT media_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id);
--
--
-- --
-- -- Name: payment_method_translations payment_method_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY payment_method_translations
--     ADD CONSTRAINT payment_method_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: payment_method_translations payment_method_translations_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY payment_method_translations
--     ADD CONSTRAINT payment_method_translations_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: payment_methods payment_methods_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY payment_methods
--     ADD CONSTRAINT payment_methods_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: pdf_template_translations pdf_template_translations_pdf_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY pdf_template_translations
--     ADD CONSTRAINT pdf_template_translations_pdf_template_id_fkey FOREIGN KEY (pdf_template_id) REFERENCES pdf_templates(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: pdf_templates pdf_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY pdf_templates
--     ADD CONSTRAINT pdf_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: platform_admins platform_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY platform_admins
--     ADD CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: plugin_configurations plugin_configurations_last_configured_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_configurations
--     ADD CONSTRAINT plugin_configurations_last_configured_by_fkey FOREIGN KEY (last_configured_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: plugin_configurations plugin_configurations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_configurations
--     ADD CONSTRAINT plugin_configurations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: plugin_marketplace plugin_marketplace_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_marketplace
--     ADD CONSTRAINT plugin_marketplace_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);
--
--
-- --
-- -- Name: plugin_registry plugin_registry_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY plugin_registry
--     ADD CONSTRAINT plugin_registry_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES users(id);
--
--
-- --
-- -- Name: product_attribute_values product_attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_attribute_values
--     ADD CONSTRAINT product_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: product_attribute_values product_attribute_values_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_attribute_values
--     ADD CONSTRAINT product_attribute_values_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: product_attribute_values product_attribute_values_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_attribute_values
--     ADD CONSTRAINT product_attribute_values_value_id_fkey FOREIGN KEY (value_id) REFERENCES attribute_values(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: product_label_translations product_label_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_label_translations
--     ADD CONSTRAINT product_label_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_label_translations product_label_translations_product_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_label_translations
--     ADD CONSTRAINT product_label_translations_product_label_id_fkey FOREIGN KEY (product_label_id) REFERENCES product_labels(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_labels product_labels_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_labels
--     ADD CONSTRAINT product_labels_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: product_seo product_seo_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_seo
--     ADD CONSTRAINT product_seo_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_seo product_seo_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_seo
--     ADD CONSTRAINT product_seo_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_tab_translations product_tab_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_tab_translations
--     ADD CONSTRAINT product_tab_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_tab_translations product_tab_translations_product_tab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_tab_translations
--     ADD CONSTRAINT product_tab_translations_product_tab_id_fkey FOREIGN KEY (product_tab_id) REFERENCES product_tabs(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_tabs product_tabs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_tabs
--     ADD CONSTRAINT product_tabs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: product_translations product_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_translations
--     ADD CONSTRAINT product_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_translations product_translations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_translations
--     ADD CONSTRAINT product_translations_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_variants product_variants_parent_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_variants
--     ADD CONSTRAINT product_variants_parent_product_id_fkey FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: product_variants product_variants_variant_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY product_variants
--     ADD CONSTRAINT product_variants_variant_product_id_fkey FOREIGN KEY (variant_product_id) REFERENCES products(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: products products_attribute_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY products
--     ADD CONSTRAINT products_attribute_set_id_fkey FOREIGN KEY (attribute_set_id) REFERENCES attribute_sets(id) ON DELETE SET NULL;
--
--
-- --
-- -- Name: products products_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY products
--     ADD CONSTRAINT products_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES products(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: products products_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY products
--     ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: redirects redirects_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY redirects
--     ADD CONSTRAINT redirects_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: sales_invoices sales_invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_invoices
--     ADD CONSTRAINT sales_invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES sales_orders(id);
--
--
-- --
-- -- Name: sales_invoices sales_invoices_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_invoices
--     ADD CONSTRAINT sales_invoices_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
--
--
-- --
-- -- Name: sales_order_items sales_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_order_items
--     ADD CONSTRAINT sales_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: sales_order_items sales_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_order_items
--     ADD CONSTRAINT sales_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: sales_orders sales_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_orders
--     ADD CONSTRAINT sales_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: sales_orders sales_orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_orders
--     ADD CONSTRAINT sales_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: sales_shipments sales_shipments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_shipments
--     ADD CONSTRAINT sales_shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES sales_orders(id);
--
--
-- --
-- -- Name: sales_shipments sales_shipments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY sales_shipments
--     ADD CONSTRAINT sales_shipments_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
--
--
-- --
-- -- Name: seo_settings seo_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY seo_settings
--     ADD CONSTRAINT seo_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: seo_templates seo_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY seo_templates
--     ADD CONSTRAINT seo_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: shipping_method_translations shipping_method_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shipping_method_translations
--     ADD CONSTRAINT shipping_method_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: shipping_method_translations shipping_method_translations_shipping_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shipping_method_translations
--     ADD CONSTRAINT shipping_method_translations_shipping_method_id_fkey FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: shipping_methods shipping_methods_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shipping_methods
--     ADD CONSTRAINT shipping_methods_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: shopify_oauth_tokens shopify_oauth_tokens_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY shopify_oauth_tokens
--     ADD CONSTRAINT shopify_oauth_tokens_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: slot_configurations slot_configurations_acceptance_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_acceptance_published_by_fkey FOREIGN KEY (acceptance_published_by) REFERENCES users(id);
--
--
-- --
-- -- Name: slot_configurations slot_configurations_current_edit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_current_edit_id_fkey FOREIGN KEY (current_edit_id) REFERENCES slot_configurations(id);
--
--
-- --
-- -- Name: slot_configurations slot_configurations_parent_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES slot_configurations(id);
--
--
-- --
-- -- Name: slot_configurations slot_configurations_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_published_by_fkey FOREIGN KEY (published_by) REFERENCES users(id);
--
--
-- --
-- -- Name: slot_configurations slot_configurations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: slot_configurations slot_configurations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY slot_configurations
--     ADD CONSTRAINT slot_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: store_invitations store_invitations_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_invitations
--     ADD CONSTRAINT store_invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES users(id);
--
--
-- --
-- -- Name: store_invitations store_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_invitations
--     ADD CONSTRAINT store_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id);
--
--
-- --
-- -- Name: store_invitations store_invitations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_invitations
--     ADD CONSTRAINT store_invitations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: store_teams store_teams_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_teams
--     ADD CONSTRAINT store_teams_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id);
--
--
-- --
-- -- Name: store_teams store_teams_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_teams
--     ADD CONSTRAINT store_teams_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: store_teams store_teams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_teams
--     ADD CONSTRAINT store_teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: store_uptime store_uptime_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_uptime
--     ADD CONSTRAINT store_uptime_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: store_uptime store_uptime_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY store_uptime
--     ADD CONSTRAINT store_uptime_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: stores stores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY stores
--     ADD CONSTRAINT stores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;
--
--
-- --
-- -- Name: subscriptions subscriptions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY subscriptions
--     ADD CONSTRAINT subscriptions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: supabase_oauth_tokens supabase_oauth_tokens_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY supabase_oauth_tokens
--     ADD CONSTRAINT supabase_oauth_tokens_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: supabase_project_keys supabase_project_keys_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY supabase_project_keys
--     ADD CONSTRAINT supabase_project_keys_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: taxes taxes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY taxes
--     ADD CONSTRAINT taxes_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
--
--
-- --
-- -- Name: translations_duplicate translations_duplicate_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY translations_duplicate
--     ADD CONSTRAINT translations_duplicate_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
--
--
-- --
-- -- Name: translations translations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY translations
--     ADD CONSTRAINT translations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);
--
--
-- --
-- -- Name: usage_metrics usage_metrics_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY usage_metrics
--     ADD CONSTRAINT usage_metrics_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: wishlists wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY wishlists
--     ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: wishlists wishlists_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY wishlists
--     ADD CONSTRAINT wishlists_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;
--
--
-- --
-- -- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
-- --
--
-- ALTER TABLE ONLY wishlists
--     ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;
--
--
-- --
-- -- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.objects
--     ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);
--
--
-- --
-- -- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.prefixes
--     ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);
--
--
-- --
-- -- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.s3_multipart_uploads
--     ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);
--
--
-- --
-- -- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.s3_multipart_uploads_parts
--     ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);
--
--
-- --
-- -- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
-- --
--
-- ALTER TABLE ONLY storage.s3_multipart_uploads_parts
--     ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;

