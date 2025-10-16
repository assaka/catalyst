const { Translation } = require('./src/models');

(async () => {
  try {
    // Map old keys to new keys
    const keyMappings = {
      // Order statuses - move from order.status.* to common.*
      'order.status.pending': 'common.pending',
      'order.status.processing': 'common.processing',
      'order.status.shipped': 'common.shipped',
      'order.status.delivered': 'common.delivered',
      'order.status.cancelled': 'common.cancelled',
      'order.status.refunded': 'common.refunded',
      'order.status.on_hold': 'common.on_hold',
      'order.status.completed': 'common.completed',
      'order.status.failed': 'common.failed',

      // Payment statuses - move from order.payment_status.* to common.*
      'order.payment_status.pending': 'common.pending', // Will merge with order.status.pending
      'order.payment_status.paid': 'common.paid',
      'order.payment_status.failed': 'common.failed', // Will merge with order.status.failed
      'order.payment_status.refunded': 'common.refunded', // Will merge with order.status.refunded
      'order.payment_status.cancelled': 'common.cancelled', // Will merge with order.status.cancelled
      'order.payment_status.authorized': 'common.authorized',
    };

    let updatedCount = 0;
    let skippedCount = 0;
    let mergedCount = 0;

    for (const [oldKey, newKey] of Object.entries(keyMappings)) {
      // Find all translations with the old key
      const oldTranslations = await Translation.findAll({
        where: { key: oldKey }
      });

      for (const oldTranslation of oldTranslations) {
        // Check if the new key already exists for this language
        const existingTranslation = await Translation.findOne({
          where: {
            key: newKey,
            language_code: oldTranslation.language_code
          }
        });

        if (existingTranslation) {
          // New key already exists, just delete the old one
          await oldTranslation.destroy();
          console.log(`🔀 Merged: ${oldKey} → ${newKey} (${oldTranslation.language_code}) - using existing value`);
          mergedCount++;
        } else {
          // Update the key
          oldTranslation.key = newKey;
          oldTranslation.category = 'common';
          await oldTranslation.save();
          console.log(`✅ Updated: ${oldKey} → ${newKey} (${oldTranslation.language_code})`);
          updatedCount++;
        }
      }

      if (oldTranslations.length === 0) {
        console.log(`⏭️  Skipped: ${oldKey} - not found in database`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updatedCount} translations`);
    console.log(`   Merged: ${mergedCount} translations (deleted duplicates)`);
    console.log(`   Skipped: ${skippedCount} keys (not found)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
