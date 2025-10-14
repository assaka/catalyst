/**
 * Add login page translations
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-login-translations.js
 */

const { Translation } = require('./src/models');

const loginTranslations = {
  // Page headers
  'welcome_back': { en: 'Welcome Back', nl: 'Welkom Terug' },
  'sign_in': { en: 'Sign In', nl: 'Aanmelden' },
  'create_account': { en: 'Create Account', nl: 'Account Aanmaken' },
  'already_registered_login': { en: 'Already Registered? Login', nl: 'Al geregistreerd? Inloggen' },

  // Login form
  'email_address': { en: 'Email Address', nl: 'E-mailadres' },
  'enter_your_email': { en: 'Enter your email', nl: 'Voer je e-mail in' },
  'password': { en: 'Password', nl: 'Wachtwoord' },
  'enter_your_password': { en: 'Enter your password', nl: 'Voer je wachtwoord in' },
  'remember_me': { en: 'Remember me', nl: 'Onthoud mij' },
  'signing_in': { en: 'Signing in...', nl: 'Bezig met inloggen...' },
  'sign_in_button': { en: 'Sign In', nl: 'Aanmelden' },

  // Registration form
  'first_name': { en: 'First Name', nl: 'Voornaam' },
  'first_name_placeholder': { en: 'First name', nl: 'Voornaam' },
  'last_name': { en: 'Last Name', nl: 'Achternaam' },
  'last_name_placeholder': { en: 'Last name', nl: 'Achternaam' },
  'confirm_password': { en: 'Confirm Password', nl: 'Bevestig wachtwoord' },
  'confirm_password_placeholder': { en: 'Confirm password', nl: 'Bevestig wachtwoord' },
  'create_my_account': { en: 'Create My Account', nl: 'Mijn account aanmaken' },

  // Error messages
  'store_info_not_available_refresh': { en: 'Store information not available. Please refresh the page.', nl: 'Winkelinformatie niet beschikbaar. Ververs de pagina.' },
  'login_failed_invalid_response': { en: 'Login failed: Invalid response from server', nl: 'Inloggen mislukt: Ongeldig antwoord van server' },
  'login_failed': { en: 'Login failed', nl: 'Inloggen mislukt' },

  // Success messages
  'loading': { en: 'Loading...', nl: 'Laden...' },
  'login_config_not_available': { en: 'Login configuration not available. Please contact support.', nl: 'Loginconfiguratie niet beschikbaar. Neem contact op met support.' },

  // Footer/terms
  'terms_agreement': { en: 'By continuing, you agree to our Terms of Service and Privacy Policy', nl: 'Door verder te gaan, ga je akkoord met onze Servicevoorwaarden en Privacybeleid' }
};

async function addTranslations() {
  console.log('🔄 Adding login page translations...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translations] of Object.entries(loginTranslations)) {
    try {
      // Add English translation
      const [enTranslation, enCreated] = await Translation.findOrCreate({
        where: {
          key: key,
          language_code: 'en'
        },
        defaults: {
          key: key,
          language_code: 'en',
          value: translations.en,
          category: 'login'
        }
      });

      if (enCreated) {
        console.log(`  ✅ Added EN: ${key} = "${translations.en}"`);
        addedCount++;
      } else {
        console.log(`  ⏭️  Skipped EN: ${key} (already exists)`);
        skippedCount++;
      }

      // Add Dutch translation
      const [nlTranslation, nlCreated] = await Translation.findOrCreate({
        where: {
          key: key,
          language_code: 'nl'
        },
        defaults: {
          key: key,
          language_code: 'nl',
          value: translations.nl,
          category: 'login'
        }
      });

      if (nlCreated) {
        console.log(`  ✅ Added NL: ${key} = "${translations.nl}"`);
        addedCount++;
      } else {
        console.log(`  ⏭️  Skipped NL: ${key} (already exists)`);
        skippedCount++;
      }

    } catch (error) {
      console.error(`  ❌ Error adding ${key}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log('\n✨ Done!');
}

// Run the script
addTranslations()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
