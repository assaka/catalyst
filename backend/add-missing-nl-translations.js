/**
 * Add all missing Dutch translations
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-missing-nl-translations.js
 */

const { Translation } = require('./src/models');

const dutchTranslations = {
  // Common actions
  'common.add': 'Toevoegen',
  'common.edit': 'Bewerken',
  'common.delete': 'Verwijderen',
  'common.save': 'Opslaan',
  'common.cancel': 'Annuleren',
  'common.submit': 'Versturen',
  'common.close': 'Sluiten',
  'common.back': 'Terug',
  'common.next': 'Volgende',
  'common.previous': 'Vorige',
  'common.search': 'Zoeken',
  'common.filter': 'Filteren',
  'common.sort': 'Sorteren',
  'common.loading': 'Laden...',
  'common.yes': 'Ja',
  'common.no': 'Nee',
  'common.confirm': 'Bevestigen',
  'common.view': 'Bekijken',
  'common.download': 'Downloaden',
  'common.upload': 'Uploaden',
  'common.select': 'Selecteren',
  'common.all': 'Alles',
  'common.none': 'Geen',

  // Messages
  'message.success': 'Gelukt!',
  'message.error': 'Fout!',
  'message.warning': 'Waarschuwing!',
  'message.info': 'Info',
  'message.saved': 'Succesvol opgeslagen',
  'message.deleted': 'Succesvol verwijderd',
  'message.updated': 'Succesvol bijgewerkt',
  'message.created': 'Succesvol aangemaakt',
  'message.confirm_delete': 'Weet je zeker dat je dit wilt verwijderen?',
  'message.no_results': 'Geen resultaten gevonden',
  'message.required_field': 'Dit veld is verplicht',
  'message.invalid_email': 'Ongeldig e-mailadres',
  'message.password_mismatch': 'Wachtwoorden komen niet overeen',

  // Navigation
  'navigation.home': 'Home',
  'navigation.dashboard': 'Dashboard',
  'navigation.products': 'Producten',
  'navigation.categories': 'Categorieën',
  'navigation.orders': 'Bestellingen',
  'navigation.customers': 'Klanten',
  'navigation.settings': 'Instellingen',
  'navigation.logout': 'Uitloggen',
  'navigation.login': 'Inloggen',
  'navigation.profile': 'Profiel',
  'navigation.account': 'Mijn Account',
  'navigation.admin': 'Beheer',
  'navigation.storefront': 'Webwinkel',

  // Product
  'product.name': 'Productnaam',
  'product.price': 'Prijs',
  'product.stock': 'Voorraad',
  'product.sku': 'SKU',
  'product.description': 'Beschrijving',
  'product.images': 'Afbeeldingen',
  'product.category': 'Categorie',
  'product.in_stock': 'Op voorraad',
  'product.out_of_stock': 'Niet op voorraad',
  'product.buy_now': 'Nu kopen',
  'product.quick_view': 'Snelbekijken',
  'product.details': 'Productdetails',
  'product.reviews': 'Reviews',
  'product.related': 'Gerelateerde producten',
  'product.add_to_cart': 'Toevoegen aan winkelwagen',

  // Checkout
  'checkout.cart': 'Winkelwagen',
  'checkout.checkout': 'Afrekenen',
  'checkout.payment': 'Betaling',
  'checkout.shipping': 'Verzending',
  'checkout.billing': 'Factuuradres',
  'checkout.order_summary': 'Besteloverzicht',
  'checkout.subtotal': 'Subtotaal',
  'checkout.total': 'Totaal',
  'checkout.tax': 'BTW',
  'checkout.discount': 'Korting',
  'checkout.shipping_fee': 'Verzendkosten',
  'checkout.place_order': 'Bestelling plaatsen',
  'checkout.continue_shopping': 'Verder winkelen',
  'checkout.empty_cart': 'Je winkelwagen is leeg',
  'checkout.proceed_to_checkout': 'Doorgaan naar afrekenen',
  'checkout.apply_coupon': 'Kortingscode toepassen',

  // Account
  'account.email': 'E-mail',
  'account.password': 'Wachtwoord',
  'account.confirm_password': 'Bevestig wachtwoord',
  'account.first_name': 'Voornaam',
  'account.last_name': 'Achternaam',
  'account.phone': 'Telefoon',
  'account.address': 'Adres',
  'account.city': 'Stad',
  'account.country': 'Land',
  'account.postal_code': 'Postcode',
  'account.register': 'Registreren',
  'account.sign_up': 'Aanmelden',
  'account.forgot_password': 'Wachtwoord vergeten?',
  'account.sign_in': 'Inloggen',
  'account.reset_password': 'Wachtwoord resetten',
  'account.my_orders': 'Mijn bestellingen',
  'account.order_history': 'Bestelgeschiedenis',
  'account.wishlist': 'Verlanglijst',

  // Admin
  'admin.manage': 'Beheren',
  'admin.create': 'Aanmaken',
  'admin.update': 'Bijwerken',
  'admin.list': 'Lijst',
  'admin.details': 'Details',
  'admin.bulk_actions': 'Bulkacties',
  'admin.export': 'Exporteren',
  'admin.import': 'Importeren',
  'admin.reports': 'Rapporten',
  'admin.analytics': 'Analytics',
  'admin.translations': 'Vertalingen',
  'admin.languages': 'Talen'
};

async function addMissingDutchTranslations() {
  console.log('🔄 Adding missing Dutch translations...\n');

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const [key, value] of Object.entries(dutchTranslations)) {
    try {
      const [translation, created] = await Translation.findOrCreate({
        where: {
          key: key,
          language_code: 'nl'
        },
        defaults: {
          key: key,
          language_code: 'nl',
          value: value,
          category: key.split('.')[0] // Extract category from key (e.g., 'common' from 'common.add')
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

  console.log('\n📊 Summary:');
  console.log(`  ✅ Added: ${addedCount}`);
  console.log(`  🔄 Updated: ${updatedCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  📦 Total: ${addedCount + updatedCount + skippedCount}`);
  console.log('\n✨ All missing Dutch translations have been added!');
}

// Run the script
addMissingDutchTranslations()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
