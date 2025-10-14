/**
 * Add checkout page translations
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-checkout-translations.js
 */

const { Translation } = require('./src/models');

const checkoutTranslations = {
  // Error messages
  'please_enter_coupon_code': { en: 'Please enter a coupon code.', nl: 'Voer een kortingscode in.' },
  'store_info_not_available': { en: 'Store information not available.', nl: 'Winkelinformatie niet beschikbaar.' },
  'coupon_expired': { en: 'This coupon has expired.', nl: 'Deze kortingscode is verlopen.' },
  'coupon_not_active': { en: 'This coupon is not yet active.', nl: 'Deze kortingscode is nog niet actief.' },
  'coupon_usage_limit': { en: 'This coupon has reached its usage limit.', nl: 'Deze kortingscode heeft de gebruikslimiet bereikt.' },
  'minimum_order_amount_required': { en: 'Minimum order amount of {amount} required for this coupon.', nl: 'Minimaal bestelbedrag van {amount} vereist voor deze kortingscode.' },
  'coupon_not_apply_products': { en: "This coupon doesn't apply to any products in your cart.", nl: 'Deze kortingscode is niet van toepassing op producten in je winkelwagen.' },
  'failed_apply_coupon': { en: 'Failed to apply coupon. Please try again.', nl: 'Kortingscode toepassen mislukt. Probeer het opnieuw.' },
  'invalid_expired_coupon': { en: 'Invalid or expired coupon code.', nl: 'Ongeldige of verlopen kortingscode.' },
  'could_not_apply_coupon': { en: 'Could not apply coupon. Please try again.', nl: 'Kortingscode kon niet worden toegepast. Probeer het opnieuw.' },

  // Cart empty state
  'your_cart_empty': { en: 'Your cart is empty', nl: 'Je winkelwagen is leeg' },
  'add_products_before_checkout': { en: 'Add some products to your cart before checking out.', nl: 'Voeg producten toe aan je winkelwagen voordat je afrekent.' },

  // Section titles
  'shipping_address': { en: 'Shipping Address', nl: 'Verzendadres' },
  'shipping_method': { en: 'Shipping Method', nl: 'Verzendmethode' },
  'billing_address': { en: 'Billing Address', nl: 'Factuuradres' },
  'delivery_settings': { en: 'Delivery Settings', nl: 'Bezorginstellingen' },
  'payment_method': { en: 'Payment Method', nl: 'Betaalmethode' },
  'apply_coupon': { en: 'Apply Coupon', nl: 'Kortingscode toepassen' },
  'order_summary': { en: 'Order Summary', nl: 'Besteloverzicht' },

  // Form labels and placeholders
  'enter_coupon_code': { en: 'Enter coupon code', nl: 'Voer kortingscode in' },
  'same_as_shipping': { en: 'Same as shipping address', nl: 'Hetzelfde als verzendadres' },
  'preferred_delivery_date': { en: 'Preferred Delivery Date', nl: 'Gewenste bezorgdatum' },
  'select_delivery_date': { en: 'Select a delivery date', nl: 'Selecteer een bezorgdatum' },
  'preferred_time_slot': { en: 'Preferred Time Slot', nl: 'Gewenst tijdvak' },
  'select_time_slot': { en: 'Select a time slot', nl: 'Selecteer een tijdvak' },
  'special_delivery_instructions': { en: 'Special delivery instructions (optional)', nl: 'Speciale bezorginstructies (optioneel)' },
  'special_instructions_placeholder': { en: 'Any special instructions for delivery...', nl: 'Speciale instructies voor bezorging...' },

  // Address related
  'add_new_shipping_address': { en: '+ Add a new shipping address', nl: '+ Nieuw verzendadres toevoegen' },
  'no_saved_addresses': { en: "You don't have any saved addresses. Add one below.", nl: 'Je hebt geen opgeslagen adressen. Voeg er hieronder een toe.' },
  'enter_shipping_address': { en: 'Enter your shipping address', nl: 'Voer je verzendadres in' },
  'select_shipping_address': { en: 'Please select a shipping address or add a new one', nl: 'Selecteer een verzendadres of voeg een nieuw adres toe' },
  'valid_email_required': { en: 'Please enter a valid email address', nl: 'Voer een geldig e-mailadres in' },
  'save_address_future': { en: 'Save this address to my account for future orders', nl: 'Bewaar dit adres voor toekomstige bestellingen' },
  'add_new_billing_address': { en: '+ Add a new billing address', nl: '+ Nieuw factuuradres toevoegen' },
  'save_billing_future': { en: 'Save this billing address to my account for future orders', nl: 'Bewaar dit factuuradres voor toekomstige bestellingen' },
  'default': { en: 'Default', nl: 'Standaard' },
  'phone_label': { en: 'Phone:', nl: 'Telefoon:' },

  // Order summary
  'items_in_cart': { en: 'Items in Cart', nl: 'Artikelen in winkelwagen' },
  'qty': { en: 'Qty:', nl: 'Aantal:' },
  'each': { en: 'each', nl: 'per stuk' },
  'custom_options': { en: 'Custom Options', nl: 'Extra opties' },
  'discount': { en: 'Discount', nl: 'Korting' },
  'shipping': { en: 'Shipping', nl: 'Verzending' },
  'free': { en: 'Free', nl: 'Gratis' },
  'payment_fee': { en: 'Payment Fee', nl: 'Transactiekosten' },
  'tax': { en: 'Tax', nl: 'BTW' },
  'total': { en: 'Total', nl: 'Totaal' },
  'place_order': { en: 'Place Order', nl: 'Bestelling plaatsen' },
  'processing': { en: 'Processing...', nl: 'Verwerken...' },

  // Coupon related
  'applied': { en: 'Applied:', nl: 'Toegepast:' },
  'off': { en: 'off', nl: 'korting' },

  // Navigation
  'previous': { en: 'Previous', nl: 'Vorige' },
  'continue': { en: 'Continue', nl: 'Verder' },
  'edit_info': { en: 'Edit Info', nl: 'Info bewerken' },

  // Misc
  'fee': { en: 'Fee:', nl: 'Kosten:' },
  'account': { en: 'Account', nl: 'Account' }
};

async function addTranslations() {
  console.log('🔄 Adding checkout page translations...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translations] of Object.entries(checkoutTranslations)) {
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
          category: 'checkout'
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
          category: 'checkout'
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
