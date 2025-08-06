process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { sequelize } = require('./src/database/connection.js');
const readline = require('readline');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixSupabaseKeys() {
  try {
    console.log('🔧 Supabase API Keys Configuration Tool\n');
    console.log('=====================================\n');
    
    // Check current state
    console.log('📋 Checking current configuration...\n');
    const [results] = await sequelize.query(
      'SELECT project_url, anon_key, service_role_key FROM supabase_oauth_tokens WHERE store_id = :storeId',
      {
        replacements: { storeId: STORE_ID }
      }
    );
    
    if (results.length === 0) {
      console.log('❌ No Supabase connection found for this store');
      console.log('   Please connect Supabase via the dashboard first\n');
      rl.close();
      await sequelize.close();
      return;
    }
    
    const { project_url, anon_key, service_role_key } = results[0];
    
    console.log('Current configuration:');
    console.log('   Project URL:', project_url);
    console.log('   Anon Key:', anon_key ? `${anon_key.substring(0, 20)}...` : 'Not configured');
    console.log('   Service Role Key:', service_role_key ? 'Configured' : 'Not configured');
    console.log('');
    
    // Check if current anon key is invalid
    if (anon_key && !anon_key.startsWith('eyJ')) {
      console.log('⚠️  WARNING: Current anon key appears to be invalid!');
      console.log('   JWT tokens should start with "eyJ"');
      console.log('   Current value starts with:', anon_key.substring(0, 10));
      console.log('');
    }
    
    // Extract project ID from URL
    const projectIdMatch = project_url.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!projectIdMatch) {
      console.log('❌ Invalid project URL format');
      rl.close();
      await sequelize.close();
      return;
    }
    const projectId = projectIdMatch[1];
    
    console.log('📍 Project ID:', projectId);
    console.log('');
    console.log('To fix the Invalid Compact JWS error, you need to provide the correct API keys.');
    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + projectId + '/settings/api');
    console.log('2. Find the "Project API keys" section');
    console.log('3. Copy the "anon" public key (it should start with "eyJ")');
    console.log('4. Optionally, copy the "service_role" key for full management features');
    console.log('');
    
    const proceed = await question('Do you have the API keys ready? (yes/no): ');
    
    if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
      console.log('\nPlease get the API keys from your Supabase dashboard and run this script again.');
      rl.close();
      await sequelize.close();
      return;
    }
    
    console.log('');
    const newAnonKey = await question('Paste the anon (public) key here: ');
    
    if (!newAnonKey) {
      console.log('\n❌ No key provided');
      rl.close();
      await sequelize.close();
      return;
    }
    
    // Validate the key format
    if (!newAnonKey.startsWith('eyJ')) {
      console.log('\n❌ Invalid key format! JWT tokens must start with "eyJ"');
      console.log('   You provided:', newAnonKey.substring(0, 10) + '...');
      console.log('   This doesn\'t look like a Supabase API key.');
      rl.close();
      await sequelize.close();
      return;
    }
    
    // Check if it's a valid JWT structure (should have 3 parts separated by dots)
    const parts = newAnonKey.split('.');
    if (parts.length !== 3) {
      console.log('\n❌ Invalid JWT format! JWT tokens should have 3 parts separated by dots.');
      console.log('   Your key has', parts.length, 'parts');
      rl.close();
      await sequelize.close();
      return;
    }
    
    console.log('\n✅ Key format looks valid!');
    
    // Ask for service role key (optional)
    const askServiceRole = await question('\nDo you want to add the service_role key for full management features? (yes/no): ');
    
    let newServiceRoleKey = null;
    if (askServiceRole.toLowerCase() === 'yes' || askServiceRole.toLowerCase() === 'y') {
      newServiceRoleKey = await question('Paste the service_role key here: ');
      
      if (newServiceRoleKey && !newServiceRoleKey.startsWith('eyJ')) {
        console.log('\n⚠️  Warning: Service role key doesn\'t look like a JWT token');
        const confirmServiceRole = await question('Continue anyway? (yes/no): ');
        if (confirmServiceRole.toLowerCase() !== 'yes' && confirmServiceRole.toLowerCase() !== 'y') {
          newServiceRoleKey = null;
        }
      }
    }
    
    // Update the keys in database
    console.log('\n🔄 Updating API keys in database...');
    
    const updateQuery = newServiceRoleKey 
      ? 'UPDATE supabase_oauth_tokens SET anon_key = :anonKey, service_role_key = :serviceKey WHERE store_id = :storeId'
      : 'UPDATE supabase_oauth_tokens SET anon_key = :anonKey WHERE store_id = :storeId';
    
    const replacements = newServiceRoleKey
      ? { storeId: STORE_ID, anonKey: newAnonKey, serviceKey: newServiceRoleKey }
      : { storeId: STORE_ID, anonKey: newAnonKey };
    
    await sequelize.query(updateQuery, { replacements });
    
    console.log('✅ API keys updated successfully!');
    
    // Verify the update
    console.log('\n📋 Verifying update...');
    const [updated] = await sequelize.query(
      'SELECT anon_key, service_role_key FROM supabase_oauth_tokens WHERE store_id = :storeId',
      {
        replacements: { storeId: STORE_ID }
      }
    );
    
    if (updated.length > 0) {
      const { anon_key: finalAnonKey, service_role_key: finalServiceKey } = updated[0];
      console.log('   Anon Key:', finalAnonKey.substring(0, 20) + '...');
      console.log('   Service Role Key:', finalServiceKey ? 'Configured' : 'Not configured');
      console.log('');
      console.log('🎉 Configuration complete!');
      console.log('');
      console.log('You should now be able to:');
      console.log('   ✅ Upload files to Supabase Storage');
      console.log('   ✅ Fetch and manage storage buckets');
      console.log('   ✅ Use all storage features without JWT errors');
      
      if (finalServiceKey) {
        console.log('   ✅ Create and delete buckets (with service role key)');
      }
    }
    
    rl.close();
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    await sequelize.close();
  }
}

fixSupabaseKeys();