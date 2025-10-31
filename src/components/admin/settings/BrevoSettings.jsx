import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Check, X, Send, ExternalLink, RefreshCw } from 'lucide-react';
import brevoAPI from '@/api/brevo';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import FlashMessage from '@/components/storefront/FlashMessage';
import { useAlertTypes } from '@/hooks/useAlert';

export default function BrevoSettings() {
  const { getSelectedStoreId } = useStoreSelection();
  const { showConfirm, AlertComponent } = useAlertTypes();
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testingSend, setTestingSend] = useState(false);
  const [stats, setStats] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

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

  const handleConnect = async () => {
    const storeId = getSelectedStoreId();
    if (!storeId) {
      setFlashMessage({ type: 'error', message: 'No store selected' });
      return;
    }

    try {
      const response = await brevoAPI.initiateOAuth(storeId);
      if (response.success && response.data.authUrl) {
        // Redirect to Brevo OAuth page
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('OAuth init error:', error);
      setFlashMessage({ type: 'error', message: 'Failed to initiate Brevo connection' });
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
                    Connected: {new Date(connectionStatus.config.connected_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
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
                  Refresh Status
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                Connect your Brevo account to send transactional emails (signup, orders, credits).
              </p>
              <Button
                onClick={handleConnect}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect to Brevo
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      {isConnected && (
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
      {isConnected && stats && (
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
      {!isConnected && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Connect Brevo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-800">
            <ol className="list-decimal list-inside space-y-2">
              <li>Click "Connect to Brevo" button above</li>
              <li>Sign in to your Brevo account (or create one for free)</li>
              <li>Authorize Catalyst to send emails on your behalf</li>
              <li>You'll be redirected back with the connection confirmed</li>
            </ol>
            <p className="mt-4">
              <strong>Don't have a Brevo account?</strong> Create one at{' '}
              <a
                href="https://www.brevo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                brevo.com
              </a>{' '}
              (free tier available)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
