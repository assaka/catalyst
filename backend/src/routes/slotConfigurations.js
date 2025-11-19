const express = require('express');
const router = express.Router();
const SlotConfiguration = require('../models/SlotConfiguration');
const { authMiddleware } = require('../middleware/authMiddleware');
const ABTest = require('../models/ABTest');
const ABTestAssignment = require('../models/ABTestAssignment');
const ABTestService = require('../services/ABTestService');

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

// POST endpoint to create/get draft with static configuration
router.post('/draft/:storeId/:pageType?', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    const { staticConfiguration } = req.body;
    const userId = req.user.id;

    // Use upsert to get or create draft with static configuration
    const draft = await SlotConfiguration.upsertDraft(userId, storeId, pageType, staticConfiguration);

    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Error getting/creating draft with static config:', error);
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
      // Create a new draft configuration with default content
      console.log('No configuration found, creating default draft for store:', store_id);
      
      try {
        // Get the first user to assign the configuration to
        const firstUser = await SlotConfiguration.sequelize.query(
          'SELECT id FROM users LIMIT 1',
          { type: SlotConfiguration.sequelize.QueryTypes.SELECT }
        );
        
        if (firstUser.length === 0) {
          return res.status(500).json({ success: false, error: 'No users found in database' });
        }
        
        const userId = firstUser[0].id;
        
        // Create draft using the upsert method
        configuration = await SlotConfiguration.upsertDraft(userId, store_id, page_type);
        console.log('Created default draft configuration:', configuration.id);
        
      } catch (error) {
        console.error('Error creating default draft configuration:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
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

    console.log('[Slot Config API] Fetching published config:', { storeId, pageType });

    const published = await SlotConfiguration.findLatestPublished(storeId, pageType);

    if (!published) {
      console.log('[Slot Config API] No published config found, returning empty');
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

    console.log('[Slot Config API] Found published config, checking for A/B tests...');

    // Check for active A/B tests for this page
    const activeTests = await ABTest.findActiveForPage(storeId, pageType);

    console.log('[Slot Config API] Active A/B tests:', activeTests.length);

    if (activeTests.length === 0) {
      console.log('[Slot Config API] No A/B tests, returning original config');
      return res.json({
        success: true,
        data: published
      });
    }

    // Get session ID from header or generate one
    const sessionId = req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[Slot Config API] Session ID:', sessionId);

    // Clone the configuration to avoid mutations
    const configWithTests = JSON.parse(JSON.stringify(published.toJSON()));

    // Apply A/B test overrides
    for (const test of activeTests) {
      console.log(`[Slot Config API] Processing test: ${test.name}`);

      try {
        // Get variant assignment for this session
        const assignment = await ABTestService.getVariantAssignment(test.id, sessionId, {
          storeId,
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'
        });

        console.log(`[Slot Config API] Variant assigned:`, {
          test: test.name,
          variant: assignment.variant_name,
          excluded: assignment.excluded
        });

        if (assignment.excluded) {
          console.log(`[Slot Config API] User excluded from test "${test.name}"`);
          continue;
        }

        // Get the variant configuration
        const variant = test.variants.find(v => v.id === assignment.variant_id);

        if (!variant || !variant.config || !variant.config.slot_overrides) {
          console.log(`[Slot Config API] No slot overrides in variant`);
          continue;
        }

        const slotOverrides = variant.config.slot_overrides;
        console.log(`[Slot Config API] Applying slot overrides:`, Object.keys(slotOverrides));

        // Apply each override
        Object.entries(slotOverrides).forEach(([slotId, override]) => {
          if (configWithTests.configuration.slots[slotId]) {
            // Merge override with existing slot
            const before = configWithTests.configuration.slots[slotId].content;
            configWithTests.configuration.slots[slotId] = {
              ...configWithTests.configuration.slots[slotId],
              ...override
            };
            console.log(`[Slot Config API] ✅ Overrode slot "${slotId}": "${before}" → "${override.content}"`);
          } else if (override.enabled !== false) {
            // Create new slot
            configWithTests.configuration.slots[slotId] = override;
            console.log(`[Slot Config API] ➕ Created new slot "${slotId}"`);
          }
        });

      } catch (error) {
        console.error(`[Slot Config API] Error processing test "${test.name}":`, error);
        // Continue with other tests
      }
    }

    console.log('[Slot Config API] ✅ Returning config with A/B test overrides applied');

    res.json({
      success: true,
      data: configWithTests
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
    const { configuration, isReset = false } = req.body;

    const draft = await SlotConfiguration.findByPk(configId);

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    if (!['init', 'draft'].includes(draft.status)) {
      return res.status(400).json({
        success: false,
        error: 'Can only update draft or init configurations'
      });
    }

    if (draft.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to edit this draft'
      });
    }

    // Handle init->draft transition
    if (draft.status === 'init') {
      console.log('🔄 ROUTE - Transitioning init->draft for config:', configId);
      draft.status = 'draft';
    }

    draft.configuration = configuration;
    draft.updated_at = new Date();
    // For reset operations, set has_unpublished_changes = false
    // For normal edits, set has_unpublished_changes = true
    draft.has_unpublished_changes = isReset ? false : true;
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

// Create a revert draft (new approach - creates draft instead of publishing)
router.post('/revert-draft/:versionId', authMiddleware, async (req, res) => {
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

    const revertDraft = await SlotConfiguration.createRevertDraft(
      versionId,
      userId,
      targetVersion.store_id
    );

    res.json({
      success: true,
      data: revertDraft,
      message: 'Revert draft created successfully. Publish to apply changes.',
      revertedFrom: {
        versionId: targetVersion.id,
        versionNumber: targetVersion.version_number
      }
    });
  } catch (error) {
    console.error('Error creating revert draft:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Revert to a specific version (DEPRECATED - use /revert-draft instead)
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

// Undo revert with smart restoration of previous draft state
router.post('/undo-revert/:draftId', authMiddleware, async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user.id;

    // Get the draft to check ownership
    const draft = await SlotConfiguration.findByPk(draftId);

    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }

    if (draft.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to undo this revert'
      });
    }

    const result = await SlotConfiguration.undoRevert(draftId, userId, draft.store_id);

    res.json({
      success: true,
      data: result.draft || null,
      message: result.message,
      restored: result.restored
    });
  } catch (error) {
    console.error('Error undoing revert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a draft from published configuration (with has_unpublished_changes = false)
router.post('/create-draft-from-published', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType = 'cart', configuration } = req.body;
    const userId = req.user.id;

    // Use upsert with isNewChanges = false since this is a copy of published content
    const draft = await SlotConfiguration.upsertDraft(userId, storeId, pageType, configuration, false);

    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('Error creating draft from published:', error);
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

// Destroy layout - reset to default and delete all versions
router.post('/destroy/:storeId/:pageType?', authMiddleware, async (req, res) => {
  try {
    const { storeId, pageType = 'cart' } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ Destroying layout for store ${storeId}, page ${pageType}`);

    // Delete all configurations (drafts and published versions) for this store/page
    const deletedCount = await SlotConfiguration.destroy({
      where: {
        store_id: storeId,
        page_type: pageType
      }
    });

    console.log(`🗑️ Deleted ${deletedCount} configurations`);

    // Create a fresh draft with default configuration
    const newDraft = await SlotConfiguration.upsertDraft(userId, storeId, pageType);

    console.log(`✅ Created fresh draft: ${newDraft.id}`);

    res.json({
      success: true,
      message: `Layout destroyed successfully. Deleted ${deletedCount} versions and created fresh draft.`,
      data: newDraft,
      deletedCount
    });
  } catch (error) {
    console.error('Error destroying layout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;