#!/usr/bin/env node
/**
 * Fix Handlebars translation keys to use dot notation
 * Updates {{t "key"}} to {{t "category.key"}}
 */

const fs = require('fs');
const path = require('path');

// Mapping of old keys to new dot notation keys
const keyMappings = {
  // Product keys
  'sku': 'product.sku',
  'qty': 'product.qty',
  'add_to_cart': 'product.add_to_cart',
  'recommended_products': 'product.recommended',
  'out_of_stock': 'product.out_of_stock',

  // Account/Auth keys
  'welcome_back': 'account.welcome_back',
  'already_registered_login': 'account.already_registered',
  'create_account': 'account.create_account',
  'terms_agreement': 'account.terms_agreement',
  'my_account': 'account.my_account',
  'sign_in': 'account.sign_in',
  'sign_out': 'account.logout',
  'manage_account_description': 'account.manage_description',
  'need_help_contact_support': 'account.need_help',

  // Cart/Checkout keys
  'my_cart': 'checkout.cart',
  'your_cart_is_empty': 'common.cart_empty',
  'cart_empty_message': 'common.cart_empty_message',
  'continue_shopping': 'common.continue_shopping',
  'remove': 'common.remove',
  'apply_coupon': 'common.apply_coupon',
  'coupon_applied_successfully': 'common.coupon_applied_successfully',
  'enter_coupon_code': 'common.enter_coupon_code',
  'apply': 'common.apply',
  'order_summary': 'checkout.order_summary',
  'subtotal': 'checkout.subtotal',
  'additional_products': 'common.additional_products',
  'discount': 'checkout.discount',
  'tax': 'checkout.tax',
  'total': 'checkout.total',
  'proceed_now': 'common.proceed_now',
  'checkout': 'checkout.checkout',
  'processing_order': 'checkout.processing_order',

  // Category/Filter keys
  'category_description': 'common.category_description',
  'filters': 'common.filters',
  'filter_by': 'common.filter_by',
  'price': 'product.price',
  'show_more': 'common.show_more',
  'apply_filters': 'common.apply_filters',
  'of': 'common.of',
  'products': 'product.products',
  'sort_by': 'common.sort_by',
  'sort_position': 'common.sort_position',
  'sort_name_asc': 'common.sort_name_asc',
  'sort_name_desc': 'common.sort_name_desc',
  'sort_price_low': 'common.sort_price_low',
  'sort_price_high': 'common.sort_price_high',
  'sort_newest': 'common.sort_newest',
  'active_filters': 'common.active_filters',
  'clear_all': 'common.clear_all',
  'previous': 'common.previous',
  'next': 'common.next',
};

const configDir = path.join(__dirname, 'src', 'components', 'editor', 'slot', 'configs');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changeCount = 0;

  // Replace each old key with new dot notation key
  Object.entries(keyMappings).forEach(([oldKey, newKey]) => {
    const regex = new RegExp(`\\{\\{t\\s+"${oldKey}"\\}\\}`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `{{t "${newKey}"}}`);
      changeCount += matches.length;
    }
  });

  if (changeCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.basename(filePath)}: Updated ${changeCount} translation keys`);
    return changeCount;
  } else {
    console.log(`⏭️  ${path.basename(filePath)}: No changes needed`);
    return 0;
  }
}

function main() {
  console.log('🔧 Fixing Handlebars translation keys...\n');

  const files = [
    'product-config.js',
    'category-config.js',
    'cart-config.js',
    'checkout-config.js',
    'login-config.js',
    'account-config.js',
    'header-config.js'
  ];

  let totalChanges = 0;

  files.forEach(file => {
    const filePath = path.join(configDir, file);
    if (fs.existsSync(filePath)) {
      totalChanges += updateFile(filePath);
    } else {
      console.log(`⚠️  ${file}: File not found`);
    }
  });

  console.log(`\n✨ Done! Updated ${totalChanges} translation keys across ${files.length} files`);
}

main();
