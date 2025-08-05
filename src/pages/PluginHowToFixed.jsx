import React, { useState } from 'react';
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

export default function PluginHowToFixed() {
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const CodeBlock = ({ code, language = 'javascript', id, title }) => (
    <div className="relative">
      {title && (
        <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium rounded-t-lg">
          {title}
        </div>
      )}
      <div className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <button
          onClick={() => copyToClipboard(code, id)}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
        >
          {copiedCode === id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre className="text-sm">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );

  const StepCard = ({ number, title, description, icon: Icon, children }) => (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {number}
          </div>
          <Icon className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <p className="text-gray-600 ml-11">{description}</p>
      </CardHeader>
      {children && (
        <CardContent className="ml-11">
          {children}
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Plugin Development Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how to create, test, and publish plugins for Catalyst. 
            From AI-generated plugins to custom development - we've got you covered.
          </p>
        </div>

        {/* Quick Start Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <Zap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
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
              <Code className="w-12 h-12 text-blue-600 mx-auto mb-4" />
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
              <Rocket className="w-12 h-12 text-green-600 mx-auto mb-4" />
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

          {/* AI-Generated Tab */}
          <TabsContent value="ai-generated" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Create Plugins with AI</h2>
              <p className="text-gray-600">
                Describe what you want in plain English, and our AI will generate a complete plugin for you.
              </p>
            </div>

            <div className="space-y-6">
              <StepCard
                number="1"
                title="Describe Your Plugin"
                description="Tell us what you want your plugin to do"
                icon={Lightbulb}
              >
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">💡 Example Ideas:</h4>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li>• "Create a loyalty points system that rewards repeat customers"</li>
                      <li>• "Add SMS notifications when orders are shipped using Twilio"</li>
                      <li>• "Build a wishlist feature with email reminders"</li>
                      <li>• "Create a subscription box management system"</li>
                    </ul>
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="2"
                title="AI Analysis & Generation"
                description="Our AI analyzes your request and generates the plugin"
                icon={Zap}
              >
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">AI Generates:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Complete plugin code</li>
                    <li>• Database migrations</li>
                    <li>• Admin UI components</li>
                    <li>• Configuration options</li>
                    <li>• Test suite</li>
                  </ul>
                </div>
              </StepCard>
            </div>
          </TabsContent>

          {/* Template-Based Tab */}
          <TabsContent value="template" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Template-Based Development</h2>
              <p className="text-gray-600">
                Start with proven templates and customize them to your specific needs.
              </p>
            </div>

            <div className="space-y-6">
              <StepCard
                number="1"
                title="Install Plugin CLI"
                description="Get the Catalyst Plugin Development Kit"
                icon={Terminal}
              >
                <CodeBlock
                  id="install-cli"
                  title="Install CLI"
                  code={`# Install globally
npm install -g @catalyst/pdk

# Or use npx (no installation needed)
npx @catalyst/pdk --version`}
                />
              </StepCard>
            </div>
          </TabsContent>

          {/* Custom Development Tab */}
          <TabsContent value="custom" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Custom Plugin Development</h2>
              <p className="text-gray-600">
                Build advanced plugins with complete control over functionality and design.
              </p>
            </div>

            <div className="space-y-6">
              <StepCard
                number="1"
                title="Set Up Development Environment"
                description="Prepare your development workspace"
                icon={Code}
              >
                <CodeBlock
                  id="setup-env"
                  title="Environment Setup"
                  code={`# Clone starter template
git clone https://github.com/catalyst-plugins/starter-template my-custom-plugin
cd my-custom-plugin

# Install dependencies
npm install`}
                />
              </StepCard>
            </div>
          </TabsContent>

          {/* Publishing Tab */}
          <TabsContent value="publishing" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Publishing Your Plugin</h2>
              <p className="text-gray-600">
                Share your plugin with the Catalyst community through our plugin store.
              </p>
            </div>

            <div className="space-y-6">
              <StepCard
                number="1"
                title="Pre-Publication Checklist"
                description="Ensure your plugin meets quality standards"
                icon={CheckCircle}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    All tests passing
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    No security vulnerabilities
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Documentation complete
                  </div>
                </div>
              </StepCard>
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="text-center mt-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Build Your First Plugin?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of developers building amazing extensions for Catalyst stores. 
            Start with AI generation or dive into custom development.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-white text-blue-600 hover:bg-gray-100">
              <Zap className="w-4 h-4 mr-2" />
              Try AI Plugin Generator
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Book className="w-4 h-4 mr-2" />
              Read Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}