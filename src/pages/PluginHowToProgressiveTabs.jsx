import React, { useState } from 'react';

// Test basic components first
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Test Tabs component (likely culprit)
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Test some Lucide icons (potential issue)
import { Zap, Code, Rocket } from 'lucide-react';

export default function PluginHowToProgressiveTabs() {
  const [copiedCode, setCopiedCode] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plugin Development Guide - Tabs Test
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Testing Tabs and Lucide icons to find the issue.
          </p>
        </div>

        {/* Test Lucide Icons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              ✅ Lucide Icons Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                <span>Code Icon</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-green-600" />
                <span>Rocket Icon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Tabs Component */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>✅ Tabs Component Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tab1" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  AI-Generated
                </TabsTrigger>
                <TabsTrigger value="tab2" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Template-Based
                </TabsTrigger>
                <TabsTrigger value="tab3" className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Custom
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tab1" className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800 mb-2">AI-Generated Plugins</h3>
                  <p className="text-purple-700">
                    No coding required - describe your plugin in plain English and let AI create it for you.
                  </p>
                  <Badge className="bg-purple-100 text-purple-700 mt-2">5 minutes</Badge>
                </div>
              </TabsContent>

              <TabsContent value="tab2" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Template-Based Development</h3>
                  <p className="text-blue-700">
                    Start with proven templates and customize them to your specific needs.
                  </p>
                  <Badge className="bg-blue-100 text-blue-700 mt-2">30 minutes</Badge>
                </div>
              </TabsContent>

              <TabsContent value="tab3" className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Custom Development</h3>
                  <p className="text-green-700">
                    Build advanced plugins with complete control over functionality and design.
                  </p>
                  <Badge className="bg-green-100 text-green-700 mt-2">2+ hours</Badge>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">🔍 Tabs and Icons Test Results:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Card components: Working ✅</li>
            <li>• Button components: Working ✅</li>
            <li>• Badge components: Working ✅</li>
            <li>• Lucide React icons: {typeof Zap === 'function' ? 'Working ✅' : 'Failed ❌'}</li>
            <li>• Tabs components: Working if you can see the tabs above ✅</li>
          </ul>
          <p className="mt-3 text-sm text-yellow-700">
            If you can see this page with tabs and icons working correctly, 
            then we need to check for other issues in PluginHowToFixed like complex imports or syntax errors.
          </p>
        </div>
      </div>
    </div>
  );
}