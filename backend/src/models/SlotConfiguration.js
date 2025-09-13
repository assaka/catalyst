const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const path = require('path');

// Import hierarchical cart configuration - define inline for backend compatibility
const cartConfig = {
  page_name: 'Cart',
  slot_type: 'cart_layout',
  slots: {
    main_layout: {
      id: 'main_layout',
      type: 'grid',
      content: '',
      className: 'main-layout',
      styles: {},
      parentId: null,
      layout: 'grid',
      gridCols: 12,
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    header_container: {
      id: 'header_container', 
      type: 'flex',
      content: '',
      className: 'header-container',
      styles: {},
      parentId: 'main_layout',
      layout: 'flex',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    content_area: {
      id: 'content_area',
      type: 'container', 
      content: '',
      className: 'content-area',
      styles: {},
      parentId: 'main_layout',
      layout: 'block',
      colSpan: 8,
      metadata: { hierarchical: true }
    },
    sidebar_area: {
      id: 'sidebar_area',
      type: 'flex',
      content: '',
      className: 'sidebar-area', 
      styles: { flexDirection: 'column' },
      parentId: 'main_layout',
      layout: 'flex',
      colSpan: 4,
      metadata: { hierarchical: true }
    },
    header_title: {
      id: 'header_title',
      type: 'text',
      content: 'My Cart',
      className: 'text-3xl font-bold text-gray-900 mb-4',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'header_container',
      metadata: { hierarchical: true }
    },
    empty_cart_container: {
      id: 'empty_cart_container',
      type: 'container',
      content: '',
      className: 'empty-cart-container text-center',
      styles: {},
      parentId: 'content_area',
      layout: 'block',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    empty_cart_icon: {
      id: 'empty_cart_icon', 
      type: 'image',
      content: 'shopping-cart-icon',
      className: 'w-16 h-16 mx-auto text-gray-400 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    empty_cart_title: {
      id: 'empty_cart_title',
      type: 'text', 
      content: 'Your cart is empty',
      className: 'text-xl font-semibold text-gray-900 mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    empty_cart_text: {
      id: 'empty_cart_text',
      type: 'text',
      content: "Looks like you haven't added anything to your cart yet.",
      className: 'text-gray-600 mb-6',
      parentClassName: '',
      styles: {},
      parentId: 'empty_cart_container', 
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    empty_cart_button: {
      id: 'empty_cart_button',
      type: 'button',
      content: 'Continue Shopping',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded',
      parentClassName: 'text-center',
      styles: {},
      parentId: 'empty_cart_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    coupon_container: {
      id: 'coupon_container',
      type: 'grid',
      content: '',
      className: 'coupon-container bg-white p-4 rounded-lg shadow',
      styles: {},
      parentId: 'sidebar_area',
      layout: 'grid',
      gridCols: 12,
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    coupon_title: {
      id: 'coupon_title',
      type: 'text',
      content: 'Apply Coupon',
      className: 'text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    coupon_input: {
      id: 'coupon_input',
      type: 'input',
      content: 'Enter coupon code',
      className: 'border rounded px-3 py-2',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      colSpan: 8,
      metadata: { hierarchical: true }
    },
    coupon_button: {
      id: 'coupon_button',
      type: 'button',
      content: 'Apply',
      className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded',
      parentClassName: '',
      styles: {},
      parentId: 'coupon_container',
      colSpan: 4,
      metadata: { hierarchical: true }
    },
    order_summary_container: {
      id: 'order_summary_container',
      type: 'container',
      content: '',
      className: 'order-summary-container bg-white p-4 rounded-lg shadow mt-4',
      styles: {},
      parentId: 'sidebar_area',
      layout: 'block',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    order_summary_title: {
      id: 'order_summary_title',
      type: 'text',
      content: 'Order Summary',
      className: 'text-lg font-semibold mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    order_summary_subtotal: {
      id: 'order_summary_subtotal',
      type: 'text',
      content: '<span>Subtotal</span><span>$79.97</span>',
      className: 'flex justify-between mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    order_summary_tax: {
      id: 'order_summary_tax',
      type: 'text',
      content: '<span>Tax</span><span>$6.40</span>',
      className: 'flex justify-between mb-2',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    order_summary_total: {
      id: 'order_summary_total',
      type: 'text',
      content: '<span>Total</span><span>$81.37</span>',
      className: 'flex justify-between text-lg font-semibold border-t pt-4 mb-4',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    },
    checkout_button: {
      id: 'checkout_button',
      type: 'button',
      content: 'Proceed to Checkout',
      className: 'w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded text-lg',
      parentClassName: '',
      styles: {},
      parentId: 'order_summary_container',
      colSpan: 12,
      metadata: { hierarchical: true }
    }
  },
  metadata: {
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    version: '1.0',
    pageType: 'cart'
  }
};

const SlotConfiguration = sequelize.define('SlotConfiguration', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  store_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Complete slot configuration JSON including slots, components, and metadata'
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1.0',
    comment: 'Configuration schema version'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this configuration is currently active'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'acceptance', 'published', 'reverted']]
    },
    comment: 'Status of the configuration version: draft -> acceptance -> published'
  },
  version_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Version number for tracking configuration history'
  },
  page_type: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'cart',
    comment: 'Type of page this configuration applies to'
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when this version was published'
  },
  published_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who published this version'
  },
  acceptance_published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when this version was published to acceptance'
  },
  acceptance_published_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who published this version to acceptance'
  },
  current_edit_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'slot_configurations',
      key: 'id'
    },
    comment: 'ID of the configuration currently being edited (for revert tracking)'
  },
  parent_version_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'slot_configurations',
      key: 'id'
    },
    comment: 'Reference to the parent version this was based on'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'slot_configurations',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'store_id', 'status', 'page_type'],
      name: 'idx_user_store_status_page'
    },
    {
      fields: ['store_id', 'status', 'page_type', 'version_number'],
      name: 'idx_store_status_page_version'
    },
    {
      fields: ['parent_version_id'],
      name: 'idx_parent_version'
    },
    {
      fields: ['current_edit_id'],
      name: 'idx_current_edit'
    },
    {
      fields: ['store_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
SlotConfiguration.prototype.getSlotConfig = function(slotId) {
  return this.configuration?.slots?.[slotId] || null;
};

SlotConfiguration.prototype.updateSlotConfig = function(slotId, config) {
  if (!this.configuration.slots) {
    this.configuration.slots = {};
  }
  this.configuration.slots[slotId] = config;
  this.changed('configuration', true); // Mark as changed for Sequelize
};

SlotConfiguration.prototype.removeSlot = function(slotId) {
  if (this.configuration?.slots?.[slotId]) {
    delete this.configuration.slots[slotId];
    this.changed('configuration', true);
  }
};

// Class methods
SlotConfiguration.findActiveByUserStore = async function(userId, storeId) {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      is_active: true
    }
  });
};

// Find the latest draft for editing
SlotConfiguration.findLatestDraft = async function(userId, storeId, pageType = 'cart') {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      status: 'draft',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Find the latest published version for display
SlotConfiguration.findLatestPublished = async function(storeId, pageType = 'cart') {
  return this.findOne({
    where: {
      store_id: storeId,
      status: 'published',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Find the latest acceptance version for preview
SlotConfiguration.findLatestAcceptance = async function(storeId, pageType = 'cart') {
  return this.findOne({
    where: {
      store_id: storeId,
      status: 'acceptance',
      page_type: pageType
    },
    order: [['version_number', 'DESC']]
  });
};

// Create or update a draft - proper upsert logic
SlotConfiguration.upsertDraft = async function(userId, storeId, pageType = 'cart', configuration = null) {
  // Try to find existing draft
  const existingDraft = await this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      page_type: pageType,
      status: 'draft'
    }
  });

  if (existingDraft) {
    // Update existing draft
    if (configuration) {
      existingDraft.configuration = configuration;
      existingDraft.updated_at = new Date();
      await existingDraft.save();
    }
    return existingDraft;
  }

  // No existing draft, create new one
  const latestPublished = await this.findLatestPublished(storeId, pageType);
  
  // Determine version number
  const maxVersion = await this.max('version_number', {
    where: {
      store_id: storeId,
      page_type: pageType
    }
  });

  // Create proper default configuration with micro-slot definitions
  const getDefaultConfig = () => {
    
    // Create complete slot content with Tailwind classes
    const defaultSlots = {
      // Header content
      'header.title': {
        type: 'system',
        type: 'system',
        content: 'My Cart',
        styles: {},
        className: 'text-2xl font-bold text-gray-800',
        parentClassName: 'text-center',
        metadata: { lastModified: new Date().toISOString() }
      },
      
      // Empty cart content
      'emptyCart.icon': {
        type: 'system',
        content: '🛒',
        styles: {},
        className: 'text-6xl text-gray-400',
        parentClassName: 'text-center',
        metadata: { lastModified: new Date().toISOString() }
      },
      'emptyCart.title': {
        type: 'system',
        content: 'Your cart is empty',
        styles: {},
        className: 'text-xl font-bold text-gray-600',
        parentClassName: 'text-center',
        metadata: { lastModified: new Date().toISOString() }
      },
      'emptyCart.text': {
        content: "Looks like you haven't added anything to your cart yet.",
        styles: {},
        className: 'text-gray-500 mb-4',
        parentClassName: 'text-center',
        metadata: { lastModified: new Date().toISOString() }
      },
      'emptyCart.button': {
        type: 'system',
        content: 'Continue Shopping',
        styles: {},
        className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
        parentClassName: 'text-center',
        metadata: { lastModified: new Date().toISOString() }
      },

      // Cart item content templates
      'cartItem.productImage': {
        type: 'system',
        content: 'Product Image',
        styles: {},
        className: 'w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'cartItem.productTitle': {
        type: 'system',
        content: 'Product Name',
        styles: {},
        className: 'font-semibold text-gray-900',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'cartItem.quantityControl': {
        type: 'system',
        content: '1',
        styles: {},
        className: 'flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded',
        parentClassName: 'text-center',
        metadata: { lastModified: new Date().toISOString() }
      },
      'cartItem.productPrice': {
        type: 'system',
        content: '$29.99',
        styles: {},
        className: 'font-bold text-gray-900',
        parentClassName: 'text-right',
        metadata: { lastModified: new Date().toISOString() }
      },
      'cartItem.removeButton': {
        type: 'system',
        content: 'Remove',
        styles: {},
        className: 'text-red-500 hover:text-red-700 text-sm',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },

      // Coupon content
      'coupon.title': {
        type: 'system',
        content: 'Apply Coupon',
        styles: {},
        className: 'text-lg font-bold text-gray-800',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'coupon.input': {
        type: 'system',
        content: 'Enter coupon code',
        styles: {},
        className: 'flex-1 px-3 py-2 border rounded bg-white text-gray-700',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'coupon.button': {
        type: 'system',
        content: 'Apply',
        styles: {},
        className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },

      // Order summary content
      'orderSummary.title': {
        type: 'system',
        content: 'Order Summary',
        styles: {},
        className: 'text-lg font-bold text-gray-800 mb-4',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'orderSummary.subtotal': {
        type: 'system',
        content: 'Subtotal: $59.98',
        styles: {},
        className: 'flex justify-between text-gray-600 mb-2',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'orderSummary.total': {
        type: 'system',
        content: 'Total: $59.98',
        styles: {},
        className: 'flex justify-between font-bold text-lg text-gray-900 border-t pt-4',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      },
      'orderSummary.checkoutButton': {
        type: 'system',
        content: 'Proceed to Checkout',
        styles: {},
        className: 'w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold',
        parentClassName: '',
        metadata: { lastModified: new Date().toISOString() }
      }
    };

    // Use hierarchical configuration - no more legacy fallback
    console.log('📦 Backend: Using hierarchical cart configuration');
    return {
      page_name: cartConfig.page_name || 'Cart',
      slot_type: cartConfig.slot_type || 'cart_layout',
      slots: cartConfig.slots || {},
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        ...cartConfig.metadata
      }
    };
  };

  const baseConfig = configuration || (latestPublished ? latestPublished.configuration : getDefaultConfig());

  const newDraft = await this.create({
    user_id: userId,
    store_id: storeId,
    configuration: baseConfig,
    version: latestPublished ? latestPublished.version : '1.0',
    is_active: true,
    status: 'draft',
    version_number: (maxVersion || 0) + 1,
    page_type: pageType,
    parent_version_id: latestPublished ? latestPublished.id : null
  });

  return newDraft;
};

// Create draft - uses upsert logic
SlotConfiguration.createDraft = async function(userId, storeId, pageType = 'cart') {
  return this.upsertDraft(userId, storeId, pageType);
};

// Publish a draft to acceptance (preview environment)
SlotConfiguration.publishToAcceptance = async function(draftId, publishedByUserId) {
  const draft = await this.findByPk(draftId);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Draft not found or not in draft status');
  }
  
  // Update the draft to acceptance
  draft.status = 'acceptance';
  draft.acceptance_published_at = new Date();
  draft.acceptance_published_by = publishedByUserId;
  await draft.save();
  
  return draft;
};

// Publish acceptance to production
SlotConfiguration.publishToProduction = async function(acceptanceId, publishedByUserId) {
  const acceptance = await this.findByPk(acceptanceId);
  if (!acceptance || acceptance.status !== 'acceptance') {
    throw new Error('Configuration not found or not in acceptance status');
  }
  
  // Update to published status
  acceptance.status = 'published';
  acceptance.published_at = new Date();
  acceptance.published_by = publishedByUserId;
  await acceptance.save();
  
  return acceptance;
};

// Publish a draft directly to production (legacy method for backward compatibility)
SlotConfiguration.publishDraft = async function(draftId, publishedByUserId) {
  const draft = await this.findByPk(draftId);
  if (!draft || draft.status !== 'draft') {
    throw new Error('Draft not found or already published');
  }
  
  // Update the draft to published
  draft.status = 'published';
  draft.published_at = new Date();
  draft.published_by = publishedByUserId;
  await draft.save();
  
  return draft;
};

// Get version history for a store and page
SlotConfiguration.getVersionHistory = async function(storeId, pageType = 'cart', limit = 20) {
  return this.findAll({
    where: {
      store_id: storeId,
      page_type: pageType,
      status: 'published'
    },
    order: [['version_number', 'DESC']],
    limit
  });
};

// Revert to a specific version with proper tracking
SlotConfiguration.revertToVersion = async function(versionId, userId, storeId) {
  const targetVersion = await this.findByPk(versionId);
  if (!targetVersion || !['published', 'acceptance'].includes(targetVersion.status)) {
    throw new Error('Version not found or not in a revertible status');
  }
  
  const transaction = await this.sequelize.transaction();
  
  try {
    // Mark all versions after this one as reverted
    await this.update(
      { 
        status: 'reverted',
        current_edit_id: null // Clear current edit tracking for reverted versions
      },
      {
        where: {
          store_id: storeId,
          page_type: targetVersion.page_type,
          status: {
            [require('sequelize').Op.in]: ['published', 'acceptance']
          },
          version_number: {
            [require('sequelize').Op.gt]: targetVersion.version_number
          }
        },
        transaction
      }
    );
    
    // Get the next version number
    const maxVersion = await this.max('version_number', {
      where: {
        store_id: storeId,
        page_type: targetVersion.page_type
      },
      transaction
    });
    
    // Create a new published version based on the target version
    const newVersion = await this.create({
      user_id: userId,
      store_id: storeId,
      configuration: targetVersion.configuration,
      version: targetVersion.version,
      is_active: true,
      status: 'published',
      version_number: (maxVersion || 0) + 1,
      page_type: targetVersion.page_type,
      parent_version_id: targetVersion.id,
      current_edit_id: targetVersion.id, // Track that this is based on the reverted version
      published_at: new Date(),
      published_by: userId
    }, { transaction });
    
    await transaction.commit();
    return newVersion;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Set current editing configuration
SlotConfiguration.setCurrentEdit = async function(configId, userId, storeId, pageType = 'cart') {
  // Clear any existing current_edit_id for this user/store/page
  await this.update(
    { current_edit_id: null },
    {
      where: {
        user_id: userId,
        store_id: storeId,
        page_type: pageType
      }
    }
  );
  
  // Set the new current_edit_id
  const config = await this.findByPk(configId);
  if (config) {
    config.current_edit_id = configId;
    await config.save();
  }
  
  return config;
};

// Get current editing configuration
SlotConfiguration.getCurrentEdit = async function(userId, storeId, pageType = 'cart') {
  return this.findOne({
    where: {
      user_id: userId,
      store_id: storeId,
      page_type: pageType,
      current_edit_id: {
        [require('sequelize').Op.ne]: null
      }
    },
    order: [['updated_at', 'DESC']]
  });
};

SlotConfiguration.findByMigrationSource = async function(source, limit = 100) {
  return this.findAll({
    where: {
      migration_source: source
    },
    limit,
    order: [['created_at', 'DESC']]
  });
};

module.exports = SlotConfiguration;