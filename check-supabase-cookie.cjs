require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

async function checkCookieConsent() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not found in environment variables');
      console.log('Looking for: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      process.exit(1);
    }

    console.log('✅ Connecting to Supabase...\n');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, slug');

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      process.exit(1);
    }

    console.log(`Found ${stores.length} store(s):\n`);

    for (const store of stores) {
      console.log(`Store: ${store.name} (${store.slug})`);
      console.log(`ID: ${store.id}`);

      // Get cookie consent settings for this store
      const { data: cookieSettings, error: cookieError } = await supabase
        .from('cookie_consent_settings')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (cookieError && cookieError.code !== 'PGRST116') {
        console.error('Error fetching cookie consent settings:', cookieError);
      }

      if (cookieSettings) {
        console.log('Cookie Consent Settings:');
        console.log(`  - Enabled: ${cookieSettings.is_enabled}`);
        console.log(`  - GDPR Mode: ${cookieSettings.gdpr_mode}`);
        console.log(`  - Auto Detect Country: ${cookieSettings.auto_detect_country}`);
        console.log(`  - Banner Position: ${cookieSettings.banner_position}`);
        console.log(`  - Banner Text: ${cookieSettings.banner_text ? cookieSettings.banner_text.substring(0, 50) + '...' : 'Not set'}`);
        console.log(`  - Categories: ${cookieSettings.categories ? JSON.stringify(cookieSettings.categories).substring(0, 100) + '...' : 'Not set'}`);
        console.log(`  - Translations: ${cookieSettings.translations ? Object.keys(cookieSettings.translations).join(', ') : 'Not set'}`);

        if (!cookieSettings.is_enabled) {
          console.log('\n⚠️  Cookie consent is DISABLED for this store!');
        }
      } else {
        console.log('❌ No cookie consent settings found for this store!');
      }

      console.log('\n' + '='.repeat(60) + '\n');
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCookieConsent();
