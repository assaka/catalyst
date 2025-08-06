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

-- Insert sample templates for existing stores
INSERT INTO store_templates (store_id, type, name, elements, styles, settings)
SELECT 
  s.id as store_id,
  'homepage' as type,
  'Default Homepage' as name,
  '[
    {
      "id": "hero-1",
      "type": "section",
      "name": "Hero Section",
      "content": "<section class=\"hero\"><div class=\"hero-content\"><h1>Welcome to ' || s.name || '</h1><p>Discover amazing products at unbeatable prices</p><button class=\"cta-button\">Shop Now</button></div></section>",
      "position": {"x": 0, "y": 0},
      "size": {"width": "100%", "height": 400}
    },
    {
      "id": "featured-1",
      "type": "widget", 
      "name": "Featured Products",
      "content": "<section class=\"featured-products\"><h2>Featured Products</h2><div class=\"product-grid\">{featuredProducts}</div></section>",
      "position": {"x": 0, "y": 420},
      "size": {"width": "100%", "height": 400}
    }
  ]'::json as elements,
  '{
    ".hero": {
      "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "color": "white",
      "padding": "60px",
      "text-align": "center"
    },
    ".hero h1": {
      "font-size": "48px",
      "margin-bottom": "20px"
    },
    ".cta-button": {
      "background": "white",
      "color": "#667eea",
      "padding": "15px 40px",
      "border": "none",
      "border-radius": "50px",
      "font-size": "18px",
      "cursor": "pointer"
    },
    ".product-grid": {
      "display": "grid",
      "grid-template-columns": "repeat(4, 1fr)",
      "gap": "20px",
      "padding": "20px"
    }
  }'::json as styles,
  '{
    "heroSection": true,
    "featuredProducts": true,
    "categories": false,
    "testimonials": false
  }'::json as settings
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM store_templates st 
  WHERE st.store_id = s.id AND st.type = 'homepage'
);

-- Insert default category page templates
INSERT INTO store_templates (store_id, type, name, elements, styles, settings)
SELECT 
  s.id as store_id,
  'category' as type,
  'Default Category Page' as name,
  '[
    {
      "id": "header-1",
      "type": "section",
      "name": "Category Header",
      "content": "<div class=\"category-header\"><h1>{category.name}</h1><p>{category.description}</p></div>",
      "position": {"x": 0, "y": 0},
      "size": {"width": "100%", "height": 120}
    },
    {
      "id": "products-1",
      "type": "widget",
      "name": "Product Grid",
      "content": "<div class=\"product-grid\">{products}</div>",
      "position": {"x": 0, "y": 130},
      "size": {"width": "100%", "height": "auto"}
    }
  ]'::json as elements,
  '{
    ".category-header": {
      "text-align": "center",
      "padding": "30px",
      "background": "#f8f9fa"
    },
    ".product-grid": {
      "display": "grid",
      "grid-template-columns": "repeat(4, 1fr)",
      "gap": "20px",
      "padding": "20px"
    }
  }'::json as styles,
  '{
    "layout": "grid",
    "columns": 4,
    "showFilters": true,
    "showSort": true,
    "productsPerPage": 12
  }'::json as settings
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM store_templates st 
  WHERE st.store_id = s.id AND st.type = 'category'
);

-- Insert default product detail templates
INSERT INTO store_templates (store_id, type, name, elements, styles, settings)
SELECT 
  s.id as store_id,
  'product' as type,
  'Default Product Page' as name,
  '[
    {
      "id": "gallery-1",
      "type": "widget",
      "name": "Product Gallery",
      "content": "<div class=\"product-gallery\"><img src=\"{product.image}\" alt=\"{product.name}\" /></div>",
      "position": {"x": 0, "y": 0},
      "size": {"width": "50%", "height": 500}
    },
    {
      "id": "details-1",
      "type": "section",
      "name": "Product Details",
      "content": "<div class=\"product-details\"><h1>{product.name}</h1><p class=\"price\">{product.price}</p><button class=\"add-to-cart\">Add to Cart</button></div>",
      "position": {"x": "50%", "y": 0},
      "size": {"width": "50%", "height": 500}
    }
  ]'::json as elements,
  '{
    ".product-gallery": {
      "padding": "20px"
    },
    ".product-details": {
      "padding": "20px"
    },
    ".price": {
      "font-size": "24px",
      "color": "#10b981",
      "font-weight": "bold"
    }
  }'::json as styles,
  '{
    "layout": "two-column",
    "imagePosition": "left",
    "showReviews": true,
    "showRelated": true
  }'::json as settings
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM store_templates st 
  WHERE st.store_id = s.id AND st.type = 'product'
);

COMMENT ON TABLE store_templates IS 'Store-specific page templates for customizing storefront pages';
COMMENT ON COLUMN store_templates.elements IS 'JSON array of template elements with positioning and content';
COMMENT ON COLUMN store_templates.styles IS 'JSON object containing CSS styles for template elements';
COMMENT ON COLUMN store_templates.settings IS 'JSON object containing template-specific configuration options';