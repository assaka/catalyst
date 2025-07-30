const express = require('express');
const { Address } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Custom middleware that applies auth but doesn't fail for guests
const optionalAuth = (req, res, next) => {
  // Try to apply auth middleware
  auth(req, res, (err) => {
    // If auth fails but we have a session_id, continue as guest
    if (err && req.query.session_id) {
      req.user = null; // Ensure req.user is null for guests
      return next();
    }
    // If auth fails and no session_id, pass the error
    if (err) {
      return next(err);
    }
    // Auth succeeded, continue
    next();
  });
};

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
// @access  Private (requires authentication) or Public (guest sessions return error)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { session_id } = req.query;
    
    console.log('🔍 Address creation attempt:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      sessionId: session_id,
      headers: {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        userAgent: req.headers['user-agent']?.substring(0, 50)
      }
    });
    
    // Check authentication first (prioritize over session_id)
    if (req.user && req.user.id) {
      console.log('✅ Authenticated user creating address:', req.user.id);
      // User is authenticated, proceed with address creation
    } else if (session_id && !req.user) {
      console.log('❌ Guest user tried to save address');
      return res.status(400).json({
        success: false,
        message: 'Guest users cannot save addresses. Please create an account to save addresses.'
      });
    } else {
      console.log('❌ No authentication for address creation');
      return res.status(401).json({
        success: false,
        message: 'Authentication required to save addresses'
      });
    }

    // Verify user exists before creating address
    const { User } = require('../models');
    const userExists = await User.findByPk(req.user.id);
    
    if (!userExists) {
      console.log('❌ User not found in database:', req.user.id);
      return res.status(400).json({
        success: false,
        message: 'User account not found. Please log in again.'
      });
    }

    const addressData = {
      ...req.body,
      user_id: req.user.id
    };

    console.log('💾 Creating address for verified user:', req.user.id);
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