const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   POST /api/add-cms-blocks-columns
// @desc    Add missing columns to existing cms_blocks table
// @access  Public (for setup)
router.post('/', async (req, res) => {
  try {
    console.log('🔧 Adding missing columns to cms_blocks table...');
    
    // List of columns to add with their SQL definitions
    const columnsToAdd = [
      {
        name: 'placement',
        sql: `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS placement VARCHAR(255) DEFAULT 'content';`
      },
      {
        name: 'meta_title', 
        sql: `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);`
      },
      {
        name: 'meta_description',
        sql: `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS meta_description TEXT;`
      },
      {
        name: 'meta_keywords',
        sql: `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(255);`
      },
      {
        name: 'created_at',
        sql: `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      },
      {
        name: 'updated_at', 
        sql: `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
      }
    ];

    const results = [];
    
    // Add each column
    for (const column of columnsToAdd) {
      try {
        console.log(`📝 Adding column: ${column.name}`);
        await sequelize.query(column.sql, { type: QueryTypes.RAW });
        console.log(`✅ Successfully added column: ${column.name}`);
        results.push({ column: column.name, status: 'success' });
      } catch (error) {
        console.log(`⚠️ Column ${column.name} might already exist or failed: ${error.message}`);
        results.push({ column: column.name, status: 'skipped', reason: error.message });
      }
    }

    // Update existing rows to have default values for placement if null
    try {
      console.log('🔄 Setting default placement values...');
      await sequelize.query(`
        UPDATE cms_blocks 
        SET placement = 'content' 
        WHERE placement IS NULL;
      `, { type: QueryTypes.UPDATE });
      console.log('✅ Updated existing rows with default placement');
      results.push({ column: 'placement_defaults', status: 'updated' });
    } catch (error) {
      console.log('⚠️ Failed to update placement defaults:', error.message);
      results.push({ column: 'placement_defaults', status: 'failed', reason: error.message });
    }

    // Create unique constraint on identifier + store_id
    try {
      console.log('🔗 Creating unique constraint...');
      // First drop existing constraint if it exists
      await sequelize.query(`
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE constraint_name = 'cms_blocks_identifier_key' 
                     AND table_name = 'cms_blocks') THEN
            ALTER TABLE cms_blocks DROP CONSTRAINT cms_blocks_identifier_key;
          END IF;
        END $$;
      `, { type: QueryTypes.RAW });
      
      // Add new composite unique constraint
      await sequelize.query(`
        ALTER TABLE cms_blocks 
        ADD CONSTRAINT cms_blocks_identifier_store_id_unique 
        UNIQUE (identifier, store_id);
      `, { type: QueryTypes.RAW });
      console.log('✅ Created unique constraint on identifier + store_id');
      results.push({ column: 'unique_constraint', status: 'created' });
    } catch (error) {
      console.log('⚠️ Unique constraint creation failed:', error.message);
      results.push({ column: 'unique_constraint', status: 'failed', reason: error.message });
    }

    // Create performance index
    try {
      console.log('📊 Creating performance index...');
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_cms_blocks_store_active 
        ON cms_blocks(store_id, is_active);
      `, { type: QueryTypes.RAW });
      console.log('✅ Created performance index');
      results.push({ column: 'performance_index', status: 'created' });
    } catch (error) {
      console.log('⚠️ Performance index creation failed:', error.message);
      results.push({ column: 'performance_index', status: 'failed', reason: error.message });
    }

    // Create updated_at trigger
    try {
      console.log('⚡ Creating updated_at trigger...');
      await sequelize.query(`
        CREATE OR REPLACE FUNCTION update_cms_blocks_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_update_cms_blocks_updated_at ON cms_blocks;
        CREATE TRIGGER trigger_update_cms_blocks_updated_at
            BEFORE UPDATE ON cms_blocks
            FOR EACH ROW
            EXECUTE FUNCTION update_cms_blocks_updated_at();
      `, { type: QueryTypes.RAW });
      console.log('✅ Created updated_at trigger');
      results.push({ column: 'updated_at_trigger', status: 'created' });
    } catch (error) {
      console.log('⚠️ Trigger creation failed:', error.message);
      results.push({ column: 'updated_at_trigger', status: 'failed', reason: error.message });
    }

    console.log('🎉 cms_blocks table schema update completed!');

    res.json({
      success: true,
      message: 'cms_blocks table columns added successfully',
      results: results
    });

  } catch (error) {
    console.error('❌ Error adding cms_blocks columns:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding columns to cms_blocks table',
      error: error.message
    });
  }
});

// @route   GET /api/add-cms-blocks-columns/verify
// @desc    Verify cms_blocks table structure
// @access  Public
router.get('/verify', async (req, res) => {
  try {
    console.log('🔍 Verifying cms_blocks table structure...');
    
    // Get table schema
    const columns = await sequelize.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'cms_blocks' 
      ORDER BY ordinal_position;
    `, { type: QueryTypes.SELECT });

    // Get constraints
    const constraints = await sequelize.query(`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'cms_blocks';
    `, { type: QueryTypes.SELECT });

    // Get indexes
    const indexes = await sequelize.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'cms_blocks';
    `, { type: QueryTypes.SELECT });

    console.log('📋 cms_blocks table verified');

    res.json({
      success: true,
      data: {
        columns: columns,
        constraints: constraints,
        indexes: indexes,
        columnCount: columns.length
      }
    });

  } catch (error) {
    console.error('❌ Error verifying cms_blocks table:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying table structure',
      error: error.message
    });
  }
});

module.exports = router;