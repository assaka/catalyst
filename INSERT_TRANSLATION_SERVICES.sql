-- SQL Query to Insert Translation Services with Flat Rates
-- Run this on your Supabase database
--
-- IMPORTANT: This only inserts/updates rows, does not create tables or enums
-- Use this if service_credit_costs table already exists

-- Standard translation (products, categories, attributes, labels, tabs): 0.1 credits ($0.01)
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
  'ai_translation',
  'AI Translation (Standard)',
  'ai_services',
  'AI translation for products, categories, attributes, etc.',
  0.1000,
  'per_item',
  true,
  true,
  30,
  '{"note": "Standard content: products, categories, attributes, labels, tabs", "applies_to": ["product", "category", "attribute", "product_tab", "product_label", "ui_label", "cookie_consent"]}'::jsonb,
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

-- CMS Block translation: 0.2 credits ($0.02) - x2 multiplier
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
  'ai_translation_cms_block',
  'AI Translation (CMS Block)',
  'ai_services',
  'AI translation for CMS content blocks',
  0.2000,
  'per_item',
  true,
  true,
  31,
  '{"note": "CMS blocks with medium-length content", "multiplier": 2}'::jsonb,
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

-- CMS Page translation: 0.5 credits ($0.05) - x5 multiplier
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
  'ai_translation_cms_page',
  'AI Translation (CMS Page)',
  'ai_services',
  'AI translation for full CMS pages',
  0.5000,
  'per_item',
  true,
  true,
  32,
  '{"note": "Full CMS pages with long-form content", "multiplier": 5}'::jsonb,
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

-- Verify the insertions
SELECT service_key, service_name, cost_per_unit, is_active
FROM service_credit_costs
WHERE service_key IN ('ai_translation', 'ai_translation_cms_block', 'ai_translation_cms_page')
ORDER BY display_order;
