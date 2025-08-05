import React, { useState } from 'react';

// Test the exact same import pattern as PluginHowToFixed
import { 
  Book, 
  Code, 
  Rocket, 
  Shield, 
  Zap, 
  Users, 
  GitBranch,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Terminal,
  Lightbulb,
  Upload,
  Settings,
  Eye
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PluginHowToIconTest() {
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <Zap className="inline w-8 h-8 mr-2 text-purple-600" />
            Plugin Development Guide - Icon Test
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Testing the exact same import pattern as PluginHowToFixed to isolate the issue.
          </p>
        </div>

        {/* Test All Imported Icons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              All Lucide Icons Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              <div className="flex flex-col items-center p-2 border rounded">
                <Book className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs">Book</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Code className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs">Code</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Rocket className="w-6 h-6 text-green-600 mb-1" />
                <span className="text-xs">Rocket</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Shield className="w-6 h-6 text-red-600 mb-1" />
                <span className="text-xs">Shield</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Users className="w-6 h-6 text-purple-600 mb-1" />
                <span className="text-xs">Users</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <GitBranch className="w-6 h-6 text-orange-600 mb-1" />
                <span className="text-xs">GitBranch</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <PlayCircle className="w-6 h-6 text-green-600 mb-1" />
                <span className="text-xs">PlayCircle</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mb-1" />
                <span className="text-xs">AlertTriangle</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <ExternalLink className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs">ExternalLink</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Copy className="w-6 h-6 text-gray-600 mb-1" />
                <span className="text-xs">Copy</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Terminal className="w-6 h-6 text-green-600 mb-1" />
                <span className="text-xs">Terminal</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Lightbulb className="w-6 h-6 text-yellow-600 mb-1" />
                <span className="text-xs">Lightbulb</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Upload className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs">Upload</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Settings className="w-6 h-6 text-gray-600 mb-1" />
                <span className="text-xs">Settings</span>
              </div>
              <div className="flex flex-col items-center p-2 border rounded">
                <Eye className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs">Eye</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Complex Tab Structure */}
        <Tabs defaultValue="ai-generated" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-generated" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI-Generated
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Template-Based
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Custom
            </TabsTrigger>
            <TabsTrigger value="publishing" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Publishing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-generated" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Create Plugins with AI</h2>
              <p className="text-gray-600">
                Describe what you want in plain English, and our AI will generate a complete plugin for you.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Template-Based Development</h2>
              <p className="text-gray-600">
                Start with proven templates and customize them to your specific needs.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Custom Plugin Development</h2>
              <p className="text-gray-600">
                Build advanced plugins with complete control over functionality and design.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="publishing" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Publishing Your Plugin</h2>
              <p className="text-gray-600">
                Share your plugin with the Catalyst community through our plugin store.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-8">
          <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Complex Import Test Results:
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• All 15 Lucide React icons imported successfully ✅</li>
            <li>• Complex multi-line import syntax working ✅</li>
            <li>• Tabs component with icons working ✅</li>
            <li>• All UI components working ✅</li>
          </ul>
          <p className="mt-3 text-sm text-green-700">
            If you can see this page with all icons and tabs working correctly, 
            then the issue with PluginHowToFixed is likely something else - possibly a syntax error or different import issue.
          </p>
        </div>
      </div>
    </div>
  );
}