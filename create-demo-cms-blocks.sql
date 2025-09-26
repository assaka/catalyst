-- Create demo CMS blocks for product detail page testing
-- Store ID: 157d4590-49bf-4b0b-bd77-abe131909528

-- Delete existing demo blocks first
DELETE FROM cms_blocks
WHERE store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
AND identifier IN ('product-above-demo', 'product-below-demo', 'product-above-price-demo');

-- Insert demo CMS blocks
INSERT INTO cms_blocks (id, title, identifier, content, placement, is_active, sort_order, store_id, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'Product Above Block',
  'product-above-demo',
  '<div class="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4"><h3 class="text-lg font-semibold text-blue-800 mb-2">🔥 Special Offer!</h3><p class="text-blue-700">Get 20% off when you buy 2 or more products. Limited time offer!</p></div>',
  '["product_above"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Product Below Block',
  'product-below-demo',
  '<div class="bg-green-50 border border-green-200 p-6 rounded-lg mt-8"><h3 class="text-xl font-semibold text-green-800 mb-3">📦 Free Shipping & Returns</h3><div class="grid md:grid-cols-3 gap-4 text-sm text-green-700"><div class="flex items-center"><span class="mr-2">🚚</span> Free shipping on orders over $50</div><div class="flex items-center"><span class="mr-2">↩️</span> 30-day return policy</div><div class="flex items-center"><span class="mr-2">🛡️</span> 1-year warranty included</div></div></div>',
  '["product_below"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Product Above Price',
  'product-above-price-demo',
  '<div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3"><p class="text-sm text-yellow-800">💰 <strong>Price Match Guarantee:</strong> Found a lower price elsewhere? We will match it!</p></div>',
  '["product_above_price"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
);

-- Verify the blocks were created
SELECT title, identifier, placement, is_active, created_at
FROM cms_blocks
WHERE store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
ORDER BY sort_order, created_at;