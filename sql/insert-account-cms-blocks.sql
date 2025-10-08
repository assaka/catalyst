-- Insert CMS blocks for Account page
-- Run this query in Supabase SQL Editor

INSERT INTO cms_blocks (identifier, name, description, position, content, is_active, created_at, updated_at)
VALUES
  (
    'account_cms_above',
    'Above Content',
    'Full-width content area above the main account content',
    'account_cms_above',
    '',
    true,
    NOW(),
    NOW()
  ),
  (
    'account_cms_below',
    'Below Content',
    'Full-width content area below the main account content',
    'account_cms_below',
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
