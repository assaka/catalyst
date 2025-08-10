const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const HeatmapSession = sequelize.define('HeatmapSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  first_page_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_page_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  session_start: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  session_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  page_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  interaction_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bounce_session: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  conversion_session: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  device_type: {
    type: DataTypes.ENUM('desktop', 'tablet', 'mobile'),
    allowNull: true
  },
  browser_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  operating_system: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  referrer_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  utm_source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utm_medium: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utm_campaign: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'heatmap_sessions',
  indexes: [
    {
      fields: ['store_id', 'session_start'],
      name: 'idx_heatmap_sessions_store_time'
    },
    {
      fields: ['session_id'],
      name: 'idx_heatmap_sessions_session_id'
    },
    {
      fields: ['store_id', 'session_id'],
      unique: true,
      name: 'unique_store_session'
    }
  ]
});

// Instance methods
HeatmapSession.prototype.calculateDuration = function() {
  if (!this.session_end) return null;
  return Math.round((new Date(this.session_end) - new Date(this.session_start)) / 1000);
};

HeatmapSession.prototype.updateSessionEnd = async function() {
  this.session_end = new Date();
  this.total_duration = this.calculateDuration();
  await this.save();
};

// Static methods
HeatmapSession.createOrUpdate = async function(sessionData) {
  const { session_id, store_id } = sessionData;
  
  try {
    const [session, created] = await this.findOrCreate({
      where: { session_id, store_id },
      defaults: sessionData
    });

    if (!created) {
      // Update existing session
      await session.update({
        last_page_url: sessionData.last_page_url || session.last_page_url,
        page_count: (session.page_count || 0) + 1,
        interaction_count: sessionData.interaction_count || session.interaction_count,
        session_end: new Date(),
        total_duration: sessionData.total_duration || session.calculateDuration()
      });
    }

    return session;
  } catch (error) {
    console.error('Error creating/updating heatmap session:', error);
    throw error;
  }
};

HeatmapSession.getSessionAnalytics = async function(storeId, options = {}) {
  const {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
    deviceType = null
  } = options;

  const whereClause = {
    store_id: storeId,
    session_start: {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    }
  };

  if (deviceType) {
    whereClause.device_type = deviceType;
  }

  const analytics = await this.findAll({
    where: whereClause,
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sessions'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN bounce_session = true THEN 1 END')), 'bounce_sessions'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN conversion_session = true THEN 1 END')), 'conversion_sessions'],
      [sequelize.fn('AVG', sequelize.col('total_duration')), 'avg_session_duration'],
      [sequelize.fn('AVG', sequelize.col('page_count')), 'avg_pages_per_session'],
      [sequelize.fn('AVG', sequelize.col('interaction_count')), 'avg_interactions_per_session']
    ],
    group: deviceType ? ['device_type'] : [],
    raw: true
  });

  return analytics;
};

HeatmapSession.getTopPages = async function(storeId, options = {}) {
  const {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate = new Date(),
    limit = 10
  } = options;

  const query = `
    SELECT 
      first_page_url as page_url,
      COUNT(*) as sessions,
      AVG(total_duration) as avg_duration,
      AVG(page_count) as avg_page_views,
      COUNT(CASE WHEN bounce_session = true THEN 1 END) as bounces,
      ROUND(
        (COUNT(CASE WHEN bounce_session = true THEN 1 END) * 100.0 / COUNT(*)), 2
      ) as bounce_rate
    FROM heatmap_sessions 
    WHERE store_id = :storeId 
      AND session_start BETWEEN :startDate AND :endDate
    GROUP BY first_page_url
    ORDER BY sessions DESC
    LIMIT :limit
  `;

  return await sequelize.query(query, {
    replacements: { storeId, startDate, endDate, limit },
    type: sequelize.QueryTypes.SELECT
  });
};

module.exports = HeatmapSession;