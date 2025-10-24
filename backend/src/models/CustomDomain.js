const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CustomDomain = sequelize.define('CustomDomain', {
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
    }
  },

  // Domain details
  domain: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      is: /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    }
  },
  subdomain: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // DNS Configuration
  dns_configured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dns_provider: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  // Verification
  verification_status: {
    type: DataTypes.ENUM('pending', 'verifying', 'verified', 'failed'),
    defaultValue: 'pending'
  },
  verification_method: {
    type: DataTypes.ENUM('txt', 'cname', 'http'),
    defaultValue: 'txt'
  },
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  verification_record_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  verification_record_value: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // SSL/TLS Certificate
  ssl_status: {
    type: DataTypes.ENUM('pending', 'active', 'failed', 'expired', 'renewing'),
    defaultValue: 'pending'
  },
  ssl_provider: {
    type: DataTypes.STRING(50),
    defaultValue: 'letsencrypt'
  },
  ssl_certificate_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ssl_issued_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ssl_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ssl_auto_renew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  // DNS Records
  dns_records: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  cname_target: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  // Redirect configuration
  redirect_to_https: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  redirect_to_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // Custom configuration
  custom_headers: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  custom_rewrites: {
    type: DataTypes.JSONB,
    defaultValue: []
  },

  // CDN Configuration
  cdn_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cdn_provider: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  cdn_config: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },

  // Analytics
  last_accessed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  access_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // Metadata
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'custom_domains',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['domain'], unique: true },
    { fields: ['verification_status'] },
    { fields: ['ssl_status'] },
    { fields: ['is_active'] },
    { fields: ['is_primary'] }
  ]
});

// Instance methods
CustomDomain.prototype.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.verification_token = `catalyst-verify-${crypto.randomBytes(16).toString('hex')}`;
  this.verification_record_name = `_catalyst-verification.${this.domain}`;
  this.verification_record_value = this.verification_token;
  return this.verification_token;
};

CustomDomain.prototype.markAsVerified = async function() {
  this.verification_status = 'verified';
  this.verified_at = new Date();
  this.is_active = true;
  await this.save();
};

CustomDomain.prototype.getRequiredDNSRecords = function() {
  const platformDomain = process.env.PLATFORM_DOMAIN || 'catalyst.app';

  return [
    {
      type: 'CNAME',
      name: this.subdomain ? this.subdomain : '@',
      value: `stores.${platformDomain}`,
      ttl: 3600,
      required: true
    },
    {
      type: 'TXT',
      name: `_catalyst-verification${this.subdomain ? `.${this.subdomain}` : ''}`,
      value: this.verification_token,
      ttl: 300,
      required: true,
      purpose: 'Domain ownership verification'
    }
  ];
};

// Static methods
CustomDomain.findByDomain = async function(domain) {
  return await this.findOne({
    where: { domain },
    include: ['Store']
  });
};

CustomDomain.findPrimaryForStore = async function(storeId) {
  return await this.findOne({
    where: {
      store_id: storeId,
      is_primary: true,
      is_active: true
    }
  });
};

CustomDomain.findAllActiveForStore = async function(storeId) {
  return await this.findAll({
    where: {
      store_id: storeId,
      is_active: true
    },
    order: [['is_primary', 'DESC'], ['created_at', 'DESC']]
  });
};

// Hooks
CustomDomain.beforeCreate(async (domain) => {
  if (!domain.verification_token) {
    domain.generateVerificationToken();
  }

  // Set default CNAME target
  const platformDomain = process.env.PLATFORM_DOMAIN || 'catalyst.app';
  domain.cname_target = `stores.${platformDomain}`;
});

CustomDomain.beforeSave(async (domain) => {
  // If marking as primary, unset other primary domains for this store
  if (domain.is_primary && domain.changed('is_primary')) {
    await CustomDomain.update(
      { is_primary: false },
      {
        where: {
          store_id: domain.store_id,
          id: { [sequelize.Sequelize.Op.ne]: domain.id }
        }
      }
    );
  }
});

module.exports = CustomDomain;
