const express = require('express');
const router = express.Router();
const { sequelize } = require('../database/connection');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');

// File baselines are global - no store_id needed

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
  
  try {
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
  } catch (error) {
    console.error('Error walking directory:', dir, error.message);
  }
  
  return fileList;
}

// API endpoint to populate file baselines (requires admin authentication)
router.post('/populate', authMiddleware, async (req, res) => {
  try {
    console.log('📁 Starting file baselines population via API...');
    
    // Check if user has admin privileges
    if (req.user.role !== 'store_owner' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }
    
    // Get all source files from the project (assuming we're running on Render)
    const projectRoot = path.resolve(__dirname, '../../..');
    console.log('🔍 Scanning project directory:', projectRoot);
    
    const srcPath = path.join(projectRoot, 'src');
    console.log('🔍 Source path:', srcPath);
    
    if (!fs.existsSync(srcPath)) {
      return res.status(404).json({
        success: false,
        error: 'Source directory not found. This endpoint must run on the server.'
      });
    }
    
    const files = await walkDirectory(srcPath, [], projectRoot);
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
        
        // Use INSERT with ON CONFLICT DO NOTHING to prevent duplicates
        const [result] = await sequelize.query(`
          INSERT INTO file_baselines (
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
            :filePath,
            :baselineCode,
            :codeHash,
            'latest',
            :fileType,
            :fileSize,
            :lastModified,
            NOW(),
            NOW()
          )
          ON CONFLICT (file_path, version) DO NOTHING
          RETURNING id
        `, {
          replacements: {
            filePath: file.relativePath,
            baselineCode: content,
            codeHash: codeHash,
            fileType: fileType,
            fileSize: stat.size,
            lastModified: stat.mtime
          },
          type: sequelize.QueryTypes.INSERT
        });
        
        if (result && result.length > 0 && result[0].id) {
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
        
        // If it's a table doesn't exist error, return immediately
        if (fileError.message.includes('file_baselines')) {
          return res.status(500).json({
            success: false,
            error: 'file_baselines table not found. Please run database migrations first.',
            details: fileError.message
          });
        }
      }
    }
    
    console.log('✅ File population completed!');
    const summary = {
      filesScanned: files.length,
      filesInserted: inserted,
      filesSkipped: skipped,
      errors: errors
    };
    console.log('📊 Summary:', summary);
    
    // Verify final count
    try {
      const [count] = await sequelize.query('SELECT COUNT(*) as count FROM file_baselines', {
        type: sequelize.QueryTypes.SELECT
      });
      summary.totalRecordsInDb = count[0].count;
      console.log(`📊 Total records in file_baselines: ${count[0].count}`);
    } catch (countError) {
      console.error('Error counting records:', countError.message);
    }
    
    res.json({
      success: true,
      message: 'File baselines population completed',
      summary
    });
    
  } catch (error) {
    console.error('❌ Error populating file baselines:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API endpoint to check baselines status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const [count] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(DISTINCT store_id) as stores_count,
        MIN(created_at) as oldest_baseline,
        MAX(updated_at) as newest_baseline
      FROM file_baselines
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const [fileTypes] = await sequelize.query(`
      SELECT file_type, COUNT(*) as file_count 
      FROM file_baselines 
      GROUP BY file_type 
      ORDER BY file_count DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        overview: count[0],
        byFileType: fileTypes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;