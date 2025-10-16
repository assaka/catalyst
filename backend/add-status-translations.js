const { Translation } = require('./src/models');

(async () => {
  try {
    const statusTranslations = {
      // Order statuses
      'order.status.pending': { en: 'Pending', nl: 'In afwachting' },
      'order.status.processing': { en: 'Processing', nl: 'In behandeling' },
      'order.status.shipped': { en: 'Shipped', nl: 'Verzonden' },
      'order.status.delivered': { en: 'Delivered', nl: 'Afgeleverd' },
      'order.status.cancelled': { en: 'Cancelled', nl: 'Geannuleerd' },
      'order.status.refunded': { en: 'Refunded', nl: 'Terugbetaald' },
      'order.status.on_hold': { en: 'On Hold', nl: 'In de wacht' },
      'order.status.completed': { en: 'Completed', nl: 'Voltooid' },
      'order.status.failed': { en: 'Failed', nl: 'Mislukt' },

      // Payment statuses
      'order.payment_status.pending': { en: 'Pending', nl: 'In afwachting' },
      'order.payment_status.paid': { en: 'Paid', nl: 'Betaald' },
      'order.payment_status.failed': { en: 'Failed', nl: 'Mislukt' },
      'order.payment_status.refunded': { en: 'Refunded', nl: 'Terugbetaald' },
      'order.payment_status.cancelled': { en: 'Cancelled', nl: 'Geannuleerd' },
      'order.payment_status.authorized': { en: 'Authorized', nl: 'Geautoriseerd' },
    };

    let addedCount = 0;
    let skippedCount = 0;

    for (const [key, translations] of Object.entries(statusTranslations)) {
      // Determine category
      const category = key.startsWith('order.payment_status') ? 'order_payment_status' : 'order_status';

      for (const [lang, value] of Object.entries(translations)) {
        const [translation, created] = await Translation.findOrCreate({
          where: {
            key,
            language_code: lang
          },
          defaults: {
            key,
            language_code: lang,
            value,
            category,
            type: 'system'
          }
        });

        if (created) {
          console.log(`✅ Added: ${key} (${lang}): ${value}`);
          addedCount++;
        } else {
          console.log(`⏭️  Skipped (exists): ${key} (${lang})`);
          skippedCount++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${addedCount} translations`);
    console.log(`   Skipped: ${skippedCount} translations (already exist)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
