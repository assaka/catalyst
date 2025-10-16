const { Store } = require('./src/models');

(async () => {
  try {
    const store = await Store.findOne();

    const translations = store.settings?.ui_translations?.nl;

    if (!translations) {
      console.log('No NL translations found');
      process.exit(1);
    }

    console.log('Top-level keys in NL translations:');
    const topKeys = Object.keys(translations);
    console.log(topKeys);

    // Check if first key is a category or a translation
    const firstKey = topKeys[0];
    const firstValue = translations[firstKey];

    console.log(`\nFirst key: ${firstKey}`);
    console.log(`First value type: ${typeof firstValue}`);
    console.log(`First value:`, JSON.stringify(firstValue).substring(0, 200));

    // Check for nested structure
    if (typeof firstValue === 'object') {
      console.log('\n⚠️  NESTED STRUCTURE DETECTED!');
      console.log('Translations are grouped by category.');
      console.log(`\nKeys under "${firstKey}":`, Object.keys(firstValue).slice(0, 10));
    } else {
      console.log('\n✅ FLAT STRUCTURE');
      console.log('Translation keys are at top level (correct structure)');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
