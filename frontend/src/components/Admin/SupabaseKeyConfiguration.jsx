import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Key, 
  CheckCircle, 
  ExternalLink, 
  Copy,
  ArrowRight,
  Info
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SupabaseKeyConfiguration = ({ storeId, projectId, onConfigured }) => {
  const [anonKey, setAnonKey] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [showServiceRole, setShowServiceRole] = useState(false);

  useEffect(() => {
    fetchCurrentStatus();
  }, [storeId]);

  const fetchCurrentStatus = async () => {
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

      if (response.data.success) {
        setCurrentConfig(response.data);
        setProjectUrl(response.data.projectUrl || '');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleSaveKeys = async () => {
    if (!anonKey && !serviceRoleKey) {
      toast.error('Please provide at least the anon key');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/supabase/update-config`,
        {
          projectId: projectId,
          anonKey: anonKey || undefined,
          serviceRoleKey: serviceRoleKey || undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-store-id': storeId
          }
        }
      );

      if (response.data.success) {
        toast.success('API keys configured successfully!');
        setAnonKey('');
        setServiceRoleKey('');
        
        // Refresh status
        await fetchCurrentStatus();
        
        // Notify parent component
        if (onConfigured) {
          onConfigured();
        }
      }
    } catch (error) {
      console.error('Error saving keys:', error);
      toast.error(error.response?.data?.message || 'Failed to save API keys');
    } finally {
      setLoading(false);
    }
  };

  const extractProjectId = (url) => {
    const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : null;
  };

  const projectId = extractProjectId(projectUrl);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Check if keys are already configured
  const hasAnonKey = currentConfig?.hasAnonKey;
  const hasServiceKey = currentConfig?.hasServiceRoleKey;
  const isFullyConfigured = hasAnonKey;

  // Always show the configuration form for now to allow reconfiguration
  // Remove this condition temporarily to debug the issue
  /*
  if (isFullyConfigured && !currentConfig?.requiresManualConfiguration) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <p className="text-green-800 font-medium">Storage Ready</p>
            <p className="text-green-600 text-sm mt-1">
              API keys are configured. You can now upload images to Supabase Storage.
            </p>
          </div>
        </div>
      </div>
    );
  }
  */

  return (
    <div className="space-y-6">
      {/* Show current status if keys are configured */}
      {isFullyConfigured && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-green-800 font-medium">Keys Already Configured</p>
                <p className="text-green-600 text-sm mt-1">
                  You can reconfigure the keys below if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-amber-800 font-medium">Manual Configuration Required</h3>
            <p className="text-amber-700 text-sm mt-1">
              Supabase doesn't provide API keys through OAuth. You need to copy them from your Supabase dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-step Instructions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          Configure API Keys
        </h3>

        {/* Current Project Info */}
        {(projectUrl || projectId) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Configuring Project:</p>
            <div className="flex items-center justify-between">
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {projectId || extractProjectId(projectUrl)}
              </code>
              <a
                href={`https://supabase.com/dashboard/project/${projectId || extractProjectId(projectUrl)}/settings/api`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
              >
                Open in Supabase
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              1
            </div>
            <div className="ml-3 flex-1">
              <p className="text-gray-700">
                Go to your{' '}
                <a
                  href={projectId ? `https://supabase.com/dashboard/project/${projectId}/settings/api` : 'https://supabase.com/dashboard'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  Supabase Dashboard
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              2
            </div>
            <div className="ml-3">
              <p className="text-gray-700">Navigate to <strong>Settings → API</strong></p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              3
            </div>
            <div className="ml-3">
              <p className="text-gray-700">
                Copy the <strong>anon</strong> key (public key)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This key starts with "eyJ..."
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              4
            </div>
            <div className="ml-3">
              <p className="text-gray-700">Paste it below and save</p>
            </div>
          </div>
        </div>

        {/* Key Input Fields */}
        <div className="space-y-4">
          {/* Anon Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anon Key (Required) {hasAnonKey && <span className="text-green-600">✓ Configured</span>}
            </label>
            <div className="relative">
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              {anonKey && (
                <button
                  onClick={() => copyToClipboard(anonKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is the public API key used for client-side operations
            </p>
          </div>

          {/* Service Role Key (Optional) */}
          <div>
            <button
              onClick={() => setShowServiceRole(!showServiceRole)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center mb-2"
            >
              {showServiceRole ? '−' : '+'} Advanced: Service Role Key (Optional)
            </button>
            
            {showServiceRole && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Role Key {hasServiceKey && <span className="text-green-600">✓ Configured</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={serviceRoleKey}
                    onChange={(e) => setServiceRoleKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  {serviceRoleKey && (
                    <button
                      onClick={() => copyToClipboard(serviceRoleKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-800 flex items-start">
                    <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    Keep this key secret! It has admin privileges. Only add if you need server-side operations.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveKeys}
            disabled={loading || (!anonKey && !serviceRoleKey)}
            className={`
              w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center
              ${loading || (!anonKey && !serviceRoleKey)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                Save API Keys
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Why is this needed?</p>
            <p>
              Supabase Storage requires JWT-based API keys for authentication. 
              These keys can't be retrieved through OAuth, so they must be manually 
              configured from your Supabase dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseKeyConfiguration;