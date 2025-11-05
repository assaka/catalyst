-- Store Routes System Migration
-- Creates tables for managing both core routes and custom routes created by store owners
-- This enables a unified routing system for dynamic pages

-- 1. STORE_ROUTES TABLE
-- Manages both core routes (admin pages, system pages) and custom routes (store owner created pages)
CREATE TABLE IF NOT EXISTS store_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    route_path VARCHAR(500) NOT NULL, -- The URL path (e.g., /products, /custom-page, /about-us)
    route_name VARCHAR(255) NOT NULL, -- Human readable name (e.g., "Products", "Custom Page", "About Us")
    route_type VARCHAR(50) NOT NULL DEFAULT 'custom' CHECK (route_type IN ('core', 'custom', 'cms_page', 'product_detail', 'category')),
    
    -- Target configuration - what this route resolves to
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('component', 'cms_page', 'external_url', 'redirect')),
    target_value TEXT NOT NULL, -- Component name, CMS page ID, URL, or redirect path
    
    -- Route metadata
    title VARCHAR(255), -- Page title for SEO and navigation
    description TEXT, -- Page description
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords VARCHAR(255),
    
    -- Navigation and display settings
    show_in_navigation BOOLEAN DEFAULT true,
    navigation_label VARCHAR(255), -- Label to show in navigation (defaults to route_name)
    navigation_parent_id UUID, -- For hierarchical navigation
    navigation_sort_order INTEGER DEFAULT 0,
    
    -- Route behavior
    is_active BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT false,
    allowed_roles JSONB DEFAULT '[]', -- ['store_owner', 'customer'] etc.
    
    -- Custom parameters and configuration
    route_params JSONB DEFAULT '{}', -- Dynamic parameters like {productId: 'uuid', slug: 'string'}
    component_props JSONB DEFAULT '{}', -- Props to pass to the target component
    layout_template VARCHAR(100) DEFAULT 'default', -- Which layout template to use
    
    -- Cache and performance
    cache_duration INTEGER DEFAULT 0, -- Cache duration in seconds (0 = no cache)
    
    -- Audit fields
    created_by UUID, -- User who created this route
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (navigation_parent_id) REFERENCES store_routes(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure unique routes per store
    UNIQUE (store_id, route_path)
);

-- 2. ROUTE_REDIRECTS TABLE
-- Manages URL redirects (301, 302) for SEO and legacy URL support
CREATE TABLE IF NOT EXISTS route_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    from_path VARCHAR(500) NOT NULL, -- Original path to redirect from
    to_path VARCHAR(500) NOT NULL,   -- Target path to redirect to
    redirect_type INTEGER DEFAULT 301 CHECK (redirect_type IN (301, 302, 307, 308)),
    is_active BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0, -- Track how often this redirect is used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE (store_id, from_path)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_routes_store_id ON store_routes(store_id);
CREATE INDEX IF NOT EXISTS idx_store_routes_path ON store_routes(store_id, route_path);
CREATE INDEX IF NOT EXISTS idx_store_routes_type ON store_routes(route_type);
CREATE INDEX IF NOT EXISTS idx_store_routes_active ON store_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_store_routes_navigation ON store_routes(store_id, show_in_navigation, navigation_sort_order);

CREATE INDEX IF NOT EXISTS idx_route_redirects_store_from ON route_redirects(store_id, from_path);
CREATE INDEX IF NOT EXISTS idx_route_redirects_active ON route_redirects(is_active);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_routes_updated_at BEFORE UPDATE ON store_routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_redirects_updated_at BEFORE UPDATE ON route_redirects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert core routes that every store should have
-- These are the standard admin and storefront routes
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, show_in_navigation, created_at) 
SELECT 
    s.id as store_id,
    '/' as route_path,
    'Home' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Storefront' as target_value,
    'Home' as title,
    true as show_in_navigation,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/'
);

INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/products' as route_path,
    'Products' as route_name,
    'core' as route_type,
    'component' as target_type,
    'ProductListing' as target_value,
    'Products' as title,
    true as show_in_navigation,
    10 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/products'
);

INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/cart' as route_path,
    'Cart' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Cart' as target_value,
    'Shopping Cart' as title,
    false as show_in_navigation,
    100 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/cart'
);

INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/checkout' as route_path,
    'Checkout' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Checkout' as target_value,
    'Checkout' as title,
    false as show_in_navigation,
    110 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/checkout'
);

-- Insert all standard admin routes that every store should have
-- These routes require authentication and are accessible to store owners and admins

-- Dashboard
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/dashboard' as route_path,
    'Dashboard' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Dashboard' as target_value,
    'Admin Dashboard' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    1 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/dashboard'
);

-- Products (Admin)
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/products' as route_path,
    'Products' as route_name,
    'core' as route_type,
    'component' as target_type,
    'ProductListing' as target_value,
    'Product Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    2 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/products'
);

-- Categories
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/categories' as route_path,
    'Categories' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Categories' as target_value,
    'Category Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    3 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/categories'
);

-- Orders
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/orders' as route_path,
    'Orders' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Orders' as target_value,
    'Order Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    4 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/orders'
);

-- Customers
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/customers' as route_path,
    'Customers' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Customers' as target_value,
    'Customer Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    5 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/customers'
);

-- Attributes
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/attributes' as route_path,
    'Attributes' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Attributes' as target_value,
    'Product Attributes' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    6 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/attributes'
);

-- CMS Pages
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/cms-pages' as route_path,
    'CMS Pages' as route_name,
    'core' as route_type,
    'component' as target_type,
    'CmsPages' as target_value,
    'CMS Page Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    7 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/cms-pages'
);

-- CMS Blocks
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/cms-blocks' as route_path,
    'CMS Blocks' as route_name,
    'core' as route_type,
    'component' as target_type,
    'CmsBlocks' as target_value,
    'CMS Block Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    8 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/cms-blocks'
);

-- Plugins
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/plugins' as route_path,
    'Plugins' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Plugins' as target_value,
    'Plugin Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    9 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/plugins'
);

-- Integrations
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/integrations' as route_path,
    'Integrations' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Integrations' as target_value,
    'Integration Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    10 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/integrations'
);

-- Settings
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/settings' as route_path,
    'Settings' as route_name,
    'core' as route_type,
    'component' as target_type,
    'Settings' as target_value,
    'Store Settings' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    11 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/settings'
);

-- A/B Testing
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/ab-testing' as route_path,
    'A/B Testing' as route_name,
    'core' as route_type,
    'component' as target_type,
    'ABTesting' as target_value,
    'A/B Testing Dashboard' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    12 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/ab-testing'
);

-- SEO Tools
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/seo-tools' as route_path,
    'SEO Tools' as route_name,
    'core' as route_type,
    'component' as target_type,
    'SEOTools' as target_value,
    'SEO Tools' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    13 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/seo-tools'
);

-- SEO Settings
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/seo-settings' as route_path,
    'SEO Settings' as route_name,
    'core' as route_type,
    'component' as target_type,
    'SEOSettings' as target_value,
    'SEO Settings' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    14 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/seo-settings'
);

-- Meta Tags
INSERT INTO store_routes (store_id, route_path, route_name, route_type, target_type, target_value, title, requires_auth, allowed_roles, show_in_navigation, navigation_sort_order, created_at) 
SELECT 
    s.id as store_id,
    '/admin/meta-tags' as route_path,
    'Meta Tags' as route_name,
    'core' as route_type,
    'component' as target_type,
    'MetaTags' as target_value,
    'Meta Tags Management' as title,
    true as requires_auth,
    '["store_owner", "admin"]'::jsonb as allowed_roles,
    true as show_in_navigation,
    15 as navigation_sort_order,
    CURRENT_TIMESTAMP as created_at
FROM stores s
WHERE NOT EXISTS (
    SELECT 1 FROM store_routes sr 
    WHERE sr.store_id = s.id AND sr.route_path = '/admin/meta-tags'
);