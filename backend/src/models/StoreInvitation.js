const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const StoreInvitation = sequelize.define('StoreInvitation', {
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
  invited_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  invited_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who sent the invitation'
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    allowNull: false,
    defaultValue: 'viewer'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Granular permissions for this invitation'
  },
  invitation_token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Secure token for accepting invitation'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'When the invitation expires'
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the invitation was accepted'
  },
  accepted_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who accepted the invitation'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional message from inviter'
  }
}, {
  tableName: 'store_invitations',
  indexes: [
    {
      fields: ['store_id']
    },
    {
      fields: ['invited_email']
    },
    {
      fields: ['invitation_token']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expires_at']
    }
  ],
  hooks: {
    beforeCreate: (invitation) => {
      // Set expiration to 7 days from now if not set
      if (!invitation.expires_at) {
        invitation.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      
      // Generate secure token if not provided
      if (!invitation.invitation_token) {
        invitation.invitation_token = require('crypto').randomBytes(32).toString('hex');
      }
    }
  }
});

module.exports = StoreInvitation;