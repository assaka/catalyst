const express = require('express');
const { supabase } = require('../database/connection');
const router = express.Router();

// @route   POST /api/db-init/tables
// @desc    Create database tables using Supabase client
// @access  Public
router.post('/tables', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    // Create users table
    const { error: usersError } = await supabase.rpc('create_users_table');
    
    if (usersError && !usersError.message.includes('already exists')) {
      console.error('Error creating users table:', usersError);
      return res.json({ 
        success: false, 
        message: 'Failed to create users table',
        error: usersError.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Database tables created successfully' 
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    res.json({ 
      success: false, 
      message: 'Database initialization failed',
      error: error.message 
    });
  }
});

// @route   POST /api/db-init/users-table
// @desc    Create users table directly with SQL
// @access  Public
router.post('/users-table', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
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
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createUsersTableSQL });
    
    if (error) {
      console.error('Error creating users table:', error);
      return res.json({ 
        success: false, 
        message: 'Failed to create users table',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Users table created successfully' 
    });

  } catch (error) {
    console.error('Users table creation error:', error);
    res.json({ 
      success: false, 
      message: 'Users table creation failed',
      error: error.message 
    });
  }
});

// @route   GET /api/db-init/test-user
// @desc    Test creating a user with Supabase client
// @access  Public
router.get('/test-user', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    // Try to insert a test user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'test@example.com',
          password: 'hashedpassword123',
          first_name: 'Test',
          last_name: 'User',
          role: 'customer'
        }
      ])
      .select();

    if (error) {
      return res.json({ 
        success: false, 
        message: 'Failed to create test user',
        error: error.message,
        code: error.code
      });
    }

    res.json({ 
      success: true, 
      message: 'Test user created successfully',
      user: data[0]
    });

  } catch (error) {
    console.error('Test user creation error:', error);
    res.json({ 
      success: false, 
      message: 'Test user creation failed',
      error: error.message 
    });
  }
});

module.exports = router;