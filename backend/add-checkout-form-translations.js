/**
 * Add checkout form field translations
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-checkout-form-translations.js
 */

const { Translation } = require('./src/models');

const checkoutFormTranslations = {
  // Page title
  'checkout': { en: 'Checkout', nl: 'Afrekenen' },

  // Form field placeholders (these already exist in common translations but adding here for completeness)
  'email_placeholder': { en: 'Email *', nl: 'E-mail *' },
  'full_name_placeholder': { en: 'Full Name *', nl: 'Volledige naam *' },
  'phone_number_placeholder': { en: 'Phone Number *', nl: 'Telefoonnummer *' },
  'street_address_placeholder': { en: 'Street Address *', nl: 'Straat *' },
  'city_placeholder': { en: 'City *', nl: 'Stad *' },
  'state_province_placeholder': { en: 'State/Province *', nl: 'Provincie *' },
  'postal_code_placeholder': { en: 'Postal Code *', nl: 'Postcode *' },
  'select_country_placeholder': { en: 'Select country... *', nl: 'Selecteer land... *' },

  // Delivery settings
  'delivery_settings': { en: 'Delivery Settings', nl: 'Bezorginstellingen' },
  'preferred_delivery_date': { en: 'Preferred Delivery Date', nl: 'Gewenste bezorgdatum' },
  'select_delivery_date': { en: 'Select a delivery date', nl: 'Selecteer een bezorgdatum' },
  'preferred_time_slot': { en: 'Preferred Time Slot', nl: 'Gewenst tijdvak' },
  'select_time_slot': { en: 'Select a time slot', nl: 'Selecteer een tijdvak' },
  'special_delivery_instructions': { en: 'Special delivery instructions (optional)', nl: 'Speciale bezorginstructies (optioneel)' },
  'special_instructions_placeholder': { en: 'Any special instructions for delivery...', nl: 'Speciale instructies voor bezorging...' },

  // Payment and order summary
  'payment_method': { en: 'Payment Method', nl: 'Betaalmethode' },
  'fee': { en: 'Fee:', nl: 'Kosten:' },
  'apply_coupon': { en: 'Apply Coupon', nl: 'Kortingscode toepassen' },
  'enter_coupon_code': { en: 'Enter coupon code', nl: 'Voer kortingscode in' },
  'apply': { en: 'Apply', nl: 'Toepassen' },
  'applied': { en: 'Applied:', nl: 'Toegepast:' },
  'off': { en: 'off', nl: 'korting' },
  'order_summary': { en: 'Order Summary', nl: 'Besteloverzicht' },
  'items_in_cart': { en: 'Items in Cart', nl: 'Artikelen in winkelwagen' },
  'each': { en: 'each', nl: 'per stuk' },
  'qty': { en: 'Qty:', nl: 'Aantal:' },
  'subtotal': { en: 'Subtotal', nl: 'Subtotaal' },
  'custom_options': { en: 'Custom Options', nl: 'Extra opties' },
  'discount': { en: 'Discount', nl: 'Korting' },
  'shipping': { en: 'Shipping', nl: 'Verzending' },
  'free': { en: 'Free', nl: 'Gratis' },
  'payment_fee': { en: 'Payment Fee', nl: 'Transactiekosten' },
  'tax': { en: 'Tax', nl: 'BTW' },
  'total': { en: 'Total', nl: 'Totaal' },
  'processing': { en: 'Processing...', nl: 'Verwerken...' },
  'place_order': { en: 'Place Order', nl: 'Bestelling plaatsen' }
};

async function addTranslations() {
  console.log('🔄 Adding checkout form translations...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translations] of Object.entries(checkoutFormTranslations)) {
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
