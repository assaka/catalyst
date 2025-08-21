const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * RouteRedirect Model
 * Manages URL redirects (301, 302) for SEO and legacy URL support
 */
const RouteRedirect = sequelize.define('RouteRedirect', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  from_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Original path to redirect from'
  },
  to_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Target path to redirect to'
  },
  redirect_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 301,
    validate: {
      isIn: [[301, 302, 307, 308]]
    },
    comment: '301: Permanent, 302: Temporary, 307: Temporary (preserve method), 308: Permanent (preserve method)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  hit_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Track how often this redirect is used'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'route_redirects',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['store_id', 'from_path'],
      unique: true
    },
    {
      fields: ['is_active']
    }
  ]
});

/**
 * Static method: Find redirect by store and path
 * @param {string} storeId - Store ID
 * @param {string} fromPath - Source path
 * @returns {Object|null} Redirect object or null
 */
RouteRedirect.findRedirect = async function(storeId, fromPath) {
  try {
    return await this.findOne({
      where: {
        store_id: storeId,
        from_path: fromPath,
        is_active: true
      }
    });
  } catch (error) {
    console.error('Error finding redirect:', error);
    return null;
  }
};

/**
 * Static method: Create a redirect with validation
 * @param {Object} redirectData - Redirect data
 * @returns {Object} Created redirect
 */
RouteRedirect.createRedirect = async function(redirectData) {
  try {
    // Validate paths
    if (redirectData.from_path === redirectData.to_path) {
      throw new Error('From and To paths cannot be the same');
    }

    // Ensure paths start with /
    if (!redirectData.from_path.startsWith('/')) {
      redirectData.from_path = '/' + redirectData.from_path;
    }
    if (!redirectData.to_path.startsWith('/')) {
      redirectData.to_path = '/' + redirectData.to_path;
    }

    // Check for circular redirects
    const existingRedirect = await this.findOne({
      where: {
        store_id: redirectData.store_id,
        from_path: redirectData.to_path,
        to_path: redirectData.from_path,
        is_active: true
      }
    });

    if (existingRedirect) {
      throw new Error('Circular redirect detected');
    }

    return await this.create(redirectData);
  } catch (error) {
    console.error('Error creating redirect:', error);
    throw error;
  }
};

/**
 * Instance method: Increment hit count
 */
RouteRedirect.prototype.incrementHitCount = async function() {
  try {
    await this.increment('hit_count');
  } catch (error) {
    console.error('Error incrementing hit count:', error);
  }
};

/**
 * Instance method: Check if redirect is permanent
 */
RouteRedirect.prototype.isPermanent = function() {
  return this.redirect_type === 301 || this.redirect_type === 308;
};

/**
 * Static method: Get all redirects for a store
 * @param {string} storeId - Store ID
 * @param {Object} options - Query options
 * @returns {Array} Array of redirects
 */
RouteRedirect.getStoreRedirects = async function(storeId, options = {}) {
  try {
    const whereClause = {
      store_id: storeId,
      ...(options.activeOnly !== false && { is_active: true })
    };

    return await this.findAll({
      where: whereClause,
      order: [
        ['hit_count', 'DESC'],
        ['created_at', 'DESC']
      ],
      ...(options.limit && { limit: options.limit })
    });
  } catch (error) {
    console.error('Error getting store redirects:', error);
    return [];
  }
};

module.exports = RouteRedirect;