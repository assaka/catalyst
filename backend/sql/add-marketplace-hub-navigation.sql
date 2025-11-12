-- Add Marketplace Hub to the existing Import & Export navigation group
-- Uses the same parent_key as Shopify Integration

DO $$
DECLARE
  shopify_parent_id UUID;
  marketplace_hub_id UUID;
BEGIN
  -- Get the parent_key from the existing Shopify Integration
  -- This ensures we use the correct parent that already exists
  SELECT parent_key INTO shopify_parent_id
  FROM admin_navigation_registry
  WHERE key = 'shopify_integration'
  LIMIT 1;

  IF shopify_parent_id IS NULL THEN
    RAISE EXCEPTION 'Shopify Integration not found or has no parent! Cannot determine Import & Export group.';
  END IF;

  RAISE NOTICE 'Using parent_key from Shopify Integration: %', shopify_parent_id;

  -- Insert Marketplace Hub with the same parent as Shopify
  INSERT INTO admin_navigation_registry (
    id,
    key,
    label,
    icon,
    route,
    parent_key,
    order_position,
    is_core,
    is_visible,
    plugin_id,
    category,
    required_permission,
    description,
    badge_config,
    type,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'marketplace_hub',
    'Marketplace Hub',
    'ShoppingCart',
    '/admin/marketplace-hub',
    shopify_parent_id, -- Same parent as Shopify
    310, -- Before Shopify (330)
    true,
    true,
    NULL,
    'import_export',
    NULL,
    'Unified marketplace management: Amazon, eBay, and more with AI optimization',
    jsonb_build_object(
      'text', 'New',
      'variant', 'default',
      'color', 'blue'
    ),
    'new',
    NOW(),
    NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    label = EXCLUDED.label,
    icon = EXCLUDED.icon,
    route = EXCLUDED.route,
    parent_key = EXCLUDED.parent_key,
    order_position = EXCLUDED.order_position,
    is_visible = EXCLUDED.is_visible,
    description = EXCLUDED.description,
    badge_config = EXCLUDED.badge_config,
    type = EXCLUDED.type,
    updated_at = NOW()
  RETURNING id INTO marketplace_hub_id;

  RAISE NOTICE '✅ Added/Updated Marketplace Hub with ID: %', marketplace_hub_id;

  -- Update Shopify to remove "coming_soon" type since it's fully functional
  UPDATE admin_navigation_registry
  SET
    type = NULL,
    updated_at = NOW()
  WHERE key = 'shopify_integration' AND type = 'coming_soon';

  IF FOUND THEN
    RAISE NOTICE '✅ Removed coming_soon from Shopify Integration';
  END IF;

END $$;

-- Verify the changes
SELECT
  n.key,
  n.label,
  n.route,
  n.icon,
  n.order_position,
  n.type,
  n.badge_config->>'text' as badge,
  n.is_visible,
  n.parent_key
FROM admin_navigation_registry n
WHERE n.category = 'import_export'
ORDER BY n.order_position;

-- Expected to see:
-- marketplace_hub     | Marketplace Hub  | /admin/marketplace-hub  | 310 | new  | New  | true  | (same parent as shopify)
-- shopify_integration | Shopify          | /admin/shopify-integration| 330 | NULL | NULL | true  | (parent_key)
