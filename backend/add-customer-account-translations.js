/**
 * Add customer dashboard and order success page translations
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/add-customer-account-translations.js
 */

const { Translation } = require('./src/models');

const customerAccountTranslations = {
  // Common actions and labels
  'common.edit': { en: 'Edit', nl: 'Bewerken' },
  'common.delete': { en: 'Delete', nl: 'Verwijderen' },
  'common.save': { en: 'Save', nl: 'Opslaan' },
  'common.saving': { en: 'Saving...', nl: 'Opslaan...' },
  'common.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'common.details': { en: 'Details', nl: 'Details' },
  'common.less': { en: 'Less', nl: 'Minder' },
  'common.each': { en: 'each', nl: 'per stuk' },
  'common.method': { en: 'Method', nl: 'Methode' },
  'common.phone': { en: 'Phone', nl: 'Telefoon' },
  'common.country': { en: 'Country', nl: 'Land' },
  'common.creating': { en: 'Creating...', nl: 'Aanmaken...' },
  'common.unknown_product': { en: 'Unknown Product', nl: 'Onbekend product' },
  'common.all_time': { en: 'All time', nl: 'Alle tijd' },
  'common.status': { en: 'Status', nl: 'Status' },
  'common.qty': { en: 'Qty', nl: 'Aantal' },
  'common.sku': { en: 'SKU', nl: 'SKU' },
  'common.product': { en: 'Product', nl: 'Product' },
  'common.options': { en: 'Options', nl: 'Opties' },
  'common.password': { en: 'Password', nl: 'Wachtwoord' },
  'common.confirm_password': { en: 'Confirm Password', nl: 'Bevestig wachtwoord' },

  // Account - Dashboard and navigation (note: 'my_account' already exists in common-ui-translations.js)
  'account.my_account': { en: 'My Account', nl: 'Mijn Account' },
  'account.manage': { en: 'Manage your account, orders, and preferences', nl: 'Beheer je account, bestellingen en voorkeuren' },
  'account.overview': { en: 'Overview', nl: 'Overzicht' },
  'account.sign_out': { en: 'Sign Out', nl: 'Uitloggen' },
  'account.welcome_to_store': { en: 'Welcome to SprShop', nl: 'Welkom bij SprShop' },
  'account.discover_products': { en: 'Discover our premium products and services', nl: 'Ontdek onze premium producten en diensten' },
  'account.welcome_guest': { en: 'Welcome, Guest!', nl: 'Welkom, Gast!' },
  'account.browsing_as_guest': { en: 'You\'re browsing as a guest. Sign in to access your orders, addresses, and wishlist.', nl: 'Je bekijkt als gast. Meld je aan om toegang te krijgen tot je bestellingen, adressen en verlanglijst.' },
  'account.sign_in': { en: 'Sign In to Your Account', nl: 'Meld je aan bij je account' },
  'account.create_new': { en: 'Create New Account', nl: 'Nieuw account aanmaken' },

  // Orders - reuse 'total', 'order_summary', 'subtotal', 'tax', 'discount', 'shipping' from common
  'order.your_orders': { en: 'Your Orders', nl: 'Jouw bestellingen' },
  'order.total_orders': { en: 'Total Orders', nl: 'Totaal bestellingen' },
  'order.no_orders_yet': { en: 'No orders yet', nl: 'Nog geen bestellingen' },
  'order.order_history': { en: 'Your order history will appear here once you make a purchase.', nl: 'Je bestelgeschiedenis verschijnt hier zodra je een aankoop doet.' },
  'order.number': { en: 'Order', nl: 'Bestelling' },
  'order.placed': { en: 'Placed', nl: 'Geplaatst' },
  'order.store': { en: 'Store', nl: 'Winkel' },
  'order.payment': { en: 'Payment', nl: 'Betaling' },
  'order.payment_information': { en: 'Payment Information', nl: 'Betalingsinformatie' },
  'order.total_paid': { en: 'Total Paid', nl: 'Totaal betaald' },
  'order.items': { en: 'Order Items', nl: 'Bestelde items' },
  'order.status_notes': { en: 'Status Notes', nl: 'Status notities' },
  'order.cancel': { en: 'Cancel Order', nl: 'Bestelling annuleren' },
  'order.cancelling': { en: 'Cancelling...', nl: 'Annuleren...' },
  'order.request_return': { en: 'Request Return', nl: 'Retour aanvragen' },
  'order.requesting': { en: 'Requesting...', nl: 'Aanvragen...' },
  'order.date': { en: 'Order Date', nl: 'Besteldatum' },
  'order.payment_status': { en: 'Payment Status', nl: 'Betalingsstatus' },
  'order.delivery_date': { en: 'Delivery Date', nl: 'Bezorgdatum' },
  'order.delivery_time': { en: 'Delivery Time', nl: 'Bezorgtijd' },
  'order.items_processing': { en: 'Order items are being processed...', nl: 'Bestellingen worden verwerkt...' },
  'order.successful': { en: 'Your order was successful and will be fulfilled.', nl: 'Je bestelling was succesvol en zal worden afgehandeld.' },
  'order.details': { en: 'Order Details', nl: 'Besteldetails' },
  'order.total_amount': { en: 'Total Amount', nl: 'Totaalbedrag' },
  'order.unit_price': { en: 'Unit Price', nl: 'Stukprijs' },
  'order.total': { en: 'Order Total', nl: 'Besteltotaal' },
  'order.not_found': { en: 'Order Not Found', nl: 'Bestelling niet gevonden' },
  'order.check_email': { en: 'Please check your email for order confirmation or contact support.', nl: 'Controleer je e-mail voor orderbevestiging of neem contact op met support.' },
  'order.loading': { en: 'Loading your order details...', nl: 'Je bestelgegevens worden geladen...' },

  // Wishlist - reuse 'wishlist', 'add_to_cart', 'your_wishlist_is_empty' from common
  'wishlist.your': { en: 'Your Wishlist', nl: 'Jouw verlanglijst' },
  'wishlist.items': { en: 'Wishlist Items', nl: 'Verlanglijst items' },
  'wishlist.saved_for_later': { en: 'Saved for later', nl: 'Bewaard voor later' },

  // Address - reuse 'full_name', 'street_address', 'city', 'state_province', 'postal_code', 'shipping_address', 'billing_address' from common
  'address.list': { en: 'Addresses', nl: 'Adressen' },
  'address.my': { en: 'My Addresses', nl: 'Mijn adressen' },
  'address.saved': { en: 'Saved Addresses', nl: 'Opgeslagen adressen' },
  'address.delivery_locations': { en: 'Delivery locations', nl: 'Bezorglocaties' },
  'address.add': { en: 'Add Address', nl: 'Adres toevoegen' },
  'address.edit': { en: 'Edit Address', nl: 'Adres bewerken' },
  'address.add_new': { en: 'Add New Address', nl: 'Nieuw adres toevoegen' },
  'address.update': { en: 'Update Address', nl: 'Adres bijwerken' },
  'address.saving_note': { en: 'Note: Address saving for customer accounts is currently limited. If you experience issues, please contact support.', nl: 'Let op: Het opslaan van adressen voor klantaccounts is momenteel beperkt. Als je problemen ondervindt, neem dan contact op met support.' },
  'address.no_shipping': { en: 'No shipping address', nl: 'Geen verzendadres' },
  'address.default_shipping': { en: 'Set as default shipping address', nl: 'Instellen als standaard verzendadres' },
  'address.default_billing': { en: 'Set as default billing address', nl: 'Instellen als standaard factuuradres' },
  'address.default_shipping_badge': { en: 'Default Shipping', nl: 'Standaard verzending' },
  'address.default_billing_badge': { en: 'Default Billing', nl: 'Standaard facturering' },
  'address.none_saved': { en: 'No addresses saved', nl: 'Geen adressen opgeslagen' },
  'address.add_first': { en: 'Add your first address to make checkout faster.', nl: 'Voeg je eerste adres toe om het afrekenen sneller te maken.' },

  // Order Success
  'success.thank_you': { en: 'Thank You!', nl: 'Bedankt!' },
  'success.order_placed': { en: 'Your order has been successfully placed', nl: 'Je bestelling is succesvol geplaatst' },
  'success.confirmation_sent': { en: 'A confirmation email has been sent to', nl: 'Een bevestigingsmail is verzonden naar' },
  'success.download_invoice': { en: 'Download Invoice', nl: 'Factuur downloaden' },
  'success.create_account': { en: 'Create Account', nl: 'Account aanmaken' },
  'success.create_description': { en: 'Create an account using your email', nl: 'Maak een account aan met je e-mailadres' },
  'success.track_orders': { en: 'to track your orders and save your details for faster checkout. We\'ll send you a welcome email to get started.', nl: 'om je bestellingen te volgen en je gegevens op te slaan voor sneller afrekenen. We sturen je een welkomstmail om te beginnen.' },
  'success.account_created': { en: 'Your Account is Now Created!', nl: 'Je account is nu aangemaakt!' },
  'success.welcome_message': { en: 'Welcome! Your account has been successfully created with email:', nl: 'Welkom! Je account is succesvol aangemaakt met e-mailadres:' },
  'success.auto_logged_in': { en: 'You\'ve been automatically logged in', nl: 'Je bent automatisch ingelogd' },
  'success.welcome_email_sent': { en: 'A welcome email has been sent to your inbox', nl: 'Een welkomstmail is naar je inbox verzonden' },
  'success.addresses_saved': { en: 'Your shipping and billing addresses have been saved', nl: 'Je verzend- en factuuradressen zijn opgeslagen' },
  'success.track_profile': { en: 'You can now track your orders and manage your profile', nl: 'Je kunt nu je bestellingen volgen en je profiel beheren' },
  'success.view_orders': { en: 'View My Orders', nl: 'Bekijk mijn bestellingen' }
};

async function addTranslations() {
  console.log('🔄 Adding customer dashboard and order success page translations...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const [key, translations] of Object.entries(customerAccountTranslations)) {
    try {
      // Determine category from key prefix
      let category = 'customer_account';
      if (key.startsWith('common.')) category = 'common';
      else if (key.startsWith('account.')) category = 'account';
      else if (key.startsWith('order.')) category = 'order';
      else if (key.startsWith('address.')) category = 'address';
      else if (key.startsWith('wishlist.')) category = 'wishlist';
      else if (key.startsWith('success.')) category = 'order_success';

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
          category: category
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
          category: category
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
