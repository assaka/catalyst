const { Translation } = require('./src/models');

(async () => {
  try {
    const messageTranslations = {
      // Password validation messages in messages namespace
      'messages.password_min_length': {
        en: 'Password must be at least 6 characters long.',
        nl: 'Wachtwoord moet minimaal 6 tekens lang zijn.'
      },
      'messages.passwords_no_match': {
        en: 'Passwords do not match.',
        nl: 'Wachtwoorden komen niet overeen.'
      },
    };

    let addedCount = 0;
    let skippedCount = 0;

    for (const [key, translations] of Object.entries(messageTranslations)) {
      const category = 'messages';

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
