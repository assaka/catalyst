import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Check, X, Send, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import brevoAPI from '@/api/brevo';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import FlashMessage from '@/components/storefront/FlashMessage';
import { useAlertTypes } from '@/hooks/useAlert';

// Email provider configurations
const EMAIL_PROVIDERS = {
  brevo: {
    id: 'brevo',
    name: 'Brevo',
    description: 'Powerful email marketing and transactional email service',
    logo: '📧',
    color: 'from-blue-500 to-blue-600',
    available: true,
    features: ['Transactional Emails', 'Email Templates', 'Analytics', 'Free tier: 300 emails/day'],
    setupUrl: 'https://app.brevo.com/settings/keys/api'
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'All-in-one CRM and email marketing platform',
    logo: '🟠',
    color: 'from-orange-500 to-orange-600',
    available: false,
    features: ['CRM Integration', 'Marketing Automation', 'Advanced Analytics', 'Lead Scoring'],
    comingSoon: true
  },
  mailchimp: {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Popular email marketing and automation platform',
    logo: '🐵',
    color: 'from-yellow-500 to-yellow-600',
    available: false,
    features: ['Email Campaigns', 'Marketing Automation', 'Audience Segmentation', 'A/B Testing'],
    comingSoon: true
  }
};

export default function EmailProviderSettings({ storeEmail, storeName }) {
  const { getSelectedStoreId } = useStoreSelection();
  const { showConfirm, AlertComponent } = useAlertTypes();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testingSend, setTestingSend] = useState(false);
  const [showTestSection, setShowTestSection] = useState(false);
  const [stats, setStats] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  // Brevo configuration form
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
        if (response.data.isConfigured) {
          setSelectedProvider('brevo');
        }
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

  const handleProviderSelect = (providerId) => {
    const provider = EMAIL_PROVIDERS[providerId];
    if (!provider.available) {
      setFlashMessage({ type: 'info', message: `${provider.name} integration coming soon!` });
      return;
    }
    setSelectedProvider(providerId);
    setShowConfig(true);

    // Pre-fill sender name and email from store if not already configured
    if (!connectionStatus?.isConfigured && storeName && !senderName) {
      setSenderName(storeName);
    }
    if (!connectionStatus?.isConfigured && storeEmail && !senderEmail) {
      setSenderEmail(storeEmail);
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
        setApiKey('');
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
        setSelectedProvider(null);
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

  const handleOpenTestSection = () => {
    if (!storeEmail) {
      setFlashMessage({ type: 'error', message: 'Store email not configured. Please add it in the Contact tab first.' });
      return;
    }
    setTestEmail(storeEmail);
    setShowTestSection(true);
    // Focus on the email input after a short delay
    setTimeout(() => {
      document.getElementById('test-email')?.focus();
    }, 100);
  };

  const isBrevoConnected = connectionStatus?.isConfigured && connectionStatus?.config?.is_active;

  return (
    <div className="space-y-6">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
      <AlertComponent />

      {/* Email Provider Selection */}
      {!selectedProvider && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Select Email Provider</h3>
            <p className="text-sm text-gray-600">Choose your email service provider to send transactional emails</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(EMAIL_PROVIDERS).map((provider) => (
              <Card
                key={provider.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  provider.available ? 'hover:border-blue-400' : 'opacity-75'
                } ${selectedProvider === provider.id ? 'border-blue-500 border-2' : ''}`}
                onClick={() => handleProviderSelect(provider.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${provider.color} rounded-lg flex items-center justify-center text-2xl`}>
                        {provider.logo}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                      </div>
                    </div>
                    {provider.comingSoon && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                        Coming Soon
                      </Badge>
                    )}
                    {provider.id === 'brevo' && isBrevoConnected && (
                      <Badge className="bg-green-500 text-xs">
                        <Check className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{provider.description}</p>
                  <ul className="space-y-1">
                    {provider.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {provider.available && (
                    <Button
                      className="w-full mt-4"
                      variant={isBrevoConnected ? 'outline' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProviderSelect(provider.id);
                      }}
                    >
                      {isBrevoConnected ? 'Manage' : 'Configure'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Brevo Configuration */}
      {selectedProvider === 'brevo' && (
        <>
          {/* Back Button */}
          <Button variant="outline" size="sm" onClick={() => setSelectedProvider(null)}>
            ← Back to Providers
          </Button>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl">
                    📧
                  </div>
                  <CardTitle>Brevo Email Service</CardTitle>
                </div>
                {loading ? (
                  <Badge variant="outline">Loading...</Badge>
                ) : isBrevoConnected ? (
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
              {isBrevoConnected ? (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-green-600" />
                      <p className="font-medium text-green-900">Email service is active</p>
                    </div>
                    <div className="space-y-1 text-sm text-green-800">
                      <p><strong>Sender Name:</strong> {connectionStatus.config.sender_name}</p>
                      <p><strong>Sender Email:</strong> {connectionStatus.config.sender_email}</p>
                      {connectionStatus.config.created_at && (
                        <p className="text-xs text-green-600">
                          Connected: {new Date(connectionStatus.config.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {storeEmail && (
                      <Button
                        onClick={handleOpenTestSection}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Test to {storeEmail}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowConfig(true);
                        // Keep existing values when updating
                        if (connectionStatus?.config) {
                          setSenderName(connectionStatus.config.sender_name || storeName || '');
                          setSenderEmail(connectionStatus.config.sender_email || storeEmail || '');
                        }
                      }}
                    >
                      Update Configuration
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDisconnect}
                      className="text-red-600 hover:text-red-700"
                    >
                      Disconnect
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
                    onClick={() => {
                      setShowConfig(true);
                      // Pre-fill with store data
                      if (storeName && !senderName) setSenderName(storeName);
                      if (storeEmail && !senderEmail) setSenderEmail(storeEmail);
                    }}
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
                    placeholder={storeName || "Your Store Name"}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Pre-filled with your store name. Change if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder={storeEmail || "noreply@yourdomain.com"}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Pre-filled with your store contact email. Change if needed.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                    <p className="text-xs text-blue-800">
                      <strong>Important:</strong> If this email is not yet verified in your Brevo account,
                      Brevo will send a verification email to this address. You must click the verification
                      link in that email before you can send emails from this address.
                    </p>
                  </div>
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

          {/* Test Email - Hidden by default, shown when green button clicked */}
          {isBrevoConnected && !showConfig && showTestSection && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Test Email Connection</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTestSection(false)}
                  >
                    Hide
                  </Button>
                </CardTitle>
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
                      className="bg-green-600 hover:bg-green-700"
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
                    Email is pre-filled with your store email. You can change it to test with a different address.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Statistics */}
          {isBrevoConnected && stats && !showConfig && (
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
          {!isBrevoConnected && !showConfig && (
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
                  <li>Enter sender email - <strong>Brevo will send a verification email</strong> if not already verified</li>
                  <li>Check your inbox and verify the sender email before sending test emails</li>
                </ol>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900 text-sm mb-1">Sender Email Verification Required</p>
                      <p className="text-xs text-yellow-800">
                        When you enter a sender email, Brevo will send a verification email to that address.
                        You must click the verification link in that email before you can send emails.
                        Check your spam folder if you don't receive it within a few minutes.
                      </p>
                    </div>
                  </div>
                </div>
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
        </>
      )}
    </div>
  );
}
