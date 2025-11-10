-- Create A/B test to change product title to "Hamid Title"
-- Run this in Supabase SQL Editor

-- First, get your store ID (replace with your actual store)
-- You can find it by running: SELECT id, name FROM stores;

-- INSERT YOUR STORE ID HERE:
-- Replace 'YOUR_STORE_ID_HERE' with your actual store UUID

INSERT INTO ab_tests (
  id,
  store_id,
  name,
  description,
  hypothesis,
  status,
  variants,
  traffic_allocation,
  targeting_rules,
  primary_metric,
  secondary_metrics,
  start_date,
  end_date,
  min_sample_size,
  confidence_level,
  winner_variant_id,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_STORE_ID_HERE', -- ⚠️ REPLACE THIS WITH YOUR STORE ID
  'Product Title Test - Hamid',
  'Testing product title change to "Hamid Title"',
  'Changing the product title will improve engagement',
  'running', -- Already started!
  '[
    {
      "id": "control_1762788524645",
      "name": "Control",
      "description": "Original product title",
      "is_control": true,
      "weight": 1,
      "config": {}
    },
    {
      "id": "variant_a_1762788524645",
      "name": "Variant A - Hamid Title",
      "description": "Product title changed to Hamid Title",
      "is_control": false,
      "weight": 1,
      "config": {
        "slot_overrides": {
          "product_title": {
            "content": "Hamid Title"
          },
          "product_name": {
            "content": "Hamid Title"
          },
          "product_heading": {
            "content": "Hamid Title"
          }
        }
      }
    }
  ]'::jsonb,
  1.0,
  '{
    "pages": ["product"],
    "devices": [],
    "countries": []
  }'::jsonb,
  'add_to_cart_rate',
  '["page_views", "time_on_page"]'::jsonb,
  NOW(),
  NULL,
  100,
  0.95,
  NULL,
  '{
    "created_by": "sql_script",
    "note": "Sample test for debugging"
  }'::jsonb,
  NOW(),
  NOW()
);

-- Verify it was created
SELECT
  id,
  name,
  status,
  jsonb_array_length(variants) as variant_count
FROM ab_tests
WHERE name = 'Product Title Test - Hamid';
