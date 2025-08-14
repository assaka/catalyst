const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const EditorCustomization = require('../models/EditorCustomization');

const router = express.Router();

// @route   GET /api/editor-customizations
// @desc    Get editor customizations for current user and store
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    
    const customization = await EditorCustomization.findByUser(userId, storeId);
    
    res.json({
      success: true,
      data: customization
    });
  } catch (error) {
    console.error('Get editor customizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/editor-customizations/layout
// @desc    Update layout preferences
// @access  Private
router.put('/layout', authMiddleware, [
  body('preferences').isObject().withMessage('Preferences must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { preferences } = req.body;
    
    const customization = await EditorCustomization.findByUser(userId, storeId);
    
    const updatedLayout = {
      ...customization.layout_preferences,
      ...preferences
    };
    
    await customization.update({ layout_preferences: updatedLayout });
    
    res.json({
      success: true,
      data: customization,
      message: 'Layout preferences updated'
    });
  } catch (error) {
    console.error('Update layout preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/editor-customizations/expanded-folders
// @desc    Update expanded folders state
// @access  Private
router.put('/expanded-folders', authMiddleware, [
  body('expanded_folders').isObject().withMessage('Expanded folders must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { expanded_folders } = req.body;
    
    const customization = await EditorCustomization.findByUser(userId, storeId);
    await customization.updateExpandedFolders(expanded_folders);
    
    res.json({
      success: true,
      data: customization,
      message: 'Expanded folders updated'
    });
  } catch (error) {
    console.error('Update expanded folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/editor-customizations/recent-files
// @desc    Add file to recent files list
// @access  Private
router.post('/recent-files', authMiddleware, [
  body('file_path').notEmpty().withMessage('File path is required'),
  body('file_name').notEmpty().withMessage('File name is required'),
  body('file_type').notEmpty().withMessage('File type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { file_path, file_name, file_type } = req.body;
    
    const customization = await EditorCustomization.findByUser(userId, storeId);
    await customization.addRecentFile(file_path, file_name, file_type);
    
    res.json({
      success: true,
      data: customization,
      message: 'Recent file added'
    });
  } catch (error) {
    console.error('Add recent file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/editor-customizations/recent-files
// @desc    Get recent files for user
// @access  Private
router.get('/recent-files', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const limit = parseInt(req.query.limit) || 10;
    
    const recentFiles = await EditorCustomization.getRecentFiles(userId, storeId, limit);
    
    res.json({
      success: true,
      data: recentFiles
    });
  } catch (error) {
    console.error('Get recent files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/editor-customizations/file-content
// @desc    Save file content and customization
// @access  Private
router.put('/file-content', authMiddleware, [
  body('file_path').notEmpty().withMessage('File path is required'),
  body('content').isString().withMessage('Content must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { file_path, content, metadata = {} } = req.body;
    
    const customization = await EditorCustomization.saveFileContent(
      userId, 
      storeId, 
      file_path, 
      content, 
      metadata
    );
    
    res.json({
      success: true,
      data: customization,
      message: 'File content saved'
    });
  } catch (error) {
    console.error('Save file content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/editor-customizations/file-content
// @desc    Get saved file content
// @access  Private
router.get('/file-content', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { file_path } = req.query;
    
    if (!file_path) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    const content = await EditorCustomization.getFileContent(userId, storeId, file_path);
    
    res.json({
      success: true,
      data: {
        file_path,
        content,
        has_customization: !!content
      }
    });
  } catch (error) {
    console.error('Get file content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/editor-customizations/settings
// @desc    Update general editor settings
// @access  Private
router.put('/settings', authMiddleware, [
  body('settings').isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { settings } = req.body;
    
    const customization = await EditorCustomization.updateSettings(userId, storeId, settings);
    
    res.json({
      success: true,
      data: customization,
      message: 'Editor settings updated'
    });
  } catch (error) {
    console.error('Update editor settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/editor-customizations/file-content
// @desc    Delete saved file customization
// @access  Private
router.delete('/file-content', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    const { file_path } = req.query;
    
    if (!file_path) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }
    
    const customization = await EditorCustomization.findByUser(userId, storeId);
    
    const updatedCustomizations = { ...customization.file_customizations };
    delete updatedCustomizations[file_path];
    
    await customization.update({ file_customizations: updatedCustomizations });
    
    res.json({
      success: true,
      message: 'File customization deleted'
    });
  } catch (error) {
    console.error('Delete file customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/editor-customizations/reset
// @desc    Reset all customizations to defaults
// @access  Private
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const storeId = req.query.store_id || req.user.store_id;
    
    const customization = await EditorCustomization.findByUser(userId, storeId);
    
    await customization.update({
      settings: {},
      file_customizations: {},
      layout_preferences: {
        file_tree_open: true,
        chat_open: true,
        file_tree_width: 256,
        chat_width: 320,
        editor_theme: 'dark',
        font_size: 14,
        word_wrap: true
      },
      recent_files: [],
      preferences: {
        auto_save: true,
        auto_save_delay: 3000,
        show_line_numbers: true,
        highlight_active_line: true,
        expanded_folders: {}
      }
    });
    
    res.json({
      success: true,
      data: customization,
      message: 'Customizations reset to defaults'
    });
  } catch (error) {
    console.error('Reset customizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;