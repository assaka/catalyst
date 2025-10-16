const { Store } = require('./src/models');

(async () => {
  try {
    // Get first store
    const store = await Store.findOne();

    if (!store) {
      console.log('No store found');
      process.exit(1);
    }

    console.log('Store:', store.store_name || store.name);
    console.log('Store code:', store.code || store.slug);

    // This is what the API returns
    const apiResponse = {
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.store_name,
          code: store.code,
        },
        settings: store.settings
      }
    };

    console.log('\n=== API Response Structure ===');
    console.log('Has settings:', !!apiResponse.data.settings);
    console.log('Has ui_translations:', !!apiResponse.data.settings?.ui_translations);

    if (apiResponse.data.settings?.ui_translations) {
      const translations = apiResponse.data.settings.ui_translations;
      console.log('\nLanguages:', Object.keys(translations));

      // Check NL structure
      if (translations.nl) {
        const nlKeys = Object.keys(translations.nl);
        console.log('\nNL translation keys (first 15):');
        nlKeys.slice(0, 15).forEach(key => {
          console.log(`  ${key}: ${translations.nl[key]}`);
        });

        console.log(`\nTotal NL keys: ${nlKeys.length}`);
        console.log('Has order.your_orders:', 'order.your_orders' in translations.nl);
        console.log('Value:', translations.nl['order.your_orders']);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
