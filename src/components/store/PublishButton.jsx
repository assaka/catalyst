import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { Rocket, ExternalLink, CheckCircle, AlertCircle, Clock, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/button';

const PublishButton = ({ storeId, storeName }) => {
  const [renderStatus, setRenderStatus] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(null);
  const [lastDeployment, setLastDeployment] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeId) {
      checkRenderConnection();
    }
  }, [storeId]);

  const checkRenderConnection = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/render/oauth/status/${storeId}`);
      setRenderStatus(response.data);
      
      // If connected, also check for existing services
      if (response.data?.connected) {
        await loadExistingServices();
      }
    } catch (error) {
      console.error('Failed to check Render status:', error);
      setRenderStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const loadExistingServices = async () => {
    try {
      const response = await apiClient.get(`/render/oauth/services/${storeId}`);
      const services = response.data?.services || [];
      
      // Find the most recent deployment for this store
      const storeService = services.find(service => 
        service.name?.includes(storeName?.toLowerCase().replace(/\s+/g, '-')) ||
        service.name?.includes(`store-${storeId.slice(0, 8)}`)
      );
      
      if (storeService) {
        setLastDeployment({
          id: storeService.id,
          name: storeService.name,
          url: storeService.url,
          status: storeService.status,
          lastDeploy: storeService.updated_at
        });
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const handlePublish = async () => {
    if (!renderStatus?.connected) {
      setShowConfigModal(true);
      return;
    }

    try {
      setIsDeploying(true);
      setDeploymentProgress({
        status: 'starting',
        message: 'Initiating deployment...'
      });

      // Generate deployment configuration
      const deploymentConfig = {
        name: `${storeName?.toLowerCase().replace(/\s+/g, '-') || 'catalyst-store'}-${storeId.slice(0, 8)}`,
        repo: `https://github.com/catalyst-stores/${storeId}`, // This would be generated or configured
        branch: 'main',
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm start',
        plan: 'starter',
        envVars: [
          {
            key: 'STORE_ID',
            value: storeId
          },
          {
            key: 'STORE_NAME',
            value: storeName || 'Catalyst Store'
          },
          {
            key: 'NODE_ENV',
            value: 'production'
          }
        ]
      };

      setDeploymentProgress({
        status: 'deploying',
        message: 'Creating service on Render...'
      });

      const response = await apiClient.post('/render/oauth/deploy', {
        store_id: storeId,
        deployment_config: deploymentConfig
      });

      if (response.data?.success) {
        setDeploymentProgress({
          status: 'success',
          message: 'Deployment initiated successfully!',
          serviceId: response.data.deployment?.service_id,
          url: response.data.deployment?.url
        });

        setLastDeployment({
          id: response.data.deployment?.service_id,
          name: response.data.deployment?.name,
          url: response.data.deployment?.url,
          status: response.data.deployment?.status || 'deploying',
          lastDeploy: new Date().toISOString()
        });

        toast.success('Store published successfully!');
        
        // Start monitoring deployment progress
        if (response.data.deployment?.service_id) {
          monitorDeployment(response.data.deployment.service_id);
        }
      } else {
        throw new Error(response.data?.message || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentProgress({
        status: 'error',
        message: error.response?.data?.message || error.message || 'Deployment failed'
      });
      toast.error('Failed to publish store');
    } finally {
      setIsDeploying(false);
    }
  };

  const monitorDeployment = async (serviceId) => {
    const maxAttempts = 30; // Monitor for up to 15 minutes
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const response = await apiClient.get(`/render/oauth/deployment/${storeId}/${serviceId}`);
        const deployment = response.data?.deployment;
        
        if (deployment) {
          setLastDeployment(prev => ({
            ...prev,
            status: deployment.status,
            url: deployment.url,
            lastDeploy: deployment.last_deploy || prev.lastDeploy
          }));

          // Update progress based on status
          if (deployment.status === 'live') {
            setDeploymentProgress({
              status: 'complete',
              message: 'Store is now live!',
              url: deployment.url
            });
            return; // Stop monitoring
          } else if (deployment.status === 'build_failed') {
            setDeploymentProgress({
              status: 'error',
              message: 'Build failed. Please check your configuration.'
            });
            return; // Stop monitoring
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 30000); // Check every 30 seconds
        } else {
          setDeploymentProgress({
            status: 'timeout',
            message: 'Deployment is taking longer than expected. Check Render dashboard for updates.'
          });
        }
      } catch (error) {
        console.error('Failed to check deployment status:', error);
      }
    };

    // Start monitoring after a short delay
    setTimeout(checkStatus, 10000);
  };

  const openConfigModal = () => {
    setShowConfigModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deploying':
      case 'deploy_in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'build_failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'text-green-600';
      case 'deploying':
      case 'deploy_in_progress':
        return 'text-blue-600';
      case 'build_failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Rocket className="w-5 h-5 mr-2 text-purple-600" />
            Publish Store
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Deploy your store to make it publicly accessible
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={openConfigModal}
          className="flex items-center space-x-2"
        >
          <Settings className="w-4 h-4" />
          <span>Configure</span>
        </Button>
      </div>

      {/* Connection Status */}
      {!renderStatus?.connected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Render Not Connected
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Connect your Render account to publish your store.
              </p>
              <Button
                size="sm"
                onClick={openConfigModal}
                className="mt-2"
              >
                Connect Render
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Render Connected
              </p>
              <p className="text-sm text-green-700 mt-1">
                Ready to deploy as: {renderStatus.user_email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Deployment Status */}
      {lastDeployment && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Last Deployment</p>
              <div className="flex items-center space-x-2 mt-1">
                {getStatusIcon(lastDeployment.status)}
                <span className={`text-sm ${getStatusColor(lastDeployment.status)}`}>
                  {lastDeployment.status?.replace('_', ' ')} - {lastDeployment.name}
                </span>
              </div>
              {lastDeployment.lastDeploy && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(lastDeployment.lastDeploy).toLocaleString()}
                </p>
              )}
            </div>
            {lastDeployment.url && lastDeployment.status === 'live' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(lastDeployment.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Deployment Progress */}
      {deploymentProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            {deploymentProgress.status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            ) : deploymentProgress.status === 'complete' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                {deploymentProgress.message}
              </p>
              {deploymentProgress.url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deploymentProgress.url, '_blank')}
                  className="mt-2"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Deployment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Button */}
      <Button
        onClick={handlePublish}
        disabled={isDeploying}
        className="w-full flex items-center justify-center space-x-2"
        size="lg"
      >
        {isDeploying ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Publishing...</span>
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            <span>Publish Store</span>
          </>
        )}
      </Button>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Render Configuration
                </h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Configure your Render integration to enable one-click publishing.
              </p>
              <Button
                onClick={() => {
                  setShowConfigModal(false);
                  // Navigate to Render integration page
                  window.location.href = '/render-integration';
                }}
              >
                Open Render Integration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishButton;