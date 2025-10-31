-- SQL Query to Insert ai_translation_token Service
-- Run this on your Supabase database

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
  metadata,
  created_at,
  updated_at
) VALUES (
  'ai_translation_token',
  'AI Translation',
  'ai_services',
  'AI-powered content translation - token based pricing',
  0.0001,
  'per_item',
  true,
  true,
  30,
  '{"note": "Per token (approx 4 chars)", "base_rate": 0.0001, "calculation": "tokens * rate", "min_charge": 0.01, "token_ratio": 3.5}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (service_key) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  description = EXCLUDED.description,
  cost_per_unit = EXCLUDED.cost_per_unit,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active,
  is_visible = EXCLUDED.is_visible,
  updated_at = NOW();

-- Optional: Delete the old deprecated ai_translation service
-- DELETE FROM service_credit_costs WHERE service_key = 'ai_translation';
