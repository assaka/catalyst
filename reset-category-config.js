// Quick script to reset category configuration
// This will delete the DB record so storefront uses category-config.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetCategoryConfig() {
  try {
    // Delete all category slot configurations
    const { data, error } = await supabase
      .from('slot_configurations')
      .delete()
      .eq('page_type', 'category')
      .eq('status', 'published');

    if (error) throw error;

    console.log('✅ Deleted category configurations:', data);
    console.log('✅ Storefront will now use category-config.js');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetCategoryConfig();
