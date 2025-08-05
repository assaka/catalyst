const { sequelize } = require('./src/database/connection.js');
const fs = require('fs');

async function createMappingTable() {
  try {
    console.log('🔧 Creating akeneo_mappings table...');
    
    // Create table directly with Sequelize
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS akeneo_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Akeneo side
        akeneo_code VARCHAR(255) NOT NULL,
        akeneo_type VARCHAR(50) NOT NULL,
        
        -- Catalyst side  
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        entity_slug VARCHAR(255),
        
        -- Metadata
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true,
        mapping_source VARCHAR(50) DEFAULT 'auto',
        notes TEXT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_akeneo_mappings_lookup 
      ON akeneo_mappings(store_id, akeneo_code, akeneo_type, is_active);
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_akeneo_mappings_entity 
      ON akeneo_mappings(entity_type, entity_id);
    `);
    
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_akeneo_mappings_unique 
      ON akeneo_mappings(store_id, akeneo_code, akeneo_type, entity_type);
    `);
    
    console.log('✅ akeneo_mappings table created successfully');
    
    // Verify table exists
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'akeneo_mappings';");
    
    if (results.length > 0) {
      console.log('✅ akeneo_mappings table confirmed in database');
      
      // Check sample data
      const [mappings] = await sequelize.query('SELECT COUNT(*) as count FROM akeneo_mappings;');
      console.log(`📋 Found ${mappings[0].count} existing mappings`);
    } else {
      console.log('❌ akeneo_mappings table not found');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
  }
}

createMappingTable();