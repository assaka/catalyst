const { DataTypes } = require('sequelize');
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
  // Foreign key
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'addresses',
  hooks: {
    beforeCreate: async (address) => {
      // If this is set as default, unset all other defaults for this user
      if (address.is_default) {
        await Address.update(
          { is_default: false },
          { where: { user_id: address.user_id, type: address.type } }
        );
      }
    },
    beforeUpdate: async (address) => {
      // If this is set as default, unset all other defaults for this user
      if (address.is_default && address.changed('is_default')) {
        await Address.update(
          { is_default: false },
          { where: { user_id: address.user_id, type: address.type, id: { [sequelize.Op.ne]: address.id } } }
        );
      }
    }
  }
});

module.exports = Address;