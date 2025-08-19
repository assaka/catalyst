const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

// GitHub raw file base URL for the repository
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/assaka/catalyst/main';

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
router.get('/content', auth, async (req, res) => {
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

// List files in a directory with fallback strategy
router.get('/list', auth, async (req, res) => {
  try {
    const { path: dirPath = 'src' } = req.query;
    
    // Security: Only allow listing files from src directory
    if (!dirPath.startsWith('src')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only src/ directory listing is allowed'
      });
    }

    // For listing, we'll use GitHub API to get directory contents
    const githubApiUrl = `https://api.github.com/repos/assaka/catalyst/contents/${dirPath}`;
    
    try {
      const response = await fetch(githubApiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Catalyst-AI-Context-Window'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform GitHub API response to match expected format
      const files = data.map(item => ({
        name: item.name,
        type: item.type === 'dir' ? 'folder' : 'file',
        path: item.path,
        extension: item.type === 'file' ? path.extname(item.name) : null
      }));
      
      res.json({
        success: true,
        files: files,
        path: dirPath,
        source: 'github-api'
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

module.exports = router;