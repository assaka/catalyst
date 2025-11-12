-- Add Marketplace Hub to the Import & Export navigation group
-- This creates a unified marketplace management interface

-- First, find the Import & Export parent ID
-- (Assuming it exists - if not, you'll need to create it first)

DO $$
DECLARE
  import_export_id UUID;
  new_item_id UUID;
BEGIN
  -- Find or create the "Import & Export" group
  SELECT id INTO import_export_id
  FROM admin_navigation_registry
  WHERE key = 'import_export' AND parent_key IS NULL
  LIMIT 1;

  -- If Import & Export group doesn't exist, create it
  IF import_export_id IS NULL THEN
    INSERT INTO admin_navigation_registry (
      id,
      key,
      name,
      path,
      icon,
      parent_key,
      order_position,
      is_visible,
      is_enabled,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'import_export',
      'Import & Export',
      NULL, -- This is a group, not a page
      'Package',
      NULL,
      800, -- Position in main menu
      true,
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO import_export_id;

    RAISE NOTICE 'Created Import & Export group with ID: %', import_export_id;
  END IF;

  -- Add Marketplace Hub (main unified interface)
  INSERT INTO admin_navigation_registry (
    id,
    key,
    name,
    path,
    icon,
    parent_key,
    order_position,
    is_visible,
    is_enabled,
    type,
    badge_text,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'marketplace_hub',
    'Marketplace Hub',
    'marketplace-hub', -- Route path
    'ShoppingCart', -- Lucide icon
    import_export_id,
    1, -- First item in Import & Export
    true,
    true,
    'new', -- Show "New" badge
    'New',
    NOW(),
    NOW()
  )
  ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    path = EXCLUDED.path,
    icon = EXCLUDED.icon,
    parent_key = EXCLUDED.parent_key,
    order_position = EXCLUDED.order_position,
    type = EXCLUDED.type,
    badge_text = EXCLUDED.badge_text,
    updated_at = NOW()
  RETURNING id INTO new_item_id;

  RAISE NOTICE 'Added/Updated Marketplace Hub with ID: %', new_item_id;

  -- Update existing items order positions
  -- Shopify Integration
  UPDATE admin_navigation_registry
  SET order_position = 2, parent_key = import_export_id
  WHERE key = 'shopify_integration' OR path = 'shopify-integration';

  -- Akeneo Integration
  UPDATE admin_navigation_registry
  SET order_position = 3, parent_key = import_export_id
  WHERE key = 'akeneo_integration' OR path = 'akeneo-integration';

  -- Mark old Marketplace Export as deprecated (or hide it)
  UPDATE admin_navigation_registry
  SET is_visible = false, badge_text = 'Deprecated'
  WHERE key = 'marketplace_export' OR path = 'MARKETPLACE_EXPORT';

  RAISE NOTICE 'Navigation structure updated successfully';

END $$;

-- Verify the changes
SELECT
  n.name,
  n.path,
  n.icon,
  p.name as parent_name,
  n.order_position,
  n.type,
  n.badge_text,
  n.is_visible
FROM admin_navigation_registry n
LEFT JOIN admin_navigation_registry p ON n.parent_key = p.id
WHERE p.key = 'import_export' OR n.key = 'import_export'
ORDER BY n.order_position;
