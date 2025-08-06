import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Settings,
  ExternalLink,
  Key,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Upload,
  Power,
  Link
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SupabaseKeyConfiguration from '../../../components/Admin/SupabaseKeyConfiguration';

const SupabaseIntegration = ({ storeId: propStoreId }) => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedProject, setExpandedProject] = useState(null);
  const [testingUpload, setTestingUpload] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use provided storeId or get from localStorage
  const storeId = propStoreId || localStorage.getItem('selectedStoreId') || '157d4590-49bf-4b0b-bd77-abe131909528';

  useEffect(() => {
    checkConnectionStatus();
  }, [storeId]);

  const checkConnectionStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/supabase/status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      setConnectionStatus(response.data);
      
      // If connected, fetch projects
      if (response.data.connected) {
        await fetchProjects();
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setConnectionStatus({ 
        connected: false, 
        error: error.response?.data?.message || 'Failed to check status' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/supabase/projects`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      if (response.data.success) {
        setProjects(response.data.projects);
        // Set selected project if one is current
        const currentProject = response.data.projects.find(p => p.isCurrent);
        if (currentProject) {
          setSelectedProject(currentProject);
          setExpandedProject(currentProject.id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/supabase/connect`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      if (response.data.success && response.data.authUrl) {
        // Open OAuth popup
        const popup = window.open(
          response.data.authUrl,
          'supabase-oauth',
          'width=600,height=700,scrollbars=yes'
        );

        // Listen for OAuth success
        const messageHandler = (event) => {
          if (event.data.type === 'supabase-oauth-success') {
            popup?.close();
            window.removeEventListener('message', messageHandler);
            toast.success('Successfully connected to Supabase!');
            checkConnectionStatus();
          } else if (event.data.type === 'supabase-oauth-error') {
            popup?.close();
            window.removeEventListener('message', messageHandler);
            toast.error('Failed to connect: ' + event.data.error);
          }
        };

        window.addEventListener('message', messageHandler);
      }
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Failed to initiate connection');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Supabase?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/supabase/disconnect`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      toast.success('Disconnected from Supabase');
      setConnectionStatus({ connected: false });
      setProjects([]);
      setSelectedProject(null);
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleSelectProject = async (project) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/supabase/select-project`,
        { projectId: project.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      if (response.data.success) {
        toast.success(`Switched to project: ${project.name}`);
        setSelectedProject(project);
        setExpandedProject(project.id);
        await checkConnectionStatus();
      }
    } catch (error) {
      console.error('Error selecting project:', error);
      toast.error('Failed to select project');
    } finally {
      setLoading(false);
    }
  };

  const handleTestUpload = async (projectId) => {
    setTestingUpload(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/supabase/storage/test-upload`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      if (response.data.success) {
        toast.success('Test upload successful!');
        // Refresh to update key status
        await fetchProjects();
      }
    } catch (error) {
      console.error('Test upload error:', error);
      toast.error(error.response?.data?.message || 'Upload test failed');
    } finally {
      setTestingUpload(false);
    }
  };

  const handleRefreshProjects = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleKeyConfigured = async () => {
    // Refresh status and projects after key configuration
    await checkConnectionStatus();
    toast.success('API keys configured successfully!');
  };

  const extractProjectId = (url) => {
    const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : null;
  };

  if (loading && !connectionStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Supabase Integration</h1>
                <p className="text-gray-600 mt-1">Manage your Supabase storage and database connections</p>
              </div>
            </div>
            
            {connectionStatus?.connected && (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center"
              >
                <Power className="h-4 w-4 mr-2" />
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {connectionStatus?.connected ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold text-green-800">Connected</p>
                    {connectionStatus.userEmail && (
                      <p className="text-sm text-gray-600 mt-1">
                        Account: {connectionStatus.userEmail}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-700">Not Connected</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Connect your Supabase account to enable storage and database features
                    </p>
                  </div>
                </>
              )}
            </div>

            {!connectionStatus?.connected && (
              <button
                onClick={handleConnect}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Link className="h-4 w-4 mr-2" />
                Connect Supabase
              </button>
            )}
          </div>
        </div>

        {/* Projects Section */}
        {connectionStatus?.connected && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Projects</h2>
              <button
                onClick={handleRefreshProjects}
                disabled={refreshing}
                className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No projects found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a project in your Supabase dashboard first
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => {
                  const isExpanded = expandedProject === project.id;
                  const isSelected = project.isCurrent;
                  const currentProjectId = extractProjectId(connectionStatus.projectUrl);
                  const isCurrentProject = project.id === currentProjectId;
                  
                  return (
                    <div
                      key={project.id}
                      className={`border rounded-lg transition-all ${
                        isCurrentProject ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      {/* Project Header */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <button
                              onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                              className="mr-2 text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                            
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-semibold">{project.name}</h3>
                                {isCurrentProject && (
                                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    Current
                                  </span>
                                )}
                                {project.status === 'INACTIVE' && (
                                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {project.id} • {project.region}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Key Configuration Status */}
                            {project.hasKeysConfigured ? (
                              <div className="flex items-center text-green-600">
                                <Key className="h-4 w-4 mr-1" />
                                <span className="text-sm">Keys Configured</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-amber-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">Keys Required</span>
                              </div>
                            )}

                            {/* Select Project Button */}
                            {!isCurrentProject && (
                              <button
                                onClick={() => handleSelectProject(project)}
                                disabled={loading || project.status === 'INACTIVE'}
                                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                                  project.status === 'INACTIVE'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                Select Project
                              </button>
                            )}

                            {/* External Link */}
                            <a
                              href={`https://supabase.com/dashboard/project/${project.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - Key Configuration */}
                      {isExpanded && (
                        <div className="border-t px-4 py-4 bg-gray-50">
                          {isCurrentProject ? (
                            <>
                              {!project.hasKeysConfigured || connectionStatus.requiresManualConfiguration ? (
                                <div>
                                  <div className="mb-4">
                                    <h4 className="font-semibold mb-2 flex items-center">
                                      <Key className="h-4 w-4 mr-2" />
                                      Configure API Keys for This Project
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                      Each Supabase project requires its own API keys for storage operations.
                                    </p>
                                  </div>
                                  <SupabaseKeyConfiguration 
                                    storeId={storeId}
                                    projectId={project.id}
                                    onConfigured={handleKeyConfigured}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center">
                                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                      <div>
                                        <p className="text-green-800 font-medium">Storage Ready</p>
                                        <p className="text-green-600 text-sm mt-1">
                                          API keys are configured for this project. Storage operations are enabled.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Test Upload Button */}
                                  <div className="flex items-center justify-between">
                                    <button
                                      onClick={() => handleTestUpload(project.id)}
                                      disabled={testingUpload}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                                    >
                                      {testingUpload ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Upload className="h-4 w-4 mr-2" />
                                      )}
                                      Test Storage Upload
                                    </button>

                                    <button
                                      onClick={() => setExpandedProject(null)}
                                      className="text-sm text-gray-600 hover:text-gray-800"
                                    >
                                      Reconfigure Keys
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-600 mb-3">
                                Select this project to configure its API keys
                              </p>
                              {project.hasKeysConfigured && (
                                <p className="text-sm text-green-600">
                                  ✓ This project already has API keys configured
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        {!connectionStatus?.connected && (
          <div className="p-6 bg-blue-50 border-t">
            <h3 className="font-semibold text-blue-900 mb-3">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Click "Connect Supabase" to authorize access</li>
              <li>Select a project from your Supabase account</li>
              <li>Configure API keys for the selected project</li>
              <li>Start using Supabase storage and database features</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseIntegration;