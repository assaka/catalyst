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

-- Product translation: 0.1 credits
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
  'ai_translation_product',
  'AI Translation (Product)',
  'ai_services',
  'AI translation for product names and descriptions',
  0.1000,
  'per_item',
  true,
  true,
  33,
  '{"note": "Product name and description translation"}'::jsonb,
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

-- Category translation: 0.1 credits
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
  'ai_translation_category',
  'AI Translation (Category)',
  'ai_services',
  'AI translation for category names and descriptions',
  0.1000,
  'per_item',
  true,
  true,
  34,
  '{"note": "Category name and description translation"}'::jsonb,
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

-- Attribute translation: 0.1 credits
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
  'ai_translation_attribute',
  'AI Translation (Attribute)',
  'ai_services',
  'AI translation for product attributes',
  0.1000,
  'per_item',
  true,
  true,
  35,
  '{"note": "Product attribute label translation"}'::jsonb,
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

-- Product Tab translation: 0.1 credits
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
  'ai_translation_product_tab',
  'AI Translation (Product Tab)',
  'ai_services',
  'AI translation for product tabs',
  0.1000,
  'per_item',
  true,
  true,
  36,
  '{"note": "Product tab content translation"}'::jsonb,
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

-- Product Label translation: 0.1 credits
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
  'ai_translation_product_label',
  'AI Translation (Product Label)',
  'ai_services',
  'AI translation for product labels',
  0.1000,
  'per_item',
  true,
  true,
  37,
  '{"note": "Product label text translation"}'::jsonb,
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

-- Cookie Consent translation: 0.1 credits
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
  'ai_translation_cookie_consent',
  'AI Translation (Cookie Consent)',
  'ai_services',
  'AI translation for cookie consent text',
  0.1000,
  'per_item',
  true,
  true,
  38,
  '{"note": "Cookie consent banner translation"}'::jsonb,
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

-- Attribute Value translation: 0.1 credits
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
  'ai_translation_attribute_value',
  'AI Translation (Attribute Value)',
  'ai_services',
  'AI translation for attribute values',
  0.1000,
  'per_item',
  true,
  true,
  39,
  '{"note": "Product attribute value translation"}'::jsonb,
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

-- Email Template translation: 0.1 credits
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
  'ai_translation_email_template',
  'AI Translation (Email Template)',
  'ai_services',
  'AI translation for email templates',
  0.1000,
  'per_item',
  true,
  true,
  40,
  '{"note": "Email template subject and content translation"}'::jsonb,
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

-- PDF Template translation: 0.1 credits
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
  'ai_translation_pdf_template',
  'AI Translation (PDF Template)',
  'ai_services',
  'AI translation for PDF templates',
  0.1000,
  'per_item',
  true,
  true,
  41,
  '{"note": "PDF template content translation"}'::jsonb,
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

-- Custom Option translation: 0.1 credits
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
  'ai_translation_custom_option',
  'AI Translation (Custom Option)',
  'ai_services',
  'AI translation for custom product options',
  0.1000,
  'per_item',
  true,
  true,
  42,
  '{"note": "Custom product option translation"}'::jsonb,
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

-- Stock Label translation: 0.1 credits
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
  'ai_translation_stock_label',
  'AI Translation (Stock Label)',
  'ai_services',
  'AI translation for stock labels',
  0.1000,
  'per_item',
  true,
  true,
  43,
  '{"note": "Stock availability label translation"}'::jsonb,
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
WHERE service_key LIKE 'ai_translation%'
ORDER BY display_order;
