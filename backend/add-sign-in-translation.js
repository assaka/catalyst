/**
 * Add sign_in translation key to database
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-sign-in-translation.js
 */

const { Translation } = require('./src/models');

// New translation keys needed
const newTranslations = {
  // English translations
  en: {
    sign_in: 'Sign In'
  },

  // Dutch translations
  nl: {
    sign_in: 'Inloggen'
  }
};

async function addSignInTranslation() {
  console.log('🔄 Adding sign_in translation key...\n');

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [langCode, translations] of Object.entries(newTranslations)) {
    console.log(`📝 Processing ${langCode.toUpperCase()} translations...`);

    for (const [key, value] of Object.entries(translations)) {
      try {
        const [translation, created] = await Translation.findOrCreate({
          where: {
            key: key,
            language_code: langCode
          },
          defaults: {
            key: key,
            language_code: langCode,
            value: value,
            category: 'common'
          }
        });

        if (created) {
          console.log(`  ✅ Added: ${key} = "${value}"`);
          addedCount++;
        } else if (translation.value !== value) {
          translation.value = value;
          await translation.save();
          console.log(`  🔄 Updated: ${key} = "${value}"`);
          updatedCount++;
        } else {
          console.log(`  ⏭️  Skipped: ${key} (already exists)`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error adding ${key}:`, error.message);
      }
    }

    console.log('');
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  🔄 Updated: ${updatedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  📦 Total: ${addedCount + updatedCount + skippedCount}`);
  console.log('\n✨ Translation key is now available!');
}

// Run the script
addSignInTranslation()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
