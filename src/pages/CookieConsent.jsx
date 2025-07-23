
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CookieConsentSettings } from '@/api/entities';
import { User } from '@/api/entities';
import { Store } from '@/api/entities';
import { useStoreSelection } from '@/contexts/StoreSelectionContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Shield, Eye, Settings, BarChart3, Plus, Trash2, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryApiCall = async (apiCall, maxRetries = 5, baseDelay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await delay(Math.random() * 1000 + 500);
      return await apiCall();
    } catch (error) {
      const isRateLimit = error.response?.status === 429 ||
                         error.message?.includes('Rate limit') ||
                         error.message?.includes('429');

      if (isRateLimit && i < maxRetries - 1) {
        const delayTime = baseDelay * Math.pow(2, i) + Math.random() * 2000;
        console.warn(`CookieConsent: Rate limit hit, retrying in ${delayTime}ms...`);
        await delay(delayTime);
        continue;
      }
      throw error;
    }
  }
};

export default function CookieConsent() {
  const { selectedStore, getSelectedStoreId } = useStoreSelection();
  const [settings, setSettings] = useState(null);
  const [consentLogs, setConsentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [store, setStore] = useState(null);
  const [user, setUser] = useState(null); // Added user state

  useEffect(() => {
    if (selectedStore) {
      loadData();
    }
  }, [selectedStore]);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => {
        setFlashMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!selectedStore) {
        setStore(null);
        setSettings(null);
        setLoading(false);
        return;
      }
      
      console.log('Using store:', selectedStore.name);
      setStore(selectedStore);
      
      // Load cookie consent settings
      const cookieSettings = await retryApiCall(() => CookieConsentSettings.filter({ store_id: selectedStore.id }));
      console.log('Found cookie settings:', cookieSettings?.length || 0);
      
      if (cookieSettings && cookieSettings.length > 0) {
        // Ensure settings has all required properties
        const loadedSettings = {
          ...cookieSettings[0],
          categories: cookieSettings[0].categories || [
            {
              id: "necessary",
              name: "Necessary Cookies",
              description: "These cookies are necessary for the website to function and cannot be switched off.",
              required: true,
              default_enabled: true
            },
            {
              id: "analytics",
              name: "Analytics Cookies", 
              description: "These cookies help us understand how visitors interact with our website.",
              required: false,
              default_enabled: false
            },
            {
              id: "marketing",
              name: "Marketing Cookies",
              description: "These cookies are used to deliver personalized advertisements.",
              required: false,
              default_enabled: false
            }
          ]
        };
        setSettings(loadedSettings);
      } else {
        // Create default settings with valid store_id
        const defaultSettings = {
          store_id: selectedStore.id,
          enabled: false,
          gdpr_mode: true,
          auto_detect_country: true,
          gdpr_countries: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
          banner_message: "We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
          accept_all_text: "Accept All",
          reject_all_text: "Reject All",
          manage_preferences_text: "Manage Preferences",
          privacy_policy_text: "Privacy Policy",
          privacy_policy_url: "/privacy-policy",
          banner_position: "bottom",
          show_close_button: true,
          consent_expiry_days: 365,
          categories: [
            {
              id: "essential",
              name: "Essential Cookies",
              description: "These cookies are necessary for the website to function and cannot be switched off.",
              required: true,
              default_enabled: true
            },
            {
              id: "analytics",
              name: "Analytics Cookies", 
              description: "These cookies help us understand how visitors interact with our website.",
              required: false,
              default_enabled: false
            },
            {
              id: "marketing",
              name: "Marketing Cookies",
              description: "These cookies are used to deliver personalized advertisements.",
              required: false,
              default_enabled: false
            }
          ],
          google_analytics_id: "",
          google_tag_manager_id: "",
          custom_css: "",
          audit_enabled: true
        };
        setSettings(defaultSettings);
      }
      
      // Note: Consent logs functionality not implemented yet
      setConsentLogs([]);
      
    } catch (error) {
      console.error('Failed to load cookie consent data:', error);
      setFlashMessage({ type: 'error', message: 'Failed to load cookie consent settings.' });
      setStore(null);
      setSettings(null);
      setConsentLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if settings or store are null, or if store doesn't have an ID (which is required for saving)
    const storeId = getSelectedStoreId();
    console.log('🍪 Cookie consent save DEBUG:', {
      hasSettings: !!settings,
      storeId,
      settingsId: settings?.id,
      settingsKeys: settings ? Object.keys(settings) : [],
      settingsStoreId: settings?.store_id
    });
    
    if (!settings || !storeId) {
      console.log('❌ Cookie consent save failed: missing settings or store ID');
      setFlashMessage({ type: 'error', message: 'Settings not loaded or no store found. Cannot save.' });
      return;
    }
    
    setSaving(true);
    
    try {
      console.log('🔄 Saving cookie consent settings...', {
        isUpdate: !!settings.id,
        settingsData: settings
      });
      
      if (settings.id) {
        console.log('🔄 Updating existing cookie consent settings:', settings.id);
        await retryApiCall(() => CookieConsentSettings.update(settings.id, settings));
        console.log('✅ Cookie consent settings updated successfully');
      } else {
        console.log('✨ Creating new cookie consent settings');
        // If settings.id is null, it's a new setting. The store_id should already be populated from loadData's defaultSettings.
        const created = await retryApiCall(() => CookieConsentSettings.create(settings));
        console.log('✅ Cookie consent settings created:', created);
        setSettings({ ...settings, id: created.id });
      }
      
      setFlashMessage({ type: 'success', message: 'Cookie consent settings saved successfully!' });
      
    } catch (error) {
      console.error('❌ Failed to save cookie consent settings:', error);
      console.error('Error details:', error.message);
      console.error('Error response:', error.response);
      setFlashMessage({ type: 'error', message: `Failed to save settings: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...settings.categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };
    setSettings({ ...settings, categories: updatedCategories });
  };

  const addCategory = () => {
    const newCategory = {
      id: `custom_${Date.now()}`,
      name: "New Category",
      description: "Description for new category",
      required: false,
      default_enabled: false
    };
    setSettings({
      ...settings,
      categories: [...settings.categories, newCategory]
    });
  };

  const removeCategory = (index) => {
    const updatedCategories = settings.categories.filter((_, i) => i !== index);
    setSettings({ ...settings, categories: updatedCategories });
  };

  const exportConsentLogs = () => {
    const csvContent = [
      ['Date', 'User ID', 'Session ID', 'IP Address', 'Consent Given', 'Categories', 'Country', 'Method', 'Page URL'].join(','),
      ...consentLogs.map(log => [
        new Date(log.created_date).toISOString(),
        log.user_id || '',
        log.session_id || '',
        log.ip_address || '',
        log.consent_given ? 'Yes' : 'No',
        log.categories_accepted.join(';'),
        log.country_code || '',
        log.consent_method || '',
        log.page_url || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-consent-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // This block handles cases where no store is found or data loading failed,
  // preventing further rendering with null settings/store.
  if (!store || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700">
        <Card className="w-full max-w-lg text-center p-8">
            <CardHeader>
                <CardTitle className="text-2xl">No Store Found</CardTitle>
                <CardDescription className="text-base">
                    Please ensure you have a store set up to use Cookie Consent features.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {user?.account_type === 'agency' && (
                    <Link to={createPageUrl('Stores')}>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Store
                        </Button>
                    </Link>
                )}
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {flashMessage && (
          <div 
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-50 transition-opacity duration-300 ${flashMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {flashMessage.message}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cookie Consent & GDPR</h1>
          <p className="text-gray-600 mt-1">Manage cookie consent, GDPR compliance, and user privacy preferences</p>
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-6">
            <div className="grid gap-6">
              <Card className="material-elevation-1 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    General Settings
                  </CardTitle>
                  <CardDescription>Basic cookie consent and GDPR configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enabled" className="text-base font-medium">Enable Cookie Consent</Label>
                      <p className="text-sm text-gray-500">Show cookie consent banner to visitors</p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={settings.enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="gdpr_mode" className="text-base font-medium">GDPR Compliance Mode</Label>
                      <p className="text-sm text-gray-500">Enable enhanced privacy protection for EU visitors</p>
                    </div>
                    <Switch
                      id="gdpr_mode"
                      checked={settings.gdpr_mode}
                      onCheckedChange={(checked) => setSettings({ ...settings, gdpr_mode: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto_detect_country" className="text-base font-medium">Auto-Detect Country</Label>
                      <p className="text-sm text-gray-500">Automatically detect visitor location for GDPR compliance</p>
                    </div>
                    <Switch
                      id="auto_detect_country"
                      checked={settings.auto_detect_country}
                      onCheckedChange={(checked) => setSettings({ ...settings, auto_detect_country: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="banner_position">Banner Position</Label>
                    <Select value={settings.banner_position} onValueChange={(value) => setSettings({ ...settings, banner_position: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="center">Center (Modal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="consent_expiry_days">Consent Expiry (Days)</Label>
                    <Input
                      id="consent_expiry_days"
                      type="number"
                      value={settings.consent_expiry_days}
                      onChange={(e) => setSettings({ ...settings, consent_expiry_days: parseInt(e.target.value) })}
                    />
                    <p className="text-sm text-gray-500 mt-1">Number of days before asking for consent again</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="material-elevation-1 border-0">
                <CardHeader>
                  <CardTitle>Banner Content</CardTitle>
                  <CardDescription>Customize the text and buttons on your consent banner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="banner_message">Banner Message</Label>
                    <Textarea
                      id="banner_message"
                      value={settings.banner_message}
                      onChange={(e) => setSettings({ ...settings, banner_message: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accept_all_text">Accept Button Text</Label>
                      <Input
                        id="accept_all_text"
                        value={settings.accept_all_text}
                        onChange={(e) => setSettings({ ...settings, accept_all_text: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reject_all_text">Reject Button Text</Label>
                      <Input
                        id="reject_all_text"
                        value={settings.reject_all_text}
                        onChange={(e) => setSettings({ ...settings, reject_all_text: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manage_preferences_text">Manage Preferences Text</Label>
                      <Input
                        id="manage_preferences_text"
                        value={settings.manage_preferences_text}
                        onChange={(e) => setSettings({ ...settings, manage_preferences_text: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacy_policy_text">Privacy Policy Link Text</Label>
                      <Input
                        id="privacy_policy_text"
                        value={settings.privacy_policy_text}
                        onChange={(e) => setSettings({ ...settings, privacy_policy_text: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                    <Input
                      id="privacy_policy_url"
                      value={settings.privacy_policy_url}
                      onChange={(e) => setSettings({ ...settings, privacy_policy_url: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Cookie Categories
                  </div>
                  <Button onClick={addCategory} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </CardTitle>
                <CardDescription>Define cookie categories and their purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(settings.categories || []).map((category, index) => (
                    <Card key={category.id} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-2 gap-4 flex-1">
                            <div>
                              <Label>Category Name</Label>
                              <Input
                                value={category.name}
                                onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Category ID</Label>
                              <Input
                                value={category.id}
                                onChange={(e) => handleCategoryChange(index, 'id', e.target.value)}
                                disabled={category.required}
                              />
                            </div>
                          </div>
                          {!category.required && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeCategory(index)}
                              className="ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={category.description}
                            onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`required-${index}`}
                              checked={category.required}
                              onCheckedChange={(checked) => handleCategoryChange(index, 'required', checked)}
                              disabled={category.id === 'essential'}
                            />
                            <Label htmlFor={`required-${index}`}>Required</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`default-${index}`}
                              checked={category.default_enabled}
                              onCheckedChange={(checked) => handleCategoryChange(index, 'default_enabled', checked)}
                            />
                            <Label htmlFor={`default-${index}`}>Enabled by Default</Label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <div className="grid gap-6">
              <Card className="material-elevation-1 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analytics Integration
                  </CardTitle>
                  <CardDescription>Connect Google Analytics and Tag Manager with consent management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                    <Input
                      id="google_analytics_id"
                      value={settings.google_analytics_id || ''}
                      onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                      placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                    />
                    <p className="text-sm text-gray-500 mt-1">Analytics will only load after user consent</p>
                  </div>

                  <div>
                    <Label htmlFor="google_tag_manager_id">Google Tag Manager ID</Label>
                    <Input
                      id="google_tag_manager_id"
                      value={settings.google_tag_manager_id || ''}
                      onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                      placeholder="GTM-XXXXXXX"
                    />
                    <p className="text-sm text-gray-500 mt-1">GTM tags will be controlled by consent preferences</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="material-elevation-1 border-0">
                <CardHeader>
                  <CardTitle>Custom Styling</CardTitle>
                  <CardDescription>Add custom CSS to style your consent banner</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="custom_css">Custom CSS</Label>
                    <Textarea
                      id="custom_css"
                      value={settings.custom_css || ''}
                      onChange={(e) => setSettings({ ...settings, custom_css: e.target.value })}
                      rows={10}
                      placeholder=".cookie-banner { background: #000; color: #fff; }"
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Card className="material-elevation-1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Consent Audit Logs
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportConsentLogs} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Switch
                      checked={settings.audit_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, audit_enabled: checked })}
                    />
                  </div>
                </CardTitle>
                <CardDescription>GDPR-compliant audit trail of all consent decisions</CardDescription>
              </CardHeader>
              <CardContent>
                {consentLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Date</th>
                          <th className="text-left p-2">User</th>
                          <th className="text-left p-2">Consent</th>
                          <th className="text-left p-2">Categories</th>
                          <th className="text-left p-2">Country</th>
                          <th className="text-left p-2">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consentLogs.slice(0, 50).map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="p-2">{new Date(log.created_date).toLocaleString()}</td>
                            <td className="p-2">{log.user_id || log.session_id?.substring(0, 8) || 'Unknown'}</td>
                            <td className="p-2">
                              <Badge variant={log.consent_given ? 'default' : 'destructive'}>
                                {log.consent_given ? 'Accepted' : 'Rejected'}
                              </Badge>
                            </td>
                            <td className="p-2">{log.categories_accepted.join(', ')}</td>
                            <td className="p-2">{log.country_code || 'Unknown'}</td>
                            <td className="p-2">{log.consent_method || 'banner'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No consent logs yet</p>
                    <p className="text-sm">Logs will appear here once visitors interact with the consent banner</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
