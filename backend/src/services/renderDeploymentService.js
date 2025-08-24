const axios = require('axios');
const { RenderDeployment, HybridCustomization, RenderOAuthToken } = require('../models');

/**
 * Render.com Deployment Service
 * Handles automated deployments to user's Render accounts
 */
class RenderDeploymentService {
  constructor() {
    this.renderApiBase = 'https://api.render.com/v1';
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * Deploy customization to user's Render account
   */
  async deployCustomization(customizationId, userId) {
    try {
      console.log(`🚀 Starting deployment for customization ${customizationId}`);
      
      // Get customization and user's Render credentials
      const customization = await HybridCustomization.findByPk(customizationId);
      if (!customization) {
        throw new Error('Customization not found');
      }

      const renderToken = await RenderOAuthToken.findOne({
        where: { store_id: customization.store_id }
      });
      if (!renderToken) {
        throw new Error('Render.com account not connected');
      }

      // Create deployment record
      const deployment = await RenderDeployment.createDeployment({
        customization_id: customizationId,
        user_id: userId
      });

      // Prepare deployment package
      await deployment.addBuildLog('Preparing deployment package...');
      const deploymentPackage = await this.prepareDeploymentPackage(customization);
      
      // Deploy to Render
      await deployment.addBuildLog('Deploying to Render.com...');
      const renderResult = await this.deployToRender(deploymentPackage, renderToken.access_token);
      
      // Update deployment with Render details
      deployment.render_service_id = renderResult.serviceId;
      deployment.render_deploy_id = renderResult.deployId;
      deployment.deploy_url = renderResult.serviceUrl;
      deployment.repo_url = renderResult.repoUrl;
      deployment.commit_hash = renderResult.commitHash;
      
      await deployment.updateStatus('building', {
        render_service_id: renderResult.serviceId,
        build_started_at: new Date().toISOString()
      });

      // Monitor deployment status
      this.monitorDeployment(deployment.id);

      return {
        success: true,
        deployment,
        deployUrl: renderResult.serviceUrl,
        message: 'Deployment initiated successfully'
      };
    } catch (error) {
      console.error('Deployment error:', error);
      
      // Update deployment status to failed if we have a deployment record
      try {
        const deployment = await RenderDeployment.findOne({
          where: { customization_id: customizationId },
          order: [['started_at', 'DESC']]
        });
        if (deployment) {
          await deployment.updateStatus('failed', { error: error.message });
          await deployment.addBuildLog(`Deployment failed: ${error.message}`);
        }
      } catch (updateError) {
        console.error('Failed to update deployment status:', updateError);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare deployment package with core code + customizations
   */
  async prepareDeploymentPackage(customization) {
    try {
      // In a real implementation, this would:
      // 1. Clone the core Catalyst repository
      // 2. Apply the user's customizations
      // 3. Generate a deployment-ready package
      // 4. Push to a temporary repository or use Render's direct deploy

      const deploymentPackage = {
        // Core application files
        coreFiles: await this.getCoreApplicationFiles(),
        
        // User customizations
        customizations: {
          code: customization.modified_code,
          metadata: customization.customization_history,
          settings: customization.settings
        },
        
        // Deployment configuration
        config: {
          buildCommand: 'npm run build',
          startCommand: 'npm start',
          nodeVersion: '18',
          environment: 'production'
        },
        
        // Package.json modifications
        dependencies: this.getMergedDependencies(customization),
        
        // Environment variables
        envVars: this.getEnvironmentVariables(customization)
      };

      return deploymentPackage;
    } catch (error) {
      console.error('Error preparing deployment package:', error);
      throw new Error(`Failed to prepare deployment package: ${error.message}`);
    }
  }

  /**
   * Deploy package to Render.com
   */
  async deployToRender(deploymentPackage, accessToken) {
    try {
      // Create a new service on Render
      const serviceData = {
        name: `catalyst-${Date.now()}`,
        type: 'web_service',
        repo: this.getDeploymentRepoUrl(deploymentPackage),
        branch: 'main',
        buildCommand: deploymentPackage.config.buildCommand,
        startCommand: deploymentPackage.config.startCommand,
        envVars: deploymentPackage.envVars,
        region: 'oregon',
        plan: 'starter'
      };

      const response = await axios.post(
        `${this.renderApiBase}/services`,
        serviceData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const service = response.data;
      
      return {
        serviceId: service.service.id,
        deployId: service.service.latestDeploy?.id,
        serviceUrl: `https://${service.service.slug}.onrender.com`,
        repoUrl: service.service.repo,
        commitHash: service.service.latestDeploy?.commit?.id
      };
    } catch (error) {
      console.error('Render API error:', error.response?.data || error.message);
      throw new Error(`Render deployment failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Monitor deployment status and update database
   */
  async monitorDeployment(deploymentId) {
    try {
      const deployment = await RenderDeployment.findByPk(deploymentId);
      if (!deployment) return;

      // Check deployment status every 30 seconds
      const checkInterval = setInterval(async () => {
        try {
          const status = await this.getDeploymentStatus(deployment);
          
          if (status.isComplete) {
            clearInterval(checkInterval);
            
            if (status.success) {
              await deployment.updateStatus('live', {
                deployment_completed_at: new Date().toISOString(),
                final_url: status.url
              });
              await deployment.addBuildLog('Deployment completed successfully! 🎉');
              
              // Update the customization record
              const customization = await HybridCustomization.findByPk(deployment.customization_id);
              if (customization) {
                await customization.deploy(deployment.render_service_id, status.url);
              }
            } else {
              await deployment.updateStatus('failed', { error: status.error });
              await deployment.addBuildLog(`Deployment failed: ${status.error}`);
            }
          } else {
            // Add build logs if available
            if (status.logs) {
              await deployment.addBuildLog(status.logs);
            }
          }
        } catch (error) {
          console.error('Error monitoring deployment:', error);
          clearInterval(checkInterval);
          await deployment.updateStatus('failed', { error: error.message });
        }
      }, 30000);

      // Stop monitoring after 30 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 30 * 60 * 1000);
    } catch (error) {
      console.error('Error setting up deployment monitoring:', error);
    }
  }

  /**
   * Get deployment status from Render
   */
  async getDeploymentStatus(deployment) {
    try {
      // Mock implementation - replace with actual Render API calls
      const mockStatuses = ['pending', 'building', 'live', 'failed'];
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
      
      return {
        status: randomStatus,
        isComplete: ['live', 'failed'].includes(randomStatus),
        success: randomStatus === 'live',
        url: deployment.deploy_url,
        logs: randomStatus === 'building' ? 'Build in progress...' : null,
        error: randomStatus === 'failed' ? 'Build failed' : null
      };
    } catch (error) {
      return {
        status: 'failed',
        isComplete: true,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get core application files (mock implementation)
   */
  async getCoreApplicationFiles() {
    // In a real implementation, this would fetch the core Catalyst files
    return {
      'package.json': {
        name: 'catalyst-customized',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'next': '^13.0.0'
        }
      },
      'src/': {
        // Core source files would be included here
      }
    };
  }

  /**
   * Merge user dependencies with core dependencies
   */
  getMergedDependencies(customization) {
    const coreDependencies = {
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
      'next': '^13.0.0'
    };

    const userDependencies = customization.settings?.dependencies || {};
    
    return { ...coreDependencies, ...userDependencies };
  }

  /**
   * Get environment variables for deployment
   */
  getEnvironmentVariables(customization) {
    return [
      {
        key: 'NODE_ENV',
        value: 'production'
      },
      {
        key: 'NEXT_PUBLIC_APP_NAME',
        value: customization.name || 'Catalyst Store'
      },
      // Add any custom environment variables from customization settings
      ...(customization.settings?.envVars || [])
    ];
  }

  /**
   * Get deployment repository URL (mock implementation)
   */
  getDeploymentRepoUrl(deploymentPackage) {
    // In a real implementation, this would:
    // 1. Create a temporary repository
    // 2. Push the merged code
    // 3. Return the repository URL
    return 'https://github.com/user/catalyst-customized';
  }

  /**
   * Get deployment history for a user
   */
  async getDeploymentHistory(userId, limit = 20) {
    return RenderDeployment.findByUser(userId, { limit });
  }

  /**
   * Get deployment statistics
   */
  async getDeploymentStats(userId) {
    return RenderDeployment.getDeploymentStats(userId);
  }

  /**
   * Cancel a running deployment
   */
  async cancelDeployment(deploymentId, userId) {
    try {
      const deployment = await RenderDeployment.findOne({
        where: {
          id: deploymentId,
          user_id: userId,
          status: ['pending', 'building']
        }
      });

      if (!deployment) {
        throw new Error('Deployment not found or cannot be cancelled');
      }

      // TODO: Call Render API to cancel deployment
      
      await deployment.updateStatus('cancelled', {
        cancelled_at: new Date().toISOString()
      });
      await deployment.addBuildLog('Deployment cancelled by user');

      return {
        success: true,
        message: 'Deployment cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling deployment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new RenderDeploymentService();