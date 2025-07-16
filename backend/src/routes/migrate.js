const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const router = express.Router();

// @route   POST /api/migrate/run
// @desc    Run database migration
// @access  Public
router.post('/run', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.json({ 
      success: false, 
      message: 'DATABASE_URL not configured' 
    });
  }

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../database/migrations/create-all-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Create connection pool
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Run the migration
    console.log('🚀 Starting database migration...');
    const result = await pool.query(migrationSQL);
    
    await pool.end();

    res.json({
      success: true,
      message: 'Database migration completed successfully!',
      rowCount: result.rowCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.json({
      success: false,
      message: 'Database migration failed',
      error: error.message,
      code: error.code
    });
  }
});

// @route   GET /api/migrate/status
// @desc    Check migration status
// @access  Public
router.get('/status', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.json({ 
      success: false, 
      message: 'DATABASE_URL not configured' 
    });
  }

  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Check if key tables exist
    const tableCheckQuery = `
      SELECT 
        schemaname,
        tablename,
        hasindexes,
        hasrules,
        hastriggers
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'stores', 'products', 'orders', 'categories', 'login_attempts')
      ORDER BY tablename;
    `;

    const result = await pool.query(tableCheckQuery);
    await pool.end();

    const expectedTables = ['users', 'stores', 'products', 'orders', 'categories', 'login_attempts'];
    const existingTables = result.rows.map(row => row.tablename);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));

    res.json({
      success: true,
      message: 'Migration status checked',
      tables: {
        total_expected: expectedTables.length,
        existing: existingTables.length,
        missing: missingTables.length,
        existing_tables: existingTables,
        missing_tables: missingTables,
        table_details: result.rows
      },
      is_migrated: missingTables.length === 0
    });

  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.json({
      success: false,
      message: 'Failed to check migration status',
      error: error.message,
      code: error.code
    });
  }
});

// @route   GET /api/migrate/tables
// @desc    List all tables in database
// @access  Public
router.get('/tables', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.json({ 
      success: false, 
      message: 'DATABASE_URL not configured' 
    });
  }

  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const query = `
      SELECT 
        t.table_name,
        t.table_type,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
        (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND constraint_type = 'PRIMARY KEY') as has_primary_key,
        (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND constraint_type = 'FOREIGN KEY') as foreign_key_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `;

    const result = await pool.query(query);
    await pool.end();

    res.json({
      success: true,
      message: 'Database tables retrieved',
      table_count: result.rows.length,
      tables: result.rows
    });

  } catch (error) {
    console.error('❌ Table listing failed:', error);
    res.json({
      success: false,
      message: 'Failed to list tables',
      error: error.message,
      code: error.code
    });
  }
});

// @route   POST /api/migrate/test-connection
// @desc    Test database connection for migration
// @access  Public
router.post('/test-connection', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return res.json({ 
      success: false, 
      message: 'DATABASE_URL not configured' 
    });
  }

  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection with a simple query
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    await pool.end();

    res.json({
      success: true,
      message: 'Database connection successful',
      connection_info: {
        current_time: result.rows[0].current_time,
        postgres_version: result.rows[0].postgres_version,
        database_url_host: new URL(dbUrl).hostname
      }
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    res.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      code: error.code
    });
  }
});

module.exports = router;