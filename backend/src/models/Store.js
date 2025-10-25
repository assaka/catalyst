const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false, // Required for all stores
    references: {
      model: 'users',
      key: 'id'
    }
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: true, // Made optional - deprecated field
    validate: {
      isEmail: true
    }
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  banner_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  theme_color: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6'
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  timezone: {
    type: DataTypes.STRING,
    defaultValue: 'UTC'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  // Contact information
  contact_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Address
  address_line1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address_line2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postal_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Social media
  website_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Stripe Connect
  stripe_account_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Store publishing and deployment status
  deployment_status: {
    type: DataTypes.ENUM('draft', 'deployed', 'published', 'failed'),
    defaultValue: 'draft'
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'stores',
  hooks: {
    beforeCreate: (store) => {
      if (!store.slug && store.name) {
        store.slug = store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    },
    beforeUpdate: (store) => {
      if (store.changed('name') && !store.changed('slug')) {
        store.slug = store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }
  }
});

// Store instance methods for deployment and publishing
Store.prototype.canPublish = function() {
  return this.deployment_status === 'deployed' && !this.published;
};

Store.prototype.publish = function() {
  return this.update({
    published: true,
    published_at: new Date(),
    deployment_status: 'published'
  });
};

Store.prototype.unpublish = function() {
  return this.update({
    published: false,
    published_at: null,
    deployment_status: 'deployed'
  });
};

Store.prototype.updateDeploymentStatus = function(status) {
  return this.update({ deployment_status: status });
};

// Static methods for deployment management
Store.findPublishedStores = function() {
  return this.findAll({
    where: { published: true },
    order: [['published_at', 'DESC']]
  });
};

Store.findByDeploymentStatus = function(status) {
  return this.findAll({
    where: { deployment_status: status },
    order: [['updated_at', 'DESC']]
  });
};

// Store instance methods for deployment and publishing
Store.prototype.canPublish = function() {
  return this.deployment_status === 'deployed' && !this.published;
};

Store.prototype.publish = function() {
  return this.update({
    published: true,
    published_at: new Date(),
    deployment_status: 'published'
  });
};

Store.prototype.unpublish = function() {
  return this.update({
    published: false,
    published_at: null,
    deployment_status: 'deployed'
  });
};

Store.prototype.updateDeploymentStatus = function(status) {
  return this.update({ deployment_status: status });
};

// Static methods for deployment management
Store.findPublishedStores = function() {
  return this.findAll({
    where: { published: true },
    order: [['published_at', 'DESC']]
  });
};

Store.findByDeploymentStatus = function(status) {
  return this.findAll({
    where: { deployment_status: status },
    order: [['updated_at', 'DESC']]
  });
};

module.exports = Store;