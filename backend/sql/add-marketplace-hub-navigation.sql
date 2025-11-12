-- Add Marketplace Hub to the Import & Export navigation group
-- Matches exact admin_navigation_registry schema structure

DO $$
DECLARE
  import_export_id UUID;
  marketplace_hub_id UUID;
BEGIN
  -- Find the "import_export" parent group
  SELECT id INTO import_export_id
  FROM admin_navigation_registry
  WHERE key = 'import_export' AND parent_key IS NULL
  LIMIT 1;

  -- If Import & Export group doesn't exist, create it
  IF import_export_id IS NULL THEN
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
      'import_export',
      'Import & Export',
      'Package',
      NULL, -- Parent group has no route
      NULL,
      800, -- Order in main menu
      true,
      true,
      NULL,
      'import_export',
      NULL,
      'Manage imports and exports across all marketplaces and integrations',
      NULL,
      NULL,
      NOW(),
      NOW()
    )
    RETURNING id INTO import_export_id;

    RAISE NOTICE 'Created Import & Export group with ID: %', import_export_id;
  ELSE
    RAISE NOTICE 'Import & Export group found with ID: %', import_export_id;
  END IF;

  -- Insert or update Marketplace Hub
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
    import_export_id,
    310, -- First item (before Shopify at 330)
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

  RAISE NOTICE 'Added/Updated Marketplace Hub with ID: %', marketplace_hub_id;

  -- Update Shopify Integration order (keep it at 330)
  UPDATE admin_navigation_registry
  SET
    parent_key = import_export_id,
    order_position = 330,
    type = NULL, -- Remove "coming_soon" - it's fully functional now
    updated_at = NOW()
  WHERE key = 'shopify_integration';

  RAISE NOTICE 'Updated Shopify Integration';

  -- Update or Insert Akeneo Integration
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
    'akeneo_integration',
    'Akeneo PIM',
    'Database',
    '/admin/akeneo-integration',
    import_export_id,
    340, -- After Shopify
    true,
    true,
    NULL,
    'import_export',
    NULL,
    'Import products, categories, and attributes from Akeneo PIM',
    NULL,
    NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    parent_key = import_export_id,
    order_position = 340,
    updated_at = NOW();

  RAISE NOTICE 'Added/Updated Akeneo Integration';

  -- Hide old Marketplace Export page (deprecated by Marketplace Hub)
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
  WHERE key = 'marketplace_export' OR route = '/admin/marketplace-export';

  RAISE NOTICE 'Hidden old Marketplace Export page';

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
  n.badge_config,
  n.is_visible,
  n.is_core
FROM admin_navigation_registry n
LEFT JOIN admin_navigation_registry p ON n.parent_key = p.id
WHERE n.category = 'import_export' OR n.key = 'import_export'
ORDER BY n.order_position;

-- Expected output:
-- key                 | label            | route                        | order | type | visible
-- --------------------|------------------|------------------------------|-------|------|--------
-- import_export       | Import & Export  | NULL                         | 800   | NULL | true
-- marketplace_hub     | Marketplace Hub  | /admin/marketplace-hub       | 310   | new  | true
-- shopify_integration | Shopify          | /admin/shopify-integration   | 330   | NULL | true
-- akeneo_integration  | Akeneo PIM       | /admin/akeneo-integration    | 340   | NULL | true
-- marketplace_export  | Marketplace Export| /admin/marketplace-export    | ???   | deprecated | false (hidden)
