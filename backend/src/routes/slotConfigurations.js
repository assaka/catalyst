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
    
    // Use upsert to get or create draft
    const draft = await SlotConfiguration.upsertDraft(userId, storeId, pageType);
    
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

// Public endpoint to get active slot configurations for storefront (matches old API)
router.get('/public/slot-configurations', async (req, res) => {
  try {
    const { store_id, page_type = 'cart' } = req.query;
    
    if (!store_id) {
      return res.status(400).json({ success: false, error: 'store_id is required' });
    }
    
    // First try to find published version
    let configuration = await SlotConfiguration.findLatestPublished(store_id, page_type);
    
    // If no published version, try to find draft
    if (!configuration) {
      configuration = await SlotConfiguration.findOne({
        where: {
          store_id,
          status: 'draft',
          page_type
        },
        order: [['version_number', 'DESC']]
      });
    }
    
    if (!configuration) {
      // Return default configuration if nothing exists
      return res.json({
        success: true,
        data: [{
          id: null,
          store_id,
          configuration: {
            slots: {},
            metadata: {
              created: new Date().toISOString(),
              lastModified: new Date().toISOString()
            }
          },
          is_active: true
        }]
      });
    }
    
    res.json({ success: true, data: [configuration] });
  } catch (error) {
    console.error('Error fetching public slot configurations:', error);
    res.status(500).json({ success: false, error: error.message });
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

// Get acceptance configuration for preview (used by preview environment)
router.get('/acceptance/:storeId/:pageType?', async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    
    const acceptance = await SlotConfiguration.findLatestAcceptance(storeId, pageType);
    
    if (!acceptance) {
      // Fall back to published configuration if no acceptance version exists
      const published = await SlotConfiguration.findLatestPublished(storeId, pageType);
      
      if (!published) {
        // Return default configuration if neither acceptance nor published exists
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
      
      return res.json({
        success: true,
        data: published
      });
    }
    
    res.json({
      success: true,
      data: acceptance
    });
  } catch (error) {
    console.error('Error getting acceptance configuration:', error);
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

// Publish a draft to acceptance (preview environment)
router.post('/publish-to-acceptance/:configId', authMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    const userId = req.user.id;
    
    const acceptance = await SlotConfiguration.publishToAcceptance(configId, userId);
    
    res.json({
      success: true,
      data: acceptance,
      message: 'Configuration published to acceptance successfully'
    });
  } catch (error) {
    console.error('Error publishing to acceptance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Publish acceptance to production
router.post('/publish-to-production/:configId', authMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    const userId = req.user.id;
    
    const published = await SlotConfiguration.publishToProduction(configId, userId);
    
    res.json({
      success: true,
      data: published,
      message: 'Configuration published to production successfully'
    });
  } catch (error) {
    console.error('Error publishing to production:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Publish a draft directly to production (legacy method for backward compatibility)
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

// Set current editing configuration
router.post('/set-current-edit/:configId', authMiddleware, async (req, res) => {
  try {
    const { configId } = req.params;
    const { storeId, pageType = 'cart' } = req.body;
    const userId = req.user.id;
    
    const config = await SlotConfiguration.setCurrentEdit(configId, userId, storeId, pageType);
    
    res.json({
      success: true,
      data: config,
      message: 'Current edit configuration set successfully'
    });
  } catch (error) {
    console.error('Error setting current edit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current editing configuration
router.get('/current-edit/:storeId/:pageType?', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    const userId = req.user.id;
    
    const config = await SlotConfiguration.getCurrentEdit(userId, storeId, pageType);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting current edit:', error);
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