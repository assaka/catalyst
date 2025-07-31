const express = require('express');
const { body, validationResult } = require('express-validator');
const { ConsentLog, Store } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Helper function to check store ownership
const checkStoreOwnership = async (storeId, userEmail, userRole) => {
  if (userRole === 'admin') return true;
  
  const store = await Store.findByPk(storeId);
  return store && store.user_id === userEmail;
};

// @route   POST /api/consent-logs
// @desc    Log user consent decision
// @access  Public (no auth required for consent logging)
router.post('/', [
  body('store_id').isUUID().withMessage('Store ID must be a valid UUID'),
  body('session_id').notEmpty().withMessage('Session ID is required'),
  body('consent_given').isBoolean().withMessage('Consent given must be boolean'),
  body('categories_accepted').isArray().withMessage('Categories must be an array'),
  body('consent_method').isIn(['accept_all', 'reject_all', 'custom']).withMessage('Invalid consent method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      store_id,
      session_id,
      user_id,
      consent_given,
      categories_accepted,
      country_code,
      consent_method,
      page_url
    } = req.body;

    // Verify store exists
    const store = await Store.findByPk(store_id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Create consent log
    const consentLog = await ConsentLog.create({
      store_id,
      session_id,
      user_id: user_id || null,
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'] || null,
      consent_given,
      categories_accepted,
      country_code: country_code || null,
      consent_method,
      page_url: page_url || req.headers.referer || null
    });

    res.status(201).json({
      success: true,
      message: 'Consent logged successfully',
      data: consentLog
    });
  } catch (error) {
    console.error('Log consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/consent-logs
// @desc    Get consent logs for a store
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { store_id, limit = 50, offset = 0 } = req.query;
    const where = {};
    
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Filter by store ownership
    if (req.user.role !== 'admin') {
      const userStores = await Store.findAll({
        where: { user_id: req.user.id },
        attributes: ['id']
      });
      const storeIds = userStores.map(store => store.id);
      where.store_id = { [Op.in]: storeIds };
    }

    if (store_id) where.store_id = store_id;

    const logs = await ConsentLog.findAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_date', 'DESC']],
      include: [{
        model: Store,
        attributes: ['id', 'name']
      }]
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get consent logs error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;