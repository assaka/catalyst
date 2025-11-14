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


ALTER TABLE ONLY _migrations
    ADD CONSTRAINT _migrations_pkey PRIMARY KEY (name);


--
-- Name: ab_test_assignments ab_test_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_assignments
    ADD CONSTRAINT ab_test_assignments_pkey PRIMARY KEY (id);


--
-- Name: ab_test_variants ab_test_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_variants
    ADD CONSTRAINT ab_test_variants_pkey PRIMARY KEY (id);


--
-- Name: ab_test_variants ab_test_variants_store_id_test_name_variant_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_variants
    ADD CONSTRAINT ab_test_variants_store_id_test_name_variant_name_key UNIQUE (store_id, test_name, variant_name);


--
-- Name: ab_tests ab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_tests
    ADD CONSTRAINT ab_tests_pkey PRIMARY KEY (id);


--
-- Name: admin_navigation_config admin_navigation_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admin_navigation_config
    ADD CONSTRAINT admin_navigation_config_pkey PRIMARY KEY (id);


--
-- Name: admin_navigation_registry admin_navigation_registry_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admin_navigation_registry
    ADD CONSTRAINT admin_navigation_registry_key_key UNIQUE (key);


--
-- Name: admin_navigation_registry admin_navigation_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admin_navigation_registry
    ADD CONSTRAINT admin_navigation_registry_pkey PRIMARY KEY (id);


--
-- Name: ai_code_patterns ai_code_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_code_patterns
    ADD CONSTRAINT ai_code_patterns_pkey PRIMARY KEY (id);


--
-- Name: ai_context_documents ai_context_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_context_documents
    ADD CONSTRAINT ai_context_documents_pkey PRIMARY KEY (id);


--
-- Name: ai_context_usage ai_context_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_context_usage
    ADD CONSTRAINT ai_context_usage_pkey PRIMARY KEY (id);


--
-- Name: ai_plugin_examples ai_plugin_examples_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_plugin_examples
    ADD CONSTRAINT ai_plugin_examples_pkey PRIMARY KEY (id);


--
-- Name: ai_plugin_examples ai_plugin_examples_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_plugin_examples
    ADD CONSTRAINT ai_plugin_examples_slug_key UNIQUE (slug);


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_user_preferences ai_user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_user_preferences
    ADD CONSTRAINT ai_user_preferences_pkey PRIMARY KEY (id);


--
-- Name: akeneo_custom_mappings akeneo_custom_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_custom_mappings
    ADD CONSTRAINT akeneo_custom_mappings_pkey PRIMARY KEY (id);


--
-- Name: akeneo_custom_mappings akeneo_custom_mappings_store_id_mapping_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_custom_mappings
    ADD CONSTRAINT akeneo_custom_mappings_store_id_mapping_type_key UNIQUE (store_id, mapping_type);


--
-- Name: akeneo_import_statistics akeneo_import_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_import_statistics
    ADD CONSTRAINT akeneo_import_statistics_pkey PRIMARY KEY (id);


--
-- Name: akeneo_mappings akeneo_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_mappings
    ADD CONSTRAINT akeneo_mappings_pkey PRIMARY KEY (id);


--
-- Name: akeneo_schedules akeneo_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_schedules
    ADD CONSTRAINT akeneo_schedules_pkey PRIMARY KEY (id);


--
-- Name: attribute_sets attribute_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_sets
    ADD CONSTRAINT attribute_sets_pkey PRIMARY KEY (id);


--
-- Name: attribute_translations attribute_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_translations
    ADD CONSTRAINT attribute_translations_pkey PRIMARY KEY (attribute_id, language_code);


--
-- Name: attribute_value_translations attribute_value_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_value_translations
    ADD CONSTRAINT attribute_value_translations_pkey PRIMARY KEY (attribute_value_id, language_code);


--
-- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_values
    ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (id);


--
-- Name: attributes attributes_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attributes
    ADD CONSTRAINT attributes_code_key UNIQUE (code);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: blacklist_countries blacklist_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_countries
    ADD CONSTRAINT blacklist_countries_pkey PRIMARY KEY (id);


--
-- Name: blacklist_countries blacklist_countries_store_id_country_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_countries
    ADD CONSTRAINT blacklist_countries_store_id_country_code_key UNIQUE (store_id, country_code);


--
-- Name: blacklist_emails blacklist_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_emails
    ADD CONSTRAINT blacklist_emails_pkey PRIMARY KEY (id);


--
-- Name: blacklist_emails blacklist_emails_store_id_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_emails
    ADD CONSTRAINT blacklist_emails_store_id_email_key UNIQUE (store_id, email);


--
-- Name: blacklist_ips blacklist_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_ips
    ADD CONSTRAINT blacklist_ips_pkey PRIMARY KEY (id);


--
-- Name: blacklist_ips blacklist_ips_store_id_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_ips
    ADD CONSTRAINT blacklist_ips_store_id_ip_address_key UNIQUE (store_id, ip_address);


--
-- Name: blacklist_settings blacklist_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_settings
    ADD CONSTRAINT blacklist_settings_pkey PRIMARY KEY (id);


--
-- Name: blacklist_settings blacklist_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_settings
    ADD CONSTRAINT blacklist_settings_store_id_key UNIQUE (store_id);


--
-- Name: brevo_configurations brevo_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY brevo_configurations
    ADD CONSTRAINT brevo_configurations_pkey PRIMARY KEY (id);


--
-- Name: brevo_configurations brevo_configurations_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY brevo_configurations
    ADD CONSTRAINT brevo_configurations_store_id_key UNIQUE (store_id);


--
-- Name: canonical_urls canonical_urls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY canonical_urls
    ADD CONSTRAINT canonical_urls_pkey PRIMARY KEY (id);


--
-- Name: cart_emails cart_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cart_emails
    ADD CONSTRAINT cart_emails_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_store_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_store_id_slug_key UNIQUE (store_id, slug);


--
-- Name: category_seo category_seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY category_seo
    ADD CONSTRAINT category_seo_pkey PRIMARY KEY (category_id, language_code);


--
-- Name: category_translations category_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY category_translations
    ADD CONSTRAINT category_translations_pkey PRIMARY KEY (category_id, language_code);


--
-- Name: chat_agents chat_agents_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_agents
    ADD CONSTRAINT chat_agents_email_key UNIQUE (email);


--
-- Name: chat_agents chat_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_agents
    ADD CONSTRAINT chat_agents_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_typing_indicators chat_typing_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_typing_indicators
    ADD CONSTRAINT chat_typing_indicators_pkey PRIMARY KEY (id);


--
-- Name: cms_block_translations cms_block_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_block_translations
    ADD CONSTRAINT cms_block_translations_pkey PRIMARY KEY (cms_block_id, language_code);


--
-- Name: cms_blocks cms_blocks_identifier_store_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_blocks
    ADD CONSTRAINT cms_blocks_identifier_store_id_unique UNIQUE (identifier, store_id);


--
-- Name: cms_blocks cms_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_blocks
    ADD CONSTRAINT cms_blocks_pkey PRIMARY KEY (id);


--
-- Name: cms_page_seo cms_page_seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_page_seo
    ADD CONSTRAINT cms_page_seo_pkey PRIMARY KEY (cms_page_id, language_code);


--
-- Name: cms_page_translations cms_page_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_page_translations
    ADD CONSTRAINT cms_page_translations_pkey PRIMARY KEY (cms_page_id, language_code);


--
-- Name: cms_pages cms_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_pages
    ADD CONSTRAINT cms_pages_pkey PRIMARY KEY (id);


--
-- Name: cms_pages cms_pages_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_pages
    ADD CONSTRAINT cms_pages_slug_key UNIQUE (slug);


--
-- Name: consent_logs consent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY consent_logs
    ADD CONSTRAINT consent_logs_pkey PRIMARY KEY (id);


--
-- Name: cookie_consent_settings cookie_consent_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cookie_consent_settings
    ADD CONSTRAINT cookie_consent_settings_pkey PRIMARY KEY (id);


--
-- Name: cookie_consent_settings_translations cookie_consent_settings_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cookie_consent_settings_translations
    ADD CONSTRAINT cookie_consent_settings_translations_pkey PRIMARY KEY (id);


--
-- Name: cookie_consent_settings_translations cookie_consent_settings_translations_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cookie_consent_settings_translations
    ADD CONSTRAINT cookie_consent_settings_translations_unique UNIQUE (cookie_consent_settings_id, language_code);


--
-- Name: coupon_translations coupon_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY coupon_translations
    ADD CONSTRAINT coupon_translations_pkey PRIMARY KEY (coupon_id, language_code);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: credit_pricing credit_pricing_credits_currency_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_pricing
    ADD CONSTRAINT credit_pricing_credits_currency_key UNIQUE (credits, currency);


--
-- Name: credit_pricing credit_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_pricing
    ADD CONSTRAINT credit_pricing_pkey PRIMARY KEY (id);


--
-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--
-- Name: credit_usage credit_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_usage
    ADD CONSTRAINT credit_usage_pkey PRIMARY KEY (id);


--
-- Name: credits credits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credits
    ADD CONSTRAINT credits_pkey PRIMARY KEY (id);


--
-- Name: cron_job_executions cron_job_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_job_executions
    ADD CONSTRAINT cron_job_executions_pkey PRIMARY KEY (id);


--
-- Name: cron_job_types cron_job_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_job_types
    ADD CONSTRAINT cron_job_types_pkey PRIMARY KEY (id);


--
-- Name: cron_job_types cron_job_types_type_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_job_types
    ADD CONSTRAINT cron_job_types_type_name_key UNIQUE (type_name);


--
-- Name: cron_jobs cron_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_jobs
    ADD CONSTRAINT cron_jobs_pkey PRIMARY KEY (id);


--
-- Name: custom_analytics_events custom_analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_analytics_events
    ADD CONSTRAINT custom_analytics_events_pkey PRIMARY KEY (id);


--
-- Name: custom_domains custom_domains_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_domains
    ADD CONSTRAINT custom_domains_domain_key UNIQUE (domain);


--
-- Name: custom_domains custom_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_domains
    ADD CONSTRAINT custom_domains_pkey PRIMARY KEY (id);


--
-- Name: custom_option_rules custom_option_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_option_rules
    ADD CONSTRAINT custom_option_rules_pkey PRIMARY KEY (id);


--
-- Name: custom_pricing_discounts custom_pricing_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_pricing_discounts
    ADD CONSTRAINT custom_pricing_discounts_pkey PRIMARY KEY (id);


--
-- Name: custom_pricing_logs custom_pricing_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_pricing_logs
    ADD CONSTRAINT custom_pricing_logs_pkey PRIMARY KEY (id);


--
-- Name: custom_pricing_rules custom_pricing_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_pricing_rules
    ADD CONSTRAINT custom_pricing_rules_pkey PRIMARY KEY (id);


--
-- Name: customer_activities customer_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_activities
    ADD CONSTRAINT customer_activities_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customers
    ADD CONSTRAINT customers_email_unique UNIQUE (email);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_settings delivery_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY delivery_settings
    ADD CONSTRAINT delivery_settings_pkey PRIMARY KEY (id);


--
-- Name: email_send_logs email_send_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_send_logs
    ADD CONSTRAINT email_send_logs_pkey PRIMARY KEY (id);


--
-- Name: email_template_translations email_template_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_template_translations
    ADD CONSTRAINT email_template_translations_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: file_baselines file_baselines_file_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file_baselines
    ADD CONSTRAINT file_baselines_file_path_key UNIQUE (file_path);


--
-- Name: file_baselines file_baselines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file_baselines
    ADD CONSTRAINT file_baselines_pkey PRIMARY KEY (id);


--
-- Name: hamid_cart hamid_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY hamid_cart
    ADD CONSTRAINT hamid_cart_pkey PRIMARY KEY (id);


--
-- Name: heatmap_aggregations heatmap_aggregations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_aggregations
    ADD CONSTRAINT heatmap_aggregations_pkey PRIMARY KEY (id);


--
-- Name: heatmap_aggregations heatmap_aggregations_store_id_page_url_aggregation_period_p_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_aggregations
    ADD CONSTRAINT heatmap_aggregations_store_id_page_url_aggregation_period_p_key UNIQUE (store_id, page_url, aggregation_period, period_start, viewport_width, viewport_height, interaction_type, x_coordinate, y_coordinate);


--
-- Name: heatmap_interactions heatmap_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_interactions
    ADD CONSTRAINT heatmap_interactions_pkey PRIMARY KEY (id);


--
-- Name: heatmap_sessions heatmap_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_sessions
    ADD CONSTRAINT heatmap_sessions_pkey PRIMARY KEY (id);


--
-- Name: heatmap_sessions heatmap_sessions_session_id_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_sessions
    ADD CONSTRAINT heatmap_sessions_session_id_store_id_key UNIQUE (session_id, store_id);


--
-- Name: integration_configs integration_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY integration_configs
    ADD CONSTRAINT integration_configs_pkey PRIMARY KEY (id);


--
-- Name: job_history job_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY job_history
    ADD CONSTRAINT job_history_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: languages languages_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY languages
    ADD CONSTRAINT languages_code_key UNIQUE (code);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY media_assets
    ADD CONSTRAINT media_assets_pkey PRIMARY KEY (id);


--
-- Name: media_assets media_assets_store_id_file_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY media_assets
    ADD CONSTRAINT media_assets_store_id_file_path_key UNIQUE (store_id, file_path);


--
-- Name: payment_method_translations payment_method_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY payment_method_translations
    ADD CONSTRAINT payment_method_translations_pkey PRIMARY KEY (payment_method_id, language_code);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: pdf_template_translations pdf_template_translations_pdf_template_id_language_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY pdf_template_translations
    ADD CONSTRAINT pdf_template_translations_pdf_template_id_language_code_key UNIQUE (pdf_template_id, language_code);


--
-- Name: pdf_template_translations pdf_template_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY pdf_template_translations
    ADD CONSTRAINT pdf_template_translations_pkey PRIMARY KEY (id);


--
-- Name: pdf_templates pdf_templates_identifier_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY pdf_templates
    ADD CONSTRAINT pdf_templates_identifier_store_id_key UNIQUE (identifier, store_id);


--
-- Name: pdf_templates pdf_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY pdf_templates
    ADD CONSTRAINT pdf_templates_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY platform_admins
    ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY platform_admins
    ADD CONSTRAINT platform_admins_user_id_key UNIQUE (user_id);


--
-- Name: plugin_admin_pages plugin_admin_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_admin_pages
    ADD CONSTRAINT plugin_admin_pages_pkey PRIMARY KEY (id);


--
-- Name: plugin_admin_pages plugin_admin_pages_plugin_id_page_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_admin_pages
    ADD CONSTRAINT plugin_admin_pages_plugin_id_page_key_key UNIQUE (plugin_id, page_key);


--
-- Name: plugin_admin_pages plugin_admin_pages_route_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_admin_pages
    ADD CONSTRAINT plugin_admin_pages_route_key UNIQUE (route);


--
-- Name: plugin_admin_scripts plugin_admin_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_admin_scripts
    ADD CONSTRAINT plugin_admin_scripts_pkey PRIMARY KEY (id);


--
-- Name: plugin_admin_scripts plugin_admin_scripts_plugin_id_script_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_admin_scripts
    ADD CONSTRAINT plugin_admin_scripts_plugin_id_script_name_key UNIQUE (plugin_id, script_name);


--
-- Name: plugin_configurations plugin_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_configurations
    ADD CONSTRAINT plugin_configurations_pkey PRIMARY KEY (id);


--
-- Name: plugin_controllers plugin_controllers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_controllers
    ADD CONSTRAINT plugin_controllers_pkey PRIMARY KEY (id);


--
-- Name: plugin_data plugin_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_data
    ADD CONSTRAINT plugin_data_pkey PRIMARY KEY (id);


--
-- Name: plugin_dependencies plugin_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_dependencies
    ADD CONSTRAINT plugin_dependencies_pkey PRIMARY KEY (id);


--
-- Name: plugin_dependencies plugin_dependencies_plugin_id_package_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_dependencies
    ADD CONSTRAINT plugin_dependencies_plugin_id_package_name_key UNIQUE (plugin_id, package_name);


--
-- Name: plugin_docs plugin_docs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_docs
    ADD CONSTRAINT plugin_docs_pkey PRIMARY KEY (id);


--
-- Name: plugin_entities plugin_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_entities
    ADD CONSTRAINT plugin_entities_pkey PRIMARY KEY (id);


--
-- Name: plugin_events plugin_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_events
    ADD CONSTRAINT plugin_events_pkey PRIMARY KEY (id);


--
-- Name: plugin_hooks plugin_hooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_hooks
    ADD CONSTRAINT plugin_hooks_pkey PRIMARY KEY (id);


--
-- Name: plugin_marketplace plugin_marketplace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_marketplace
    ADD CONSTRAINT plugin_marketplace_pkey PRIMARY KEY (id);


--
-- Name: plugin_marketplace plugin_marketplace_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_marketplace
    ADD CONSTRAINT plugin_marketplace_slug_key UNIQUE (slug);


--
-- Name: plugin_migrations plugin_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_migrations
    ADD CONSTRAINT plugin_migrations_pkey PRIMARY KEY (id);


--
-- Name: plugin_registry plugin_registry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_registry
    ADD CONSTRAINT plugin_registry_pkey PRIMARY KEY (id);


--
-- Name: plugin_scripts plugin_scripts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_scripts
    ADD CONSTRAINT plugin_scripts_pkey PRIMARY KEY (id);


--
-- Name: plugin_version_comparisons plugin_version_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_comparisons
    ADD CONSTRAINT plugin_version_comparisons_pkey PRIMARY KEY (id);


--
-- Name: plugin_version_history plugin_version_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_history
    ADD CONSTRAINT plugin_version_history_pkey PRIMARY KEY (id);


--
-- Name: plugin_version_patches plugin_version_patches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_patches
    ADD CONSTRAINT plugin_version_patches_pkey PRIMARY KEY (id);


--
-- Name: plugin_version_snapshots plugin_version_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_snapshots
    ADD CONSTRAINT plugin_version_snapshots_pkey PRIMARY KEY (id);


--
-- Name: plugin_version_snapshots plugin_version_snapshots_version_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_snapshots
    ADD CONSTRAINT plugin_version_snapshots_version_id_key UNIQUE (version_id);


--
-- Name: plugin_version_tags plugin_version_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_tags
    ADD CONSTRAINT plugin_version_tags_pkey PRIMARY KEY (id);


--
-- Name: plugin_widgets plugin_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_widgets
    ADD CONSTRAINT plugin_widgets_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugins
    ADD CONSTRAINT plugins_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugins
    ADD CONSTRAINT plugins_slug_key UNIQUE (slug);


--
-- Name: product_attribute_values product_attribute_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_attribute_values
    ADD CONSTRAINT product_attribute_values_pkey PRIMARY KEY (id);


--
-- Name: product_label_translations product_label_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_label_translations
    ADD CONSTRAINT product_label_translations_pkey PRIMARY KEY (product_label_id, language_code);


--
-- Name: product_labels product_labels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_labels
    ADD CONSTRAINT product_labels_pkey PRIMARY KEY (id);


--
-- Name: product_seo product_seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_seo
    ADD CONSTRAINT product_seo_pkey PRIMARY KEY (product_id, language_code);


--
-- Name: product_tab_translations product_tab_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_tab_translations
    ADD CONSTRAINT product_tab_translations_pkey PRIMARY KEY (product_tab_id, language_code);


--
-- Name: product_tabs product_tabs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_tabs
    ADD CONSTRAINT product_tabs_pkey PRIMARY KEY (id);


--
-- Name: product_translations product_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_translations
    ADD CONSTRAINT product_translations_pkey PRIMARY KEY (product_id, language_code);


--
-- Name: product_variants product_variants_parent_product_id_variant_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_variants
    ADD CONSTRAINT product_variants_parent_product_id_variant_product_id_key UNIQUE (parent_product_id, variant_product_id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: redirects redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY redirects
    ADD CONSTRAINT redirects_pkey PRIMARY KEY (id);


--
-- Name: redirects redirects_store_id_from_url_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY redirects
    ADD CONSTRAINT redirects_store_id_from_url_key UNIQUE (store_id, from_url);


--
-- Name: sales_invoices sales_invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_invoices
    ADD CONSTRAINT sales_invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- Name: sales_order_items sales_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_order_items
    ADD CONSTRAINT sales_order_items_pkey PRIMARY KEY (id);


--
-- Name: sales_orders sales_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_orders
    ADD CONSTRAINT sales_orders_order_number_key UNIQUE (order_number);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: sales_shipments sales_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_shipments
    ADD CONSTRAINT sales_shipments_pkey PRIMARY KEY (id);


--
-- Name: sales_shipments sales_shipments_shipment_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_shipments
    ADD CONSTRAINT sales_shipments_shipment_number_key UNIQUE (shipment_number);


--
-- Name: seo_settings seo_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY seo_settings
    ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);


--
-- Name: seo_settings seo_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY seo_settings
    ADD CONSTRAINT seo_settings_store_id_key UNIQUE (store_id);


--
-- Name: seo_templates seo_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY seo_templates
    ADD CONSTRAINT seo_templates_pkey PRIMARY KEY (id);


--
-- Name: service_credit_costs service_credit_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY service_credit_costs
    ADD CONSTRAINT service_credit_costs_pkey PRIMARY KEY (id);


--
-- Name: service_credit_costs service_credit_costs_service_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY service_credit_costs
    ADD CONSTRAINT service_credit_costs_service_key_key UNIQUE (service_key);


--
-- Name: shipping_method_translations shipping_method_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shipping_method_translations
    ADD CONSTRAINT shipping_method_translations_pkey PRIMARY KEY (shipping_method_id, language_code);


--
-- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shipping_methods
    ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);


--
-- Name: shopify_oauth_tokens shopify_oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shopify_oauth_tokens
    ADD CONSTRAINT shopify_oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: shopify_oauth_tokens shopify_oauth_tokens_shop_domain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shopify_oauth_tokens
    ADD CONSTRAINT shopify_oauth_tokens_shop_domain_key UNIQUE (shop_domain);


--
-- Name: shopify_oauth_tokens shopify_oauth_tokens_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shopify_oauth_tokens
    ADD CONSTRAINT shopify_oauth_tokens_store_id_key UNIQUE (store_id);


--
-- Name: slot_configurations slot_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_pkey PRIMARY KEY (id);


--
-- Name: store_invitations store_invitations_invitation_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_invitations
    ADD CONSTRAINT store_invitations_invitation_token_key UNIQUE (invitation_token);


--
-- Name: store_invitations store_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_invitations
    ADD CONSTRAINT store_invitations_pkey PRIMARY KEY (id);


--
-- Name: store_teams store_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_teams
    ADD CONSTRAINT store_teams_pkey PRIMARY KEY (id);


--
-- Name: store_teams store_teams_store_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_teams
    ADD CONSTRAINT store_teams_store_id_user_id_key UNIQUE (store_id, user_id);


--
-- Name: store_uptime store_uptime_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_uptime
    ADD CONSTRAINT store_uptime_pkey PRIMARY KEY (id);


--
-- Name: store_uptime store_uptime_store_id_charged_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_uptime
    ADD CONSTRAINT store_uptime_store_id_charged_date_key UNIQUE (store_id, charged_date);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: stores stores_slug_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1 UNIQUE (slug);


--
-- Name: stores stores_slug_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key10 UNIQUE (slug);


--
-- Name: stores stores_slug_key100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key100 UNIQUE (slug);


--
-- Name: stores stores_slug_key1000; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1000 UNIQUE (slug);


--
-- Name: stores stores_slug_key1001; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1001 UNIQUE (slug);


--
-- Name: stores stores_slug_key1002; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1002 UNIQUE (slug);


--
-- Name: stores stores_slug_key1003; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1003 UNIQUE (slug);


--
-- Name: stores stores_slug_key1004; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1004 UNIQUE (slug);


--
-- Name: stores stores_slug_key1005; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1005 UNIQUE (slug);


--
-- Name: stores stores_slug_key1006; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1006 UNIQUE (slug);


--
-- Name: stores stores_slug_key1007; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1007 UNIQUE (slug);


--
-- Name: stores stores_slug_key1008; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1008 UNIQUE (slug);


--
-- Name: stores stores_slug_key1009; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1009 UNIQUE (slug);


--
-- Name: stores stores_slug_key101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key101 UNIQUE (slug);


--
-- Name: stores stores_slug_key1010; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1010 UNIQUE (slug);


--
-- Name: stores stores_slug_key1011; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1011 UNIQUE (slug);


--
-- Name: stores stores_slug_key1012; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1012 UNIQUE (slug);


--
-- Name: stores stores_slug_key1013; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1013 UNIQUE (slug);


--
-- Name: stores stores_slug_key1014; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1014 UNIQUE (slug);


--
-- Name: stores stores_slug_key1015; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1015 UNIQUE (slug);


--
-- Name: stores stores_slug_key1016; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1016 UNIQUE (slug);


--
-- Name: stores stores_slug_key1017; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1017 UNIQUE (slug);


--
-- Name: stores stores_slug_key1018; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1018 UNIQUE (slug);


--
-- Name: stores stores_slug_key1019; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1019 UNIQUE (slug);


--
-- Name: stores stores_slug_key102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key102 UNIQUE (slug);


--
-- Name: stores stores_slug_key1020; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1020 UNIQUE (slug);


--
-- Name: stores stores_slug_key1021; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1021 UNIQUE (slug);


--
-- Name: stores stores_slug_key1022; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1022 UNIQUE (slug);


--
-- Name: stores stores_slug_key1023; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1023 UNIQUE (slug);


--
-- Name: stores stores_slug_key1024; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1024 UNIQUE (slug);


--
-- Name: stores stores_slug_key1025; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1025 UNIQUE (slug);


--
-- Name: stores stores_slug_key1026; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1026 UNIQUE (slug);


--
-- Name: stores stores_slug_key1027; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1027 UNIQUE (slug);


--
-- Name: stores stores_slug_key1028; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1028 UNIQUE (slug);


--
-- Name: stores stores_slug_key1029; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1029 UNIQUE (slug);


--
-- Name: stores stores_slug_key103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key103 UNIQUE (slug);


--
-- Name: stores stores_slug_key1030; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1030 UNIQUE (slug);


--
-- Name: stores stores_slug_key1031; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1031 UNIQUE (slug);


--
-- Name: stores stores_slug_key1032; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1032 UNIQUE (slug);


--
-- Name: stores stores_slug_key1033; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1033 UNIQUE (slug);


--
-- Name: stores stores_slug_key1034; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1034 UNIQUE (slug);


--
-- Name: stores stores_slug_key1035; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1035 UNIQUE (slug);


--
-- Name: stores stores_slug_key1036; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1036 UNIQUE (slug);


--
-- Name: stores stores_slug_key1037; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1037 UNIQUE (slug);


--
-- Name: stores stores_slug_key1038; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1038 UNIQUE (slug);


--
-- Name: stores stores_slug_key1039; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1039 UNIQUE (slug);


--
-- Name: stores stores_slug_key104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key104 UNIQUE (slug);


--
-- Name: stores stores_slug_key1040; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1040 UNIQUE (slug);


--
-- Name: stores stores_slug_key1041; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1041 UNIQUE (slug);


--
-- Name: stores stores_slug_key1042; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1042 UNIQUE (slug);


--
-- Name: stores stores_slug_key1043; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1043 UNIQUE (slug);


--
-- Name: stores stores_slug_key1044; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1044 UNIQUE (slug);


--
-- Name: stores stores_slug_key1045; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1045 UNIQUE (slug);


--
-- Name: stores stores_slug_key1046; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1046 UNIQUE (slug);


--
-- Name: stores stores_slug_key1047; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1047 UNIQUE (slug);


--
-- Name: stores stores_slug_key1048; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1048 UNIQUE (slug);


--
-- Name: stores stores_slug_key1049; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1049 UNIQUE (slug);


--
-- Name: stores stores_slug_key105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key105 UNIQUE (slug);


--
-- Name: stores stores_slug_key1050; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1050 UNIQUE (slug);


--
-- Name: stores stores_slug_key1051; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1051 UNIQUE (slug);


--
-- Name: stores stores_slug_key1052; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1052 UNIQUE (slug);


--
-- Name: stores stores_slug_key1053; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1053 UNIQUE (slug);


--
-- Name: stores stores_slug_key1054; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1054 UNIQUE (slug);


--
-- Name: stores stores_slug_key1055; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1055 UNIQUE (slug);


--
-- Name: stores stores_slug_key1056; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1056 UNIQUE (slug);


--
-- Name: stores stores_slug_key1057; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1057 UNIQUE (slug);


--
-- Name: stores stores_slug_key1058; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1058 UNIQUE (slug);


--
-- Name: stores stores_slug_key1059; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1059 UNIQUE (slug);


--
-- Name: stores stores_slug_key106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key106 UNIQUE (slug);


--
-- Name: stores stores_slug_key1060; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1060 UNIQUE (slug);


--
-- Name: stores stores_slug_key1061; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1061 UNIQUE (slug);


--
-- Name: stores stores_slug_key1062; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1062 UNIQUE (slug);


--
-- Name: stores stores_slug_key1063; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1063 UNIQUE (slug);


--
-- Name: stores stores_slug_key1064; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1064 UNIQUE (slug);


--
-- Name: stores stores_slug_key1065; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1065 UNIQUE (slug);


--
-- Name: stores stores_slug_key1066; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1066 UNIQUE (slug);


--
-- Name: stores stores_slug_key1067; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1067 UNIQUE (slug);


--
-- Name: stores stores_slug_key1068; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1068 UNIQUE (slug);


--
-- Name: stores stores_slug_key1069; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1069 UNIQUE (slug);


--
-- Name: stores stores_slug_key107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key107 UNIQUE (slug);


--
-- Name: stores stores_slug_key1070; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1070 UNIQUE (slug);


--
-- Name: stores stores_slug_key1071; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1071 UNIQUE (slug);


--
-- Name: stores stores_slug_key1072; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1072 UNIQUE (slug);


--
-- Name: stores stores_slug_key1073; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1073 UNIQUE (slug);


--
-- Name: stores stores_slug_key1074; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1074 UNIQUE (slug);


--
-- Name: stores stores_slug_key1075; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1075 UNIQUE (slug);


--
-- Name: stores stores_slug_key1076; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1076 UNIQUE (slug);


--
-- Name: stores stores_slug_key1077; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1077 UNIQUE (slug);


--
-- Name: stores stores_slug_key1078; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1078 UNIQUE (slug);


--
-- Name: stores stores_slug_key1079; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1079 UNIQUE (slug);


--
-- Name: stores stores_slug_key108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key108 UNIQUE (slug);


--
-- Name: stores stores_slug_key1080; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1080 UNIQUE (slug);


--
-- Name: stores stores_slug_key1081; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1081 UNIQUE (slug);


--
-- Name: stores stores_slug_key1082; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1082 UNIQUE (slug);


--
-- Name: stores stores_slug_key1083; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1083 UNIQUE (slug);


--
-- Name: stores stores_slug_key1084; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1084 UNIQUE (slug);


--
-- Name: stores stores_slug_key1085; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1085 UNIQUE (slug);


--
-- Name: stores stores_slug_key1086; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1086 UNIQUE (slug);


--
-- Name: stores stores_slug_key1087; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1087 UNIQUE (slug);


--
-- Name: stores stores_slug_key1088; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1088 UNIQUE (slug);


--
-- Name: stores stores_slug_key1089; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1089 UNIQUE (slug);


--
-- Name: stores stores_slug_key109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key109 UNIQUE (slug);


--
-- Name: stores stores_slug_key1090; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1090 UNIQUE (slug);


--
-- Name: stores stores_slug_key1091; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1091 UNIQUE (slug);


--
-- Name: stores stores_slug_key1092; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1092 UNIQUE (slug);


--
-- Name: stores stores_slug_key1093; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1093 UNIQUE (slug);


--
-- Name: stores stores_slug_key1094; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1094 UNIQUE (slug);


--
-- Name: stores stores_slug_key1095; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1095 UNIQUE (slug);


--
-- Name: stores stores_slug_key1096; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1096 UNIQUE (slug);


--
-- Name: stores stores_slug_key1097; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1097 UNIQUE (slug);


--
-- Name: stores stores_slug_key1098; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1098 UNIQUE (slug);


--
-- Name: stores stores_slug_key1099; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1099 UNIQUE (slug);


--
-- Name: stores stores_slug_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key11 UNIQUE (slug);


--
-- Name: stores stores_slug_key110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key110 UNIQUE (slug);


--
-- Name: stores stores_slug_key1100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1100 UNIQUE (slug);


--
-- Name: stores stores_slug_key1101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1101 UNIQUE (slug);


--
-- Name: stores stores_slug_key1102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1102 UNIQUE (slug);


--
-- Name: stores stores_slug_key1103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1103 UNIQUE (slug);


--
-- Name: stores stores_slug_key1104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1104 UNIQUE (slug);


--
-- Name: stores stores_slug_key1105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1105 UNIQUE (slug);


--
-- Name: stores stores_slug_key1106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1106 UNIQUE (slug);


--
-- Name: stores stores_slug_key1107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1107 UNIQUE (slug);


--
-- Name: stores stores_slug_key1108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1108 UNIQUE (slug);


--
-- Name: stores stores_slug_key1109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1109 UNIQUE (slug);


--
-- Name: stores stores_slug_key111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key111 UNIQUE (slug);


--
-- Name: stores stores_slug_key1110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1110 UNIQUE (slug);


--
-- Name: stores stores_slug_key1111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1111 UNIQUE (slug);


--
-- Name: stores stores_slug_key1112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1112 UNIQUE (slug);


--
-- Name: stores stores_slug_key1113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1113 UNIQUE (slug);


--
-- Name: stores stores_slug_key1114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1114 UNIQUE (slug);


--
-- Name: stores stores_slug_key1115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1115 UNIQUE (slug);


--
-- Name: stores stores_slug_key1116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1116 UNIQUE (slug);


--
-- Name: stores stores_slug_key1117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1117 UNIQUE (slug);


--
-- Name: stores stores_slug_key1118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1118 UNIQUE (slug);


--
-- Name: stores stores_slug_key1119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1119 UNIQUE (slug);


--
-- Name: stores stores_slug_key112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key112 UNIQUE (slug);


--
-- Name: stores stores_slug_key1120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1120 UNIQUE (slug);


--
-- Name: stores stores_slug_key1121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1121 UNIQUE (slug);


--
-- Name: stores stores_slug_key1122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1122 UNIQUE (slug);


--
-- Name: stores stores_slug_key1123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1123 UNIQUE (slug);


--
-- Name: stores stores_slug_key1124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1124 UNIQUE (slug);


--
-- Name: stores stores_slug_key1125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1125 UNIQUE (slug);


--
-- Name: stores stores_slug_key1126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1126 UNIQUE (slug);


--
-- Name: stores stores_slug_key1127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1127 UNIQUE (slug);


--
-- Name: stores stores_slug_key1128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1128 UNIQUE (slug);


--
-- Name: stores stores_slug_key1129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1129 UNIQUE (slug);


--
-- Name: stores stores_slug_key113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key113 UNIQUE (slug);


--
-- Name: stores stores_slug_key1130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1130 UNIQUE (slug);


--
-- Name: stores stores_slug_key1131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1131 UNIQUE (slug);


--
-- Name: stores stores_slug_key1132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1132 UNIQUE (slug);


--
-- Name: stores stores_slug_key1133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1133 UNIQUE (slug);


--
-- Name: stores stores_slug_key1134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1134 UNIQUE (slug);


--
-- Name: stores stores_slug_key1135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1135 UNIQUE (slug);


--
-- Name: stores stores_slug_key1136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1136 UNIQUE (slug);


--
-- Name: stores stores_slug_key1137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1137 UNIQUE (slug);


--
-- Name: stores stores_slug_key1138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1138 UNIQUE (slug);


--
-- Name: stores stores_slug_key1139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1139 UNIQUE (slug);


--
-- Name: stores stores_slug_key114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key114 UNIQUE (slug);


--
-- Name: stores stores_slug_key1140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1140 UNIQUE (slug);


--
-- Name: stores stores_slug_key1141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1141 UNIQUE (slug);


--
-- Name: stores stores_slug_key1142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1142 UNIQUE (slug);


--
-- Name: stores stores_slug_key1143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1143 UNIQUE (slug);


--
-- Name: stores stores_slug_key1144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1144 UNIQUE (slug);


--
-- Name: stores stores_slug_key1145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1145 UNIQUE (slug);


--
-- Name: stores stores_slug_key1146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1146 UNIQUE (slug);


--
-- Name: stores stores_slug_key1147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1147 UNIQUE (slug);


--
-- Name: stores stores_slug_key1148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1148 UNIQUE (slug);


--
-- Name: stores stores_slug_key1149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1149 UNIQUE (slug);


--
-- Name: stores stores_slug_key115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key115 UNIQUE (slug);


--
-- Name: stores stores_slug_key1150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1150 UNIQUE (slug);


--
-- Name: stores stores_slug_key1151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1151 UNIQUE (slug);


--
-- Name: stores stores_slug_key1152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1152 UNIQUE (slug);


--
-- Name: stores stores_slug_key1153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1153 UNIQUE (slug);


--
-- Name: stores stores_slug_key1154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1154 UNIQUE (slug);


--
-- Name: stores stores_slug_key1155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1155 UNIQUE (slug);


--
-- Name: stores stores_slug_key1156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1156 UNIQUE (slug);


--
-- Name: stores stores_slug_key1157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1157 UNIQUE (slug);


--
-- Name: stores stores_slug_key1158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1158 UNIQUE (slug);


--
-- Name: stores stores_slug_key1159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1159 UNIQUE (slug);


--
-- Name: stores stores_slug_key116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key116 UNIQUE (slug);


--
-- Name: stores stores_slug_key1160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1160 UNIQUE (slug);


--
-- Name: stores stores_slug_key1161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1161 UNIQUE (slug);


--
-- Name: stores stores_slug_key1162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1162 UNIQUE (slug);


--
-- Name: stores stores_slug_key1163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1163 UNIQUE (slug);


--
-- Name: stores stores_slug_key1164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1164 UNIQUE (slug);


--
-- Name: stores stores_slug_key1165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1165 UNIQUE (slug);


--
-- Name: stores stores_slug_key1166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1166 UNIQUE (slug);


--
-- Name: stores stores_slug_key1167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1167 UNIQUE (slug);


--
-- Name: stores stores_slug_key1168; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1168 UNIQUE (slug);


--
-- Name: stores stores_slug_key1169; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1169 UNIQUE (slug);


--
-- Name: stores stores_slug_key117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key117 UNIQUE (slug);


--
-- Name: stores stores_slug_key1170; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1170 UNIQUE (slug);


--
-- Name: stores stores_slug_key1171; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1171 UNIQUE (slug);


--
-- Name: stores stores_slug_key1172; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1172 UNIQUE (slug);


--
-- Name: stores stores_slug_key1173; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1173 UNIQUE (slug);


--
-- Name: stores stores_slug_key1174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1174 UNIQUE (slug);


--
-- Name: stores stores_slug_key1175; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1175 UNIQUE (slug);


--
-- Name: stores stores_slug_key1176; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1176 UNIQUE (slug);


--
-- Name: stores stores_slug_key1177; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1177 UNIQUE (slug);


--
-- Name: stores stores_slug_key1178; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1178 UNIQUE (slug);


--
-- Name: stores stores_slug_key1179; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1179 UNIQUE (slug);


--
-- Name: stores stores_slug_key118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key118 UNIQUE (slug);


--
-- Name: stores stores_slug_key1180; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1180 UNIQUE (slug);


--
-- Name: stores stores_slug_key1181; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1181 UNIQUE (slug);


--
-- Name: stores stores_slug_key1182; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1182 UNIQUE (slug);


--
-- Name: stores stores_slug_key1183; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1183 UNIQUE (slug);


--
-- Name: stores stores_slug_key1184; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1184 UNIQUE (slug);


--
-- Name: stores stores_slug_key1185; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1185 UNIQUE (slug);


--
-- Name: stores stores_slug_key1186; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1186 UNIQUE (slug);


--
-- Name: stores stores_slug_key1187; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1187 UNIQUE (slug);


--
-- Name: stores stores_slug_key1188; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1188 UNIQUE (slug);


--
-- Name: stores stores_slug_key1189; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1189 UNIQUE (slug);


--
-- Name: stores stores_slug_key119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key119 UNIQUE (slug);


--
-- Name: stores stores_slug_key1190; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1190 UNIQUE (slug);


--
-- Name: stores stores_slug_key1191; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1191 UNIQUE (slug);


--
-- Name: stores stores_slug_key1192; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1192 UNIQUE (slug);


--
-- Name: stores stores_slug_key1193; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1193 UNIQUE (slug);


--
-- Name: stores stores_slug_key1194; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1194 UNIQUE (slug);


--
-- Name: stores stores_slug_key1195; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1195 UNIQUE (slug);


--
-- Name: stores stores_slug_key1196; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1196 UNIQUE (slug);


--
-- Name: stores stores_slug_key1197; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1197 UNIQUE (slug);


--
-- Name: stores stores_slug_key1198; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1198 UNIQUE (slug);


--
-- Name: stores stores_slug_key1199; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1199 UNIQUE (slug);


--
-- Name: stores stores_slug_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key12 UNIQUE (slug);


--
-- Name: stores stores_slug_key120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key120 UNIQUE (slug);


--
-- Name: stores stores_slug_key1200; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1200 UNIQUE (slug);


--
-- Name: stores stores_slug_key1201; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1201 UNIQUE (slug);


--
-- Name: stores stores_slug_key1202; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1202 UNIQUE (slug);


--
-- Name: stores stores_slug_key1203; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1203 UNIQUE (slug);


--
-- Name: stores stores_slug_key1204; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1204 UNIQUE (slug);


--
-- Name: stores stores_slug_key1205; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1205 UNIQUE (slug);


--
-- Name: stores stores_slug_key1206; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1206 UNIQUE (slug);


--
-- Name: stores stores_slug_key1207; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1207 UNIQUE (slug);


--
-- Name: stores stores_slug_key1208; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1208 UNIQUE (slug);


--
-- Name: stores stores_slug_key1209; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1209 UNIQUE (slug);


--
-- Name: stores stores_slug_key121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key121 UNIQUE (slug);


--
-- Name: stores stores_slug_key1210; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1210 UNIQUE (slug);


--
-- Name: stores stores_slug_key1211; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1211 UNIQUE (slug);


--
-- Name: stores stores_slug_key1212; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1212 UNIQUE (slug);


--
-- Name: stores stores_slug_key1213; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1213 UNIQUE (slug);


--
-- Name: stores stores_slug_key1214; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1214 UNIQUE (slug);


--
-- Name: stores stores_slug_key1215; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1215 UNIQUE (slug);


--
-- Name: stores stores_slug_key1216; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1216 UNIQUE (slug);


--
-- Name: stores stores_slug_key1217; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1217 UNIQUE (slug);


--
-- Name: stores stores_slug_key1218; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1218 UNIQUE (slug);


--
-- Name: stores stores_slug_key1219; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1219 UNIQUE (slug);


--
-- Name: stores stores_slug_key122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key122 UNIQUE (slug);


--
-- Name: stores stores_slug_key1220; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1220 UNIQUE (slug);


--
-- Name: stores stores_slug_key1221; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1221 UNIQUE (slug);


--
-- Name: stores stores_slug_key1222; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1222 UNIQUE (slug);


--
-- Name: stores stores_slug_key1223; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1223 UNIQUE (slug);


--
-- Name: stores stores_slug_key1224; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1224 UNIQUE (slug);


--
-- Name: stores stores_slug_key1225; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1225 UNIQUE (slug);


--
-- Name: stores stores_slug_key1226; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1226 UNIQUE (slug);


--
-- Name: stores stores_slug_key1227; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1227 UNIQUE (slug);


--
-- Name: stores stores_slug_key1228; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1228 UNIQUE (slug);


--
-- Name: stores stores_slug_key1229; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1229 UNIQUE (slug);


--
-- Name: stores stores_slug_key123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key123 UNIQUE (slug);


--
-- Name: stores stores_slug_key1230; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1230 UNIQUE (slug);


--
-- Name: stores stores_slug_key1231; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1231 UNIQUE (slug);


--
-- Name: stores stores_slug_key1232; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1232 UNIQUE (slug);


--
-- Name: stores stores_slug_key1233; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1233 UNIQUE (slug);


--
-- Name: stores stores_slug_key1234; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1234 UNIQUE (slug);


--
-- Name: stores stores_slug_key1235; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1235 UNIQUE (slug);


--
-- Name: stores stores_slug_key1236; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1236 UNIQUE (slug);


--
-- Name: stores stores_slug_key1237; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1237 UNIQUE (slug);


--
-- Name: stores stores_slug_key1238; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1238 UNIQUE (slug);


--
-- Name: stores stores_slug_key1239; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1239 UNIQUE (slug);


--
-- Name: stores stores_slug_key124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key124 UNIQUE (slug);


--
-- Name: stores stores_slug_key1240; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1240 UNIQUE (slug);


--
-- Name: stores stores_slug_key1241; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1241 UNIQUE (slug);


--
-- Name: stores stores_slug_key1242; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1242 UNIQUE (slug);


--
-- Name: stores stores_slug_key1243; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1243 UNIQUE (slug);


--
-- Name: stores stores_slug_key1244; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1244 UNIQUE (slug);


--
-- Name: stores stores_slug_key1245; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1245 UNIQUE (slug);


--
-- Name: stores stores_slug_key1246; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1246 UNIQUE (slug);


--
-- Name: stores stores_slug_key1247; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1247 UNIQUE (slug);


--
-- Name: stores stores_slug_key1248; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1248 UNIQUE (slug);


--
-- Name: stores stores_slug_key1249; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1249 UNIQUE (slug);


--
-- Name: stores stores_slug_key125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key125 UNIQUE (slug);


--
-- Name: stores stores_slug_key1250; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1250 UNIQUE (slug);


--
-- Name: stores stores_slug_key1251; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1251 UNIQUE (slug);


--
-- Name: stores stores_slug_key1252; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1252 UNIQUE (slug);


--
-- Name: stores stores_slug_key1253; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1253 UNIQUE (slug);


--
-- Name: stores stores_slug_key1254; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1254 UNIQUE (slug);


--
-- Name: stores stores_slug_key1255; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1255 UNIQUE (slug);


--
-- Name: stores stores_slug_key1256; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1256 UNIQUE (slug);


--
-- Name: stores stores_slug_key1257; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1257 UNIQUE (slug);


--
-- Name: stores stores_slug_key1258; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1258 UNIQUE (slug);


--
-- Name: stores stores_slug_key1259; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1259 UNIQUE (slug);


--
-- Name: stores stores_slug_key126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key126 UNIQUE (slug);


--
-- Name: stores stores_slug_key1260; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1260 UNIQUE (slug);


--
-- Name: stores stores_slug_key1261; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1261 UNIQUE (slug);


--
-- Name: stores stores_slug_key1262; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1262 UNIQUE (slug);


--
-- Name: stores stores_slug_key1263; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1263 UNIQUE (slug);


--
-- Name: stores stores_slug_key1264; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1264 UNIQUE (slug);


--
-- Name: stores stores_slug_key1265; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1265 UNIQUE (slug);


--
-- Name: stores stores_slug_key1266; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1266 UNIQUE (slug);


--
-- Name: stores stores_slug_key1267; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1267 UNIQUE (slug);


--
-- Name: stores stores_slug_key1268; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1268 UNIQUE (slug);


--
-- Name: stores stores_slug_key1269; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1269 UNIQUE (slug);


--
-- Name: stores stores_slug_key127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key127 UNIQUE (slug);


--
-- Name: stores stores_slug_key1270; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1270 UNIQUE (slug);


--
-- Name: stores stores_slug_key1271; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1271 UNIQUE (slug);


--
-- Name: stores stores_slug_key1272; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1272 UNIQUE (slug);


--
-- Name: stores stores_slug_key1273; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1273 UNIQUE (slug);


--
-- Name: stores stores_slug_key1274; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1274 UNIQUE (slug);


--
-- Name: stores stores_slug_key1275; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1275 UNIQUE (slug);


--
-- Name: stores stores_slug_key1276; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1276 UNIQUE (slug);


--
-- Name: stores stores_slug_key1277; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1277 UNIQUE (slug);


--
-- Name: stores stores_slug_key1278; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1278 UNIQUE (slug);


--
-- Name: stores stores_slug_key1279; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1279 UNIQUE (slug);


--
-- Name: stores stores_slug_key128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key128 UNIQUE (slug);


--
-- Name: stores stores_slug_key1280; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1280 UNIQUE (slug);


--
-- Name: stores stores_slug_key1281; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1281 UNIQUE (slug);


--
-- Name: stores stores_slug_key1282; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1282 UNIQUE (slug);


--
-- Name: stores stores_slug_key1283; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1283 UNIQUE (slug);


--
-- Name: stores stores_slug_key1284; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1284 UNIQUE (slug);


--
-- Name: stores stores_slug_key1285; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1285 UNIQUE (slug);


--
-- Name: stores stores_slug_key1286; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1286 UNIQUE (slug);


--
-- Name: stores stores_slug_key1287; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1287 UNIQUE (slug);


--
-- Name: stores stores_slug_key1288; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1288 UNIQUE (slug);


--
-- Name: stores stores_slug_key1289; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1289 UNIQUE (slug);


--
-- Name: stores stores_slug_key129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key129 UNIQUE (slug);


--
-- Name: stores stores_slug_key1290; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1290 UNIQUE (slug);


--
-- Name: stores stores_slug_key1291; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1291 UNIQUE (slug);


--
-- Name: stores stores_slug_key1292; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1292 UNIQUE (slug);


--
-- Name: stores stores_slug_key1293; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1293 UNIQUE (slug);


--
-- Name: stores stores_slug_key1294; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1294 UNIQUE (slug);


--
-- Name: stores stores_slug_key1295; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1295 UNIQUE (slug);


--
-- Name: stores stores_slug_key1296; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1296 UNIQUE (slug);


--
-- Name: stores stores_slug_key1297; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1297 UNIQUE (slug);


--
-- Name: stores stores_slug_key1298; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1298 UNIQUE (slug);


--
-- Name: stores stores_slug_key1299; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1299 UNIQUE (slug);


--
-- Name: stores stores_slug_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key13 UNIQUE (slug);


--
-- Name: stores stores_slug_key130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key130 UNIQUE (slug);


--
-- Name: stores stores_slug_key1300; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1300 UNIQUE (slug);


--
-- Name: stores stores_slug_key1301; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1301 UNIQUE (slug);


--
-- Name: stores stores_slug_key1302; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1302 UNIQUE (slug);


--
-- Name: stores stores_slug_key1303; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1303 UNIQUE (slug);


--
-- Name: stores stores_slug_key1304; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1304 UNIQUE (slug);


--
-- Name: stores stores_slug_key1305; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1305 UNIQUE (slug);


--
-- Name: stores stores_slug_key1306; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1306 UNIQUE (slug);


--
-- Name: stores stores_slug_key1307; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1307 UNIQUE (slug);


--
-- Name: stores stores_slug_key1308; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1308 UNIQUE (slug);


--
-- Name: stores stores_slug_key1309; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1309 UNIQUE (slug);


--
-- Name: stores stores_slug_key131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key131 UNIQUE (slug);


--
-- Name: stores stores_slug_key1310; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1310 UNIQUE (slug);


--
-- Name: stores stores_slug_key1311; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1311 UNIQUE (slug);


--
-- Name: stores stores_slug_key1312; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1312 UNIQUE (slug);


--
-- Name: stores stores_slug_key1313; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1313 UNIQUE (slug);


--
-- Name: stores stores_slug_key1314; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1314 UNIQUE (slug);


--
-- Name: stores stores_slug_key1315; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1315 UNIQUE (slug);


--
-- Name: stores stores_slug_key1316; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1316 UNIQUE (slug);


--
-- Name: stores stores_slug_key1317; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1317 UNIQUE (slug);


--
-- Name: stores stores_slug_key1318; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1318 UNIQUE (slug);


--
-- Name: stores stores_slug_key1319; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1319 UNIQUE (slug);


--
-- Name: stores stores_slug_key132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key132 UNIQUE (slug);


--
-- Name: stores stores_slug_key1320; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1320 UNIQUE (slug);


--
-- Name: stores stores_slug_key1321; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1321 UNIQUE (slug);


--
-- Name: stores stores_slug_key1322; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1322 UNIQUE (slug);


--
-- Name: stores stores_slug_key1323; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1323 UNIQUE (slug);


--
-- Name: stores stores_slug_key1324; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1324 UNIQUE (slug);


--
-- Name: stores stores_slug_key1325; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1325 UNIQUE (slug);


--
-- Name: stores stores_slug_key1326; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1326 UNIQUE (slug);


--
-- Name: stores stores_slug_key1327; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1327 UNIQUE (slug);


--
-- Name: stores stores_slug_key1328; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1328 UNIQUE (slug);


--
-- Name: stores stores_slug_key1329; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1329 UNIQUE (slug);


--
-- Name: stores stores_slug_key133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key133 UNIQUE (slug);


--
-- Name: stores stores_slug_key1330; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1330 UNIQUE (slug);


--
-- Name: stores stores_slug_key1331; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1331 UNIQUE (slug);


--
-- Name: stores stores_slug_key1332; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1332 UNIQUE (slug);


--
-- Name: stores stores_slug_key1333; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1333 UNIQUE (slug);


--
-- Name: stores stores_slug_key1334; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1334 UNIQUE (slug);


--
-- Name: stores stores_slug_key1335; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1335 UNIQUE (slug);


--
-- Name: stores stores_slug_key1336; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1336 UNIQUE (slug);


--
-- Name: stores stores_slug_key1337; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1337 UNIQUE (slug);


--
-- Name: stores stores_slug_key1338; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1338 UNIQUE (slug);


--
-- Name: stores stores_slug_key1339; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1339 UNIQUE (slug);


--
-- Name: stores stores_slug_key134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key134 UNIQUE (slug);


--
-- Name: stores stores_slug_key1340; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1340 UNIQUE (slug);


--
-- Name: stores stores_slug_key1341; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1341 UNIQUE (slug);


--
-- Name: stores stores_slug_key1342; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1342 UNIQUE (slug);


--
-- Name: stores stores_slug_key1343; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1343 UNIQUE (slug);


--
-- Name: stores stores_slug_key1344; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1344 UNIQUE (slug);


--
-- Name: stores stores_slug_key1345; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1345 UNIQUE (slug);


--
-- Name: stores stores_slug_key1346; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1346 UNIQUE (slug);


--
-- Name: stores stores_slug_key1347; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1347 UNIQUE (slug);


--
-- Name: stores stores_slug_key1348; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1348 UNIQUE (slug);


--
-- Name: stores stores_slug_key1349; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1349 UNIQUE (slug);


--
-- Name: stores stores_slug_key135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key135 UNIQUE (slug);


--
-- Name: stores stores_slug_key1350; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1350 UNIQUE (slug);


--
-- Name: stores stores_slug_key1351; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1351 UNIQUE (slug);


--
-- Name: stores stores_slug_key1352; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1352 UNIQUE (slug);


--
-- Name: stores stores_slug_key1353; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1353 UNIQUE (slug);


--
-- Name: stores stores_slug_key1354; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1354 UNIQUE (slug);


--
-- Name: stores stores_slug_key1355; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1355 UNIQUE (slug);


--
-- Name: stores stores_slug_key1356; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1356 UNIQUE (slug);


--
-- Name: stores stores_slug_key1357; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1357 UNIQUE (slug);


--
-- Name: stores stores_slug_key1358; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1358 UNIQUE (slug);


--
-- Name: stores stores_slug_key1359; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1359 UNIQUE (slug);


--
-- Name: stores stores_slug_key136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key136 UNIQUE (slug);


--
-- Name: stores stores_slug_key1360; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1360 UNIQUE (slug);


--
-- Name: stores stores_slug_key1361; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1361 UNIQUE (slug);


--
-- Name: stores stores_slug_key1362; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1362 UNIQUE (slug);


--
-- Name: stores stores_slug_key1363; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1363 UNIQUE (slug);


--
-- Name: stores stores_slug_key1364; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1364 UNIQUE (slug);


--
-- Name: stores stores_slug_key1365; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1365 UNIQUE (slug);


--
-- Name: stores stores_slug_key1366; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1366 UNIQUE (slug);


--
-- Name: stores stores_slug_key1367; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1367 UNIQUE (slug);


--
-- Name: stores stores_slug_key1368; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1368 UNIQUE (slug);


--
-- Name: stores stores_slug_key1369; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1369 UNIQUE (slug);


--
-- Name: stores stores_slug_key137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key137 UNIQUE (slug);


--
-- Name: stores stores_slug_key1370; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1370 UNIQUE (slug);


--
-- Name: stores stores_slug_key1371; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1371 UNIQUE (slug);


--
-- Name: stores stores_slug_key1372; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1372 UNIQUE (slug);


--
-- Name: stores stores_slug_key1373; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1373 UNIQUE (slug);


--
-- Name: stores stores_slug_key1374; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1374 UNIQUE (slug);


--
-- Name: stores stores_slug_key1375; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1375 UNIQUE (slug);


--
-- Name: stores stores_slug_key1376; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1376 UNIQUE (slug);


--
-- Name: stores stores_slug_key1377; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1377 UNIQUE (slug);


--
-- Name: stores stores_slug_key1378; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1378 UNIQUE (slug);


--
-- Name: stores stores_slug_key1379; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1379 UNIQUE (slug);


--
-- Name: stores stores_slug_key138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key138 UNIQUE (slug);


--
-- Name: stores stores_slug_key1380; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1380 UNIQUE (slug);


--
-- Name: stores stores_slug_key1381; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1381 UNIQUE (slug);


--
-- Name: stores stores_slug_key1382; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1382 UNIQUE (slug);


--
-- Name: stores stores_slug_key1383; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1383 UNIQUE (slug);


--
-- Name: stores stores_slug_key1384; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1384 UNIQUE (slug);


--
-- Name: stores stores_slug_key1385; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1385 UNIQUE (slug);


--
-- Name: stores stores_slug_key1386; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1386 UNIQUE (slug);


--
-- Name: stores stores_slug_key1387; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1387 UNIQUE (slug);


--
-- Name: stores stores_slug_key1388; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1388 UNIQUE (slug);


--
-- Name: stores stores_slug_key1389; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1389 UNIQUE (slug);


--
-- Name: stores stores_slug_key139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key139 UNIQUE (slug);


--
-- Name: stores stores_slug_key1390; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1390 UNIQUE (slug);


--
-- Name: stores stores_slug_key1391; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1391 UNIQUE (slug);


--
-- Name: stores stores_slug_key1392; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1392 UNIQUE (slug);


--
-- Name: stores stores_slug_key1393; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1393 UNIQUE (slug);


--
-- Name: stores stores_slug_key1394; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1394 UNIQUE (slug);


--
-- Name: stores stores_slug_key1395; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1395 UNIQUE (slug);


--
-- Name: stores stores_slug_key1396; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1396 UNIQUE (slug);


--
-- Name: stores stores_slug_key1397; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1397 UNIQUE (slug);


--
-- Name: stores stores_slug_key1398; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1398 UNIQUE (slug);


--
-- Name: stores stores_slug_key1399; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1399 UNIQUE (slug);


--
-- Name: stores stores_slug_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key14 UNIQUE (slug);


--
-- Name: stores stores_slug_key140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key140 UNIQUE (slug);


--
-- Name: stores stores_slug_key1400; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1400 UNIQUE (slug);


--
-- Name: stores stores_slug_key1401; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1401 UNIQUE (slug);


--
-- Name: stores stores_slug_key1402; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1402 UNIQUE (slug);


--
-- Name: stores stores_slug_key1403; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1403 UNIQUE (slug);


--
-- Name: stores stores_slug_key1404; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1404 UNIQUE (slug);


--
-- Name: stores stores_slug_key1405; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1405 UNIQUE (slug);


--
-- Name: stores stores_slug_key1406; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1406 UNIQUE (slug);


--
-- Name: stores stores_slug_key1407; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1407 UNIQUE (slug);


--
-- Name: stores stores_slug_key1408; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1408 UNIQUE (slug);


--
-- Name: stores stores_slug_key1409; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1409 UNIQUE (slug);


--
-- Name: stores stores_slug_key141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key141 UNIQUE (slug);


--
-- Name: stores stores_slug_key1410; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1410 UNIQUE (slug);


--
-- Name: stores stores_slug_key1411; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1411 UNIQUE (slug);


--
-- Name: stores stores_slug_key1412; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1412 UNIQUE (slug);


--
-- Name: stores stores_slug_key1413; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1413 UNIQUE (slug);


--
-- Name: stores stores_slug_key1414; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1414 UNIQUE (slug);


--
-- Name: stores stores_slug_key1415; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1415 UNIQUE (slug);


--
-- Name: stores stores_slug_key1416; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1416 UNIQUE (slug);


--
-- Name: stores stores_slug_key1417; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1417 UNIQUE (slug);


--
-- Name: stores stores_slug_key1418; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1418 UNIQUE (slug);


--
-- Name: stores stores_slug_key1419; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1419 UNIQUE (slug);


--
-- Name: stores stores_slug_key142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key142 UNIQUE (slug);


--
-- Name: stores stores_slug_key1420; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1420 UNIQUE (slug);


--
-- Name: stores stores_slug_key1421; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1421 UNIQUE (slug);


--
-- Name: stores stores_slug_key1422; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1422 UNIQUE (slug);


--
-- Name: stores stores_slug_key1423; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1423 UNIQUE (slug);


--
-- Name: stores stores_slug_key1424; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1424 UNIQUE (slug);


--
-- Name: stores stores_slug_key1425; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1425 UNIQUE (slug);


--
-- Name: stores stores_slug_key1426; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1426 UNIQUE (slug);


--
-- Name: stores stores_slug_key1427; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1427 UNIQUE (slug);


--
-- Name: stores stores_slug_key1428; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1428 UNIQUE (slug);


--
-- Name: stores stores_slug_key1429; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1429 UNIQUE (slug);


--
-- Name: stores stores_slug_key143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key143 UNIQUE (slug);


--
-- Name: stores stores_slug_key1430; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1430 UNIQUE (slug);


--
-- Name: stores stores_slug_key1431; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1431 UNIQUE (slug);


--
-- Name: stores stores_slug_key1432; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1432 UNIQUE (slug);


--
-- Name: stores stores_slug_key1433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1433 UNIQUE (slug);


--
-- Name: stores stores_slug_key1434; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1434 UNIQUE (slug);


--
-- Name: stores stores_slug_key1435; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1435 UNIQUE (slug);


--
-- Name: stores stores_slug_key1436; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1436 UNIQUE (slug);


--
-- Name: stores stores_slug_key1437; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1437 UNIQUE (slug);


--
-- Name: stores stores_slug_key1438; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1438 UNIQUE (slug);


--
-- Name: stores stores_slug_key1439; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1439 UNIQUE (slug);


--
-- Name: stores stores_slug_key144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key144 UNIQUE (slug);


--
-- Name: stores stores_slug_key1440; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1440 UNIQUE (slug);


--
-- Name: stores stores_slug_key1441; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1441 UNIQUE (slug);


--
-- Name: stores stores_slug_key1442; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1442 UNIQUE (slug);


--
-- Name: stores stores_slug_key1443; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1443 UNIQUE (slug);


--
-- Name: stores stores_slug_key1444; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1444 UNIQUE (slug);


--
-- Name: stores stores_slug_key1445; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1445 UNIQUE (slug);


--
-- Name: stores stores_slug_key1446; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1446 UNIQUE (slug);


--
-- Name: stores stores_slug_key1447; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1447 UNIQUE (slug);


--
-- Name: stores stores_slug_key1448; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1448 UNIQUE (slug);


--
-- Name: stores stores_slug_key1449; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1449 UNIQUE (slug);


--
-- Name: stores stores_slug_key145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key145 UNIQUE (slug);


--
-- Name: stores stores_slug_key1450; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1450 UNIQUE (slug);


--
-- Name: stores stores_slug_key1451; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1451 UNIQUE (slug);


--
-- Name: stores stores_slug_key1452; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1452 UNIQUE (slug);


--
-- Name: stores stores_slug_key1453; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1453 UNIQUE (slug);


--
-- Name: stores stores_slug_key1454; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1454 UNIQUE (slug);


--
-- Name: stores stores_slug_key1455; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1455 UNIQUE (slug);


--
-- Name: stores stores_slug_key1456; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1456 UNIQUE (slug);


--
-- Name: stores stores_slug_key1457; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1457 UNIQUE (slug);


--
-- Name: stores stores_slug_key1458; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1458 UNIQUE (slug);


--
-- Name: stores stores_slug_key1459; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1459 UNIQUE (slug);


--
-- Name: stores stores_slug_key146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key146 UNIQUE (slug);


--
-- Name: stores stores_slug_key1460; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1460 UNIQUE (slug);


--
-- Name: stores stores_slug_key1461; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1461 UNIQUE (slug);


--
-- Name: stores stores_slug_key1462; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1462 UNIQUE (slug);


--
-- Name: stores stores_slug_key1463; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1463 UNIQUE (slug);


--
-- Name: stores stores_slug_key1464; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1464 UNIQUE (slug);


--
-- Name: stores stores_slug_key1465; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1465 UNIQUE (slug);


--
-- Name: stores stores_slug_key1466; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1466 UNIQUE (slug);


--
-- Name: stores stores_slug_key1467; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1467 UNIQUE (slug);


--
-- Name: stores stores_slug_key1468; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1468 UNIQUE (slug);


--
-- Name: stores stores_slug_key1469; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1469 UNIQUE (slug);


--
-- Name: stores stores_slug_key147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key147 UNIQUE (slug);


--
-- Name: stores stores_slug_key1470; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1470 UNIQUE (slug);


--
-- Name: stores stores_slug_key1471; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1471 UNIQUE (slug);


--
-- Name: stores stores_slug_key1472; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1472 UNIQUE (slug);


--
-- Name: stores stores_slug_key1473; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1473 UNIQUE (slug);


--
-- Name: stores stores_slug_key1474; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1474 UNIQUE (slug);


--
-- Name: stores stores_slug_key1475; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1475 UNIQUE (slug);


--
-- Name: stores stores_slug_key1476; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1476 UNIQUE (slug);


--
-- Name: stores stores_slug_key1477; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1477 UNIQUE (slug);


--
-- Name: stores stores_slug_key1478; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1478 UNIQUE (slug);


--
-- Name: stores stores_slug_key1479; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1479 UNIQUE (slug);


--
-- Name: stores stores_slug_key148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key148 UNIQUE (slug);


--
-- Name: stores stores_slug_key1480; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1480 UNIQUE (slug);


--
-- Name: stores stores_slug_key1481; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1481 UNIQUE (slug);


--
-- Name: stores stores_slug_key1482; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1482 UNIQUE (slug);


--
-- Name: stores stores_slug_key1483; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1483 UNIQUE (slug);


--
-- Name: stores stores_slug_key1484; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1484 UNIQUE (slug);


--
-- Name: stores stores_slug_key1485; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1485 UNIQUE (slug);


--
-- Name: stores stores_slug_key1486; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1486 UNIQUE (slug);


--
-- Name: stores stores_slug_key1487; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1487 UNIQUE (slug);


--
-- Name: stores stores_slug_key1488; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1488 UNIQUE (slug);


--
-- Name: stores stores_slug_key1489; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1489 UNIQUE (slug);


--
-- Name: stores stores_slug_key149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key149 UNIQUE (slug);


--
-- Name: stores stores_slug_key1490; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1490 UNIQUE (slug);


--
-- Name: stores stores_slug_key1491; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1491 UNIQUE (slug);


--
-- Name: stores stores_slug_key1492; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1492 UNIQUE (slug);


--
-- Name: stores stores_slug_key1493; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1493 UNIQUE (slug);


--
-- Name: stores stores_slug_key1494; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1494 UNIQUE (slug);


--
-- Name: stores stores_slug_key1495; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1495 UNIQUE (slug);


--
-- Name: stores stores_slug_key1496; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1496 UNIQUE (slug);


--
-- Name: stores stores_slug_key1497; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1497 UNIQUE (slug);


--
-- Name: stores stores_slug_key1498; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1498 UNIQUE (slug);


--
-- Name: stores stores_slug_key1499; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1499 UNIQUE (slug);


--
-- Name: stores stores_slug_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key15 UNIQUE (slug);


--
-- Name: stores stores_slug_key150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key150 UNIQUE (slug);


--
-- Name: stores stores_slug_key1500; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1500 UNIQUE (slug);


--
-- Name: stores stores_slug_key1501; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1501 UNIQUE (slug);


--
-- Name: stores stores_slug_key1502; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1502 UNIQUE (slug);


--
-- Name: stores stores_slug_key1503; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1503 UNIQUE (slug);


--
-- Name: stores stores_slug_key1504; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1504 UNIQUE (slug);


--
-- Name: stores stores_slug_key1505; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1505 UNIQUE (slug);


--
-- Name: stores stores_slug_key1506; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1506 UNIQUE (slug);


--
-- Name: stores stores_slug_key1507; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1507 UNIQUE (slug);


--
-- Name: stores stores_slug_key1508; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1508 UNIQUE (slug);


--
-- Name: stores stores_slug_key1509; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1509 UNIQUE (slug);


--
-- Name: stores stores_slug_key151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key151 UNIQUE (slug);


--
-- Name: stores stores_slug_key1510; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1510 UNIQUE (slug);


--
-- Name: stores stores_slug_key1511; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1511 UNIQUE (slug);


--
-- Name: stores stores_slug_key1512; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1512 UNIQUE (slug);


--
-- Name: stores stores_slug_key1513; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1513 UNIQUE (slug);


--
-- Name: stores stores_slug_key1514; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1514 UNIQUE (slug);


--
-- Name: stores stores_slug_key1515; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1515 UNIQUE (slug);


--
-- Name: stores stores_slug_key1516; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1516 UNIQUE (slug);


--
-- Name: stores stores_slug_key1517; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1517 UNIQUE (slug);


--
-- Name: stores stores_slug_key1518; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1518 UNIQUE (slug);


--
-- Name: stores stores_slug_key1519; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1519 UNIQUE (slug);


--
-- Name: stores stores_slug_key152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key152 UNIQUE (slug);


--
-- Name: stores stores_slug_key1520; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1520 UNIQUE (slug);


--
-- Name: stores stores_slug_key1521; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1521 UNIQUE (slug);


--
-- Name: stores stores_slug_key1522; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1522 UNIQUE (slug);


--
-- Name: stores stores_slug_key1523; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1523 UNIQUE (slug);


--
-- Name: stores stores_slug_key1524; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1524 UNIQUE (slug);


--
-- Name: stores stores_slug_key1525; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1525 UNIQUE (slug);


--
-- Name: stores stores_slug_key1526; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1526 UNIQUE (slug);


--
-- Name: stores stores_slug_key1527; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1527 UNIQUE (slug);


--
-- Name: stores stores_slug_key1528; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1528 UNIQUE (slug);


--
-- Name: stores stores_slug_key1529; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1529 UNIQUE (slug);


--
-- Name: stores stores_slug_key153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key153 UNIQUE (slug);


--
-- Name: stores stores_slug_key1530; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1530 UNIQUE (slug);


--
-- Name: stores stores_slug_key1531; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1531 UNIQUE (slug);


--
-- Name: stores stores_slug_key1532; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1532 UNIQUE (slug);


--
-- Name: stores stores_slug_key1533; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1533 UNIQUE (slug);


--
-- Name: stores stores_slug_key1534; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1534 UNIQUE (slug);


--
-- Name: stores stores_slug_key1535; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1535 UNIQUE (slug);


--
-- Name: stores stores_slug_key1536; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1536 UNIQUE (slug);


--
-- Name: stores stores_slug_key1537; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1537 UNIQUE (slug);


--
-- Name: stores stores_slug_key1538; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1538 UNIQUE (slug);


--
-- Name: stores stores_slug_key1539; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1539 UNIQUE (slug);


--
-- Name: stores stores_slug_key154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key154 UNIQUE (slug);


--
-- Name: stores stores_slug_key1540; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1540 UNIQUE (slug);


--
-- Name: stores stores_slug_key1541; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1541 UNIQUE (slug);


--
-- Name: stores stores_slug_key1542; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1542 UNIQUE (slug);


--
-- Name: stores stores_slug_key1543; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1543 UNIQUE (slug);


--
-- Name: stores stores_slug_key1544; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1544 UNIQUE (slug);


--
-- Name: stores stores_slug_key1545; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1545 UNIQUE (slug);


--
-- Name: stores stores_slug_key1546; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1546 UNIQUE (slug);


--
-- Name: stores stores_slug_key1547; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1547 UNIQUE (slug);


--
-- Name: stores stores_slug_key1548; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1548 UNIQUE (slug);


--
-- Name: stores stores_slug_key1549; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1549 UNIQUE (slug);


--
-- Name: stores stores_slug_key155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key155 UNIQUE (slug);


--
-- Name: stores stores_slug_key1550; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1550 UNIQUE (slug);


--
-- Name: stores stores_slug_key1551; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1551 UNIQUE (slug);


--
-- Name: stores stores_slug_key1552; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1552 UNIQUE (slug);


--
-- Name: stores stores_slug_key1553; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1553 UNIQUE (slug);


--
-- Name: stores stores_slug_key1554; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1554 UNIQUE (slug);


--
-- Name: stores stores_slug_key1555; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1555 UNIQUE (slug);


--
-- Name: stores stores_slug_key1556; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1556 UNIQUE (slug);


--
-- Name: stores stores_slug_key1557; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1557 UNIQUE (slug);


--
-- Name: stores stores_slug_key1558; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1558 UNIQUE (slug);


--
-- Name: stores stores_slug_key1559; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1559 UNIQUE (slug);


--
-- Name: stores stores_slug_key156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key156 UNIQUE (slug);


--
-- Name: stores stores_slug_key1560; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1560 UNIQUE (slug);


--
-- Name: stores stores_slug_key1561; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1561 UNIQUE (slug);


--
-- Name: stores stores_slug_key1562; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1562 UNIQUE (slug);


--
-- Name: stores stores_slug_key1563; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1563 UNIQUE (slug);


--
-- Name: stores stores_slug_key1564; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1564 UNIQUE (slug);


--
-- Name: stores stores_slug_key1565; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1565 UNIQUE (slug);


--
-- Name: stores stores_slug_key1566; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1566 UNIQUE (slug);


--
-- Name: stores stores_slug_key1567; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1567 UNIQUE (slug);


--
-- Name: stores stores_slug_key1568; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1568 UNIQUE (slug);


--
-- Name: stores stores_slug_key1569; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1569 UNIQUE (slug);


--
-- Name: stores stores_slug_key157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key157 UNIQUE (slug);


--
-- Name: stores stores_slug_key1570; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1570 UNIQUE (slug);


--
-- Name: stores stores_slug_key1571; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1571 UNIQUE (slug);


--
-- Name: stores stores_slug_key1572; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1572 UNIQUE (slug);


--
-- Name: stores stores_slug_key1573; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1573 UNIQUE (slug);


--
-- Name: stores stores_slug_key1574; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1574 UNIQUE (slug);


--
-- Name: stores stores_slug_key1575; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1575 UNIQUE (slug);


--
-- Name: stores stores_slug_key1576; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1576 UNIQUE (slug);


--
-- Name: stores stores_slug_key1577; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1577 UNIQUE (slug);


--
-- Name: stores stores_slug_key1578; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1578 UNIQUE (slug);


--
-- Name: stores stores_slug_key1579; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1579 UNIQUE (slug);


--
-- Name: stores stores_slug_key158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key158 UNIQUE (slug);


--
-- Name: stores stores_slug_key1580; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1580 UNIQUE (slug);


--
-- Name: stores stores_slug_key1581; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1581 UNIQUE (slug);


--
-- Name: stores stores_slug_key1582; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1582 UNIQUE (slug);


--
-- Name: stores stores_slug_key1583; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1583 UNIQUE (slug);


--
-- Name: stores stores_slug_key1584; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1584 UNIQUE (slug);


--
-- Name: stores stores_slug_key1585; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1585 UNIQUE (slug);


--
-- Name: stores stores_slug_key1586; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1586 UNIQUE (slug);


--
-- Name: stores stores_slug_key1587; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1587 UNIQUE (slug);


--
-- Name: stores stores_slug_key1588; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1588 UNIQUE (slug);


--
-- Name: stores stores_slug_key1589; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1589 UNIQUE (slug);


--
-- Name: stores stores_slug_key159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key159 UNIQUE (slug);


--
-- Name: stores stores_slug_key1590; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1590 UNIQUE (slug);


--
-- Name: stores stores_slug_key1591; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1591 UNIQUE (slug);


--
-- Name: stores stores_slug_key1592; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1592 UNIQUE (slug);


--
-- Name: stores stores_slug_key1593; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1593 UNIQUE (slug);


--
-- Name: stores stores_slug_key1594; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1594 UNIQUE (slug);


--
-- Name: stores stores_slug_key1595; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1595 UNIQUE (slug);


--
-- Name: stores stores_slug_key1596; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1596 UNIQUE (slug);


--
-- Name: stores stores_slug_key1597; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1597 UNIQUE (slug);


--
-- Name: stores stores_slug_key1598; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1598 UNIQUE (slug);


--
-- Name: stores stores_slug_key1599; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1599 UNIQUE (slug);


--
-- Name: stores stores_slug_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key16 UNIQUE (slug);


--
-- Name: stores stores_slug_key160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key160 UNIQUE (slug);


--
-- Name: stores stores_slug_key1600; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1600 UNIQUE (slug);


--
-- Name: stores stores_slug_key1601; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1601 UNIQUE (slug);


--
-- Name: stores stores_slug_key1602; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1602 UNIQUE (slug);


--
-- Name: stores stores_slug_key1603; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1603 UNIQUE (slug);


--
-- Name: stores stores_slug_key1604; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1604 UNIQUE (slug);


--
-- Name: stores stores_slug_key1605; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1605 UNIQUE (slug);


--
-- Name: stores stores_slug_key1606; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1606 UNIQUE (slug);


--
-- Name: stores stores_slug_key1607; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1607 UNIQUE (slug);


--
-- Name: stores stores_slug_key1608; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1608 UNIQUE (slug);


--
-- Name: stores stores_slug_key1609; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1609 UNIQUE (slug);


--
-- Name: stores stores_slug_key161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key161 UNIQUE (slug);


--
-- Name: stores stores_slug_key1610; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1610 UNIQUE (slug);


--
-- Name: stores stores_slug_key1611; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1611 UNIQUE (slug);


--
-- Name: stores stores_slug_key1612; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1612 UNIQUE (slug);


--
-- Name: stores stores_slug_key1613; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1613 UNIQUE (slug);


--
-- Name: stores stores_slug_key1614; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1614 UNIQUE (slug);


--
-- Name: stores stores_slug_key1615; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1615 UNIQUE (slug);


--
-- Name: stores stores_slug_key1616; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1616 UNIQUE (slug);


--
-- Name: stores stores_slug_key1617; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1617 UNIQUE (slug);


--
-- Name: stores stores_slug_key1618; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1618 UNIQUE (slug);


--
-- Name: stores stores_slug_key1619; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1619 UNIQUE (slug);


--
-- Name: stores stores_slug_key162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key162 UNIQUE (slug);


--
-- Name: stores stores_slug_key1620; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1620 UNIQUE (slug);


--
-- Name: stores stores_slug_key1621; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1621 UNIQUE (slug);


--
-- Name: stores stores_slug_key1622; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1622 UNIQUE (slug);


--
-- Name: stores stores_slug_key1623; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1623 UNIQUE (slug);


--
-- Name: stores stores_slug_key1624; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1624 UNIQUE (slug);


--
-- Name: stores stores_slug_key1625; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1625 UNIQUE (slug);


--
-- Name: stores stores_slug_key1626; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1626 UNIQUE (slug);


--
-- Name: stores stores_slug_key1627; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1627 UNIQUE (slug);


--
-- Name: stores stores_slug_key1628; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1628 UNIQUE (slug);


--
-- Name: stores stores_slug_key1629; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1629 UNIQUE (slug);


--
-- Name: stores stores_slug_key163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key163 UNIQUE (slug);


--
-- Name: stores stores_slug_key1630; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1630 UNIQUE (slug);


--
-- Name: stores stores_slug_key1631; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1631 UNIQUE (slug);


--
-- Name: stores stores_slug_key1632; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1632 UNIQUE (slug);


--
-- Name: stores stores_slug_key1633; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1633 UNIQUE (slug);


--
-- Name: stores stores_slug_key1634; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1634 UNIQUE (slug);


--
-- Name: stores stores_slug_key1635; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1635 UNIQUE (slug);


--
-- Name: stores stores_slug_key1636; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1636 UNIQUE (slug);


--
-- Name: stores stores_slug_key1637; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1637 UNIQUE (slug);


--
-- Name: stores stores_slug_key1638; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1638 UNIQUE (slug);


--
-- Name: stores stores_slug_key1639; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1639 UNIQUE (slug);


--
-- Name: stores stores_slug_key164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key164 UNIQUE (slug);


--
-- Name: stores stores_slug_key1640; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1640 UNIQUE (slug);


--
-- Name: stores stores_slug_key1641; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1641 UNIQUE (slug);


--
-- Name: stores stores_slug_key1642; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1642 UNIQUE (slug);


--
-- Name: stores stores_slug_key1643; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1643 UNIQUE (slug);


--
-- Name: stores stores_slug_key1644; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1644 UNIQUE (slug);


--
-- Name: stores stores_slug_key1645; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1645 UNIQUE (slug);


--
-- Name: stores stores_slug_key1646; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1646 UNIQUE (slug);


--
-- Name: stores stores_slug_key1647; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1647 UNIQUE (slug);


--
-- Name: stores stores_slug_key1648; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1648 UNIQUE (slug);


--
-- Name: stores stores_slug_key1649; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1649 UNIQUE (slug);


--
-- Name: stores stores_slug_key165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key165 UNIQUE (slug);


--
-- Name: stores stores_slug_key1650; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1650 UNIQUE (slug);


--
-- Name: stores stores_slug_key1651; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1651 UNIQUE (slug);


--
-- Name: stores stores_slug_key1652; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1652 UNIQUE (slug);


--
-- Name: stores stores_slug_key1653; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1653 UNIQUE (slug);


--
-- Name: stores stores_slug_key1654; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1654 UNIQUE (slug);


--
-- Name: stores stores_slug_key1655; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1655 UNIQUE (slug);


--
-- Name: stores stores_slug_key1656; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1656 UNIQUE (slug);


--
-- Name: stores stores_slug_key1657; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1657 UNIQUE (slug);


--
-- Name: stores stores_slug_key1658; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1658 UNIQUE (slug);


--
-- Name: stores stores_slug_key1659; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1659 UNIQUE (slug);


--
-- Name: stores stores_slug_key166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key166 UNIQUE (slug);


--
-- Name: stores stores_slug_key1660; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1660 UNIQUE (slug);


--
-- Name: stores stores_slug_key1661; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1661 UNIQUE (slug);


--
-- Name: stores stores_slug_key1662; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1662 UNIQUE (slug);


--
-- Name: stores stores_slug_key1663; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1663 UNIQUE (slug);


--
-- Name: stores stores_slug_key1664; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1664 UNIQUE (slug);


--
-- Name: stores stores_slug_key1665; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1665 UNIQUE (slug);


--
-- Name: stores stores_slug_key1666; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1666 UNIQUE (slug);


--
-- Name: stores stores_slug_key1667; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1667 UNIQUE (slug);


--
-- Name: stores stores_slug_key1668; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1668 UNIQUE (slug);


--
-- Name: stores stores_slug_key1669; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1669 UNIQUE (slug);


--
-- Name: stores stores_slug_key167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key167 UNIQUE (slug);


--
-- Name: stores stores_slug_key1670; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1670 UNIQUE (slug);


--
-- Name: stores stores_slug_key1671; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1671 UNIQUE (slug);


--
-- Name: stores stores_slug_key1672; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1672 UNIQUE (slug);


--
-- Name: stores stores_slug_key1673; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1673 UNIQUE (slug);


--
-- Name: stores stores_slug_key1674; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1674 UNIQUE (slug);


--
-- Name: stores stores_slug_key1675; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1675 UNIQUE (slug);


--
-- Name: stores stores_slug_key1676; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1676 UNIQUE (slug);


--
-- Name: stores stores_slug_key1677; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1677 UNIQUE (slug);


--
-- Name: stores stores_slug_key1678; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1678 UNIQUE (slug);


--
-- Name: stores stores_slug_key1679; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1679 UNIQUE (slug);


--
-- Name: stores stores_slug_key168; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key168 UNIQUE (slug);


--
-- Name: stores stores_slug_key1680; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1680 UNIQUE (slug);


--
-- Name: stores stores_slug_key1681; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1681 UNIQUE (slug);


--
-- Name: stores stores_slug_key1682; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1682 UNIQUE (slug);


--
-- Name: stores stores_slug_key1683; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1683 UNIQUE (slug);


--
-- Name: stores stores_slug_key1684; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1684 UNIQUE (slug);


--
-- Name: stores stores_slug_key1685; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1685 UNIQUE (slug);


--
-- Name: stores stores_slug_key1686; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1686 UNIQUE (slug);


--
-- Name: stores stores_slug_key1687; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1687 UNIQUE (slug);


--
-- Name: stores stores_slug_key1688; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1688 UNIQUE (slug);


--
-- Name: stores stores_slug_key1689; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1689 UNIQUE (slug);


--
-- Name: stores stores_slug_key169; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key169 UNIQUE (slug);


--
-- Name: stores stores_slug_key1690; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1690 UNIQUE (slug);


--
-- Name: stores stores_slug_key1691; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1691 UNIQUE (slug);


--
-- Name: stores stores_slug_key1692; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1692 UNIQUE (slug);


--
-- Name: stores stores_slug_key1693; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1693 UNIQUE (slug);


--
-- Name: stores stores_slug_key1694; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1694 UNIQUE (slug);


--
-- Name: stores stores_slug_key1695; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1695 UNIQUE (slug);


--
-- Name: stores stores_slug_key1696; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1696 UNIQUE (slug);


--
-- Name: stores stores_slug_key1697; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1697 UNIQUE (slug);


--
-- Name: stores stores_slug_key1698; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1698 UNIQUE (slug);


--
-- Name: stores stores_slug_key1699; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1699 UNIQUE (slug);


--
-- Name: stores stores_slug_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key17 UNIQUE (slug);


--
-- Name: stores stores_slug_key170; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key170 UNIQUE (slug);


--
-- Name: stores stores_slug_key1700; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1700 UNIQUE (slug);


--
-- Name: stores stores_slug_key1701; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1701 UNIQUE (slug);


--
-- Name: stores stores_slug_key1702; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1702 UNIQUE (slug);


--
-- Name: stores stores_slug_key1703; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1703 UNIQUE (slug);


--
-- Name: stores stores_slug_key1704; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1704 UNIQUE (slug);


--
-- Name: stores stores_slug_key1705; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1705 UNIQUE (slug);


--
-- Name: stores stores_slug_key1706; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1706 UNIQUE (slug);


--
-- Name: stores stores_slug_key1707; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1707 UNIQUE (slug);


--
-- Name: stores stores_slug_key1708; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1708 UNIQUE (slug);


--
-- Name: stores stores_slug_key1709; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1709 UNIQUE (slug);


--
-- Name: stores stores_slug_key171; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key171 UNIQUE (slug);


--
-- Name: stores stores_slug_key1710; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1710 UNIQUE (slug);


--
-- Name: stores stores_slug_key1711; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1711 UNIQUE (slug);


--
-- Name: stores stores_slug_key1712; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1712 UNIQUE (slug);


--
-- Name: stores stores_slug_key1713; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1713 UNIQUE (slug);


--
-- Name: stores stores_slug_key1714; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1714 UNIQUE (slug);


--
-- Name: stores stores_slug_key1715; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1715 UNIQUE (slug);


--
-- Name: stores stores_slug_key1716; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1716 UNIQUE (slug);


--
-- Name: stores stores_slug_key1717; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1717 UNIQUE (slug);


--
-- Name: stores stores_slug_key1718; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1718 UNIQUE (slug);


--
-- Name: stores stores_slug_key1719; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1719 UNIQUE (slug);


--
-- Name: stores stores_slug_key172; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key172 UNIQUE (slug);


--
-- Name: stores stores_slug_key1720; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1720 UNIQUE (slug);


--
-- Name: stores stores_slug_key1721; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1721 UNIQUE (slug);


--
-- Name: stores stores_slug_key1722; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1722 UNIQUE (slug);


--
-- Name: stores stores_slug_key1723; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1723 UNIQUE (slug);


--
-- Name: stores stores_slug_key1724; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1724 UNIQUE (slug);


--
-- Name: stores stores_slug_key1725; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1725 UNIQUE (slug);


--
-- Name: stores stores_slug_key1726; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1726 UNIQUE (slug);


--
-- Name: stores stores_slug_key1727; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1727 UNIQUE (slug);


--
-- Name: stores stores_slug_key1728; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1728 UNIQUE (slug);


--
-- Name: stores stores_slug_key1729; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1729 UNIQUE (slug);


--
-- Name: stores stores_slug_key173; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key173 UNIQUE (slug);


--
-- Name: stores stores_slug_key1730; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1730 UNIQUE (slug);


--
-- Name: stores stores_slug_key1731; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1731 UNIQUE (slug);


--
-- Name: stores stores_slug_key1732; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1732 UNIQUE (slug);


--
-- Name: stores stores_slug_key1733; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1733 UNIQUE (slug);


--
-- Name: stores stores_slug_key1734; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1734 UNIQUE (slug);


--
-- Name: stores stores_slug_key1735; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1735 UNIQUE (slug);


--
-- Name: stores stores_slug_key1736; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1736 UNIQUE (slug);


--
-- Name: stores stores_slug_key1737; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1737 UNIQUE (slug);


--
-- Name: stores stores_slug_key1738; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1738 UNIQUE (slug);


--
-- Name: stores stores_slug_key1739; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1739 UNIQUE (slug);


--
-- Name: stores stores_slug_key174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key174 UNIQUE (slug);


--
-- Name: stores stores_slug_key1740; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1740 UNIQUE (slug);


--
-- Name: stores stores_slug_key1741; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1741 UNIQUE (slug);


--
-- Name: stores stores_slug_key1742; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1742 UNIQUE (slug);


--
-- Name: stores stores_slug_key1743; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1743 UNIQUE (slug);


--
-- Name: stores stores_slug_key1744; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1744 UNIQUE (slug);


--
-- Name: stores stores_slug_key1745; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1745 UNIQUE (slug);


--
-- Name: stores stores_slug_key1746; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1746 UNIQUE (slug);


--
-- Name: stores stores_slug_key1747; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1747 UNIQUE (slug);


--
-- Name: stores stores_slug_key1748; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1748 UNIQUE (slug);


--
-- Name: stores stores_slug_key1749; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1749 UNIQUE (slug);


--
-- Name: stores stores_slug_key175; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key175 UNIQUE (slug);


--
-- Name: stores stores_slug_key1750; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1750 UNIQUE (slug);


--
-- Name: stores stores_slug_key1751; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1751 UNIQUE (slug);


--
-- Name: stores stores_slug_key1752; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1752 UNIQUE (slug);


--
-- Name: stores stores_slug_key1753; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1753 UNIQUE (slug);


--
-- Name: stores stores_slug_key1754; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1754 UNIQUE (slug);


--
-- Name: stores stores_slug_key1755; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1755 UNIQUE (slug);


--
-- Name: stores stores_slug_key1756; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1756 UNIQUE (slug);


--
-- Name: stores stores_slug_key1757; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1757 UNIQUE (slug);


--
-- Name: stores stores_slug_key1758; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1758 UNIQUE (slug);


--
-- Name: stores stores_slug_key1759; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1759 UNIQUE (slug);


--
-- Name: stores stores_slug_key176; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key176 UNIQUE (slug);


--
-- Name: stores stores_slug_key1760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1760 UNIQUE (slug);


--
-- Name: stores stores_slug_key1761; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1761 UNIQUE (slug);


--
-- Name: stores stores_slug_key1762; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1762 UNIQUE (slug);


--
-- Name: stores stores_slug_key1763; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1763 UNIQUE (slug);


--
-- Name: stores stores_slug_key1764; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1764 UNIQUE (slug);


--
-- Name: stores stores_slug_key1765; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1765 UNIQUE (slug);


--
-- Name: stores stores_slug_key1766; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1766 UNIQUE (slug);


--
-- Name: stores stores_slug_key1767; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1767 UNIQUE (slug);


--
-- Name: stores stores_slug_key1768; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1768 UNIQUE (slug);


--
-- Name: stores stores_slug_key1769; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1769 UNIQUE (slug);


--
-- Name: stores stores_slug_key177; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key177 UNIQUE (slug);


--
-- Name: stores stores_slug_key1770; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1770 UNIQUE (slug);


--
-- Name: stores stores_slug_key1771; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1771 UNIQUE (slug);


--
-- Name: stores stores_slug_key1772; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1772 UNIQUE (slug);


--
-- Name: stores stores_slug_key1773; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1773 UNIQUE (slug);


--
-- Name: stores stores_slug_key1774; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1774 UNIQUE (slug);


--
-- Name: stores stores_slug_key1775; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1775 UNIQUE (slug);


--
-- Name: stores stores_slug_key1776; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1776 UNIQUE (slug);


--
-- Name: stores stores_slug_key1777; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1777 UNIQUE (slug);


--
-- Name: stores stores_slug_key1778; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1778 UNIQUE (slug);


--
-- Name: stores stores_slug_key1779; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1779 UNIQUE (slug);


--
-- Name: stores stores_slug_key178; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key178 UNIQUE (slug);


--
-- Name: stores stores_slug_key1780; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1780 UNIQUE (slug);


--
-- Name: stores stores_slug_key1781; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1781 UNIQUE (slug);


--
-- Name: stores stores_slug_key1782; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1782 UNIQUE (slug);


--
-- Name: stores stores_slug_key1783; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1783 UNIQUE (slug);


--
-- Name: stores stores_slug_key1784; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1784 UNIQUE (slug);


--
-- Name: stores stores_slug_key1785; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1785 UNIQUE (slug);


--
-- Name: stores stores_slug_key1786; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1786 UNIQUE (slug);


--
-- Name: stores stores_slug_key1787; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1787 UNIQUE (slug);


--
-- Name: stores stores_slug_key1788; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1788 UNIQUE (slug);


--
-- Name: stores stores_slug_key1789; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1789 UNIQUE (slug);


--
-- Name: stores stores_slug_key179; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key179 UNIQUE (slug);


--
-- Name: stores stores_slug_key1790; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1790 UNIQUE (slug);


--
-- Name: stores stores_slug_key1791; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1791 UNIQUE (slug);


--
-- Name: stores stores_slug_key1792; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1792 UNIQUE (slug);


--
-- Name: stores stores_slug_key1793; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1793 UNIQUE (slug);


--
-- Name: stores stores_slug_key1794; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1794 UNIQUE (slug);


--
-- Name: stores stores_slug_key1795; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1795 UNIQUE (slug);


--
-- Name: stores stores_slug_key1796; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1796 UNIQUE (slug);


--
-- Name: stores stores_slug_key1797; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1797 UNIQUE (slug);


--
-- Name: stores stores_slug_key1798; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1798 UNIQUE (slug);


--
-- Name: stores stores_slug_key1799; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1799 UNIQUE (slug);


--
-- Name: stores stores_slug_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key18 UNIQUE (slug);


--
-- Name: stores stores_slug_key180; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key180 UNIQUE (slug);


--
-- Name: stores stores_slug_key1800; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1800 UNIQUE (slug);


--
-- Name: stores stores_slug_key1801; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1801 UNIQUE (slug);


--
-- Name: stores stores_slug_key1802; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1802 UNIQUE (slug);


--
-- Name: stores stores_slug_key1803; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1803 UNIQUE (slug);


--
-- Name: stores stores_slug_key1804; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1804 UNIQUE (slug);


--
-- Name: stores stores_slug_key1805; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1805 UNIQUE (slug);


--
-- Name: stores stores_slug_key1806; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1806 UNIQUE (slug);


--
-- Name: stores stores_slug_key1807; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1807 UNIQUE (slug);


--
-- Name: stores stores_slug_key1808; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1808 UNIQUE (slug);


--
-- Name: stores stores_slug_key1809; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1809 UNIQUE (slug);


--
-- Name: stores stores_slug_key181; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key181 UNIQUE (slug);


--
-- Name: stores stores_slug_key1810; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1810 UNIQUE (slug);


--
-- Name: stores stores_slug_key1811; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1811 UNIQUE (slug);


--
-- Name: stores stores_slug_key1812; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1812 UNIQUE (slug);


--
-- Name: stores stores_slug_key1813; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1813 UNIQUE (slug);


--
-- Name: stores stores_slug_key1814; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1814 UNIQUE (slug);


--
-- Name: stores stores_slug_key1815; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1815 UNIQUE (slug);


--
-- Name: stores stores_slug_key1816; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1816 UNIQUE (slug);


--
-- Name: stores stores_slug_key1817; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1817 UNIQUE (slug);


--
-- Name: stores stores_slug_key1818; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1818 UNIQUE (slug);


--
-- Name: stores stores_slug_key1819; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1819 UNIQUE (slug);


--
-- Name: stores stores_slug_key182; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key182 UNIQUE (slug);


--
-- Name: stores stores_slug_key1820; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1820 UNIQUE (slug);


--
-- Name: stores stores_slug_key1821; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1821 UNIQUE (slug);


--
-- Name: stores stores_slug_key1822; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1822 UNIQUE (slug);


--
-- Name: stores stores_slug_key1823; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1823 UNIQUE (slug);


--
-- Name: stores stores_slug_key1824; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1824 UNIQUE (slug);


--
-- Name: stores stores_slug_key1825; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1825 UNIQUE (slug);


--
-- Name: stores stores_slug_key1826; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1826 UNIQUE (slug);


--
-- Name: stores stores_slug_key1827; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1827 UNIQUE (slug);


--
-- Name: stores stores_slug_key1828; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1828 UNIQUE (slug);


--
-- Name: stores stores_slug_key1829; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1829 UNIQUE (slug);


--
-- Name: stores stores_slug_key183; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key183 UNIQUE (slug);


--
-- Name: stores stores_slug_key1830; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1830 UNIQUE (slug);


--
-- Name: stores stores_slug_key1831; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1831 UNIQUE (slug);


--
-- Name: stores stores_slug_key1832; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1832 UNIQUE (slug);


--
-- Name: stores stores_slug_key1833; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1833 UNIQUE (slug);


--
-- Name: stores stores_slug_key1834; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1834 UNIQUE (slug);


--
-- Name: stores stores_slug_key1835; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1835 UNIQUE (slug);


--
-- Name: stores stores_slug_key1836; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1836 UNIQUE (slug);


--
-- Name: stores stores_slug_key1837; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1837 UNIQUE (slug);


--
-- Name: stores stores_slug_key1838; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1838 UNIQUE (slug);


--
-- Name: stores stores_slug_key1839; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1839 UNIQUE (slug);


--
-- Name: stores stores_slug_key184; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key184 UNIQUE (slug);


--
-- Name: stores stores_slug_key1840; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1840 UNIQUE (slug);


--
-- Name: stores stores_slug_key1841; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1841 UNIQUE (slug);


--
-- Name: stores stores_slug_key1842; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1842 UNIQUE (slug);


--
-- Name: stores stores_slug_key1843; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1843 UNIQUE (slug);


--
-- Name: stores stores_slug_key1844; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1844 UNIQUE (slug);


--
-- Name: stores stores_slug_key1845; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1845 UNIQUE (slug);


--
-- Name: stores stores_slug_key1846; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1846 UNIQUE (slug);


--
-- Name: stores stores_slug_key1847; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1847 UNIQUE (slug);


--
-- Name: stores stores_slug_key1848; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1848 UNIQUE (slug);


--
-- Name: stores stores_slug_key1849; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1849 UNIQUE (slug);


--
-- Name: stores stores_slug_key185; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key185 UNIQUE (slug);


--
-- Name: stores stores_slug_key1850; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1850 UNIQUE (slug);


--
-- Name: stores stores_slug_key1851; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1851 UNIQUE (slug);


--
-- Name: stores stores_slug_key1852; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1852 UNIQUE (slug);


--
-- Name: stores stores_slug_key1853; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1853 UNIQUE (slug);


--
-- Name: stores stores_slug_key1854; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1854 UNIQUE (slug);


--
-- Name: stores stores_slug_key1855; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1855 UNIQUE (slug);


--
-- Name: stores stores_slug_key1856; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1856 UNIQUE (slug);


--
-- Name: stores stores_slug_key1857; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1857 UNIQUE (slug);


--
-- Name: stores stores_slug_key1858; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1858 UNIQUE (slug);


--
-- Name: stores stores_slug_key1859; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1859 UNIQUE (slug);


--
-- Name: stores stores_slug_key186; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key186 UNIQUE (slug);


--
-- Name: stores stores_slug_key1860; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1860 UNIQUE (slug);


--
-- Name: stores stores_slug_key1861; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1861 UNIQUE (slug);


--
-- Name: stores stores_slug_key1862; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1862 UNIQUE (slug);


--
-- Name: stores stores_slug_key1863; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1863 UNIQUE (slug);


--
-- Name: stores stores_slug_key1864; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1864 UNIQUE (slug);


--
-- Name: stores stores_slug_key1865; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1865 UNIQUE (slug);


--
-- Name: stores stores_slug_key1866; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1866 UNIQUE (slug);


--
-- Name: stores stores_slug_key1867; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1867 UNIQUE (slug);


--
-- Name: stores stores_slug_key1868; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1868 UNIQUE (slug);


--
-- Name: stores stores_slug_key1869; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1869 UNIQUE (slug);


--
-- Name: stores stores_slug_key187; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key187 UNIQUE (slug);


--
-- Name: stores stores_slug_key1870; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1870 UNIQUE (slug);


--
-- Name: stores stores_slug_key1871; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1871 UNIQUE (slug);


--
-- Name: stores stores_slug_key1872; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1872 UNIQUE (slug);


--
-- Name: stores stores_slug_key1873; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1873 UNIQUE (slug);


--
-- Name: stores stores_slug_key1874; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1874 UNIQUE (slug);


--
-- Name: stores stores_slug_key1875; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1875 UNIQUE (slug);


--
-- Name: stores stores_slug_key1876; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1876 UNIQUE (slug);


--
-- Name: stores stores_slug_key1877; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1877 UNIQUE (slug);


--
-- Name: stores stores_slug_key1878; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1878 UNIQUE (slug);


--
-- Name: stores stores_slug_key1879; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1879 UNIQUE (slug);


--
-- Name: stores stores_slug_key188; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key188 UNIQUE (slug);


--
-- Name: stores stores_slug_key1880; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1880 UNIQUE (slug);


--
-- Name: stores stores_slug_key1881; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1881 UNIQUE (slug);


--
-- Name: stores stores_slug_key1882; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1882 UNIQUE (slug);


--
-- Name: stores stores_slug_key1883; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1883 UNIQUE (slug);


--
-- Name: stores stores_slug_key1884; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1884 UNIQUE (slug);


--
-- Name: stores stores_slug_key1885; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1885 UNIQUE (slug);


--
-- Name: stores stores_slug_key1886; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1886 UNIQUE (slug);


--
-- Name: stores stores_slug_key1887; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1887 UNIQUE (slug);


--
-- Name: stores stores_slug_key1888; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1888 UNIQUE (slug);


--
-- Name: stores stores_slug_key1889; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1889 UNIQUE (slug);


--
-- Name: stores stores_slug_key189; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key189 UNIQUE (slug);


--
-- Name: stores stores_slug_key1890; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1890 UNIQUE (slug);


--
-- Name: stores stores_slug_key1891; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1891 UNIQUE (slug);


--
-- Name: stores stores_slug_key1892; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1892 UNIQUE (slug);


--
-- Name: stores stores_slug_key1893; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1893 UNIQUE (slug);


--
-- Name: stores stores_slug_key1894; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1894 UNIQUE (slug);


--
-- Name: stores stores_slug_key1895; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1895 UNIQUE (slug);


--
-- Name: stores stores_slug_key1896; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1896 UNIQUE (slug);


--
-- Name: stores stores_slug_key1897; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1897 UNIQUE (slug);


--
-- Name: stores stores_slug_key1898; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1898 UNIQUE (slug);


--
-- Name: stores stores_slug_key1899; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1899 UNIQUE (slug);


--
-- Name: stores stores_slug_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key19 UNIQUE (slug);


--
-- Name: stores stores_slug_key190; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key190 UNIQUE (slug);


--
-- Name: stores stores_slug_key1900; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1900 UNIQUE (slug);


--
-- Name: stores stores_slug_key1901; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1901 UNIQUE (slug);


--
-- Name: stores stores_slug_key1902; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1902 UNIQUE (slug);


--
-- Name: stores stores_slug_key1903; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1903 UNIQUE (slug);


--
-- Name: stores stores_slug_key1904; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1904 UNIQUE (slug);


--
-- Name: stores stores_slug_key1905; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1905 UNIQUE (slug);


--
-- Name: stores stores_slug_key1906; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1906 UNIQUE (slug);


--
-- Name: stores stores_slug_key1907; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1907 UNIQUE (slug);


--
-- Name: stores stores_slug_key1908; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1908 UNIQUE (slug);


--
-- Name: stores stores_slug_key1909; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1909 UNIQUE (slug);


--
-- Name: stores stores_slug_key191; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key191 UNIQUE (slug);


--
-- Name: stores stores_slug_key1910; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1910 UNIQUE (slug);


--
-- Name: stores stores_slug_key1911; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1911 UNIQUE (slug);


--
-- Name: stores stores_slug_key1912; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1912 UNIQUE (slug);


--
-- Name: stores stores_slug_key1913; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1913 UNIQUE (slug);


--
-- Name: stores stores_slug_key1914; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1914 UNIQUE (slug);


--
-- Name: stores stores_slug_key1915; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1915 UNIQUE (slug);


--
-- Name: stores stores_slug_key1916; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1916 UNIQUE (slug);


--
-- Name: stores stores_slug_key1917; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1917 UNIQUE (slug);


--
-- Name: stores stores_slug_key1918; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1918 UNIQUE (slug);


--
-- Name: stores stores_slug_key1919; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1919 UNIQUE (slug);


--
-- Name: stores stores_slug_key192; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key192 UNIQUE (slug);


--
-- Name: stores stores_slug_key1920; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1920 UNIQUE (slug);


--
-- Name: stores stores_slug_key1921; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1921 UNIQUE (slug);


--
-- Name: stores stores_slug_key1922; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1922 UNIQUE (slug);


--
-- Name: stores stores_slug_key1923; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1923 UNIQUE (slug);


--
-- Name: stores stores_slug_key1924; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1924 UNIQUE (slug);


--
-- Name: stores stores_slug_key1925; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1925 UNIQUE (slug);


--
-- Name: stores stores_slug_key1926; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1926 UNIQUE (slug);


--
-- Name: stores stores_slug_key1927; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1927 UNIQUE (slug);


--
-- Name: stores stores_slug_key1928; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1928 UNIQUE (slug);


--
-- Name: stores stores_slug_key1929; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1929 UNIQUE (slug);


--
-- Name: stores stores_slug_key193; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key193 UNIQUE (slug);


--
-- Name: stores stores_slug_key1930; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1930 UNIQUE (slug);


--
-- Name: stores stores_slug_key1931; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1931 UNIQUE (slug);


--
-- Name: stores stores_slug_key1932; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1932 UNIQUE (slug);


--
-- Name: stores stores_slug_key1933; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1933 UNIQUE (slug);


--
-- Name: stores stores_slug_key1934; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1934 UNIQUE (slug);


--
-- Name: stores stores_slug_key1935; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1935 UNIQUE (slug);


--
-- Name: stores stores_slug_key1936; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1936 UNIQUE (slug);


--
-- Name: stores stores_slug_key1937; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1937 UNIQUE (slug);


--
-- Name: stores stores_slug_key1938; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1938 UNIQUE (slug);


--
-- Name: stores stores_slug_key1939; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1939 UNIQUE (slug);


--
-- Name: stores stores_slug_key194; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key194 UNIQUE (slug);


--
-- Name: stores stores_slug_key1940; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1940 UNIQUE (slug);


--
-- Name: stores stores_slug_key1941; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1941 UNIQUE (slug);


--
-- Name: stores stores_slug_key1942; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1942 UNIQUE (slug);


--
-- Name: stores stores_slug_key1943; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1943 UNIQUE (slug);


--
-- Name: stores stores_slug_key1944; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1944 UNIQUE (slug);


--
-- Name: stores stores_slug_key1945; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1945 UNIQUE (slug);


--
-- Name: stores stores_slug_key1946; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1946 UNIQUE (slug);


--
-- Name: stores stores_slug_key1947; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1947 UNIQUE (slug);


--
-- Name: stores stores_slug_key1948; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1948 UNIQUE (slug);


--
-- Name: stores stores_slug_key1949; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1949 UNIQUE (slug);


--
-- Name: stores stores_slug_key195; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key195 UNIQUE (slug);


--
-- Name: stores stores_slug_key1950; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1950 UNIQUE (slug);


--
-- Name: stores stores_slug_key1951; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1951 UNIQUE (slug);


--
-- Name: stores stores_slug_key1952; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1952 UNIQUE (slug);


--
-- Name: stores stores_slug_key1953; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1953 UNIQUE (slug);


--
-- Name: stores stores_slug_key1954; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1954 UNIQUE (slug);


--
-- Name: stores stores_slug_key1955; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1955 UNIQUE (slug);


--
-- Name: stores stores_slug_key1956; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1956 UNIQUE (slug);


--
-- Name: stores stores_slug_key1957; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1957 UNIQUE (slug);


--
-- Name: stores stores_slug_key1958; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1958 UNIQUE (slug);


--
-- Name: stores stores_slug_key1959; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1959 UNIQUE (slug);


--
-- Name: stores stores_slug_key196; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key196 UNIQUE (slug);


--
-- Name: stores stores_slug_key1960; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1960 UNIQUE (slug);


--
-- Name: stores stores_slug_key1961; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1961 UNIQUE (slug);


--
-- Name: stores stores_slug_key1962; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1962 UNIQUE (slug);


--
-- Name: stores stores_slug_key1963; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1963 UNIQUE (slug);


--
-- Name: stores stores_slug_key1964; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1964 UNIQUE (slug);


--
-- Name: stores stores_slug_key1965; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1965 UNIQUE (slug);


--
-- Name: stores stores_slug_key1966; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1966 UNIQUE (slug);


--
-- Name: stores stores_slug_key1967; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1967 UNIQUE (slug);


--
-- Name: stores stores_slug_key1968; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1968 UNIQUE (slug);


--
-- Name: stores stores_slug_key1969; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1969 UNIQUE (slug);


--
-- Name: stores stores_slug_key197; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key197 UNIQUE (slug);


--
-- Name: stores stores_slug_key1970; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1970 UNIQUE (slug);


--
-- Name: stores stores_slug_key1971; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1971 UNIQUE (slug);


--
-- Name: stores stores_slug_key1972; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1972 UNIQUE (slug);


--
-- Name: stores stores_slug_key1973; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1973 UNIQUE (slug);


--
-- Name: stores stores_slug_key1974; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1974 UNIQUE (slug);


--
-- Name: stores stores_slug_key1975; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1975 UNIQUE (slug);


--
-- Name: stores stores_slug_key1976; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1976 UNIQUE (slug);


--
-- Name: stores stores_slug_key1977; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1977 UNIQUE (slug);


--
-- Name: stores stores_slug_key1978; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1978 UNIQUE (slug);


--
-- Name: stores stores_slug_key1979; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1979 UNIQUE (slug);


--
-- Name: stores stores_slug_key198; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key198 UNIQUE (slug);


--
-- Name: stores stores_slug_key1980; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1980 UNIQUE (slug);


--
-- Name: stores stores_slug_key1981; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1981 UNIQUE (slug);


--
-- Name: stores stores_slug_key1982; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1982 UNIQUE (slug);


--
-- Name: stores stores_slug_key1983; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1983 UNIQUE (slug);


--
-- Name: stores stores_slug_key1984; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1984 UNIQUE (slug);


--
-- Name: stores stores_slug_key1985; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1985 UNIQUE (slug);


--
-- Name: stores stores_slug_key1986; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1986 UNIQUE (slug);


--
-- Name: stores stores_slug_key1987; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1987 UNIQUE (slug);


--
-- Name: stores stores_slug_key1988; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1988 UNIQUE (slug);


--
-- Name: stores stores_slug_key1989; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1989 UNIQUE (slug);


--
-- Name: stores stores_slug_key199; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key199 UNIQUE (slug);


--
-- Name: stores stores_slug_key1990; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1990 UNIQUE (slug);


--
-- Name: stores stores_slug_key1991; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1991 UNIQUE (slug);


--
-- Name: stores stores_slug_key1992; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1992 UNIQUE (slug);


--
-- Name: stores stores_slug_key1993; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1993 UNIQUE (slug);


--
-- Name: stores stores_slug_key1994; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1994 UNIQUE (slug);


--
-- Name: stores stores_slug_key1995; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1995 UNIQUE (slug);


--
-- Name: stores stores_slug_key1996; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1996 UNIQUE (slug);


--
-- Name: stores stores_slug_key1997; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1997 UNIQUE (slug);


--
-- Name: stores stores_slug_key1998; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1998 UNIQUE (slug);


--
-- Name: stores stores_slug_key1999; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key1999 UNIQUE (slug);


--
-- Name: stores stores_slug_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2 UNIQUE (slug);


--
-- Name: stores stores_slug_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key20 UNIQUE (slug);


--
-- Name: stores stores_slug_key200; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key200 UNIQUE (slug);


--
-- Name: stores stores_slug_key2000; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2000 UNIQUE (slug);


--
-- Name: stores stores_slug_key2001; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2001 UNIQUE (slug);


--
-- Name: stores stores_slug_key2002; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2002 UNIQUE (slug);


--
-- Name: stores stores_slug_key2003; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2003 UNIQUE (slug);


--
-- Name: stores stores_slug_key2004; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2004 UNIQUE (slug);


--
-- Name: stores stores_slug_key2005; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2005 UNIQUE (slug);


--
-- Name: stores stores_slug_key2006; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2006 UNIQUE (slug);


--
-- Name: stores stores_slug_key2007; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2007 UNIQUE (slug);


--
-- Name: stores stores_slug_key2008; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2008 UNIQUE (slug);


--
-- Name: stores stores_slug_key2009; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2009 UNIQUE (slug);


--
-- Name: stores stores_slug_key201; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key201 UNIQUE (slug);


--
-- Name: stores stores_slug_key2010; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2010 UNIQUE (slug);


--
-- Name: stores stores_slug_key2011; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2011 UNIQUE (slug);


--
-- Name: stores stores_slug_key2012; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2012 UNIQUE (slug);


--
-- Name: stores stores_slug_key2013; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2013 UNIQUE (slug);


--
-- Name: stores stores_slug_key2014; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2014 UNIQUE (slug);


--
-- Name: stores stores_slug_key2015; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2015 UNIQUE (slug);


--
-- Name: stores stores_slug_key2016; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2016 UNIQUE (slug);


--
-- Name: stores stores_slug_key2017; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2017 UNIQUE (slug);


--
-- Name: stores stores_slug_key2018; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2018 UNIQUE (slug);


--
-- Name: stores stores_slug_key2019; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2019 UNIQUE (slug);


--
-- Name: stores stores_slug_key202; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key202 UNIQUE (slug);


--
-- Name: stores stores_slug_key2020; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2020 UNIQUE (slug);


--
-- Name: stores stores_slug_key2021; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2021 UNIQUE (slug);


--
-- Name: stores stores_slug_key2022; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2022 UNIQUE (slug);


--
-- Name: stores stores_slug_key2023; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2023 UNIQUE (slug);


--
-- Name: stores stores_slug_key2024; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2024 UNIQUE (slug);


--
-- Name: stores stores_slug_key2025; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2025 UNIQUE (slug);


--
-- Name: stores stores_slug_key2026; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2026 UNIQUE (slug);


--
-- Name: stores stores_slug_key2027; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2027 UNIQUE (slug);


--
-- Name: stores stores_slug_key2028; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2028 UNIQUE (slug);


--
-- Name: stores stores_slug_key2029; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2029 UNIQUE (slug);


--
-- Name: stores stores_slug_key203; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key203 UNIQUE (slug);


--
-- Name: stores stores_slug_key2030; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2030 UNIQUE (slug);


--
-- Name: stores stores_slug_key2031; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2031 UNIQUE (slug);


--
-- Name: stores stores_slug_key2032; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2032 UNIQUE (slug);


--
-- Name: stores stores_slug_key2033; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2033 UNIQUE (slug);


--
-- Name: stores stores_slug_key2034; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2034 UNIQUE (slug);


--
-- Name: stores stores_slug_key2035; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2035 UNIQUE (slug);


--
-- Name: stores stores_slug_key2036; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2036 UNIQUE (slug);


--
-- Name: stores stores_slug_key2037; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2037 UNIQUE (slug);


--
-- Name: stores stores_slug_key2038; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2038 UNIQUE (slug);


--
-- Name: stores stores_slug_key2039; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2039 UNIQUE (slug);


--
-- Name: stores stores_slug_key204; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key204 UNIQUE (slug);


--
-- Name: stores stores_slug_key2040; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2040 UNIQUE (slug);


--
-- Name: stores stores_slug_key2041; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2041 UNIQUE (slug);


--
-- Name: stores stores_slug_key2042; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2042 UNIQUE (slug);


--
-- Name: stores stores_slug_key2043; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2043 UNIQUE (slug);


--
-- Name: stores stores_slug_key2044; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2044 UNIQUE (slug);


--
-- Name: stores stores_slug_key2045; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2045 UNIQUE (slug);


--
-- Name: stores stores_slug_key2046; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2046 UNIQUE (slug);


--
-- Name: stores stores_slug_key2047; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2047 UNIQUE (slug);


--
-- Name: stores stores_slug_key2048; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2048 UNIQUE (slug);


--
-- Name: stores stores_slug_key2049; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2049 UNIQUE (slug);


--
-- Name: stores stores_slug_key205; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key205 UNIQUE (slug);


--
-- Name: stores stores_slug_key2050; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2050 UNIQUE (slug);


--
-- Name: stores stores_slug_key2051; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2051 UNIQUE (slug);


--
-- Name: stores stores_slug_key2052; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2052 UNIQUE (slug);


--
-- Name: stores stores_slug_key2053; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2053 UNIQUE (slug);


--
-- Name: stores stores_slug_key2054; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2054 UNIQUE (slug);


--
-- Name: stores stores_slug_key2055; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2055 UNIQUE (slug);


--
-- Name: stores stores_slug_key2056; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2056 UNIQUE (slug);


--
-- Name: stores stores_slug_key2057; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2057 UNIQUE (slug);


--
-- Name: stores stores_slug_key2058; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2058 UNIQUE (slug);


--
-- Name: stores stores_slug_key2059; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2059 UNIQUE (slug);


--
-- Name: stores stores_slug_key206; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key206 UNIQUE (slug);


--
-- Name: stores stores_slug_key2060; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2060 UNIQUE (slug);


--
-- Name: stores stores_slug_key2061; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2061 UNIQUE (slug);


--
-- Name: stores stores_slug_key2062; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2062 UNIQUE (slug);


--
-- Name: stores stores_slug_key2063; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2063 UNIQUE (slug);


--
-- Name: stores stores_slug_key2064; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2064 UNIQUE (slug);


--
-- Name: stores stores_slug_key2065; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2065 UNIQUE (slug);


--
-- Name: stores stores_slug_key2066; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2066 UNIQUE (slug);


--
-- Name: stores stores_slug_key2067; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2067 UNIQUE (slug);


--
-- Name: stores stores_slug_key2068; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2068 UNIQUE (slug);


--
-- Name: stores stores_slug_key2069; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2069 UNIQUE (slug);


--
-- Name: stores stores_slug_key207; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key207 UNIQUE (slug);


--
-- Name: stores stores_slug_key2070; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2070 UNIQUE (slug);


--
-- Name: stores stores_slug_key2071; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2071 UNIQUE (slug);


--
-- Name: stores stores_slug_key2072; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2072 UNIQUE (slug);


--
-- Name: stores stores_slug_key2073; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2073 UNIQUE (slug);


--
-- Name: stores stores_slug_key2074; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2074 UNIQUE (slug);


--
-- Name: stores stores_slug_key2075; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2075 UNIQUE (slug);


--
-- Name: stores stores_slug_key2076; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2076 UNIQUE (slug);


--
-- Name: stores stores_slug_key2077; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2077 UNIQUE (slug);


--
-- Name: stores stores_slug_key2078; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2078 UNIQUE (slug);


--
-- Name: stores stores_slug_key2079; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2079 UNIQUE (slug);


--
-- Name: stores stores_slug_key208; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key208 UNIQUE (slug);


--
-- Name: stores stores_slug_key2080; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2080 UNIQUE (slug);


--
-- Name: stores stores_slug_key2081; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2081 UNIQUE (slug);


--
-- Name: stores stores_slug_key2082; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2082 UNIQUE (slug);


--
-- Name: stores stores_slug_key2083; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2083 UNIQUE (slug);


--
-- Name: stores stores_slug_key2084; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2084 UNIQUE (slug);


--
-- Name: stores stores_slug_key2085; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2085 UNIQUE (slug);


--
-- Name: stores stores_slug_key2086; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2086 UNIQUE (slug);


--
-- Name: stores stores_slug_key2087; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2087 UNIQUE (slug);


--
-- Name: stores stores_slug_key2088; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2088 UNIQUE (slug);


--
-- Name: stores stores_slug_key2089; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2089 UNIQUE (slug);


--
-- Name: stores stores_slug_key209; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key209 UNIQUE (slug);


--
-- Name: stores stores_slug_key2090; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2090 UNIQUE (slug);


--
-- Name: stores stores_slug_key2091; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2091 UNIQUE (slug);


--
-- Name: stores stores_slug_key2092; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2092 UNIQUE (slug);


--
-- Name: stores stores_slug_key2093; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2093 UNIQUE (slug);


--
-- Name: stores stores_slug_key2094; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2094 UNIQUE (slug);


--
-- Name: stores stores_slug_key2095; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2095 UNIQUE (slug);


--
-- Name: stores stores_slug_key2096; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2096 UNIQUE (slug);


--
-- Name: stores stores_slug_key2097; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2097 UNIQUE (slug);


--
-- Name: stores stores_slug_key2098; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2098 UNIQUE (slug);


--
-- Name: stores stores_slug_key2099; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2099 UNIQUE (slug);


--
-- Name: stores stores_slug_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key21 UNIQUE (slug);


--
-- Name: stores stores_slug_key210; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key210 UNIQUE (slug);


--
-- Name: stores stores_slug_key2100; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2100 UNIQUE (slug);


--
-- Name: stores stores_slug_key2101; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2101 UNIQUE (slug);


--
-- Name: stores stores_slug_key2102; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2102 UNIQUE (slug);


--
-- Name: stores stores_slug_key2103; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2103 UNIQUE (slug);


--
-- Name: stores stores_slug_key2104; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2104 UNIQUE (slug);


--
-- Name: stores stores_slug_key2105; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2105 UNIQUE (slug);


--
-- Name: stores stores_slug_key2106; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2106 UNIQUE (slug);


--
-- Name: stores stores_slug_key2107; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2107 UNIQUE (slug);


--
-- Name: stores stores_slug_key2108; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2108 UNIQUE (slug);


--
-- Name: stores stores_slug_key2109; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2109 UNIQUE (slug);


--
-- Name: stores stores_slug_key211; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key211 UNIQUE (slug);


--
-- Name: stores stores_slug_key2110; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2110 UNIQUE (slug);


--
-- Name: stores stores_slug_key2111; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2111 UNIQUE (slug);


--
-- Name: stores stores_slug_key2112; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2112 UNIQUE (slug);


--
-- Name: stores stores_slug_key2113; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2113 UNIQUE (slug);


--
-- Name: stores stores_slug_key2114; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2114 UNIQUE (slug);


--
-- Name: stores stores_slug_key2115; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2115 UNIQUE (slug);


--
-- Name: stores stores_slug_key2116; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2116 UNIQUE (slug);


--
-- Name: stores stores_slug_key2117; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2117 UNIQUE (slug);


--
-- Name: stores stores_slug_key2118; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2118 UNIQUE (slug);


--
-- Name: stores stores_slug_key2119; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2119 UNIQUE (slug);


--
-- Name: stores stores_slug_key212; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key212 UNIQUE (slug);


--
-- Name: stores stores_slug_key2120; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2120 UNIQUE (slug);


--
-- Name: stores stores_slug_key2121; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2121 UNIQUE (slug);


--
-- Name: stores stores_slug_key2122; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2122 UNIQUE (slug);


--
-- Name: stores stores_slug_key2123; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2123 UNIQUE (slug);


--
-- Name: stores stores_slug_key2124; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2124 UNIQUE (slug);


--
-- Name: stores stores_slug_key2125; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2125 UNIQUE (slug);


--
-- Name: stores stores_slug_key2126; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2126 UNIQUE (slug);


--
-- Name: stores stores_slug_key2127; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2127 UNIQUE (slug);


--
-- Name: stores stores_slug_key2128; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2128 UNIQUE (slug);


--
-- Name: stores stores_slug_key2129; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2129 UNIQUE (slug);


--
-- Name: stores stores_slug_key213; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key213 UNIQUE (slug);


--
-- Name: stores stores_slug_key2130; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2130 UNIQUE (slug);


--
-- Name: stores stores_slug_key2131; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2131 UNIQUE (slug);


--
-- Name: stores stores_slug_key2132; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2132 UNIQUE (slug);


--
-- Name: stores stores_slug_key2133; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2133 UNIQUE (slug);


--
-- Name: stores stores_slug_key2134; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2134 UNIQUE (slug);


--
-- Name: stores stores_slug_key2135; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2135 UNIQUE (slug);


--
-- Name: stores stores_slug_key2136; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2136 UNIQUE (slug);


--
-- Name: stores stores_slug_key2137; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2137 UNIQUE (slug);


--
-- Name: stores stores_slug_key2138; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2138 UNIQUE (slug);


--
-- Name: stores stores_slug_key2139; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2139 UNIQUE (slug);


--
-- Name: stores stores_slug_key214; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key214 UNIQUE (slug);


--
-- Name: stores stores_slug_key2140; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2140 UNIQUE (slug);


--
-- Name: stores stores_slug_key2141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2141 UNIQUE (slug);


--
-- Name: stores stores_slug_key2142; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2142 UNIQUE (slug);


--
-- Name: stores stores_slug_key2143; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2143 UNIQUE (slug);


--
-- Name: stores stores_slug_key2144; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2144 UNIQUE (slug);


--
-- Name: stores stores_slug_key2145; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2145 UNIQUE (slug);


--
-- Name: stores stores_slug_key2146; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2146 UNIQUE (slug);


--
-- Name: stores stores_slug_key2147; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2147 UNIQUE (slug);


--
-- Name: stores stores_slug_key2148; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2148 UNIQUE (slug);


--
-- Name: stores stores_slug_key2149; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2149 UNIQUE (slug);


--
-- Name: stores stores_slug_key215; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key215 UNIQUE (slug);


--
-- Name: stores stores_slug_key2150; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2150 UNIQUE (slug);


--
-- Name: stores stores_slug_key2151; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2151 UNIQUE (slug);


--
-- Name: stores stores_slug_key2152; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2152 UNIQUE (slug);


--
-- Name: stores stores_slug_key2153; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2153 UNIQUE (slug);


--
-- Name: stores stores_slug_key2154; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2154 UNIQUE (slug);


--
-- Name: stores stores_slug_key2155; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2155 UNIQUE (slug);


--
-- Name: stores stores_slug_key2156; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2156 UNIQUE (slug);


--
-- Name: stores stores_slug_key2157; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2157 UNIQUE (slug);


--
-- Name: stores stores_slug_key2158; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2158 UNIQUE (slug);


--
-- Name: stores stores_slug_key2159; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2159 UNIQUE (slug);


--
-- Name: stores stores_slug_key216; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key216 UNIQUE (slug);


--
-- Name: stores stores_slug_key2160; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2160 UNIQUE (slug);


--
-- Name: stores stores_slug_key2161; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2161 UNIQUE (slug);


--
-- Name: stores stores_slug_key2162; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2162 UNIQUE (slug);


--
-- Name: stores stores_slug_key2163; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2163 UNIQUE (slug);


--
-- Name: stores stores_slug_key2164; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2164 UNIQUE (slug);


--
-- Name: stores stores_slug_key2165; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2165 UNIQUE (slug);


--
-- Name: stores stores_slug_key2166; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2166 UNIQUE (slug);


--
-- Name: stores stores_slug_key2167; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2167 UNIQUE (slug);


--
-- Name: stores stores_slug_key2168; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2168 UNIQUE (slug);


--
-- Name: stores stores_slug_key2169; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2169 UNIQUE (slug);


--
-- Name: stores stores_slug_key217; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key217 UNIQUE (slug);


--
-- Name: stores stores_slug_key2170; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2170 UNIQUE (slug);


--
-- Name: stores stores_slug_key2171; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2171 UNIQUE (slug);


--
-- Name: stores stores_slug_key2172; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2172 UNIQUE (slug);


--
-- Name: stores stores_slug_key2173; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2173 UNIQUE (slug);


--
-- Name: stores stores_slug_key2174; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2174 UNIQUE (slug);


--
-- Name: stores stores_slug_key2175; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2175 UNIQUE (slug);


--
-- Name: stores stores_slug_key2176; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2176 UNIQUE (slug);


--
-- Name: stores stores_slug_key2177; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2177 UNIQUE (slug);


--
-- Name: stores stores_slug_key2178; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2178 UNIQUE (slug);


--
-- Name: stores stores_slug_key2179; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2179 UNIQUE (slug);


--
-- Name: stores stores_slug_key218; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key218 UNIQUE (slug);


--
-- Name: stores stores_slug_key2180; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2180 UNIQUE (slug);


--
-- Name: stores stores_slug_key2181; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2181 UNIQUE (slug);


--
-- Name: stores stores_slug_key2182; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2182 UNIQUE (slug);


--
-- Name: stores stores_slug_key2183; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2183 UNIQUE (slug);


--
-- Name: stores stores_slug_key2184; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2184 UNIQUE (slug);


--
-- Name: stores stores_slug_key2185; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2185 UNIQUE (slug);


--
-- Name: stores stores_slug_key2186; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2186 UNIQUE (slug);


--
-- Name: stores stores_slug_key2187; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2187 UNIQUE (slug);


--
-- Name: stores stores_slug_key2188; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2188 UNIQUE (slug);


--
-- Name: stores stores_slug_key2189; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2189 UNIQUE (slug);


--
-- Name: stores stores_slug_key219; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key219 UNIQUE (slug);


--
-- Name: stores stores_slug_key2190; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2190 UNIQUE (slug);


--
-- Name: stores stores_slug_key2191; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2191 UNIQUE (slug);


--
-- Name: stores stores_slug_key2192; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2192 UNIQUE (slug);


--
-- Name: stores stores_slug_key2193; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2193 UNIQUE (slug);


--
-- Name: stores stores_slug_key2194; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2194 UNIQUE (slug);


--
-- Name: stores stores_slug_key2195; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2195 UNIQUE (slug);


--
-- Name: stores stores_slug_key2196; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2196 UNIQUE (slug);


--
-- Name: stores stores_slug_key2197; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2197 UNIQUE (slug);


--
-- Name: stores stores_slug_key2198; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2198 UNIQUE (slug);


--
-- Name: stores stores_slug_key2199; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2199 UNIQUE (slug);


--
-- Name: stores stores_slug_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key22 UNIQUE (slug);


--
-- Name: stores stores_slug_key220; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key220 UNIQUE (slug);


--
-- Name: stores stores_slug_key2200; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2200 UNIQUE (slug);


--
-- Name: stores stores_slug_key2201; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2201 UNIQUE (slug);


--
-- Name: stores stores_slug_key2202; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2202 UNIQUE (slug);


--
-- Name: stores stores_slug_key2203; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2203 UNIQUE (slug);


--
-- Name: stores stores_slug_key2204; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2204 UNIQUE (slug);


--
-- Name: stores stores_slug_key2205; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2205 UNIQUE (slug);


--
-- Name: stores stores_slug_key2206; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2206 UNIQUE (slug);


--
-- Name: stores stores_slug_key2207; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2207 UNIQUE (slug);


--
-- Name: stores stores_slug_key2208; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2208 UNIQUE (slug);


--
-- Name: stores stores_slug_key2209; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2209 UNIQUE (slug);


--
-- Name: stores stores_slug_key221; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key221 UNIQUE (slug);


--
-- Name: stores stores_slug_key2210; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2210 UNIQUE (slug);


--
-- Name: stores stores_slug_key2211; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2211 UNIQUE (slug);


--
-- Name: stores stores_slug_key2212; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2212 UNIQUE (slug);


--
-- Name: stores stores_slug_key2213; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2213 UNIQUE (slug);


--
-- Name: stores stores_slug_key2214; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2214 UNIQUE (slug);


--
-- Name: stores stores_slug_key2215; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2215 UNIQUE (slug);


--
-- Name: stores stores_slug_key2216; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2216 UNIQUE (slug);


--
-- Name: stores stores_slug_key2217; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2217 UNIQUE (slug);


--
-- Name: stores stores_slug_key2218; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2218 UNIQUE (slug);


--
-- Name: stores stores_slug_key2219; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2219 UNIQUE (slug);


--
-- Name: stores stores_slug_key222; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key222 UNIQUE (slug);


--
-- Name: stores stores_slug_key2220; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2220 UNIQUE (slug);


--
-- Name: stores stores_slug_key2221; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2221 UNIQUE (slug);


--
-- Name: stores stores_slug_key2222; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2222 UNIQUE (slug);


--
-- Name: stores stores_slug_key2223; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2223 UNIQUE (slug);


--
-- Name: stores stores_slug_key2224; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2224 UNIQUE (slug);


--
-- Name: stores stores_slug_key2225; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2225 UNIQUE (slug);


--
-- Name: stores stores_slug_key2226; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2226 UNIQUE (slug);


--
-- Name: stores stores_slug_key2227; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2227 UNIQUE (slug);


--
-- Name: stores stores_slug_key2228; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2228 UNIQUE (slug);


--
-- Name: stores stores_slug_key2229; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2229 UNIQUE (slug);


--
-- Name: stores stores_slug_key223; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key223 UNIQUE (slug);


--
-- Name: stores stores_slug_key2230; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2230 UNIQUE (slug);


--
-- Name: stores stores_slug_key2231; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2231 UNIQUE (slug);


--
-- Name: stores stores_slug_key2232; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2232 UNIQUE (slug);


--
-- Name: stores stores_slug_key2233; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2233 UNIQUE (slug);


--
-- Name: stores stores_slug_key2234; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2234 UNIQUE (slug);


--
-- Name: stores stores_slug_key2235; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2235 UNIQUE (slug);


--
-- Name: stores stores_slug_key2236; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2236 UNIQUE (slug);


--
-- Name: stores stores_slug_key2237; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2237 UNIQUE (slug);


--
-- Name: stores stores_slug_key2238; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2238 UNIQUE (slug);


--
-- Name: stores stores_slug_key2239; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2239 UNIQUE (slug);


--
-- Name: stores stores_slug_key224; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key224 UNIQUE (slug);


--
-- Name: stores stores_slug_key2240; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2240 UNIQUE (slug);


--
-- Name: stores stores_slug_key2241; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2241 UNIQUE (slug);


--
-- Name: stores stores_slug_key2242; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2242 UNIQUE (slug);


--
-- Name: stores stores_slug_key2243; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2243 UNIQUE (slug);


--
-- Name: stores stores_slug_key2244; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2244 UNIQUE (slug);


--
-- Name: stores stores_slug_key2245; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2245 UNIQUE (slug);


--
-- Name: stores stores_slug_key2246; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2246 UNIQUE (slug);


--
-- Name: stores stores_slug_key2247; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2247 UNIQUE (slug);


--
-- Name: stores stores_slug_key2248; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2248 UNIQUE (slug);


--
-- Name: stores stores_slug_key2249; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2249 UNIQUE (slug);


--
-- Name: stores stores_slug_key225; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key225 UNIQUE (slug);


--
-- Name: stores stores_slug_key2250; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2250 UNIQUE (slug);


--
-- Name: stores stores_slug_key2251; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2251 UNIQUE (slug);


--
-- Name: stores stores_slug_key2252; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2252 UNIQUE (slug);


--
-- Name: stores stores_slug_key2253; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2253 UNIQUE (slug);


--
-- Name: stores stores_slug_key2254; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2254 UNIQUE (slug);


--
-- Name: stores stores_slug_key2255; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2255 UNIQUE (slug);


--
-- Name: stores stores_slug_key2256; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2256 UNIQUE (slug);


--
-- Name: stores stores_slug_key2257; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2257 UNIQUE (slug);


--
-- Name: stores stores_slug_key2258; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2258 UNIQUE (slug);


--
-- Name: stores stores_slug_key2259; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2259 UNIQUE (slug);


--
-- Name: stores stores_slug_key226; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key226 UNIQUE (slug);


--
-- Name: stores stores_slug_key2260; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2260 UNIQUE (slug);


--
-- Name: stores stores_slug_key2261; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2261 UNIQUE (slug);


--
-- Name: stores stores_slug_key2262; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2262 UNIQUE (slug);


--
-- Name: stores stores_slug_key2263; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2263 UNIQUE (slug);


--
-- Name: stores stores_slug_key2264; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2264 UNIQUE (slug);


--
-- Name: stores stores_slug_key2265; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2265 UNIQUE (slug);


--
-- Name: stores stores_slug_key2266; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2266 UNIQUE (slug);


--
-- Name: stores stores_slug_key2267; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2267 UNIQUE (slug);


--
-- Name: stores stores_slug_key2268; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2268 UNIQUE (slug);


--
-- Name: stores stores_slug_key2269; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2269 UNIQUE (slug);


--
-- Name: stores stores_slug_key227; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key227 UNIQUE (slug);


--
-- Name: stores stores_slug_key2270; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2270 UNIQUE (slug);


--
-- Name: stores stores_slug_key2271; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2271 UNIQUE (slug);


--
-- Name: stores stores_slug_key2272; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2272 UNIQUE (slug);


--
-- Name: stores stores_slug_key2273; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2273 UNIQUE (slug);


--
-- Name: stores stores_slug_key2274; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2274 UNIQUE (slug);


--
-- Name: stores stores_slug_key2275; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2275 UNIQUE (slug);


--
-- Name: stores stores_slug_key2276; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2276 UNIQUE (slug);


--
-- Name: stores stores_slug_key2277; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2277 UNIQUE (slug);


--
-- Name: stores stores_slug_key2278; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2278 UNIQUE (slug);


--
-- Name: stores stores_slug_key2279; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2279 UNIQUE (slug);


--
-- Name: stores stores_slug_key228; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key228 UNIQUE (slug);


--
-- Name: stores stores_slug_key2280; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2280 UNIQUE (slug);


--
-- Name: stores stores_slug_key2281; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2281 UNIQUE (slug);


--
-- Name: stores stores_slug_key2282; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2282 UNIQUE (slug);


--
-- Name: stores stores_slug_key2283; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2283 UNIQUE (slug);


--
-- Name: stores stores_slug_key2284; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2284 UNIQUE (slug);


--
-- Name: stores stores_slug_key2285; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2285 UNIQUE (slug);


--
-- Name: stores stores_slug_key2286; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2286 UNIQUE (slug);


--
-- Name: stores stores_slug_key2287; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2287 UNIQUE (slug);


--
-- Name: stores stores_slug_key2288; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2288 UNIQUE (slug);


--
-- Name: stores stores_slug_key2289; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2289 UNIQUE (slug);


--
-- Name: stores stores_slug_key229; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key229 UNIQUE (slug);


--
-- Name: stores stores_slug_key2290; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2290 UNIQUE (slug);


--
-- Name: stores stores_slug_key2291; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2291 UNIQUE (slug);


--
-- Name: stores stores_slug_key2292; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2292 UNIQUE (slug);


--
-- Name: stores stores_slug_key2293; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2293 UNIQUE (slug);


--
-- Name: stores stores_slug_key2294; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2294 UNIQUE (slug);


--
-- Name: stores stores_slug_key2295; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2295 UNIQUE (slug);


--
-- Name: stores stores_slug_key2296; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2296 UNIQUE (slug);


--
-- Name: stores stores_slug_key2297; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2297 UNIQUE (slug);


--
-- Name: stores stores_slug_key2298; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2298 UNIQUE (slug);


--
-- Name: stores stores_slug_key2299; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2299 UNIQUE (slug);


--
-- Name: stores stores_slug_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key23 UNIQUE (slug);


--
-- Name: stores stores_slug_key230; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key230 UNIQUE (slug);


--
-- Name: stores stores_slug_key2300; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2300 UNIQUE (slug);


--
-- Name: stores stores_slug_key2301; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2301 UNIQUE (slug);


--
-- Name: stores stores_slug_key2302; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2302 UNIQUE (slug);


--
-- Name: stores stores_slug_key2303; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2303 UNIQUE (slug);


--
-- Name: stores stores_slug_key2304; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2304 UNIQUE (slug);


--
-- Name: stores stores_slug_key2305; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2305 UNIQUE (slug);


--
-- Name: stores stores_slug_key2306; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2306 UNIQUE (slug);


--
-- Name: stores stores_slug_key2307; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2307 UNIQUE (slug);


--
-- Name: stores stores_slug_key2308; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2308 UNIQUE (slug);


--
-- Name: stores stores_slug_key2309; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2309 UNIQUE (slug);


--
-- Name: stores stores_slug_key231; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key231 UNIQUE (slug);


--
-- Name: stores stores_slug_key2310; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2310 UNIQUE (slug);


--
-- Name: stores stores_slug_key2311; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2311 UNIQUE (slug);


--
-- Name: stores stores_slug_key2312; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2312 UNIQUE (slug);


--
-- Name: stores stores_slug_key2313; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2313 UNIQUE (slug);


--
-- Name: stores stores_slug_key2314; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2314 UNIQUE (slug);


--
-- Name: stores stores_slug_key2315; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2315 UNIQUE (slug);


--
-- Name: stores stores_slug_key2316; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2316 UNIQUE (slug);


--
-- Name: stores stores_slug_key2317; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2317 UNIQUE (slug);


--
-- Name: stores stores_slug_key2318; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2318 UNIQUE (slug);


--
-- Name: stores stores_slug_key2319; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2319 UNIQUE (slug);


--
-- Name: stores stores_slug_key232; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key232 UNIQUE (slug);


--
-- Name: stores stores_slug_key2320; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2320 UNIQUE (slug);


--
-- Name: stores stores_slug_key2321; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2321 UNIQUE (slug);


--
-- Name: stores stores_slug_key2322; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2322 UNIQUE (slug);


--
-- Name: stores stores_slug_key2323; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2323 UNIQUE (slug);


--
-- Name: stores stores_slug_key2324; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2324 UNIQUE (slug);


--
-- Name: stores stores_slug_key2325; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2325 UNIQUE (slug);


--
-- Name: stores stores_slug_key2326; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2326 UNIQUE (slug);


--
-- Name: stores stores_slug_key2327; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2327 UNIQUE (slug);


--
-- Name: stores stores_slug_key2328; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2328 UNIQUE (slug);


--
-- Name: stores stores_slug_key2329; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2329 UNIQUE (slug);


--
-- Name: stores stores_slug_key233; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key233 UNIQUE (slug);


--
-- Name: stores stores_slug_key2330; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2330 UNIQUE (slug);


--
-- Name: stores stores_slug_key2331; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2331 UNIQUE (slug);


--
-- Name: stores stores_slug_key2332; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2332 UNIQUE (slug);


--
-- Name: stores stores_slug_key2333; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2333 UNIQUE (slug);


--
-- Name: stores stores_slug_key2334; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2334 UNIQUE (slug);


--
-- Name: stores stores_slug_key2335; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2335 UNIQUE (slug);


--
-- Name: stores stores_slug_key2336; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2336 UNIQUE (slug);


--
-- Name: stores stores_slug_key2337; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2337 UNIQUE (slug);


--
-- Name: stores stores_slug_key2338; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2338 UNIQUE (slug);


--
-- Name: stores stores_slug_key2339; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2339 UNIQUE (slug);


--
-- Name: stores stores_slug_key234; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key234 UNIQUE (slug);


--
-- Name: stores stores_slug_key2340; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2340 UNIQUE (slug);


--
-- Name: stores stores_slug_key2341; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2341 UNIQUE (slug);


--
-- Name: stores stores_slug_key2342; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2342 UNIQUE (slug);


--
-- Name: stores stores_slug_key2343; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2343 UNIQUE (slug);


--
-- Name: stores stores_slug_key2344; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2344 UNIQUE (slug);


--
-- Name: stores stores_slug_key2345; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2345 UNIQUE (slug);


--
-- Name: stores stores_slug_key2346; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2346 UNIQUE (slug);


--
-- Name: stores stores_slug_key2347; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2347 UNIQUE (slug);


--
-- Name: stores stores_slug_key2348; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2348 UNIQUE (slug);


--
-- Name: stores stores_slug_key2349; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2349 UNIQUE (slug);


--
-- Name: stores stores_slug_key235; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key235 UNIQUE (slug);


--
-- Name: stores stores_slug_key2350; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2350 UNIQUE (slug);


--
-- Name: stores stores_slug_key2351; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2351 UNIQUE (slug);


--
-- Name: stores stores_slug_key2352; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2352 UNIQUE (slug);


--
-- Name: stores stores_slug_key2353; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2353 UNIQUE (slug);


--
-- Name: stores stores_slug_key2354; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2354 UNIQUE (slug);


--
-- Name: stores stores_slug_key2355; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2355 UNIQUE (slug);


--
-- Name: stores stores_slug_key2356; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2356 UNIQUE (slug);


--
-- Name: stores stores_slug_key2357; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2357 UNIQUE (slug);


--
-- Name: stores stores_slug_key2358; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2358 UNIQUE (slug);


--
-- Name: stores stores_slug_key2359; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2359 UNIQUE (slug);


--
-- Name: stores stores_slug_key236; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key236 UNIQUE (slug);


--
-- Name: stores stores_slug_key2360; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2360 UNIQUE (slug);


--
-- Name: stores stores_slug_key2361; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2361 UNIQUE (slug);


--
-- Name: stores stores_slug_key2362; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2362 UNIQUE (slug);


--
-- Name: stores stores_slug_key2363; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2363 UNIQUE (slug);


--
-- Name: stores stores_slug_key2364; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2364 UNIQUE (slug);


--
-- Name: stores stores_slug_key2365; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2365 UNIQUE (slug);


--
-- Name: stores stores_slug_key2366; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2366 UNIQUE (slug);


--
-- Name: stores stores_slug_key2367; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2367 UNIQUE (slug);


--
-- Name: stores stores_slug_key2368; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2368 UNIQUE (slug);


--
-- Name: stores stores_slug_key2369; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2369 UNIQUE (slug);


--
-- Name: stores stores_slug_key237; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key237 UNIQUE (slug);


--
-- Name: stores stores_slug_key2370; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2370 UNIQUE (slug);


--
-- Name: stores stores_slug_key2371; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2371 UNIQUE (slug);


--
-- Name: stores stores_slug_key2372; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2372 UNIQUE (slug);


--
-- Name: stores stores_slug_key2373; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2373 UNIQUE (slug);


--
-- Name: stores stores_slug_key2374; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2374 UNIQUE (slug);


--
-- Name: stores stores_slug_key2375; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2375 UNIQUE (slug);


--
-- Name: stores stores_slug_key2376; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2376 UNIQUE (slug);


--
-- Name: stores stores_slug_key2377; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2377 UNIQUE (slug);


--
-- Name: stores stores_slug_key2378; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2378 UNIQUE (slug);


--
-- Name: stores stores_slug_key2379; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2379 UNIQUE (slug);


--
-- Name: stores stores_slug_key238; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key238 UNIQUE (slug);


--
-- Name: stores stores_slug_key2380; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2380 UNIQUE (slug);


--
-- Name: stores stores_slug_key2381; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2381 UNIQUE (slug);


--
-- Name: stores stores_slug_key2382; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2382 UNIQUE (slug);


--
-- Name: stores stores_slug_key2383; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2383 UNIQUE (slug);


--
-- Name: stores stores_slug_key2384; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2384 UNIQUE (slug);


--
-- Name: stores stores_slug_key2385; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2385 UNIQUE (slug);


--
-- Name: stores stores_slug_key2386; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2386 UNIQUE (slug);


--
-- Name: stores stores_slug_key2387; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2387 UNIQUE (slug);


--
-- Name: stores stores_slug_key2388; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2388 UNIQUE (slug);


--
-- Name: stores stores_slug_key2389; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2389 UNIQUE (slug);


--
-- Name: stores stores_slug_key239; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key239 UNIQUE (slug);


--
-- Name: stores stores_slug_key2390; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2390 UNIQUE (slug);


--
-- Name: stores stores_slug_key2391; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2391 UNIQUE (slug);


--
-- Name: stores stores_slug_key2392; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2392 UNIQUE (slug);


--
-- Name: stores stores_slug_key2393; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2393 UNIQUE (slug);


--
-- Name: stores stores_slug_key2394; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2394 UNIQUE (slug);


--
-- Name: stores stores_slug_key2395; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2395 UNIQUE (slug);


--
-- Name: stores stores_slug_key2396; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2396 UNIQUE (slug);


--
-- Name: stores stores_slug_key2397; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2397 UNIQUE (slug);


--
-- Name: stores stores_slug_key2398; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2398 UNIQUE (slug);


--
-- Name: stores stores_slug_key2399; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2399 UNIQUE (slug);


--
-- Name: stores stores_slug_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key24 UNIQUE (slug);


--
-- Name: stores stores_slug_key240; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key240 UNIQUE (slug);


--
-- Name: stores stores_slug_key2400; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2400 UNIQUE (slug);


--
-- Name: stores stores_slug_key2401; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2401 UNIQUE (slug);


--
-- Name: stores stores_slug_key2402; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2402 UNIQUE (slug);


--
-- Name: stores stores_slug_key2403; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2403 UNIQUE (slug);


--
-- Name: stores stores_slug_key2404; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2404 UNIQUE (slug);


--
-- Name: stores stores_slug_key2405; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2405 UNIQUE (slug);


--
-- Name: stores stores_slug_key2406; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2406 UNIQUE (slug);


--
-- Name: stores stores_slug_key2407; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2407 UNIQUE (slug);


--
-- Name: stores stores_slug_key2408; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2408 UNIQUE (slug);


--
-- Name: stores stores_slug_key2409; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2409 UNIQUE (slug);


--
-- Name: stores stores_slug_key241; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key241 UNIQUE (slug);


--
-- Name: stores stores_slug_key2410; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2410 UNIQUE (slug);


--
-- Name: stores stores_slug_key2411; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2411 UNIQUE (slug);


--
-- Name: stores stores_slug_key2412; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2412 UNIQUE (slug);


--
-- Name: stores stores_slug_key2413; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2413 UNIQUE (slug);


--
-- Name: stores stores_slug_key2414; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2414 UNIQUE (slug);


--
-- Name: stores stores_slug_key2415; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2415 UNIQUE (slug);


--
-- Name: stores stores_slug_key2416; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2416 UNIQUE (slug);


--
-- Name: stores stores_slug_key2417; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2417 UNIQUE (slug);


--
-- Name: stores stores_slug_key2418; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2418 UNIQUE (slug);


--
-- Name: stores stores_slug_key2419; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2419 UNIQUE (slug);


--
-- Name: stores stores_slug_key242; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key242 UNIQUE (slug);


--
-- Name: stores stores_slug_key2420; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2420 UNIQUE (slug);


--
-- Name: stores stores_slug_key2421; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2421 UNIQUE (slug);


--
-- Name: stores stores_slug_key2422; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2422 UNIQUE (slug);


--
-- Name: stores stores_slug_key2423; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2423 UNIQUE (slug);


--
-- Name: stores stores_slug_key2424; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2424 UNIQUE (slug);


--
-- Name: stores stores_slug_key2425; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2425 UNIQUE (slug);


--
-- Name: stores stores_slug_key2426; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2426 UNIQUE (slug);


--
-- Name: stores stores_slug_key2427; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2427 UNIQUE (slug);


--
-- Name: stores stores_slug_key2428; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2428 UNIQUE (slug);


--
-- Name: stores stores_slug_key2429; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2429 UNIQUE (slug);


--
-- Name: stores stores_slug_key243; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key243 UNIQUE (slug);


--
-- Name: stores stores_slug_key2430; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2430 UNIQUE (slug);


--
-- Name: stores stores_slug_key2431; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2431 UNIQUE (slug);


--
-- Name: stores stores_slug_key2432; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2432 UNIQUE (slug);


--
-- Name: stores stores_slug_key2433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2433 UNIQUE (slug);


--
-- Name: stores stores_slug_key2434; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2434 UNIQUE (slug);


--
-- Name: stores stores_slug_key2435; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2435 UNIQUE (slug);


--
-- Name: stores stores_slug_key2436; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2436 UNIQUE (slug);


--
-- Name: stores stores_slug_key2437; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2437 UNIQUE (slug);


--
-- Name: stores stores_slug_key2438; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2438 UNIQUE (slug);


--
-- Name: stores stores_slug_key2439; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2439 UNIQUE (slug);


--
-- Name: stores stores_slug_key244; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key244 UNIQUE (slug);


--
-- Name: stores stores_slug_key2440; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2440 UNIQUE (slug);


--
-- Name: stores stores_slug_key2441; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2441 UNIQUE (slug);


--
-- Name: stores stores_slug_key2442; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2442 UNIQUE (slug);


--
-- Name: stores stores_slug_key2443; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2443 UNIQUE (slug);


--
-- Name: stores stores_slug_key2444; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2444 UNIQUE (slug);


--
-- Name: stores stores_slug_key2445; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2445 UNIQUE (slug);


--
-- Name: stores stores_slug_key2446; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2446 UNIQUE (slug);


--
-- Name: stores stores_slug_key2447; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2447 UNIQUE (slug);


--
-- Name: stores stores_slug_key2448; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2448 UNIQUE (slug);


--
-- Name: stores stores_slug_key2449; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2449 UNIQUE (slug);


--
-- Name: stores stores_slug_key245; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key245 UNIQUE (slug);


--
-- Name: stores stores_slug_key2450; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2450 UNIQUE (slug);


--
-- Name: stores stores_slug_key2451; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2451 UNIQUE (slug);


--
-- Name: stores stores_slug_key2452; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2452 UNIQUE (slug);


--
-- Name: stores stores_slug_key2453; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2453 UNIQUE (slug);


--
-- Name: stores stores_slug_key2454; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2454 UNIQUE (slug);


--
-- Name: stores stores_slug_key2455; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2455 UNIQUE (slug);


--
-- Name: stores stores_slug_key2456; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2456 UNIQUE (slug);


--
-- Name: stores stores_slug_key2457; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2457 UNIQUE (slug);


--
-- Name: stores stores_slug_key2458; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2458 UNIQUE (slug);


--
-- Name: stores stores_slug_key2459; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2459 UNIQUE (slug);


--
-- Name: stores stores_slug_key246; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key246 UNIQUE (slug);


--
-- Name: stores stores_slug_key2460; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2460 UNIQUE (slug);


--
-- Name: stores stores_slug_key2461; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2461 UNIQUE (slug);


--
-- Name: stores stores_slug_key2462; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2462 UNIQUE (slug);


--
-- Name: stores stores_slug_key2463; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2463 UNIQUE (slug);


--
-- Name: stores stores_slug_key2464; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2464 UNIQUE (slug);


--
-- Name: stores stores_slug_key2465; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2465 UNIQUE (slug);


--
-- Name: stores stores_slug_key2466; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2466 UNIQUE (slug);


--
-- Name: stores stores_slug_key2467; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2467 UNIQUE (slug);


--
-- Name: stores stores_slug_key2468; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2468 UNIQUE (slug);


--
-- Name: stores stores_slug_key2469; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2469 UNIQUE (slug);


--
-- Name: stores stores_slug_key247; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key247 UNIQUE (slug);


--
-- Name: stores stores_slug_key2470; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2470 UNIQUE (slug);


--
-- Name: stores stores_slug_key2471; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2471 UNIQUE (slug);


--
-- Name: stores stores_slug_key2472; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2472 UNIQUE (slug);


--
-- Name: stores stores_slug_key2473; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2473 UNIQUE (slug);


--
-- Name: stores stores_slug_key2474; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2474 UNIQUE (slug);


--
-- Name: stores stores_slug_key2475; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2475 UNIQUE (slug);


--
-- Name: stores stores_slug_key2476; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2476 UNIQUE (slug);


--
-- Name: stores stores_slug_key2477; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2477 UNIQUE (slug);


--
-- Name: stores stores_slug_key2478; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2478 UNIQUE (slug);


--
-- Name: stores stores_slug_key2479; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2479 UNIQUE (slug);


--
-- Name: stores stores_slug_key248; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key248 UNIQUE (slug);


--
-- Name: stores stores_slug_key2480; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2480 UNIQUE (slug);


--
-- Name: stores stores_slug_key2481; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2481 UNIQUE (slug);


--
-- Name: stores stores_slug_key2482; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2482 UNIQUE (slug);


--
-- Name: stores stores_slug_key2483; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2483 UNIQUE (slug);


--
-- Name: stores stores_slug_key2484; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2484 UNIQUE (slug);


--
-- Name: stores stores_slug_key2485; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2485 UNIQUE (slug);


--
-- Name: stores stores_slug_key2486; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2486 UNIQUE (slug);


--
-- Name: stores stores_slug_key2487; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2487 UNIQUE (slug);


--
-- Name: stores stores_slug_key2488; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2488 UNIQUE (slug);


--
-- Name: stores stores_slug_key2489; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2489 UNIQUE (slug);


--
-- Name: stores stores_slug_key249; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key249 UNIQUE (slug);


--
-- Name: stores stores_slug_key2490; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2490 UNIQUE (slug);


--
-- Name: stores stores_slug_key2491; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2491 UNIQUE (slug);


--
-- Name: stores stores_slug_key2492; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2492 UNIQUE (slug);


--
-- Name: stores stores_slug_key2493; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2493 UNIQUE (slug);


--
-- Name: stores stores_slug_key2494; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2494 UNIQUE (slug);


--
-- Name: stores stores_slug_key2495; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2495 UNIQUE (slug);


--
-- Name: stores stores_slug_key2496; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2496 UNIQUE (slug);


--
-- Name: stores stores_slug_key2497; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2497 UNIQUE (slug);


--
-- Name: stores stores_slug_key2498; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2498 UNIQUE (slug);


--
-- Name: stores stores_slug_key2499; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2499 UNIQUE (slug);


--
-- Name: stores stores_slug_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key25 UNIQUE (slug);


--
-- Name: stores stores_slug_key250; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key250 UNIQUE (slug);


--
-- Name: stores stores_slug_key2500; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2500 UNIQUE (slug);


--
-- Name: stores stores_slug_key2501; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2501 UNIQUE (slug);


--
-- Name: stores stores_slug_key2502; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2502 UNIQUE (slug);


--
-- Name: stores stores_slug_key2503; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2503 UNIQUE (slug);


--
-- Name: stores stores_slug_key2504; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2504 UNIQUE (slug);


--
-- Name: stores stores_slug_key2505; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2505 UNIQUE (slug);


--
-- Name: stores stores_slug_key2506; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2506 UNIQUE (slug);


--
-- Name: stores stores_slug_key2507; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2507 UNIQUE (slug);


--
-- Name: stores stores_slug_key2508; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2508 UNIQUE (slug);


--
-- Name: stores stores_slug_key2509; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2509 UNIQUE (slug);


--
-- Name: stores stores_slug_key251; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key251 UNIQUE (slug);


--
-- Name: stores stores_slug_key2510; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2510 UNIQUE (slug);


--
-- Name: stores stores_slug_key2511; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2511 UNIQUE (slug);


--
-- Name: stores stores_slug_key2512; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2512 UNIQUE (slug);


--
-- Name: stores stores_slug_key2513; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2513 UNIQUE (slug);


--
-- Name: stores stores_slug_key2514; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2514 UNIQUE (slug);


--
-- Name: stores stores_slug_key2515; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2515 UNIQUE (slug);


--
-- Name: stores stores_slug_key2516; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2516 UNIQUE (slug);


--
-- Name: stores stores_slug_key2517; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2517 UNIQUE (slug);


--
-- Name: stores stores_slug_key2518; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2518 UNIQUE (slug);


--
-- Name: stores stores_slug_key2519; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2519 UNIQUE (slug);


--
-- Name: stores stores_slug_key252; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key252 UNIQUE (slug);


--
-- Name: stores stores_slug_key2520; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2520 UNIQUE (slug);


--
-- Name: stores stores_slug_key2521; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2521 UNIQUE (slug);


--
-- Name: stores stores_slug_key2522; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2522 UNIQUE (slug);


--
-- Name: stores stores_slug_key2523; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2523 UNIQUE (slug);


--
-- Name: stores stores_slug_key2524; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2524 UNIQUE (slug);


--
-- Name: stores stores_slug_key2525; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2525 UNIQUE (slug);


--
-- Name: stores stores_slug_key2526; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2526 UNIQUE (slug);


--
-- Name: stores stores_slug_key2527; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2527 UNIQUE (slug);


--
-- Name: stores stores_slug_key2528; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2528 UNIQUE (slug);


--
-- Name: stores stores_slug_key2529; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2529 UNIQUE (slug);


--
-- Name: stores stores_slug_key253; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key253 UNIQUE (slug);


--
-- Name: stores stores_slug_key2530; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2530 UNIQUE (slug);


--
-- Name: stores stores_slug_key2531; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2531 UNIQUE (slug);


--
-- Name: stores stores_slug_key2532; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2532 UNIQUE (slug);


--
-- Name: stores stores_slug_key2533; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2533 UNIQUE (slug);


--
-- Name: stores stores_slug_key2534; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2534 UNIQUE (slug);


--
-- Name: stores stores_slug_key2535; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2535 UNIQUE (slug);


--
-- Name: stores stores_slug_key2536; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2536 UNIQUE (slug);


--
-- Name: stores stores_slug_key2537; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2537 UNIQUE (slug);


--
-- Name: stores stores_slug_key2538; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2538 UNIQUE (slug);


--
-- Name: stores stores_slug_key2539; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2539 UNIQUE (slug);


--
-- Name: stores stores_slug_key254; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key254 UNIQUE (slug);


--
-- Name: stores stores_slug_key2540; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2540 UNIQUE (slug);


--
-- Name: stores stores_slug_key2541; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2541 UNIQUE (slug);


--
-- Name: stores stores_slug_key2542; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2542 UNIQUE (slug);


--
-- Name: stores stores_slug_key2543; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2543 UNIQUE (slug);


--
-- Name: stores stores_slug_key2544; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2544 UNIQUE (slug);


--
-- Name: stores stores_slug_key2545; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2545 UNIQUE (slug);


--
-- Name: stores stores_slug_key2546; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2546 UNIQUE (slug);


--
-- Name: stores stores_slug_key2547; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2547 UNIQUE (slug);


--
-- Name: stores stores_slug_key2548; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2548 UNIQUE (slug);


--
-- Name: stores stores_slug_key2549; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2549 UNIQUE (slug);


--
-- Name: stores stores_slug_key255; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key255 UNIQUE (slug);


--
-- Name: stores stores_slug_key2550; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2550 UNIQUE (slug);


--
-- Name: stores stores_slug_key2551; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2551 UNIQUE (slug);


--
-- Name: stores stores_slug_key2552; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2552 UNIQUE (slug);


--
-- Name: stores stores_slug_key2553; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2553 UNIQUE (slug);


--
-- Name: stores stores_slug_key2554; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2554 UNIQUE (slug);


--
-- Name: stores stores_slug_key2555; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2555 UNIQUE (slug);


--
-- Name: stores stores_slug_key2556; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2556 UNIQUE (slug);


--
-- Name: stores stores_slug_key2557; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2557 UNIQUE (slug);


--
-- Name: stores stores_slug_key2558; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2558 UNIQUE (slug);


--
-- Name: stores stores_slug_key2559; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2559 UNIQUE (slug);


--
-- Name: stores stores_slug_key256; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key256 UNIQUE (slug);


--
-- Name: stores stores_slug_key2560; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2560 UNIQUE (slug);


--
-- Name: stores stores_slug_key2561; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2561 UNIQUE (slug);


--
-- Name: stores stores_slug_key2562; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2562 UNIQUE (slug);


--
-- Name: stores stores_slug_key2563; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2563 UNIQUE (slug);


--
-- Name: stores stores_slug_key2564; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2564 UNIQUE (slug);


--
-- Name: stores stores_slug_key2565; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2565 UNIQUE (slug);


--
-- Name: stores stores_slug_key2566; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2566 UNIQUE (slug);


--
-- Name: stores stores_slug_key2567; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2567 UNIQUE (slug);


--
-- Name: stores stores_slug_key2568; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2568 UNIQUE (slug);


--
-- Name: stores stores_slug_key2569; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2569 UNIQUE (slug);


--
-- Name: stores stores_slug_key257; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key257 UNIQUE (slug);


--
-- Name: stores stores_slug_key2570; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2570 UNIQUE (slug);


--
-- Name: stores stores_slug_key2571; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2571 UNIQUE (slug);


--
-- Name: stores stores_slug_key2572; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2572 UNIQUE (slug);


--
-- Name: stores stores_slug_key2573; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2573 UNIQUE (slug);


--
-- Name: stores stores_slug_key2574; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2574 UNIQUE (slug);


--
-- Name: stores stores_slug_key2575; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2575 UNIQUE (slug);


--
-- Name: stores stores_slug_key2576; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2576 UNIQUE (slug);


--
-- Name: stores stores_slug_key2577; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2577 UNIQUE (slug);


--
-- Name: stores stores_slug_key2578; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2578 UNIQUE (slug);


--
-- Name: stores stores_slug_key2579; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2579 UNIQUE (slug);


--
-- Name: stores stores_slug_key258; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key258 UNIQUE (slug);


--
-- Name: stores stores_slug_key2580; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2580 UNIQUE (slug);


--
-- Name: stores stores_slug_key2581; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2581 UNIQUE (slug);


--
-- Name: stores stores_slug_key2582; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2582 UNIQUE (slug);


--
-- Name: stores stores_slug_key2583; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2583 UNIQUE (slug);


--
-- Name: stores stores_slug_key2584; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2584 UNIQUE (slug);


--
-- Name: stores stores_slug_key2585; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2585 UNIQUE (slug);


--
-- Name: stores stores_slug_key2586; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2586 UNIQUE (slug);


--
-- Name: stores stores_slug_key2587; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2587 UNIQUE (slug);


--
-- Name: stores stores_slug_key2588; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2588 UNIQUE (slug);


--
-- Name: stores stores_slug_key2589; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2589 UNIQUE (slug);


--
-- Name: stores stores_slug_key259; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key259 UNIQUE (slug);


--
-- Name: stores stores_slug_key2590; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2590 UNIQUE (slug);


--
-- Name: stores stores_slug_key2591; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2591 UNIQUE (slug);


--
-- Name: stores stores_slug_key2592; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2592 UNIQUE (slug);


--
-- Name: stores stores_slug_key2593; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key2593 UNIQUE (slug);


--
-- Name: stores stores_slug_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key26 UNIQUE (slug);


--
-- Name: stores stores_slug_key260; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key260 UNIQUE (slug);


--
-- Name: stores stores_slug_key261; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key261 UNIQUE (slug);


--
-- Name: stores stores_slug_key262; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key262 UNIQUE (slug);


--
-- Name: stores stores_slug_key263; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key263 UNIQUE (slug);


--
-- Name: stores stores_slug_key264; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key264 UNIQUE (slug);


--
-- Name: stores stores_slug_key265; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key265 UNIQUE (slug);


--
-- Name: stores stores_slug_key266; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key266 UNIQUE (slug);


--
-- Name: stores stores_slug_key267; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key267 UNIQUE (slug);


--
-- Name: stores stores_slug_key268; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key268 UNIQUE (slug);


--
-- Name: stores stores_slug_key269; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key269 UNIQUE (slug);


--
-- Name: stores stores_slug_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key27 UNIQUE (slug);


--
-- Name: stores stores_slug_key270; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key270 UNIQUE (slug);


--
-- Name: stores stores_slug_key271; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key271 UNIQUE (slug);


--
-- Name: stores stores_slug_key272; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key272 UNIQUE (slug);


--
-- Name: stores stores_slug_key273; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key273 UNIQUE (slug);


--
-- Name: stores stores_slug_key274; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key274 UNIQUE (slug);


--
-- Name: stores stores_slug_key275; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key275 UNIQUE (slug);


--
-- Name: stores stores_slug_key276; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key276 UNIQUE (slug);


--
-- Name: stores stores_slug_key277; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key277 UNIQUE (slug);


--
-- Name: stores stores_slug_key278; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key278 UNIQUE (slug);


--
-- Name: stores stores_slug_key279; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key279 UNIQUE (slug);


--
-- Name: stores stores_slug_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key28 UNIQUE (slug);


--
-- Name: stores stores_slug_key280; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key280 UNIQUE (slug);


--
-- Name: stores stores_slug_key281; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key281 UNIQUE (slug);


--
-- Name: stores stores_slug_key282; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key282 UNIQUE (slug);


--
-- Name: stores stores_slug_key283; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key283 UNIQUE (slug);


--
-- Name: stores stores_slug_key284; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key284 UNIQUE (slug);


--
-- Name: stores stores_slug_key285; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key285 UNIQUE (slug);


--
-- Name: stores stores_slug_key286; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key286 UNIQUE (slug);


--
-- Name: stores stores_slug_key287; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key287 UNIQUE (slug);


--
-- Name: stores stores_slug_key288; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key288 UNIQUE (slug);


--
-- Name: stores stores_slug_key289; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key289 UNIQUE (slug);


--
-- Name: stores stores_slug_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key29 UNIQUE (slug);


--
-- Name: stores stores_slug_key290; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key290 UNIQUE (slug);


--
-- Name: stores stores_slug_key291; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key291 UNIQUE (slug);


--
-- Name: stores stores_slug_key292; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key292 UNIQUE (slug);


--
-- Name: stores stores_slug_key293; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key293 UNIQUE (slug);


--
-- Name: stores stores_slug_key294; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key294 UNIQUE (slug);


--
-- Name: stores stores_slug_key295; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key295 UNIQUE (slug);


--
-- Name: stores stores_slug_key296; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key296 UNIQUE (slug);


--
-- Name: stores stores_slug_key297; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key297 UNIQUE (slug);


--
-- Name: stores stores_slug_key298; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key298 UNIQUE (slug);


--
-- Name: stores stores_slug_key299; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key299 UNIQUE (slug);


--
-- Name: stores stores_slug_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key3 UNIQUE (slug);


--
-- Name: stores stores_slug_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key30 UNIQUE (slug);


--
-- Name: stores stores_slug_key300; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key300 UNIQUE (slug);


--
-- Name: stores stores_slug_key301; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key301 UNIQUE (slug);


--
-- Name: stores stores_slug_key302; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key302 UNIQUE (slug);


--
-- Name: stores stores_slug_key303; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key303 UNIQUE (slug);


--
-- Name: stores stores_slug_key304; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key304 UNIQUE (slug);


--
-- Name: stores stores_slug_key305; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key305 UNIQUE (slug);


--
-- Name: stores stores_slug_key306; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key306 UNIQUE (slug);


--
-- Name: stores stores_slug_key307; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key307 UNIQUE (slug);


--
-- Name: stores stores_slug_key308; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key308 UNIQUE (slug);


--
-- Name: stores stores_slug_key309; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key309 UNIQUE (slug);


--
-- Name: stores stores_slug_key31; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key31 UNIQUE (slug);


--
-- Name: stores stores_slug_key310; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key310 UNIQUE (slug);


--
-- Name: stores stores_slug_key311; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key311 UNIQUE (slug);


--
-- Name: stores stores_slug_key312; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key312 UNIQUE (slug);


--
-- Name: stores stores_slug_key313; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key313 UNIQUE (slug);


--
-- Name: stores stores_slug_key314; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key314 UNIQUE (slug);


--
-- Name: stores stores_slug_key315; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key315 UNIQUE (slug);


--
-- Name: stores stores_slug_key316; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key316 UNIQUE (slug);


--
-- Name: stores stores_slug_key317; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key317 UNIQUE (slug);


--
-- Name: stores stores_slug_key318; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key318 UNIQUE (slug);


--
-- Name: stores stores_slug_key319; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key319 UNIQUE (slug);


--
-- Name: stores stores_slug_key32; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key32 UNIQUE (slug);


--
-- Name: stores stores_slug_key320; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key320 UNIQUE (slug);


--
-- Name: stores stores_slug_key321; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key321 UNIQUE (slug);


--
-- Name: stores stores_slug_key322; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key322 UNIQUE (slug);


--
-- Name: stores stores_slug_key323; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key323 UNIQUE (slug);


--
-- Name: stores stores_slug_key324; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key324 UNIQUE (slug);


--
-- Name: stores stores_slug_key325; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key325 UNIQUE (slug);


--
-- Name: stores stores_slug_key326; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key326 UNIQUE (slug);


--
-- Name: stores stores_slug_key327; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key327 UNIQUE (slug);


--
-- Name: stores stores_slug_key328; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key328 UNIQUE (slug);


--
-- Name: stores stores_slug_key329; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key329 UNIQUE (slug);


--
-- Name: stores stores_slug_key33; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key33 UNIQUE (slug);


--
-- Name: stores stores_slug_key330; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key330 UNIQUE (slug);


--
-- Name: stores stores_slug_key331; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key331 UNIQUE (slug);


--
-- Name: stores stores_slug_key332; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key332 UNIQUE (slug);


--
-- Name: stores stores_slug_key333; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key333 UNIQUE (slug);


--
-- Name: stores stores_slug_key334; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key334 UNIQUE (slug);


--
-- Name: stores stores_slug_key335; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key335 UNIQUE (slug);


--
-- Name: stores stores_slug_key336; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key336 UNIQUE (slug);


--
-- Name: stores stores_slug_key337; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key337 UNIQUE (slug);


--
-- Name: stores stores_slug_key338; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key338 UNIQUE (slug);


--
-- Name: stores stores_slug_key339; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key339 UNIQUE (slug);


--
-- Name: stores stores_slug_key34; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key34 UNIQUE (slug);


--
-- Name: stores stores_slug_key340; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key340 UNIQUE (slug);


--
-- Name: stores stores_slug_key341; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key341 UNIQUE (slug);


--
-- Name: stores stores_slug_key342; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key342 UNIQUE (slug);


--
-- Name: stores stores_slug_key343; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key343 UNIQUE (slug);


--
-- Name: stores stores_slug_key344; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key344 UNIQUE (slug);


--
-- Name: stores stores_slug_key345; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key345 UNIQUE (slug);


--
-- Name: stores stores_slug_key346; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key346 UNIQUE (slug);


--
-- Name: stores stores_slug_key347; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key347 UNIQUE (slug);


--
-- Name: stores stores_slug_key348; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key348 UNIQUE (slug);


--
-- Name: stores stores_slug_key349; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key349 UNIQUE (slug);


--
-- Name: stores stores_slug_key35; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key35 UNIQUE (slug);


--
-- Name: stores stores_slug_key350; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key350 UNIQUE (slug);


--
-- Name: stores stores_slug_key351; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key351 UNIQUE (slug);


--
-- Name: stores stores_slug_key352; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key352 UNIQUE (slug);


--
-- Name: stores stores_slug_key353; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key353 UNIQUE (slug);


--
-- Name: stores stores_slug_key354; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key354 UNIQUE (slug);


--
-- Name: stores stores_slug_key355; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key355 UNIQUE (slug);


--
-- Name: stores stores_slug_key356; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key356 UNIQUE (slug);


--
-- Name: stores stores_slug_key357; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key357 UNIQUE (slug);


--
-- Name: stores stores_slug_key358; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key358 UNIQUE (slug);


--
-- Name: stores stores_slug_key359; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key359 UNIQUE (slug);


--
-- Name: stores stores_slug_key36; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key36 UNIQUE (slug);


--
-- Name: stores stores_slug_key360; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key360 UNIQUE (slug);


--
-- Name: stores stores_slug_key361; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key361 UNIQUE (slug);


--
-- Name: stores stores_slug_key362; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key362 UNIQUE (slug);


--
-- Name: stores stores_slug_key363; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key363 UNIQUE (slug);


--
-- Name: stores stores_slug_key364; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key364 UNIQUE (slug);


--
-- Name: stores stores_slug_key365; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key365 UNIQUE (slug);


--
-- Name: stores stores_slug_key366; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key366 UNIQUE (slug);


--
-- Name: stores stores_slug_key367; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key367 UNIQUE (slug);


--
-- Name: stores stores_slug_key368; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key368 UNIQUE (slug);


--
-- Name: stores stores_slug_key369; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key369 UNIQUE (slug);


--
-- Name: stores stores_slug_key37; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key37 UNIQUE (slug);


--
-- Name: stores stores_slug_key370; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key370 UNIQUE (slug);


--
-- Name: stores stores_slug_key371; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key371 UNIQUE (slug);


--
-- Name: stores stores_slug_key372; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key372 UNIQUE (slug);


--
-- Name: stores stores_slug_key373; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key373 UNIQUE (slug);


--
-- Name: stores stores_slug_key374; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key374 UNIQUE (slug);


--
-- Name: stores stores_slug_key375; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key375 UNIQUE (slug);


--
-- Name: stores stores_slug_key376; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key376 UNIQUE (slug);


--
-- Name: stores stores_slug_key377; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key377 UNIQUE (slug);


--
-- Name: stores stores_slug_key378; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key378 UNIQUE (slug);


--
-- Name: stores stores_slug_key379; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key379 UNIQUE (slug);


--
-- Name: stores stores_slug_key38; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key38 UNIQUE (slug);


--
-- Name: stores stores_slug_key380; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key380 UNIQUE (slug);


--
-- Name: stores stores_slug_key381; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key381 UNIQUE (slug);


--
-- Name: stores stores_slug_key382; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key382 UNIQUE (slug);


--
-- Name: stores stores_slug_key383; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key383 UNIQUE (slug);


--
-- Name: stores stores_slug_key384; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key384 UNIQUE (slug);


--
-- Name: stores stores_slug_key385; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key385 UNIQUE (slug);


--
-- Name: stores stores_slug_key386; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key386 UNIQUE (slug);


--
-- Name: stores stores_slug_key387; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key387 UNIQUE (slug);


--
-- Name: stores stores_slug_key388; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key388 UNIQUE (slug);


--
-- Name: stores stores_slug_key389; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key389 UNIQUE (slug);


--
-- Name: stores stores_slug_key39; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key39 UNIQUE (slug);


--
-- Name: stores stores_slug_key390; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key390 UNIQUE (slug);


--
-- Name: stores stores_slug_key391; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key391 UNIQUE (slug);


--
-- Name: stores stores_slug_key392; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key392 UNIQUE (slug);


--
-- Name: stores stores_slug_key393; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key393 UNIQUE (slug);


--
-- Name: stores stores_slug_key394; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key394 UNIQUE (slug);


--
-- Name: stores stores_slug_key395; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key395 UNIQUE (slug);


--
-- Name: stores stores_slug_key396; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key396 UNIQUE (slug);


--
-- Name: stores stores_slug_key397; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key397 UNIQUE (slug);


--
-- Name: stores stores_slug_key398; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key398 UNIQUE (slug);


--
-- Name: stores stores_slug_key399; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key399 UNIQUE (slug);


--
-- Name: stores stores_slug_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key4 UNIQUE (slug);


--
-- Name: stores stores_slug_key40; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key40 UNIQUE (slug);


--
-- Name: stores stores_slug_key400; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key400 UNIQUE (slug);


--
-- Name: stores stores_slug_key401; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key401 UNIQUE (slug);


--
-- Name: stores stores_slug_key402; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key402 UNIQUE (slug);


--
-- Name: stores stores_slug_key403; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key403 UNIQUE (slug);


--
-- Name: stores stores_slug_key404; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key404 UNIQUE (slug);


--
-- Name: stores stores_slug_key405; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key405 UNIQUE (slug);


--
-- Name: stores stores_slug_key406; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key406 UNIQUE (slug);


--
-- Name: stores stores_slug_key407; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key407 UNIQUE (slug);


--
-- Name: stores stores_slug_key408; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key408 UNIQUE (slug);


--
-- Name: stores stores_slug_key409; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key409 UNIQUE (slug);


--
-- Name: stores stores_slug_key41; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key41 UNIQUE (slug);


--
-- Name: stores stores_slug_key410; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key410 UNIQUE (slug);


--
-- Name: stores stores_slug_key411; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key411 UNIQUE (slug);


--
-- Name: stores stores_slug_key412; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key412 UNIQUE (slug);


--
-- Name: stores stores_slug_key413; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key413 UNIQUE (slug);


--
-- Name: stores stores_slug_key414; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key414 UNIQUE (slug);


--
-- Name: stores stores_slug_key415; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key415 UNIQUE (slug);


--
-- Name: stores stores_slug_key416; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key416 UNIQUE (slug);


--
-- Name: stores stores_slug_key417; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key417 UNIQUE (slug);


--
-- Name: stores stores_slug_key418; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key418 UNIQUE (slug);


--
-- Name: stores stores_slug_key419; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key419 UNIQUE (slug);


--
-- Name: stores stores_slug_key42; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key42 UNIQUE (slug);


--
-- Name: stores stores_slug_key420; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key420 UNIQUE (slug);


--
-- Name: stores stores_slug_key421; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key421 UNIQUE (slug);


--
-- Name: stores stores_slug_key422; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key422 UNIQUE (slug);


--
-- Name: stores stores_slug_key423; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key423 UNIQUE (slug);


--
-- Name: stores stores_slug_key424; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key424 UNIQUE (slug);


--
-- Name: stores stores_slug_key425; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key425 UNIQUE (slug);


--
-- Name: stores stores_slug_key426; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key426 UNIQUE (slug);


--
-- Name: stores stores_slug_key427; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key427 UNIQUE (slug);


--
-- Name: stores stores_slug_key428; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key428 UNIQUE (slug);


--
-- Name: stores stores_slug_key429; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key429 UNIQUE (slug);


--
-- Name: stores stores_slug_key43; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key43 UNIQUE (slug);


--
-- Name: stores stores_slug_key430; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key430 UNIQUE (slug);


--
-- Name: stores stores_slug_key431; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key431 UNIQUE (slug);


--
-- Name: stores stores_slug_key432; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key432 UNIQUE (slug);


--
-- Name: stores stores_slug_key433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key433 UNIQUE (slug);


--
-- Name: stores stores_slug_key434; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key434 UNIQUE (slug);


--
-- Name: stores stores_slug_key435; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key435 UNIQUE (slug);


--
-- Name: stores stores_slug_key436; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key436 UNIQUE (slug);


--
-- Name: stores stores_slug_key437; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key437 UNIQUE (slug);


--
-- Name: stores stores_slug_key438; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key438 UNIQUE (slug);


--
-- Name: stores stores_slug_key439; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key439 UNIQUE (slug);


--
-- Name: stores stores_slug_key44; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key44 UNIQUE (slug);


--
-- Name: stores stores_slug_key440; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key440 UNIQUE (slug);


--
-- Name: stores stores_slug_key441; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key441 UNIQUE (slug);


--
-- Name: stores stores_slug_key442; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key442 UNIQUE (slug);


--
-- Name: stores stores_slug_key443; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key443 UNIQUE (slug);


--
-- Name: stores stores_slug_key444; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key444 UNIQUE (slug);


--
-- Name: stores stores_slug_key445; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key445 UNIQUE (slug);


--
-- Name: stores stores_slug_key446; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key446 UNIQUE (slug);


--
-- Name: stores stores_slug_key447; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key447 UNIQUE (slug);


--
-- Name: stores stores_slug_key448; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key448 UNIQUE (slug);


--
-- Name: stores stores_slug_key449; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key449 UNIQUE (slug);


--
-- Name: stores stores_slug_key45; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key45 UNIQUE (slug);


--
-- Name: stores stores_slug_key450; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key450 UNIQUE (slug);


--
-- Name: stores stores_slug_key451; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key451 UNIQUE (slug);


--
-- Name: stores stores_slug_key452; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key452 UNIQUE (slug);


--
-- Name: stores stores_slug_key453; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key453 UNIQUE (slug);


--
-- Name: stores stores_slug_key454; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key454 UNIQUE (slug);


--
-- Name: stores stores_slug_key455; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key455 UNIQUE (slug);


--
-- Name: stores stores_slug_key456; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key456 UNIQUE (slug);


--
-- Name: stores stores_slug_key457; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key457 UNIQUE (slug);


--
-- Name: stores stores_slug_key458; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key458 UNIQUE (slug);


--
-- Name: stores stores_slug_key459; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key459 UNIQUE (slug);


--
-- Name: stores stores_slug_key46; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key46 UNIQUE (slug);


--
-- Name: stores stores_slug_key460; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key460 UNIQUE (slug);


--
-- Name: stores stores_slug_key461; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key461 UNIQUE (slug);


--
-- Name: stores stores_slug_key462; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key462 UNIQUE (slug);


--
-- Name: stores stores_slug_key463; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key463 UNIQUE (slug);


--
-- Name: stores stores_slug_key464; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key464 UNIQUE (slug);


--
-- Name: stores stores_slug_key465; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key465 UNIQUE (slug);


--
-- Name: stores stores_slug_key466; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key466 UNIQUE (slug);


--
-- Name: stores stores_slug_key467; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key467 UNIQUE (slug);


--
-- Name: stores stores_slug_key468; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key468 UNIQUE (slug);


--
-- Name: stores stores_slug_key469; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key469 UNIQUE (slug);


--
-- Name: stores stores_slug_key47; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key47 UNIQUE (slug);


--
-- Name: stores stores_slug_key470; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key470 UNIQUE (slug);


--
-- Name: stores stores_slug_key471; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key471 UNIQUE (slug);


--
-- Name: stores stores_slug_key472; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key472 UNIQUE (slug);


--
-- Name: stores stores_slug_key473; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key473 UNIQUE (slug);


--
-- Name: stores stores_slug_key474; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key474 UNIQUE (slug);


--
-- Name: stores stores_slug_key475; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key475 UNIQUE (slug);


--
-- Name: stores stores_slug_key476; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key476 UNIQUE (slug);


--
-- Name: stores stores_slug_key477; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key477 UNIQUE (slug);


--
-- Name: stores stores_slug_key478; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key478 UNIQUE (slug);


--
-- Name: stores stores_slug_key479; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key479 UNIQUE (slug);


--
-- Name: stores stores_slug_key48; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key48 UNIQUE (slug);


--
-- Name: stores stores_slug_key480; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key480 UNIQUE (slug);


--
-- Name: stores stores_slug_key481; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key481 UNIQUE (slug);


--
-- Name: stores stores_slug_key482; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key482 UNIQUE (slug);


--
-- Name: stores stores_slug_key483; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key483 UNIQUE (slug);


--
-- Name: stores stores_slug_key484; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key484 UNIQUE (slug);


--
-- Name: stores stores_slug_key485; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key485 UNIQUE (slug);


--
-- Name: stores stores_slug_key486; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key486 UNIQUE (slug);


--
-- Name: stores stores_slug_key487; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key487 UNIQUE (slug);


--
-- Name: stores stores_slug_key488; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key488 UNIQUE (slug);


--
-- Name: stores stores_slug_key489; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key489 UNIQUE (slug);


--
-- Name: stores stores_slug_key49; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key49 UNIQUE (slug);


--
-- Name: stores stores_slug_key490; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key490 UNIQUE (slug);


--
-- Name: stores stores_slug_key491; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key491 UNIQUE (slug);


--
-- Name: stores stores_slug_key492; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key492 UNIQUE (slug);


--
-- Name: stores stores_slug_key493; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key493 UNIQUE (slug);


--
-- Name: stores stores_slug_key494; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key494 UNIQUE (slug);


--
-- Name: stores stores_slug_key495; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key495 UNIQUE (slug);


--
-- Name: stores stores_slug_key496; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key496 UNIQUE (slug);


--
-- Name: stores stores_slug_key497; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key497 UNIQUE (slug);


--
-- Name: stores stores_slug_key498; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key498 UNIQUE (slug);


--
-- Name: stores stores_slug_key499; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key499 UNIQUE (slug);


--
-- Name: stores stores_slug_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key5 UNIQUE (slug);


--
-- Name: stores stores_slug_key50; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key50 UNIQUE (slug);


--
-- Name: stores stores_slug_key500; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key500 UNIQUE (slug);


--
-- Name: stores stores_slug_key501; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key501 UNIQUE (slug);


--
-- Name: stores stores_slug_key502; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key502 UNIQUE (slug);


--
-- Name: stores stores_slug_key503; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key503 UNIQUE (slug);


--
-- Name: stores stores_slug_key504; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key504 UNIQUE (slug);


--
-- Name: stores stores_slug_key505; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key505 UNIQUE (slug);


--
-- Name: stores stores_slug_key506; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key506 UNIQUE (slug);


--
-- Name: stores stores_slug_key507; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key507 UNIQUE (slug);


--
-- Name: stores stores_slug_key508; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key508 UNIQUE (slug);


--
-- Name: stores stores_slug_key509; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key509 UNIQUE (slug);


--
-- Name: stores stores_slug_key51; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key51 UNIQUE (slug);


--
-- Name: stores stores_slug_key510; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key510 UNIQUE (slug);


--
-- Name: stores stores_slug_key511; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key511 UNIQUE (slug);


--
-- Name: stores stores_slug_key512; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key512 UNIQUE (slug);


--
-- Name: stores stores_slug_key513; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key513 UNIQUE (slug);


--
-- Name: stores stores_slug_key514; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key514 UNIQUE (slug);


--
-- Name: stores stores_slug_key515; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key515 UNIQUE (slug);


--
-- Name: stores stores_slug_key516; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key516 UNIQUE (slug);


--
-- Name: stores stores_slug_key517; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key517 UNIQUE (slug);


--
-- Name: stores stores_slug_key518; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key518 UNIQUE (slug);


--
-- Name: stores stores_slug_key519; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key519 UNIQUE (slug);


--
-- Name: stores stores_slug_key52; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key52 UNIQUE (slug);


--
-- Name: stores stores_slug_key520; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key520 UNIQUE (slug);


--
-- Name: stores stores_slug_key521; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key521 UNIQUE (slug);


--
-- Name: stores stores_slug_key522; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key522 UNIQUE (slug);


--
-- Name: stores stores_slug_key523; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key523 UNIQUE (slug);


--
-- Name: stores stores_slug_key524; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key524 UNIQUE (slug);


--
-- Name: stores stores_slug_key525; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key525 UNIQUE (slug);


--
-- Name: stores stores_slug_key526; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key526 UNIQUE (slug);


--
-- Name: stores stores_slug_key527; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key527 UNIQUE (slug);


--
-- Name: stores stores_slug_key528; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key528 UNIQUE (slug);


--
-- Name: stores stores_slug_key529; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key529 UNIQUE (slug);


--
-- Name: stores stores_slug_key53; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key53 UNIQUE (slug);


--
-- Name: stores stores_slug_key530; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key530 UNIQUE (slug);


--
-- Name: stores stores_slug_key531; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key531 UNIQUE (slug);


--
-- Name: stores stores_slug_key532; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key532 UNIQUE (slug);


--
-- Name: stores stores_slug_key533; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key533 UNIQUE (slug);


--
-- Name: stores stores_slug_key534; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key534 UNIQUE (slug);


--
-- Name: stores stores_slug_key535; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key535 UNIQUE (slug);


--
-- Name: stores stores_slug_key536; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key536 UNIQUE (slug);


--
-- Name: stores stores_slug_key537; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key537 UNIQUE (slug);


--
-- Name: stores stores_slug_key538; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key538 UNIQUE (slug);


--
-- Name: stores stores_slug_key539; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key539 UNIQUE (slug);


--
-- Name: stores stores_slug_key54; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key54 UNIQUE (slug);


--
-- Name: stores stores_slug_key540; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key540 UNIQUE (slug);


--
-- Name: stores stores_slug_key541; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key541 UNIQUE (slug);


--
-- Name: stores stores_slug_key542; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key542 UNIQUE (slug);


--
-- Name: stores stores_slug_key543; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key543 UNIQUE (slug);


--
-- Name: stores stores_slug_key544; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key544 UNIQUE (slug);


--
-- Name: stores stores_slug_key545; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key545 UNIQUE (slug);


--
-- Name: stores stores_slug_key546; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key546 UNIQUE (slug);


--
-- Name: stores stores_slug_key547; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key547 UNIQUE (slug);


--
-- Name: stores stores_slug_key548; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key548 UNIQUE (slug);


--
-- Name: stores stores_slug_key549; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key549 UNIQUE (slug);


--
-- Name: stores stores_slug_key55; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key55 UNIQUE (slug);


--
-- Name: stores stores_slug_key550; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key550 UNIQUE (slug);


--
-- Name: stores stores_slug_key551; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key551 UNIQUE (slug);


--
-- Name: stores stores_slug_key552; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key552 UNIQUE (slug);


--
-- Name: stores stores_slug_key553; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key553 UNIQUE (slug);


--
-- Name: stores stores_slug_key554; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key554 UNIQUE (slug);


--
-- Name: stores stores_slug_key555; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key555 UNIQUE (slug);


--
-- Name: stores stores_slug_key556; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key556 UNIQUE (slug);


--
-- Name: stores stores_slug_key557; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key557 UNIQUE (slug);


--
-- Name: stores stores_slug_key558; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key558 UNIQUE (slug);


--
-- Name: stores stores_slug_key559; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key559 UNIQUE (slug);


--
-- Name: stores stores_slug_key56; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key56 UNIQUE (slug);


--
-- Name: stores stores_slug_key560; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key560 UNIQUE (slug);


--
-- Name: stores stores_slug_key561; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key561 UNIQUE (slug);


--
-- Name: stores stores_slug_key562; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key562 UNIQUE (slug);


--
-- Name: stores stores_slug_key563; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key563 UNIQUE (slug);


--
-- Name: stores stores_slug_key564; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key564 UNIQUE (slug);


--
-- Name: stores stores_slug_key565; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key565 UNIQUE (slug);


--
-- Name: stores stores_slug_key566; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key566 UNIQUE (slug);


--
-- Name: stores stores_slug_key567; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key567 UNIQUE (slug);


--
-- Name: stores stores_slug_key568; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key568 UNIQUE (slug);


--
-- Name: stores stores_slug_key569; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key569 UNIQUE (slug);


--
-- Name: stores stores_slug_key57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key57 UNIQUE (slug);


--
-- Name: stores stores_slug_key570; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key570 UNIQUE (slug);


--
-- Name: stores stores_slug_key571; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key571 UNIQUE (slug);


--
-- Name: stores stores_slug_key572; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key572 UNIQUE (slug);


--
-- Name: stores stores_slug_key573; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key573 UNIQUE (slug);


--
-- Name: stores stores_slug_key574; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key574 UNIQUE (slug);


--
-- Name: stores stores_slug_key575; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key575 UNIQUE (slug);


--
-- Name: stores stores_slug_key576; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key576 UNIQUE (slug);


--
-- Name: stores stores_slug_key577; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key577 UNIQUE (slug);


--
-- Name: stores stores_slug_key578; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key578 UNIQUE (slug);


--
-- Name: stores stores_slug_key579; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key579 UNIQUE (slug);


--
-- Name: stores stores_slug_key58; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key58 UNIQUE (slug);


--
-- Name: stores stores_slug_key580; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key580 UNIQUE (slug);


--
-- Name: stores stores_slug_key581; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key581 UNIQUE (slug);


--
-- Name: stores stores_slug_key582; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key582 UNIQUE (slug);


--
-- Name: stores stores_slug_key583; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key583 UNIQUE (slug);


--
-- Name: stores stores_slug_key584; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key584 UNIQUE (slug);


--
-- Name: stores stores_slug_key585; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key585 UNIQUE (slug);


--
-- Name: stores stores_slug_key586; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key586 UNIQUE (slug);


--
-- Name: stores stores_slug_key587; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key587 UNIQUE (slug);


--
-- Name: stores stores_slug_key588; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key588 UNIQUE (slug);


--
-- Name: stores stores_slug_key589; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key589 UNIQUE (slug);


--
-- Name: stores stores_slug_key59; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key59 UNIQUE (slug);


--
-- Name: stores stores_slug_key590; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key590 UNIQUE (slug);


--
-- Name: stores stores_slug_key591; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key591 UNIQUE (slug);


--
-- Name: stores stores_slug_key592; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key592 UNIQUE (slug);


--
-- Name: stores stores_slug_key593; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key593 UNIQUE (slug);


--
-- Name: stores stores_slug_key594; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key594 UNIQUE (slug);


--
-- Name: stores stores_slug_key595; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key595 UNIQUE (slug);


--
-- Name: stores stores_slug_key596; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key596 UNIQUE (slug);


--
-- Name: stores stores_slug_key597; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key597 UNIQUE (slug);


--
-- Name: stores stores_slug_key598; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key598 UNIQUE (slug);


--
-- Name: stores stores_slug_key599; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key599 UNIQUE (slug);


--
-- Name: stores stores_slug_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key6 UNIQUE (slug);


--
-- Name: stores stores_slug_key60; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key60 UNIQUE (slug);


--
-- Name: stores stores_slug_key600; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key600 UNIQUE (slug);


--
-- Name: stores stores_slug_key601; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key601 UNIQUE (slug);


--
-- Name: stores stores_slug_key602; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key602 UNIQUE (slug);


--
-- Name: stores stores_slug_key603; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key603 UNIQUE (slug);


--
-- Name: stores stores_slug_key604; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key604 UNIQUE (slug);


--
-- Name: stores stores_slug_key605; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key605 UNIQUE (slug);


--
-- Name: stores stores_slug_key606; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key606 UNIQUE (slug);


--
-- Name: stores stores_slug_key607; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key607 UNIQUE (slug);


--
-- Name: stores stores_slug_key608; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key608 UNIQUE (slug);


--
-- Name: stores stores_slug_key609; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key609 UNIQUE (slug);


--
-- Name: stores stores_slug_key61; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key61 UNIQUE (slug);


--
-- Name: stores stores_slug_key610; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key610 UNIQUE (slug);


--
-- Name: stores stores_slug_key611; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key611 UNIQUE (slug);


--
-- Name: stores stores_slug_key612; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key612 UNIQUE (slug);


--
-- Name: stores stores_slug_key613; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key613 UNIQUE (slug);


--
-- Name: stores stores_slug_key614; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key614 UNIQUE (slug);


--
-- Name: stores stores_slug_key615; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key615 UNIQUE (slug);


--
-- Name: stores stores_slug_key616; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key616 UNIQUE (slug);


--
-- Name: stores stores_slug_key617; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key617 UNIQUE (slug);


--
-- Name: stores stores_slug_key618; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key618 UNIQUE (slug);


--
-- Name: stores stores_slug_key619; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key619 UNIQUE (slug);


--
-- Name: stores stores_slug_key62; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key62 UNIQUE (slug);


--
-- Name: stores stores_slug_key620; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key620 UNIQUE (slug);


--
-- Name: stores stores_slug_key621; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key621 UNIQUE (slug);


--
-- Name: stores stores_slug_key622; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key622 UNIQUE (slug);


--
-- Name: stores stores_slug_key623; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key623 UNIQUE (slug);


--
-- Name: stores stores_slug_key624; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key624 UNIQUE (slug);


--
-- Name: stores stores_slug_key625; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key625 UNIQUE (slug);


--
-- Name: stores stores_slug_key626; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key626 UNIQUE (slug);


--
-- Name: stores stores_slug_key627; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key627 UNIQUE (slug);


--
-- Name: stores stores_slug_key628; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key628 UNIQUE (slug);


--
-- Name: stores stores_slug_key629; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key629 UNIQUE (slug);


--
-- Name: stores stores_slug_key63; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key63 UNIQUE (slug);


--
-- Name: stores stores_slug_key630; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key630 UNIQUE (slug);


--
-- Name: stores stores_slug_key631; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key631 UNIQUE (slug);


--
-- Name: stores stores_slug_key632; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key632 UNIQUE (slug);


--
-- Name: stores stores_slug_key633; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key633 UNIQUE (slug);


--
-- Name: stores stores_slug_key634; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key634 UNIQUE (slug);


--
-- Name: stores stores_slug_key635; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key635 UNIQUE (slug);


--
-- Name: stores stores_slug_key636; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key636 UNIQUE (slug);


--
-- Name: stores stores_slug_key637; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key637 UNIQUE (slug);


--
-- Name: stores stores_slug_key638; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key638 UNIQUE (slug);


--
-- Name: stores stores_slug_key639; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key639 UNIQUE (slug);


--
-- Name: stores stores_slug_key64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key64 UNIQUE (slug);


--
-- Name: stores stores_slug_key640; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key640 UNIQUE (slug);


--
-- Name: stores stores_slug_key641; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key641 UNIQUE (slug);


--
-- Name: stores stores_slug_key642; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key642 UNIQUE (slug);


--
-- Name: stores stores_slug_key643; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key643 UNIQUE (slug);


--
-- Name: stores stores_slug_key644; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key644 UNIQUE (slug);


--
-- Name: stores stores_slug_key645; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key645 UNIQUE (slug);


--
-- Name: stores stores_slug_key646; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key646 UNIQUE (slug);


--
-- Name: stores stores_slug_key647; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key647 UNIQUE (slug);


--
-- Name: stores stores_slug_key648; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key648 UNIQUE (slug);


--
-- Name: stores stores_slug_key649; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key649 UNIQUE (slug);


--
-- Name: stores stores_slug_key65; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key65 UNIQUE (slug);


--
-- Name: stores stores_slug_key650; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key650 UNIQUE (slug);


--
-- Name: stores stores_slug_key651; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key651 UNIQUE (slug);


--
-- Name: stores stores_slug_key652; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key652 UNIQUE (slug);


--
-- Name: stores stores_slug_key653; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key653 UNIQUE (slug);


--
-- Name: stores stores_slug_key654; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key654 UNIQUE (slug);


--
-- Name: stores stores_slug_key655; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key655 UNIQUE (slug);


--
-- Name: stores stores_slug_key656; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key656 UNIQUE (slug);


--
-- Name: stores stores_slug_key657; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key657 UNIQUE (slug);


--
-- Name: stores stores_slug_key658; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key658 UNIQUE (slug);


--
-- Name: stores stores_slug_key659; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key659 UNIQUE (slug);


--
-- Name: stores stores_slug_key66; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key66 UNIQUE (slug);


--
-- Name: stores stores_slug_key660; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key660 UNIQUE (slug);


--
-- Name: stores stores_slug_key661; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key661 UNIQUE (slug);


--
-- Name: stores stores_slug_key662; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key662 UNIQUE (slug);


--
-- Name: stores stores_slug_key663; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key663 UNIQUE (slug);


--
-- Name: stores stores_slug_key664; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key664 UNIQUE (slug);


--
-- Name: stores stores_slug_key665; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key665 UNIQUE (slug);


--
-- Name: stores stores_slug_key666; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key666 UNIQUE (slug);


--
-- Name: stores stores_slug_key667; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key667 UNIQUE (slug);


--
-- Name: stores stores_slug_key668; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key668 UNIQUE (slug);


--
-- Name: stores stores_slug_key669; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key669 UNIQUE (slug);


--
-- Name: stores stores_slug_key67; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key67 UNIQUE (slug);


--
-- Name: stores stores_slug_key670; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key670 UNIQUE (slug);


--
-- Name: stores stores_slug_key671; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key671 UNIQUE (slug);


--
-- Name: stores stores_slug_key672; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key672 UNIQUE (slug);


--
-- Name: stores stores_slug_key673; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key673 UNIQUE (slug);


--
-- Name: stores stores_slug_key674; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key674 UNIQUE (slug);


--
-- Name: stores stores_slug_key675; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key675 UNIQUE (slug);


--
-- Name: stores stores_slug_key676; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key676 UNIQUE (slug);


--
-- Name: stores stores_slug_key677; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key677 UNIQUE (slug);


--
-- Name: stores stores_slug_key678; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key678 UNIQUE (slug);


--
-- Name: stores stores_slug_key679; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key679 UNIQUE (slug);


--
-- Name: stores stores_slug_key68; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key68 UNIQUE (slug);


--
-- Name: stores stores_slug_key680; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key680 UNIQUE (slug);


--
-- Name: stores stores_slug_key681; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key681 UNIQUE (slug);


--
-- Name: stores stores_slug_key682; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key682 UNIQUE (slug);


--
-- Name: stores stores_slug_key683; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key683 UNIQUE (slug);


--
-- Name: stores stores_slug_key684; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key684 UNIQUE (slug);


--
-- Name: stores stores_slug_key685; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key685 UNIQUE (slug);


--
-- Name: stores stores_slug_key686; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key686 UNIQUE (slug);


--
-- Name: stores stores_slug_key687; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key687 UNIQUE (slug);


--
-- Name: stores stores_slug_key688; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key688 UNIQUE (slug);


--
-- Name: stores stores_slug_key689; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key689 UNIQUE (slug);


--
-- Name: stores stores_slug_key69; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key69 UNIQUE (slug);


--
-- Name: stores stores_slug_key690; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key690 UNIQUE (slug);


--
-- Name: stores stores_slug_key691; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key691 UNIQUE (slug);


--
-- Name: stores stores_slug_key692; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key692 UNIQUE (slug);


--
-- Name: stores stores_slug_key693; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key693 UNIQUE (slug);


--
-- Name: stores stores_slug_key694; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key694 UNIQUE (slug);


--
-- Name: stores stores_slug_key695; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key695 UNIQUE (slug);


--
-- Name: stores stores_slug_key696; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key696 UNIQUE (slug);


--
-- Name: stores stores_slug_key697; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key697 UNIQUE (slug);


--
-- Name: stores stores_slug_key698; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key698 UNIQUE (slug);


--
-- Name: stores stores_slug_key699; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key699 UNIQUE (slug);


--
-- Name: stores stores_slug_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key7 UNIQUE (slug);


--
-- Name: stores stores_slug_key70; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key70 UNIQUE (slug);


--
-- Name: stores stores_slug_key700; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key700 UNIQUE (slug);


--
-- Name: stores stores_slug_key701; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key701 UNIQUE (slug);


--
-- Name: stores stores_slug_key702; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key702 UNIQUE (slug);


--
-- Name: stores stores_slug_key703; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key703 UNIQUE (slug);


--
-- Name: stores stores_slug_key704; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key704 UNIQUE (slug);


--
-- Name: stores stores_slug_key705; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key705 UNIQUE (slug);


--
-- Name: stores stores_slug_key706; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key706 UNIQUE (slug);


--
-- Name: stores stores_slug_key707; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key707 UNIQUE (slug);


--
-- Name: stores stores_slug_key708; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key708 UNIQUE (slug);


--
-- Name: stores stores_slug_key709; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key709 UNIQUE (slug);


--
-- Name: stores stores_slug_key71; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key71 UNIQUE (slug);


--
-- Name: stores stores_slug_key710; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key710 UNIQUE (slug);


--
-- Name: stores stores_slug_key711; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key711 UNIQUE (slug);


--
-- Name: stores stores_slug_key712; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key712 UNIQUE (slug);


--
-- Name: stores stores_slug_key713; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key713 UNIQUE (slug);


--
-- Name: stores stores_slug_key714; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key714 UNIQUE (slug);


--
-- Name: stores stores_slug_key715; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key715 UNIQUE (slug);


--
-- Name: stores stores_slug_key716; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key716 UNIQUE (slug);


--
-- Name: stores stores_slug_key717; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key717 UNIQUE (slug);


--
-- Name: stores stores_slug_key718; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key718 UNIQUE (slug);


--
-- Name: stores stores_slug_key719; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key719 UNIQUE (slug);


--
-- Name: stores stores_slug_key72; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key72 UNIQUE (slug);


--
-- Name: stores stores_slug_key720; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key720 UNIQUE (slug);


--
-- Name: stores stores_slug_key721; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key721 UNIQUE (slug);


--
-- Name: stores stores_slug_key722; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key722 UNIQUE (slug);


--
-- Name: stores stores_slug_key723; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key723 UNIQUE (slug);


--
-- Name: stores stores_slug_key724; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key724 UNIQUE (slug);


--
-- Name: stores stores_slug_key725; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key725 UNIQUE (slug);


--
-- Name: stores stores_slug_key726; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key726 UNIQUE (slug);


--
-- Name: stores stores_slug_key727; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key727 UNIQUE (slug);


--
-- Name: stores stores_slug_key728; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key728 UNIQUE (slug);


--
-- Name: stores stores_slug_key729; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key729 UNIQUE (slug);


--
-- Name: stores stores_slug_key73; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key73 UNIQUE (slug);


--
-- Name: stores stores_slug_key730; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key730 UNIQUE (slug);


--
-- Name: stores stores_slug_key731; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key731 UNIQUE (slug);


--
-- Name: stores stores_slug_key732; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key732 UNIQUE (slug);


--
-- Name: stores stores_slug_key733; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key733 UNIQUE (slug);


--
-- Name: stores stores_slug_key734; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key734 UNIQUE (slug);


--
-- Name: stores stores_slug_key735; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key735 UNIQUE (slug);


--
-- Name: stores stores_slug_key736; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key736 UNIQUE (slug);


--
-- Name: stores stores_slug_key737; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key737 UNIQUE (slug);


--
-- Name: stores stores_slug_key738; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key738 UNIQUE (slug);


--
-- Name: stores stores_slug_key739; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key739 UNIQUE (slug);


--
-- Name: stores stores_slug_key74; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key74 UNIQUE (slug);


--
-- Name: stores stores_slug_key740; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key740 UNIQUE (slug);


--
-- Name: stores stores_slug_key741; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key741 UNIQUE (slug);


--
-- Name: stores stores_slug_key742; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key742 UNIQUE (slug);


--
-- Name: stores stores_slug_key743; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key743 UNIQUE (slug);


--
-- Name: stores stores_slug_key744; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key744 UNIQUE (slug);


--
-- Name: stores stores_slug_key745; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key745 UNIQUE (slug);


--
-- Name: stores stores_slug_key746; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key746 UNIQUE (slug);


--
-- Name: stores stores_slug_key747; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key747 UNIQUE (slug);


--
-- Name: stores stores_slug_key748; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key748 UNIQUE (slug);


--
-- Name: stores stores_slug_key749; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key749 UNIQUE (slug);


--
-- Name: stores stores_slug_key75; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key75 UNIQUE (slug);


--
-- Name: stores stores_slug_key750; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key750 UNIQUE (slug);


--
-- Name: stores stores_slug_key751; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key751 UNIQUE (slug);


--
-- Name: stores stores_slug_key752; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key752 UNIQUE (slug);


--
-- Name: stores stores_slug_key753; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key753 UNIQUE (slug);


--
-- Name: stores stores_slug_key754; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key754 UNIQUE (slug);


--
-- Name: stores stores_slug_key755; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key755 UNIQUE (slug);


--
-- Name: stores stores_slug_key756; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key756 UNIQUE (slug);


--
-- Name: stores stores_slug_key757; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key757 UNIQUE (slug);


--
-- Name: stores stores_slug_key758; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key758 UNIQUE (slug);


--
-- Name: stores stores_slug_key759; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key759 UNIQUE (slug);


--
-- Name: stores stores_slug_key76; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key76 UNIQUE (slug);


--
-- Name: stores stores_slug_key760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key760 UNIQUE (slug);


--
-- Name: stores stores_slug_key761; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key761 UNIQUE (slug);


--
-- Name: stores stores_slug_key762; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key762 UNIQUE (slug);


--
-- Name: stores stores_slug_key763; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key763 UNIQUE (slug);


--
-- Name: stores stores_slug_key764; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key764 UNIQUE (slug);


--
-- Name: stores stores_slug_key765; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key765 UNIQUE (slug);


--
-- Name: stores stores_slug_key766; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key766 UNIQUE (slug);


--
-- Name: stores stores_slug_key767; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key767 UNIQUE (slug);


--
-- Name: stores stores_slug_key768; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key768 UNIQUE (slug);


--
-- Name: stores stores_slug_key769; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key769 UNIQUE (slug);


--
-- Name: stores stores_slug_key77; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key77 UNIQUE (slug);


--
-- Name: stores stores_slug_key770; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key770 UNIQUE (slug);


--
-- Name: stores stores_slug_key771; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key771 UNIQUE (slug);


--
-- Name: stores stores_slug_key772; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key772 UNIQUE (slug);


--
-- Name: stores stores_slug_key773; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key773 UNIQUE (slug);


--
-- Name: stores stores_slug_key774; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key774 UNIQUE (slug);


--
-- Name: stores stores_slug_key775; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key775 UNIQUE (slug);


--
-- Name: stores stores_slug_key776; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key776 UNIQUE (slug);


--
-- Name: stores stores_slug_key777; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key777 UNIQUE (slug);


--
-- Name: stores stores_slug_key778; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key778 UNIQUE (slug);


--
-- Name: stores stores_slug_key779; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key779 UNIQUE (slug);


--
-- Name: stores stores_slug_key78; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key78 UNIQUE (slug);


--
-- Name: stores stores_slug_key780; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key780 UNIQUE (slug);


--
-- Name: stores stores_slug_key781; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key781 UNIQUE (slug);


--
-- Name: stores stores_slug_key782; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key782 UNIQUE (slug);


--
-- Name: stores stores_slug_key783; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key783 UNIQUE (slug);


--
-- Name: stores stores_slug_key784; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key784 UNIQUE (slug);


--
-- Name: stores stores_slug_key785; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key785 UNIQUE (slug);


--
-- Name: stores stores_slug_key786; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key786 UNIQUE (slug);


--
-- Name: stores stores_slug_key787; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key787 UNIQUE (slug);


--
-- Name: stores stores_slug_key788; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key788 UNIQUE (slug);


--
-- Name: stores stores_slug_key789; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key789 UNIQUE (slug);


--
-- Name: stores stores_slug_key79; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key79 UNIQUE (slug);


--
-- Name: stores stores_slug_key790; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key790 UNIQUE (slug);


--
-- Name: stores stores_slug_key791; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key791 UNIQUE (slug);


--
-- Name: stores stores_slug_key792; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key792 UNIQUE (slug);


--
-- Name: stores stores_slug_key793; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key793 UNIQUE (slug);


--
-- Name: stores stores_slug_key794; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key794 UNIQUE (slug);


--
-- Name: stores stores_slug_key795; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key795 UNIQUE (slug);


--
-- Name: stores stores_slug_key796; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key796 UNIQUE (slug);


--
-- Name: stores stores_slug_key797; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key797 UNIQUE (slug);


--
-- Name: stores stores_slug_key798; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key798 UNIQUE (slug);


--
-- Name: stores stores_slug_key799; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key799 UNIQUE (slug);


--
-- Name: stores stores_slug_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key8 UNIQUE (slug);


--
-- Name: stores stores_slug_key80; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key80 UNIQUE (slug);


--
-- Name: stores stores_slug_key800; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key800 UNIQUE (slug);


--
-- Name: stores stores_slug_key801; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key801 UNIQUE (slug);


--
-- Name: stores stores_slug_key802; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key802 UNIQUE (slug);


--
-- Name: stores stores_slug_key803; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key803 UNIQUE (slug);


--
-- Name: stores stores_slug_key804; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key804 UNIQUE (slug);


--
-- Name: stores stores_slug_key805; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key805 UNIQUE (slug);


--
-- Name: stores stores_slug_key806; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key806 UNIQUE (slug);


--
-- Name: stores stores_slug_key807; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key807 UNIQUE (slug);


--
-- Name: stores stores_slug_key808; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key808 UNIQUE (slug);


--
-- Name: stores stores_slug_key809; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key809 UNIQUE (slug);


--
-- Name: stores stores_slug_key81; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key81 UNIQUE (slug);


--
-- Name: stores stores_slug_key810; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key810 UNIQUE (slug);


--
-- Name: stores stores_slug_key811; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key811 UNIQUE (slug);


--
-- Name: stores stores_slug_key812; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key812 UNIQUE (slug);


--
-- Name: stores stores_slug_key813; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key813 UNIQUE (slug);


--
-- Name: stores stores_slug_key814; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key814 UNIQUE (slug);


--
-- Name: stores stores_slug_key815; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key815 UNIQUE (slug);


--
-- Name: stores stores_slug_key816; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key816 UNIQUE (slug);


--
-- Name: stores stores_slug_key817; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key817 UNIQUE (slug);


--
-- Name: stores stores_slug_key818; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key818 UNIQUE (slug);


--
-- Name: stores stores_slug_key819; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key819 UNIQUE (slug);


--
-- Name: stores stores_slug_key82; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key82 UNIQUE (slug);


--
-- Name: stores stores_slug_key820; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key820 UNIQUE (slug);


--
-- Name: stores stores_slug_key821; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key821 UNIQUE (slug);


--
-- Name: stores stores_slug_key822; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key822 UNIQUE (slug);


--
-- Name: stores stores_slug_key823; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key823 UNIQUE (slug);


--
-- Name: stores stores_slug_key824; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key824 UNIQUE (slug);


--
-- Name: stores stores_slug_key825; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key825 UNIQUE (slug);


--
-- Name: stores stores_slug_key826; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key826 UNIQUE (slug);


--
-- Name: stores stores_slug_key827; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key827 UNIQUE (slug);


--
-- Name: stores stores_slug_key828; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key828 UNIQUE (slug);


--
-- Name: stores stores_slug_key829; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key829 UNIQUE (slug);


--
-- Name: stores stores_slug_key83; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key83 UNIQUE (slug);


--
-- Name: stores stores_slug_key830; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key830 UNIQUE (slug);


--
-- Name: stores stores_slug_key831; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key831 UNIQUE (slug);


--
-- Name: stores stores_slug_key832; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key832 UNIQUE (slug);


--
-- Name: stores stores_slug_key833; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key833 UNIQUE (slug);


--
-- Name: stores stores_slug_key834; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key834 UNIQUE (slug);


--
-- Name: stores stores_slug_key835; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key835 UNIQUE (slug);


--
-- Name: stores stores_slug_key836; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key836 UNIQUE (slug);


--
-- Name: stores stores_slug_key837; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key837 UNIQUE (slug);


--
-- Name: stores stores_slug_key838; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key838 UNIQUE (slug);


--
-- Name: stores stores_slug_key839; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key839 UNIQUE (slug);


--
-- Name: stores stores_slug_key84; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key84 UNIQUE (slug);


--
-- Name: stores stores_slug_key840; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key840 UNIQUE (slug);


--
-- Name: stores stores_slug_key841; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key841 UNIQUE (slug);


--
-- Name: stores stores_slug_key842; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key842 UNIQUE (slug);


--
-- Name: stores stores_slug_key843; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key843 UNIQUE (slug);


--
-- Name: stores stores_slug_key844; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key844 UNIQUE (slug);


--
-- Name: stores stores_slug_key845; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key845 UNIQUE (slug);


--
-- Name: stores stores_slug_key846; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key846 UNIQUE (slug);


--
-- Name: stores stores_slug_key847; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key847 UNIQUE (slug);


--
-- Name: stores stores_slug_key848; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key848 UNIQUE (slug);


--
-- Name: stores stores_slug_key849; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key849 UNIQUE (slug);


--
-- Name: stores stores_slug_key85; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key85 UNIQUE (slug);


--
-- Name: stores stores_slug_key850; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key850 UNIQUE (slug);


--
-- Name: stores stores_slug_key851; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key851 UNIQUE (slug);


--
-- Name: stores stores_slug_key852; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key852 UNIQUE (slug);


--
-- Name: stores stores_slug_key853; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key853 UNIQUE (slug);


--
-- Name: stores stores_slug_key854; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key854 UNIQUE (slug);


--
-- Name: stores stores_slug_key855; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key855 UNIQUE (slug);


--
-- Name: stores stores_slug_key856; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key856 UNIQUE (slug);


--
-- Name: stores stores_slug_key857; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key857 UNIQUE (slug);


--
-- Name: stores stores_slug_key858; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key858 UNIQUE (slug);


--
-- Name: stores stores_slug_key859; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key859 UNIQUE (slug);


--
-- Name: stores stores_slug_key86; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key86 UNIQUE (slug);


--
-- Name: stores stores_slug_key860; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key860 UNIQUE (slug);


--
-- Name: stores stores_slug_key861; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key861 UNIQUE (slug);


--
-- Name: stores stores_slug_key862; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key862 UNIQUE (slug);


--
-- Name: stores stores_slug_key863; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key863 UNIQUE (slug);


--
-- Name: stores stores_slug_key864; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key864 UNIQUE (slug);


--
-- Name: stores stores_slug_key865; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key865 UNIQUE (slug);


--
-- Name: stores stores_slug_key866; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key866 UNIQUE (slug);


--
-- Name: stores stores_slug_key867; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key867 UNIQUE (slug);


--
-- Name: stores stores_slug_key868; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key868 UNIQUE (slug);


--
-- Name: stores stores_slug_key869; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key869 UNIQUE (slug);


--
-- Name: stores stores_slug_key87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key87 UNIQUE (slug);


--
-- Name: stores stores_slug_key870; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key870 UNIQUE (slug);


--
-- Name: stores stores_slug_key871; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key871 UNIQUE (slug);


--
-- Name: stores stores_slug_key872; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key872 UNIQUE (slug);


--
-- Name: stores stores_slug_key873; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key873 UNIQUE (slug);


--
-- Name: stores stores_slug_key874; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key874 UNIQUE (slug);


--
-- Name: stores stores_slug_key875; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key875 UNIQUE (slug);


--
-- Name: stores stores_slug_key876; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key876 UNIQUE (slug);


--
-- Name: stores stores_slug_key877; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key877 UNIQUE (slug);


--
-- Name: stores stores_slug_key878; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key878 UNIQUE (slug);


--
-- Name: stores stores_slug_key879; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key879 UNIQUE (slug);


--
-- Name: stores stores_slug_key88; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key88 UNIQUE (slug);


--
-- Name: stores stores_slug_key880; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key880 UNIQUE (slug);


--
-- Name: stores stores_slug_key881; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key881 UNIQUE (slug);


--
-- Name: stores stores_slug_key882; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key882 UNIQUE (slug);


--
-- Name: stores stores_slug_key883; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key883 UNIQUE (slug);


--
-- Name: stores stores_slug_key884; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key884 UNIQUE (slug);


--
-- Name: stores stores_slug_key885; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key885 UNIQUE (slug);


--
-- Name: stores stores_slug_key886; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key886 UNIQUE (slug);


--
-- Name: stores stores_slug_key887; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key887 UNIQUE (slug);


--
-- Name: stores stores_slug_key888; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key888 UNIQUE (slug);


--
-- Name: stores stores_slug_key889; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key889 UNIQUE (slug);


--
-- Name: stores stores_slug_key89; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key89 UNIQUE (slug);


--
-- Name: stores stores_slug_key890; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key890 UNIQUE (slug);


--
-- Name: stores stores_slug_key891; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key891 UNIQUE (slug);


--
-- Name: stores stores_slug_key892; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key892 UNIQUE (slug);


--
-- Name: stores stores_slug_key893; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key893 UNIQUE (slug);


--
-- Name: stores stores_slug_key894; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key894 UNIQUE (slug);


--
-- Name: stores stores_slug_key895; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key895 UNIQUE (slug);


--
-- Name: stores stores_slug_key896; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key896 UNIQUE (slug);


--
-- Name: stores stores_slug_key897; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key897 UNIQUE (slug);


--
-- Name: stores stores_slug_key898; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key898 UNIQUE (slug);


--
-- Name: stores stores_slug_key899; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key899 UNIQUE (slug);


--
-- Name: stores stores_slug_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key9 UNIQUE (slug);


--
-- Name: stores stores_slug_key90; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key90 UNIQUE (slug);


--
-- Name: stores stores_slug_key900; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key900 UNIQUE (slug);


--
-- Name: stores stores_slug_key901; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key901 UNIQUE (slug);


--
-- Name: stores stores_slug_key902; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key902 UNIQUE (slug);


--
-- Name: stores stores_slug_key903; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key903 UNIQUE (slug);


--
-- Name: stores stores_slug_key904; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key904 UNIQUE (slug);


--
-- Name: stores stores_slug_key905; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key905 UNIQUE (slug);


--
-- Name: stores stores_slug_key906; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key906 UNIQUE (slug);


--
-- Name: stores stores_slug_key907; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key907 UNIQUE (slug);


--
-- Name: stores stores_slug_key908; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key908 UNIQUE (slug);


--
-- Name: stores stores_slug_key909; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key909 UNIQUE (slug);


--
-- Name: stores stores_slug_key91; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key91 UNIQUE (slug);


--
-- Name: stores stores_slug_key910; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key910 UNIQUE (slug);


--
-- Name: stores stores_slug_key911; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key911 UNIQUE (slug);


--
-- Name: stores stores_slug_key912; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key912 UNIQUE (slug);


--
-- Name: stores stores_slug_key913; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key913 UNIQUE (slug);


--
-- Name: stores stores_slug_key914; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key914 UNIQUE (slug);


--
-- Name: stores stores_slug_key915; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key915 UNIQUE (slug);


--
-- Name: stores stores_slug_key916; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key916 UNIQUE (slug);


--
-- Name: stores stores_slug_key917; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key917 UNIQUE (slug);


--
-- Name: stores stores_slug_key918; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key918 UNIQUE (slug);


--
-- Name: stores stores_slug_key919; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key919 UNIQUE (slug);


--
-- Name: stores stores_slug_key92; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key92 UNIQUE (slug);


--
-- Name: stores stores_slug_key920; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key920 UNIQUE (slug);


--
-- Name: stores stores_slug_key921; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key921 UNIQUE (slug);


--
-- Name: stores stores_slug_key922; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key922 UNIQUE (slug);


--
-- Name: stores stores_slug_key923; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key923 UNIQUE (slug);


--
-- Name: stores stores_slug_key924; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key924 UNIQUE (slug);


--
-- Name: stores stores_slug_key925; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key925 UNIQUE (slug);


--
-- Name: stores stores_slug_key926; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key926 UNIQUE (slug);


--
-- Name: stores stores_slug_key927; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key927 UNIQUE (slug);


--
-- Name: stores stores_slug_key928; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key928 UNIQUE (slug);


--
-- Name: stores stores_slug_key929; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key929 UNIQUE (slug);


--
-- Name: stores stores_slug_key93; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key93 UNIQUE (slug);


--
-- Name: stores stores_slug_key930; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key930 UNIQUE (slug);


--
-- Name: stores stores_slug_key931; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key931 UNIQUE (slug);


--
-- Name: stores stores_slug_key932; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key932 UNIQUE (slug);


--
-- Name: stores stores_slug_key933; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key933 UNIQUE (slug);


--
-- Name: stores stores_slug_key934; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key934 UNIQUE (slug);


--
-- Name: stores stores_slug_key935; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key935 UNIQUE (slug);


--
-- Name: stores stores_slug_key936; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key936 UNIQUE (slug);


--
-- Name: stores stores_slug_key937; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key937 UNIQUE (slug);


--
-- Name: stores stores_slug_key938; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key938 UNIQUE (slug);


--
-- Name: stores stores_slug_key939; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key939 UNIQUE (slug);


--
-- Name: stores stores_slug_key94; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key94 UNIQUE (slug);


--
-- Name: stores stores_slug_key940; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key940 UNIQUE (slug);


--
-- Name: stores stores_slug_key941; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key941 UNIQUE (slug);


--
-- Name: stores stores_slug_key942; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key942 UNIQUE (slug);


--
-- Name: stores stores_slug_key943; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key943 UNIQUE (slug);


--
-- Name: stores stores_slug_key944; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key944 UNIQUE (slug);


--
-- Name: stores stores_slug_key945; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key945 UNIQUE (slug);


--
-- Name: stores stores_slug_key946; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key946 UNIQUE (slug);


--
-- Name: stores stores_slug_key947; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key947 UNIQUE (slug);


--
-- Name: stores stores_slug_key948; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key948 UNIQUE (slug);


--
-- Name: stores stores_slug_key949; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key949 UNIQUE (slug);


--
-- Name: stores stores_slug_key95; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key95 UNIQUE (slug);


--
-- Name: stores stores_slug_key950; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key950 UNIQUE (slug);


--
-- Name: stores stores_slug_key951; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key951 UNIQUE (slug);


--
-- Name: stores stores_slug_key952; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key952 UNIQUE (slug);


--
-- Name: stores stores_slug_key953; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key953 UNIQUE (slug);


--
-- Name: stores stores_slug_key954; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key954 UNIQUE (slug);


--
-- Name: stores stores_slug_key955; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key955 UNIQUE (slug);


--
-- Name: stores stores_slug_key956; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key956 UNIQUE (slug);


--
-- Name: stores stores_slug_key957; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key957 UNIQUE (slug);


--
-- Name: stores stores_slug_key958; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key958 UNIQUE (slug);


--
-- Name: stores stores_slug_key959; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key959 UNIQUE (slug);


--
-- Name: stores stores_slug_key96; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key96 UNIQUE (slug);


--
-- Name: stores stores_slug_key960; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key960 UNIQUE (slug);


--
-- Name: stores stores_slug_key961; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key961 UNIQUE (slug);


--
-- Name: stores stores_slug_key962; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key962 UNIQUE (slug);


--
-- Name: stores stores_slug_key963; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key963 UNIQUE (slug);


--
-- Name: stores stores_slug_key964; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key964 UNIQUE (slug);


--
-- Name: stores stores_slug_key965; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key965 UNIQUE (slug);


--
-- Name: stores stores_slug_key966; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key966 UNIQUE (slug);


--
-- Name: stores stores_slug_key967; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key967 UNIQUE (slug);


--
-- Name: stores stores_slug_key968; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key968 UNIQUE (slug);


--
-- Name: stores stores_slug_key969; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key969 UNIQUE (slug);


--
-- Name: stores stores_slug_key97; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key97 UNIQUE (slug);


--
-- Name: stores stores_slug_key970; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key970 UNIQUE (slug);


--
-- Name: stores stores_slug_key971; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key971 UNIQUE (slug);


--
-- Name: stores stores_slug_key972; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key972 UNIQUE (slug);


--
-- Name: stores stores_slug_key973; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key973 UNIQUE (slug);


--
-- Name: stores stores_slug_key974; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key974 UNIQUE (slug);


--
-- Name: stores stores_slug_key975; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key975 UNIQUE (slug);


--
-- Name: stores stores_slug_key976; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key976 UNIQUE (slug);


--
-- Name: stores stores_slug_key977; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key977 UNIQUE (slug);


--
-- Name: stores stores_slug_key978; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key978 UNIQUE (slug);


--
-- Name: stores stores_slug_key979; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key979 UNIQUE (slug);


--
-- Name: stores stores_slug_key98; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key98 UNIQUE (slug);


--
-- Name: stores stores_slug_key980; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key980 UNIQUE (slug);


--
-- Name: stores stores_slug_key981; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key981 UNIQUE (slug);


--
-- Name: stores stores_slug_key982; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key982 UNIQUE (slug);


--
-- Name: stores stores_slug_key983; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key983 UNIQUE (slug);


--
-- Name: stores stores_slug_key984; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key984 UNIQUE (slug);


--
-- Name: stores stores_slug_key985; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key985 UNIQUE (slug);


--
-- Name: stores stores_slug_key986; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key986 UNIQUE (slug);


--
-- Name: stores stores_slug_key987; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key987 UNIQUE (slug);


--
-- Name: stores stores_slug_key988; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key988 UNIQUE (slug);


--
-- Name: stores stores_slug_key989; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key989 UNIQUE (slug);


--
-- Name: stores stores_slug_key99; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key99 UNIQUE (slug);


--
-- Name: stores stores_slug_key990; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key990 UNIQUE (slug);


--
-- Name: stores stores_slug_key991; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key991 UNIQUE (slug);


--
-- Name: stores stores_slug_key992; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key992 UNIQUE (slug);


--
-- Name: stores stores_slug_key993; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key993 UNIQUE (slug);


--
-- Name: stores stores_slug_key994; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key994 UNIQUE (slug);


--
-- Name: stores stores_slug_key995; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key995 UNIQUE (slug);


--
-- Name: stores stores_slug_key996; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key996 UNIQUE (slug);


--
-- Name: stores stores_slug_key997; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key997 UNIQUE (slug);


--
-- Name: stores stores_slug_key998; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key998 UNIQUE (slug);


--
-- Name: stores stores_slug_key999; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_slug_key999 UNIQUE (slug);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: supabase_oauth_tokens supabase_oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY supabase_oauth_tokens
    ADD CONSTRAINT supabase_oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: supabase_oauth_tokens supabase_oauth_tokens_store_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY supabase_oauth_tokens
    ADD CONSTRAINT supabase_oauth_tokens_store_id_key UNIQUE (store_id);


--
-- Name: supabase_project_keys supabase_project_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY supabase_project_keys
    ADD CONSTRAINT supabase_project_keys_pkey PRIMARY KEY (id);


--
-- Name: supabase_project_keys supabase_project_keys_store_id_project_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY supabase_project_keys
    ADD CONSTRAINT supabase_project_keys_store_id_project_id_key UNIQUE (store_id, project_id);


--
-- Name: taxes taxes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY taxes
    ADD CONSTRAINT taxes_pkey PRIMARY KEY (id);


--
-- Name: translations_duplicate translations_duplicate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY translations_duplicate
    ADD CONSTRAINT translations_duplicate_pkey PRIMARY KEY (id);


--
-- Name: translations translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY translations
    ADD CONSTRAINT translations_pkey PRIMARY KEY (id);


--
-- Name: attribute_values unique_attribute_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_values
    ADD CONSTRAINT unique_attribute_code UNIQUE (attribute_id, code);


--
-- Name: plugin_controllers unique_plugin_controller; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_controllers
    ADD CONSTRAINT unique_plugin_controller UNIQUE (plugin_id, method, path);


--
-- Name: plugin_docs unique_plugin_doc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_docs
    ADD CONSTRAINT unique_plugin_doc UNIQUE (plugin_id, doc_type);


--
-- Name: plugin_entities unique_plugin_entity; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_entities
    ADD CONSTRAINT unique_plugin_entity UNIQUE (plugin_id, entity_name);


--
-- Name: plugin_migrations unique_plugin_migration; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_migrations
    ADD CONSTRAINT unique_plugin_migration UNIQUE (plugin_id, migration_version);


--
-- Name: plugin_entities unique_plugin_table; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_entities
    ADD CONSTRAINT unique_plugin_table UNIQUE (plugin_id, table_name);


--
-- Name: plugin_version_tags unique_plugin_tag; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_tags
    ADD CONSTRAINT unique_plugin_tag UNIQUE (plugin_id, tag_name);


--
-- Name: plugin_version_history unique_plugin_version; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_history
    ADD CONSTRAINT unique_plugin_version UNIQUE (plugin_id, version_number);


--
-- Name: plugin_version_comparisons unique_version_comparison; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_comparisons
    ADD CONSTRAINT unique_version_comparison UNIQUE (from_version_id, to_version_id);


--
-- Name: admin_navigation_config uq_navigation_config_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admin_navigation_config
    ADD CONSTRAINT uq_navigation_config_key UNIQUE (nav_key);


--
-- Name: plugin_data uq_plugin_data_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_data
    ADD CONSTRAINT uq_plugin_data_key UNIQUE (plugin_id, data_key);


--
-- Name: plugin_widgets uq_plugin_widget_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_widgets
    ADD CONSTRAINT uq_plugin_widget_id UNIQUE (plugin_id, widget_id);


--
-- Name: usage_metrics usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY usage_metrics
    ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


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

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ab_test_assignments ab_test_assignments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_assignments
    ADD CONSTRAINT ab_test_assignments_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: ab_test_assignments ab_test_assignments_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_assignments
    ADD CONSTRAINT ab_test_assignments_test_id_fkey FOREIGN KEY (test_id) REFERENCES ab_tests(id) ON UPDATE CASCADE;


--
-- Name: ab_test_assignments ab_test_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_assignments
    ADD CONSTRAINT ab_test_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ab_test_variants ab_test_variants_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_test_variants
    ADD CONSTRAINT ab_test_variants_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: ab_tests ab_tests_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ab_tests
    ADD CONSTRAINT ab_tests_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: ai_usage_logs ai_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: akeneo_custom_mappings akeneo_custom_mappings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_custom_mappings
    ADD CONSTRAINT akeneo_custom_mappings_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: akeneo_custom_mappings akeneo_custom_mappings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_custom_mappings
    ADD CONSTRAINT akeneo_custom_mappings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: akeneo_custom_mappings akeneo_custom_mappings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_custom_mappings
    ADD CONSTRAINT akeneo_custom_mappings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: akeneo_import_statistics akeneo_import_statistics_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_import_statistics
    ADD CONSTRAINT akeneo_import_statistics_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: akeneo_mappings akeneo_mappings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_mappings
    ADD CONSTRAINT akeneo_mappings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: akeneo_schedules akeneo_schedules_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY akeneo_schedules
    ADD CONSTRAINT akeneo_schedules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attribute_sets attribute_sets_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_sets
    ADD CONSTRAINT attribute_sets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: attribute_translations attribute_translations_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_translations
    ADD CONSTRAINT attribute_translations_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attribute_translations attribute_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_translations
    ADD CONSTRAINT attribute_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attribute_value_translations attribute_value_translations_attribute_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_value_translations
    ADD CONSTRAINT attribute_value_translations_attribute_value_id_fkey FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attribute_value_translations attribute_value_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_value_translations
    ADD CONSTRAINT attribute_value_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attribute_values attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attribute_values
    ADD CONSTRAINT attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attributes attributes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY attributes
    ADD CONSTRAINT attributes_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: blacklist_countries blacklist_countries_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_countries
    ADD CONSTRAINT blacklist_countries_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: blacklist_emails blacklist_emails_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_emails
    ADD CONSTRAINT blacklist_emails_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: blacklist_ips blacklist_ips_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_ips
    ADD CONSTRAINT blacklist_ips_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: blacklist_settings blacklist_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY blacklist_settings
    ADD CONSTRAINT blacklist_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: brevo_configurations brevo_configurations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY brevo_configurations
    ADD CONSTRAINT brevo_configurations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: canonical_urls canonical_urls_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY canonical_urls
    ADD CONSTRAINT canonical_urls_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: canonical_urls canonical_urls_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY canonical_urls
    ADD CONSTRAINT canonical_urls_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: carts carts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY carts
    ADD CONSTRAINT carts_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;


--
-- Name: categories categories_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY categories
    ADD CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: category_seo category_seo_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY category_seo
    ADD CONSTRAINT category_seo_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: category_seo category_seo_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY category_seo
    ADD CONSTRAINT category_seo_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: category_translations category_translations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY category_translations
    ADD CONSTRAINT category_translations_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: category_translations category_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY category_translations
    ADD CONSTRAINT category_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;


--
-- Name: chat_typing_indicators chat_typing_indicators_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY chat_typing_indicators
    ADD CONSTRAINT chat_typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;


--
-- Name: cms_block_translations cms_block_translations_cms_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_block_translations
    ADD CONSTRAINT cms_block_translations_cms_block_id_fkey FOREIGN KEY (cms_block_id) REFERENCES cms_blocks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_block_translations cms_block_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_block_translations
    ADD CONSTRAINT cms_block_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_blocks cms_blocks_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_blocks
    ADD CONSTRAINT cms_blocks_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_page_seo cms_page_seo_cms_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_page_seo
    ADD CONSTRAINT cms_page_seo_cms_page_id_fkey FOREIGN KEY (cms_page_id) REFERENCES cms_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_page_seo cms_page_seo_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_page_seo
    ADD CONSTRAINT cms_page_seo_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_page_translations cms_page_translations_cms_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_page_translations
    ADD CONSTRAINT cms_page_translations_cms_page_id_fkey FOREIGN KEY (cms_page_id) REFERENCES cms_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_page_translations cms_page_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_page_translations
    ADD CONSTRAINT cms_page_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cms_pages cms_pages_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cms_pages
    ADD CONSTRAINT cms_pages_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: consent_logs consent_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY consent_logs
    ADD CONSTRAINT consent_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: consent_logs consent_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY consent_logs
    ADD CONSTRAINT consent_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cookie_consent_settings cookie_consent_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cookie_consent_settings
    ADD CONSTRAINT cookie_consent_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: coupon_translations coupon_translations_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY coupon_translations
    ADD CONSTRAINT coupon_translations_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupon_translations coupon_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY coupon_translations
    ADD CONSTRAINT coupon_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: coupons coupons_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY coupons
    ADD CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: credit_transactions credit_transactions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_transactions
    ADD CONSTRAINT credit_transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: credit_transactions credit_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_transactions
    ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: credit_usage credit_usage_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_usage
    ADD CONSTRAINT credit_usage_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: credit_usage credit_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credit_usage
    ADD CONSTRAINT credit_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: credits credits_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credits
    ADD CONSTRAINT credits_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: credits credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY credits
    ADD CONSTRAINT credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;


--
-- Name: cron_job_executions cron_job_executions_cron_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_job_executions
    ADD CONSTRAINT cron_job_executions_cron_job_id_fkey FOREIGN KEY (cron_job_id) REFERENCES cron_jobs(id) ON DELETE CASCADE;


--
-- Name: cron_job_executions cron_job_executions_triggered_by_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_job_executions
    ADD CONSTRAINT cron_job_executions_triggered_by_user_fkey FOREIGN KEY (triggered_by_user) REFERENCES users(id);


--
-- Name: cron_jobs cron_jobs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_jobs
    ADD CONSTRAINT cron_jobs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: cron_jobs cron_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cron_jobs
    ADD CONSTRAINT cron_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: custom_analytics_events custom_analytics_events_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_analytics_events
    ADD CONSTRAINT custom_analytics_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: custom_domains custom_domains_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_domains
    ADD CONSTRAINT custom_domains_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: custom_option_rules custom_option_rules_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_option_rules
    ADD CONSTRAINT custom_option_rules_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: custom_pricing_discounts custom_pricing_discounts_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_pricing_discounts
    ADD CONSTRAINT custom_pricing_discounts_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES custom_pricing_rules(id) ON DELETE CASCADE;


--
-- Name: custom_pricing_logs custom_pricing_logs_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY custom_pricing_logs
    ADD CONSTRAINT custom_pricing_logs_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES custom_pricing_rules(id);


--
-- Name: customer_activities customer_activities_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_activities
    ADD CONSTRAINT customer_activities_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_activities customer_activities_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_activities
    ADD CONSTRAINT customer_activities_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: customer_activities customer_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_activities
    ADD CONSTRAINT customer_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customer_addresses customer_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customer_addresses
    ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY customers
    ADD CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: delivery_settings delivery_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY delivery_settings
    ADD CONSTRAINT delivery_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: email_send_logs email_send_logs_email_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_send_logs
    ADD CONSTRAINT email_send_logs_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: email_send_logs email_send_logs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_send_logs
    ADD CONSTRAINT email_send_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: email_template_translations email_template_translations_email_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_template_translations
    ADD CONSTRAINT email_template_translations_email_template_id_fkey FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_templates email_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY email_templates
    ADD CONSTRAINT email_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: cookie_consent_settings_translations fk_cookie_consent_settings; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY cookie_consent_settings_translations
    ADD CONSTRAINT fk_cookie_consent_settings FOREIGN KEY (cookie_consent_settings_id) REFERENCES cookie_consent_settings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: admin_navigation_registry fk_navigation_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY admin_navigation_registry
    ADD CONSTRAINT fk_navigation_parent FOREIGN KEY (parent_key) REFERENCES admin_navigation_registry(key) ON DELETE CASCADE;


--
-- Name: plugin_version_comparisons fk_plugin_comparison_from; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_comparisons
    ADD CONSTRAINT fk_plugin_comparison_from FOREIGN KEY (from_version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;


--
-- Name: plugin_version_comparisons fk_plugin_comparison_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_comparisons
    ADD CONSTRAINT fk_plugin_comparison_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_version_comparisons fk_plugin_comparison_to; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_comparisons
    ADD CONSTRAINT fk_plugin_comparison_to FOREIGN KEY (to_version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;


--
-- Name: plugin_controllers fk_plugin_controllers_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_controllers
    ADD CONSTRAINT fk_plugin_controllers_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_docs fk_plugin_docs_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_docs
    ADD CONSTRAINT fk_plugin_docs_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_entities fk_plugin_entities_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_entities
    ADD CONSTRAINT fk_plugin_entities_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_migrations fk_plugin_migrations_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_migrations
    ADD CONSTRAINT fk_plugin_migrations_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_version_patches fk_plugin_patch_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_patches
    ADD CONSTRAINT fk_plugin_patch_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_version_patches fk_plugin_patch_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_patches
    ADD CONSTRAINT fk_plugin_patch_version FOREIGN KEY (version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;


--
-- Name: plugin_version_snapshots fk_plugin_snapshot_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_snapshots
    ADD CONSTRAINT fk_plugin_snapshot_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_version_snapshots fk_plugin_snapshot_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_snapshots
    ADD CONSTRAINT fk_plugin_snapshot_version FOREIGN KEY (version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;


--
-- Name: plugin_version_tags fk_plugin_tag_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_tags
    ADD CONSTRAINT fk_plugin_tag_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: plugin_version_tags fk_plugin_tag_version; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_tags
    ADD CONSTRAINT fk_plugin_tag_version FOREIGN KEY (version_id) REFERENCES plugin_version_history(id) ON DELETE CASCADE;


--
-- Name: plugin_version_history fk_plugin_version_parent; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_history
    ADD CONSTRAINT fk_plugin_version_parent FOREIGN KEY (parent_version_id) REFERENCES plugin_version_history(id) ON DELETE SET NULL;


--
-- Name: plugin_version_history fk_plugin_version_plugin; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_version_history
    ADD CONSTRAINT fk_plugin_version_plugin FOREIGN KEY (plugin_id) REFERENCES plugin_registry(id) ON DELETE CASCADE;


--
-- Name: heatmap_aggregations heatmap_aggregations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_aggregations
    ADD CONSTRAINT heatmap_aggregations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: heatmap_interactions heatmap_interactions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_interactions
    ADD CONSTRAINT heatmap_interactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: heatmap_interactions heatmap_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_interactions
    ADD CONSTRAINT heatmap_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: heatmap_sessions heatmap_sessions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_sessions
    ADD CONSTRAINT heatmap_sessions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: heatmap_sessions heatmap_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY heatmap_sessions
    ADD CONSTRAINT heatmap_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: integration_configs integration_configs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY integration_configs
    ADD CONSTRAINT integration_configs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);


--
-- Name: job_history job_history_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY job_history
    ADD CONSTRAINT job_history_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY jobs
    ADD CONSTRAINT jobs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY jobs
    ADD CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;


--
-- Name: media_assets media_assets_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY media_assets
    ADD CONSTRAINT media_assets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: media_assets media_assets_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY media_assets
    ADD CONSTRAINT media_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id);


--
-- Name: payment_method_translations payment_method_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY payment_method_translations
    ADD CONSTRAINT payment_method_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_method_translations payment_method_translations_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY payment_method_translations
    ADD CONSTRAINT payment_method_translations_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payment_methods payment_methods_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY payment_methods
    ADD CONSTRAINT payment_methods_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: pdf_template_translations pdf_template_translations_pdf_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY pdf_template_translations
    ADD CONSTRAINT pdf_template_translations_pdf_template_id_fkey FOREIGN KEY (pdf_template_id) REFERENCES pdf_templates(id) ON DELETE CASCADE;


--
-- Name: pdf_templates pdf_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY pdf_templates
    ADD CONSTRAINT pdf_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: platform_admins platform_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY platform_admins
    ADD CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE;


--
-- Name: plugin_configurations plugin_configurations_last_configured_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_configurations
    ADD CONSTRAINT plugin_configurations_last_configured_by_fkey FOREIGN KEY (last_configured_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plugin_configurations plugin_configurations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_configurations
    ADD CONSTRAINT plugin_configurations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plugin_marketplace plugin_marketplace_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_marketplace
    ADD CONSTRAINT plugin_marketplace_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);


--
-- Name: plugin_registry plugin_registry_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY plugin_registry
    ADD CONSTRAINT plugin_registry_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES users(id);


--
-- Name: product_attribute_values product_attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_attribute_values
    ADD CONSTRAINT product_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON UPDATE CASCADE;


--
-- Name: product_attribute_values product_attribute_values_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_attribute_values
    ADD CONSTRAINT product_attribute_values_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE;


--
-- Name: product_attribute_values product_attribute_values_value_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_attribute_values
    ADD CONSTRAINT product_attribute_values_value_id_fkey FOREIGN KEY (value_id) REFERENCES attribute_values(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_label_translations product_label_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_label_translations
    ADD CONSTRAINT product_label_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_label_translations product_label_translations_product_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_label_translations
    ADD CONSTRAINT product_label_translations_product_label_id_fkey FOREIGN KEY (product_label_id) REFERENCES product_labels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_labels product_labels_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_labels
    ADD CONSTRAINT product_labels_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: product_seo product_seo_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_seo
    ADD CONSTRAINT product_seo_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_seo product_seo_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_seo
    ADD CONSTRAINT product_seo_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tab_translations product_tab_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_tab_translations
    ADD CONSTRAINT product_tab_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tab_translations product_tab_translations_product_tab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_tab_translations
    ADD CONSTRAINT product_tab_translations_product_tab_id_fkey FOREIGN KEY (product_tab_id) REFERENCES product_tabs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_tabs product_tabs_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_tabs
    ADD CONSTRAINT product_tabs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: product_translations product_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_translations
    ADD CONSTRAINT product_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_translations product_translations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_translations
    ADD CONSTRAINT product_translations_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_variants product_variants_parent_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_variants
    ADD CONSTRAINT product_variants_parent_product_id_fkey FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_variant_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY product_variants
    ADD CONSTRAINT product_variants_variant_product_id_fkey FOREIGN KEY (variant_product_id) REFERENCES products(id) ON DELETE CASCADE;


--
-- Name: products products_attribute_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY products
    ADD CONSTRAINT products_attribute_set_id_fkey FOREIGN KEY (attribute_set_id) REFERENCES attribute_sets(id) ON DELETE SET NULL;


--
-- Name: products products_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY products
    ADD CONSTRAINT products_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES products(id) ON DELETE CASCADE;


--
-- Name: products products_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: redirects redirects_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY redirects
    ADD CONSTRAINT redirects_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: sales_invoices sales_invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_invoices
    ADD CONSTRAINT sales_invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES sales_orders(id);


--
-- Name: sales_invoices sales_invoices_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_invoices
    ADD CONSTRAINT sales_invoices_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);


--
-- Name: sales_order_items sales_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_order_items
    ADD CONSTRAINT sales_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_order_items sales_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_order_items
    ADD CONSTRAINT sales_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_orders sales_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_orders
    ADD CONSTRAINT sales_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales_orders sales_orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_orders
    ADD CONSTRAINT sales_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sales_shipments sales_shipments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_shipments
    ADD CONSTRAINT sales_shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES sales_orders(id);


--
-- Name: sales_shipments sales_shipments_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY sales_shipments
    ADD CONSTRAINT sales_shipments_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);


--
-- Name: seo_settings seo_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY seo_settings
    ADD CONSTRAINT seo_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: seo_templates seo_templates_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY seo_templates
    ADD CONSTRAINT seo_templates_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: shipping_method_translations shipping_method_translations_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shipping_method_translations
    ADD CONSTRAINT shipping_method_translations_language_code_fkey FOREIGN KEY (language_code) REFERENCES languages(code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_method_translations shipping_method_translations_shipping_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shipping_method_translations
    ADD CONSTRAINT shipping_method_translations_shipping_method_id_fkey FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: shipping_methods shipping_methods_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shipping_methods
    ADD CONSTRAINT shipping_methods_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: shopify_oauth_tokens shopify_oauth_tokens_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY shopify_oauth_tokens
    ADD CONSTRAINT shopify_oauth_tokens_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: slot_configurations slot_configurations_acceptance_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_acceptance_published_by_fkey FOREIGN KEY (acceptance_published_by) REFERENCES users(id);


--
-- Name: slot_configurations slot_configurations_current_edit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_current_edit_id_fkey FOREIGN KEY (current_edit_id) REFERENCES slot_configurations(id);


--
-- Name: slot_configurations slot_configurations_parent_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES slot_configurations(id);


--
-- Name: slot_configurations slot_configurations_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_published_by_fkey FOREIGN KEY (published_by) REFERENCES users(id);


--
-- Name: slot_configurations slot_configurations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: slot_configurations slot_configurations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY slot_configurations
    ADD CONSTRAINT slot_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_invitations store_invitations_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_invitations
    ADD CONSTRAINT store_invitations_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES users(id);


--
-- Name: store_invitations store_invitations_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_invitations
    ADD CONSTRAINT store_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id);


--
-- Name: store_invitations store_invitations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_invitations
    ADD CONSTRAINT store_invitations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_teams store_teams_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_teams
    ADD CONSTRAINT store_teams_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id);


--
-- Name: store_teams store_teams_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_teams
    ADD CONSTRAINT store_teams_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_teams store_teams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_teams
    ADD CONSTRAINT store_teams_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: store_uptime store_uptime_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_uptime
    ADD CONSTRAINT store_uptime_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: store_uptime store_uptime_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY store_uptime
    ADD CONSTRAINT store_uptime_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: stores stores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY stores
    ADD CONSTRAINT stores_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY subscriptions
    ADD CONSTRAINT subscriptions_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: supabase_oauth_tokens supabase_oauth_tokens_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY supabase_oauth_tokens
    ADD CONSTRAINT supabase_oauth_tokens_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: supabase_project_keys supabase_project_keys_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY supabase_project_keys
    ADD CONSTRAINT supabase_project_keys_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: taxes taxes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY taxes
    ADD CONSTRAINT taxes_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;


--
-- Name: translations_duplicate translations_duplicate_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY translations_duplicate
    ADD CONSTRAINT translations_duplicate_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);


--
-- Name: translations translations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY translations
    ADD CONSTRAINT translations_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id);


--
-- Name: usage_metrics usage_metrics_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY usage_metrics
    ADD CONSTRAINT usage_metrics_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: wishlists wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY wishlists
    ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE;


--
-- Name: wishlists wishlists_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY wishlists
    ADD CONSTRAINT wishlists_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON UPDATE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY wishlists
    ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;

