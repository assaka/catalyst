const { Translation } = require('./src/models');
const { Op } = require('sequelize');

(async () => {
  try {
    // Find all common.* translations related to statuses
    const commonTranslations = await Translation.findAll({
      where: {
        key: {
          [Op.like]: 'common.%'
        }
      },
      order: [['key', 'ASC'], ['language_code', 'ASC']]
    });

    console.log('\n📊 Common translations (status-related):');
    console.log('='.repeat(80));

    const statusKeys = commonTranslations.filter(t =>
      ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
       'on_hold', 'completed', 'failed', 'paid', 'authorized'].some(status =>
        t.key.includes(status)
      )
    );

    statusKeys.forEach(t => {
      console.log(`${t.key} (${t.language_code}): "${t.value}"`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`Total status-related common.* keys: ${statusKeys.length / 2} (${statusKeys.length} total with languages)`);

    // Check if we have the exact keys we need
    const requiredKeys = [
      'common.pending', 'common.processing', 'common.shipped',
      'common.delivered', 'common.cancelled', 'common.refunded',
      'common.on_hold', 'common.completed', 'common.failed', 'common.paid'
    ];

    console.log('\n✅ Required keys check:');
    for (const key of requiredKeys) {
      const enExists = statusKeys.find(t => t.key === key && t.language_code === 'en');
      const nlExists = statusKeys.find(t => t.key === key && t.language_code === 'nl');

      if (enExists && nlExists) {
        console.log(`✅ ${key}: EN="${enExists.value}" | NL="${nlExists.value}"`);
      } else {
        console.log(`❌ ${key}: MISSING`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
