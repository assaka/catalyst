-- Add Marketplace Hub to the existing Import & Export navigation group
-- Simple insert using the existing import_export parent

DO $$
DECLARE
  import_export_id UUID;
  marketplace_hub_id UUID;
BEGIN
  -- Find the existing "import_export" parent group ID
  SELECT id INTO import_export_id
  FROM admin_navigation_registry
  WHERE key = 'import_export'
  LIMIT 1;

  IF import_export_id IS NULL THEN
    RAISE EXCEPTION 'Import & Export group not found! Please create it first.';
  END IF;

  RAISE NOTICE 'Found Import & Export group with ID: %', import_export_id;

  -- Insert Marketplace Hub (use parent_key from import_export)
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
    import_export_id, -- Use the found parent ID
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

  -- Optionally hide old Marketplace Export page (if it exists)
  UPDATE admin_navigation_registry
  SET
    is_visible = false,
    badge_config = jsonb_build_object(
      'text', 'Deprecated',
      'variant', 'outline',
      'color', 'gray'
    ),
    type = 'deprecated',
    updated_at = NOW()
  WHERE (key = 'marketplace_export' OR route = '/admin/marketplace-export')
    AND is_visible = true;

  IF FOUND THEN
    RAISE NOTICE '✅ Hidden old Marketplace Export page';
  ELSE
    RAISE NOTICE 'ℹ️ Marketplace Export page not found or already hidden';
  END IF;

END $$;

-- Verify the changes
SELECT
  n.key,
  n.label,
  n.route,
  n.icon,
  p.label as parent_label,
  n.order_position,
  n.type,
  n.badge_config->>'text' as badge,
  n.is_visible
FROM admin_navigation_registry n
LEFT JOIN admin_navigation_registry p ON n.parent_key = p.id
WHERE n.category = 'import_export' OR n.key = 'import_export'
ORDER BY n.order_position;
