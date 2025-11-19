const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get source file content
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
    // Support both local development and Render deployment structures
    let basePath = path.resolve(__dirname, '../../../'); // Local: backend/src/routes -> project root
    
    // On Render, if running from backend subdirectory, adjust path
    if (!fs.existsSync(path.join(basePath, 'src'))) {
      // Try parent directory (Render deployment case)
      basePath = path.resolve(__dirname, '../../../../');
    }
    
    const fullPath = path.resolve(basePath, filePath);
    
    // Check if the resolved path is within the project directory
    if (!fullPath.startsWith(basePath)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Path outside project directory'
      });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Read file content
    const content = fs.readFileSync(fullPath, 'utf8');
    
    res.json({
      success: true,
      content: content,
      path: filePath,
      size: content.length
    });
  } catch (error) {
    console.error('Error reading source file:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// List files in a directory (for file tree)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { path: dirPath = 'src' } = req.query;
    
    // Security: Only allow listing files from src directory
    // Support both local development and Render deployment structures
    let basePath = path.resolve(__dirname, '../../../'); // Local: backend/src/routes -> project root
    
    // On Render, if running from backend subdirectory, adjust path
    if (!fs.existsSync(path.join(basePath, 'src'))) {
      // Try parent directory (Render deployment case)
      basePath = path.resolve(__dirname, '../../../../');
    }
    
    const fullPath = path.resolve(basePath, dirPath);
    
    // Check if the resolved path is within the project directory
    if (!fullPath.startsWith(path.join(basePath, 'src'))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Path outside src directory'
      });
    }

    // Check if directory exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Directory not found'
      });
    }

    // Read directory content
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
      path: dirPath
    });
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;