-- Create store_templates table for customizable store templates
CREATE TABLE IF NOT EXISTS store_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('category', 'product', 'checkout', 'homepage', 'custom')),
  name VARCHAR(255) NOT NULL,
  elements JSON NOT NULL DEFAULT '[]',
  styles JSON NOT NULL DEFAULT '{}',
  settings JSON NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure only one template per type per store
  UNIQUE(store_id, type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_templates_store_id ON store_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_store_templates_type ON store_templates(type);
CREATE INDEX IF NOT EXISTS idx_store_templates_active ON store_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_store_templates_updated_at ON store_templates(updated_at);

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_store_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_store_templates_updated_at_trigger ON store_templates;
CREATE TRIGGER update_store_templates_updated_at_trigger
  BEFORE UPDATE ON store_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_store_templates_updated_at();

COMMENT ON TABLE store_templates IS 'Store-specific page templates for customizing storefront pages';
COMMENT ON COLUMN store_templates.elements IS 'JSON array of template elements with positioning and content';
COMMENT ON COLUMN store_templates.styles IS 'JSON object containing CSS styles for template elements';
COMMENT ON COLUMN store_templates.settings IS 'JSON object containing template-specific configuration options';