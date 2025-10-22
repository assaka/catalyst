import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SaveButton from '@/components/ui/save-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function SeoHreflang() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState([
    { id: 1, code: 'en-US', url: 'https://example.com' },
    { id: 2, code: 'es-ES', url: 'https://example.es' }
  ]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 500));

    setSaveSuccess(true);
    setSaving(false);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Globe className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Hreflang Tags</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Language Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="enable-hreflang" />
            <Label htmlFor="enable-hreflang">Enable hreflang tags</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-language">Default Language</Label>
            <Select defaultValue="en-US">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                <SelectItem value="fr-FR">French (France)</SelectItem>
                <SelectItem value="de-DE">German (Germany)</SelectItem>
                <SelectItem value="it-IT">Italian (Italy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="x-default" defaultChecked />
            <Label htmlFor="x-default">Include x-default hreflang</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language Code</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">en-US</SelectItem>
                    <SelectItem value="en-GB">en-GB</SelectItem>
                    <SelectItem value="es-ES">es-ES</SelectItem>
                    <SelectItem value="fr-FR">fr-FR</SelectItem>
                    <SelectItem value="de-DE">de-DE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>URL</Label>
                <Input placeholder="https://example.com/lang" />
              </div>
              
              <div className="flex items-end">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <h3 className="font-semibold">Configured Languages</h3>
              {languages.map(lang => (
                <div key={lang.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-mono font-medium">{lang.code}</span>
                    <p className="text-sm text-muted-foreground">{lang.url}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end mt-8">
        <SaveButton
            onClick={handleSave}
            loading={saving}
            success={saveSuccess}
            defaultText="Save Configuration"
        />
      </div>
    </div>
  );
}