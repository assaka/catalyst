const express = require('express');
const { supabase } = require('../database/connection');
const router = express.Router();

// @route   POST /api/db-setup/create-users-table
// @desc    Create users table with proper SQL
// @access  Public
router.post('/create-users-table', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    // Use the Supabase client to execute raw SQL
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, that's expected
      return res.json({ 
        success: false, 
        message: 'Users table does not exist. Please create it manually in Supabase SQL editor.',
        instructions: `
          Go to your Supabase dashboard > SQL Editor and run:
          
          CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            role VARCHAR(50) DEFAULT 'customer',
            avatar_url TEXT,
            is_active BOOLEAN DEFAULT true,
            email_verified BOOLEAN DEFAULT false,
            email_verification_token VARCHAR(255),
            password_reset_token VARCHAR(255),
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `,
        supabase_url: process.env.SUPABASE_URL
      });
    }

    if (error) {
      return res.json({ 
        success: false, 
        message: 'Database query failed',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Users table already exists!',
      row_count: data.length
    });

  } catch (error) {
    console.error('Database setup error:', error);
    res.json({ 
      success: false, 
      message: 'Database setup failed',
      error: error.message 
    });
  }
});

// @route   POST /api/db-setup/test-insert
// @desc    Test inserting a user
// @access  Public
router.post('/test-insert', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'hashedpassword123',
      first_name: 'Test',
      last_name: 'User',
      role: 'customer',
      is_active: true,
      email_verified: false
    };

    const { data, error } = await supabase
      .from('users')
      .insert([testUser])
      .select();

    if (error) {
      return res.json({ 
        success: false, 
        message: 'Failed to insert test user',
        error: error.message,
        code: error.code,
        details: error.details
      });
    }

    res.json({ 
      success: true, 
      message: 'Test user created successfully',
      user: data[0]
    });

  } catch (error) {
    console.error('Test insert error:', error);
    res.json({ 
      success: false, 
      message: 'Test insert failed',
      error: error.message 
    });
  }
});

// @route   GET /api/db-setup/check-table
// @desc    Check if users table exists
// @access  Public
router.get('/check-table', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        return res.json({ 
          success: false, 
          message: 'Users table does not exist',
          error: error.message,
          code: error.code
        });
      }
      
      return res.json({ 
        success: false, 
        message: 'Database query failed',
        error: error.message,
        code: error.code
      });
    }

    res.json({ 
      success: true, 
      message: 'Users table exists and is accessible',
      has_data: data.length > 0,
      row_count: data.length
    });

  } catch (error) {
    console.error('Table check error:', error);
    res.json({ 
      success: false, 
      message: 'Table check failed',
      error: error.message 
    });
  }
});

module.exports = router;