const express = require('express');
const { supabase } = require('../database/connection');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// @route   POST /api/migrate-supabase/run
// @desc    Run database migration using Supabase client
// @access  Public
router.post('/run', async (req, res) => {
  try {
    console.log('🚀 Starting manual table creation...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/create-all-tables.sql');
    let migrationSQL;
    
    try {
      migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log('📋 Migration SQL file loaded successfully');
    } catch (fsError) {
      console.error('❌ Could not read migration file:', fsError);
      return res.json({
        success: false,
        message: 'Could not read migration file',
        error: fsError.message
      });
    }

    // Return the SQL for manual execution
    res.json({
      success: true,
      message: 'Migration SQL ready for manual execution',
      instructions: 'Please run this SQL manually in your Supabase SQL editor',
      sql: migrationSQL,
      migration_file: migrationPath
    });

  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
    res.json({
      success: false,
      message: 'Migration preparation failed',
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