const express = require('express');
const { sequelize } = require('../database/connection');
const { QueryTypes } = require('sequelize');
const router = express.Router();

// @route   GET /api/simple-cms-test
// @desc    Ultra simple CMS blocks test
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('🧪 Simple CMS test starting...');
    
    const { store_id } = req.query;
    console.log('📝 Store ID received:', store_id);
    
    if (!store_id) {
      console.log('❌ No store_id provided');
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    console.log('🔍 Testing basic database connection...');
    
    // Test 1: Most basic query possible
    try {
      const basicTest = await sequelize.query('SELECT 1 as test', { type: QueryTypes.SELECT });
      console.log('✅ Basic query works:', basicTest);
    } catch (error) {
      console.error('❌ Basic query failed:', error.message);
      throw new Error('Database connection failed');
    }

    console.log('🔍 Testing cms_blocks table access...');
    
    // Test 2: Simple count
    try {
      const countTest = await sequelize.query(
        'SELECT COUNT(*) as total FROM cms_blocks', 
        { type: QueryTypes.SELECT }
      );
      console.log('✅ Count query works:', countTest[0].total);
    } catch (error) {
      console.error('❌ Count query failed:', error.message);
      throw new Error('cms_blocks table access failed');
    }

    console.log('🔍 Testing store-specific query...');
    
    // Test 3: Store-specific query with explicit casting
    try {
      const storeTest = await sequelize.query(`
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
        LIMIT 10
      `, {
        bind: [store_id],
        type: QueryTypes.SELECT
      });
      
      console.log('✅ Store query works, found:', storeTest.length, 'blocks');
      
      res.json({
        success: true,
        message: 'All tests passed',
        data: {
          blocksFound: storeTest.length,
          blocks: storeTest
        }
      });
      
    } catch (error) {
      console.error('❌ Store query failed:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('🚨 Simple CMS test error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;