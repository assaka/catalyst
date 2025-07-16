const express = require('express');
const { supabase } = require('../database/connection');
const router = express.Router();

// @route   POST /api/migrate-supabase/run
// @desc    Run database migration using Supabase client
// @access  Public
router.post('/run', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    const results = [];
    
    // 1. Create Users table
    console.log('📋 Creating users table...');
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        last_login TIMESTAMP,
        role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'store_owner', 'customer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { error: usersError } = await supabase.rpc('exec_sql', { query: createUsersTable });
    if (usersError && !usersError.message.includes('already exists')) {
      return res.json({ 
        success: false, 
        message: 'Failed to create users table',
        error: usersError.message 
      });
    }
    results.push({ table: 'users', status: 'created' });

    // 2. Create Login attempts table
    console.log('📋 Creating login_attempts table...');
    const createLoginAttemptsTable = `
      CREATE TABLE IF NOT EXISTS login_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN DEFAULT false,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { error: loginAttemptsError } = await supabase.rpc('exec_sql', { query: createLoginAttemptsTable });
    if (loginAttemptsError && !loginAttemptsError.message.includes('already exists')) {
      return res.json({ 
        success: false, 
        message: 'Failed to create login_attempts table',
        error: loginAttemptsError.message 
      });
    }
    results.push({ table: 'login_attempts', status: 'created' });

    // 3. Create indexes
    console.log('📋 Creating indexes...');
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, attempted_at);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, attempted_at);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { query: createIndexes });
    if (indexError && !indexError.message.includes('already exists')) {
      console.warn('Index creation warning:', indexError.message);
    }
    results.push({ table: 'indexes', status: 'created' });

    // 4. Insert default admin user
    console.log('📋 Creating default admin user...');
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@catalyst.com')
      .single();

    if (!existingAdmin) {
      const { error: adminError } = await supabase
        .from('users')
        .insert([{
          email: 'admin@catalyst.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          is_active: true,
          email_verified: true
        }]);

      if (adminError) {
        console.warn('Admin user creation warning:', adminError.message);
      } else {
        results.push({ table: 'admin_user', status: 'created' });
      }
    } else {
      results.push({ table: 'admin_user', status: 'already_exists' });
    }

    res.json({
      success: true,
      message: 'Database migration completed successfully!',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.json({
      success: false,
      message: 'Database migration failed',
      error: error.message
    });
  }
});

// @route   GET /api/migrate-supabase/status
// @desc    Check migration status using Supabase client
// @access  Public
router.get('/status', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    const tableStatus = {};
    
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    tableStatus.users = {
      exists: !usersError,
      error: usersError?.message,
      has_data: usersData && usersData.length > 0
    };

    // Check login_attempts table
    const { data: loginData, error: loginError } = await supabase
      .from('login_attempts')
      .select('id')
      .limit(1);
    
    tableStatus.login_attempts = {
      exists: !loginError,
      error: loginError?.message,
      has_data: loginData && loginData.length > 0
    };

    // Check if admin user exists
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'admin@catalyst.com')
      .single();
    
    tableStatus.admin_user = {
      exists: !adminError,
      error: adminError?.message,
      data: adminData
    };

    const allTablesExist = tableStatus.users.exists && tableStatus.login_attempts.exists;

    res.json({
      success: true,
      message: 'Migration status checked',
      is_migrated: allTablesExist,
      table_status: tableStatus
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message
    });
  }
});

// @route   POST /api/migrate-supabase/test-user
// @desc    Test creating a user after migration
// @access  Public
router.post('/test-user', async (req, res) => {
  if (!supabase) {
    return res.json({ 
      success: false, 
      message: 'Supabase client not available' 
    });
  }

  try {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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