-- Cleanup duplicate PascalCase tables created by Sequelize
-- This script removes the conflicting tables that have both PascalCase and lowercase versions

-- Drop foreign key constraints from PascalCase tables first
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "CmsPage" CASCADE;  
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Store" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Verify that only lowercase tables remain
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'stores', 'products', 'orders', 'categories', 'cms_pages')
ORDER BY tablename;