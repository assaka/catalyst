#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing database connection on Render.com...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`SUPABASE_DB_URL: ${process.env.SUPABASE_DB_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}\n`);

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables!');
    console.log('\nPlease set one of the following in Render.com environment variables:');
    console.log('- DATABASE_URL');
    console.log('- SUPABASE_DB_URL');
    console.log('\nExample format:');
    console.log('postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres');
    return;
  }

  // Mask the password in the URL for logging
  const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ':****@');
  console.log(`📌 Database URL (masked): ${maskedUrl}\n`);

  // Test Sequelize connection
  console.log('🔄 Testing Sequelize connection...');
  const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize connection successful!\n');
    
    // Test if we can query tables
    const [results] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      LIMIT 5;
    `);
    
    console.log('📋 Sample tables found:');
    results.forEach(row => console.log(`   - ${row.tablename}`));
    
  } catch (error) {
    console.error('❌ Sequelize connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DNS resolution error. This might be an IPv6 issue on Render.com');
    }
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Authentication failed. Check your database password in Render environment variables');
    }
    if (error.message.includes('SSL')) {
      console.log('\n💡 SSL connection issue. The code is configured to handle this.');
    }
  } finally {
    await sequelize.close();
  }

  // Test Supabase client if configured
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('\n🔄 Testing Supabase client...');
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase
        .from('stores')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase client test failed:', error.message);
      } else {
        console.log('✅ Supabase client connection successful!');
      }
    } catch (error) {
      console.error('❌ Supabase client initialization failed:', error.message);
    }
  } else {
    console.log('\n⚠️  Supabase client not configured (missing SUPABASE_URL or SUPABASE_ANON_KEY)');
  }

  console.log('\n🏁 Connection test complete!');
}

// Run the test
testConnection().catch(console.error);