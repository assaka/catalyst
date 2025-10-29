// Sequelize model for hamid_cart table
// Tracks cart page visits

export default function defineHamidCartModel(sequelize, DataTypes) {
  const HamidCart = sequelize.define('HamidCart', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to authenticated user'
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Session identifier for anonymous users'
    },
    cart_items_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of items in cart at visit time'
    },
    cart_subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Cart subtotal at visit time'
    },
    cart_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Cart total at visit time'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/device information'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IPv4 or IPv6 address'
    },
    referrer_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL the user came from'
    },
    visited_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp of cart visit'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'hamid_cart',
    timestamps: false, // We handle timestamps manually
    indexes: [
      { fields: ['user_id'] },
      { fields: ['session_id'] },
      { fields: ['visited_at'] },
      { fields: ['created_at'] }
    ]
  });

  return HamidCart;
}
