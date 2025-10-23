const { sequelize } = require('./backend/src/database/connection');
const CookieConsentSettings = require('./backend/src/models/CookieConsentSettings');
const Store = require('./backend/src/models/Store');

async function checkCookieConsent() {
  try {
    console.log('Checking cookie consent settings...\n');

    // Get all stores
    const stores = await Store.findAll({
      attributes: ['id', 'name', 'slug']
    });

    console.log(`Found ${stores.length} store(s):\n`);

    for (const store of stores) {
      console.log(`Store: ${store.name} (${store.slug})`);
      console.log(`ID: ${store.id}`);

      // Get cookie consent settings for this store
      const cookieSettings = await CookieConsentSettings.findOne({
        where: { store_id: store.id }
      });

      if (cookieSettings) {
        console.log('Cookie Consent Settings:');
        console.log(`  - Enabled: ${cookieSettings.is_enabled}`);
        console.log(`  - GDPR Mode: ${cookieSettings.gdpr_mode}`);
        console.log(`  - Auto Detect Country: ${cookieSettings.auto_detect_country}`);
        console.log(`  - Banner Position: ${cookieSettings.banner_position}`);
        console.log(`  - Banner Text: ${cookieSettings.banner_text ? cookieSettings.banner_text.substring(0, 50) + '...' : 'Not set'}`);
        console.log(`  - Categories: ${cookieSettings.categories ? JSON.stringify(cookieSettings.categories).substring(0, 100) + '...' : 'Not set'}`);
        console.log(`  - Translations: ${cookieSettings.translations ? 'Available' : 'Not set'}`);
      } else {
        console.log('❌ No cookie consent settings found for this store!');
      }

      console.log('\n');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error checking cookie consent:', error);
    process.exit(1);
  }
}

checkCookieConsent();
