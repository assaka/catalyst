/**
 * Create a test patch in the database with distant changes
 */
const { sequelize } = require('./backend/src/database/connection');
const fs = require('fs');
const path = require('path');
// Generate simple UUID without external dependency
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STORE_ID = '8cc01a01-3a78-4f20-beb8-a566a07834e5';
const USER_ID = 'cbca0a20-973d-4a33-85fc-d84d461d1372';

async function createTestPatch() {
  try {
    console.log('🔧 Creating test patch for Cart.jsx...');
    
    // Read current file (with our test changes)
    const currentPath = path.join(__dirname, 'src/pages/Cart.jsx');
    const currentCode = fs.readFileSync(currentPath, 'utf8');
    
    // Create the original version (without our test changes)
    const originalCode = currentCode
      .replace('TESTcreatePublicUrl', 'createPublicUrl')
      .replace('TESTformatPrice', 'formatPrice');
    
    console.log('📊 Code comparison:');
    console.log('  - Original length:', originalCode.length);
    console.log('  - Current length:', currentCode.length);
    
    // Generate unified diff using our service
    const UnifiedDiffFrontendService = require('./src/services/unified-diff-frontend-service.js');
    const diffService = new UnifiedDiffFrontendService();
    
    const diffResult = diffService.createDiff(originalCode, currentCode, {
      filename: 'src/pages/Cart.jsx',
      showFullFile: false
    });
    
    console.log('\n📋 Generated unified diff:');
    console.log('='.repeat(60));
    console.log(diffResult.unifiedDiff);
    console.log('='.repeat(60));
    console.log(`Number of hunks: ${diffResult.parsedDiff.length}`);
    
    if (!diffResult.unifiedDiff) {
      console.error('❌ No diff generated');
      return;
    }
    
    // Generate patch ID
    const patchId = generateUUID();
    console.log('\n🆔 Generated patch ID:', patchId);
    
    // Insert patch into database
    const insertQuery = `
      INSERT INTO patches (
        id, store_id, file_path, patch_name, change_type,
        unified_diff, ast_diff, change_summary, change_description,
        baseline_version, applies_to_lines, dependencies, conflicts_with,
        status, is_active, priority, created_by, created_at, updated_at
      ) VALUES (
        :id, :storeId, :filePath, :patchName, :changeType,
        :unifiedDiff, :astDiff, :changeSummary, :changeDescription,
        :baselineVersion, :appliesToLines, :dependencies, :conflictsWith,
        :status, :isActive, :priority, :createdBy, NOW(), NOW()
      )
    `;
    
    const patchData = {
      id: patchId,
      storeId: STORE_ID,
      filePath: 'src/pages/Cart.jsx',
      patchName: `Test patch - distant changes (lines 5 & 37)`,
      changeType: 'manual_edit',
      unifiedDiff: diffResult.unifiedDiff,
      astDiff: null,
      changeSummary: 'Test patch with changes on lines 5 and 37 (32 lines apart)',
      changeDescription: 'Testing hunk separation with TESTcreatePublicUrl and TESTformatPrice',
      baselineVersion: 'latest',
      appliesToLines: JSON.stringify([5, 37]),
      dependencies: '[]',
      conflictsWith: '[]',
      status: 'open',
      isActive: true,
      priority: 0,
      createdBy: USER_ID
    };
    
    await sequelize.query(insertQuery, {
      replacements: patchData,
      type: sequelize.QueryTypes.INSERT
    });
    
    console.log('✅ Successfully created test patch');
    console.log('🆔 Patch ID:', patchId);
    console.log('📋 Changes:');
    console.log('  - Line 5: createPublicUrl → TESTcreatePublicUrl');
    console.log('  - Line 37: formatPrice → TESTformatPrice'); 
    console.log('  - Separation: 32 lines');
    console.log(`  - Expected hunks: 2 (actual: ${diffResult.parsedDiff.length})`);
    
    if (diffResult.parsedDiff.length > 1) {
      console.log('✅ SUCCESS: Multiple hunks created!');
    } else {
      console.log('❌ ISSUE: Only 1 hunk created for distant changes');
    }
    
    // Verify in database
    const verification = await sequelize.query(`
      SELECT id, file_path, patch_name, change_type, LENGTH(unified_diff) as diff_length
      FROM patches 
      WHERE id = :patchId
    `, {
      replacements: { patchId },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (verification.length > 0) {
      console.log('\n🔍 Database verification:');
      console.log('  - Patch saved with ID:', verification[0].id);
      console.log('  - File path:', verification[0].file_path);
      console.log('  - Patch name:', verification[0].patch_name);
      console.log('  - Diff length:', verification[0].diff_length, 'characters');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error creating test patch:', error);
    console.error('Error details:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

createTestPatch();