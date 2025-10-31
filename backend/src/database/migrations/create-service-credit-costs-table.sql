-- Migration: Create service_credit_costs table
-- Purpose: Master table to manage credit costs for all services
-- Created: 2025-10-31

-- Create enum for service categories
CREATE TYPE service_category AS ENUM (
  'store_operations',
  'plugin_management',
  'ai_services',
  'data_migration',
  'storage',
  'akeneo_integration',
  'other'
);

-- Create enum for billing types
CREATE TYPE billing_type AS ENUM (
  'per_day',
  'per_use',
  'per_month',
  'per_hour',
  'per_item',
  'per_mb',
  'flat_rate'
);

-- Create the master credit costs table
CREATE TABLE IF NOT EXISTS service_credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service identification
  service_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'store_daily_publishing', 'plugin_install'
  service_name VARCHAR(255) NOT NULL, -- Human-readable name
  service_category service_category NOT NULL,
  description TEXT,

  -- Cost configuration
  cost_per_unit DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
  billing_type billing_type NOT NULL,

  -- Status and visibility
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_visible BOOLEAN NOT NULL DEFAULT true, -- Show in pricing pages

  -- Additional configuration
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible config: limits, tiers, etc.

  -- Display order and grouping
  display_order INTEGER DEFAULT 0,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create indexes
CREATE INDEX idx_service_credit_costs_category ON service_credit_costs(service_category);
CREATE INDEX idx_service_credit_costs_active ON service_credit_costs(is_active);
CREATE INDEX idx_service_credit_costs_key ON service_credit_costs(service_key);
CREATE INDEX idx_service_credit_costs_display_order ON service_credit_costs(display_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_service_credit_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_credit_costs_updated_at
  BEFORE UPDATE ON service_credit_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_credit_costs_updated_at();

-- Insert initial service cost data
INSERT INTO service_credit_costs (service_key, service_name, service_category, description, cost_per_unit, billing_type, is_active, is_visible, display_order, metadata) VALUES

-- Store Operations
('store_daily_publishing', 'Store Daily Publishing', 'store_operations', 'Daily hosting fee for published stores', 1.0000, 'per_day', true, true, 10, '{"note": "Charged daily at midnight UTC"}'),
('store_deployment', 'Store Deployment', 'store_operations', 'One-time deployment of a new store', 0.0000, 'per_use', true, true, 11, '{"note": "Currently free"}'),
('store_backup', 'Store Backup', 'store_operations', 'Manual store backup creation', 0.5000, 'per_use', true, true, 12, '{"note": "Automated backups included"}'),

-- Plugin Management
('plugin_install', 'Plugin Installation', 'plugin_management', 'Installing a plugin to a store', 2.0000, 'per_use', true, true, 20, '{"note": "One-time charge per plugin per store"}'),
('plugin_monthly', 'Premium Plugin Monthly Fee', 'plugin_management', 'Monthly subscription for premium plugins', 5.0000, 'per_month', true, true, 21, '{"applies_to": "premium_plugins_only"}'),
('custom_plugin_creation', 'Custom Plugin Creation', 'plugin_management', 'Creating a custom plugin with AI', 50.0000, 'per_use', true, true, 22, '{"note": "AI-powered plugin generation"}'),

-- AI Services
('ai_translation', 'AI Translation (Legacy)', 'ai_services', 'AI-powered content translation - flat rate', 0.1000, 'per_use', false, false, 30, '{"note": "Deprecated - use ai_translation_token instead", "deprecated": true}'),
('ai_translation_token', 'AI Translation', 'ai_services', 'AI-powered content translation - token based', 0.0001, 'per_item', true, true, 31, '{"note": "Per token (approx 4 chars)", "base_rate": 0.0001, "calculation": "tokens * rate", "min_charge": 0.01, "token_ratio": 3.5}'),
('ai_product_description', 'AI Product Description', 'ai_services', 'AI-generated product descriptions', 0.2000, 'per_item', true, true, 32, '{"note": "Per product"}'),
('ai_seo_optimization', 'AI SEO Optimization', 'ai_services', 'AI-powered SEO analysis and optimization', 0.5000, 'per_use', true, true, 32, '{"note": "Per page or product"}'),
('ai_code_patch', 'AI Code Modification', 'ai_services', 'AI-powered code editing and patching', 25.0000, 'per_use', true, true, 33, '{"note": "Per code modification"}'),
('ai_layout_generation', 'AI Layout Generation', 'ai_services', 'AI-generated page layouts and designs', 40.0000, 'per_use', true, true, 34, '{"note": "Per layout generation"}'),
('ai_chat', 'AI General Chat', 'ai_services', 'General AI assistant interactions', 10.0000, 'per_use', true, true, 35, '{"note": "Per chat session"}'),

-- Data Migration
('product_import', 'Product Import', 'data_migration', 'Bulk product import', 0.01, 'per_item', true, true, 40, '{"note": "Per product imported", "min_charge": 1}'),
('shopify_migration', 'Shopify Store Migration', 'data_migration', 'Full store migration from Shopify', 25.0000, 'flat_rate', true, true, 41, '{"note": "Includes products, customers, orders"}'),
('csv_import', 'CSV Data Import', 'data_migration', 'Import data from CSV files', 1.0000, 'per_use', true, true, 42, '{"note": "Per CSV file, up to 10,000 rows"}'),

-- Akeneo Integration
('akeneo_schedule_run', 'Akeneo Scheduled Import', 'akeneo_integration', 'Automated Akeneo data synchronization', 0.1000, 'per_use', true, true, 50, '{"note": "Per scheduled execution"}'),
('akeneo_manual_import', 'Akeneo Manual Import', 'akeneo_integration', 'Manual Akeneo data import', 0.1000, 'per_use', true, true, 51, '{"note": "On-demand import"}'),
('akeneo_setup', 'Akeneo Integration Setup', 'akeneo_integration', 'Initial Akeneo integration configuration', 5.0000, 'per_use', true, true, 52, '{"note": "One-time setup fee"}'),

-- Storage
('storage_per_gb', 'Additional Storage', 'storage', 'Additional storage beyond free tier', 0.5000, 'per_mb', true, true, 60, '{"free_tier_gb": 1, "note": "Per GB per month"}'),
('image_optimization', 'Image Optimization', 'storage', 'Automatic image optimization and compression', 0.01, 'per_item', true, true, 61, '{"note": "Per image"}'),
('cdn_bandwidth', 'CDN Bandwidth', 'storage', 'Content delivery network bandwidth', 0.001, 'per_mb', true, true, 62, '{"free_tier_gb": 10, "note": "Per GB"}'),

-- Other Services
('api_rate_boost', 'API Rate Limit Boost', 'other', 'Increase API rate limits', 10.0000, 'per_month', true, true, 70, '{"boost_multiplier": 10}'),
('priority_support', 'Priority Support', 'other', 'Priority customer support', 15.0000, 'per_month', true, true, 71, '{"sla": "4 hours"}'),
('custom_domain', 'Custom Domain Setup', 'other', 'Configure custom domain for store', 2.0000, 'per_use', true, true, 72, '{"note": "One-time setup fee"}');

-- Add comment to table
COMMENT ON TABLE service_credit_costs IS 'Master table for managing credit costs across all services';
COMMENT ON COLUMN service_credit_costs.service_key IS 'Unique identifier for the service, used in code';
COMMENT ON COLUMN service_credit_costs.cost_per_unit IS 'Credit cost per unit of service';
COMMENT ON COLUMN service_credit_costs.billing_type IS 'How the service is billed';
COMMENT ON COLUMN service_credit_costs.metadata IS 'Additional configuration like free tiers, limits, notes';
