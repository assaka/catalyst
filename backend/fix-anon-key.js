process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

const { sequelize } = require('./src/database/connection.js');
const supabaseIntegration = require('./src/services/supabase-integration');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

async function fixAnonKey() {
  try {
    console.log('🔧 Fixing invalid anon key...\n');
    
    // First, set a placeholder for the invalid anon key
    console.log('1. Setting placeholder for invalid anon key...');
    await sequelize.query(
      'UPDATE supabase_oauth_tokens SET anon_key = :placeholder WHERE store_id = :storeId',
      {
        replacements: { 
          storeId: STORE_ID,
          placeholder: 'pending_configuration'
        }
      }
    );
    console.log('✅ Invalid anon key replaced with placeholder\n');
    
    // Try to fetch the correct API keys from Supabase
    console.log('2. Attempting to fetch correct API keys from Supabase...');
    try {
      const result = await supabaseIntegration.fetchAndUpdateApiKeys(STORE_ID);
      
      if (result.success) {
        console.log('✅ API keys fetched successfully');
        console.log('   Has anon key:', result.hasAnonKey);
        console.log('   Has service role key:', result.hasServiceRoleKey);
        
        if (!result.hasAnonKey) {
          console.log('\n⚠️  Supabase did not provide an anon key through the API.');
          console.log('   This might mean:');
          console.log('   1. The project is paused/inactive');
          console.log('   2. OAuth scope is limited');
          console.log('   3. Keys need to be manually configured');
          console.log('\nTo fix this:');
          console.log('1. Go to: https://supabase.com/dashboard/project/mjsalghcwirstjunhuiu/settings/api');
          console.log('2. Copy the "anon" key (starts with eyJ...)');
          console.log('3. Add it in the Catalyst dashboard Supabase integration settings');
        }
      } else {
        console.log('❌ Could not fetch API keys:', result.message);
      }
    } catch (fetchError) {
      console.log('❌ Error fetching API keys:', fetchError.message);
      console.log('\nYou need to manually add the API keys:');
      console.log('1. Go to: https://supabase.com/dashboard/project/mjsalghcwirstjunhuiu/settings/api');
      console.log('2. Copy the "anon" key');
      console.log('3. Add it in the Catalyst dashboard');
    }
    
    // Check the current state
    console.log('\n3. Checking current state...');
    const [results] = await sequelize.query(
      'SELECT anon_key, service_role_key FROM supabase_oauth_tokens WHERE store_id = :storeId',
      {
        replacements: { storeId: STORE_ID }
      }
    );
    
    if (results.length > 0) {
      const { anon_key, service_role_key } = results[0];
      
      if (anon_key && anon_key.startsWith('eyJ')) {
        console.log('✅ Valid anon key is now configured');
      } else if (anon_key) {
        console.log('⚠️  Anon key present but may be invalid:', anon_key.substring(0, 20));
      } else {
        console.log('❌ No anon key configured');
      }
      
      console.log('Service role key:', service_role_key ? 'Configured' : 'Not configured');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
  }
}

fixAnonKey();