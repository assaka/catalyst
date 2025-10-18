// backend/src/routes/admin-navigation.js
const express = require('express');
const router = express.Router();
const AdminNavigationService = require('../services/AdminNavigationService');

/**
 * GET /api/admin/navigation
 * Get complete navigation tree for the current tenant
 */
router.get('/navigation', async (req, res) => {
  try {
    // TODO: Get tenantId from authenticated session
    const tenantId = req.user?.tenantId || 'default-tenant';

    const navigation = await AdminNavigationService.getNavigationForTenant(tenantId);

    res.json({
      success: true,
      navigation
    });
  } catch (error) {
    console.error('Failed to get navigation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/navigation/seed
 * Seed core navigation items (run once)
 */
router.post('/navigation/seed', async (req, res) => {
  try {
    await AdminNavigationService.seedCoreNavigation();

    res.json({
      success: true,
      message: 'Core navigation seeded successfully'
    });
  } catch (error) {
    console.error('Failed to seed navigation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
