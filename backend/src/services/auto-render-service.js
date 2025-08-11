const axios = require('axios');
const creditService = require('./credit-service');

class AutoRenderService {
  constructor() {
    this.baseUrl = 'https://api.render.com/v1';
    this.masterToken = process.env.RENDER_MASTER_TOKEN; // Platform-wide token for auto-deployments
    this.templateRepo = 'https://github.com/catalyst-ecommerce/store-template';
  }

  /**
   * Auto-deploy a new store to Render using platform credentials
   */
  async autoDeployStore(storeId, storeData, userId) {
    try {
      if (!this.masterToken) {
        throw new Error('Render master token not configured');
      }

      const serviceConfig = {
        name: `catalyst-store-${storeId.slice(0, 8)}`,
        type: 'web_service',
        repo: this.templateRepo,
        branch: 'main',
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm start',
        plan: 'starter',
        region: 'oregon',
        rootDir: '',
        envVars: [
          {
            key: 'NODE_ENV',
            value: 'production'
          },
          {
            key: 'STORE_ID',
            value: storeId
          },
          {
            key: 'STORE_NAME',
            value: storeData.name
          },
          {
            key: 'STORE_SLUG',
            value: storeData.slug
          },
          {
            key: 'DATABASE_URL',
            value: process.env.DATABASE_URL
          },
          {
            key: 'DEPLOYMENT_MODE',
            value: 'auto'
          }
        ]
      };

      const response = await axios.post(`${this.baseUrl}/services`, serviceConfig, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`,
          'Content-Type': 'application/json'
        }
      });

      const service = response.data;

      // Update store with Render service info
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      await store.updateDeploymentStatus('deployed', service.id, service.url);

      return {
        success: true,
        service: service,
        service_id: service.id,
        service_url: service.url,
        message: 'Store auto-deployed to Render successfully'
      };

    } catch (error) {
      console.error('Auto-deployment to Render failed:', error.response?.data || error.message);
      
      // Update store status to failed
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      await store.updateDeploymentStatus('failed');

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: 'Auto-deployment to Render failed'
      };
    }
  }

  /**
   * Check deployment status for a store
   */
  async checkDeploymentStatus(storeId) {
    try {
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      
      if (!store || !store.render_service_id) {
        return {
          success: false,
          message: 'Store not deployed or missing service ID'
        };
      }

      const response = await axios.get(`${this.baseUrl}/services/${store.render_service_id}`, {
        headers: {
          'Authorization': `Bearer ${this.masterToken}`
        }
      });

      const service = response.data;

      return {
        success: true,
        service: {
          id: service.id,
          name: service.name,
          url: service.url,
          status: service.status,
          created_at: service.createdAt,
          updated_at: service.updatedAt
        }
      };

    } catch (error) {
      console.error('Failed to check deployment status:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Transfer project ownership to user's Render account
   */
  async transferProjectOwnership(storeId, userRenderCredentials) {
    try {
      // This is a placeholder for project transfer functionality
      // Render API may need to support project transfers in the future
      
      return {
        success: false,
        message: 'Project transfer not yet supported by Render API'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Publish store with credit verification
   */
  async publishStore(storeId, userId) {
    try {
      // Check if user has credits to publish
      const creditCheck = await creditService.canPublishStore(userId, storeId);
      
      if (!creditCheck.can_publish) {
        return {
          success: false,
          message: creditCheck.message,
          required_credits: creditCheck.required_credits,
          current_balance: creditCheck.current_balance
        };
      }

      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      
      if (!store) {
        return {
          success: false,
          message: 'Store not found'
        };
      }

      // If not deployed yet, auto-deploy first
      if (store.deployment_status === 'draft') {
        const deployResult = await this.autoDeployStore(storeId, store.dataValues, userId);
        
        if (!deployResult.success) {
          return {
            success: false,
            message: 'Deployment failed before publishing',
            error: deployResult.error
          };
        }
        
        // Refresh store data
        await store.reload();
      }

      // Check if store can be published
      if (!store.canPublish()) {
        return {
          success: false,
          message: 'Store cannot be published in current state',
          deployment_status: store.deployment_status,
          published: store.published
        };
      }

      // Deduct initial publishing credit
      await creditService.startDailyCharging(userId, storeId);

      // Publish the store
      await store.publish();

      return {
        success: true,
        message: 'Store published successfully',
        store_url: store.render_service_url,
        published_at: store.published_at,
        daily_cost: 1.0
      };

    } catch (error) {
      console.error('Store publishing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unpublish store and stop daily charging
   */
  async unpublishStore(storeId, userId) {
    try {
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      
      if (!store) {
        return {
          success: false,
          message: 'Store not found'
        };
      }

      if (!store.published) {
        return {
          success: false,
          message: 'Store is not published'
        };
      }

      // Unpublish the store
      await store.unpublish();

      return {
        success: true,
        message: 'Store unpublished successfully. Daily charging stopped.',
        unpublished_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Store unpublishing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update environment variables for deployed store
   */
  async updateEnvironmentVariables(storeId, envVars) {
    try {
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      
      if (!store || !store.render_service_id) {
        return {
          success: false,
          message: 'Store not deployed or missing service ID'
        };
      }

      const response = await axios.put(
        `${this.baseUrl}/services/${store.render_service_id}/env-vars`,
        { envVars },
        {
          headers: {
            'Authorization': `Bearer ${this.masterToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: 'Environment variables updated successfully'
      };

    } catch (error) {
      console.error('Failed to update environment variables:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Get deployment logs for debugging
   */
  async getDeploymentLogs(storeId, limit = 100) {
    try {
      const Store = require('../models/Store');
      const store = await Store.findByPk(storeId);
      
      if (!store || !store.render_service_id) {
        return {
          success: false,
          message: 'Store not deployed or missing service ID'
        };
      }

      const response = await axios.get(
        `${this.baseUrl}/services/${store.render_service_id}/logs?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.masterToken}`
          }
        }
      );

      return {
        success: true,
        logs: response.data
      };

    } catch (error) {
      console.error('Failed to get deployment logs:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new AutoRenderService();