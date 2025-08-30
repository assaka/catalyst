/**
 * Debug patch existence and application
 * Check if the specific patch ID exists and can be applied
 */

const { sequelize } = require('./backend/src/database/connection');

async function debugPatchExistence() {
  try {
    console.log('🔍 Debugging Patch Existence and Application');
    console.log('============================================');
    
    const storeId = '8cc01a01-3a78-4f20-beb8-a566a07834e5';
    const patchId = 'a432e3d2-42ef-4df6-b5cc-3dcd28c513fe';
    const fileName = 'src/pages/Cart.jsx';
    
    console.log('📋 Searching for:');
    console.log(`  Store ID: ${storeId}`);
    console.log(`  Patch ID: ${patchId}`);
    console.log(`  File: ${fileName}`);
    
    // Check if patch exists by ID
    console.log('\n1. 🔍 Checking patch by specific ID...');
    const patchById = await sequelize.query(`
      SELECT id, store_id, file_path, patch_name, status, is_active, created_at
      FROM patch_diffs 
      WHERE id = :patchId
    `, {
      replacements: { patchId },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (patchById.length > 0) {
      console.log('  ✅ Found patch by ID:', patchById[0]);
    } else {
      console.log('  ❌ No patch found with ID:', patchId);
    }
    
    // Check all patches for the store + file
    console.log('\n2. 🔍 Checking all patches for store + file...');
    const allPatches = await sequelize.query(`
      SELECT id, store_id, file_path, patch_name, status, is_active, created_at, priority
      FROM patch_diffs 
      WHERE store_id = :storeId AND file_path = :fileName
      ORDER BY created_at DESC
    `, {
      replacements: { storeId, fileName },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log(`  Found ${allPatches.length} patches for ${fileName}:`);
    allPatches.forEach((patch, index) => {
      console.log(`    ${index + 1}. ID: ${patch.id.substring(0, 8)}... | ${patch.patch_name} | Status: ${patch.status} | Active: ${patch.is_active}`);
    });
    
    // Check if patches table exists with different name
    console.log('\n3. 🔍 Checking alternative table names...');
    
    // Try patches table (without _diffs suffix)
    try {
      const patchesTable = await sequelize.query(`
        SELECT id, store_id, file_path, patch_name, status, is_active
        FROM patches 
        WHERE store_id = :storeId AND file_path = :fileName
        LIMIT 5
      `, {
        replacements: { storeId, fileName },
        type: sequelize.QueryTypes.SELECT
      });
      console.log(`  ✅ Found ${patchesTable.length} patches in 'patches' table`);
      if (patchesTable.length > 0) {
        patchesTable.forEach(patch => {
          console.log(`    - ${patch.id.substring(0, 8)}... | ${patch.patch_name}`);
        });
      }
    } catch (error) {
      console.log('  ❌ No "patches" table found');
    }
    
    // Create a test patch if none exists
    if (allPatches.length === 0) {
      console.log('\n4. 🔧 Creating test patch since none exists...');
      
      try {
        await sequelize.query(`
          INSERT INTO patch_diffs (
            id, store_id, file_path, patch_name, change_type,
            unified_diff, change_summary, change_description,
            status, is_active, priority, created_by, created_at, updated_at
          ) VALUES (
            :patchId, :storeId, :fileName, :patchName, 'manual_edit',
            :unifiedDiff, :changeSummary, :changeDescription,
            'open', true, 0, 'system', NOW(), NOW()
          )
        `, {
          replacements: {
            patchId: patchId,
            storeId: storeId,
            fileName: fileName,
            patchName: 'Test Cart Enhancement',
            unifiedDiff: `--- a/${fileName}
+++ b/${fileName}
@@ -1,6 +1,6 @@
 import React, { useState, useEffect, useCallback, useMemo } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { createPageUrl } from '@/utils';
-import { createPublicUrl, getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
+import { TESTcreatePublicUrl, getExternalStoreUrl, getStoreBaseUrl } from '@/utils/urlUtils';
 import { useStore } from '@/components/storefront/StoreProvider';
 import { StorefrontProduct } from '@/api/storefront-entities';`,
            changeSummary: 'Test enhancement for Cart preview',
            changeDescription: 'Adding TEST prefix to createPublicUrl function for debugging'
          },
          type: sequelize.QueryTypes.INSERT
        });
        
        console.log('  ✅ Created test patch with ID:', patchId);
      } catch (insertError) {
        console.log('  ❌ Failed to create test patch:', insertError.message);
      }
    }
    
    // Test the patch API endpoint
    console.log('\n5. 🌐 Testing patch API endpoint...');
    const apiUrl = `http://localhost:8000/api/patches/apply/${encodeURIComponent(fileName)}?store_id=${storeId}&preview=true`;
    console.log(`  API URL: ${apiUrl}`);
    console.log('  ❌ Cannot test - backend not running locally');
    
    // Check production API
    console.log('\n6. 🚀 Production API test (if available)...');
    const prodUrl = `https://catalyst-backend-fzhu.onrender.com/api/patches/apply/${encodeURIComponent(fileName)}?store_id=${storeId}&preview=true`;
    console.log(`  Production URL: ${prodUrl}`);
    console.log('  💡 Test this URL in browser or with curl');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    await sequelize.close();
    process.exit(1);
  }
}

debugPatchExistence();