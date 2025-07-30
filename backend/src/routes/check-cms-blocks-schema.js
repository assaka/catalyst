const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   GET /api/check-cms-blocks-schema
// @desc    Check and fix cms_blocks table schema
// @access  Public (for debugging)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Checking cms_blocks table schema...');
    
    // Check if table exists and get current columns
    const tableInfo = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cms_blocks' 
      ORDER BY ordinal_position;
    `, { type: QueryTypes.SELECT });

    console.log('📋 Current cms_blocks table schema:', tableInfo);

    // Required columns based on our model
    const requiredColumns = [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'title', type: 'character varying', nullable: false },
      { name: 'identifier', type: 'character varying', nullable: false },
      { name: 'content', type: 'text', nullable: true },
      { name: 'is_active', type: 'boolean', nullable: true, default: true },
      { name: 'sort_order', type: 'integer', nullable: true, default: 0 },
      { name: 'placement', type: 'character varying', nullable: true, default: 'content' },
      { name: 'meta_title', type: 'character varying', nullable: true },
      { name: 'meta_description', type: 'text', nullable: true },
      { name: 'meta_keywords', type: 'character varying', nullable: true },
      { name: 'store_id', type: 'uuid', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: true },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: true }
    ];

    const existingColumns = tableInfo.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(req => !existingColumns.includes(req.name));

    console.log('❌ Missing columns:', missingColumns.map(col => col.name));

    res.json({
      success: true,
      data: {
        tableExists: tableInfo.length > 0,
        existingColumns: tableInfo,
        requiredColumns,
        missingColumns
      }
    });
  } catch (error) {
    console.error('❌ Error checking cms_blocks schema:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking schema',
      error: error.message
    });
  }
});

// @route   POST /api/check-cms-blocks-schema/fix
// @desc    Add missing columns to cms_blocks table
// @access  Public (for setup)
router.post('/fix', async (req, res) => {
  try {
    console.log('🔧 Adding missing columns to cms_blocks table...');
    
    // Add missing columns one by one
    const alterCommands = [
      `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS placement VARCHAR(255) DEFAULT 'content';`,
      `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);`,
      `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS meta_description TEXT;`,
      `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS meta_keywords VARCHAR(255);`,
      `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,
      `ALTER TABLE cms_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
    ];

    for (const command of alterCommands) {
      try {
        await sequelize.query(command, { type: QueryTypes.RAW });
        console.log('✅ Executed:', command);
      } catch (error) {
        console.log('⚠️ Command may have failed (column might already exist):', command, error.message);
      }
    }

    // Create or update unique constraint
    try {
      await sequelize.query(`
        ALTER TABLE cms_blocks 
        DROP CONSTRAINT IF EXISTS cms_blocks_identifier_store_id_key;
      `, { type: QueryTypes.RAW });
      
      await sequelize.query(`
        ALTER TABLE cms_blocks 
        ADD CONSTRAINT cms_blocks_identifier_store_id_key 
        UNIQUE (identifier, store_id);
      `, { type: QueryTypes.RAW });
      console.log('✅ Added unique constraint on identifier + store_id');
    } catch (error) {
      console.log('⚠️ Constraint update may have failed:', error.message);
    }

    // Create index for performance
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_cms_blocks_store_active 
        ON cms_blocks(store_id, is_active);
      `, { type: QueryTypes.RAW });
      console.log('✅ Added performance index');
    } catch (error) {
      console.log('⚠️ Index creation may have failed:', error.message);
    }

    console.log('✅ cms_blocks table schema updated successfully');

    res.json({
      success: true,
      message: 'cms_blocks table schema updated successfully'
    });
  } catch (error) {
    console.error('❌ Error fixing cms_blocks schema:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing schema',
      error: error.message
    });
  }
});

module.exports = router;