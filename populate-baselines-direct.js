const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Use the DATABASE_URL directly
const DATABASE_URL = "postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres";

console.log('🔗 Connecting to Supabase database...');

let pg;
try {
  pg = require('pg');
} catch (error) {
  console.log('❌ PostgreSQL client not installed. Installing...');
  console.log('Run: npm install pg');
  process.exit(1);
}

function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.jsx': 'jsx',
    '.js': 'js', 
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.json': 'json'
  };
  return typeMap[ext] || 'text';
}

function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

(async () => {
  let client;
  
  try {
    console.log('📁 Populating file_baselines with new files...');
    
    client = new pg.Client({
      connectionString: DATABASE_URL,
    });
    
    await client.connect();
    console.log('✅ Connected to Supabase database');
    
    // Create table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS file_baselines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_path TEXT UNIQUE NOT NULL,
        baseline_code TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        version TEXT DEFAULT 'latest',
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        last_modified TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_file_baselines_path ON file_baselines(file_path);
      CREATE INDEX IF NOT EXISTS idx_file_baselines_version ON file_baselines(version);
    `;
    
    await client.query(createTableQuery);
    console.log('✅ file_baselines table ready');
    
    // Add the iframe-test.html file specifically
    const iframeTestPath = 'iframe-test.html';
    const fullPath = path.resolve(iframeTestPath);
    
    if (fs.existsSync(fullPath)) {
      console.log('📄 Adding iframe-test.html to baselines...');
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const stat = fs.statSync(fullPath);
      const codeHash = generateHash(content);
      const fileType = getFileType(iframeTestPath);
      
      const result = await client.query(`
        INSERT INTO file_baselines (
          file_path, 
          baseline_code, 
          code_hash, 
          version,
          file_type,
          file_size,
          last_modified
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (file_path) DO UPDATE SET
          baseline_code = EXCLUDED.baseline_code,
          code_hash = EXCLUDED.code_hash,
          file_size = EXCLUDED.file_size,
          last_modified = EXCLUDED.last_modified,
          updated_at = NOW()
        RETURNING id
      `, [
        iframeTestPath,
        content,
        codeHash,
        'latest',
        fileType,
        stat.size,
        stat.mtime
      ]);
      
      console.log('✅ iframe-test.html added to baselines');
    } else {
      console.log('❌ iframe-test.html not found');
    }
    
    // Verify final count
    const countResult = await client.query('SELECT COUNT(*) as count FROM file_baselines');
    console.log(`📊 Total records in file_baselines: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
})();