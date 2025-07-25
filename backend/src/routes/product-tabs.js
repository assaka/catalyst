const express = require('express');
const router = express.Router();

// @route   GET /api/product-tabs
// @desc    Get product tabs (placeholder route)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Return empty array for now since this feature is not implemented
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get product tabs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;