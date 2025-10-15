#!/usr/bin/env node
/**
 * Add all missing translation keys found in the codebase
 */

require('dotenv').config();
const { sequelize } = require('./src/database/connection');

const missingTranslations = {
  // Common keys from components
  'common.add_products_checkout': { en: 'Add products to checkout', nl: 'Voeg producten toe aan winkelwagen' },
  'common.cart_empty': { en: 'Cart is empty', nl: 'Winkelwagen is leeg' },
  'common.cart_is_empty': { en: 'Your cart is empty', nl: 'Je winkelwagen is leeg' },
  'common.confirm_password': { en: 'Confirm Password', nl: 'Bevestig wachtwoord' },
  'common.could_not_apply_coupon': { en: 'Could not apply coupon', nl: 'Kon kortingscode niet toepassen' },
  'common.coupon_expired': { en: 'Coupon expired', nl: 'Kortingscode verlopen' },
  'common.coupon_not_active': { en: 'Coupon not active', nl: 'Kortingscode niet actief' },
  'common.coupon_not_apply': { en: 'Coupon does not apply', nl: 'Kortingscode niet van toepassing' },
  'common.coupon_usage_limit': { en: 'Coupon usage limit reached', nl: 'Gebruikslimiet kortingscode bereikt' },
  'common.create_account': { en: 'Create Account', nl: 'Account aanmaken' },
  'common.email_address': { en: 'Email Address', nl: 'E-mailadres' },
  'common.enter_coupon_code': { en: 'Enter coupon code', nl: 'Voer kortingscode in' },
  'common.enter_your_email': { en: 'Enter your email', nl: 'Voer je e-mailadres in' },
  'common.enter_your_password': { en: 'Enter your password', nl: 'Voer je wachtwoord in' },
  'common.failed_apply_coupon': { en: 'Failed to apply coupon', nl: 'Toepassen kortingscode mislukt' },
  'common.first_name': { en: 'First Name', nl: 'Voornaam' },
  'common.invalid_coupon': { en: 'Invalid coupon', nl: 'Ongeldige kortingscode' },
  'common.last_name': { en: 'Last Name', nl: 'Achternaam' },
  'common.login_failed': { en: 'Login failed', nl: 'Inloggen mislukt' },
  'common.minimum_order_required': { en: 'Minimum order required', nl: 'Minimale bestelwaarde vereist' },
  'common.no_items_yet': { en: 'No items yet', nl: 'Nog geen items' },
  'common.password': { en: 'Password', nl: 'Wachtwoord' },
  'common.remember_me': { en: 'Remember me', nl: 'Onthoud mij' },
  'common.sign_in': { en: 'Sign In', nl: 'Inloggen' },
  'common.signing_in': { en: 'Signing in...', nl: 'Inloggen...' },
  'common.store_info_not_available': { en: 'Store info not available', nl: 'Winkelinformatie niet beschikbaar' },

  // Checkout specific
  'checkout.my_cart': { en: 'My Cart', nl: 'Mijn Winkelwagen' },

  // Product keys
  'product.price_breakdown': { en: 'Price Breakdown', nl: 'Prijsoverzicht' },
  'product.total_price': { en: 'Total Price', nl: 'Totaalprijs' },
  'product.selected_options': { en: 'Selected Options', nl: 'Geselecteerde opties' },
};

async function addMissingTranslations() {
  try {
    console.log('🔧 Adding missing translation keys...\\n');
    await sequelize.authenticate();
    console.log('✅ Database connected\\n');

    let addedCount = 0;
    let existingCount = 0;

    for (const [key, translations] of Object.entries(missingTranslations)) {
      try {
        // Check if key exists
        const [existing] = await sequelize.query(`
          SELECT COUNT(*) as count FROM translations WHERE key = :key
        `, { replacements: { key } });

        if (existing[0].count > 0) {
          console.log(`  ⏭️  ${key} (already exists)`);
          existingCount++;
          continue;
        }

        // Determine category from key
        const category = key.split('.')[0];

        // Add English
        await sequelize.query(`
          INSERT INTO translations (id, key, language_code, value, category, created_at, updated_at)
          VALUES (gen_random_uuid(), :key, 'en', :en, :category, NOW(), NOW())
        `, { replacements: { key, en: translations.en, category } });

        // Add Dutch
        await sequelize.query(`
          INSERT INTO translations (id, key, language_code, value, category, created_at, updated_at)
          VALUES (gen_random_uuid(), :key, 'nl', :nl, :category, NOW(), NOW())
        `, { replacements: { key, nl: translations.nl, category } });

        console.log(`  ✅ ${key}`);
        console.log(`     en: "${translations.en}"`);
        console.log(`     nl: "${translations.nl}"`);
        addedCount += 2; // English + Dutch
      } catch (error) {
        console.error(`  ❌ Error adding ${key}:`, error.message);
      }
    }

    console.log(`\\n📊 Summary:`);
    console.log(`  ✅ Added: ${addedCount} translations`);
    console.log(`  ⏭️  Skipped: ${existingCount} keys (already exist)`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

addMissingTranslations();
