/**
 * GDPR Compliance API Routes
 * Handles data subject rights (access, deletion, portability)
 */

const express = require('express');
const router = express.Router();
const ConnectionManager = require('../services/database/ConnectionManager');

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

    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id is required'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    const deletionResults = {
      customer_activities: 0,
      heatmap_interactions: 0,
      heatmap_sessions: 0,
      ab_test_assignments: 0,
      consent_logs: 0
    };

    // Build where filters
    const filters = [];
    if (session_id) filters.push({ session_id });
    if (user_id) filters.push({ user_id });
    if (store_id) filters.push({ store_id });

    // Delete customer activities
    let deleteQuery = tenantDb.from('customer_activities').delete();
    if (session_id) deleteQuery = deleteQuery.eq('session_id', session_id);
    if (user_id) deleteQuery = deleteQuery.eq('user_id', user_id);
    if (store_id) deleteQuery = deleteQuery.eq('store_id', store_id);

    const { count: customerActivitiesDeleted } = await deleteQuery;
    deletionResults.customer_activities = customerActivitiesDeleted || 0;

    // Delete heatmap interactions
    deleteQuery = tenantDb.from('heatmap_interactions').delete();
    if (session_id) deleteQuery = deleteQuery.eq('session_id', session_id);
    if (user_id) deleteQuery = deleteQuery.eq('user_id', user_id);
    if (store_id) deleteQuery = deleteQuery.eq('store_id', store_id);

    const { count: heatmapInteractionsDeleted } = await deleteQuery;
    deletionResults.heatmap_interactions = heatmapInteractionsDeleted || 0;

    // Delete heatmap sessions
    deleteQuery = tenantDb.from('heatmap_sessions').delete();
    if (session_id) deleteQuery = deleteQuery.eq('session_id', session_id);
    if (user_id) deleteQuery = deleteQuery.eq('user_id', user_id);
    if (store_id) deleteQuery = deleteQuery.eq('store_id', store_id);

    const { count: heatmapSessionsDeleted } = await deleteQuery;
    deletionResults.heatmap_sessions = heatmapSessionsDeleted || 0;

    // Delete A/B test assignments
    deleteQuery = tenantDb.from('ab_test_assignments').delete();
    if (session_id) deleteQuery = deleteQuery.eq('session_id', session_id);
    if (user_id) deleteQuery = deleteQuery.eq('user_id', user_id);
    if (store_id) deleteQuery = deleteQuery.eq('store_id', store_id);

    const { count: abTestAssignmentsDeleted } = await deleteQuery;
    deletionResults.ab_test_assignments = abTestAssignmentsDeleted || 0;

    // Delete consent logs
    deleteQuery = tenantDb.from('consent_logs').delete();
    if (session_id) deleteQuery = deleteQuery.eq('session_id', session_id);
    if (user_id) deleteQuery = deleteQuery.eq('user_id', user_id);
    if (store_id) deleteQuery = deleteQuery.eq('store_id', store_id);

    const { count: consentLogsDeleted } = await deleteQuery;
    deletionResults.consent_logs = consentLogsDeleted || 0;

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

    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id is required'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    // Build query for customer activities
    let query = tenantDb
      .from('customer_activities')
      .select('*');

    if (session_id) query = query.eq('session_id', session_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: customerActivities } = await query;

    // Build query for heatmap interactions
    query = tenantDb
      .from('heatmap_interactions')
      .select('*');

    if (session_id) query = query.eq('session_id', session_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: heatmapInteractions } = await query;

    // Build query for heatmap sessions
    query = tenantDb
      .from('heatmap_sessions')
      .select('*');

    if (session_id) query = query.eq('session_id', session_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: heatmapSessions } = await query;

    // Build query for ab test assignments
    query = tenantDb
      .from('ab_test_assignments')
      .select('*');

    if (session_id) query = query.eq('session_id', session_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: abTestAssignments } = await query;

    // Build query for consent logs
    query = tenantDb
      .from('consent_logs')
      .select('*');

    if (session_id) query = query.eq('session_id', session_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: consentLogs } = await query;

    const exportData = {
      export_date: new Date().toISOString(),
      identifiers: { session_id, user_id, store_id },
      data: {
        customer_activities: customerActivities || [],
        heatmap_interactions: heatmapInteractions || [],
        heatmap_sessions: heatmapSessions || [],
        ab_test_assignments: abTestAssignments || [],
        consent_logs: consentLogs || []
      },
      summary: {
        total_customer_activities: (customerActivities || []).length,
        total_heatmap_interactions: (heatmapInteractions || []).length,
        total_heatmap_sessions: (heatmapSessions || []).length,
        total_ab_test_assignments: (abTestAssignments || []).length,
        total_consent_logs: (consentLogs || []).length
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

    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id is required'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

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
      metadata: {}
    };

    // Anonymize customer activities
    let updateQuery = tenantDb
      .from('customer_activities')
      .update(anonymizedData);

    if (session_id) updateQuery = updateQuery.eq('session_id', session_id);
    if (user_id) updateQuery = updateQuery.eq('user_id', user_id);
    if (store_id) updateQuery = updateQuery.eq('store_id', store_id);

    const { count: customerActivitiesUpdated } = await updateQuery;
    anonymizationResults.customer_activities = customerActivitiesUpdated || 0;

    // Anonymize heatmap interactions
    updateQuery = tenantDb
      .from('heatmap_interactions')
      .update(anonymizedData);

    if (session_id) updateQuery = updateQuery.eq('session_id', session_id);
    if (user_id) updateQuery = updateQuery.eq('user_id', user_id);
    if (store_id) updateQuery = updateQuery.eq('store_id', store_id);

    const { count: heatmapInteractionsUpdated } = await updateQuery;
    anonymizationResults.heatmap_interactions = heatmapInteractionsUpdated || 0;

    // Anonymize heatmap sessions
    updateQuery = tenantDb
      .from('heatmap_sessions')
      .update(anonymizedData);

    if (session_id) updateQuery = updateQuery.eq('session_id', session_id);
    if (user_id) updateQuery = updateQuery.eq('user_id', user_id);
    if (store_id) updateQuery = updateQuery.eq('store_id', store_id);

    const { count: heatmapSessionsUpdated } = await updateQuery;
    anonymizationResults.heatmap_sessions = heatmapSessionsUpdated || 0;

    // Anonymize A/B test assignments
    updateQuery = tenantDb
      .from('ab_test_assignments')
      .update(anonymizedData);

    if (session_id) updateQuery = updateQuery.eq('session_id', session_id);
    if (user_id) updateQuery = updateQuery.eq('user_id', user_id);
    if (store_id) updateQuery = updateQuery.eq('store_id', store_id);

    const { count: abTestAssignmentsUpdated } = await updateQuery;
    anonymizationResults.ab_test_assignments = abTestAssignmentsUpdated || 0;

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

    if (!store_id) {
      return res.status(400).json({
        success: false,
        error: 'store_id is required'
      });
    }

    // Get tenant connection
    const tenantDb = await ConnectionManager.getStoreConnection(store_id);

    let query = tenantDb
      .from('consent_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (session_id) query = query.eq('session_id', session_id);
    if (user_id) query = query.eq('user_id', user_id);
    if (store_id) query = query.eq('store_id', store_id);

    const { data: consentHistory, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: consentHistory || []
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
