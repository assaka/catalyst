-- Create comprehensive CMS blocks for all pages
-- Store ID: 157d4590-49bf-4b0b-bd77-abe131909528

-- Delete existing demo blocks first
DELETE FROM cms_blocks
WHERE store_id = '157d4590-49bf-4b0b-bd77-abe131909528'
AND identifier LIKE '%-demo';

-- HOMEPAGE CMS BLOCKS
INSERT INTO cms_blocks (id, title, identifier, content, placement, is_active, sort_order, store_id, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'Homepage Above Hero',
  'homepage-above-hero-demo',
  '<div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 px-4"><p class="text-sm font-medium">🎉 <strong>FLASH SALE:</strong> 50% off everything! Use code: <span class="bg-white text-purple-600 px-2 py-1 rounded font-bold">SAVE50</span></p></div>',
  '["homepage_above_hero"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Homepage Hero Banner',
  'homepage-hero-demo',
  '<div class="relative bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 text-white py-20 px-8 rounded-xl overflow-hidden"><div class="absolute inset-0 bg-black opacity-20"></div><div class="relative z-10 text-center max-w-4xl mx-auto"><h1 class="text-5xl font-bold mb-6 leading-tight">Welcome to Our Amazing Store</h1><p class="text-xl mb-8 opacity-90">Discover incredible products at unbeatable prices. Quality you can trust, service you can count on.</p><div class="flex flex-wrap justify-center gap-4"><a href="/products" class="bg-white text-purple-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Shop Now</a><a href="/about" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-900 transition-colors">Learn More</a></div></div></div>',
  '["homepage_hero"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Homepage Below Hero',
  'homepage-below-hero-demo',
  '<div class="grid md:grid-cols-3 gap-6 py-12"><div class="text-center"><div class="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"><svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div><h3 class="text-lg font-semibold mb-2">Free Shipping</h3><p class="text-gray-600">Free shipping on all orders over $50</p></div><div class="text-center"><div class="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"><svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><h3 class="text-lg font-semibold mb-2">Quality Guarantee</h3><p class="text-gray-600">30-day money-back guarantee</p></div><div class="text-center"><div class="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center"><svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z"/></svg></div><h3 class="text-lg font-semibold mb-2">24/7 Support</h3><p class="text-gray-600">Round-the-clock customer service</p></div></div>',
  '["homepage_below_hero"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Homepage Above Featured',
  'homepage-above-featured-demo',
  '<div class="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8"><div class="flex items-center"><div class="flex-shrink-0"><svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg></div><div class="ml-3"><h3 class="text-lg font-medium text-yellow-800">Featured Products</h3><p class="text-yellow-700">Check out our handpicked selection of bestselling items!</p></div></div></div>',
  '["homepage_above_featured"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Homepage Below Featured',
  'homepage-below-featured-demo',
  '<div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-8 my-12"><div class="text-center"><h2 class="text-3xl font-bold mb-4">Join Our Newsletter</h2><p class="text-xl mb-6 opacity-90">Get exclusive deals, new product alerts, and more!</p><div class="max-w-md mx-auto flex gap-3"><input type="email" placeholder="Enter your email" class="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"><button class="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Subscribe</button></div></div></div>',
  '["homepage_below_featured"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Homepage Above Content',
  'homepage-above-content-demo',
  '<div class="text-center py-8"><h2 class="text-2xl font-bold text-gray-900 mb-4">Why Choose Us?</h2><p class="text-lg text-gray-600 max-w-2xl mx-auto">We are committed to providing you with the best shopping experience, highest quality products, and exceptional customer service.</p></div>',
  '["homepage_above_content"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Homepage Below Content',
  'homepage-below-content-demo',
  '<div class="bg-gray-50 rounded-xl p-8 mt-12"><div class="grid md:grid-cols-2 gap-8 items-center"><div><h2 class="text-3xl font-bold text-gray-900 mb-4">About Our Company</h2><p class="text-gray-600 mb-6">Founded in 2020, we have been serving customers worldwide with premium products and outstanding service. Our mission is to make quality products accessible to everyone.</p><a href="/about" class="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">Learn More <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg></a></div><div class="bg-white p-6 rounded-lg shadow-sm"><h3 class="font-semibold text-gray-900 mb-4">Quick Stats</h3><div class="space-y-3"><div class="flex justify-between"><span class="text-gray-600">Happy Customers</span><span class="font-semibold">50,000+</span></div><div class="flex justify-between"><span class="text-gray-600">Products Sold</span><span class="font-semibold">250,000+</span></div><div class="flex justify-between"><span class="text-gray-600">Countries Served</span><span class="font-semibold">25+</span></div></div></div></div></div>',
  '["homepage_below_content"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
);

-- CATEGORY PAGE CMS BLOCKS
INSERT INTO cms_blocks (id, title, identifier, content, placement, is_active, sort_order, store_id, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'Category Above Products',
  'category-above-products-demo',
  '<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"><div class="flex items-start space-x-4"><div class="flex-shrink-0"><svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg></div><div class="flex-1"><h3 class="text-lg font-semibold text-blue-900 mb-2">Category Special Offers</h3><p class="text-blue-800">Browse our carefully curated selection in this category. All items are quality-tested and come with our satisfaction guarantee.</p><div class="mt-4"><span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">New arrivals weekly</span><span class="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Free shipping available</span></div></div></div></div>',
  '["category_above_products"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Category Below Products',
  'category-below-products-demo',
  '<div class="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl p-8 mt-12"><div class="text-center"><h2 class="text-2xl font-bold mb-4">Didn''t Find What You''re Looking For?</h2><p class="text-lg mb-6 opacity-90">Browse our other categories or use our search to find exactly what you need.</p><div class="flex flex-wrap justify-center gap-4"><a href="/search" class="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">Search Products</a><a href="/categories" class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">All Categories</a></div></div></div>',
  '["category_below_products"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
);

-- CART PAGE CMS BLOCKS
INSERT INTO cms_blocks (id, title, identifier, content, placement, is_active, sort_order, store_id, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'Cart Above Items',
  'cart-above-items-demo',
  '<div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"><div class="flex items-center"><div class="flex-shrink-0"><svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div><div class="ml-3"><h3 class="text-sm font-medium text-green-800">Your Cart</h3><p class="text-sm text-green-700">Review your items below. Free shipping on orders over $50!</p></div></div></div>',
  '["cart_above_items"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Cart Below Items',
  'cart-below-items-demo',
  '<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6"><div class="flex"><div class="flex-shrink-0"><svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg></div><div class="ml-3"><h3 class="text-sm font-medium text-yellow-800">Almost There!</h3><p class="text-sm text-yellow-700">Add <strong>$25.00</strong> more to your cart to qualify for free shipping. Or use code <strong>SAVE10</strong> for 10% off your order.</p></div></div></div>',
  '["cart_below_items"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
);

-- CHECKOUT PAGE CMS BLOCKS
INSERT INTO cms_blocks (id, title, identifier, content, placement, is_active, sort_order, store_id, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'Checkout Above Form',
  'checkout-above-form-demo',
  '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"><div class="flex items-center"><div class="flex-shrink-0"><svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div><div class="ml-3"><h3 class="text-sm font-medium text-blue-900">Secure Checkout</h3><p class="text-sm text-blue-800">Your payment information is protected with industry-standard encryption.</p></div></div></div>',
  '["checkout_above_form"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Checkout Above Payment',
  'checkout-above-payment-demo',
  '<div class="bg-gray-50 rounded-lg p-4 mb-4"><h3 class="text-sm font-medium text-gray-900 mb-2">Payment Options</h3><div class="flex items-center space-x-4 text-sm text-gray-600"><span>We accept:</span><div class="flex space-x-2"><span class="px-2 py-1 bg-white rounded border text-xs font-medium">VISA</span><span class="px-2 py-1 bg-white rounded border text-xs font-medium">MC</span><span class="px-2 py-1 bg-white rounded border text-xs font-medium">AMEX</span><span class="px-2 py-1 bg-white rounded border text-xs font-medium">PayPal</span></div></div></div>',
  '["checkout_above_payment"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Checkout Below Payment',
  'checkout-below-payment-demo',
  '<div class="bg-green-50 border border-green-200 rounded-lg p-3 mt-4"><div class="flex items-center"><div class="flex-shrink-0"><svg class="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div><div class="ml-2"><p class="text-xs text-green-800">✓ SSL Secured ✓ Money-back guarantee ✓ 24/7 support</p></div></div></div>',
  '["checkout_below_payment"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Checkout Below Form',
  'checkout-below-form-demo',
  '<div class="bg-gray-50 rounded-lg p-6 mt-8"><div class="text-center"><h3 class="text-lg font-medium text-gray-900 mb-3">Need Help?</h3><p class="text-sm text-gray-600 mb-4">Our customer service team is here to help you complete your purchase.</p><div class="flex flex-col sm:flex-row gap-3 justify-center"><a href="tel:1-800-123-4567" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>Call (800) 123-4567</a><a href="mailto:support@example.com" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>Email Support</a></div></div></div>',
  '["checkout_below_form"]',
  true,
  1,
  '157d4590-49bf-4b0b-bd77-abe131909528',
  NOW(),
  NOW()
);