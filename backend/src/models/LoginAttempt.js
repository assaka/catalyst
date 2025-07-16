const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const LoginAttempt = sequelize.define('LoginAttempt', {
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
  ip_address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attempted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'login_attempts',
  timestamps: false,
  indexes: [
    {
      fields: ['email', 'attempted_at']
    },
    {
      fields: ['ip_address', 'attempted_at']
    }
  ]
});

// Static method to check if login attempts exceeded
LoginAttempt.checkRateLimit = async function(email, ipAddress, maxAttempts = 5, windowMinutes = 15) {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const attemptCount = await this.count({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { email },
        { ip_address: ipAddress }
      ],
      success: false,
      attempted_at: {
        [sequelize.Sequelize.Op.gte]: windowStart
      }
    }
  });
  
  return attemptCount >= maxAttempts;
};

// Static method to clean old attempts
LoginAttempt.cleanOldAttempts = async function(daysToKeep = 30) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  await this.destroy({
    where: {
      attempted_at: {
        [sequelize.Sequelize.Op.lt]: cutoffDate
      }
    }
  });
};

module.exports = LoginAttempt;