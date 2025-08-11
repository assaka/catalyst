import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import apiClient from '../../api/client';
import { ExternalLink, Cloud, Server, Rocket, AlertCircle, Info, Copy, ArrowRight, RefreshCw, Globe, Activity, Zap, Building, Link2, Settings } from 'lucide-react';

const RenderIntegration = ({ storeId, context = 'full' }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState({
    repo: '',
    branch: 'main',
    name: ''
  });
  const [deploying, setDeploying] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    token: '',
    userEmail: ''
  });
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);

  // Initialize component
  useEffect(() => {
    // Remove any URL parameters from previous OAuth attempts
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success') || urlParams.has('error')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (storeId && storeId !== 'undefined') {
      loadStatus();
    }
  }, [storeId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/render/oauth/status/${storeId}`);
      setStatus(response.data);
      
      // If connected, load services
      if (response.data?.connected) {
        loadServices();
      }
    } catch (error) {
      console.error('Failed to load Render status:', error);
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await apiClient.get(`/render/oauth/services/${storeId}`);
      setServices(response.data?.services || []);
    } catch (error) {
      console.error('Failed to load Render services:', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleConnect = () => {
    setShowTokenForm(true);
    setTokenForm({ token: '', userEmail: '' });
  };

  const handleTokenSubmit = async () => {
    if (!tokenForm.token.trim()) {
      toast.error('Please enter your Personal Access Token');
      return;
    }

    try {
      setConnecting(true);
      const response = await apiClient.post('/render/oauth/store-token', {
        store_id: storeId,
        token: tokenForm.token.trim(),
        user_email: tokenForm.userEmail.trim() || undefined
      });
      
      if (response.data?.success) {
        toast.success('Successfully connected to Render!');
        if (response.data.user_info?.email) {
          toast.info(`Connected as: ${response.data.user_info.email}`);
        }
        setShowTokenForm(false);
        setTokenForm({ token: '', userEmail: '' });
        loadStatus(); // Refresh status
      } else {
        toast.error(response.data?.message || 'Failed to connect to Render');
      }
    } catch (error) {
      console.error('Failed to store Render token:', error);
      toast.error(error.response?.data?.message || 'Failed to connect to Render');
    } finally {
      setConnecting(false);
    }
  };

  const handleValidateToken = async () => {
    if (!tokenForm.token.trim()) {
      toast.error('Please enter your Personal Access Token');
      return;
    }

    try {
      setValidatingToken(true);
      const response = await apiClient.post('/render/oauth/validate-token', {
        token: tokenForm.token.trim()
      });
      
      if (response.data?.success) {
        toast.success(`Token is valid! ${response.data.user_info?.email ? `User: ${response.data.user_info.email}` : ''}`);
        // Pre-fill user email if we got it from validation
        if (response.data.user_info?.email) {
          setTokenForm(prev => ({ ...prev, userEmail: response.data.user_info.email }));
        }
      } else {
        toast.error(response.data?.message || 'Token validation failed');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      toast.error(error.response?.data?.message || 'Token validation failed');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from Render? This will remove access to all services.')) {
      return;
    }

    try {
      const response = await apiClient.post('/render/oauth/disconnect', {
        store_id: storeId
      });
      
      if (response.data?.success) {
        toast.success('Successfully disconnected from Render');
        setStatus({ connected: false });
        setServices([]);
      } else {
        toast.error('Failed to disconnect from Render');
      }
    } catch (error) {
      console.error('Failed to disconnect from Render:', error);
      toast.error(error.response?.data?.message || 'Failed to disconnect');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const response = await apiClient.post('/render/oauth/test-connection', {
        store_id: storeId
      });
      
      if (response.data?.success) {
        toast.success(`Connection successful! Found ${response.data.servicesCount || 0} services`);
        loadStatus(); // Refresh status
      } else {
        toast.error('Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(error.response?.data?.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDeploy = async () => {
    if (!deploymentConfig.repo || !deploymentConfig.name) {
      toast.error('Repository URL and service name are required');
      return;
    }

    try {
      setDeploying(true);
      const response = await apiClient.post('/render/oauth/deploy', {
        store_id: storeId,
        deployment_config: deploymentConfig
      });
      
      if (response.data?.success) {
        toast.success(`Deployment initiated! Service: ${response.data.deployment?.name}`);
        loadServices(); // Refresh services list
        setDeploymentConfig({ repo: '', branch: 'main', name: '' }); // Reset form
      } else {
        toast.error('Deployment failed');
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      toast.error(error.response?.data?.message || 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                Connection Status
                <ExternalLink 
                  className="w-4 h-4 ml-2 text-gray-400 cursor-pointer hover:text-gray-600" 
                  onClick={() => window.open('https://render.com', '_blank')}
                />
              </h3>
              <p className="text-sm text-gray-600">Deploy and host your applications with Render</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {status?.connected ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{connecting ? 'Connecting...' : 'Connect to Render'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {status?.connected && status?.user_email && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-green-800">Connected as: <strong>{status.user_email}</strong></p>
                {status.owner_name && (
                  <p className="text-green-700">Organization: {status.owner_name}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {!status?.connected ? (
          <div className="text-center py-8">
            <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Connect to Render</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Deploy your applications, manage services, and configure custom domains with Render's powerful hosting platform.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Rocket className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h5 className="font-medium text-gray-900">Easy Deployment</h5>
                <p className="text-sm text-gray-600">Deploy from Git with automatic builds</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h5 className="font-medium text-gray-900">Custom Domains</h5>
                <p className="text-sm text-gray-600">Connect your own domain names</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h5 className="font-medium text-gray-900">Service Management</h5>
                <p className="text-sm text-gray-600">Monitor and manage your services</p>
              </div>
            </div>

            {/* Token Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-2xl mx-auto">
              <div className="flex items-start space-x-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">How to get your Personal Access Token:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Go to <a href="https://dashboard.render.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Render API Keys</a></li>
                    <li>Create a new Personal Access Token</li>
                    <li>Copy the token and paste it below</li>
                    <li>Click "Connect" to validate and store the token</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Token Form */}
            {showTokenForm ? (
              <div className="max-w-md mx-auto space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Access Token *
                  </label>
                  <input
                    type="password"
                    value={tokenForm.token}
                    onChange={(e) => setTokenForm(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="rnd_xxx..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={tokenForm.userEmail}
                    onChange={(e) => setTokenForm(prev => ({ ...prev, userEmail: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleValidateToken}
                    disabled={validatingToken || !tokenForm.token.trim()}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {validatingToken ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{validatingToken ? 'Validating...' : 'Validate'}</span>
                  </button>
                  <button
                    onClick={handleTokenSubmit}
                    disabled={connecting || !tokenForm.token.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>{connecting ? 'Connecting...' : 'Connect'}</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowTokenForm(false);
                    setTokenForm({ token: '', userEmail: '' });
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 mx-auto"
              >
                <Zap className="w-5 h-5" />
                <span>Connect with Personal Access Token</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Services List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Your Services</h4>
                <button
                  onClick={loadServices}
                  disabled={loadingServices}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingServices ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </button>
              </div>

              {loadingServices ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{service.name}</h5>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">Type: {service.type}</span>
                            {service.status && (
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                service.status === 'live' ? 'bg-green-100 text-green-800' :
                                service.status === 'deploy_in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {service.status}
                              </span>
                            )}
                          </div>
                          {service.repo && (
                            <p className="text-sm text-gray-500 mt-1">
                              Repo: {service.repo} ({service.branch || 'main'})
                            </p>
                          )}
                        </div>
                        {service.url && (
                          <button
                            onClick={() => window.open(service.url, '_blank')}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No services found</p>
                  <p className="text-sm text-gray-500">Deploy your first application below</p>
                </div>
              )}
            </div>

            {/* Deployment Form */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Deploy New Application</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repository URL *
                  </label>
                  <input
                    type="url"
                    value={deploymentConfig.repo}
                    onChange={(e) => setDeploymentConfig({...deploymentConfig, repo: e.target.value})}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={deploymentConfig.branch}
                      onChange={(e) => setDeploymentConfig({...deploymentConfig, branch: e.target.value})}
                      placeholder="main"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      value={deploymentConfig.name}
                      onChange={(e) => setDeploymentConfig({...deploymentConfig, name: e.target.value})}
                      placeholder="my-app"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDeploy}
                  disabled={deploying || !deploymentConfig.repo || !deploymentConfig.name}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {deploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  <span>{deploying ? 'Deploying...' : 'Deploy Application'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderIntegration;