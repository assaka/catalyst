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
  ArrowRight,
  Download,
  Upload,
  Settings,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PluginHowTo() {
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
                  
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">📝 Template:</h4>
                    <p className="text-sm text-gray-700">
                      "I need a plugin that [main functionality] for my [store type] store. 
                      It should [specific features] and integrate with [external services if any]."
                    </p>
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="2"
                title="AI Analysis & Generation"
                description="Our AI analyzes your request and generates the plugin"
                icon={Zap}
              >
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">AI Analyzes:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Plugin type & category</li>
                        <li>• Required features</li>
                        <li>• Database needs</li>
                        <li>• API integrations</li>
                        <li>• UI components</li>
                      </ul>
                    </div>
                    
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
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="3"
                title="Review & Customize"
                description="Preview the generated plugin and make adjustments"
                icon={Eye}
              >
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Review Before Installing</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Check generated features match your needs</li>
                        <li>• Review security permissions</li>
                        <li>• Verify external service integrations</li>
                        <li>• Test in sandbox environment first</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="4"
                title="Install & Test"
                description="Deploy your AI-generated plugin safely"
                icon={PlayCircle}
              >
                <div className="space-y-4">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Try AI Plugin Generator
                  </Button>
                  
                  <div className="text-sm text-gray-600">
                    <p>Your plugin will be automatically tested for:</p>
                    <div className="grid md:grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Security vulnerabilities
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Performance impact
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Code quality
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Compatibility
                      </div>
                    </div>
                  </div>
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

              <StepCard
                number="2"
                title="Choose a Template"
                description="Select from our pre-built templates"
                icon={Code}
              >
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { name: 'Payment Gateway', desc: 'Process payments through external providers', icon: '💳' },
                      { name: 'Analytics', desc: 'Track user behavior and generate insights', icon: '📊' },
                      { name: 'Shipping Provider', desc: 'Calculate shipping rates and create labels', icon: '📦' },
                      { name: 'Marketing Automation', desc: 'Automated email campaigns and segmentation', icon: '📧' },
                      { name: 'Inventory Management', desc: 'Stock tracking and reorder notifications', icon: '📋' },
                      { name: 'Customer Service', desc: 'Help desk and support ticket system', icon: '🎧' }
                    ].map((template, index) => (
                      <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <CodeBlock
                    id="create-template"
                    title="Create from Template"
                    code={`# Create a new plugin from template
npx @catalyst/pdk create my-plugin --template=payment-gateway

# Available templates:
# payment-gateway, analytics, shipping-provider, 
# marketing-automation, inventory-management, customer-service`}
                  />
                </div>
              </StepCard>

              <StepCard
                number="3"
                title="Customize Your Plugin"
                description="Modify the generated code to fit your needs"
                icon={Settings}
              >
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Generated Structure:</h4>
                    <pre className="text-sm text-blue-800">
{`my-plugin/
├── manifest.json          # Plugin metadata
├── index.js              # Main plugin class
├── migrations/           # Database changes
├── components/           # React UI components
├── tests/               # Test files
├── README.md           # Documentation
└── package.json        # Dependencies`}
                    </pre>
                  </div>

                  <CodeBlock
                    id="customize-plugin"
                    title="Example Customization"
                    code={`// index.js - Main plugin class
class MyPaymentPlugin extends Plugin {
  static getMetadata() {
    return {
      name: 'My Payment Gateway',
      slug: 'my-payment',
      version: '1.0.0',
      description: 'Custom payment integration',
      author: 'Your Name'
    };
  }

  async processPayment(orderData) {
    // Your custom payment logic here
    try {
      const result = await this.callPaymentAPI(orderData);
      return { success: true, transactionId: result.id };
    } catch (error) {
      this.log('error', 'Payment failed', error);
      throw error;
    }
  }
}`}
                  />
                </div>
              </StepCard>

              <StepCard
                number="4"
                title="Test & Validate"
                description="Run tests and validate your plugin"
                icon={CheckCircle}
              >
                <CodeBlock
                  id="test-validate"
                  title="Testing Commands"
                  code={`# Run all tests
npm run test

# Validate plugin structure
npx @catalyst/pdk validate

# Start development server with hot reload
npm run dev

# Build for production
npm run build`}
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
                <div className="space-y-4">
                  <CodeBlock
                    id="setup-env"
                    title="Environment Setup"
                    code={`# Clone starter template
git clone https://github.com/catalyst-plugins/starter-template my-custom-plugin
cd my-custom-plugin

# Install dependencies
npm install

# Link to local Catalyst instance for testing
npm link @catalyst/core`}
                  />
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">Prerequisites:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Node.js 18+ and npm</li>
                      <li>• Git for version control</li>
                      <li>• Code editor (VS Code recommended)</li>
                      <li>• Local Catalyst development instance</li>
                    </ul>
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="2"
                title="Create Plugin Manifest"
                description="Define your plugin's metadata and configuration"
                icon={Settings}
              >
                <CodeBlock
                  id="manifest-json"
                  title="manifest.json"
                  code={`{
  "name": "My Custom Plugin",
  "slug": "my-custom-plugin",
  "version": "1.0.0",
  "description": "Detailed description of plugin functionality",
  "author": "Your Name <your.email@example.com>",
  "category": "integration",
  "permissions": {
    "database": ["products", "orders"],
    "api": ["external-service"],
    "filesystem": ["uploads/my-plugin"],
    "hooks": ["order.created", "product.updated"]
  },
  "dependencies": {
    "catalyst": ">=1.0.0",
    "axios": "^1.0.0"
  },
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "description": "API key for external service"
    }
  }
}`}
                />
              </StepCard>

              <StepCard
                number="3"
                title="Implement Plugin Class"
                description="Build your plugin's core functionality"
                icon={Rocket}
              >
                <CodeBlock
                  id="plugin-class"
                  title="index.js - Plugin Implementation"
                  code={`const Plugin = require('@catalyst/plugin-base');

class MyCustomPlugin extends Plugin {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
  }

  static getMetadata() {
    return require('./manifest.json');
  }

  // Lifecycle methods
  async install() {
    console.log('Installing plugin...');
    await this.runMigrations();
    await this.setupExternalService();
    await super.install();
  }

  async enable() {
    console.log('Enabling plugin...');
    await this.registerHooks();
    await this.startServices();
    await super.enable();
  }

  // Custom functionality
  async setupExternalService() {
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
    
    // Test connection
    await this.testAPIConnection();
  }

  async registerHooks() {
    this.pluginManager.registerHook('order.created', 
      async (data) => await this.handleNewOrder(data.order)
    );
  }

  async handleNewOrder(order) {
    try {
      await this.sendToExternalService(order);
      this.log('info', \`Processed order \${order.id}\`);
    } catch (error) {
      this.log('error', 'Failed to process order', error);
    }
  }
}

module.exports = MyCustomPlugin;`}
                />
              </StepCard>

              <StepCard
                number="4"
                title="Add UI Components"
                description="Create admin interfaces and user-facing components"
                icon={Eye}
              >
                <CodeBlock
                  id="ui-component"
                  title="components/Settings.jsx"
                  code={`import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PluginSettings({ config, onSave }) {
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      await fetch('/api/plugins/my-custom-plugin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      alert('Connection successful!');
    } catch (error) {
      alert('Connection failed: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({ apiKey });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          API Key
        </label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handleTest} disabled={testing || !apiKey}>
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={handleSave} disabled={!apiKey}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}`}
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
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Code Quality</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          All tests passing
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Code coverage > 80%
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          No security vulnerabilities
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Performance benchmarks met
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Documentation</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          README.md complete
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          API documentation
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Installation guide
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Configuration examples
                        </div>
                      </div>
                    </div>
                  </div>

                  <CodeBlock
                    id="validate-plugin"
                    title="Final Validation"
                    code={`# Run comprehensive validation
npx @catalyst/pdk validate --strict

# Security scan
npx @catalyst/pdk security-scan

# Performance benchmark
npx @catalyst/pdk benchmark

# Package for distribution
npx @catalyst/pdk package`}
                  />
                </div>
              </StepCard>

              <StepCard
                number="2"
                title="Upload to GitHub"
                description="Create a public repository for your plugin"
                icon={GitBranch}
              >
                <div className="space-y-4">
                  <CodeBlock
                    id="github-setup"
                    title="GitHub Repository Setup"
                    code={`# Initialize git repository
git init
git add .
git commit -m "Initial plugin release"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/your-plugin
git branch -M main
git push -u origin main

# Create release
git tag v1.0.0
git push origin v1.0.0`}
                  />
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Repository Requirements:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Public repository visibility</li>
                      <li>• Valid manifest.json in root</li>
                      <li>• README.md with installation instructions</li>
                      <li>• LICENSE file (MIT recommended)</li>
                      <li>• Tagged releases for versions</li>
                    </ul>
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="3"
                title="Submit to Plugin Store"
                description="Add your plugin to the official Catalyst store"
                icon={Upload}
              >
                <div className="space-y-4">
                  <CodeBlock
                    id="store-submit"
                    title="Plugin Store Submission"
                    code={`# Submit to official store
npx @catalyst/pdk publish --store=official

# Or submit manually through web interface
# https://plugins.catalyst.dev/submit`}
                  />
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Review Process:</h4>
                    <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                      <li>Automated security and quality checks</li>
                      <li>Community beta testing (48 hours)</li>
                      <li>Catalyst team review (2-5 business days)</li>
                      <li>Publication to store</li>
                      <li>Community feedback collection</li>
                    </ol>
                  </div>
                </div>
              </StepCard>

              <StepCard
                number="4"
                title="Monitor & Maintain"
                description="Keep your plugin updated and respond to feedback"
                icon={Settings}
              >
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">📊 Analytics Available:</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Download statistics</li>
                        <li>• Usage analytics</li>
                        <li>• Performance metrics</li>
                        <li>• User feedback & ratings</li>
                        <li>• Error reports</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">🔄 Maintenance Tasks:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Regular security updates</li>
                        <li>• Compatibility with new versions</li>
                        <li>• Bug fixes and improvements</li>
                        <li>• Feature requests from users</li>
                        <li>• Documentation updates</li>
                      </ul>
                    </div>
                  </div>

                  <Button className="bg-green-600 hover:bg-green-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Plugin Analytics Dashboard
                  </Button>
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
              Read Full Documentation
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Users className="w-4 h-4 mr-2" />
              Join Developer Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}