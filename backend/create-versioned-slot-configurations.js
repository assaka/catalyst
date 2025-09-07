#!/usr/bin/env node

const { sequelize } = require('./src/database/connection');

async function createVersionedSlotConfigurations() {
  try {
    console.log('🚀 Creating slot_configurations table with versioning support...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    
    // Get the Sequelize DataTypes and QueryInterface
    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = require('sequelize');
    
    // Drop existing table if it exists (be careful in production!)
    try {
      await queryInterface.dropTable('slot_configurations');
      console.log('🗑️  Dropped existing slot_configurations table');
    } catch (error) {
      console.log('ℹ️  No existing slot_configurations table to drop');
    }
    
    // Create the table with all versioning fields
    console.log('🔄 Creating new slot_configurations table...');
    await queryInterface.createTable('slot_configurations', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'User who created this configuration'
      },
      store_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Store this configuration belongs to'
      },
      configuration: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Complete slot configuration JSON including slots, components, and metadata'
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '1.0',
        comment: 'Configuration schema version'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this configuration is currently active'
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'reverted'),
        allowNull: false,
        defaultValue: 'published',
        comment: 'Status of the configuration version'
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Version number for tracking configuration history'
      },
      page_type: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'cart',
        comment: 'Type of page this configuration applies to'
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when this version was published'
      },
      published_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'User who published this version'
      },
      parent_version_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Reference to the parent version this was based on'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Add indexes for better performance
    console.log('🔄 Adding indexes...');
    
    await queryInterface.addIndex('slot_configurations', ['user_id', 'store_id', 'status', 'page_type'], {
      name: 'idx_user_store_status_page'
    });
    
    await queryInterface.addIndex('slot_configurations', ['store_id', 'status', 'page_type', 'version_number'], {
      name: 'idx_store_status_page_version'
    });
    
    await queryInterface.addIndex('slot_configurations', ['parent_version_id'], {
      name: 'idx_parent_version'
    });
    
    await queryInterface.addIndex('slot_configurations', ['store_id'], {
      name: 'idx_store_id'
    });
    
    await queryInterface.addIndex('slot_configurations', ['is_active'], {
      name: 'idx_is_active'
    });
    
    console.log('✅ Slot configurations table created successfully with versioning support!');
    
    // Create a sample configuration for testing
    console.log('🧪 Creating sample configuration...');
    
    const sampleConfig = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001', 
      store_id: '123e4567-e89b-12d3-a456-426614174002',
      configuration: {
        slots: {},
        metadata: {
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      },
      version: '1.0',
      is_active: true,
      status: 'published',
      version_number: 1,
      page_type: 'cart',
      published_at: new Date(),
      published_by: '123e4567-e89b-12d3-a456-426614174001',
      parent_version_id: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await queryInterface.bulkInsert('slot_configurations', [sampleConfig]);
    
    console.log('✅ Sample configuration created!');
    
    // Verify the table structure
    console.log('🧪 Verifying table structure...');
    const tableDescription = await queryInterface.describeTable('slot_configurations');
    
    const expectedColumns = [
      'id', 'user_id', 'store_id', 'configuration', 'version', 'is_active',
      'status', 'version_number', 'page_type', 'published_at', 'published_by',
      'parent_version_id', 'created_at', 'updated_at'
    ];
    
    let allColumnsPresent = true;
    
    for (const column of expectedColumns) {
      if (tableDescription[column]) {
        console.log(`✅ Column '${column}' present`);
      } else {
        console.error(`❌ Column '${column}' missing`);
        allColumnsPresent = false;
      }
    }
    
    if (allColumnsPresent) {
      console.log('🎉 All columns created successfully!');
    } else {
      console.error('❌ Some columns are missing');
    }
    
    // Test record count
    const recordCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM slot_configurations',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`📊 Total records in table: ${recordCount[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create versioned slot configurations:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createVersionedSlotConfigurations();
}

module.exports = createVersionedSlotConfigurations;