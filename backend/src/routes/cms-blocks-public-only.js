const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   GET /api/public/cms-blocks (replacement route)
// @desc    Get active CMS blocks for public display
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    console.log('🎯 Replacement CMS Blocks: Request received', { store_id });
    
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    console.log('🎯 Replacement CMS Blocks: Executing query...');
    
    // Use the proven working query
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
      ORDER BY sort_order ASC, title ASC
    `, {
      bind: [store_id],
      type: QueryTypes.SELECT
    });

    console.log('🎯 Replacement CMS Blocks: Success! Found blocks:', blocks.length);
    
    res.json({
      success: true,
      data: blocks
    });

  } catch (error) {
    console.error('🚨 Replacement CMS Blocks error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;