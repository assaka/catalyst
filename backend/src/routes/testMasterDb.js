/**
 * Test Master DB Endpoint
 *
 * GET /api/test/master-db - Test master DB connection
 * Access this endpoint to verify master DB is working
 */

const express = require('express');
const router = express.Router();

router.get('/master-db', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // Test 1: Environment variables
    results.tests.env_vars = {
      master_db_url: !!process.env.MASTER_DB_URL,
      master_supabase_url: !!process.env.MASTER_SUPABASE_URL,
      encryption_key: !!process.env.ENCRYPTION_KEY,
      jwt_secret: !!process.env.JWT_SECRET
    };

    // Test 2: Master connection
    try {
      const { masterSequelize } = require('../database/masterConnection');
      await masterSequelize.authenticate();
      results.tests.connection = { success: true, message: 'Connected' };
    } catch (error) {
      results.tests.connection = { success: false, error: error.message };
    }

    // Test 3: Query test
    try {
      const { masterSequelize } = require('../database/masterConnection');
      const [rows] = await masterSequelize.query('SELECT NOW() as current_time');
      results.tests.query = { success: true, server_time: rows[0].current_time };
    } catch (error) {
      results.tests.query = { success: false, error: error.message };
    }

    // Test 4: Check tables
    try {
      const { masterSequelize } = require('../database/masterConnection');
      const [tables] = await masterSequelize.query(`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
      `);

      const tableNames = tables.map(t => t.tablename);
      const expectedTables = ['users', 'stores', 'store_databases', 'store_hostnames',
                              'subscriptions', 'credit_transactions',
                              'service_credit_costs', 'job_queue'];

      const missingTables = expectedTables.filter(t => !tableNames.includes(t));

      results.tests.tables = {
        success: missingTables.length === 0,
        found: tableNames.length,
        expected: expectedTables.length,
        missing: missingTables
      };
    } catch (error) {
      results.tests.tables = { success: false, error: error.message };
    }

    // Test 5: Models load
    try {
      const { MasterUser, MasterStore } = require('../models/master');
      results.tests.models = {
        success: true,
        loaded: ['MasterUser', 'MasterStore']
      };
    } catch (error) {
      results.tests.models = { success: false, error: error.message };
    }

    // Test 6: Encryption
    try {
      const { encrypt, decrypt } = require('../utils/encryption');
      const testData = 'test-secret-data';
      const encrypted = encrypt(testData);
      const decrypted = decrypt(encrypted);
      results.tests.encryption = {
        success: testData === decrypted,
        message: testData === decrypted ? 'Working' : 'Failed'
      };
    } catch (error) {
      results.tests.encryption = { success: false, error: error.message };
    }

    // Overall status
    const allSuccess = Object.values(results.tests).every(t => t.success);
    results.overall = allSuccess ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED';
    results.ready = allSuccess;

    res.json(results);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      results
    });
  }
});

module.exports = router;
