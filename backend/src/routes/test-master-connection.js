/**
 * Test endpoint for master DB connection
 * GET /api/test-master-connection
 */

const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');
const { masterSupabaseClient } = require('../database/masterConnection');
const { encryptDatabaseCredentials } = require('../utils/encryption');

router.get('/', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Check if MASTER_DB_URL is set
    const masterDbUrl = process.env.MASTER_DB_URL;
    results.tests.push({
      name: 'MASTER_DB_URL environment variable',
      status: masterDbUrl ? 'PASS' : 'FAIL',
      details: masterDbUrl ? `Set (${masterDbUrl.substring(0, 50)}...)` : 'Not set'
    });

    if (!masterDbUrl) {
      return res.json(results);
    }

    // Test 2: Create Sequelize connection
    const sequelize = new Sequelize(masterDbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    results.tests.push({
      name: 'Sequelize instance creation',
      status: 'PASS',
      details: 'Sequelize instance created successfully'
    });

    // Test 3: Authenticate
    try {
      await sequelize.authenticate();
      results.tests.push({
        name: 'Database authentication',
        status: 'PASS',
        details: 'Successfully authenticated with database'
      });
    } catch (authError) {
      results.tests.push({
        name: 'Database authentication',
        status: 'FAIL',
        error: authError.message,
        details: authError.original?.message || authError.message
      });
      await sequelize.close();
      return res.json(results);
    }

    // Test 4: Query stores table
    try {
      const [stores] = await sequelize.query('SELECT COUNT(*) as count FROM stores');
      results.tests.push({
        name: 'Query stores table',
        status: 'PASS',
        details: `Found ${stores[0].count} stores`
      });
    } catch (queryError) {
      results.tests.push({
        name: 'Query stores table',
        status: 'FAIL',
        error: queryError.message
      });
    }

    // Test 5: Query store_databases table
    try {
      const [dbs] = await sequelize.query('SELECT COUNT(*) as count FROM store_databases');
      results.tests.push({
        name: 'Query store_databases table',
        status: 'PASS',
        details: `Found ${dbs[0].count} records`
      });
    } catch (queryError) {
      results.tests.push({
        name: 'Query store_databases table',
        status: 'FAIL',
        error: queryError.message
      });
    }

    // Test 6: Test INSERT (with rollback)
    const transaction = await sequelize.transaction();
    try {
      // Get a store ID to use as foreign key
      const [stores] = await sequelize.query('SELECT id FROM stores LIMIT 1', { transaction });

      if (stores.length > 0) {
        const storeId = stores[0].id;

        // Try to insert a test record
        await sequelize.query(
          `INSERT INTO store_databases (id, store_id, database_type, connection_string_encrypted)
           VALUES (gen_random_uuid(), :storeId, 'supabase', 'test-encrypted-data')`,
          {
            replacements: { storeId },
            transaction
          }
        );

        results.tests.push({
          name: 'Test INSERT into store_databases',
          status: 'PASS',
          details: 'INSERT test successful (rolled back)'
        });
      } else {
        results.tests.push({
          name: 'Test INSERT into store_databases',
          status: 'SKIP',
          details: 'No stores found to test with'
        });
      }

      // Rollback - we don't want to actually insert
      await transaction.rollback();

    } catch (insertError) {
      await transaction.rollback();
      results.tests.push({
        name: 'Test INSERT into store_databases',
        status: 'FAIL',
        error: insertError.message,
        errorCode: insertError.original?.code,
        details: insertError.original?.message || insertError.message
      });
    }

    await sequelize.close();

    // ============================================
    // SUPABASE CLIENT TESTS (NEW APPROACH)
    // ============================================

    // Test 7: Test Supabase client connection
    try {
      const { data: supabaseStores, error: supabaseError } = await masterSupabaseClient
        .from('stores')
        .select('id')
        .limit(1);

      if (supabaseError) {
        results.tests.push({
          name: 'Supabase client query stores',
          status: 'FAIL',
          error: supabaseError.message
        });
      } else {
        results.tests.push({
          name: 'Supabase client query stores',
          status: 'PASS',
          details: `Supabase client working, found ${supabaseStores?.length || 0} stores`
        });
      }
    } catch (supabaseError) {
      results.tests.push({
        name: 'Supabase client query stores',
        status: 'FAIL',
        error: supabaseError.message
      });
    }

    // Test 8: Test Supabase client INSERT into store_databases (with immediate delete)
    try {
      const { v4: uuidv4 } = require('uuid');

      // Get a store ID to use
      const { data: testStores } = await masterSupabaseClient
        .from('stores')
        .select('id')
        .limit(1);

      if (testStores && testStores.length > 0) {
        const testId = uuidv4();
        const testStoreId = testStores[0].id;

        // Encrypt test credentials
        const testCredentials = encryptDatabaseCredentials({
          projectUrl: 'https://test.supabase.co',
          serviceRoleKey: 'test-key-12345',
          anonKey: 'test-anon-key',
          connectionString: null
        });

        // Insert
        const { data: insertedRecord, error: insertError } = await masterSupabaseClient
          .from('store_databases')
          .insert({
            id: testId,
            store_id: testStoreId,
            database_type: 'supabase',
            connection_string_encrypted: testCredentials,
            host: 'test.supabase.co',
            is_active: false,
            connection_status: 'pending'
          })
          .select()
          .single();

        if (insertError) {
          results.tests.push({
            name: 'Supabase client INSERT into store_databases',
            status: 'FAIL',
            error: insertError.message,
            errorCode: insertError.code,
            details: insertError.details || insertError.hint || insertError.message
          });
        } else {
          // Delete the test record
          await masterSupabaseClient
            .from('store_databases')
            .delete()
            .eq('id', testId);

          results.tests.push({
            name: 'Supabase client INSERT into store_databases',
            status: 'PASS',
            details: 'INSERT test successful (record deleted after)'
          });
        }
      } else {
        results.tests.push({
          name: 'Supabase client INSERT into store_databases',
          status: 'SKIP',
          details: 'No stores found to test with'
        });
      }
    } catch (supabaseInsertError) {
      results.tests.push({
        name: 'Supabase client INSERT into store_databases',
        status: 'FAIL',
        error: supabaseInsertError.message
      });
    }

    // Summary
    const passed = results.tests.filter(t => t.status === 'PASS').length;
    const failed = results.tests.filter(t => t.status === 'FAIL').length;

    results.summary = {
      total: results.tests.length,
      passed,
      failed,
      skipped: results.tests.filter(t => t.status === 'SKIP').length
    };

    res.json(results);

  } catch (error) {
    results.tests.push({
      name: 'Unexpected error',
      status: 'FAIL',
      error: error.message,
      stack: error.stack
    });
    res.json(results);
  }
});

module.exports = router;
