const User = require('./User');
const Store = require('./Store');
const Product = require('./Product');
const Category = require('./Category');
const Attribute = require('./Attribute');
const AttributeSet = require('./AttributeSet');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Coupon = require('./Coupon');
const CmsPage = require('./CmsPage');
const CmsBlock = require('./CmsBlock');
const Tax = require('./Tax');
const ShippingMethod = require('./ShippingMethod');
const DeliverySettings = require('./DeliverySettings');
const LoginAttempt = require('./LoginAttempt');
const Customer = require('./Customer');
const Cart = require('./Cart');
const Wishlist = require('./Wishlist');
const Language = require('./Language');
const CustomerActivity = require('./CustomerActivity');
const StorePlugin = require('./StorePlugin');
const SeoSettings = require('./SeoSettings');
const SeoTemplate = require('./SeoTemplate');
const Redirect = require('./Redirect');
const ProductLabel = require('./ProductLabel');
const PaymentMethod = require('./PaymentMethod');
const CookieConsentSettings = require('./CookieConsentSettings');
const ConsentLog = require('./ConsentLog');
const Address = require('./Address');
const ProductTab = require('./ProductTab');
const StoreTeam = require('./StoreTeam');
const StoreInvitation = require('./StoreInvitation');
const IntegrationConfig = require('./IntegrationConfig');
const ImportStatistic = require('./ImportStatistic');
const Plugin = require('./Plugin');
const PluginConfiguration = require('./PluginConfiguration');
const SupabaseOAuthToken = require('./SupabaseOAuthToken');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Store, { foreignKey: 'user_id', as: 'ownedStores' });
  
  // Legacy email-based association (for backward compatibility during migration)
  User.hasMany(Store, { foreignKey: 'owner_email', sourceKey: 'email', as: 'emailStores' });

  // Store associations
  Store.belongsTo(User, { foreignKey: 'user_id', as: 'owner' });
  
  // Legacy email-based association (for backward compatibility during migration)
  Store.belongsTo(User, { foreignKey: 'owner_email', targetKey: 'email', as: 'emailOwner' });
  Store.hasMany(Product, { foreignKey: 'store_id' });
  Store.hasMany(Category, { foreignKey: 'store_id' });
  Store.hasMany(Attribute, { foreignKey: 'store_id' });
  Store.hasMany(AttributeSet, { foreignKey: 'store_id' });
  Store.hasMany(Order, { foreignKey: 'store_id' });
  Store.hasMany(Coupon, { foreignKey: 'store_id' });
  Store.hasMany(CmsPage, { foreignKey: 'store_id' });
  Store.hasMany(CmsBlock, { foreignKey: 'store_id' });
  Store.hasMany(Tax, { foreignKey: 'store_id' });
  Store.hasMany(ShippingMethod, { foreignKey: 'store_id' });
  Store.hasOne(DeliverySettings, { foreignKey: 'store_id' });

  // Product associations
  Product.belongsTo(Store, { foreignKey: 'store_id' });
  Product.belongsTo(AttributeSet, { foreignKey: 'attribute_set_id' });
  Product.hasMany(OrderItem, { foreignKey: 'product_id' });

  // Category associations
  Category.belongsTo(Store, { foreignKey: 'store_id' });
  Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });
  Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });

  // Attribute associations
  Attribute.belongsTo(Store, { foreignKey: 'store_id' });

  // AttributeSet associations
  AttributeSet.belongsTo(Store, { foreignKey: 'store_id' });
  AttributeSet.hasMany(Product, { foreignKey: 'attribute_set_id' });

  // Order associations
  Order.belongsTo(Store, { foreignKey: 'store_id' });
  Order.belongsTo(Customer, { as: 'customer', foreignKey: 'customer_id' });
  Order.hasMany(OrderItem, { foreignKey: 'order_id' });

  // OrderItem associations
  OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

  // Coupon associations
  Coupon.belongsTo(Store, { foreignKey: 'store_id' });

  // CmsPage associations
  CmsPage.belongsTo(Store, { foreignKey: 'store_id' });

  // CmsBlock associations
  CmsBlock.belongsTo(Store, { foreignKey: 'store_id' });

  // Tax associations
  Tax.belongsTo(Store, { foreignKey: 'store_id' });

  // ShippingMethod associations
  ShippingMethod.belongsTo(Store, { foreignKey: 'store_id' });

  // DeliverySettings associations
  DeliverySettings.belongsTo(Store, { foreignKey: 'store_id' });

  // Customer associations
  Customer.belongsTo(Store, { foreignKey: 'store_id' });
  Customer.hasMany(Order, { foreignKey: 'customer_id' });
  Store.hasMany(Customer, { foreignKey: 'store_id' });

  // Cart associations
  Cart.belongsTo(Store, { foreignKey: 'store_id' });
  Cart.belongsTo(User, { foreignKey: 'user_id' });
  Store.hasMany(Cart, { foreignKey: 'store_id' });

  // Wishlist associations
  Wishlist.belongsTo(Store, { foreignKey: 'store_id' });
  Wishlist.belongsTo(User, { foreignKey: 'user_id' });
  Wishlist.belongsTo(Product, { foreignKey: 'product_id' });
  Store.hasMany(Wishlist, { foreignKey: 'store_id' });
  Product.hasMany(Wishlist, { foreignKey: 'product_id' });

  // CustomerActivity associations
  CustomerActivity.belongsTo(Store, { foreignKey: 'store_id' });
  CustomerActivity.belongsTo(User, { foreignKey: 'user_id' });
  CustomerActivity.belongsTo(Product, { foreignKey: 'product_id' });
  Store.hasMany(CustomerActivity, { foreignKey: 'store_id' });

  // StorePlugin associations
  StorePlugin.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(StorePlugin, { foreignKey: 'store_id' });

  // SeoSettings associations
  SeoSettings.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasOne(SeoSettings, { foreignKey: 'store_id' });

  // SeoTemplate associations
  SeoTemplate.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(SeoTemplate, { foreignKey: 'store_id' });

  // Redirect associations
  Redirect.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(Redirect, { foreignKey: 'store_id' });

  // ProductLabel associations
  ProductLabel.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(ProductLabel, { foreignKey: 'store_id' });

  // PaymentMethod associations
  PaymentMethod.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(PaymentMethod, { foreignKey: 'store_id' });

  // CookieConsentSettings associations
  CookieConsentSettings.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasOne(CookieConsentSettings, { foreignKey: 'store_id' });

  // ConsentLog associations
  ConsentLog.belongsTo(Store, { foreignKey: 'store_id' });
  ConsentLog.belongsTo(User, { foreignKey: 'user_id' });
  Store.hasMany(ConsentLog, { foreignKey: 'store_id' });

  // Address associations - support both Users and Customers
  Address.belongsTo(User, { foreignKey: 'user_id' });
  Address.belongsTo(Customer, { foreignKey: 'customer_id' });
  User.hasMany(Address, { foreignKey: 'user_id' });
  Customer.hasMany(Address, { foreignKey: 'customer_id' });

  // ProductTab associations
  ProductTab.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(ProductTab, { foreignKey: 'store_id' });

  // StoreTeam associations
  StoreTeam.belongsTo(Store, { foreignKey: 'store_id' });
  StoreTeam.belongsTo(User, { foreignKey: 'user_id' });
  StoreTeam.belongsTo(User, { as: 'inviter', foreignKey: 'invited_by' });
  Store.hasMany(StoreTeam, { foreignKey: 'store_id' });
  User.hasMany(StoreTeam, { foreignKey: 'user_id' });

  // StoreInvitation associations
  StoreInvitation.belongsTo(Store, { foreignKey: 'store_id' });
  StoreInvitation.belongsTo(User, { as: 'inviter', foreignKey: 'invited_by' });
  StoreInvitation.belongsTo(User, { as: 'accepter', foreignKey: 'accepted_by' });
  Store.hasMany(StoreInvitation, { foreignKey: 'store_id' });
  User.hasMany(StoreInvitation, { as: 'sentInvitations', foreignKey: 'invited_by' });

  // IntegrationConfig associations
  IntegrationConfig.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(IntegrationConfig, { foreignKey: 'store_id' });

  // ImportStatistic associations
  ImportStatistic.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasMany(ImportStatistic, { foreignKey: 'store_id' });

  // Plugin associations (plugins are platform-wide, no store association)
  
  // PluginConfiguration associations (store-specific plugin configs)
  PluginConfiguration.belongsTo(Plugin, { foreignKey: 'plugin_id', as: 'plugin' });
  PluginConfiguration.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
  PluginConfiguration.belongsTo(User, { foreignKey: 'last_configured_by', as: 'configuredBy' });
  
  Plugin.hasMany(PluginConfiguration, { foreignKey: 'plugin_id', as: 'storeConfigurations' });
  Store.hasMany(PluginConfiguration, { foreignKey: 'store_id', as: 'pluginConfigurations' });
  User.hasMany(PluginConfiguration, { foreignKey: 'last_configured_by', as: 'configuredPlugins' });
  
  // SupabaseOAuthToken associations
  SupabaseOAuthToken.belongsTo(Store, { foreignKey: 'store_id' });
  Store.hasOne(SupabaseOAuthToken, { foreignKey: 'store_id' });
};

// Initialize associations
defineAssociations();

module.exports = {
  User,
  Store,
  Product,
  Category,
  Attribute,
  AttributeSet,
  Order,
  OrderItem,
  Coupon,
  CmsPage,
  CmsBlock,
  Tax,
  ShippingMethod,
  DeliverySettings,
  LoginAttempt,
  Customer,
  Cart,
  Wishlist,
  Language,
  CustomerActivity,
  StorePlugin,
  SeoSettings,
  SeoTemplate,
  Redirect,
  ProductLabel,
  PaymentMethod,
  CookieConsentSettings,
  ConsentLog,
  Address,
  ProductTab,
  StoreTeam,
  StoreInvitation,
  IntegrationConfig,
  ImportStatistic,
  Plugin,
  PluginConfiguration,
  SupabaseOAuthToken
};