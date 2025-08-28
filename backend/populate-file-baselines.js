const { sequelize } = require('./src/database/connection');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default store ID (the one from your logs)
const DEFAULT_STORE_ID = '157d4590-49bf-4b0b-bd77-abe131909528';

function getFileExtension(filePath) {
  return path.extname(filePath).slice(1);
}

function getFileType(filePath) {
  const ext = getFileExtension(filePath);
  const typeMap = {
    'jsx': 'jsx',
    'js': 'js', 
    'ts': 'ts',
    'tsx': 'tsx',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'md',
    'html': 'html',
    'sql': 'sql'
  };
  return typeMap[ext] || 'text';
}

function generateCodeHash(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function walkDirectory(dir, fileList = [], baseDir = null) {
  if (!baseDir) baseDir = dir;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, dist, build directories
      if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(file)) {
        await walkDirectory(filePath, fileList, baseDir);
      }
    } else {
      // Only include source code files
      const ext = getFileExtension(file);
      if (['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'json', 'md', 'html', 'sql'].includes(ext)) {
        const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
        fileList.push({
          absolutePath: filePath,
          relativePath: relativePath
        });
      }
    }
  }
  
  return fileList;
}

(async () => {
  try {
    console.log('📁 Populating file_baselines table with source code files...');
    
    // Get all source files from the project
    const projectRoot = path.resolve(__dirname, '..');
    console.log('🔍 Scanning project directory:', projectRoot);
    
    const files = await walkDirectory(path.join(projectRoot, 'src'), [], projectRoot);
    console.log('📊 Found', files.length, 'source files');
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        const stat = fs.statSync(file.absolutePath);
        const codeHash = generateCodeHash(content);
        const fileType = getFileType(file.relativePath);
        
        // Use ON CONFLICT DO NOTHING to prevent duplicates
        const result = await sequelize.query(`
          INSERT INTO file_baselines (
            store_id, 
            file_path, 
            baseline_code, 
            code_hash, 
            version,
            file_type,
            file_size,
            last_modified
          ) 
          VALUES (
            :storeId,
            :filePath,
            :baselineCode,
            :codeHash,
            'latest',
            :fileType,
            :fileSize,
            :lastModified
          )
          ON CONFLICT (store_id, file_path, version) DO NOTHING
          RETURNING id
        `, {
          replacements: {
            storeId: DEFAULT_STORE_ID,
            filePath: file.relativePath,
            baselineCode: content,
            codeHash: codeHash,
            fileType: fileType,
            fileSize: stat.size,
            lastModified: stat.mtime
          },
          type: sequelize.QueryTypes.INSERT
        });
        
        if (result && result.length > 0) {
          inserted++;
          if (inserted % 50 === 0) {
            console.log(`📝 Inserted ${inserted} files...`);
          }
        } else {
          skipped++;
        }
        
      } catch (fileError) {
        console.error(`❌ Error processing ${file.relativePath}:`, fileError.message);
        errors++;
      }
    }
    
    console.log('\n✅ File population completed!');
    console.log(`📊 Summary:`);
    console.log(`  - Files scanned: ${files.length}`);
    console.log(`  - Files inserted: ${inserted}`);  
    console.log(`  - Files skipped (duplicates): ${skipped}`);
    console.log(`  - Errors: ${errors}`);
    
    // Verify final count
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM file_baselines');
    console.log(`  - Total records in file_baselines: ${count[0].count}`);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error populating file baselines:', error.message);
    process.exit(1);
  }
})();