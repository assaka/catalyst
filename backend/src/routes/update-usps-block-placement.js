const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   POST /api/update-usps-block-placement
// @desc    Update USPS cart block to appear above add to cart button
// @access  Public (for setup)
router.post('/', async (req, res) => {
  try {
    console.log('🔧 Updating USPS cart block placement...');
    
    // Update the USPS cart block to have above_add_to_cart placement
    const updateResult = await sequelize.query(`
      UPDATE cms_blocks 
      SET placement = 'above_add_to_cart',
          updated_at = NOW()
      WHERE identifier = 'usps-cart'
      OR title ILIKE '%usps%cart%'
      OR title ILIKE '%usps%'
    `, { type: QueryTypes.UPDATE });

    console.log('✅ Update result:', updateResult);

    // Get the updated block(s) to verify
    const updatedBlocks = await sequelize.query(`
      SELECT 
        id::text as id,
        title,
        identifier,
        content,
        placement,
        sort_order,
        is_active
      FROM cms_blocks 
      WHERE identifier = 'usps-cart'
      OR title ILIKE '%usps%cart%'
      OR title ILIKE '%usps%'
    `, { type: QueryTypes.SELECT });

    console.log('✅ Updated blocks:', updatedBlocks);

    res.json({
      success: true,
      message: 'USPS cart block placement updated successfully',
      data: {
        updatedCount: updateResult[1] || updateResult.length || 0,
        updatedBlocks: updatedBlocks
      }
    });

  } catch (error) {
    console.error('❌ Error updating USPS block placement:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating block placement',
      error: error.message
    });
  }
});

// @route   GET /api/update-usps-block-placement/verify
// @desc    Verify current CMS blocks and their placements
// @access  Public
router.get('/verify', async (req, res) => {
  try {
    console.log('🔍 Checking current CMS blocks...');
    
    const blocks = await sequelize.query(`
      SELECT 
        id::text as id,
        title,
        identifier,
        content,
        placement,
        sort_order,
        is_active,
        store_id::text as store_id
      FROM cms_blocks 
      ORDER BY title
    `, { type: QueryTypes.SELECT });

    console.log('📋 All CMS blocks:', blocks.length);

    res.json({
      success: true,
      data: {
        totalBlocks: blocks.length,
        blocks: blocks,
        placements: blocks.reduce((acc, block) => {
          acc[block.placement] = (acc[block.placement] || 0) + 1;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('❌ Error verifying blocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying blocks',
      error: error.message
    });
  }
});

module.exports = router;