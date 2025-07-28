-- SQL to verify OrderItems exist for this order
-- Order ID: d6588d24-3d47-4f60-b82b-14f95d5c921f

-- Check if the order exists
SELECT id, order_number, customer_email, total_amount, created_at 
FROM orders 
WHERE id = 'd6588d24-3d47-4f60-b82b-14f95d5c921f';

-- Check if OrderItems exist for this order
SELECT id, order_id, product_id, product_name, quantity, unit_price, total_price, created_at
FROM order_items 
WHERE order_id = 'd6588d24-3d47-4f60-b82b-14f95d5c921f';

-- Count OrderItems for this order
SELECT COUNT(*) as order_items_count
FROM order_items 
WHERE order_id = 'd6588d24-3d47-4f60-b82b-14f95d5c921f';