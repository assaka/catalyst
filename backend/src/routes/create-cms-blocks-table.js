const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   POST /api/create-cms-blocks-table
// @desc    Create cms_blocks table if it doesn't exist
// @access  Public (for setup)
router.post('/', async (req, res) => {
  try {
    console.log('🔧 Creating cms_blocks table...');
    
    // Create the cms_blocks table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cms_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        identifier VARCHAR(255) NOT NULL,
        content TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        placement VARCHAR(255) DEFAULT 'content',
        meta_title VARCHAR(255),
        meta_description TEXT,
        meta_keywords VARCHAR(255),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(identifier, store_id)
      );
    `, { type: QueryTypes.RAW });

    // Create index for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cms_blocks_store_active 
      ON cms_blocks(store_id, is_active);
    `, { type: QueryTypes.RAW });

    // Create updated_at trigger
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_cms_blocks_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_cms_blocks_updated_at ON cms_blocks;
      CREATE TRIGGER update_cms_blocks_updated_at
          BEFORE UPDATE ON cms_blocks
          FOR EACH ROW
          EXECUTE FUNCTION update_cms_blocks_updated_at();
    `, { type: QueryTypes.RAW });

    console.log('✅ cms_blocks table created successfully');

    res.json({
      success: true,
      message: 'cms_blocks table created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating cms_blocks table:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating cms_blocks table',
      error: error.message
    });
  }
});

module.exports = router;