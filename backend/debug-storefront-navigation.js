/**
 * Debug script to check storefront navigation
 * This script will:
 * 1. Check if categories exist in the database
 * 2. Test the API endpoint
 * 3. Check the response format
 */

const supabaseAdmin = require('./src/config/supabase-admin');

async function debugStorefrontNavigation() {
  try {
    console.log('🔍 Debugging storefront navigation...\n');

    // 1. Check categories in database
    console.log('1️⃣ Checking categories in database...');
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return;
    }

    console.log(`✅ Found ${categories.length} categories in database`);
    console.log(`   First few categories: ${categories.slice(0, 3).map(c => c.name).join(', ')}`);
    console.log(`   Hidden in menu: ${categories.filter(c => c.hide_in_menu).length}`);
    console.log(`   Visible in menu: ${categories.filter(c => !c.hide_in_menu).length}\n`);

    // 2. Check public API endpoint format
    console.log('2️⃣ Checking how categories API should respond...');
    console.log('   The API should return: {success: true, data: [...]}');
    console.log('   storefront-entities.js handles this format automatically\n');

    // 3. Check for specific store categories
    console.log('3️⃣ Checking categories by store...');
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('id, name, slug')
      .limit(5);

    if (storesError) {
      console.error('❌ Error fetching stores:', storesError);
      return;
    }

    for (const store of stores) {
      const { data: storeCategories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('name');

      if (!error) {
        const visibleCount = storeCategories.filter(c => !c.hide_in_menu).length;
        console.log(`   Store "${store.name}" (slug: ${store.slug}): ${visibleCount} visible categories`);
      }
    }

    console.log('\n4️⃣ Cache troubleshooting:');
    console.log('   - Current CACHE_VERSION in StoreProvider.jsx: 2.1');
    console.log('   - To clear cache in browser, run in console:');
    console.log('     localStorage.removeItem("storeProviderCache")');
    console.log('     localStorage.removeItem("storeProviderCacheVersion")');
    console.log('     window.location.reload()');
    console.log('   - Or use: window.clearCache() then reload\n');

    console.log('5️⃣ Navigation visibility settings:');
    console.log('   - Check store.settings.expandAllMenuItems');
    console.log('   - If false: navigation is "hidden md:block" (only shows on desktop)');
    console.log('   - If true: navigation is always visible ("block")\n');

    console.log('6️⃣ Recommended fixes:');
    console.log('   1. Clear browser cache and localStorage');
    console.log('   2. Check browser console for StoreProvider logs:');
    console.log('      - [StoreProvider] Categories loaded: X items');
    console.log('      - [StoreProvider] First category: {...}');
    console.log('   3. If categories array is empty, check API endpoint');
    console.log('   4. If categories exist but not visible, check CSS classes\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    process.exit(0);
  }
}

debugStorefrontNavigation();
