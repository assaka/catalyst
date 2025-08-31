/**
 * Check what patches actually exist in the database for Cart.jsx
 * This will help understand why the adam patch isn't being found
 */

const API_BASE_URL = 'https://catalyst-backend-fzhu.onrender.com';
const STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';
const FILE_PATH = 'src/pages/Cart.jsx';
const PATCH_ID = '10722068-930f-41db-915b-e6c627e7f539';

async function checkExistingPatches() {
  try {
    console.log('🔍 Checking existing patches in database...');
    console.log(`   Store ID: ${STORE_ID}`);
    console.log(`   File Path: ${FILE_PATH}`);
    console.log(`   Expected Patch ID: ${PATCH_ID}`);
    
    // Check different possible table names and structures
    const tablesToCheck = [
      'hybrid_customizations',
      'patch_diffs', 
      'code_patches',
      'patches'
    ];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Checking table: ${tableName}`);
      
      try {
        // First, check if table exists and get its structure
        const structureResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = $1 
              ORDER BY ordinal_position
            `,
            params: [tableName]
          })
        });
        
        if (structureResponse.ok) {
          const structureResult = await structureResponse.json();
          if (structureResult.success && structureResult.data && structureResult.data.length > 0) {
            console.log(`   ✅ Table ${tableName} exists with columns:`);
            structureResult.data.forEach(col => {
              console.log(`      - ${col.column_name} (${col.data_type})`);
            });
            
            // Now query for patches in this table
            const patchResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: `
                  SELECT id, file_path, store_id, status, created_at,
                         CASE 
                           WHEN LENGTH(COALESCE(current_code, '')) > 0 THEN 'has_current_code'
                           ELSE 'no_current_code'
                         END as code_status
                  FROM ${tableName}
                  WHERE (file_path = $1 OR file_path LIKE '%Cart.jsx%')
                    AND (store_id = $2 OR store_id IS NULL)
                  ORDER BY created_at DESC
                  LIMIT 10
                `,
                params: [FILE_PATH, STORE_ID]
              })
            });
            
            if (patchResponse.ok) {
              const patchResult = await patchResponse.json();
              if (patchResult.success && patchResult.data && patchResult.data.length > 0) {
                console.log(`   📦 Found ${patchResult.data.length} patches in ${tableName}:`);
                patchResult.data.forEach((patch, index) => {
                  console.log(`      ${index + 1}. ID: ${patch.id}`);
                  console.log(`         File: ${patch.file_path}`);
                  console.log(`         Store: ${patch.store_id}`);
                  console.log(`         Status: ${patch.status || 'N/A'}`);
                  console.log(`         Code: ${patch.code_status}`);
                  console.log(`         Created: ${patch.created_at}`);
                  
                  if (patch.id === PATCH_ID) {
                    console.log(`         🎯 THIS IS THE EXPECTED PATCH!`);
                  }
                });
              } else {
                console.log(`   ❌ No patches found in ${tableName}`);
              }
            }
          } else {
            console.log(`   ❌ Table ${tableName} does not exist`);
          }
        }
      } catch (tableError) {
        console.log(`   ❌ Error checking ${tableName}: ${tableError.message}`);
      }
    }
    
    // Specifically check for the expected patch ID across all tables
    console.log(`\n🎯 Searching specifically for patch ID: ${PATCH_ID}`);
    
    for (const tableName of tablesToCheck) {
      try {
        const specificResponse = await fetch(`${API_BASE_URL}/api/debug-store/execute-sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              SELECT '${tableName}' as table_name, id, file_path, store_id, status,
                     CASE 
                       WHEN current_code LIKE '%adam%' THEN 'contains_adam'
                       WHEN current_code LIKE '%Looks%' THEN 'contains_looks'
                       ELSE 'no_relevant_content'
                     END as content_check
              FROM ${tableName}
              WHERE id = $1
            `,
            params: [PATCH_ID]
          })
        });
        
        if (specificResponse.ok) {
          const specificResult = await specificResponse.json();
          if (specificResult.success && specificResult.data && specificResult.data.length > 0) {
            const patch = specificResult.data[0];
            console.log(`   ✅ Found patch ${PATCH_ID} in ${tableName}:`);
            console.log(`      - File path: ${patch.file_path}`);
            console.log(`      - Store ID: ${patch.store_id}`);
            console.log(`      - Status: ${patch.status}`);
            console.log(`      - Content check: ${patch.content_check}`);
            
            // This patch exists! Let's check why it's not being applied
            if (patch.store_id !== STORE_ID) {
              console.log(`      ⚠️ STORE ID MISMATCH! Expected: ${STORE_ID}, Found: ${patch.store_id}`);
            }
            if (patch.file_path !== FILE_PATH) {
              console.log(`      ⚠️ FILE PATH MISMATCH! Expected: ${FILE_PATH}, Found: ${patch.file_path}`);
            }
            if (patch.status && !['active', 'published', 'enabled'].includes(patch.status.toLowerCase())) {
              console.log(`      ⚠️ INACTIVE STATUS! Status: ${patch.status}`);
            }
            
            break; // Found it, no need to check other tables
          }
        }
      } catch (specificError) {
        // Silently continue to next table
      }
    }
    
    return {
      success: true,
      message: 'Patch check completed'
    };
    
  } catch (error) {
    console.error('❌ Error checking patches:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the script
if (require.main === module) {
  checkExistingPatches()
    .then(result => {
      if (result.success) {
        console.log('\n🎯 Patch check completed!');
        console.log('   Review the output above to understand patch status.');
      } else {
        console.error('\n💥 Patch check failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Script error:', error);
      process.exit(1);
    });
}

module.exports = { checkExistingPatches };