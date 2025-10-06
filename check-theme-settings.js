import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jqqfjfoigtwdpnlicjmh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxcWZqZm9pZ3R3ZHBubGljam1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxNzA4NDMsImV4cCI6MjA1MTc0Njg0M30.E-ls9JaKC8vF33C6tTFBkX3AjQZYSI0r_lLPTcILlRw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkThemeSettings() {
  const { data, error } = await supabase
    .from('stores')
    .select('name, settings')
    .eq('id', '157d4590-49bf-4b0b-bd77-abe131909528')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Store Theme Settings ===');
  console.log('Store Name:', data.name);
  console.log('\nTheme Settings:');
  console.log(JSON.stringify(data.settings.theme, null, 2));

  console.log('\n=== Product Tabs Settings ===');
  console.log('Title Color:', data.settings.theme?.product_tabs_title_color || 'NOT SET');
  console.log('Title Size:', data.settings.theme?.product_tabs_title_size || 'NOT SET');
  console.log('Content BG:', data.settings.theme?.product_tabs_content_bg || 'NOT SET');
  console.log('Attribute Label Color:', data.settings.theme?.product_tabs_attribute_label_color || 'NOT SET');
}

checkThemeSettings();
