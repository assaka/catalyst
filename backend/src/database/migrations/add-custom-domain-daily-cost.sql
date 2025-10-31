-- Migration: Add custom domain daily cost to service_credit_costs
-- Purpose: Add daily billing for active custom domains
-- Created: 2025-11-01

-- Insert custom domain daily cost service
INSERT INTO service_credit_costs (
  service_key,
  service_name,
  service_category,
  description,
  cost_per_unit,
  billing_type,
  is_active,
  is_visible,
  display_order,
  metadata
) VALUES (
  'custom_domain_daily',
  'Custom Domain Daily Hosting',
  'store_operations',
  'Daily hosting fee for active custom domains (e.g., www.myshop.com)',
  0.5000,
  'per_day',
  true,
  true,
  13,
  '{"note": "Charged daily at midnight UTC for each active verified custom domain", "deactivates_on_insufficient_credits": true}'
)
ON CONFLICT (service_key) DO UPDATE SET
  cost_per_unit = EXCLUDED.cost_per_unit,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = CURRENT_TIMESTAMP;

-- Add comment
COMMENT ON TABLE service_credit_costs IS 'Includes daily custom domain hosting fees';
