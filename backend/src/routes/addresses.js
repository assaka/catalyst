const express = require('express');
const { Address } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/addresses
// @desc    Get addresses for a user
// @access  Public (but requires user_id parameter)
router.get('/', async (req, res) => {
  try {
    const { user_id, session_id } = req.query;

    // Guest users (session_id only) have no saved addresses
    if (!user_id && session_id) {
      return res.json({
        success: true,
        data: []
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const addresses = await Address.findAll({
      where: { user_id },
      order: [['is_default', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/addresses/:id
// @desc    Get single address
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const address = await Address.findByPk(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/addresses
// @desc    Create new address
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const addressData = {
      ...req.body,
      user_id: req.user.id
    };

    const address = await Address.create(addressData);

    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/addresses/:id
// @desc    Update address
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.update(req.body);

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.destroy();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;