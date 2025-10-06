-- Insert sample product tabs for all stores
-- This will create default tabs: Description, Specifications, and Reviews

-- Insert Description tab for all stores
INSERT INTO product_tabs (store_id, name, slug, tab_type, content, sort_order, is_active)
SELECT
    id as store_id,
    'Description' as name,
    'description' as slug,
    'description' as tab_type,
    NULL as content,
    1 as sort_order,
    true as is_active
FROM stores
WHERE NOT EXISTS (
    SELECT 1 FROM product_tabs
    WHERE product_tabs.store_id = stores.id
    AND product_tabs.slug = 'description'
);

-- Insert Specifications tab for all stores
INSERT INTO product_tabs (store_id, name, slug, tab_type, content, sort_order, is_active)
SELECT
    id as store_id,
    'Specifications' as name,
    'specifications' as slug,
    'attributes' as tab_type,
    NULL as content,
    2 as sort_order,
    true as is_active
FROM stores
WHERE NOT EXISTS (
    SELECT 1 FROM product_tabs
    WHERE product_tabs.store_id = stores.id
    AND product_tabs.slug = 'specifications'
);

-- Insert Reviews tab for all stores (as text tab with placeholder)
INSERT INTO product_tabs (store_id, name, slug, tab_type, content, sort_order, is_active)
SELECT
    id as store_id,
    'Reviews' as name,
    'reviews' as slug,
    'text' as tab_type,
    '<p>Customer reviews will appear here.</p>' as content,
    3 as sort_order,
    true as is_active
FROM stores
WHERE NOT EXISTS (
    SELECT 1 FROM product_tabs
    WHERE product_tabs.store_id = stores.id
    AND product_tabs.slug = 'reviews'
);

-- Verify the insert
SELECT
    s.name as store_name,
    pt.name as tab_name,
    pt.slug,
    pt.tab_type,
    pt.sort_order,
    pt.is_active
FROM product_tabs pt
JOIN stores s ON pt.store_id = s.id
ORDER BY s.name, pt.sort_order;
