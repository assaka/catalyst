import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Tabs, 
    Tab, 
    Button, 
    Alert,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Card,
    CardContent,
    Grid,
    Divider,
    Link,
    Container
} from '@mui/material';
import {
    Code as CodeIcon,
    Storage as StorageIcon,
    Security as SecurityIcon,
    Speed as SpeedIcon,
    Extension as ExtensionIcon,
    CheckCircle as CheckCircleIcon,
    Build as BuildIcon,
    GitHub as GitHubIcon,
    Folder as FolderIcon,
    Settings as SettingsIcon,
    PlayArrow as PlayArrowIcon,
    Description as DescriptionIcon,
    CloudUpload as CloudUploadIcon,
    Store as StoreIcon,
    Api as ApiIcon,
    Lightbulb as LightbulbIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate } from 'react-router-dom';

const PluginHowToFixed = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const navigate = useNavigate();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    const steps = [
        {
            label: 'Understand Plugin Architecture',
            content: (
                <Box>
                    <Typography variant="body1" paragraph>
                        Catalyst plugins extend your store's functionality through a secure, sandboxed environment.
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
                            <ListItemText 
                                primary="Secure Sandbox" 
                                secondary="Plugins run in an isolated environment with restricted access"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><ExtensionIcon color="primary" /></ListItemIcon>
                            <ListItemText 
                                primary="Hook System" 
                                secondary="Inject content at predefined points in your storefront"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon><SettingsIcon color="primary" /></ListItemIcon>
                            <ListItemText 
                                primary="Configuration Schema" 
                                secondary="Define customizable settings for store owners"
                            />
                        </ListItem>
                    </List>
                </Box>
            )
        },
        {
            label: 'Create Plugin Structure',
            content: (
                <Box>
                    <Typography variant="body1" paragraph>
                        Create the following file structure for your plugin:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                        <SyntaxHighlighter language="bash" style={atomDark}>
{`my-plugin/
├── manifest.json      # Plugin metadata and configuration
├── index.js          # Main plugin code
├── README.md         # Documentation
└── assets/          # Optional: images, styles
    ├── icon.png
    └── styles.css`}
                        </SyntaxHighlighter>
                    </Paper>
                </Box>
            )
        },
        {
            label: 'Write manifest.json',
            content: (
                <Box>
                    <Typography variant="body1" paragraph>
                        Define your plugin's metadata and configuration:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                        <SyntaxHighlighter language="json" style={atomDark}>
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
                        </SyntaxHighlighter>
                    </Paper>
                </Box>
            )
        },
        {
            label: 'Implement Plugin Logic',
            content: (
                <Box>
                    <Typography variant="body1" paragraph>
                        Write your plugin's main functionality:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                        <SyntaxHighlighter language="javascript" style={atomDark}>
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
                        </SyntaxHighlighter>
                    </Paper>
                </Box>
            )
        },
        {
            label: 'Test Your Plugin',
            content: (
                <Box>
                    <Typography variant="body1" paragraph>
                        Use the Plugin Builder to test your plugin:
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemText 
                                primary="1. Navigate to Plugin Builder"
                                secondary="Go to Admin → Plugin Builder"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="2. Upload or paste your code"
                                secondary="Use the editor to test your plugin logic"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="3. Configure settings"
                                secondary="Test different configuration values"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="4. Preview output"
                                secondary="See how your plugin renders in different hooks"
                            />
                        </ListItem>
                    </List>
                    <Button 
                        variant="contained" 
                        startIcon={<PlayArrowIcon />}
                        onClick={() => navigate('/admin/plugin-builder')}
                        sx={{ mt: 2 }}
                    >
                        Open Plugin Builder
                    </Button>
                </Box>
            )
        },
        {
            label: 'Deploy Your Plugin',
            content: (
                <Box>
                    <Typography variant="body1" paragraph>
                        Deploy your plugin to make it available:
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <GitHubIcon color="primary" sx={{ mb: 1 }} />
                                    <Typography variant="h6">GitHub Repository</Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Push your plugin to a public GitHub repository
                                    </Typography>
                                    <Typography variant="body2">
                                        Install URL: https://github.com/username/plugin-name
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <CloudUploadIcon color="primary" sx={{ mb: 1 }} />
                                    <Typography variant="h6">Direct Upload</Typography>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                        Upload ZIP file directly in Plugin Manager
                                    </Typography>
                                    <Typography variant="body2">
                                        Go to Plugins → Install → Upload ZIP
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )
        }
    ];

    const examplePlugins = [
        {
            name: "Hello World Banner",
            description: "Simple banner that displays a customizable message",
            difficulty: "Beginner",
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
            difficulty: "Intermediate",
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
            difficulty: "Advanced",
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

    const bestPractices = [
        {
            icon: <SecurityIcon />,
            title: "Security First",
            description: "Never include sensitive data or credentials in your plugin code"
        },
        {
            icon: <SpeedIcon />,
            title: "Performance",
            description: "Keep plugins lightweight and optimize for fast loading"
        },
        {
            icon: <CodeIcon />,
            title: "Clean Code",
            description: "Write readable, maintainable code with clear documentation"
        },
        {
            icon: <ApiIcon />,
            title: "API Usage",
            description: "Use provided APIs and respect rate limits"
        }
    ];

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" gutterBottom>
                        Plugin Development Guide
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Learn how to create powerful plugins for your Catalyst store
                    </Typography>
                </Box>

                <Paper sx={{ mb: 3 }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab label="Getting Started" icon={<LightbulbIcon />} iconPosition="start" />
                        <Tab label="Examples" icon={<CodeIcon />} iconPosition="start" />
                        <Tab label="API Reference" icon={<ApiIcon />} iconPosition="start" />
                        <Tab label="Best Practices" icon={<CheckCircleIcon />} iconPosition="start" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {activeTab === 0 && (
                            <Box>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    <Typography variant="body2">
                                        <strong>Quick Start:</strong> Use the Plugin Builder to create and test plugins 
                                        without writing code from scratch!
                                    </Typography>
                                </Alert>

                                <Stepper activeStep={activeStep} orientation="vertical">
                                    {steps.map((step, index) => (
                                        <Step key={step.label}>
                                            <StepLabel>{step.label}</StepLabel>
                                            <StepContent>
                                                {step.content}
                                                <Box sx={{ mb: 2, mt: 2 }}>
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleNext}
                                                        sx={{ mt: 1, mr: 1 }}
                                                        disabled={index === steps.length - 1}
                                                    >
                                                        {index === steps.length - 1 ? 'Finish' : 'Continue'}
                                                    </Button>
                                                    <Button
                                                        disabled={index === 0}
                                                        onClick={handleBack}
                                                        sx={{ mt: 1, mr: 1 }}
                                                    >
                                                        Back
                                                    </Button>
                                                </Box>
                                            </StepContent>
                                        </Step>
                                    ))}
                                </Stepper>
                                {activeStep === steps.length && (
                                    <Paper square elevation={0} sx={{ p: 3 }}>
                                        <Typography>All steps completed - you're ready to build plugins!</Typography>
                                        <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                                            Reset
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            onClick={() => navigate('/admin/plugin-builder')}
                                            sx={{ mt: 1 }}
                                        >
                                            Go to Plugin Builder
                                        </Button>
                                    </Paper>
                                )}
                            </Box>
                        )}

                        {activeTab === 1 && (
                            <Box>
                                <Typography variant="h5" gutterBottom>
                                    Example Plugins
                                </Typography>
                                <Grid container spacing={3}>
                                    {examplePlugins.map((example, index) => (
                                        <Grid item xs={12} key={index}>
                                            <Card>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <Typography variant="h6">
                                                            {example.name}
                                                        </Typography>
                                                        <Chip 
                                                            label={example.difficulty} 
                                                            size="small"
                                                            color={
                                                                example.difficulty === 'Beginner' ? 'success' :
                                                                example.difficulty === 'Intermediate' ? 'warning' : 'error'
                                                            }
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" paragraph>
                                                        {example.description}
                                                    </Typography>
                                                    <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                                                        <SyntaxHighlighter 
                                                            language="javascript" 
                                                            style={atomDark}
                                                            customStyle={{ margin: 0 }}
                                                        >
                                                            {example.code}
                                                        </SyntaxHighlighter>
                                                    </Paper>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {activeTab === 2 && (
                            <Box>
                                <Typography variant="h5" gutterBottom>
                                    Plugin API Reference
                                </Typography>
                                
                                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                    Available Hooks
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText 
                                            primary="homepage_header"
                                            secondary="Top of homepage, below navigation"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="homepage_content"
                                            secondary="Main homepage content area"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="product_detail_after_title"
                                            secondary="Product page, after product title"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="product_card_overlay"
                                            secondary="Product listing card overlay"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="cart_summary_after"
                                            secondary="After cart summary section"
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText 
                                            primary="checkout_payment_after"
                                            secondary="After payment options in checkout"
                                        />
                                    </ListItem>
                                </List>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Context Object
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                                    <SyntaxHighlighter language="javascript" style={atomDark}>
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
                                    </SyntaxHighlighter>
                                </Paper>

                                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                    Storage API
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                                    <SyntaxHighlighter language="javascript" style={atomDark}>
{`// Store data persistently
await this.storage.set('key', value);
const value = await this.storage.get('key');
await this.storage.delete('key');

// List all keys
const keys = await this.storage.keys();

// Clear all data
await this.storage.clear();`}
                                    </SyntaxHighlighter>
                                </Paper>

                                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                    HTTP API
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.900' }}>
                                    <SyntaxHighlighter language="javascript" style={atomDark}>
{`// Make external API calls
const response = await this.api.get('https://api.example.com/data');
const data = await this.api.post('https://api.example.com/submit', {
  body: { key: 'value' },
  headers: { 'Authorization': 'Bearer token' }
});`}
                                    </SyntaxHighlighter>
                                </Paper>
                            </Box>
                        )}

                        {activeTab === 3 && (
                            <Box>
                                <Typography variant="h5" gutterBottom>
                                    Best Practices
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    {bestPractices.map((practice, index) => (
                                        <Grid item xs={12} sm={6} key={index}>
                                            <Card>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        {React.cloneElement(practice.icon, { 
                                                            sx: { mr: 2 }, 
                                                            color: 'primary' 
                                                        })}
                                                        <Typography variant="h6">
                                                            {practice.title}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {practice.description}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Alert severity="warning" sx={{ mt: 3 }}>
                                    <Typography variant="body2">
                                        <strong>Important:</strong> Plugins run in a sandboxed environment with limited 
                                        access to system resources. Direct file system access, network sockets, and 
                                        process spawning are not allowed for security reasons.
                                    </Typography>
                                </Alert>

                                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                    Testing Checklist
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Test with different configuration values" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Verify HTML output is properly escaped" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Check performance with large datasets" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Handle errors gracefully" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText primary="Test on different devices and browsers" />
                                    </ListItem>
                                </List>
                            </Box>
                        )}
                    </Box>
                </Paper>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button 
                        variant="contained" 
                        size="large"
                        startIcon={<BuildIcon />}
                        onClick={() => navigate('/admin/plugin-builder')}
                        sx={{ mr: 2 }}
                    >
                        Start Building
                    </Button>
                    <Button 
                        variant="outlined" 
                        size="large"
                        startIcon={<StoreIcon />}
                        onClick={() => navigate('/admin/plugins')}
                    >
                        Manage Plugins
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default PluginHowToFixed;