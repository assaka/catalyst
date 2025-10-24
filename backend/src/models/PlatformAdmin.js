const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const PlatformAdmin = sequelize.define('PlatformAdmin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'support',
    validate: {
      isIn: [['super_admin', 'admin', 'support', 'billing', 'developer']]
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mfa_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mfa_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'platform_admins',
  indexes: [
    { fields: ['role'] },
    { fields: ['is_active'] },
    { unique: true, fields: ['user_id'] }
  ]
});

// Instance methods
PlatformAdmin.prototype.hasPermission = function(permission) {
  // Super admins have all permissions
  if (this.role === 'super_admin') {
    return true;
  }

  return this.permissions[permission] === true;
};

PlatformAdmin.prototype.recordLogin = async function() {
  this.last_login_at = new Date();
  this.login_count = (this.login_count || 0) + 1;
  await this.save();
};

// Static methods for default permissions by role
PlatformAdmin.getDefaultPermissions = function(role) {
  const permissionSets = {
    super_admin: {
      all: true
    },
    admin: {
      manage_stores: true,
      manage_subscriptions: true,
      manage_billing: true,
      view_analytics: true,
      manage_users: true,
      view_logs: true
    },
    support: {
      view_stores: true,
      view_subscriptions: true,
      manage_support_tickets: true,
      view_logs: true
    },
    billing: {
      view_stores: true,
      view_subscriptions: true,
      manage_subscriptions: true,
      manage_billing: true,
      view_analytics: true
    },
    developer: {
      view_stores: true,
      view_logs: true,
      manage_integrations: true,
      view_analytics: true
    }
  };

  return permissionSets[role] || {};
};

module.exports = PlatformAdmin;
