import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Check, X, Send, RefreshCw, ExternalLink } from 'lucide-react';
import brevoAPI from '@/api/brevo';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import FlashMessage from '@/components/storefront/FlashMessage';
import { useAlertTypes } from '@/hooks/useAlert';

export default function BrevoSettings({ storeEmail }) {
  const { getSelectedStoreId } = useStoreSelection();
  const { showConfirm, AlertComponent } = useAlertTypes();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testingSend, setTestingSend] = useState(false);
  const [testingStoreEmail, setTestingStoreEmail] = useState(false);
  const [stats, setStats] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  // Configuration form
  const [apiKey, setApiKey] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
    loadEmailStats();
  }, []);

  const loadConnectionStatus = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) return;

    setLoading(true);
    try {
      const response = await brevoAPI.getConnectionStatus(storeId);
      if (response.success) {
        setConnectionStatus(response.data);
        if (response.data.config) {
          setSenderName(response.data.config.sender_name || '');
          setSenderEmail(response.data.config.sender_email || '');
        }
      }
    } catch (error) {
      console.error('Error loading Brevo status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailStats = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) return;

    try {
      const response = await brevoAPI.getEmailStatistics(storeId, 30);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading email stats:', error);
    }
  };

  const handleSaveConfiguration = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      setFlashMessage({ type: 'error', message: 'No store selected' });
      return;
    }

    if (!apiKey || !senderName || !senderEmail) {
      setFlashMessage({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    setSaving(true);
    try {
      const response = await brevoAPI.saveConfiguration(storeId, apiKey, senderName, senderEmail);
      if (response.success) {
        setFlashMessage({ type: 'success', message: 'Brevo configured successfully!' });
        setShowConfig(false);
        setApiKey(''); // Clear API key from form
        loadConnectionStatus();
      }
    } catch (error) {
      console.error('Save config error:', error);
      setFlashMessage({ type: 'error', message: error.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) return;

    const confirmed = await showConfirm(
      "Are you sure you want to disconnect Brevo? Email sending will be disabled.",
      "Disconnect Brevo"
    );

    if (confirmed) {
      try {
        await brevoAPI.disconnect(storeId);
        setFlashMessage({ type: 'success', message: 'Brevo disconnected successfully' });
        setShowConfig(false);
        loadConnectionStatus();
      } catch (error) {
        console.error('Disconnect error:', error);
        setFlashMessage({ type: 'error', message: 'Failed to disconnect Brevo' });
      }
    }
  };

  const handleTestConnection = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId || !testEmail) {
      setFlashMessage({ type: 'error', message: 'Please enter a test email address' });
      return;
    }

    setTestingSend(true);
    try {
      const response = await brevoAPI.testConnection(storeId, testEmail);
      if (response.success) {
        setFlashMessage({ type: 'success', message: 'Test email sent successfully! Check your inbox.' });
        setTestEmail('');
      } else {
        setFlashMessage({ type: 'error', message: `Test failed: ${response.message}` });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setFlashMessage({ type: 'error', message: 'Failed to send test email' });
    } finally {
      setTestingSend(false);
    }
  };

  const handleTestToStoreEmail = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId || !storeEmail) {
      setFlashMessage({ type: 'error', message: 'Store email not configured. Please add it in the Contact tab.' });
      return;
    }

    setTestingStoreEmail(true);
    try {
      const response = await brevoAPI.testConnection(storeId, storeEmail);
      if (response.success) {
        setFlashMessage({ type: 'success', message: `Test email sent to ${storeEmail}! Check your inbox.` });
      } else {
        setFlashMessage({ type: 'error', message: `Test failed: ${response.message}` });
      }
    } catch (error) {
      console.error('Test to store email error:', error);
      setFlashMessage({ type: 'error', message: 'Failed to send test email' });
    } finally {
      setTestingStoreEmail(false);
    }
  };

  const isConnected = connectionStatus?.isConfigured && connectionStatus?.config?.is_active;

  return (
    <div className="space-y-6">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <AlertComponent />

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Brevo Email Service</CardTitle>
            {loading ? (
              <Badge variant="outline">Loading...</Badge>
            ) : isConnected ? (
              <Badge className="bg-green-500">
                <Check className="w-3 h-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <X className="w-3 h-3 mr-1" /> Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-900">Email service is active</p>
                </div>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Sender Name:</strong> {connectionStatus.config.sender_name}</p>
                  <p><strong>Sender Email:</strong> {connectionStatus.config.sender_email}</p>
                  <p className="text-xs text-green-600">
                    Connected: {new Date(connectionStatus.config.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {storeEmail && (
                  <Button
                    onClick={handleTestToStoreEmail}
                    disabled={testingStoreEmail}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {testingStoreEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test to {storeEmail}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowConfig(true)}
                >
                  Update Configuration
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="text-red-600 hover:text-red-700"
                >
                  Disconnect Brevo
                </Button>
                <Button
                  variant="outline"
                  onClick={loadConnectionStatus}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                Configure your Brevo API key to send transactional emails (signup, orders, credits).
              </p>
              <Button
                onClick={() => setShowConfig(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                Configure Brevo
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuration Form */}
      {showConfig && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Brevo API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Brevo API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="xkeysib-..."
                required
              />
              <p className="text-xs text-gray-500">
                Get your API key from{' '}
                <a
                  href="https://app.brevo.com/settings/keys/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Brevo Settings > API Keys
                  <ExternalLink className="w-3 h-3 inline ml-1" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name</Label>
              <Input
                id="sender-name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Store Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-email">Sender Email</Label>
              <Input
                id="sender-email"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="noreply@yourdomain.com"
                required
              />
              <p className="text-xs text-gray-500">
                This email must be verified in your Brevo account
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSaveConfiguration}
                disabled={saving || !apiKey || !senderName || !senderEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfig(false);
                  setApiKey('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Email */}
      {isConnected && !showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Test Email Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Send Test Email To:</Label>
              <div className="flex gap-2">
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleTestConnection}
                  disabled={!testEmail || testingSend}
                >
                  {testingSend ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                This will send a test email to verify your Brevo connection is working.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Statistics */}
      {isConnected && stats && !showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Email Statistics (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
                <p className="text-sm text-gray-600">Total Sent</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.sent || 0}</p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.opened || 0}</p>
                <p className="text-sm text-gray-600">Opened</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {!isConnected && !showConfig && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Get Your Brevo API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Sign in to your Brevo account at{' '}
                <a href="https://app.brevo.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  app.brevo.com
                </a>
              </li>
              <li>Go to Settings → API Keys (or click{' '}
                <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  here
                </a>)
              </li>
              <li>Click "Generate a new API key"</li>
              <li>Copy the API key (starts with "xkeysib-")</li>
              <li>Click "Configure Brevo" above and paste your API key</li>
            </ol>
            <div className="mt-4 p-3 bg-white border border-blue-300 rounded">
              <p className="font-medium text-blue-900 mb-2">Don't have a Brevo account?</p>
              <p className="mb-2">Create a free account at{' '}
                <a
                  href="https://www.brevo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  brevo.com
                </a>
              </p>
              <p className="text-xs text-blue-700">Free tier includes 300 emails/day</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
