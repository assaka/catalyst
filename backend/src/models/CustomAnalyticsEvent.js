/**
 * Custom Analytics Event Model
 * Allows store owners to configure custom dataLayer events and tracking
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CustomAnalyticsEvent = sequelize.define('CustomAnalyticsEvent', {
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
  event_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Event name for dataLayer (e.g., "add_to_wishlist", "newsletter_signup")'
  },
  display_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Human-readable name shown in admin'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what this event tracks'
  },
  event_category: {
    type: DataTypes.ENUM('ecommerce', 'engagement', 'conversion', 'navigation', 'custom'),
    defaultValue: 'custom',
    comment: 'Category for organizing events'
  },
  trigger_type: {
    type: DataTypes.ENUM('page_load', 'click', 'form_submit', 'scroll', 'timer', 'custom', 'automatic'),
    allowNull: false,
    comment: 'When the event should fire'
  },
  trigger_selector: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'CSS selector for click/form triggers (e.g., ".add-to-cart-btn")'
  },
  trigger_condition: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional conditions: {page_type: "product", scroll_depth: 50}'
  },
  event_parameters: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Parameters to send with event: {category: "{{category_name}}", value: "{{price}}"}'
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Execution priority (higher = earlier)'
  },
  is_system: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'System events cannot be deleted (only disabled)'
  },
  fire_once_per_session: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Prevent duplicate events in same session'
  },
  send_to_backend: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether to also log to customer_activities table'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional configuration'
  }
}, {
  tableName: 'custom_analytics_events',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['store_id'] },
    { fields: ['enabled'] },
    { fields: ['trigger_type'] },
    { fields: ['event_category'] },
    { fields: ['priority'] }
  ]
});

/**
 * Get active events for a store
 */
CustomAnalyticsEvent.getActiveEvents = async function(storeId, options = {}) {
  const where = {
    store_id: storeId,
    enabled: true
  };

  if (options.triggerType) {
    where.trigger_type = options.triggerType;
  }

  if (options.eventCategory) {
    where.event_category = options.eventCategory;
  }

  return this.findAll({
    where,
    order: [['priority', 'DESC'], ['created_at', 'ASC']]
  });
};

/**
 * Get events by trigger type
 */
CustomAnalyticsEvent.getEventsByTrigger = async function(storeId, triggerType) {
  return this.findAll({
    where: {
      store_id: storeId,
      enabled: true,
      trigger_type: triggerType
    },
    order: [['priority', 'DESC']]
  });
};

module.exports = CustomAnalyticsEvent;
