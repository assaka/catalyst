/**
 * Backfill store_databases table for OAuth-provisioned stores
 *
 * Problem: Stores provisioned via OAuth before the fix don't have
 * store_databases records, causing "Unnamed Store" in dropdown.
 *
 * Solution: Query supabase_oauth_tokens from each tenant DB and
 * create store_databases records in master DB.
 */

require('dotenv').config();
const { masterSupabaseClient } = require('../src/database/masterConnection');
const { createClient } = require('@supabase/supabase-js');
const StoreDatabase = require('../src/models/master/StoreDatabase');

async function backfillStoreDatabases() {
  console.log('🔄 Starting store_databases backfill...\n');

  try {
    // 1. Get all active stores from master DB
    const { data: stores, error: storesError } = await masterSupabaseClient
      .from('stores')
      .select('id, status, is_active')
      .eq('is_active', true)
      .eq('status', 'active');

    if (storesError) {
      throw new Error(`Failed to fetch stores: ${storesError.message}`);
    }

    console.log(`📊 Found ${stores.length} active stores\n`);

    // 2. Check which stores already have store_databases records
    const { data: existingRecords } = await masterSupabaseClient
      .from('store_databases')
      .select('store_id');

    const existingStoreIds = new Set(existingRecords?.map(r => r.store_id) || []);
    const storesToBackfill = stores.filter(s => !existingStoreIds.has(s.id));

    console.log(`✅ ${existingStoreIds.size} stores already have store_databases records`);
    console.log(`🔧 ${storesToBackfill.length} stores need backfilling\n`);

    if (storesToBackfill.length === 0) {
      console.log('✅ All stores already have store_databases records!');
      return;
    }

    // 3. For each store without a record, try to get credentials from tenant DB
    let successCount = 0;
    let failCount = 0;

    for (const store of storesToBackfill) {
      console.log(`\n🔍 Processing store: ${store.id}`);

      try {
        // Try to get OAuth tokens from tenant DB
        // We need to connect using environment credentials first
        const MASTER_PROJECT_URL = process.env.SUPABASE_URL;
        const MASTER_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!MASTER_PROJECT_URL || !MASTER_SERVICE_KEY) {
          console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
          continue;
        }

        // Query supabase_oauth_tokens table in tenant DB to get credentials
        // Note: This assumes tenant DB is the same as master DB for now
        // In a true multi-tenant setup, you'd need to know the tenant DB URL

        const { data: tokenData, error: tokenError } = await masterSupabaseClient
          .from('supabase_oauth_tokens')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (tokenError || !tokenData) {
          console.warn(`⚠️ No OAuth tokens found for store ${store.id}`);
          console.warn(`   This store might have been manually provisioned or needs manual intervention`);
          failCount++;
          continue;
        }

        console.log('✅ Found OAuth tokens in tenant DB');

        // Create StoreDatabase record
        const credentials = {
          projectUrl: tokenData.project_url,
          serviceRoleKey: tokenData.service_role_key,
          anonKey: tokenData.anon_key,
          connectionString: null // OAuth doesn't use connection strings
        };

        await StoreDatabase.createWithCredentials(
          store.id,
          'supabase',
          credentials
        );

        console.log('✅ Created store_databases record');
        successCount++;

      } catch (error) {
        console.error(`❌ Failed to backfill store ${store.id}:`, error.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Backfill Summary:');
    console.log(`   ✅ Success: ${successCount} stores`);
    console.log(`   ❌ Failed: ${failCount} stores`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 Backfill completed! Store selector should now show proper names.');
      console.log('   Refresh your admin page to see the changes.');
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
backfillStoreDatabases()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
