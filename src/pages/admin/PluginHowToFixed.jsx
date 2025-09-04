import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Code,
  FileCode,
  Play,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  GitBranch,
  Folder,
  Settings,
  Shield,
  Zap,
  Package,
  Globe,
  Database,
  Webhook,
  Book
} from 'lucide-react';
// Simple code block component without external dependencies
const CodeBlock = ({ language, children }) => (
    <pre className="overflow-x-auto">
        <code className="text-sm font-mono text-gray-100">
            {children}
        </code>
    </pre>
);

const PluginHowToFixed = () => {
    const [activeStep, setActiveStep] = useState(0);
    const navigate = useNavigate();

    const steps = [
        {
            title: 'Understand Plugin Architecture',
            description: 'Learn how Catalyst plugins work',
            icon: <Book className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Catalyst plugins extend your store's functionality through a secure, sandboxed environment.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-blue-500 mt-1" />
                            <div>
                                <h4 className="font-semibold">Secure Sandbox</h4>
                                <p className="text-sm text-gray-600">Plugins run in an isolated environment with restricted access</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Package className="w-5 h-5 text-blue-500 mt-1" />
                            <div>
                                <h4 className="font-semibold">Hook System</h4>
                                <p className="text-sm text-gray-600">Inject content at predefined points in your storefront</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Settings className="w-5 h-5 text-blue-500 mt-1" />
                            <div>
                                <h4 className="font-semibold">Configuration Schema</h4>
                                <p className="text-sm text-gray-600">Define customizable settings for store owners</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'Create Plugin Structure',
            description: 'Set up your plugin files',
            icon: <Folder className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Create the following file structure for your plugin:
                    </p>
                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                        <CodeBlock language="bash">
{`my-plugin/
├── manifest.json      # Plugin metadata and configuration
├── index.js          # Main plugin code
├── README.md         # Documentation
└── assets/          # Optional: images, styles
    ├── icon.png
    └── styles.css`}
                        </CodeBlock>
                    </div>
                </div>
            )
        },
        {
            title: 'Write manifest.json',
            description: 'Define plugin metadata',
            icon: <FileCode className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Define your plugin's metadata and configuration:
                    </p>
                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                        <CodeBlock language="json">
{`{
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "description": "Adds custom functionality to your store",
  "author": "Your Name",
  "icon": "assets/icon.png",
  "hooks": {
    "homepage_header": {
      "description": "Displays content in the homepage header",
      "priority": 10
    },
    "product_detail_after_title": {
      "description": "Shows content after product title",
      "priority": 5
    }
  },
  "configSchema": {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "title": "Display Message",
        "default": "Welcome to our store!"
      },
      "backgroundColor": {
        "type": "string",
        "title": "Background Color",
        "default": "#f0f0f0"
      },
      "enabled": {
        "type": "boolean",
        "title": "Enable Plugin",
        "default": true
      }
    }
  },
  "permissions": ["storage", "api"],
  "category": "marketing"
}`}
                        </CodeBlock>
                    </div>
                </div>
            )
        },
        {
            title: 'Implement Plugin Logic',
            description: 'Write your plugin code',
            icon: <Code className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Write your plugin's main functionality:
                    </p>
                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                        <CodeBlock language="javascript">
{`// index.js
class MyPlugin {
  constructor(config, context) {
    this.config = config;
    this.context = context;
  }

  // Hook implementation
  async homepage_header() {
    if (!this.config.enabled) return '';
    
    return \`
      <div style="
        background-color: \${this.config.backgroundColor};
        padding: 20px;
        text-align: center;
        border-radius: 8px;
        margin: 20px 0;
      ">
        <h2>\${this.config.message}</h2>
        <p>Store: \${this.context.store.name}</p>
      </div>
    \`;
  }

  async product_detail_after_title() {
    const product = this.context.product;
    if (!product) return '';
    
    return \`
      <div class="plugin-badge">
        <span>Special Offer on \${product.name}!</span>
      </div>
    \`;
  }

  // API method example
  async getAnalytics() {
    return {
      views: await this.storage.get('views') || 0,
      clicks: await this.storage.get('clicks') || 0
    };
  }

  // Event handler
  async onProductView(product) {
    const views = await this.storage.get('views') || 0;
    await this.storage.set('views', views + 1);
  }
}

// Export the plugin
module.exports = MyPlugin;`}
                        </CodeBlock>
                    </div>
                </div>
            )
        },
        {
            title: 'Test Your Plugin',
            description: 'Use Plugin Builder to test',
            icon: <Play className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Use the Plugin Builder to test your plugin:
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">1</span>
                            <div>
                                <p className="font-medium">Navigate to Plugin Builder</p>
                                <p className="text-sm text-gray-600">Go to Admin → Plugin Builder</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">2</span>
                            <div>
                                <p className="font-medium">Upload or paste your code</p>
                                <p className="text-sm text-gray-600">Use the editor to test your plugin logic</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">3</span>
                            <div>
                                <p className="font-medium">Configure settings</p>
                                <p className="text-sm text-gray-600">Test different configuration values</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">4</span>
                            <div>
                                <p className="font-medium">Preview output</p>
                                <p className="text-sm text-gray-600">See how your plugin renders in different hooks</p>
                            </div>
                        </div>
                    </div>
                    <Button 
                        onClick={() => navigate('/admin/plugin-builder')}
                        className="w-full sm:w-auto"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Open Plugin Builder
                    </Button>
                </div>
            )
        },
        {
            title: 'Deploy Your Plugin',
            description: 'Make your plugin available',
            icon: <GitBranch className="w-5 h-5" />,
            content: (
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Deploy your plugin to make it available:
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <GitBranch className="w-8 h-8 text-blue-500 mb-2" />
                                <CardTitle className="text-lg">GitHub Repository</CardTitle>
                                <CardDescription>Push your plugin to a public GitHub repository</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                                    https://github.com/username/plugin-name
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Package className="w-8 h-8 text-blue-500 mb-2" />
                                <CardTitle className="text-lg">Direct Upload</CardTitle>
                                <CardDescription>Upload ZIP file directly in Plugin Manager</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    Go to Plugins → Install → Upload ZIP
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        }
    ];

    const examplePlugins = [
        {
            name: "Hello World Banner",
            description: "Simple banner that displays a customizable message",
            difficulty: "beginner",
            code: `// Simple banner plugin
class HelloWorldBanner {
  constructor(config) {
    this.config = config;
  }
  
  async homepage_header() {
    return \`
      <div class="hello-banner">
        <h1>\${this.config.message || 'Hello World!'}</h1>
      </div>
    \`;
  }
}`
        },
        {
            name: "Product Badge",
            description: "Adds custom badges to products based on conditions",
            difficulty: "intermediate",
            code: `// Product badge plugin
class ProductBadge {
  async product_card_overlay(product) {
    if (product.price < 50) {
      return '<span class="badge-deal">Great Deal!</span>';
    }
    if (product.isNew) {
      return '<span class="badge-new">New Arrival</span>';
    }
    return '';
  }
}`
        },
        {
            name: "Analytics Tracker",
            description: "Tracks user interactions and stores analytics data",
            difficulty: "advanced",
            code: `// Analytics tracking plugin
class AnalyticsTracker {
  async onPageView(page) {
    const stats = await this.storage.get('stats') || {};
    stats[page] = (stats[page] || 0) + 1;
    await this.storage.set('stats', stats);
    
    // Send to external service
    await this.api.post('/analytics', {
      event: 'pageview',
      page: page,
      timestamp: Date.now()
    });
  }
}`
        }
    ];

    const availableHooks = [
        { name: 'homepage_header', description: 'Top of homepage, below navigation' },
        { name: 'homepage_content', description: 'Main homepage content area' },
        { name: 'product_detail_after_title', description: 'Product page, after product title' },
        { name: 'product_card_overlay', description: 'Product listing card overlay' },
        { name: 'cart_summary_after', description: 'After cart summary section' },
        { name: 'checkout_payment_after', description: 'After payment options in checkout' }
    ];

    const bestPractices = [
        {
            icon: <Shield className="w-5 h-5" />,
            title: "Security First",
            description: "Never include sensitive data or credentials in your plugin code"
        },
        {
            icon: <Zap className="w-5 h-5" />,
            title: "Performance",
            description: "Keep plugins lightweight and optimize for fast loading"
        },
        {
            icon: <Code className="w-5 h-5" />,
            title: "Clean Code",
            description: "Write readable, maintainable code with clear documentation"
        },
        {
            icon: <Webhook className="w-5 h-5" />,
            title: "API Usage",
            description: "Use provided APIs and respect rate limits"
        }
    ];

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-4">Plugin Development Guide</h1>
                <p className="text-gray-600 text-lg">
                    Learn how to create powerful plugins for your Catalyst store
                </p>
            </div>

            <Tabs defaultValue="getting-started" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="getting-started">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Getting Started
                    </TabsTrigger>
                    <TabsTrigger value="examples">
                        <Code className="w-4 h-4 mr-2" />
                        Examples
                    </TabsTrigger>
                    <TabsTrigger value="api">
                        <Webhook className="w-4 h-4 mr-2" />
                        API Reference
                    </TabsTrigger>
                    <TabsTrigger value="best-practices">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Best Practices
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="getting-started" className="space-y-6">
                    <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Quick Start:</strong> Use the Plugin Builder to create and test plugins 
                            without writing code from scratch!
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Steps</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {steps.map((step, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveStep(index)}
                                                className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                    activeStep === index 
                                                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                                                        activeStep === index 
                                                            ? 'bg-blue-500 text-white' 
                                                            : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{step.title}</p>
                                                        <p className="text-sm text-gray-600">{step.description}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        {steps[activeStep].icon}
                                        <div>
                                            <CardTitle>{steps[activeStep].title}</CardTitle>
                                            <CardDescription>{steps[activeStep].description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {steps[activeStep].content}
                                    <div className="flex justify-between mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                            disabled={activeStep === 0}
                                        >
                                            Previous
                                        </Button>
                                        {activeStep < steps.length - 1 ? (
                                            <Button
                                                onClick={() => setActiveStep(activeStep + 1)}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => navigate('/admin/plugin-builder')}
                                            >
                                                Go to Plugin Builder
                                                <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="examples" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Example Plugins</CardTitle>
                            <CardDescription>Learn from these example implementations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {examplePlugins.map((example, index) => (
                                <div key={index} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">{example.name}</h3>
                                        <Badge variant={
                                            example.difficulty === 'beginner' ? 'default' :
                                            example.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                                        }>
                                            {example.difficulty}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-600">{example.description}</p>
                                    <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                        <CodeBlock language="javascript">
                                            {example.code}
                                        </CodeBlock>
                                    </div>
                                    {index < examplePlugins.length - 1 && <Separator />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Hooks</CardTitle>
                            <CardDescription>Hook points where your plugin can inject content</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {availableHooks.map((hook, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                                        <Code className="w-5 h-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-mono font-medium">{hook.name}</p>
                                            <p className="text-sm text-gray-600">{hook.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Context Object</CardTitle>
                            <CardDescription>Data available to your plugin in all hooks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                <CodeBlock language="javascript">
{`// Available in all hooks
context = {
  store: {
    id: 'store-uuid',
    name: 'Store Name',
    domain: 'store.com',
    currency: 'USD'
  },
  user: {
    id: 'user-uuid',
    email: 'user@example.com',
    name: 'John Doe'
  },
  page: {
    type: 'homepage|product|category|cart|checkout',
    url: '/current/page/url',
    params: { /* URL parameters */ }
  },
  product: { /* Product data if on product page */ },
  category: { /* Category data if on category page */ },
  cart: { /* Cart data if available */ }
}`}
                                </CodeBlock>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Storage API</CardTitle>
                                <CardDescription>Persist data for your plugin</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                    <CodeBlock language="javascript">
{`// Store data persistently
await this.storage.set('key', value);
const value = await this.storage.get('key');
await this.storage.delete('key');

// List all keys
const keys = await this.storage.keys();

// Clear all data
await this.storage.clear();`}
                                    </CodeBlock>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>HTTP API</CardTitle>
                                <CardDescription>Make external API calls</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                                    <CodeBlock language="javascript">
{`// Make external API calls
const response = await this.api.get(
  'https://api.example.com/data'
);

const data = await this.api.post(
  'https://api.example.com/submit', 
  {
    body: { key: 'value' },
    headers: { 
      'Authorization': 'Bearer token' 
    }
  }
);`}
                                    </CodeBlock>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="best-practices" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {bestPractices.map((practice, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        {React.cloneElement(practice.icon, { className: 'w-5 h-5 text-blue-500' })}
                                        <CardTitle className="text-lg">{practice.title}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">{practice.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important:</strong> Plugins run in a sandboxed environment with limited 
                            access to system resources. Direct file system access, network sockets, and 
                            process spawning are not allowed for security reasons.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle>Testing Checklist</CardTitle>
                            <CardDescription>Ensure your plugin works correctly</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Test with different configuration values</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Verify HTML output is properly escaped</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Check performance with large datasets</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Handle errors gracefully</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Test on different devices and browsers</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-center gap-4">
                <Button 
                    size="lg"
                    onClick={() => navigate('/admin/plugin-builder')}
                >
                    <Package className="w-4 h-4 mr-2" />
                    Start Building
                </Button>
                <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/admin/plugins')}
                >
                    <Globe className="w-4 h-4 mr-2" />
                    Manage Plugins
                </Button>
            </div>
        </div>
    );
};

export default PluginHowToFixed;