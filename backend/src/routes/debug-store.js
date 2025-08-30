const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { storeResolver } = require('../middleware/storeResolver');

// Debug endpoint to check store resolution
router.get('/store-resolution', authMiddleware, storeResolver(), async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Store resolution debug endpoint called');
    console.log('🔍 [DEBUG] User:', req.user ? { id: req.user.id, email: req.user.email } : 'No user');
    console.log('🔍 [DEBUG] Resolved storeId:', req.storeId);
    console.log('🔍 [DEBUG] Store object:', req.store);
    
    res.json({
      success: true,
      debug: {
        user: req.user ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : null,
        resolvedStoreId: req.storeId,
        storeInfo: req.store,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in store resolution debug:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        user: req.user ? req.user.id : null,
        storeId: req.storeId || null,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Debug endpoint to check what patches exist for a specific file and store
router.get('/patches-debug/:filePath(*)', authMiddleware, async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const { sequelize } = require('../database/connection');
    
    console.log('🔍 [DEBUG] Patches debug for file:', filePath);
    
    // Check patches for all stores for this file
    const allPatches = await sequelize.query(`
      SELECT 
        id,
        store_id,
        file_path,
        patch_name,
        change_type,
        status,
        is_active,
        created_at
      FROM patch_diffs 
      WHERE file_path = :filePath 
      ORDER BY created_at DESC
    `, {
      replacements: { filePath },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('🔍 [DEBUG] All patches for file:', allPatches.length);
    allPatches.forEach(patch => {
      console.log(`  - Patch ID: ${patch.id}, Store: ${patch.store_id}, Active: ${patch.is_active}, Status: ${patch.status}`);
    });
    
    res.json({
      success: true,
      debug: {
        filePath,
        totalPatches: allPatches.length,
        patches: allPatches.map(patch => ({
          id: patch.id,
          store_id: patch.store_id,
          patch_name: patch.patch_name,
          change_type: patch.change_type,
          status: patch.status,
          is_active: patch.is_active,
          created_at: patch.created_at
        })),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Error in patches debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;