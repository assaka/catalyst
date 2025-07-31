const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const StoreTeam = sequelize.define('StoreTeam', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
    allowNull: false,
    defaultValue: 'viewer',
    comment: 'owner: full access, admin: manage store & team, editor: manage store content, viewer: read-only access'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Granular permissions override: {"products": {"create": true, "update": false}, "orders": {"view": true}}'
  },
  invited_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who sent the invitation'
  },
  invited_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the invitation was sent'
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the user accepted the invitation'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended', 'removed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'pending: invitation sent, active: member active, suspended: temporarily disabled, removed: soft delete'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'store_teams',
  indexes: [
    {
      unique: true,
      fields: ['store_id', 'user_id'],
      name: 'unique_store_user'
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    }
  ],
  hooks: {
    beforeCreate: (storeTeam) => {
      // Set accepted_at if status is active
      if (storeTeam.status === 'active' && !storeTeam.accepted_at) {
        storeTeam.accepted_at = new Date();
      }
    },
    beforeUpdate: (storeTeam) => {
      // Set accepted_at when status changes to active
      if (storeTeam.changed('status') && storeTeam.status === 'active' && !storeTeam.accepted_at) {
        storeTeam.accepted_at = new Date();
      }
    }
  }
});

module.exports = StoreTeam;