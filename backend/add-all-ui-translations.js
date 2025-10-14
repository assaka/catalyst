/**
 * Add all UI translation keys to database
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-all-ui-translations.js
 */

const { Translation } = require('./src/models');

// Comprehensive translation keys for all UI elements
const newTranslations = {
  // English translations
  en: {
    // Header & Navigation
    sign_in: 'Sign In',

    // Cart Page
    my_cart: 'My Cart',
    your_cart_is_empty: 'Your cart is empty',
    cart_empty_message: "Looks like you haven't added anything to your cart yet.",
    continue_shopping: 'Continue Shopping',
    remove: 'Remove',
    apply_coupon: 'Apply Coupon',
    apply: 'Apply',
    subtotal: 'Subtotal',
    additional_products: 'Additional Products',
    discount: 'Discount',
    tax: 'Tax',
    total: 'Total',
    proceed_now: 'Proceed now',
    order_summary: 'Order Summary',
    coupon_applied_successfully: 'Coupon applied successfully',
    enter_coupon_code: 'Enter coupon code',

    // Login Page
    welcome_back: 'Welcome Back',
    already_registered_login: 'Already Registered? Login!',
    create_account: 'Create Account',
    terms_agreement: 'By signing in, you agree to our Terms of Service and Privacy Policy',

    // Account Page
    my_account: 'My Account',
    manage_account_description: 'Manage your account, orders, and preferences',
    sign_out: 'Sign Out',
    need_help_contact_support: 'Need help? Contact our customer support',

    // Checkout Page
    checkout: 'Checkout',
    processing_order: 'Processing your order...',

    // Category & Product Filters
    attribute_filter: 'Attribute Filter',
    brand: 'Brand',
    color: 'Color',
    size: 'Size',
    material: 'Material',
    product_name: 'Product Name',

    // Success Page
    order_confirmed: 'Order Confirmed',
    thank_you_order: 'Thank you for your order!',
    order_confirmation_sent: 'We have sent you an order confirmation email',

    // Common labels
    category_description: 'Discover our amazing collection of products in this category. Browse through our curated selection and find exactly what you need.'
  },

  // Dutch translations
  nl: {
    // Header & Navigation
    sign_in: 'Inloggen',

    // Cart Page
    my_cart: 'Mijn Winkelwagen',
    your_cart_is_empty: 'Je winkelwagen is leeg',
    cart_empty_message: "Het lijkt erop dat je nog niets aan je winkelwagen hebt toegevoegd.",
    continue_shopping: 'Verder winkelen',
    remove: 'Verwijderen',
    apply_coupon: 'Kortingscode toepassen',
    apply: 'Toepassen',
    subtotal: 'Subtotaal',
    additional_products: 'Extra producten',
    discount: 'Korting',
    tax: 'BTW',
    total: 'Totaal',
    proceed_now: 'Doorgaan naar afrekenen',
    order_summary: 'Bestelling overzicht',
    coupon_applied_successfully: 'Kortingscode succesvol toegepast',
    enter_coupon_code: 'Voer kortingscode in',

    // Login Page
    welcome_back: 'Welkom terug',
    already_registered_login: 'Al geregistreerd? Log in!',
    create_account: 'Account aanmaken',
    terms_agreement: 'Door in te loggen ga je akkoord met onze Algemene Voorwaarden en Privacybeleid',

    // Account Page
    my_account: 'Mijn Account',
    manage_account_description: 'Beheer je account, bestellingen en voorkeuren',
    sign_out: 'Uitloggen',
    need_help_contact_support: 'Hulp nodig? Neem contact op met onze klantenservice',

    // Checkout Page
    checkout: 'Afrekenen',
    processing_order: 'Je bestelling wordt verwerkt...',

    // Category & Product Filters
    attribute_filter: 'Attribuut Filter',
    brand: 'Merk',
    color: 'Kleur',
    size: 'Maat',
    material: 'Materiaal',
    product_name: 'Productnaam',

    // Success Page
    order_confirmed: 'Bestelling bevestigd',
    thank_you_order: 'Bedankt voor je bestelling!',
    order_confirmation_sent: 'We hebben je een bevestigingsmail gestuurd',

    // Common labels
    category_description: 'Ontdek onze geweldige collectie producten in deze categorie. Blader door onze zorgvuldig geselecteerde producten en vind precies wat je nodig hebt.'
  }
};

async function addAllUITranslations() {
  console.log('🔄 Adding all UI translation keys...\n');

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
  console.log('\n✨ All UI translation keys are now available!');
}

// Run the script
addAllUITranslations()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
