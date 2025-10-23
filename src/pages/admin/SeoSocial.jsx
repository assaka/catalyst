import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Facebook, Twitter, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from '@/components/storefront/StoreProvider';
import { SeoSetting } from '@/api/entities';

export default function SeoSocial() {
  const { store } = useStore();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [settings, setSettings] = useState({
    open_graph_settings: {
      default_image_url: '',
      facebook_app_id: ''
    },
    twitter_card_settings: {
      card_type: 'summary_large_image',
      site_username: ''
    },
    schema_settings: {
      organization_name: '',
      organization_logo_url: '',
      social_profiles: []
    }
  });

  // Social profile input state
  const [newSocialProfile, setNewSocialProfile] = useState('');

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!store?.id) return;

      try {
        setLoading(true);
        const result = await SeoSetting.filter({ store_id: store.id });

        if (result && result.length > 0) {
          const existingSettings = result[0];
          setSettings({
            id: existingSettings.id,
            open_graph_settings: existingSettings.open_graph_settings || {
              default_image_url: '',
              facebook_app_id: ''
            },
            twitter_card_settings: existingSettings.twitter_card_settings || {
              card_type: 'summary_large_image',
              site_username: ''
            },
            schema_settings: existingSettings.schema_settings || {
              organization_name: '',
              organization_logo_url: '',
              social_profiles: []
            }
          });
        }
      } catch (error) {
        console.error('Error loading SEO settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [store?.id]);

  const handleSave = async () => {
    if (!store?.id) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        store_id: store.id,
        open_graph_settings: settings.open_graph_settings,
        twitter_card_settings: settings.twitter_card_settings,
        schema_settings: settings.schema_settings
      };

      if (settings.id) {
        await SeoSetting.update(settings.id, payload);
      } else {
        const created = await SeoSetting.create(payload);
        setSettings({ ...settings, id: created.id });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addSocialProfile = () => {
    if (newSocialProfile.trim()) {
      setSettings({
        ...settings,
        schema_settings: {
          ...settings.schema_settings,
          social_profiles: [...settings.schema_settings.social_profiles, newSocialProfile.trim()]
        }
      });
      setNewSocialProfile('');
    }
  };

  const removeSocialProfile = (index) => {
    setSettings({
      ...settings,
      schema_settings: {
        ...settings.schema_settings,
        social_profiles: settings.schema_settings.social_profiles.filter((_, i) => i !== index)
      }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Share2 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Social Media & Schema</h1>
        </div>
        <p>Loading settings...</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Social Media & Schema</h1>
      </div>

      <Tabs defaultValue="opengraph">
        <TabsList>
          <TabsTrigger value="opengraph">Open Graph</TabsTrigger>
          <TabsTrigger value="twitter">Twitter Card</TabsTrigger>
          <TabsTrigger value="schema">Schema Markup</TabsTrigger>
        </TabsList>

        <TabsContent value="opengraph" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Graph Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og-image">Default OG Image URL</Label>
                <Input
                  id="og-image"
                  placeholder="https://example.com/og-image.jpg"
                  value={settings.open_graph_settings.default_image_url}
                  onChange={(e) => setSettings({
                    ...settings,
                    open_graph_settings: {
                      ...settings.open_graph_settings,
                      default_image_url: e.target.value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Recommended: 1200x630px for optimal display. This will be used as fallback when pages don't have specific OG images.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fb-app-id">Facebook App ID (Optional)</Label>
                <Input
                  id="fb-app-id"
                  placeholder="1234567890"
                  value={settings.open_graph_settings.facebook_app_id}
                  onChange={(e) => setSettings({
                    ...settings,
                    open_graph_settings: {
                      ...settings.open_graph_settings,
                      facebook_app_id: e.target.value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Used for Facebook analytics and insights
                </p>
              </div>

            </CardContent>
          </Card>
          <div className="flex justify-end mt-8">
            <SaveButton
                onClick={handleSave}
                loading={saving}
                success={saveSuccess}
                defaultText="Save Settings"
            />
          </div>

        </TabsContent>

        <TabsContent value="twitter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twitter Card Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twitter-card">Card Type</Label>
                <Select
                  value={settings.twitter_card_settings.card_type}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    twitter_card_settings: {
                      ...settings.twitter_card_settings,
                      card_type: value
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary</SelectItem>
                    <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="player">Player</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter-site">Twitter Site Username</Label>
                <Input
                  id="twitter-site"
                  placeholder="@yourstore"
                  value={settings.twitter_card_settings.site_username}
                  onChange={(e) => setSettings({
                    ...settings,
                    twitter_card_settings: {
                      ...settings.twitter_card_settings,
                      site_username: e.target.value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Your store's Twitter/X handle (with or without @)
                </p>
              </div>

            </CardContent>
          </Card>
          <div className="flex justify-end mt-8">
            <SaveButton
                onClick={handleSave}
                loading={saving}
                success={saveSuccess}
                defaultText="Save Settings"
            />
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schema Markup Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Your Company Name"
                  value={settings.schema_settings.organization_name}
                  onChange={(e) => setSettings({
                    ...settings,
                    schema_settings: {
                      ...settings.schema_settings,
                      organization_name: e.target.value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  Used in structured data markup for search engines
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-logo">Organization Logo URL</Label>
                <Input
                  id="org-logo"
                  placeholder="https://example.com/logo.png"
                  value={settings.schema_settings.organization_logo_url}
                  onChange={(e) => setSettings({
                    ...settings,
                    schema_settings: {
                      ...settings.schema_settings,
                      organization_logo_url: e.target.value
                    }
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  URL to your organization's logo image
                </p>
              </div>

              <div className="space-y-2">
                <Label>Social Media Profiles</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add links to your social media profiles (Facebook, Twitter, Instagram, LinkedIn, etc.)
                </p>

                {settings.schema_settings.social_profiles.map((profile, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <Input value={profile} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeSocialProfile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://facebook.com/yourstore"
                    value={newSocialProfile}
                    onChange={(e) => setNewSocialProfile(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSocialProfile();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addSocialProfile}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
          <div className="flex justify-end mt-8">
            <SaveButton
                onClick={handleSave}
                loading={saving}
                success={saveSuccess}
                defaultText="Save Settings"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}