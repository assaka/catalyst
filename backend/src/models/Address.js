const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../database/connection');

const Address = sequelize.define('Address', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('billing', 'shipping', 'both'),
    allowNull: false,
    defaultValue: 'both'
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  street: {
    type: DataTypes.STRING,
    allowNull: false
  },
  street_2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'US'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Foreign keys - support both users and customers
  user_id: {
    type: DataTypes.UUID,
    allowNull: true, // Make optional since we can have customer_id instead
    references: {
      model: 'users',
      key: 'id'
    }
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true, // Make optional since we can have user_id instead
    references: {
      model: 'customers',
      key: 'id'
    }
  }
}, {
  tableName: 'customer_addresses',
  hooks: {
    beforeCreate: async (address) => {
      // If this is set as default, unset all other defaults for this user/customer
      if (address.is_default) {
        const whereClause = { type: address.type };
        if (address.user_id) {
          whereClause.user_id = address.user_id;
        } else if (address.customer_id) {
          whereClause.customer_id = address.customer_id;
        }
        
        await Address.update(
          { is_default: false },
          { where: whereClause }
        );
      }
    },
    beforeUpdate: async (address) => {
      // If this is set as default, unset all other defaults for this user/customer
      if (address.is_default && address.changed('is_default')) {
        const whereClause = { 
          type: address.type, 
          id: { [Op.ne]: address.id }
        };
        if (address.user_id) {
          whereClause.user_id = address.user_id;
        } else if (address.customer_id) {
          whereClause.customer_id = address.customer_id;
        }
        
        await Address.update(
          { is_default: false },
          { where: whereClause }
        );
      }
    }
  }
});

module.exports = Address;