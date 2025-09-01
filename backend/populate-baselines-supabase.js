const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Use environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

console.log('🔗 Supabase Connection Info:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'Not provided'}`);
console.log(`   DB URL: ${databaseUrl ? databaseUrl.substring(0, 50) + '...' : 'Not provided'}`);

if (!supabaseUrl.includes('supabase.co') || !supabaseKey || supabaseKey.includes('your-')) {
  console.log('\n⚠️  Supabase credentials not properly configured.');
  console.log('Please update your backend/.env file with actual Supabase credentials.');
  console.log('\nTo get your credentials:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the URL and service_role key');
  console.log('5. Go to Settings > Database');
  console.log('6. Copy the Connection string (use "nodejs" tab)');
  console.log('\nAlternatively, run the SQL script manually in Supabase SQL editor:');
  console.log('   backend/create-and-populate-file-baselines.sql');
  process.exit(1);
}

// Try to use pg directly for database operations
let pg;
try {
  pg = require('pg');
} catch (error) {
  console.log('❌ PostgreSQL client not installed. Installing...');
  console.log('Run: npm install pg');
  process.exit(1);
}

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
  let client;
  
  try {
    console.log('📁 Populating file_baselines table with source code files via Supabase...');
    
    // Connect to PostgreSQL
    client = new pg.Client({
      connectionString: databaseUrl,
    });
    
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL database');
    
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
          ON CONFLICT (file_path) DO NOTHING
          RETURNING id
        `, [
          file.relativePath,
          content,
          codeHash,
          'latest',
          fileType,
          stat.size,
          stat.mtime
        ]);
        
        if (result.rows && result.rows.length > 0) {
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
    const countResult = await client.query('SELECT COUNT(*) as count FROM file_baselines');
    console.log(`  - Total records in file_baselines: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error populating file baselines:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      console.log('\n💡 This looks like a connection issue. Please check:');
      console.log('1. Your SUPABASE_DB_URL is correct');
      console.log('2. Your internet connection is stable');  
      console.log('3. Supabase project is active and accessible');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
})();