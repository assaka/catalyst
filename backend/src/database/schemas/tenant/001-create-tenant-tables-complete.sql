-- ============================================
-- TENANT DATABASE COMPLETE SCHEMA
-- Auto-generated from existing database
-- ============================================

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

CREATE TABLE IF NOT EXISTS cart_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255),
  session_id VARCHAR(255),
  cart_total NUMERIC,
  cart_items_count INTEGER,
  source VARCHAR(50) DEFAULT 'cart'::character varying,
  subscribed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  store_id UUID NOT NULL,
  balance NUMERIC DEFAULT 0 NOT NULL,
  total_purchased NUMERIC DEFAULT 0 NOT NULL,
  total_used NUMERIC DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
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

CREATE TABLE IF NOT EXISTS file_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL,
  baseline_code TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  version TEXT DEFAULT 'latest'::text,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hamid_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id VARCHAR(255),
  cart_subtotal NUMERIC DEFAULT 0.00,
  cart_total NUMERIC DEFAULT 0.00,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referrer_url TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cart_items_count INTEGER
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
  tags ARRAY,
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

CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'support'::character varying NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

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

CREATE TABLE IF NOT EXISTS service_credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key VARCHAR(100) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_category service_category NOT NULL,
  description TEXT,
  cost_per_unit NUMERIC DEFAULT 0.0000 NOT NULL,
  billing_type billing_type NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
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

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'trial'::character varying NOT NULL,
  price_monthly NUMERIC,
  price_annual NUMERIC,
  billing_cycle VARCHAR(20) DEFAULT 'monthly'::character varying,
  currency VARCHAR(3) DEFAULT 'USD'::character varying,
  max_products INTEGER,
  max_orders_per_month INTEGER,
  max_storage_gb INTEGER,
  max_api_calls_per_month INTEGER,
  max_admin_users INTEGER DEFAULT 5,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

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
  credits NUMERIC DEFAULT 0.00,
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


-- ============================================
-- SCHEMA EXTRACTION COMPLETE
-- 137 tables
-- ============================================
