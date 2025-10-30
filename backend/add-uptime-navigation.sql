-- Add Uptime Report to admin navigation
-- Insert under Store category, after Billing

INSERT INTO admin_navigation_registry (
  key,
  label,
  icon,
  route,
  parent_key,
  order_position,
  is_core,
  plugin_id,
  category,
  required_permission,
  description,
  is_visible,
  created_at,
  updated_at
) VALUES (
  'uptime-report',
  'Uptime Report',
  'Activity',
  '/admin/uptime-report',
  'store',  -- Parent category is 'store'
  85,       -- Order position (after Billing which is likely 80)
  true,     -- Core feature
  NULL,     -- Not a plugin
  'store',  -- Category
  NULL,     -- No special permission required
  'Track daily charges and uptime for running stores',
  true,     -- Visible
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  parent_key = EXCLUDED.parent_key,
  order_position = EXCLUDED.order_position,
  description = EXCLUDED.description,
  updated_at = NOW();
