const supabaseIntegration = require('./backend/src/services/supabase-integration');
const storeId = '157d4590-49bf-4b0b-bd77-abe131909528';

(async () => {
  try {
    console.log('🔍 Deep investigation of Supabase buckets...');
    
    const client = await supabaseIntegration.getSupabaseAdminClient(storeId);
    const buckets = ['suprshop-catalog', 'suprshop-assets'];
    
    for (const bucketName of buckets) {
      console.log('\n📦 Analyzing bucket:', bucketName);
      
      try {
        // Get ALL files in the bucket root with no path filter
        const { data: allRootFiles, error: rootError } = await client.storage
          .from(bucketName)
          .list('', { limit: 1000 });
        
        if (rootError) {
          console.log('  ❌ Error accessing root:', rootError.message);
          continue;
        }
        
        console.log('  📁 Root level items found:', allRootFiles ? allRootFiles.length : 0);
        
        if (allRootFiles && allRootFiles.length > 0) {
          console.log('  📋 Root level contents:');
          allRootFiles.forEach(item => {
            const isFile = item.id ? true : false;
            console.log(`    - ${item.name} (${isFile ? 'FILE' : 'FOLDER'})`);
            if (isFile) {
              console.log(`      Size: ${item.metadata?.size || 'unknown'} bytes`);
              console.log(`      Type: ${item.metadata?.mimetype || 'unknown'}`);
              console.log(`      Modified: ${item.updated_at || 'unknown'}`);
            }
          });
        }
        
        // Check for folders and their contents
        const folders = allRootFiles ? allRootFiles.filter(item => !item.id) : [];
        console.log('  📂 Folders found:', folders.length);
        
        for (const folder of folders) {
          console.log('  🔍 Checking folder:', folder.name);
          try {
            const { data: folderContents, error: folderError } = await client.storage
              .from(bucketName)
              .list(folder.name, { limit: 1000 });
            
            if (!folderError && folderContents) {
              console.log(`    📋 Contents of ${folder.name}:`);
              folderContents.forEach(item => {
                const isFile = item.id ? true : false;
                console.log(`      - ${item.name} (${isFile ? 'FILE' : 'FOLDER'})`);
                if (isFile && item.metadata) {
                  console.log(`        Size: ${item.metadata.size || 'unknown'} bytes`);
                  console.log(`        Type: ${item.metadata.mimetype || 'unknown'}`);
                }
              });
            }
          } catch (folderError) {
            console.log('    ❌ Error in folder:', folderError.message);
          }
        }
      } catch (bucketError) {
        console.log('  ❌ Error accessing bucket:', bucketError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
})();