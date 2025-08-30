const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

function generateCodeHash(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function addCartBaseline() {
  try {
    console.log('📁 Adding Cart.jsx baseline...');
    
    // Check if it already exists
    const existing = await sequelize.query(`
      SELECT id, file_path FROM file_baselines 
      WHERE file_path = 'src/pages/Cart.jsx' AND store_id = :storeId
    `, {
      replacements: { storeId: DEFAULT_STORE_ID },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (existing.length > 0) {
      console.log('✅ Cart.jsx baseline already exists:', existing[0].file_path);
      await sequelize.close();
      return;
    }
    
    // Read the Cart.jsx file
    const cartPath = path.join(__dirname, '../src/pages/Cart.jsx');
    if (!fs.existsSync(cartPath)) {
      console.error('❌ Cart.jsx file not found at:', cartPath);
      await sequelize.close();
      return;
    }
    
    const content = fs.readFileSync(cartPath, 'utf8');
    const stat = fs.statSync(cartPath);
    const codeHash = generateCodeHash(content);
    
    console.log('📊 Cart.jsx file stats:');
    console.log('  - Size:', stat.size, 'bytes');
    console.log('  - Content length:', content.length, 'chars');
    console.log('  - Hash:', codeHash.substring(0, 16) + '...');
    
    // Insert the baseline
    const [result] = await sequelize.query(`
      INSERT INTO file_baselines (
        store_id, 
        file_path, 
        baseline_code, 
        code_hash, 
        version,
        file_type,
        file_size,
        last_modified,
        created_at,
        updated_at
      ) 
      VALUES (
        :storeId,
        :filePath,
        :baselineCode,
        :codeHash,
        'latest',
        'jsx',
        :fileSize,
        :lastModified,
        NOW(),
        NOW()
      )
      RETURNING id
    `, {
      replacements: {
        storeId: DEFAULT_STORE_ID,
        filePath: 'src/pages/Cart.jsx',
        baselineCode: content,
        codeHash: codeHash,
        fileSize: stat.size,
        lastModified: stat.mtime
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    if (result && result.length > 0 && result[0].id) {
      console.log('✅ Successfully added Cart.jsx baseline with ID:', result[0].id);
    } else {
      console.log('⚠️ Insert may have been skipped (conflict)');
    }
    
    // Verify it was added
    const verification = await sequelize.query(`
      SELECT id, file_path, file_size, LENGTH(baseline_code) as code_length
      FROM file_baselines 
      WHERE file_path = 'src/pages/Cart.jsx' AND store_id = :storeId
    `, {
      replacements: { storeId: DEFAULT_STORE_ID },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('🔍 Verification:');
    verification.forEach(record => {
      console.log('  - Found baseline ID:', record.id, 'size:', record.file_size, 'code length:', record.code_length);
    });
    
    await sequelize.close();
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error adding Cart baseline:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

addCartBaseline();