-- Insert CMS blocks for Account page
-- Run this query in Supabase SQL Editor

INSERT INTO cms_blocks (identifier, name, description, position, content, is_active, created_at, updated_at)
VALUES
  (
    'account_header',
    'Account Header Banner',
    'Banner area in the account header section',
    'account_header',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_sidebar_top',
    'Sidebar Top',
    'Content area at the top of the account sidebar',
    'account_sidebar_top',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_sidebar_bottom',
    'Sidebar Bottom',
    'Content area at the bottom of the account sidebar',
    'account_sidebar_bottom',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_footer',
    'Account Footer',
    'Footer area for help links and information',
    'account_footer',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_banner',
    'Account Banner',
    'Promotional banner for account-specific offers',
    'account_banner',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_promotions',
    'Account Promotions',
    'Special promotions and loyalty program information',
    'account_promotions',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_help',
    'Help & Support',
    'Help documentation and support resources',
    'account_help',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_benefits',
    'Member Benefits',
    'Display member benefits and rewards information',
    'account_benefits',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_security',
    'Security Tips',
    'Security tips and account protection information',
    'account_security',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_loyalty',
    'Loyalty Program',
    'Loyalty program status and rewards',
    'account_loyalty',
    '',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (identifier) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  position = EXCLUDED.position,
  updated_at = NOW();
