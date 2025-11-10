import apiClient from '@/api/client';

const API_BASE = 'ab-testing';

/**
 * Frontend service for A/B Testing
 * Handles test management, variant assignment, and conversion tracking
 */
class ABTestService {
  // ========== Admin Methods (Test Management) ==========

  /**
   * Get all tests for a store
   */
  async getTests(storeId, status = null) {
    try {
      const params = status ? { status } : {};
      const response = await apiClient.get(`${API_BASE}/${storeId}`, { params });
      return response;
    } catch (error) {
      console.error('Error getting tests:', error);
      throw error;
    }
  }

  /**
   * Get a specific test by ID
   */
  async getTest(storeId, testId) {
    try {
      const response = await apiClient.get(`${API_BASE}/${storeId}/test/${testId}`);
      return response;
    } catch (error) {
      console.error('Error getting test:', error);
      throw error;
    }
  }

  /**
   * Create a new test
   */
  async createTest(storeId, testData) {
    try {
      const response = await apiClient.post(`${API_BASE}/${storeId}`, testData);
      return response;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  /**
   * Update an existing test
   */
  async updateTest(storeId, testId, testData) {
    try {
      const response = await apiClient.put(`${API_BASE}/${storeId}/test/${testId}`, testData);
      return response;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  }

  /**
   * Delete/archive a test
   */
  async deleteTest(storeId, testId) {
    try {
      const response = await apiClient.delete(`${API_BASE}/${storeId}/test/${testId}`);
      return response;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  }

  /**
   * Start a test (change status from draft to running)
   */
  async startTest(storeId, testId) {
    try {
      const response = await apiClient.post(`${API_BASE}/${storeId}/test/${testId}/start`);
      return response;
    } catch (error) {
      console.error('Error starting test:', error);
      throw error;
    }
  }

  /**
   * Pause a running test
   */
  async pauseTest(storeId, testId) {
    try {
      const response = await apiClient.post(`${API_BASE}/${storeId}/test/${testId}/pause`);
      return response;
    } catch (error) {
      console.error('Error pausing test:', error);
      throw error;
    }
  }

  /**
   * Complete a test and optionally declare a winner
   */
  async completeTest(storeId, testId, winnerVariantId = null) {
    try {
      const response = await apiClient.post(`${API_BASE}/${storeId}/test/${testId}/complete`, {
        winner_variant_id: winnerVariantId
      });
      return response;
    } catch (error) {
      console.error('Error completing test:', error);
      throw error;
    }
  }

  /**
   * Get test results and analytics
   */
  async getTestResults(storeId, testId) {
    try {
      const response = await apiClient.get(`${API_BASE}/${storeId}/test/${testId}/results`);
      return response;
    } catch (error) {
      console.error('Error getting test results:', error);
      throw error;
    }
  }

  // ========== Public Methods (Storefront) ==========

  /**
   * Get variant assignment for a specific test
   */
  async getVariantAssignment(testId) {
    try {
      const response = await apiClient.get(`${API_BASE}/variant/${testId}`);
      return response;
    } catch (error) {
      console.error('Error getting variant assignment:', error);
      throw error;
    }
  }

  /**
   * Get all active tests and variant assignments for a store
   */
  async getActiveTests(storeId, pageType = null) {
    try {
      const params = pageType ? { pageType } : {};
      const response = await apiClient.get(`${API_BASE}/active/${storeId}`, { params });
      return response;
    } catch (error) {
      console.error('Error getting active tests:', error);
      throw error;
    }
  }

  /**
   * Track a conversion for a test
   */
  async trackConversion(testId, value = null, metrics = {}) {
    try {
      const response = await apiClient.post(`${API_BASE}/conversion/${testId}`, {
        value,
        metrics
      });
      return response;
    } catch (error) {
      console.error('Error tracking conversion:', error);
      throw error;
    }
  }

  /**
   * Track a custom metric for a test
   */
  async trackMetric(testId, metricName, metricValue) {
    try {
      const response = await apiClient.post(`${API_BASE}/metric/${testId}`, {
        metricName,
        metricValue
      });
      return response;
    } catch (error) {
      console.error('Error tracking metric:', error);
      throw error;
    }
  }

  /**
   * Get example test configurations
   */
  async getExamples() {
    try {
      const response = await apiClient.get(`${API_BASE}/examples`);
      return response;
    } catch (error) {
      console.error('Error getting examples:', error);
      throw error;
    }
  }

  // ========== Helper Methods ==========

  /**
   * Validate test configuration before saving
   */
  validateTestConfig(testData) {
    const errors = [];

    if (!testData.name || testData.name.trim() === '') {
      errors.push('Test name is required');
    }

    if (!testData.primary_metric || testData.primary_metric.trim() === '') {
      errors.push('Primary metric is required');
    }

    if (!testData.variants || testData.variants.length < 2) {
      errors.push('At least 2 variants required (including control)');
    }

    if (testData.variants) {
      const hasControl = testData.variants.some(v => v.is_control === true);
      if (!hasControl) {
        errors.push('One variant must be marked as control');
      }

      const totalWeight = testData.variants.reduce((sum, v) => sum + (v.weight || 1), 0);
      if (totalWeight === 0) {
        errors.push('Total variant weight must be greater than 0');
      }
    }

    if (testData.traffic_allocation !== undefined) {
      if (testData.traffic_allocation < 0 || testData.traffic_allocation > 1) {
        errors.push('Traffic allocation must be between 0 and 1');
      }
    }

    if (testData.confidence_level !== undefined) {
      if (testData.confidence_level < 0 || testData.confidence_level > 1) {
        errors.push('Confidence level must be between 0 and 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a unique variant ID
   */
  generateVariantId(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const timestamp = Date.now();
    return `${slug}_${timestamp}`;
  }

  /**
   * Create a default control variant
   */
  createControlVariant() {
    return {
      id: this.generateVariantId('control'),
      name: 'Control',
      description: 'Original version (no changes)',
      is_control: true,
      weight: 1,
      config: {}
    };
  }

  /**
   * Create a default variant template
   */
  createVariantTemplate(name = 'Variant A') {
    return {
      id: this.generateVariantId(name),
      name,
      description: '',
      is_control: false,
      weight: 1,
      config: {
        slot_overrides: {},
        feature_flags: {},
        style_overrides: {}
      }
    };
  }

  /**
   * Create a default test template
   */
  createTestTemplate(storeId) {
    return {
      store_id: storeId,
      name: '',
      description: '',
      hypothesis: '',
      status: 'draft',
      variants: [
        this.createControlVariant(),
        this.createVariantTemplate('Variant A')
      ],
      traffic_allocation: 1.0,
      targeting_rules: {
        pages: [],
        devices: [],
        countries: []
      },
      primary_metric: 'conversion_rate',
      secondary_metrics: [],
      min_sample_size: 100,
      confidence_level: 0.95,
      metadata: {}
    };
  }

  /**
   * Calculate lift percentage
   */
  calculateLift(variantRate, controlRate) {
    if (controlRate === 0) return 0;
    return ((variantRate - controlRate) / controlRate) * 100;
  }

  /**
   * Format percentage
   */
  formatPercentage(value, decimals = 2) {
    return (value * 100).toFixed(decimals) + '%';
  }

  /**
   * Format p-value
   */
  formatPValue(pValue) {
    if (pValue === null || pValue === undefined) return 'N/A';
    if (pValue < 0.0001) return '< 0.0001';
    return pValue.toFixed(4);
  }

  /**
   * Get significance badge color
   */
  getSignificanceBadge(isSignificant, lift) {
    if (!isSignificant) {
      return { color: 'gray', text: 'Not Significant' };
    }
    if (lift > 0) {
      return { color: 'green', text: 'Significant Winner' };
    } else {
      return { color: 'red', text: 'Significant Loser' };
    }
  }
}

export default new ABTestService();
