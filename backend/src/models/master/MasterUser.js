/**
 * MasterUser Model (Master Database)
 *
 * Stores agency/store owner users in master database
 * IDENTICAL structure to tenant User model, but only contains:
 * - account_type = 'agency'
 *
 * This is synced FROM tenant databases where account_type = 'agency'
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { masterSequelize } = require('../../database/masterConnection');

const MasterUser = masterSequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_verification_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'store_owner'),
    defaultValue: 'store_owner'
  },
  account_type: {
    type: DataTypes.ENUM('agency', 'individual'),
    defaultValue: 'agency',
    validate: {
      isAgency(value) {
        if (value !== 'agency') {
          throw new Error('Master DB users must be agency type');
        }
      }
    }
  },
  credits: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['email', 'role'],
      name: 'unique_email_role'
    },
    {
      fields: ['email']
    },
    {
      fields: ['account_type']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      // Hash password if not already hashed
      if (user.password && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, 10);
      }

      // Enforce agency type
      user.account_type = 'agency';
    },
    beforeUpdate: async (user) => {
      // Hash password if changed
      if (user.changed('password') && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Instance Methods

/**
 * Compare password with hash
 * @param {string} candidatePassword - Password to check
 * @returns {Promise<boolean>}
 */
MasterUser.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Update last login timestamp
 * @returns {Promise<void>}
 */
MasterUser.prototype.updateLastLogin = async function() {
  this.last_login = new Date();
  await this.save();
};

/**
 * Serialize user for JSON (remove sensitive fields)
 * @returns {Object}
 */
MasterUser.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.email_verification_token;
  delete values.password_reset_token;
  delete values.password_reset_expires;
  return values;
};

// Class Methods

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<MasterUser|null>}
 */
MasterUser.findByEmail = async function(email) {
  return this.findOne({ where: { email } });
};

/**
 * Find active agency users
 * @returns {Promise<MasterUser[]>}
 */
MasterUser.findActiveAgencies = async function() {
  return this.findAll({
    where: {
      account_type: 'agency',
      is_active: true
    },
    order: [['created_at', 'DESC']]
  });
};

module.exports = MasterUser;
