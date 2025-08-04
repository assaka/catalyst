import React, { useState, useEffect } from 'react';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAlertTypes } from '@/hooks/useAlert';
import {
  Cloud,
  Link,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  AlertTriangle,
  Info,
  DollarSign
} from 'lucide-react';

const CloudflareCDN = () => {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const { showError, showSuccess, showInfo, AlertComponent } = useAlertTypes();
  
  // State management
  const [oauthStatus, setOauthStatus] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      loadOAuthStatus();
    }
  }, [selectedStore]);

  const loadOAuthStatus = async () => {
    try {
      setLoadingStatus(true);
      const storeId = getSelectedStoreId();
      
      const response = await fetch(`/api/cloudflare/oauth/status/${storeId}`);
      const data = await response.json();
      
      if (data.success) {
        setOauthStatus(data);
        if (data.zones) {
          setZones(data.zones);
        }
      } else {
        setOauthStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error loading OAuth status:', error);
      setOauthStatus({ connected: false });
    } finally {
      setLoadingStatus(false);
    }
  };

  const connectCloudflare = async () => {
    try {
      setConnecting(true);
      const storeId = getSelectedStoreId();
      
      const response = await fetch('/api/cloudflare/oauth/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ store_id: storeId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Redirect to Cloudflare OAuth
        window.location.href = data.auth_url;
      } else {
        showError('Failed to initialize Cloudflare connection: ' + data.message);
      }
    } catch (error) {
      showError('Error connecting to Cloudflare: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectCloudflare = async () => {
    try {
      const storeId = getSelectedStoreId();
      
      const response = await fetch('/api/cloudflare/oauth/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ store_id: storeId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Cloudflare connection disconnected successfully');
        setOauthStatus({ connected: false });
        setZones([]);
        setSelectedZone('');
      } else {
        showError('Failed to disconnect: ' + data.message);
      }
    } catch (error) {
      showError('Error disconnecting: ' + error.message);
    }
  };

  const updateZoneSelection = async () => {
    try {
      const storeId = getSelectedStoreId();
      
      const response = await fetch('/api/cloudflare/oauth/update-zone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: storeId,
          zone_id: selectedZone
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Zone selection updated successfully');
        loadOAuthStatus();
      } else {
        showError('Failed to update zone: ' + data.message);
      }
    } catch (error) {
      showError('Error updating zone: ' + error.message);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      const storeId = getSelectedStoreId();
      
      const response = await fetch('/api/cloudflare/oauth/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ store_id: storeId })
      });
      
      const data = await response.json();
      setTestResults(data);
      
      if (data.success) {
        showSuccess('Connection test completed successfully!');
      } else {
        showError('Connection test failed: ' + data.message);
      }
    } catch (error) {
      showError('Error testing connection: ' + error.message);
      setTestResults({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  // Check URL parameters for OAuth callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const zones = urlParams.get('zones');
    const userEmail = urlParams.get('user_email');
    
    if (success === 'true') {
      showSuccess(`Successfully connected to Cloudflare! Found ${zones} zone(s) for ${userEmail}`);
      loadOAuthStatus();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      showError(`Connection failed: ${decodeURIComponent(error)}`);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getStatusIcon = (connected) => {
    return connected ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  if (!selectedStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a store to configure Cloudflare CDN</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cloudflare CDN</h1>
          <p className="text-gray-600 mt-1">Free global CDN for faster image delivery</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadOAuthStatus}
            variant="outline"
            disabled={loadingStatus}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingStatus ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Benefits Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Why Use Cloudflare CDN?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Global Delivery</h4>
                <p className="text-sm text-gray-600">200+ edge locations worldwide for faster loading</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">Free Plan Available</h4>
                <p className="text-sm text-gray-600">Unlimited bandwidth at no cost</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Security & Performance</h4>
                <p className="text-sm text-gray-600">DDoS protection and automatic optimization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingStatus ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading connection status...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(oauthStatus?.connected)}
                      <span className="font-medium">
                        {oauthStatus?.connected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    {oauthStatus?.connected && (
                      <p className="text-sm text-gray-600 mt-1">
                        {oauthStatus.user_info?.email} • {oauthStatus.zones?.length || 0} zone(s)
                      </p>
                    )}
                  </div>
                  
                  {oauthStatus?.connected ? (
                    <Button
                      onClick={disconnectCloudflare}
                      variant="outline"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      onClick={connectCloudflare}
                      disabled={connecting}
                    >
                      {connecting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Connect Cloudflare
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {oauthStatus?.connected && (
                  <>
                    <Separator />
                    
                    {/* Zone Selection */}
                    <div className="space-y-3">
                      <Label>Select Zone (Domain)</Label>
                      {zones.length > 0 ? (
                        <div className="flex gap-2">
                          <Select
                            value={selectedZone}
                            onValueChange={setSelectedZone}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a zone..." />
                            </SelectTrigger>
                            <SelectContent>
                              {zones.map((zone) => (
                                <SelectItem key={zone.id} value={zone.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{zone.name}</span>
                                    <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                                      {zone.status}
                                    </Badge>
                                    {zone.plan && (
                                      <Badge variant="outline">{zone.plan}</Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            onClick={updateZoneSelection}
                            disabled={!selectedZone}
                          >
                            Update
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                          <p>No zones found in your Cloudflare account</p>
                          <p className="text-sm">Add a domain to Cloudflare first</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={testConnection}
              disabled={testing || !oauthStatus?.connected}
              className="w-full"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            
            {!oauthStatus?.connected && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Connect to Cloudflare first to test
              </div>
            )}
            
            {testResults && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(testResults.success)}
                  <span className="font-medium">
                    {testResults.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>
                
                {testResults.success && testResults.connection_test && (
                  <div className="space-y-2 text-sm">
                    <div>Status: {testResults.connection_test.status}</div>
                    <div>Email: {testResults.connection_test.user_email}</div>
                    <div>Zones: {testResults.connection_test.zones_count}</div>
                    <div>Token Expires: {new Date(testResults.connection_test.token_expires).toLocaleDateString()}</div>
                  </div>
                )}
                
                {!testResults.success && (
                  <p className="text-red-600 text-sm mt-2">{testResults.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Method 1: Basic Setup (Free)</h4>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                <li>Add your domain to Cloudflare (free account)</li>
                <li>Update your DNS nameservers to Cloudflare's</li>
                <li>Set <code>CLOUDFLARE_CDN_DOMAIN</code> in your environment</li>
                <li>Images will automatically use Cloudflare's global CDN</li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Method 2: OAuth Setup (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-1 text-green-800 text-sm">
                <li>Complete basic setup above</li>
                <li>Configure OAuth credentials in your environment</li>
                <li>Click "Connect Cloudflare" above to authenticate</li>
                <li>Enables advanced features like cache purging and analytics</li>
              </ol>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Pro Features (Paid Plans)</h4>
              <ul className="list-disc list-inside space-y-1 text-purple-800 text-sm">
                <li>Image Resizing: Automatic thumbnails and variants</li>
                <li>Polish: Automatic image optimization (WebP, AVIF)</li>
                <li>Advanced caching rules and page rules</li>
                <li>Better analytics and performance insights</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertComponent />
    </div>
  );
};

export default CloudflareCDN;