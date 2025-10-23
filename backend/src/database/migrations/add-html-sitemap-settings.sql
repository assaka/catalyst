-- Add HTML sitemap configuration settings to seo_settings table
-- This migration adds fields to control HTML sitemap display and behavior

ALTER TABLE seo_settings
  ADD COLUMN IF NOT EXISTS enable_html_sitemap BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS html_sitemap_include_products BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS html_sitemap_include_categories BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS html_sitemap_include_pages BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS html_sitemap_max_products INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS html_sitemap_product_sort VARCHAR(50) DEFAULT '-updated_date';

-- Create indexes for HTML sitemap settings
CREATE INDEX IF NOT EXISTS idx_seo_settings_enable_html_sitemap ON seo_settings(enable_html_sitemap);

SELECT 'HTML sitemap settings added successfully!' as message;
