-- Add Email settings to Store navigation menu
-- This creates a dedicated Email menu item under Store > Email

-- Insert Email under Store parent
INSERT INTO admin_navigation_registry
(key, label, icon, route, parent_key, order_position, is_core, category, is_visible, created_at, updated_at)
VALUES
('store_email', 'Email', 'Mail', '/admin/settings/email', 'store', 83, true, 'store', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key)
DO UPDATE SET
  label = EXCLUDED.label,
  icon = EXCLUDED.icon,
  route = EXCLUDED.route,
  parent_key = EXCLUDED.parent_key,
  order_position = EXCLUDED.order_position,
  is_visible = EXCLUDED.is_visible,
  updated_at = CURRENT_TIMESTAMP;

-- Remove old Emails from Content (if you want to keep it only under Store)
-- Uncomment the line below if you want to remove from Content menu
-- DELETE FROM admin_navigation_registry WHERE key = 'emails';

-- Verify the change
SELECT key, label, parent_key, route, order_position
FROM admin_navigation_registry
WHERE parent_key = 'store' OR key = 'store'
ORDER BY order_position;
