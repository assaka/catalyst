/**
 * Cleanup unused translation keys from database
 * Run with: NODE_ENV=production DATABASE_URL="..." node backend/cleanup-unused-translations.js
 */

const { Translation } = require('./src/models');

const keysToDelete = [
  'account.address', 'account.forgot_password', 'account.my_orders', 'account.order_history',
  'account.register', 'account.reset_password', 'account.sign_up', 'admin.analytics',
  'admin.bulk_actions', 'admin.create', 'admin.details', 'admin.export', 'admin.import',
  'admin.languages', 'admin.list', 'admin.manage', 'admin.reports', 'admin.translations',
  'admin.update', 'checkout.account', 'checkout.add_products_before_checkout', 'checkout.cart',
  'checkout.could_not_apply_coupon', 'checkout.coupon_expired', 'checkout.coupon_not_active',
  'checkout.coupon_not_apply_products', 'checkout.coupon_usage_limit', 'checkout.failed_apply_coupon',
  'checkout.invalid_expired_coupon', 'checkout.minimum_order_amount_required', 'checkout.phone_label',
  'checkout.please_enter_coupon_code', 'checkout.select_country_placeholder', 'checkout.select_shipping_address',
  'checkout.shipping_fee', 'checkout.shipping_method', 'checkout.store_info_not_available',
  'common.aaaas', 'common.add_to_wishlist', 'common.attribute_filter', 'common.back',
  'common.billing_address', 'common.brand', 'common.buy_now', 'common.categories',
  'common.clear_filters', 'common.close', 'common.color', 'common.coupon_applied_successfully',
  'common.delete', 'common.download', 'common.edit', 'common.in_stock',
  'common.manage_account_description', 'common.material', 'common.need_help_contact_support',
  'common.none', 'common.order_confirmation_sent', 'common.order_confirmed', 'common.payment_method',
  'common.phone_number', 'common.please_wait', 'common.proceed_to_checkout', 'common.product_details',
  'common.product_name', 'common.quick_view', 'common.save', 'common.select', 'common.sign_out',
  'common.size', 'common.submit', 'common.success', 'common.test', 'common.test2', 'common.test3',
  'common.test333', 'common.test456', 'common.tetet', 'common.thank_you_order', 'common.upload',
  'common.view_details', 'common.yes', 'editor.header_title.1760568530031', 'editor.header_title.1760568814968',
  'editor.header_title.1760568815582', 'editor.header_title.1760568817156', 'login.confirm_password_placeholder',
  'login.create_my_account', 'login.enter_your_email', 'login.first_name_placeholder',
  'login.last_name_placeholder', 'login.login_config_not_available', 'login.login_failed_invalid_response',
  'login.signing_in', 'login.store_info_not_available_refresh', 'message.confirm_delete',
  'message.created', 'message.deleted', 'message.error', 'message.info', 'message.invalid_email',
  'message.no_results', 'message.password_mismatch', 'message.required_field', 'message.saved',
  'message.success', 'message.updated', 'message.warning', 'navigation.admin', 'navigation.customers',
  'navigation.dashboard', 'navigation.login', 'navigation.orders', 'navigation.products',
  'navigation.profile', 'navigation.settings', 'navigation.storefront', 'product.reviews'
];

async function cleanupUnusedTranslations() {
  console.log('🗑️  Cleaning up unused translation keys...\n');
  console.log(`📊 Keys to delete: ${keysToDelete.length}\n`);

  try {
    // Count before deletion
    const beforeCount = await Translation.count();
    console.log(`📊 Total translations before cleanup: ${beforeCount}`);

    // Delete unused translations
    const deletedCount = await Translation.destroy({
      where: {
        key: keysToDelete
      }
    });

    // Count after deletion
    const afterCount = await Translation.count();

    console.log(`\n✅ Deleted ${deletedCount} translation rows`);
    console.log(`📊 Total translations after cleanup: ${afterCount}`);
    console.log(`\n✨ Cleanup complete!`);

    // Show breakdown by category
    const categories = {
      account: keysToDelete.filter(k => k.startsWith('account.')).length,
      admin: keysToDelete.filter(k => k.startsWith('admin.')).length,
      checkout: keysToDelete.filter(k => k.startsWith('checkout.')).length,
      common: keysToDelete.filter(k => k.startsWith('common.')).length,
      editor: keysToDelete.filter(k => k.startsWith('editor.')).length,
      login: keysToDelete.filter(k => k.startsWith('login.')).length,
      message: keysToDelete.filter(k => k.startsWith('message.')).length,
      navigation: keysToDelete.filter(k => k.startsWith('navigation.')).length,
      product: keysToDelete.filter(k => k.startsWith('product.')).length
    };

    console.log('\n📋 Keys deleted by category:');
    for (const [category, count] of Object.entries(categories)) {
      if (count > 0) {
        console.log(`  ${category}: ${count} keys`);
      }
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  }
}

// Run the cleanup
cleanupUnusedTranslations()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
