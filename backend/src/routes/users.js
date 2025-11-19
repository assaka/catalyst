const express = require('express');
const { body, validationResult } = require('express-validator');
const { masterSupabaseClient } = require('../database/masterConnection'); // Use Supabase client to avoid Sequelize auth issues
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/auth'); // Role validation
const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    // Build Supabase query
    let query = masterSupabaseClient.from('users').select('*', { count: 'exact' });

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      // Search on email (Supabase doesn't support complex OR easily)
      query = query.ilike('email', `%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: rows, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      data: {
        users: rows || [],
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await masterSupabaseClient
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { data: user, error: findError } = await masterSupabaseClient
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { email, first_name, last_name, phone, is_active, role } = req.body;

    // Only admin can update role and is_active
    const updateData = { email, first_name, last_name, phone, updated_at: new Date().toISOString() };
    if (req.user.role === 'admin') {
      if (is_active !== undefined) updateData.is_active = is_active;
      if (role !== undefined) updateData.role = role;
    }

    const { data: updatedUser, error: updateError } = await masterSupabaseClient
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (admin only)
router.delete('/:id', authorize(['admin']), async (req, res) => {
  try {
    const { data: user, error: findError } = await masterSupabaseClient
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { error: deleteError } = await masterSupabaseClient
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;