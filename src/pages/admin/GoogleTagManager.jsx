import React, { useState, useEffect } from 'react';
import { StorePlugin } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import FlashMessage from '@/components/storefront/FlashMessage';
import SaveButton from '@/components/ui/save-button';

export default function GoogleTagManager() {
  const [gtmScript, setGtmScript] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState(null);
  const [plugin, setPlugin] = useState(null);

  useEffect(() => {
    loadGtmSettings();
  }, []);

  const loadGtmSettings = async () => {
    try {
      setLoading(true);
      const plugins = await StorePlugin.filter({ plugin_slug: 'google-tag-manager' });
      if (plugins.length > 0) {
        setPlugin(plugins[0]);
        setGtmScript(plugins[0].configuration?.gtm_script || '');
      } else {
        // This is the case where the plugin hasn't been "created" for the store yet.
        // We can create a placeholder to be saved later.
        setPlugin({ 
          plugin_slug: 'google-tag-manager', 
          is_active: true, 
          configuration: {} 
        });
      }
    } catch (error) {
      console.error('Failed to load GTM settings:', error);
      setFlashMessage({ type: 'error', message: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const config = { gtm_script: gtmScript };
      
      if (plugin && plugin.id) {
        // Update existing plugin configuration
        await StorePlugin.update(plugin.id, { ...plugin, configuration: config });
      } else {
        // Create new plugin record for the store
        await StorePlugin.create({
          plugin_slug: 'google-tag-manager',
          is_active: true,
          configuration: config
        });
      }

      setFlashMessage({ type: 'success', message: 'Google Tag Manager script saved successfully!' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save GTM script:', error);
      setFlashMessage({ type: 'error', message: 'Failed to save GTM script. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Google Tag Manager</h1>
            <p className="text-gray-600 mt-1">Integrate GTM to track analytics and marketing tags.</p>
          </div>
          <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Save Script"
          />
        </div>

        <form id="gtm-form" onSubmit={handleSave}>
          <Card className="material-elevation-1 border-0">
            <CardHeader>
              <CardTitle>GTM Script</CardTitle>
              <CardDescription>
                Paste your full Google Tag Manager container snippet below. It typically consists of two parts, one for the &lt;head&gt; and one for the &lt;body&gt;. Both will be placed correctly on your storefront.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="gtm_script">Container Snippet</Label>
              <Textarea
                id="gtm_script"
                placeholder="<!-- Google Tag Manager --> ..."
                value={gtmScript}
                onChange={(e) => setGtmScript(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </form>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                The script will be automatically added to the &lt;head&gt; section of your storefront pages. Please ensure you are pasting the correct code provided by Google.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}