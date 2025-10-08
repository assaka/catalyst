-- Insert CMS blocks for Account page
-- Run this query in Supabase SQL Editor

INSERT INTO cms_blocks (store_id, identifier, name, description, placement, content, is_active, created_at, updated_at)
VALUES
  (
   '157d4590-49bf-4b0b-bd77-abe131909528',
    'account_cms_above',
    'Above Content',
    'Full-width content area above the main account content',
    'account_cms_above',
    '<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-8 mb-6">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl md:text-4xl font-bold mb-3">Welcome to SprShop</h2>
    <p class="text-xl md:text-2xl opacity-90">Your Premium Shopping Experience</p>
  </div>
</div>',
    true,
    NOW(),
    NOW()
  ),
  (
      '157d4590-49bf-4b0b-bd77-abe131909528',
    'account_cms_below',
    'Below Content',
    'Full-width content area below the main account content',
    'account_cms_below',
    '<div class="bg-white rounded-lg shadow-lg p-8 mt-6">
  <h3 class="text-2xl font-bold text-center mb-8 text-gray-900">Why Choose SprShop?</h3>
  <div class="grid md:grid-cols-4 gap-6">
    <div class="text-center">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h4 class="font-semibold text-lg mb-2">Premium Quality</h4>
      <p class="text-gray-600 text-sm">Curated selection of high-quality products</p>
    </div>
    <div class="text-center">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h4 class="font-semibold text-lg mb-2">Best Prices</h4>
      <p class="text-gray-600 text-sm">Competitive pricing with regular deals</p>
    </div>
    <div class="text-center">
      <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
      </div>
      <h4 class="font-semibold text-lg mb-2">Fast Shipping</h4>
      <p class="text-gray-600 text-sm">Quick delivery to your doorstep</p>
    </div>
    <div class="text-center">
      <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      </div>
      <h4 class="font-semibold text-lg mb-2">24/7 Support</h4>
      <p class="text-gray-600 text-sm">Always here to help you</p>
    </div>
  </div>
</div>',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (identifier) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  position = EXCLUDED.position,
  content = EXCLUDED.content,
  updated_at = NOW();
