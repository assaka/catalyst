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
    // Try multiple possible base paths for different deployment scenarios
    const possiblePaths = [
      path.resolve(__dirname, '../../../', filePath), // Local development
      path.resolve(__dirname, '../../../../', filePath), // Render with backend subdirectory
      path.resolve(process.cwd(), filePath), // Process working directory
      path.resolve('/', 'opt/render/project/repo', filePath) // Render default structure
    ];
    
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

    // Security: Only allow reading files from src directory
    if (!filePath.startsWith('src/')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only src/ directory files are allowed'
      });
    }

    let result;
    let source;
    
    try {
      // Strategy 1: Try GitHub first (most reliable for Render deployment)
      console.log(`Attempting to fetch ${filePath} from GitHub...`);
      result = await fetchFromGitHub(filePath);
      source = 'github';
    } catch (githubError) {
      console.log(`GitHub fetch failed: ${githubError.message}`);
      
      try {
        // Strategy 2: Fallback to local filesystem
        console.log(`Attempting to read ${filePath} from local filesystem...`);
        result = readLocalFile(filePath);
        source = 'local';
      } catch (localError) {
        console.log(`Local read failed: ${localError.message}`);
        
        return res.status(404).json({
          success: false,
          message: 'File not found',
          details: {
            filePath,
            githubError: githubError.message,
            localError: localError.message,
            attempted: ['github', 'local']
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

// Helper function to recursively fetch all files from GitHub
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
    const { path: dirPath = 'src' } = req.query;
    
    // Security: Only allow listing files from src directory
    if (!dirPath.startsWith('src')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only src/ directory listing is allowed'
      });
    }

    // For listing, we'll use recursive GitHub API to get ALL files
    try {
      console.log(`🔍 Fetching recursive file listing for ${dirPath}...`);
      const files = await fetchAllFilesRecursively(dirPath);
      console.log(`📁 GitHub API returned ${files.length} files for ${dirPath}`);
      
      // Log some sample files if we got results
      if (files.length > 0) {
        console.log(`📋 Sample files: ${files.slice(0, 3).map(f => f.path).join(', ')}`);
      } else {
        console.log(`⚠️ No files returned from GitHub API for ${dirPath}`);
      }
      
      res.json({
        success: true,
        files: files,
        path: dirPath,
        source: 'github-api-recursive',
        totalFiles: files.length
      });
    } catch (githubError) {
      // Fallback to local filesystem for directory listing
      try {
        const possiblePaths = [
          path.resolve(__dirname, '../../../', dirPath),
          path.resolve(__dirname, '../../../../', dirPath),
          path.resolve(process.cwd(), dirPath),
          path.resolve('/', 'opt/render/project/repo', dirPath)
        ];
        
        let fullPath;
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            fullPath = testPath;
            break;
          }
        }
        
        if (!fullPath) {
          throw new Error('Directory not found in any local path');
        }
        
        const items = fs.readdirSync(fullPath, { withFileTypes: true });
        
        const files = items.map(item => ({
          name: item.name,
          type: item.isDirectory() ? 'folder' : 'file',
          path: path.join(dirPath, item.name).replace(/\\/g, '/'),
          extension: item.isFile() ? path.extname(item.name) : null
        }));
        
        res.json({
          success: true,
          files: files,
          path: dirPath,
          source: 'local'
        });
      } catch (localError) {
        return res.status(404).json({
          success: false,
          message: 'Directory not found',
          details: {
            dirPath,
            githubError: githubError.message,
            localError: localError.message,
            attempted: ['github-api', 'local']
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