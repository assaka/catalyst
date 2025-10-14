/**
 * Add common UI translations for Dutch
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-common-ui-translations.js
 */

const { Translation } = require('./src/models');

const commonUITranslations = {
  // Authentication & Account
  'my_account': { en: 'My Account', nl: 'Mijn Account' },
  'logout': { en: 'Logout', nl: 'Uitloggen' },

  // Cart & Shopping
  'your_cart_is_empty': { en: 'Your cart is empty', nl: 'Je winkelwagen is leeg' },
  'continue_shopping': { en: 'Continue Shopping', nl: 'Verder winkelen' },
  'proceed_to_checkout': { en: 'Proceed to Checkout', nl: 'Doorgaan naar afrekenen' },
  'apply_coupon': { en: 'Apply Coupon', nl: 'Kortingscode toepassen' },
  'apply': { en: 'Apply', nl: 'Toepassen' },
  'remove': { en: 'Remove', nl: 'Verwijderen' },

  // Order Summary
  'order_summary': { en: 'Order Summary', nl: 'Besteloverzicht' },
  'subtotal': { en: 'Subtotal', nl: 'Subtotaal' },
  'tax': { en: 'Tax', nl: 'BTW' },
  'total': { en: 'Total', nl: 'Totaal' },
  'discount': { en: 'Discount', nl: 'Korting' },
  'shipping': { en: 'Shipping', nl: 'Verzending' },
  'free': { en: 'Free', nl: 'Gratis' },

  // Common Actions
  'add_to_cart': { en: 'Add to Cart', nl: 'Toevoegen aan winkelwagen' },
  'buy_now': { en: 'Buy Now', nl: 'Nu kopen' },
  'view_details': { en: 'View Details', nl: 'Details bekijken' },
  'quick_view': { en: 'Quick View', nl: 'Snelbekijken' },

  // Product
  'in_stock': { en: 'In Stock', nl: 'Op voorraad' },
  'out_of_stock': { en: 'Out of Stock', nl: 'Niet op voorraad' },
  'product_details': { en: 'Product Details', nl: 'Productdetails' },

  // Checkout
  'checkout': { en: 'Checkout', nl: 'Afrekenen' },
  'place_order': { en: 'Place Order', nl: 'Bestelling plaatsen' },
  'billing_address': { en: 'Billing Address', nl: 'Factuuradres' },
  'shipping_address': { en: 'Shipping Address', nl: 'Verzendadres' },
  'payment_method': { en: 'Payment Method', nl: 'Betaalmethode' },
  'shipping_method': { en: 'Shipping Method', nl: 'Verzendmethode' },

  // Messages
  'loading': { en: 'Loading...', nl: 'Laden...' },
  'error': { en: 'Error', nl: 'Fout' },
  'success': { en: 'Success', nl: 'Gelukt' },
  'please_wait': { en: 'Please wait', nl: 'Een moment geduld' },

  // Navigation
  'home': { en: 'Home', nl: 'Home' },
  'categories': { en: 'Categories', nl: 'Categorieën' },
  'search': { en: 'Search', nl: 'Zoeken' },
  'back': { en: 'Back', nl: 'Terug' },

  // Filters & Sorting
  'filters': { en: 'Filters', nl: 'Filters' },
  'sort_by': { en: 'Sort by', nl: 'Sorteren op' },
  'clear_filters': { en: 'Clear Filters', nl: 'Filters wissen' },

  // Wishlist
  'wishlist': { en: 'Wishlist', nl: 'Verlanglijst' },
  'add_to_wishlist': { en: 'Add to Wishlist', nl: 'Toevoegen aan verlanglijst' },
  'your_wishlist_is_empty': { en: 'Your wishlist is empty.', nl: 'Je verlanglijst is leeg.' },

  // Search
  'search_products': { en: 'Search products...', nl: 'Zoek producten...' },
  'view_all_results_for': { en: 'View all results for', nl: 'Bekijk alle resultaten voor' },
  'no_products_found_for': { en: 'No products found for', nl: 'Geen producten gevonden voor' },

  // Product Card
  'adding': { en: 'Adding...', nl: 'Toevoegen...' },
  'added_to_cart': { en: 'added to cart successfully!', nl: 'succesvol toegevoegd aan winkelwagen!' },
  'failed_to_add': { en: 'Failed to add', nl: 'Toevoegen mislukt' },
  'error_adding': { en: 'Error adding', nl: 'Fout bij toevoegen' },
  'to_cart': { en: 'to cart', nl: 'aan winkelwagen' },
  'please_try_again': { en: 'Please try again', nl: 'Probeer het opnieuw' },

  // Form Fields
  'email': { en: 'Email *', nl: 'E-mail *' },
  'full_name': { en: 'Full Name *', nl: 'Volledige naam *' },
  'phone_number': { en: 'Phone Number *', nl: 'Telefoonnummer *' },
  'street_address': { en: 'Street Address *', nl: 'Straat *' },
  'city': { en: 'City *', nl: 'Stad *' },
  'state_province': { en: 'State/Province *', nl: 'Provincie *' },
  'postal_code': { en: 'Postal Code *', nl: 'Postcode *' },

  // Cart Page Specific
  'cart_empty_message': { en: 'Add some items to get started!', nl: 'Voeg artikelen toe om te beginnen!' },
  'coupon_applied_successfully': { en: 'Coupon applied successfully', nl: 'Kortingscode succesvol toegepast' },
  'enter_coupon_code': { en: 'Enter coupon code', nl: 'Voer kortingscode in' },
  'proceed_now': { en: 'Proceed to Checkout', nl: 'Doorgaan naar afrekenen' },
  'additional_products': { en: 'Additional Products', nl: 'Extra producten' }
};

async function addTranslations() {
  console.log('🔄 Adding common UI translations...\\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translations] of Object.entries(commonUITranslations)) {
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
          category: 'common'
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
          category: 'common'
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

  console.log('\\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log('\\n✨ Done!');
}

// Run the script
addTranslations()
  .then(() => {
    console.log('\\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\\n❌ Script failed:', error);
    process.exit(1);
  });
