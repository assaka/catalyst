import React, { useState } from 'react';

// Test imports one by one
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PluginHowToProgressive() {
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plugin Development Guide - Progressive Test
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Testing imports progressively to find the issue.
          </p>
        </div>

        {/* Test Card Component */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>✅ Card Component Works</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The Card, CardHeader, CardTitle, and CardContent components are working.</p>
          </CardContent>
        </Card>

        {/* Test Button Component */}  
        <div className="mb-6">
          <Button 
            onClick={() => alert('Button works!')}
            className="mr-4"
          >
            ✅ Button Works
          </Button>
          
          <Button variant="outline" onClick={() => copyToClipboard('test code', 'test')}>
            {copiedCode === 'test' ? '✅ Copied!' : '📋 Test Copy Function'}
          </Button>
        </div>

        {/* Test Badge Component */}
        <div className="mb-6">
          <Badge className="bg-purple-100 text-purple-700 mr-2">✅ Badge Works</Badge>
          <Badge className="bg-blue-100 text-blue-700 mr-2">5 minutes</Badge>
          <Badge className="bg-green-100 text-green-700">2+ hours</Badge>
        </div>

        {/* Quick Start Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 text-purple-600 mx-auto mb-4">🤖</div>
              <CardTitle>AI-Generated</CardTitle>
              <p className="text-gray-600">No coding required</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Describe your plugin in plain English and let AI create it for you.
              </p>
              <Badge className="bg-purple-100 text-purple-700">5 minutes</Badge>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 text-blue-600 mx-auto mb-4">📋</div>
              <CardTitle>Template-Based</CardTitle>
              <p className="text-gray-600">Guided development</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Start with proven templates and customize to your needs.
              </p>
              <Badge className="bg-blue-100 text-blue-700">30 minutes</Badge>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 text-green-600 mx-auto mb-4">🚀</div>
              <CardTitle>Custom Development</CardTitle>
              <p className="text-gray-600">Full control</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                Build complex plugins with complete customization.
              </p>
              <Badge className="bg-green-100 text-green-700">2+ hours</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">🔍 Progressive Test Results:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Card components: Working ✅</li>
            <li>• Button components: Working ✅</li>
            <li>• Badge components: Working ✅</li>
            <li>• Copy to clipboard: Working ✅</li>
            <li>• Tailwind classes: Working ✅</li>
          </ul>
          <p className="mt-3 text-sm text-yellow-700">
            If you can see this page with all components rendered correctly, 
            then the issue with PluginHowToFixed is likely with the Tabs component or Lucide React icons.
          </p>
        </div>
      </div>
    </div>
  );
}