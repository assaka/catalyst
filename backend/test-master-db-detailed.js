/**
 * Detailed Master DB Connection Diagnostic
 *
 * Tests each step individually to pinpoint connection issues
 * Usage: node backend/test-master-db-detailed.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function detailedDiagnostic() {
  console.log('\n========================================');
  console.log('🔬 DETAILED MASTER DB DIAGNOSTIC');
  console.log('========================================\n');

  const results = {
    steps: [],
    success: true
  };

  // STEP 1: Check environment variable exists
  console.log('STEP 1: Checking MASTER_DB_URL environment variable...');
  const masterDbUrl = process.env.MASTER_DB_URL;

  if (!masterDbUrl) {
    console.error('❌ FAILED: MASTER_DB_URL not found');
    console.log('   Available environment variables:');
    console.log('   ' + Object.keys(process.env).filter(k => k.includes('DB') || k.includes('MASTER')).join(', '));
    results.steps.push({ step: 1, name: 'Check env var', success: false, error: 'MASTER_DB_URL not found' });
    results.success = false;
  } else {
    console.log('✅ PASSED: MASTER_DB_URL found');
    console.log(`   Length: ${masterDbUrl.length} characters`);
    console.log(`   Preview: ${masterDbUrl.substring(0, 50)}...`);
    results.steps.push({ step: 1, name: 'Check env var', success: true });
  }

  if (!masterDbUrl) {
    printSummary(results);
    process.exit(1);
  }

  // STEP 2: Parse URL
  console.log('\nSTEP 2: Parsing connection URL...');
  let parsedUrl;
  try {
    parsedUrl = new URL(masterDbUrl);
    console.log('✅ PASSED: URL is valid');
    console.log(`   Protocol: ${parsedUrl.protocol}`);
    console.log(`   Hostname: ${parsedUrl.hostname}`);
    console.log(`   Port: ${parsedUrl.port || '5432 (default)'}`);
    console.log(`   Database: ${parsedUrl.pathname.slice(1)}`);
    console.log(`   Username: ${parsedUrl.username}`);
    console.log(`   Password: ${parsedUrl.password ? '***' + parsedUrl.password.slice(-4) : 'NOT SET'}`);
    results.steps.push({ step: 2, name: 'Parse URL', success: true, parsed: {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 5432,
      database: parsedUrl.pathname.slice(1),
      username: parsedUrl.username
    }});
  } catch (error) {
    console.error('❌ FAILED: Invalid URL format');
    console.error(`   Error: ${error.message}`);
    results.steps.push({ step: 2, name: 'Parse URL', success: false, error: error.message });
    results.success = false;
    printSummary(results);
    process.exit(1);
  }

  // STEP 3: DNS Resolution
  console.log('\nSTEP 3: Testing DNS resolution...');
  try {
    const dns = require('dns').promises;
    const addresses = await dns.resolve4(parsedUrl.hostname);
    console.log('✅ PASSED: DNS resolves');
    console.log(`   IP addresses: ${addresses.join(', ')}`);
    results.steps.push({ step: 3, name: 'DNS resolution', success: true, addresses });
  } catch (error) {
    console.error('❌ FAILED: Cannot resolve hostname');
    console.error(`   Error: ${error.message}`);
    console.error(`   This means the hostname "${parsedUrl.hostname}" cannot be found`);
    results.steps.push({ step: 3, name: 'DNS resolution', success: false, error: error.message });
    results.success = false;
    printSummary(results);
    process.exit(1);
  }

  // STEP 4: TCP Connection
  console.log('\nSTEP 4: Testing TCP connection...');
  const port = parseInt(parsedUrl.port) || 5432;

  try {
    const net = require('net');
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: parsedUrl.hostname, port, timeout: 10000 });
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', reject);
      socket.on('timeout', () => reject(new Error('Connection timeout')));
    });

    console.log('✅ PASSED: TCP connection successful');
    console.log(`   Can reach ${parsedUrl.hostname}:${port}`);
    results.steps.push({ step: 4, name: 'TCP connection', success: true });
  } catch (error) {
    console.error('❌ FAILED: Cannot establish TCP connection');
    console.error(`   Error: ${error.message}`);
    console.error(`   This could mean:`);
    console.error(`   - Firewall blocking connection`);
    console.error(`   - Database not running`);
    console.error(`   - Wrong port (${port})`);
    results.steps.push({ step: 4, name: 'TCP connection', success: false, error: error.message });
    results.success = false;
    printSummary(results);
    process.exit(1);
  }

  // STEP 5: PostgreSQL Authentication
  console.log('\nSTEP 5: Testing PostgreSQL authentication...');
  const client = new Client({
    connectionString: masterDbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ PASSED: PostgreSQL authentication successful');
    results.steps.push({ step: 5, name: 'PostgreSQL auth', success: true });
  } catch (error) {
    console.error('❌ FAILED: PostgreSQL authentication failed');
    console.error(`   Error: ${error.message}`);

    if (error.message.includes('password authentication failed')) {
      console.error(`   → Wrong password for user "${parsedUrl.username}"`);
    } else if (error.message.includes('no pg_hba.conf entry')) {
      console.error(`   → IP address not allowed (check Supabase IP restrictions)`);
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error(`   → Database "${parsedUrl.pathname.slice(1)}" does not exist`);
    }

    results.steps.push({ step: 5, name: 'PostgreSQL auth', success: false, error: error.message });
    results.success = false;
    printSummary(results);
    process.exit(1);
  }

  // STEP 6: Execute Query
  console.log('\nSTEP 6: Testing query execution...');
  try {
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ PASSED: Query executed successfully');
    console.log(`   Server time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(',')[0]}`);
    results.steps.push({ step: 6, name: 'Query execution', success: true, serverTime: result.rows[0].current_time });
  } catch (error) {
    console.error('❌ FAILED: Query execution failed');
    console.error(`   Error: ${error.message}`);
    results.steps.push({ step: 6, name: 'Query execution', success: false, error: error.message });
    results.success = false;
  }

  // STEP 7: Check Tables Exist
  console.log('\nSTEP 7: Checking if migration tables exist...');
  try {
    const result = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const tables = result.rows.map(r => r.tablename);
    console.log(`✅ Found ${tables.length} tables in database`);

    const expectedTables = [
      'users', 'stores', 'store_databases', 'store_hostnames',
      'subscriptions', 'credit_balances', 'credit_transactions',
      'service_credit_costs', 'job_queue', 'usage_metrics',
      'api_usage_logs', 'billing_transactions'
    ];

    const missing = expectedTables.filter(t => !tables.includes(t));
    const extra = tables.filter(t => !expectedTables.includes(t));

    if (missing.length === 0) {
      console.log('✅ PASSED: All expected tables exist');
      expectedTables.forEach(t => console.log(`   ✓ ${t}`));
      results.steps.push({ step: 7, name: 'Check tables', success: true, tables: tables.length });
    } else {
      console.error('❌ FAILED: Missing tables');
      missing.forEach(t => console.log(`   ✗ ${t} (MISSING - run migration)`));
      if (extra.length > 0) {
        console.log(`   Found ${extra.length} other tables: ${extra.slice(0, 5).join(', ')}${extra.length > 5 ? '...' : ''}`);
      }
      results.steps.push({ step: 7, name: 'Check tables', success: false, missing, found: tables.length });
      results.success = false;
    }
  } catch (error) {
    console.error('❌ FAILED: Cannot query tables');
    console.error(`   Error: ${error.message}`);
    results.steps.push({ step: 7, name: 'Check tables', success: false, error: error.message });
    results.success = false;
  }

  // STEP 8: Test Write Operation
  console.log('\nSTEP 8: Testing write permissions...');
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _connection_test (
        id SERIAL PRIMARY KEY,
        test_value TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      INSERT INTO _connection_test (test_value) VALUES ($1)
    `, [`test-${Date.now()}`]);

    await client.query('DROP TABLE _connection_test');

    console.log('✅ PASSED: Write permissions working');
    results.steps.push({ step: 8, name: 'Write permissions', success: true });
  } catch (error) {
    console.error('❌ FAILED: Write operation failed');
    console.error(`   Error: ${error.message}`);
    results.steps.push({ step: 8, name: 'Write permissions', success: false, error: error.message });
    results.success = false;
  }

  // Close connection
  await client.end();

  // Print summary
  printSummary(results);

  process.exit(results.success ? 0 : 1);
}

function printSummary(results) {
  console.log('\n========================================');
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('========================================\n');

  results.steps.forEach((step, index) => {
    const status = step.success ? '✅' : '❌';
    console.log(`${status} Step ${step.step}: ${step.name}`);
    if (!step.success && step.error) {
      console.log(`   Error: ${step.error}`);
    }
  });

  console.log('\n========================================');
  if (results.success) {
    console.log('🎉 ALL DIAGNOSTICS PASSED!');
    console.log('Master DB is fully functional and ready to use.');
  } else {
    console.log('⚠️  SOME DIAGNOSTICS FAILED');
    console.log('Fix the errors above before proceeding.');
  }
  console.log('========================================\n');
}

// Run diagnostic
detailedDiagnostic().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
