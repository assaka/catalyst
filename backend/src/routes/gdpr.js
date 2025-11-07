/**
 * GDPR Compliance API Routes
 * Handles data subject rights (access, deletion, portability)
 */

const express = require('express');
const router = express.Router();
const { CustomerActivity } = require('../models');
const HeatmapInteraction = require('../models/HeatmapInteraction');
const HeatmapSession = require('../models/HeatmapSession');
const ABTestAssignment = require('../models/ABTestAssignment');
const ConsentLog = require('../models/ConsentLog');
const { Op } = require('sequelize');

/**
 * Request data deletion (Right to be Forgotten)
 * POST /api/gdpr/delete-data
 */
router.post('/delete-data', async (req, res) => {
  try {
    const { session_id, user_id, email, store_id } = req.body;

    if (!session_id && !user_id && !email) {
      return res.status(400).json({
        success: false,
        error: 'Must provide session_id, user_id, or email'
      });
    }

    const deletionResults = {
      customer_activities: 0,
      heatmap_interactions: 0,
      heatmap_sessions: 0,
      ab_test_assignments: 0,
      consent_logs: 0
    };

    // Build where clause based on provided identifiers
    const whereClause = {};
    if (session_id) whereClause.session_id = session_id;
    if (user_id) whereClause.user_id = user_id;
    if (store_id) whereClause.store_id = store_id;

    // Delete customer activities
    const customerActivitiesDeleted = await CustomerActivity.destroy({
      where: whereClause
    });
    deletionResults.customer_activities = customerActivitiesDeleted;

    // Delete heatmap interactions
    const heatmapInteractionsDeleted = await HeatmapInteraction.destroy({
      where: whereClause
    });
    deletionResults.heatmap_interactions = heatmapInteractionsDeleted;

    // Delete heatmap sessions
    const heatmapSessionsDeleted = await HeatmapSession.destroy({
      where: whereClause
    });
    deletionResults.heatmap_sessions = heatmapSessionsDeleted;

    // Delete A/B test assignments
    const abTestAssignmentsDeleted = await ABTestAssignment.destroy({
      where: whereClause
    });
    deletionResults.ab_test_assignments = abTestAssignmentsDeleted;

    // Delete consent logs
    const consentLogsDeleted = await ConsentLog.destroy({
      where: whereClause
    });
    deletionResults.consent_logs = consentLogsDeleted;

    console.log('[GDPR] Data deletion completed:', deletionResults);

    res.json({
      success: true,
      message: 'Data deletion completed',
      deleted: deletionResults,
      total_records_deleted: Object.values(deletionResults).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('[GDPR] Data deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete data',
      message: error.message
    });
  }
});

/**
 * Request data export (Right to Data Portability)
 * GET /api/gdpr/export-data
 */
router.get('/export-data', async (req, res) => {
  try {
    const { session_id, user_id, store_id } = req.query;

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Must provide session_id or user_id'
      });
    }

    const whereClause = {};
    if (session_id) whereClause.session_id = session_id;
    if (user_id) whereClause.user_id = user_id;
    if (store_id) whereClause.store_id = store_id;

    // Collect all data
    const customerActivities = await CustomerActivity.findAll({
      where: whereClause,
      attributes: { exclude: ['ip_address', 'user_agent'] } // Exclude sensitive data
    });

    const heatmapInteractions = await HeatmapInteraction.findAll({
      where: whereClause,
      attributes: { exclude: ['ip_address', 'user_agent'] }
    });

    const heatmapSessions = await HeatmapSession.findAll({
      where: whereClause,
      attributes: { exclude: ['ip_address', 'user_agent'] }
    });

    const abTestAssignments = await ABTestAssignment.findAll({
      where: whereClause,
      attributes: { exclude: ['ip_address', 'user_agent'] }
    });

    const consentLogs = await ConsentLog.findAll({
      where: whereClause
    });

    const exportData = {
      export_date: new Date().toISOString(),
      identifiers: { session_id, user_id, store_id },
      data: {
        customer_activities: customerActivities,
        heatmap_interactions: heatmapInteractions,
        heatmap_sessions: heatmapSessions,
        ab_test_assignments: abTestAssignments,
        consent_logs: consentLogs
      },
      summary: {
        total_customer_activities: customerActivities.length,
        total_heatmap_interactions: heatmapInteractions.length,
        total_heatmap_sessions: heatmapSessions.length,
        total_ab_test_assignments: abTestAssignments.length,
        total_consent_logs: consentLogs.length
      }
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('[GDPR] Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: error.message
    });
  }
});

/**
 * Anonymize user data (alternative to deletion)
 * POST /api/gdpr/anonymize-data
 */
router.post('/anonymize-data', async (req, res) => {
  try {
    const { session_id, user_id, store_id } = req.body;

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Must provide session_id or user_id'
      });
    }

    const whereClause = {};
    if (session_id) whereClause.session_id = session_id;
    if (user_id) whereClause.user_id = user_id;
    if (store_id) whereClause.store_id = store_id;

    const anonymizationResults = {
      customer_activities: 0,
      heatmap_interactions: 0,
      heatmap_sessions: 0,
      ab_test_assignments: 0
    };

    // Anonymize by removing PII but keeping statistical data
    const anonymizedData = {
      user_id: null,
      ip_address: null,
      user_agent: 'anonymized',
      metadata: {} // Clear metadata
    };

    // Anonymize customer activities
    const [customerActivitiesUpdated] = await CustomerActivity.update(anonymizedData, {
      where: whereClause
    });
    anonymizationResults.customer_activities = customerActivitiesUpdated;

    // Anonymize heatmap interactions
    const [heatmapInteractionsUpdated] = await HeatmapInteraction.update(anonymizedData, {
      where: whereClause
    });
    anonymizationResults.heatmap_interactions = heatmapInteractionsUpdated;

    // Anonymize heatmap sessions
    const [heatmapSessionsUpdated] = await HeatmapSession.update(anonymizedData, {
      where: whereClause
    });
    anonymizationResults.heatmap_sessions = heatmapSessionsUpdated;

    // Anonymize A/B test assignments
    const [abTestAssignmentsUpdated] = await ABTestAssignment.update(anonymizedData, {
      where: whereClause
    });
    anonymizationResults.ab_test_assignments = abTestAssignmentsUpdated;

    console.log('[GDPR] Data anonymization completed:', anonymizationResults);

    res.json({
      success: true,
      message: 'Data anonymization completed',
      anonymized: anonymizationResults,
      total_records_anonymized: Object.values(anonymizationResults).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('[GDPR] Data anonymization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to anonymize data',
      message: error.message
    });
  }
});

/**
 * Get consent history for a user
 * GET /api/gdpr/consent-history
 */
router.get('/consent-history', async (req, res) => {
  try {
    const { session_id, user_id, store_id } = req.query;

    if (!session_id && !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Must provide session_id or user_id'
      });
    }

    const whereClause = {};
    if (session_id) whereClause.session_id = session_id;
    if (user_id) whereClause.user_id = user_id;
    if (store_id) whereClause.store_id = store_id;

    const consentHistory = await ConsentLog.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: consentHistory
    });
  } catch (error) {
    console.error('[GDPR] Consent history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve consent history',
      message: error.message
    });
  }
});

module.exports = router;
