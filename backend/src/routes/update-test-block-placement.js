const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   POST /api/update-test-block-placement
// @desc    Update test block to have content placement instead of above_add_to_cart
// @access  Public (for setup)
router.post('/', async (req, res) => {
  try {
    console.log('🔧 Updating test block placement...');
    
    // Update the test block to have content placement (for general content areas)
    const updateResult = await sequelize.query(`
      UPDATE cms_blocks 
      SET placement = 'content',
          updated_at = NOW()
      WHERE identifier = 'test'
      OR title ILIKE '%test%'
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
      WHERE identifier = 'test'
      OR title ILIKE '%test%'
    `, { type: QueryTypes.SELECT });

    console.log('✅ Updated test blocks:', updatedBlocks);

    res.json({
      success: true,
      message: 'Test block placement updated successfully',
      data: {
        updatedCount: updateResult[1] || updateResult.length || 0,
        updatedBlocks: updatedBlocks
      }
    });

  } catch (error) {
    console.error('❌ Error updating test block placement:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating block placement',
      error: error.message
    });
  }
});

module.exports = router;