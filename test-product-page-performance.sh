#!/bin/bash

# Test Product Page Performance - Step by Step
# Tests the exact API calls your product page makes

echo "🧪 Testing Product Page Performance"
echo "===================================="
echo ""
echo "Page: /public/hamid2/product/kenwood-ksbsb23-amerikaanse-koelkast-177cm-o0517"
echo ""

STORE_SLUG="hamid2"
PRODUCT_SLUG="kenwood-ksbsb23-amerikaanse-koelkast-177cm-o0517"
BACKEND="https://catalyst-backend-fzhu.onrender.com"

echo "📍 Test 1: Storefront Bootstrap (Initial Load)"
echo "----------------------------------------------"
curl -w "\n⏱️  Time: %{time_total}s | Size: %{size_download} bytes\n" \
  -o /tmp/bootstrap.json \
  -s "${BACKEND}/api/public/storefront/bootstrap?store_slug=${STORE_SLUG}&language=en"

if grep -q "success.*true" /tmp/bootstrap.json 2>/dev/null; then
  echo "✅ Bootstrap successful"
  STORE_ID=$(cat /tmp/bootstrap.json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "📝 Store ID: ${STORE_ID}"
else
  echo "❌ Bootstrap failed"
  echo "Response: $(cat /tmp/bootstrap.json)"
fi

echo ""
echo "📍 Test 2: Product Detail (by slug + full data)"
echo "------------------------------------------------"
if [ ! -z "$STORE_ID" ]; then
  curl -w "\n⏱️  Time: %{time_total}s | Size: %{size_download} bytes\n" \
    -o /tmp/product.json \
    -s "${BACKEND}/api/public/products/by-slug/${PRODUCT_SLUG}/full?store_id=${STORE_ID}"

  if grep -q "success.*true" /tmp/product.json 2>/dev/null; then
    echo "✅ Product fetch successful"
  else
    echo "❌ Product fetch failed"
    echo "Response: $(cat /tmp/product.json)"
  fi
else
  echo "⏭️  Skipping (no store_id)"
fi

echo ""
echo "📍 Test 3: UI Labels Translation"
echo "---------------------------------"
if [ ! -z "$STORE_ID" ]; then
  curl -w "\n⏱️  Time: %{time_total}s | Size: %{size_download} bytes\n" \
    -o /tmp/labels.json \
    -s "${BACKEND}/api/translations/ui-labels?store_id=${STORE_ID}&lang=en"

  if grep -q "success.*true" /tmp/labels.json 2>/dev/null; then
    echo "✅ UI labels fetch successful"
  else
    echo "❌ UI labels failed"
  fi
fi

echo ""
echo "📍 Test 4: Cache Status Check"
echo "------------------------------"
curl -s "${BACKEND}/health/cache" | grep -o '"keys":[0-9]*' | head -1
echo ""

echo ""
echo "📊 SUMMARY"
echo "=========="
echo "Now let's test WITH cache (reload immediately):"
echo ""

echo "📍 Test 5: Bootstrap (2nd load - should be cached)"
echo "---------------------------------------------------"
curl -w "\n⏱️  Time: %{time_total}s (should be <100ms if cached)\n" \
  -H "X-Request-ID: test-2" \
  -o /dev/null \
  -s "${BACKEND}/api/public/storefront/bootstrap?store_slug=${STORE_SLUG}&language=en"

echo ""
echo "📍 Test 6: Product (2nd load - should be cached)"
echo "-------------------------------------------------"
if [ ! -z "$STORE_ID" ]; then
  curl -w "\n⏱️  Time: %{time_total}s (should be <100ms if cached)\n" \
    -o /dev/null \
    -s "${BACKEND}/api/public/products/by-slug/${PRODUCT_SLUG}/full?store_id=${STORE_ID}"
fi

echo ""
echo "✅ Test Complete!"
echo ""
echo "📋 Check if times improved on 2nd load"
echo "📋 If 2nd load is still slow → backend query optimization needed"
echo "📋 If 2nd load is fast → frontend optimization needed"
