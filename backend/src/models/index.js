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
const Tax = require('./Tax');
const ShippingMethod = require('./ShippingMethod');
const DeliverySettings = require('./DeliverySettings');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Store, { foreignKey: 'owner_email', sourceKey: 'email' });
  User.hasMany(Order, { foreignKey: 'customer_id' });

  // Store associations
  Store.belongsTo(User, { foreignKey: 'owner_email', targetKey: 'email' });
  Store.hasMany(Product, { foreignKey: 'store_id' });
  Store.hasMany(Category, { foreignKey: 'store_id' });
  Store.hasMany(Attribute, { foreignKey: 'store_id' });
  Store.hasMany(AttributeSet, { foreignKey: 'store_id' });
  Store.hasMany(Order, { foreignKey: 'store_id' });
  Store.hasMany(Coupon, { foreignKey: 'store_id' });
  Store.hasMany(CmsPage, { foreignKey: 'store_id' });
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
  Order.belongsTo(User, { as: 'customer', foreignKey: 'customer_id' });
  Order.hasMany(OrderItem, { foreignKey: 'order_id' });

  // OrderItem associations
  OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
  OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

  // Coupon associations
  Coupon.belongsTo(Store, { foreignKey: 'store_id' });

  // CmsPage associations
  CmsPage.belongsTo(Store, { foreignKey: 'store_id' });

  // Tax associations
  Tax.belongsTo(Store, { foreignKey: 'store_id' });

  // ShippingMethod associations
  ShippingMethod.belongsTo(Store, { foreignKey: 'store_id' });

  // DeliverySettings associations
  DeliverySettings.belongsTo(Store, { foreignKey: 'store_id' });
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
  Tax,
  ShippingMethod,
  DeliverySettings
};