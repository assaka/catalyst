// Debug script to check what's actually saved in database for category styles
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jqqfjfoigtwdpnlicjmh.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWZqZm9pZ3R3ZHBubGljam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY4MzQ5NDEsImV4cCI6MjA0MjQxMDk0MX0.Lgr5ovbpji64CooD';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategoryStyles() {
  try {
    // Get all category configurations
    const { data, error } = await supabase
      .from('slot_configurations')
      .select('*')
      .eq('page_type', 'category')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('=== CATEGORY CONFIGURATIONS DEBUG ===');
    console.log('Total configurations found:', data?.length || 0);

    data?.forEach((config, index) => {
      console.log(`\n--- Configuration ${index + 1} ---`);
      console.log('ID:', config.id);
      console.log('Status:', config.status);
      console.log('Store ID:', config.store_id);
      console.log('Created:', config.created_at);
      console.log('Has unpublished changes:', config.has_unpublished_changes);

      if (config.configuration && config.configuration.slots) {
        const categoryTitle = config.configuration.slots.category_title;
        if (categoryTitle) {
          console.log('category_title slot found:');
          console.log('  - content:', categoryTitle.content);
          console.log('  - styles:', categoryTitle.styles);
          console.log('  - className:', categoryTitle.className);
        } else {
          console.log('category_title slot NOT found in this configuration');
        }
      } else {
        console.log('No slots in configuration');
      }
    });

    return data;
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Execute if run directly
if (typeof window === 'undefined') {
  debugCategoryStyles();
}

export { debugCategoryStyles };