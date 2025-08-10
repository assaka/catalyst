const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const HeatmapInteraction = sequelize.define('HeatmapInteraction', {
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
  page_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  page_title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  viewport_width: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 200,
      max: 5000
    }
  },
  viewport_height: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 200,
      max: 5000
    }
  },
  interaction_type: {
    type: DataTypes.ENUM('click', 'hover', 'scroll', 'mouse_move', 'touch', 'focus', 'key_press'),
    allowNull: false
  },
  x_coordinate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  y_coordinate: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  element_selector: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  element_tag: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  element_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  element_class: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  element_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  scroll_position: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  scroll_depth_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  time_on_element: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  device_type: {
    type: DataTypes.ENUM('desktop', 'tablet', 'mobile'),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp_utc: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'heatmap_interactions',
  indexes: [
    {
      fields: ['store_id', 'page_url', 'timestamp_utc'],
      name: 'idx_heatmap_store_page_time'
    },
    {
      fields: ['session_id'],
      name: 'idx_heatmap_session'
    },
    {
      fields: ['store_id', 'page_url', 'interaction_type', 'x_coordinate', 'y_coordinate'],
      name: 'idx_heatmap_coordinates'
    },
    {
      fields: ['viewport_width', 'viewport_height'],
      name: 'idx_heatmap_viewport'
    }
  ]
});

// Instance methods
HeatmapInteraction.prototype.getRelativeCoordinates = function(targetViewport) {
  if (!this.x_coordinate || !this.y_coordinate) return null;
  
  const scaleX = targetViewport.width / this.viewport_width;
  const scaleY = targetViewport.height / this.viewport_height;
  
  return {
    x: Math.round(this.x_coordinate * scaleX),
    y: Math.round(this.y_coordinate * scaleY)
  };
};

// Static methods
HeatmapInteraction.getHeatmapData = async function(storeId, pageUrl, options = {}) {
  const {
    startDate,
    endDate,
    interactionTypes = ['click', 'hover'],
    viewportWidth = 1920,
    viewportHeight = 1080,
    deviceTypes = ['desktop', 'tablet', 'mobile']
  } = options;

  const whereClause = {
    store_id: storeId,
    page_url: pageUrl,
    interaction_type: interactionTypes,
    device_type: deviceTypes
  };

  if (startDate) {
    whereClause.timestamp_utc = { [sequelize.Sequelize.Op.gte]: startDate };
  }
  
  if (endDate) {
    whereClause.timestamp_utc = {
      ...whereClause.timestamp_utc,
      [sequelize.Sequelize.Op.lte]: endDate
    };
  }

  const interactions = await this.findAll({
    where: whereClause,
    attributes: [
      'x_coordinate',
      'y_coordinate',
      'viewport_width',
      'viewport_height',
      'interaction_type',
      'device_type',
      'time_on_element',
      'timestamp_utc'
    ],
    order: [['timestamp_utc', 'DESC']]
  });

  // Normalize coordinates to target viewport
  return interactions.map(interaction => {
    const relativeCoords = interaction.getRelativeCoordinates({
      width: viewportWidth,
      height: viewportHeight
    });

    return {
      ...interaction.toJSON(),
      normalized_x: relativeCoords?.x || interaction.x_coordinate,
      normalized_y: relativeCoords?.y || interaction.y_coordinate
    };
  });
};

HeatmapInteraction.getHeatmapSummary = async function(storeId, options = {}) {
  const {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate = new Date(),
    groupBy = 'page_url'
  } = options;

  const query = `
    SELECT 
      ${groupBy},
      interaction_type,
      COUNT(*) as interaction_count,
      COUNT(DISTINCT session_id) as unique_sessions,
      AVG(time_on_element) as avg_time_on_element,
      COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_count,
      COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_count,
      COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_count
    FROM heatmap_interactions 
    WHERE store_id = :storeId 
      AND timestamp_utc BETWEEN :startDate AND :endDate
    GROUP BY ${groupBy}, interaction_type
    ORDER BY interaction_count DESC
  `;

  return await sequelize.query(query, {
    replacements: { storeId, startDate, endDate },
    type: sequelize.QueryTypes.SELECT
  });
};

module.exports = HeatmapInteraction;