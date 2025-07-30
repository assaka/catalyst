const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   GET /api/test-cms-blocks
// @desc    Test cms_blocks table directly with raw SQL
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    console.log('🧪 Testing cms_blocks with raw SQL query...');
    console.log('Store ID:', store_id);
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Test 1: Simple count query
    console.log('🔍 Test 1: Counting all cms_blocks...');
    const countResult = await sequelize.query(`
      SELECT COUNT(*) as total FROM cms_blocks;
    `, { type: QueryTypes.SELECT });
    console.log('Total cms_blocks in database:', countResult[0].total);

    // Test 2: Check if store exists
    console.log('🔍 Test 2: Checking if store exists...');
    const storeExists = await sequelize.query(`
      SELECT id, name FROM stores WHERE id = :storeId;
    `, { 
      replacements: { storeId: store_id },
      type: QueryTypes.SELECT 
    });
    console.log('Store exists:', storeExists.length > 0, storeExists[0]?.name || 'Not found');

    // Test 3: Raw query for cms_blocks with store filter
    console.log('🔍 Test 3: Querying cms_blocks for specific store...');
    const blocksRaw = await sequelize.query(`
      SELECT 
        id, 
        title, 
        identifier, 
        content, 
        placement, 
        sort_order, 
        is_active,
        store_id
      FROM cms_blocks 
      WHERE store_id = :storeId 
      AND is_active = true
      ORDER BY sort_order ASC, title ASC;
    `, { 
      replacements: { storeId: store_id },
      type: QueryTypes.SELECT 
    });
    console.log('Raw query result:', blocksRaw.length, 'blocks found');

    // Test 4: Check table structure
    console.log('🔍 Test 4: Checking table structure...');
    const tableStructure = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cms_blocks'
      ORDER BY ordinal_position;
    `, { type: QueryTypes.SELECT });
    console.log('Table columns:', tableStructure.map(col => `${col.column_name} (${col.data_type})`));

    res.json({
      success: true,
      data: {
        totalBlocks: parseInt(countResult[0].total),
        storeExists: storeExists.length > 0,
        storeName: storeExists[0]?.name,
        blocksForStore: blocksRaw.length,
        blocks: blocksRaw,
        tableColumns: tableStructure.map(col => col.column_name)
      }
    });

  } catch (error) {
    console.error('🚨 Test cms_blocks error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql
    });
    
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
      errorName: error.name,
      sql: error.sql
    });
  }
});

module.exports = router;