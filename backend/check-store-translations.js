const { Store } = require('./src/models');

(async () => {
  try {
    const stores = await Store.findAll({ limit: 1 });

    if (stores.length > 0) {
      const store = stores[0];
      const uiTranslations = store.settings?.ui_translations;

      console.log('Store:', store.name);
      console.log('Has ui_translations:', !!uiTranslations);

      if (uiTranslations) {
        console.log('Languages:', Object.keys(uiTranslations));

        const nlTranslations = uiTranslations.nl || {};
        const hasKey = 'order.your_orders' in nlTranslations;

        console.log('\norder.your_orders in NL:');
        console.log('  Found:', hasKey);
        console.log('  Value:', nlTranslations['order.your_orders']);

        // Check for order namespace
        const orderKeys = Object.keys(nlTranslations).filter(k => k.startsWith('order.'));
        console.log('\nAll order.* keys in NL:', orderKeys.length);
        orderKeys.slice(0, 15).forEach(key => {
          console.log(`  - ${key}: ${nlTranslations[key]}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
