const express = require('express');
const ConnectionManager = require('../services/database/ConnectionManager');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Custom middleware that applies auth but doesn't fail for guests
const optionalAuth = (req, res, next) => {
  // Check if there's a token at all
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // If no token but has session_id, continue as guest
  if (!token && req.query.session_id) {
    req.user = null; // Explicitly set user to null for guests
    console.log('🔍 Guest user with session_id, skipping auth');
    return next();
  }

  // If no token and no session_id, return error
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication or session_id required'
    });
  }

  // If we have a token, try to authenticate
  authMiddleware(req, res, (err) => {
    if (err) {
      // If auth fails but we have a session_id, continue as guest
      if (req.query.session_id) {
        req.user = null;
        return next();
      }
      // Otherwise pass the error
      return next(err);
    }
    // Auth succeeded, continue
    next();
  });
};

// @route   GET /api/addresses
// @desc    Get addresses for a user
// @access  Public (supports both user_id parameter and authentication)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { user_id, session_id, store_id } = req.query;

    // store_id is required for tenant-specific address lookup
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Guest users (session_id only) have no saved addresses
    if (!user_id && session_id && !req.user) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Determine user ID and field to filter by
    let userIdToQuery;
    let userField;

    if (req.user) {
      const isCustomer = req.user.role === 'customer';
      userIdToQuery = req.user.id;
      userField = isCustomer ? 'customer_id' : 'user_id';
      console.log('🔍 Getting addresses for authenticated user:', req.user.id, 'role:', req.user.role);
    } else if (user_id) {
      // Fallback to user_id parameter (legacy support)
      userIdToQuery = user_id;
      userField = 'user_id';
      console.log('🔍 Getting addresses for user_id parameter:', user_id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Authentication or user_id is required'
      });
    }

    // Get tenant connection
    const adapter = await ConnectionManager.getStoreConnection(store_id);
    const supabaseClient = adapter.client || adapter.getClient();

    const { data: addresses, error } = await supabaseClient
      .from('customer_addresses')
      .select('*')
      .eq(userField, userIdToQuery)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('✅ Found addresses:', addresses?.length || 0);

    res.json({
      success: true,
      data: addresses || []
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
    const { store_id } = req.query;

    // store_id is required for tenant-specific address lookup
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Get tenant connection
    const adapter = await ConnectionManager.getStoreConnection(store_id);
    const supabaseClient = adapter.client || adapter.getClient();

    const { data: address, error } = await supabaseClient
      .from('customer_addresses')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Address not found'
        });
      }
      throw error;
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
    // Get store_id from query OR body (frontend may send in either)
    const session_id = req.query.session_id || req.body.session_id;
    const store_id = req.query.store_id || req.body.store_id;

    // store_id is required for tenant-specific address creation
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    console.log('🔍 Address creation attempt:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      sessionId: session_id,
      storeId: store_id,
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

    // Get tenant connection
    const adapter = await ConnectionManager.getStoreConnection(store_id);
    const supabaseClient = adapter.client || adapter.getClient();

    // Verify user exists before creating address
    const isCustomer = req.user.role === 'customer';
    const tableName = isCustomer ? 'customers' : 'users';

    console.log(`🔍 Checking ${tableName} table for user:`, req.user.id);

    const { data: userExists, error: userError } = await supabaseClient
      .from(tableName)
      .select('id')
      .eq('id', req.user.id)
      .single();

    if (userError || !userExists) {
      console.log(`❌ User not found in ${tableName} table:`, req.user.id);
      return res.status(400).json({
        success: false,
        message: 'User account not found. Your session may have expired. Please log in again.',
        debug: {
          searchedUserId: req.user.id,
          searchedTable: tableName,
          userRole: req.user.role
        }
      });
    }

    console.log(`✅ User verified in ${tableName} table:`, req.user.id);

    // Set the correct foreign key field based on user role
    const addressData = {
      ...req.body
    };

    if (isCustomer) {
      addressData.customer_id = req.user.id;
      console.log('💾 Setting customer_id for address:', req.user.id);
    } else {
      addressData.user_id = req.user.id;
      console.log('💾 Setting user_id for address:', req.user.id);
    }

    console.log('💾 Creating address for verified user:', req.user.id);

    const { data: address, error } = await supabaseClient
      .from('customer_addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) throw error;

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
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Get store_id from query OR body (frontend may send in either)
    const store_id = req.query.store_id || req.body.store_id;

    // store_id is required for tenant-specific address update
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Build where clause based on user role
    const isCustomer = req.user.role === 'customer';
    const userField = isCustomer ? 'customer_id' : 'user_id';

    // Get tenant connection
    const adapter = await ConnectionManager.getStoreConnection(store_id);
    const supabaseClient = adapter.client || adapter.getClient();

    // Check if address exists and belongs to user
    const { data: existingAddress, error: fetchError } = await supabaseClient
      .from('customer_addresses')
      .select('*')
      .eq('id', req.params.id)
      .eq(userField, req.user.id)
      .single();

    if (fetchError || !existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const { data: address, error } = await supabaseClient
      .from('customer_addresses')
      .update(req.body)
      .eq('id', req.params.id)
      .eq(userField, req.user.id)
      .select()
      .single();

    if (error) throw error;

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
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { store_id } = req.query;

    // store_id is required for tenant-specific address deletion
    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'store_id is required'
      });
    }

    // Build where clause based on user role
    const isCustomer = req.user.role === 'customer';
    const userField = isCustomer ? 'customer_id' : 'user_id';

    // Get tenant connection
    const adapter = await ConnectionManager.getStoreConnection(store_id);
    const supabaseClient = adapter.client || adapter.getClient();

    // Check if address exists and belongs to user
    const { data: existingAddress, error: fetchError } = await supabaseClient
      .from('customer_addresses')
      .select('*')
      .eq('id', req.params.id)
      .eq(userField, req.user.id)
      .single();

    if (fetchError || !existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const { error: deleteError } = await supabaseClient
      .from('customer_addresses')
      .delete()
      .eq('id', req.params.id)
      .eq(userField, req.user.id);

    if (deleteError) throw deleteError;

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
