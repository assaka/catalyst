module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('marketplace_credentials', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      marketplace: {
        type: Sequelize.ENUM('amazon', 'ebay', 'google_shopping', 'facebook', 'instagram', 'magento', 'klaviyo', 'hubspot', 'mailchimp'),
        allowNull: false,
        comment: 'The marketplace platform'
      },
      marketplace_account_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Friendly name for this marketplace account'
      },
      credentials: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: 'Encrypted credentials object (marketplace-specific)'
      },
      marketplace_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Marketplace-specific ID (e.g., Amazon Marketplace ID, eBay Site ID)'
      },
      region: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Region/Country (e.g., US, UK, DE, FR)'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'error', 'testing'),
        defaultValue: 'active'
      },
      last_sync_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Last successful sync timestamp'
      },
      last_error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Last error message if sync failed'
      },
      sync_settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          auto_sync: true,
          sync_frequency: 'hourly',
          sync_inventory: true,
          sync_prices: true,
          sync_new_products: true
        },
        comment: 'Sync configuration settings'
      },
      export_settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          use_ai_optimization: true,
          auto_translate: true,
          include_variants: true,
          export_out_of_stock: false,
          price_adjustment_percent: 0,
          category_mapping: {}
        },
        comment: 'Export configuration and product transformation rules'
      },
      statistics: {
        type: Sequelize.JSONB,
        defaultValue: {
          total_exports: 0,
          successful_exports: 0,
          failed_exports: 0,
          total_products_synced: 0,
          last_export_duration_ms: 0
        },
        comment: 'Export statistics and metrics'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('marketplace_credentials', ['store_id', 'marketplace', 'marketplace_id'], {
      unique: true,
      name: 'marketplace_credentials_unique_constraint'
    });

    await queryInterface.addIndex('marketplace_credentials', ['store_id']);
    await queryInterface.addIndex('marketplace_credentials', ['marketplace']);
    await queryInterface.addIndex('marketplace_credentials', ['status']);

    console.log('✅ Created marketplace_credentials table with indexes');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('marketplace_credentials');
    console.log('✅ Dropped marketplace_credentials table');
  }
};
