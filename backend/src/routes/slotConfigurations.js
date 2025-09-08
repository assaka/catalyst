const express = require('express');
const router = express.Router();
const SlotConfiguration = require('../models/SlotConfiguration');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get or create draft configuration for editing
router.get('/draft/:storeId/:pageType?', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    const userId = req.user.id;
    
    // Get or create draft
    let draft = await SlotConfiguration.findLatestDraft(userId, storeId, pageType);
    
    if (!draft) {
      draft = await SlotConfiguration.createDraft(userId, storeId, pageType);
    }
    
    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Error getting/creating draft:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get published configuration for display (used by storefront)
router.get('/published/:storeId/:pageType?', async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    
    const published = await SlotConfiguration.findLatestPublished(storeId, pageType);
    
    if (!published) {
      // Return default configuration if no published version exists
      return res.json({
        success: true,
        data: {
          configuration: {
            slots: {},
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString()
            }
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: published
    });
  } catch (error) {
    console.error('Error getting published configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update draft configuration
router.put('/draft/:configId', authMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    const { configuration } = req.body;
    
    const draft = await SlotConfiguration.findByPk(configId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    if (draft.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only update draft configurations'
      });
    }
    
    if (draft.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to edit this draft'
      });
    }
    
    draft.configuration = configuration;
    draft.updated_at = new Date();
    await draft.save();
    
    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Publish a draft
router.post('/publish/:configId', authMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    const userId = req.user.id;
    
    const published = await SlotConfiguration.publishDraft(configId, userId);
    
    res.json({
      success: true,
      data: published,
      message: 'Configuration published successfully'
    });
  } catch (error) {
    console.error('Error publishing draft:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get version history
router.get('/history/:storeId/:pageType?', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    const { limit = 20 } = req.query;
    
    const history = await SlotConfiguration.getVersionHistory(
      storeId, 
      pageType, 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting version history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Revert to a specific version
router.post('/revert/:versionId', authMiddleware, async (req, res) => {
  try {
    const { versionId } = req.params;
    const userId = req.user.id;
    
    // Get the version to revert to
    const targetVersion = await SlotConfiguration.findByPk(versionId);
    
    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        error: 'Version not found'
      });
    }
    
    const newVersion = await SlotConfiguration.revertToVersion(
      versionId, 
      userId, 
      targetVersion.store_id
    );
    
    res.json({
      success: true,
      data: newVersion,
      message: 'Successfully reverted to selected version'
    });
  } catch (error) {
    console.error('Error reverting version:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a draft
router.delete('/draft/:configId', authMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    
    const draft = await SlotConfiguration.findByPk(configId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    if (draft.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Can only delete draft configurations'
      });
    }
    
    if (draft.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this draft'
      });
    }
    
    await draft.destroy();
    
    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;