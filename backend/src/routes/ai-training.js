/**
 * AI Training Routes
 * Admin endpoints for managing AI training data
 */

const express = require('express');
const router = express.Router();
const aiTrainingService = require('../services/aiTrainingService');

/**
 * GET /api/ai/training/candidates
 * Get training candidates for review
 */
router.get('/candidates', async (req, res) => {
  try {
    const { status, entity, page = 1, limit = 20 } = req.query;

    const result = await aiTrainingService.getCandidatesForReview({
      status,
      entity,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching training candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training candidates'
    });
  }
});

/**
 * GET /api/ai/training/metrics
 * Get training metrics and statistics
 */
router.get('/metrics', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    const metrics = await aiTrainingService.getTrainingMetrics(dateFrom, dateTo);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training metrics'
    });
  }
});

/**
 * POST /api/ai/training/candidates/:id/approve
 * Manually approve a training candidate
 */
router.post('/candidates/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId;

    const result = await aiTrainingService.approveCandidate(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Candidate approved successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to approve candidate'
      });
    }
  } catch (error) {
    console.error('Error approving candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve candidate'
    });
  }
});

/**
 * POST /api/ai/training/candidates/:id/reject
 * Manually reject a training candidate
 */
router.post('/candidates/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id || req.body.userId;

    const result = await aiTrainingService.rejectCandidate(id, userId, reason);

    if (result.success) {
      res.json({
        success: true,
        message: 'Candidate rejected successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to reject candidate'
      });
    }
  } catch (error) {
    console.error('Error rejecting candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject candidate'
    });
  }
});

/**
 * POST /api/ai/training/candidates/:id/feedback
 * Record user feedback on a candidate
 */
router.post('/candidates/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { wasHelpful, feedbackText } = req.body;

    const result = await aiTrainingService.recordUserFeedback(id, wasHelpful, feedbackText);

    res.json({
      success: result.success,
      message: result.success ? 'Feedback recorded' : result.error
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback'
    });
  }
});

/**
 * POST /api/ai/training/promote
 * Promote all approved candidates to entity definitions
 */
router.post('/promote', async (req, res) => {
  try {
    const result = await aiTrainingService.promoteApprovedCandidates();

    if (result.error) {
      res.status(500).json({
        success: false,
        message: result.error
      });
    } else {
      res.json({
        success: true,
        message: `Promoted ${result.promoted} candidates, ${result.failed} failed`,
        ...result
      });
    }
  } catch (error) {
    console.error('Error promoting candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote candidates'
    });
  }
});

/**
 * GET /api/ai/training/rules
 * Get training rules
 */
router.get('/rules', async (req, res) => {
  try {
    const rules = await aiTrainingService.getTrainingRules();

    res.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Error fetching training rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training rules'
    });
  }
});

/**
 * POST /api/ai/training/capture
 * Manually capture a training candidate (for testing)
 */
router.post('/capture', async (req, res) => {
  try {
    const {
      storeId,
      userId,
      sessionId,
      userPrompt,
      aiResponse,
      detectedIntent,
      detectedEntity,
      detectedOperation,
      actionTaken,
      confidenceScore
    } = req.body;

    const result = await aiTrainingService.captureTrainingCandidate({
      storeId,
      userId,
      sessionId,
      userPrompt,
      aiResponse,
      detectedIntent,
      detectedEntity,
      detectedOperation,
      actionTaken,
      confidenceScore
    });

    res.json({
      success: result.captured,
      candidateId: result.candidateId,
      message: result.captured ? 'Captured successfully' : result.reason || result.error
    });
  } catch (error) {
    console.error('Error capturing candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture candidate'
    });
  }
});

/**
 * POST /api/ai/training/candidates/:id/outcome
 * Update outcome for a candidate
 */
router.post('/candidates/:id/outcome', async (req, res) => {
  try {
    const { id } = req.params;
    const { outcomeStatus, outcomeDetails } = req.body;

    const result = await aiTrainingService.updateOutcome(id, outcomeStatus, outcomeDetails);

    res.json({
      success: result.success,
      message: result.success ? 'Outcome updated' : result.error
    });
  } catch (error) {
    console.error('Error updating outcome:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update outcome'
    });
  }
});

module.exports = router;
