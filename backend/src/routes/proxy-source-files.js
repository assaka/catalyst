const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

// GitHub raw file base URL for the repository
// Note: This always fetches from the 'main' branch, so it automatically
// stays in sync when files change in Git. The content is live from GitHub.
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/assaka/catalyst/main';
const GITHUB_REPO = 'assaka/catalyst';
const GITHUB_BRANCH = 'main';

// Helper function to fetch file from GitHub
async function fetchFromGitHub(filePath) {
  const url = `${GITHUB_RAW_BASE}/${filePath}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    return {
      success: true,
      content,
      source: 'github',
      url
    };
  } catch (error) {
    throw new Error(`Failed to fetch from GitHub: ${error.message}`);
  }
}

// Helper function to check local filesystem (fallback)
function readLocalFile(filePath) {
  try {
    let possiblePaths;
    
    // For files in 'src/', prioritize root-level src over backend/src
    if (filePath.startsWith('src/')) {
      possiblePaths = [
        path.resolve(__dirname, '../../../', filePath), // Local development - root level
        path.resolve(__dirname, '../../../../', filePath), // Render with backend subdirectory - root level
        path.resolve(process.cwd(), filePath), // Process working directory - root level
        path.resolve('/', 'opt/render/project/repo', filePath), // Render default structure - root level
        path.resolve(__dirname, '../../../backend/', filePath), // Backend src as fallback
        path.resolve(__dirname, '../../../../backend/', filePath) // Backend src fallback
      ];
    } else {
      // For other paths, use standard resolution
      possiblePaths = [
        path.resolve(__dirname, '../../../', filePath), // Local development
        path.resolve(__dirname, '../../../../', filePath), // Render with backend subdirectory
        path.resolve(process.cwd(), filePath), // Process working directory
        path.resolve('/', 'opt/render/project/repo', filePath) // Render default structure
      ];
    }
    
    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        return {
          success: true,
          content,
          source: 'local',
          path: fullPath
        };
      }
    }
    
    throw new Error('File not found in any local path');
  } catch (error) {
    throw new Error(`Local file read failed: ${error.message}`);
  }
}

// Get source file content with fallback strategy
router.get('/content', authMiddleware, async (req, res) => {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    // Security: Block access to sensitive directories and files
    const blockedPaths = ['node_modules', '.git', 'coverage', 'tmp', 'temp'];
    const isBlockedPath = blockedPaths.some(blocked => 
      filePath.includes(blocked) || filePath.startsWith(blocked)
    );
    
    if (isBlockedPath) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot access system or build directories'
      });
    }

    let result;
    let source;
    
    try {
      // Strategy 1: Try local filesystem first (most current)
      console.log(`Attempting to read ${filePath} from local filesystem...`);
      result = readLocalFile(filePath);
      source = 'local';
    } catch (localError) {
      console.log(`Local read failed: ${localError.message}`);
      
      try {
        // Strategy 2: Fallback to GitHub
        console.log(`Attempting to fetch ${filePath} from GitHub...`);
        result = await fetchFromGitHub(filePath);
        source = 'github';
      } catch (githubError) {
        console.log(`GitHub fetch failed: ${githubError.message}`);
        
        return res.status(404).json({
          success: false,
          message: 'File not found',
          details: {
            filePath,
            localError: localError.message,
            githubError: githubError.message,
            attempted: ['local', 'github']
          }
        });
      }
    }
    
    res.json({
      success: true,
      content: result.content,
      path: filePath,
      size: result.content.length,
      source: source,
      debug: {
        url: result.url,
        localPath: result.path
      }
    });
  } catch (error) {
    console.error('Error reading source file:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to recursively fetch all files from local filesystem
function fetchAllFilesLocallyRecursive(dirPath = '.') {
  const allFiles = [];
  
  function scanDirectory(currentPath, relativePath = '') {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        const relativeItemPath = relativePath ? `${relativePath}/${item.name}` : item.name;
        
        // Skip common directories that shouldn't be included
        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'tmp', 'temp'];
        if (item.isDirectory() && skipDirs.includes(item.name)) {
          continue;
        }
        
        // Skip hidden files and directories (starting with .)
        if (item.name.startsWith('.') && item.name !== '.env') {
          continue;
        }
        
        if (item.isFile()) {
          // Add file to our list
          allFiles.push({
            name: item.name,
            type: 'file',
            path: relativeItemPath,
            extension: path.extname(item.name),
            size: fs.statSync(itemPath).size
          });
        } else if (item.isDirectory()) {
          // Recursively scan subdirectory
          scanDirectory(itemPath, relativeItemPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error scanning directory ${currentPath}:`, error.message);
    }
  }
  
  // For the 'src' path, we want to prioritize the root-level src directory over backend/src
  let basePath;
  
  if (dirPath === 'src') {
    // Special handling for 'src' - look for root-level src first
    console.log(`📂 Special handling for 'src' directory requested...`);
    console.log(`📍 Current __dirname: ${__dirname}`);
    console.log(`📍 Current process.cwd(): ${process.cwd()}`);
    
    const rootSrcPaths = [
      path.resolve(__dirname, '../../../src'), // Local development - root level src
      path.resolve(__dirname, '../../../../src'), // Render with backend subdirectory - root level src  
      path.resolve(process.cwd(), 'src'), // Process working directory - root level src
      path.resolve('/', 'opt/render/project/repo/src'), // Render default structure - root level src
      path.resolve(__dirname, '../../../frontend/src'), // Alternative frontend structure
      path.resolve(__dirname, '../../../../frontend/src'), // Alternative frontend structure with backend subdir
    ];
    
    for (const testPath of rootSrcPaths) {
      console.log(`🔍 Testing root src path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        basePath = testPath;
        console.log(`✅ Found root-level src directory: ${basePath}`);
        break;
      } else {
        console.log(`❌ Path does not exist: ${testPath}`);
      }
    }
  }
  
  // If not found or not 'src' path, use the general resolution
  if (!basePath) {
    let possiblePaths;
    
    if (dirPath === 'src') {
      // Even in fallback, still prioritize root-level src over backend/src
      possiblePaths = [
        path.resolve(__dirname, '../../../', dirPath), // Local development - should find root src
        path.resolve(__dirname, '../../../../', dirPath), // Render with backend subdirectory - should find root src
        path.resolve(process.cwd(), dirPath), // Process working directory - should find root src
        path.resolve('/', 'opt/render/project/repo', dirPath), // Render default structure - should find root src
        // Only include backend/src as absolute last resort
        path.resolve(__dirname, '../', dirPath), // backend/src as final fallback
        path.resolve(__dirname, '../../', dirPath) // Another backend/src fallback
      ];
      console.log(`📂 Fallback: searching for src directory in prioritized paths...`);
    } else {
      // For other paths, use standard resolution
      possiblePaths = [
        path.resolve(__dirname, '../../../', dirPath), // Local development
        path.resolve(__dirname, '../../../../', dirPath), // Render with backend subdirectory
        path.resolve(process.cwd(), dirPath), // Process working directory
        path.resolve('/', 'opt/render/project/repo', dirPath) // Render default structure
      ];
    }
    
    for (const testPath of possiblePaths) {
      console.log(`🔍 Testing path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        basePath = testPath;
        console.log(`✅ Found directory at: ${basePath}`);
        break;
      }
    }
  }
  
  if (!basePath) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  console.log(`📂 Scanning local filesystem from: ${basePath}`);
  scanDirectory(basePath, '');
  
  return allFiles;
}

// Helper function to recursively fetch all files from GitHub (fallback)
async function fetchAllFilesRecursively(dirPath = 'src') {
  const allFiles = [];
  
  async function fetchDirectory(currentPath) {
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${currentPath}?ref=${GITHUB_BRANCH}`;
    
    try {
      console.log(`🌐 Fetching GitHub API: ${githubApiUrl}`);
      const response = await fetch(githubApiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Catalyst-AI-Context-Window'
        }
      });
      
      if (!response.ok) {
        console.log(`❌ GitHub API failed for ${currentPath}: ${response.status} ${response.statusText}`);
        // Log rate limit info if available
        const rateLimit = response.headers.get('x-ratelimit-remaining');
        if (rateLimit !== null) {
          console.log(`📊 GitHub API rate limit remaining: ${rateLimit}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log(`📂 GitHub API returned ${data.length} items for ${currentPath}`);
      
      for (const item of data) {
        if (item.type === 'file') {
          // Add file to our list
          allFiles.push({
            name: item.name,
            type: 'file',
            path: item.path,
            extension: path.extname(item.name)
          });
        } else if (item.type === 'dir') {
          // Recursively fetch subdirectory
          await fetchDirectory(item.path);
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching directory ${currentPath}:`, error.message);
      console.error(`🔍 Error details:`, {
        name: error.name,
        cause: error.cause,
        stack: error.stack?.split('\n')[0] // Just first line of stack
      });
    }
  }
  
  await fetchDirectory(dirPath);
  return allFiles;
}

// List files in a directory with fallback strategy
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { path: dirPath = '.' } = req.query;
    
    // Security: Block access to sensitive directories, but allow broader access than just src/
    const blockedPaths = ['node_modules', '.git', 'coverage', 'tmp', 'temp'];
    const isBlockedPath = blockedPaths.some(blocked => 
      dirPath.includes(blocked) || dirPath.startsWith(blocked)
    );
    
    if (isBlockedPath) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot access system or build directories'
      });
    }

    // Strategy 1: Try local filesystem first (most current and complete)
    try {
      console.log(`🔍 Fetching recursive file listing for ${dirPath} from local filesystem...`);
      const files = await fetchAllFilesLocallyRecursive(dirPath);
      console.log(`📁 Local filesystem returned ${files.length} files for ${dirPath}`);
      
      // Log some sample files if we got results
      if (files.length > 0) {
        console.log(`📋 Sample files: ${files.slice(0, 3).map(f => f.path).join(', ')}`);
      } else {
        console.log(`⚠️ No files returned from local filesystem for ${dirPath}`);
      }
      
      res.json({
        success: true,
        files: files,
        path: dirPath,
        source: 'local-filesystem-recursive',
        totalFiles: files.length
      });
    } catch (localError) {
      console.log(`Local filesystem failed: ${localError.message}`);
      
      // Strategy 2: Fallback to GitHub API for recursive listing
      try {
        console.log(`🌐 Falling back to GitHub API for ${dirPath}...`);
        const files = await fetchAllFilesRecursively(dirPath);
        console.log(`📁 GitHub API returned ${files.length} files for ${dirPath}`);
        
        res.json({
          success: true,
          files: files,
          path: dirPath,
          source: 'github-api-recursive',
          totalFiles: files.length
        });
      } catch (githubError) {
        return res.status(404).json({
          success: false,
          message: 'Directory not found',
          details: {
            dirPath,
            localError: localError.message,
            githubError: githubError.message,
            attempted: ['local-filesystem', 'github-api']
          }
        });
      }
    }
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test endpoint to verify GitHub API functionality
router.get('/test-github', async (req, res) => {
  try {
    console.log('🧪 Testing GitHub API direct access...');
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/src?ref=${GITHUB_BRANCH}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Catalyst-GitHub-Test'
      }
    });
    
    const data = await response.json();
    
    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      rateLimit: response.headers.get('x-ratelimit-remaining'),
      itemCount: Array.isArray(data) ? data.length : 0,
      data: Array.isArray(data) ? data.slice(0, 5) : data // First 5 items for preview
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;