-- Template Customizations Table
-- Stores user customizations for template components without modifying core files

CREATE TABLE IF NOT EXISTS template_customizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL, -- e.g., 'ProductDetail', 'Cart', 'Checkout'
    component_path VARCHAR(200) NOT NULL, -- e.g., 'pages/ProductDetail', 'components/Header'
    customizations JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one active customization per template per store
    UNIQUE(store_id, template_name, component_path)
);

-- Customizations JSONB structure will contain:
-- {
--   "styles": {
--     "css_overrides": "custom CSS rules",
--     "theme_colors": {"primary": "#...", "secondary": "#..."},
--     "layout": {"sidebar_position": "left", "grid_columns": 3}
--   },
--   "content": {
--     "blocks": [{"type": "banner", "content": "...", "position": "top"}],
--     "text_overrides": {"title": "Custom Title", "description": "..."}
--   },
--   "behavior": {
--     "features_enabled": {"wishlist": true, "reviews": false},
--     "interactions": {"auto_zoom": true, "quick_view": false}
--   },
--   "layout_modifications": {
--     "sections": [{"id": "hero", "enabled": true, "order": 1}],
--     "components": [{"name": "ImageGallery", "props": {"thumbnailPosition": "left"}}]
--   }
-- }

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_customizations_store_template 
    ON template_customizations(store_id, template_name);
CREATE INDEX IF NOT EXISTS idx_template_customizations_active 
    ON template_customizations(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_template_customizations_created_at 
    ON template_customizations(created_at);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_template_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_template_customizations_updated_at ON template_customizations;
CREATE TRIGGER update_template_customizations_updated_at
    BEFORE UPDATE ON template_customizations
    FOR EACH ROW
    EXECUTE FUNCTION update_template_customizations_updated_at();

-- Insert sample customization for ProductDetail
INSERT INTO template_customizations (store_id, template_name, component_path, customizations, created_by)
VALUES (
    '157d4590-49bf-4b0b-bd77-abe131909528',
    'ProductDetail',
    'pages/ProductDetail',
    '{
        "styles": {
            "theme_colors": {
                "primary": "#3B82F6",
                "secondary": "#EF4444",
                "accent": "#10B981"
            },
            "layout": {
                "image_gallery_position": "left",
                "image_thumbnails": "vertical",
                "content_layout": "two-column"
            }
        },
        "content": {
            "text_overrides": {
                "add_to_cart_text": "Add to Cart",
                "buy_now_text": "Buy Now",
                "wishlist_text": "Add to Wishlist"
            },
            "blocks": [
                {
                    "type": "trust_badge",
                    "content": "Free shipping on orders over $50",
                    "position": "below_price",
                    "enabled": true
                }
            ]
        },
        "behavior": {
            "features_enabled": {
                "wishlist": true,
                "reviews": true,
                "related_products": true,
                "product_tabs": true,
                "breadcrumbs": true
            },
            "interactions": {
                "image_zoom": true,
                "quantity_selector": true,
                "variant_selection": "dropdown"
            }
        }
    }'::jsonb,
    (SELECT id FROM users LIMIT 1)
) ON CONFLICT DO NOTHING;