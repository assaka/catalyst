const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   GET /api/public-cms-blocks
// @desc    Get active CMS blocks for public display (clean version)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    console.log('🎯 Public CMS Blocks: Request received', { store_id });
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    console.log('🎯 Public CMS Blocks: Executing query...');
    
    // Use the exact same working query from simple test
    const blocks = await sequelize.query(`
      SELECT 
        id::text as id,
        title,
        identifier,
        content,
        placement,
        sort_order,
        is_active
      FROM cms_blocks 
      WHERE store_id::text = $1
      AND is_active = true
      ORDER BY sort_order ASC, identifier ASC
    `, {
      bind: [store_id],
      type: QueryTypes.SELECT
    });

    console.log('🎯 Public CMS Blocks: Query successful, found:', blocks.length, 'blocks');
    
    res.json({
      success: true,
      data: blocks
    });

  } catch (error) {
    console.error('🚨 Public CMS Blocks error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      sql: error.sql || 'No SQL'
    });
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;