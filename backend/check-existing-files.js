const supabaseIntegration = require('./src/services/supabase-integration');

const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

(async () => {
  try {
    console.log('🔍 Checking for existing files in Supabase buckets...\n');
    
    // Get token info to check if we have credentials
    const tokenInfo = await supabaseIntegration.getTokenInfo(STORE_ID);
    
    if (!tokenInfo) {
      console.log('❌ No Supabase credentials found');
      process.exit(1);
    }
    
    console.log('✅ Found Supabase credentials');
    console.log('   Project URL:', tokenInfo.project_url);
    
    // Get admin client
    const client = await supabaseIntegration.getSupabaseAdminClient(STORE_ID);
    if (!client) {
      console.log('❌ Could not get Supabase client');
      process.exit(1);
    }
    
    console.log('✅ Got Supabase client\n');
    
    // Check files in each bucket and folder
    const checkLocations = [
      { bucket: 'suprshop-assets', path: 'library', description: 'Library files' },
      { bucket: 'suprshop-assets', path: 'test-products', description: 'Test product assets' },
      { bucket: 'suprshop-catalog', path: 'product/images', description: 'Product images' },
      { bucket: 'suprshop-catalog', path: 'product/files', description: 'Product files' },
      { bucket: 'suprshop-catalog', path: 'category/images', description: 'Category images' },
      { bucket: 'suprshop-images', path: '', description: 'Legacy bucket (if exists)' }
    ];
    
    let totalFiles = 0;
    
    for (const location of checkLocations) {
      try {
        const { data, error } = await client.storage
          .from(location.bucket)
          .list(location.path, { limit: 100 });
        
        if (error) {
          console.log(`❌ ${location.description} (${location.bucket}/${location.path}): Error - ${error.message}`);
        } else {
          const files = data ? data.filter(item => item.id) : [];
          totalFiles += files.length;
          
          console.log(`📦 ${location.description} (${location.bucket}/${location.path}): ${files.length} files`);
          
          if (files.length > 0) {
            console.log('   Files found:');
            files.slice(0, 5).forEach(file => {
              console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
            });
            if (files.length > 5) {
              console.log(`   ... and ${files.length - 5} more`);
            }
          }
        }
      } catch (err) {
        console.log(`⚠️  ${location.description}: Could not access`);
      }
      console.log('');
    }
    
    console.log(`📊 Total files found across all buckets: ${totalFiles}`);
    
    if (totalFiles > 0) {
      console.log('\n✅ Files exist in the buckets! They should be visible in the File Library.');
      console.log('   Make sure the File Library is requesting the correct folders.');
    } else {
      console.log('\n⚠️  No files found in any bucket. Upload some files first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();